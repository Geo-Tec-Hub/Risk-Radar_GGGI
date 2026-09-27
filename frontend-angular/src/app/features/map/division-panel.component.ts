import { Component, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';

import { ApiClientService } from '../../core/services/api-client.service';
import { withViewTimeout } from '../../core/services/view-request';
import { ApiError } from '../../core/models/api-error.model';
import { DsDivisionProperties } from '../../core/models/ds-division.model';
import { VulnerabilityComposition, VulnerabilityQuery } from '../../core/models/vulnerability.model';
import { AssessmentResult } from '../../core/models/assessment.model';
import { AuthService } from '../../core/services/auth.service';
import { AssessmentFormComponent } from './assessment-form.component';

/**
 * FR-5.9/5.10/5.26: full score composition for the selected division.
 * Identity (name, district, province) comes straight off the clicked
 * boundary feature and always renders. The composition itself depends on
 * `GET /vulnerability/{unit}` (§9, `backend/app/routers/vulnerability.py`
 * `composition()`), built 2026-09-18 -- previously stubbed, always 404.
 */
@Component({
  selector: 'app-division-panel',
  standalone: true,
  imports: [DatePipe, DecimalPipe, AssessmentFormComponent],
  templateUrl: './division-panel.component.html',
  styleUrl: './division-panel.component.scss',
})
export class DivisionPanelComponent {
  private readonly api = inject(ApiClientService);
  readonly auth = inject(AuthService);

  /** Fired after an expert/community assessment is saved, so the map re-reads. */
  readonly assessmentSaved = output<AssessmentResult>();

  readonly division = input<DsDivisionProperties | null>(null);
  readonly query = input.required<VulnerabilityQuery>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly composition = signal<VulnerabilityComposition | null>(null);

  /** Cancelled when a newer composition is requested, so a slow earlier one
   * cannot overwrite a later selection's panel (QA 26 Sep 2026). */
  private request?: Subscription;

  constructor() {
    effect(() => {
      const division = this.division();
      const query = this.query();
      if (!division) {
        this.composition.set(null);
        this.error.set(null);
        return;
      }
      this.loadComposition(division.ds_code, query);
    });
  }

  onAssessmentSaved(result: AssessmentResult): void {
    const division = this.division();
    if (division) this.loadComposition(division.ds_code, this.query(), true);
    this.assessmentSaved.emit(result);
  }

  /** Who could add their own figures here if they switched the Track filter. */
  canContribute(): 'expert' | 'community' | null {
    if (this.auth.hasRole('expert')) return 'expert';
    if (this.auth.hasRole('community')) return 'community';
    return null;
  }

  /** Plain label for the track codes the API uses (FR-5.13, FR-5.10). */
  trackLabel(track: string): string {
    return track === 'data' ? 'Official' : track === 'expert' ? 'Expert' : 'Community';
  }

  private loadComposition(dsCode: string, query: VulnerabilityQuery, quiet = false): void {
    // `quiet` keeps the panel (and the entry form inside it) on screen while a
    // saved assessment is re-read, instead of blanking it to "Loading".
    if (!quiet) {
      this.loading.set(true);
      this.composition.set(null);
    }
    this.error.set(null);
    this.request?.unsubscribe();
    this.request = this.api.getVulnerabilityComposition(dsCode, query)
      .pipe(withViewTimeout())
      .subscribe({
      next: (composition) => {
        this.composition.set(composition);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
