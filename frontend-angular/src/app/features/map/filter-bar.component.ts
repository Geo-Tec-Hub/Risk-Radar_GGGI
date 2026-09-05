import { Component, OnInit, computed, effect, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReferenceDataService } from '../../core/services/reference-data.service';
import { TaxonomyService } from '../../core/services/taxonomy.service';
import { IndexScope } from '../../core/models/reference-data.model';
import { VulnerabilityQuery } from '../../core/models/vulnerability.model';

/**
 * FR-5.4 (province/sector/subsector/hazard filters), FR-5.5 (track switch),
 * FR-5.18 (period selector). Subsector is a first-class filter, not folded
 * into sector (FR-5.4), so its options are re-derived from the selected
 * sector rather than shown as one flat list.
 *
 * CHANGES 2026-08-09 C2: also carries the provincial/national index-scope
 * control. National is disabled with a stated reason -- the national index
 * requires a value for EVERY registered division (SRS §2.2), and the register
 * is itself incomplete against the official count (SRS §11.3 O-12).
 *
 * The reason string is NOT a literal. It was one, and it went stale twice in
 * five days: it named 330-of-331 and one missing division in Ampara, while the
 * register had already moved to 331 and the official total to 340. A wrong
 * count in a user-facing explanation is worse than no count, because it reads
 * as authoritative. Derive it from the API, and say less when the API has not
 * answered yet. Remove the `disabled` binding, not the option, once the
 * national precondition is actually met.
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss',
})
export class FilterBarComponent implements OnInit {
  private readonly referenceData = inject(ReferenceDataService);
  private readonly taxonomyService = inject(TaxonomyService);

  /**
   * Options come from the API, not from constants. The SRS §5.3 literals had
   * drifted from the database on three axes at once by 3 Sep 2026 - subsector
   * DISPLAY NAMES where the API keys on CODES, provinces with no code, and
   * periods still reading 2020-2025. Each would have produced a 404 that looks
   * to a user like missing data. See core/models/taxonomy.model.ts.
   */
  readonly taxonomy = this.taxonomyService.taxonomy;
  readonly taxonomyError = this.taxonomyService.error;

  readonly queryChange = output<VulnerabilityQuery>();

  readonly sectors = computed(() => this.taxonomy()?.sectors ?? []);

  /**
   * Only the hazards a profile exists for, narrowed by the current sector and
   * subsector. Offering all three unconditionally left 15 of 48 combinations
   * 404ing from these very controls (4 Sep QA). The names still come from the
   * flat list; only the SET is narrowed.
   */
  readonly hazards = computed(() => {
    const all = this.taxonomy()?.hazards ?? [];
    const sector = this.sectors().find((s) => s.code === this.sector());
    if (!sector) return all;
    const sub = sector.subsectors.find((x) => x.code === this.subsector());
    const allowed = sub ? sub.hazards : sector.hazards;
    // FAIL OPEN, NOT SHUT. An API that has not been restarted still serves the
    // old taxonomy, which carries no per-subsector hazard list. Narrowing
    // against a missing list yielded an EMPTY dropdown -- no hazard could be
    // chosen, so no query was ever sent and the map stayed blank with nothing
    // saying why. Offering all three is the previous behaviour: at worst a
    // combination 404s and says so, which is a far better failure than a
    // control that cannot be used.
    if (!allowed || allowed.length === 0) return all;
    const set = new Set(allowed);
    return all.filter((h) => set.has(h.code));
  });
  readonly provinces = computed(() => this.taxonomy()?.provinces ?? []);
  readonly periods = computed(() => this.taxonomy()?.periods ?? []);
  readonly tracks = this.referenceData.getTracks();

  // A score is min-max scaled WITHIN a province (FR-5.24), so "all provinces"
  // is not a view the model can produce. The control therefore always names
  // one province rather than offering an all-provinces option that would have
  // to be refused.
  readonly province = signal<string | undefined>(undefined);
  readonly sector = signal<string | undefined>(undefined);
  readonly subsector = signal<string | undefined>(undefined);
  readonly hazard = signal<string | undefined>(undefined);
  readonly track = signal<string>(this.tracks[0]);
  readonly period = signal<string | undefined>(undefined);
  readonly indexScope = signal<IndexScope>('provincial');

  /**
   * National completeness is unreachable until every registered division holds
   * a value AND the register itself matches the official count (SRS §11.3
   * O-12). Never hardcode either number here -- see the class comment.
   */
  readonly nationalScopeDisabledReason = computed(() => {
    const c = this.referenceData.getDivisionCoverage()();
    if (!c) {
      return 'National index unavailable: it requires a value for every DS division in the official register.';
    }
    const parts = [
      `${c.withValues} of ${c.registered} registered divisions hold a value`,
    ];
    if (c.official !== null && c.official > c.registered) {
      parts.push(
        `and ${c.official - c.registered} division(s) in the official count of ${c.official} are not yet registered`,
      );
    }
    return `National index unavailable: ${parts.join(', ')}.`;
  });

  readonly subsectorOptions = computed(() => {
    const selected = this.sectors().find((s) => s.code === this.sector());
    return selected?.subsectors ?? [];
  });

  /** True once the taxonomy has answered and a full selection can be made. */
  readonly ready = computed(() => this.taxonomy() !== null);

  constructor() {
    // Seed the controls the first time the taxonomy arrives, then emit once.
    // Emitting before it arrives would fire a query with no sector or period,
    // which the API can only reject.
    effect(() => {
      const t = this.taxonomy();
      if (!t || this.sector() !== undefined) return;
      this.province.set(this.province() ?? t.provinces[0]?.code);
      this.sector.set(t.sectors[0]?.code);
      this.subsector.set(t.sectors[0]?.subsectors[0]?.code);
      this.hazard.set(this.hazards()[0]?.code);
      this.period.set(t.periods[0]);
      this.emit();
    });
  }

  ngOnInit(): void {
    this.taxonomyService.load();
  }

  onSectorChange(code: string): void {
    this.sector.set(code || undefined);
    // A subsector belongs to one sector, so carrying the old one over would
    // ask for a profile that cannot exist.
    this.subsector.set(this.subsectorOptions()[0]?.code);
    this.keepHazardValid();
    this.emit();
  }

  onSubsectorChange(code: string): void {
    this.subsector.set(code || undefined);
    this.keepHazardValid();
    this.emit();
  }

  /** The selected hazard may not exist under the new sector/subsector - Tea has
   * no landslide profile. Fall back to the first that does rather than emitting
   * a query the API can only answer with 404. */
  private keepHazardValid(): void {
    const options = this.hazards();
    if (!options.some((h) => h.code === this.hazard())) {
      this.hazard.set(options[0]?.code);
    }
  }

  onFieldChange(): void {
    this.emit();
  }

  private emit(): void {
    if (!this.sector() || !this.hazard() || !this.period() || !this.province()) return;
    this.queryChange.emit({
      province: this.province(),
      sector: this.sector(),
      subsector: this.subsector(),
      hazard: this.hazard() as VulnerabilityQuery['hazard'],
      track: this.track() as VulnerabilityQuery['track'],
      period: this.period(),
      indexScope: this.indexScope(),
    });
  }
}
