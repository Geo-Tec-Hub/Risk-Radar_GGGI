import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ReferenceDataService } from '../../core/services/reference-data.service';
import { Hazard, PROVINCE_OPTIONS } from '../../core/models/reference-data.model';
import { scopeToQueryParams } from '../../core/models/query-param.util';
import { AuthService } from '../../core/services/auth.service';

/**
 * Step 1 of the entry workflow (design/ui/DATA_ENTRY_WORKFLOW.md):
 * "Context first, then the map becomes the worklist." Sector -> subsector
 * (only for sectors that have them) -> hazard -> province -> period
 * resolves to exactly one profile. This screen only resolves that scope and
 * hands it to Weights (Step 2) or Import (Step 3a) via the URL -- it does
 * not itself talk to the catalogue or import APIs.
 *
 * T2b: a data officer or expert is bound to exactly one province (SRS
 * §3.2) -- this screen pre-sets and locks the province field for them so
 * writing can't drift to a province the server will reject anyway
 * (user_role_province_scope). Reading nationally stays open: the lock is
 * only ever applied here, the write-scope selector, never on the map's own
 * province filter.
 */
@Component({
  selector: 'app-profile-context',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile-context.component.html',
  styleUrl: './profile-context.component.scss',
})
export class ProfileContextComponent {
  private readonly referenceData = inject(ReferenceDataService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly sectors = this.referenceData.getSectors();
  readonly hazards = this.referenceData.getHazards();
  readonly provinces = this.referenceData.getProvinces();
  readonly periods = this.referenceData.getPeriods();

  /** A data officer or expert cannot write outside their assigned province
   * (SRS §3.2) -- community/admin/signed-out users are unrestricted here
   * (an admin is deliberately national in scope, per the same rule). */
  readonly provinceLocked = computed(
    () => this.auth.hasRole('data_officer') || this.auth.hasRole('expert'),
  );

  readonly sector = signal<string | undefined>(undefined);
  readonly subsector = signal<string | undefined>(undefined);
  readonly hazard = signal<Hazard | undefined>(undefined);
  readonly province = signal<string | undefined>(this.auth.matchProvinceOption());
  readonly period = signal<string | undefined>(undefined);

  constructor() {
    // AuthService.refreshMe() resolves asynchronously (App's constructor
    // fires it, this component may mount before it settles -- e.g. a direct
    // navigation to /entry on page load) -- re-apply the lock once the
    // account is known rather than relying only on the signal's initial
    // value above, which can miss that race.
    effect(() => {
      if (this.provinceLocked()) {
        const locked = this.auth.matchProvinceOption();
        if (locked) this.province.set(locked);
      }
    });
  }

  readonly subsectorOptions = computed(() => this.sectors.find((s) => s.code === this.sector())?.subsectors ?? []);
  readonly needsSubsector = computed(() => this.subsectorOptions().length > 0);

  readonly resolved = computed(() => {
    const sector = this.sectors.find((s) => s.code === this.sector());
    // The scope the API and encodeProfileScope() expect is the province
    // CODE ('CEN'), not the display name this screen's <select> is bound to
    // ('Central') -- passing the name through uppercased it into 'CENTRAL',
    // which province.code never matches (`unknown province 'CENTRAL'`).
    // Matched case/whitespace-insensitively, same as AuthService.matchProvinceOption():
    // PROVINCES carries 'Northwestern' where PROVINCE_OPTIONS carries 'North
    // Western' (reference-data.model.ts's note on the pre-existing mismatch).
    const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
    const provinceCode = PROVINCE_OPTIONS.find(
      (p) => normalize(p.name) === normalize(this.province() ?? ''),
    )?.code;
    if (!sector || !this.hazard() || !this.province() || !provinceCode || !this.period()) return null;
    if (this.needsSubsector() && !this.subsector()) return null;
    return {
      sectorName: sector.name,
      subsector: this.subsector(),
      hazard: this.hazard()!,
      province: this.province()!,
      provinceCode,
      period: this.period()!,
    };
  });

  onSectorChange(code: string): void {
    this.sector.set(code || undefined);
    this.subsector.set(undefined);
  }

  goToWeights(): void {
    this.navigate('/weights');
  }

  goToImport(): void {
    this.navigate('/import');
  }

  private navigate(path: string): void {
    const r = this.resolved();
    if (!r) return;
    this.router.navigate([path], {
      // `period` is no longer part of a profile scope (SRS §2.5 — periods
      // belong to values and results, not to weights). It still travels as a
      // separate query param for the screens that need it.
      queryParams: {
        ...scopeToQueryParams({
          province: r.provinceCode,
          sector: this.sector()!,
          subsector: r.subsector,
          hazard: r.hazard,
        }),
        period: r.period,
      },
    });
  }
}
