import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiError } from '../../core/models/api-error.model';
import { InterestArea, InterestAreaOption, RegistrationType } from '../../core/models/auth.model';
import { PROVINCE_OPTIONS, ProvinceOption } from '../../core/models/reference-data.model';
import { ApiClientService } from '../../core/services/api-client.service';
import { AuthService, REGISTRATION_TYPE_LABEL } from '../../core/services/auth.service';

const TYPES: readonly RegistrationType[] = ['agency', 'expert', 'public'];

/**
 * T2b: POST /auth/register. "type = agency / expert / public, creates
 * pending" -- agency and expert both need a province (SRS §3.2, enforced
 * again server-side regardless of what this form does); public is national.
 *
 * INTEREST AREAS (5 Sep 2026). A province is not a narrow enough scope for
 * someone who writes data: every workbook is specific to a sector and
 * subsector, and since 3 Sep the official track is latest-import-supersedes,
 * so a wrong-sector upload OVERWRITES rather than duplicating. Agency and
 * expert applicants therefore name where they work, and an administrator
 * grants that (or less) at approval.
 *
 * The list is checkboxes, not a multi-select: a multi-select shows only what
 * is highlighted at the moment and hides the rest behind a scrollbar, and this
 * is the one part of the form the applicant is most likely to get wrong.
 *
 * The options come from /reference/interest-areas, NOT /taxonomy. Everything
 * here is validated again server-side; this form failing to stop a bad
 * combination is a nuisance, never a hole.
 */
@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiClientService);
  private readonly router = inject(Router);

  readonly types = TYPES;
  readonly typeLabel = REGISTRATION_TYPE_LABEL;
  readonly provinces: readonly ProvinceOption[] = PROVINCE_OPTIONS;

  readonly email = signal('');
  readonly password = signal('');
  readonly fullName = signal('');
  readonly organization = signal('');
  readonly type = signal<RegistrationType>('public');
  readonly provinceId = signal<number | undefined>(undefined);

  readonly needsProvince = computed(() => this.type() !== 'public');
  /** Same rule as the province, and for the same reason: interest areas say
   * where this person may WRITE, and a community account never writes. */
  readonly needsInterestAreas = this.needsProvince;

  readonly sectorOptions = signal<InterestAreaOption[]>([]);
  readonly optionsError = signal<string | null>(null);

  /** Keys are `SECTOR` for a whole sector and `SECTOR/SUBSECTOR` for one
   * subsector -- the same two shapes the API takes. */
  readonly chosen = signal<ReadonlySet<string>>(new Set());
  readonly hazardDomain = signal(false);

  readonly selectedAreas = computed<InterestArea[]>(() =>
    [...this.chosen()].sort().map((key) => {
      const [sector, subsector] = key.split('/');
      return subsector ? { sector, subsector } : { sector };
    }),
  );

  /** A sector chosen whole AND by subsector. Harmless to the permission check
   * -- the whole-sector grant already answers yes -- but it almost always
   * means a box was ticked by accident, and an admin approving the list as
   * written would grant the whole sector without noticing. The server refuses
   * it; saying so here saves a round trip. */
  readonly redundant = computed(() => {
    const keys = this.chosen();
    return [...keys]
      .filter((k) => k.includes('/') && keys.has(k.split('/')[0]))
      .map((k) => k.split('/')[0]);
  });

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly registeredEmail = signal<string | null>(null);

  readonly canSubmit = computed(() =>
    !!this.email() && this.password().length >= 8 && !!this.fullName()
    && (!this.needsProvince() || this.provinceId() !== undefined)
    && (!this.needsInterestAreas() || this.chosen().size > 0)
    && this.redundant().length === 0,
  );

  constructor() {
    this.api.getInterestAreaOptions().subscribe({
      next: (opts) => this.sectorOptions.set(opts),
      // No hardcoded fallback, for the reason TaxonomyService gives: a list
      // that has drifted from the database is worse than an absent one,
      // because every entry looks valid and the failure only surfaces later.
      error: (err: ApiError) => this.optionsError.set(err.message),
    });
  }

  onTypeChange(value: RegistrationType): void {
    this.type.set(value);
    if (value === 'public') {
      this.provinceId.set(undefined);
      this.chosen.set(new Set());
      this.hazardDomain.set(false);
    }
  }

  key(sector: string, subsector?: string): string {
    return subsector ? `${sector}/${subsector}` : sector;
  }

  isChosen(sector: string, subsector?: string): boolean {
    return this.chosen().has(this.key(sector, subsector));
  }

  toggle(sector: string, subsector?: string): void {
    const next = new Set(this.chosen());
    const k = this.key(sector, subsector);
    if (next.has(k)) next.delete(k); else next.add(k);
    this.chosen.set(next);
  }

  submit(): void {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.error.set(null);

    this.auth.register({
      email: this.email(),
      password: this.password(),
      full_name: this.fullName(),
      organization: this.organization() || undefined,
      type: this.type(),
      province_id: this.needsProvince() ? this.provinceId() : undefined,
      interest_areas: this.needsInterestAreas() ? this.selectedAreas() : [],
      hazard_domain: this.needsInterestAreas() && this.hazardDomain(),
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.registeredEmail.set(this.email());
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.submitting.set(false);
      },
    });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
