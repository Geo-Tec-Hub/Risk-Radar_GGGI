import { Component, OnInit, computed, effect, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { LAYER_LABEL, MAP_LAYERS, MapLayer } from '../../core/models/map-layer.model';

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
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

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
  /** Which index colours the map. Kept OUT of the query: it changes which
   * column of the same results is drawn, so switching it re-colours the map
   * without asking the server again. */
  readonly layerChange = output<MapLayer>();
  readonly layers = MAP_LAYERS;
  readonly layerLabel = LAYER_LABEL;
  readonly layer = signal<MapLayer>('vulnerability');

  onLayerChange(layer: MapLayer): void {
    this.layer.set(layer);
    this.layerChange.emit(layer);
  }

  /**
   * Sectors narrowed to those with a profile in the SELECTED PROVINCE. A score
   * is provincial and a profile is province-scoped, so a sector that exists
   * only in Central (Inland Fishery) must not be offered in Eastern -- it would
   * 404, and the map would call a permanent absence a transient outage (QA
   * 26 Sep 2026).
   */
  readonly sectors = computed(() => {
    const province = this.province();
    const all = this.taxonomy()?.sectors ?? [];
    if (!province) return all;
    return all.filter((s) =>
      this.availableIn(s.hazards, province) ||
      s.subsectors.some((sub) => this.availableIn(sub.hazards, province)));
  });

  /**
   * Only the hazards a profile exists for, narrowed by the current province,
   * sector and subsector. Offering hazards unconditionally left 15 of 48
   * combinations 404ing (4 Sep QA); the province axis was the same defect one
   * level up and was left open until 26 Sep. The names still come from the
   * flat list; only the SET is narrowed.
   */
  readonly hazards = computed(() => {
    const all = this.taxonomy()?.hazards ?? [];
    const province = this.province();
    if (!province) return all;
    const sector = this.sectors().find((s) => s.code === this.sector());
    if (!sector) return all;
    const sub = sector.subsectors.find((x) => x.code === this.subsector());
    const node = sub ?? sector;
    const allowed = node.hazards
      .filter((ha) => this.availableIn([ha], province))
      .map((ha) => ha.hazard);
    // FAIL OPEN, NOT SHUT. An API that has not been restarted still serves the
    // old taxonomy, which carries no per-province hazard list. Narrowing
    // against a missing list yielded an EMPTY dropdown -- no hazard could be
    // chosen, so no query was ever sent and the map stayed blank with nothing
    // saying why. Offering everything is the previous behaviour: at worst a
    // combination 404s and says so, which is a far better failure than a
    // control that cannot be used.
    if (allowed.length === 0) return all;
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
   * a value (SRS §2.2) and the register matches the official count. The reason
   * used to read a division count from `ReferenceDataService` that nothing ever
   * populated, so it always fell back to the generic sentence below while
   * pretending to compute a number (QA 26 Sep). State the honest reason and say
   * less rather than a number we are not tracking.
   */
  readonly nationalScopeDisabledReason = signal(
    'National index unavailable: it requires a value for every registered DS division, and collection is still under way.',
  );

  readonly subsectorOptions = computed(() => {
    const province = this.province();
    const selected = this.sectors().find((s) => s.code === this.sector());
    const subs = selected?.subsectors ?? [];
    if (!province) return subs;
    return subs.filter((sub) => this.availableIn(sub.hazards, province));
  });

  /** A node offers a profile in `province` if any of its hazards does. */
  private availableIn(
    hazards: readonly { provinces?: readonly string[] }[],
    province: string,
  ): boolean {
    // A hazard entry that carries no province list is from an API that predates
    // the province axis -- treat it as available everywhere (fail open).
    return hazards.some((ha) => !ha.provinces || ha.provinces.length === 0 ||
                              ha.provinces.includes(province));
  }

  /** True once the taxonomy has answered and a full selection can be made. */
  readonly ready = computed(() => this.taxonomy() !== null);

  constructor() {
    // Seed the controls the first time the taxonomy arrives, then emit once.
    // Emitting before it arrives would fire a query with no sector or period,
    // which the API can only reject.
    effect(() => {
      const t = this.taxonomy();
      if (!t || this.sector() !== undefined) return;
      // ?track=expert|community (the sign-in landing for those roles) opens the
      // map on the person's own track, and on their own province, so selecting
      // a division leads straight to the entry form.
      const qp = this.route.snapshot.queryParamMap;
      const askedLayer = qp.get('layer') as MapLayer | null;
      if (askedLayer && MAP_LAYERS.includes(askedLayer)) this.onLayerChange(askedLayer);
      const askedTrack = qp.get('track');
      if (askedTrack && (this.tracks as readonly string[]).includes(askedTrack)) this.track.set(askedTrack);
      const mine = this.auth.currentUser()?.province;
      const norm = (x: string) => x.replace(/\s+/g, '').toLowerCase();
      const own = mine ? t.provinces.find((p) => norm(p.name) === norm(mine))?.code : undefined;
      const askedProvince = qp.get('province') ?? undefined;
      this.province.set(this.province() ?? askedProvince ?? own ?? t.provinces[0]?.code);
      // Seed from the PROVINCE-SCOPED lists, so the initial selection is a
      // combination that actually has a profile in the chosen province.
      this.sector.set(this.sectors()[0]?.code);
      this.subsector.set(this.subsectorOptions()[0]?.code);
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

  /** The province is part of what defines an available profile, so changing it
   * can make the current sector/subsector/hazard impossible (Central has Inland
   * Fishery, Eastern does not). Re-validate the whole selection, then emit. */
  /** Plain label for the track codes the API uses (FR-5.13). */
  trackLabel(t: string): string {
    return t === 'data' ? 'Official' : t === 'expert' ? 'Expert' : 'Community';
  }

  onProvinceChange(code: string): void {
    this.province.set(code || undefined);
    this.keepSelectionValid();
    this.emit();
  }

  private keepSelectionValid(): void {
    if (!this.sectors().some((s) => s.code === this.sector())) {
      this.sector.set(this.sectors()[0]?.code);
    }
    if (!this.subsectorOptions().some((s) => s.code === this.subsector())) {
      this.subsector.set(this.subsectorOptions()[0]?.code);
    }
    this.keepHazardValid();
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
