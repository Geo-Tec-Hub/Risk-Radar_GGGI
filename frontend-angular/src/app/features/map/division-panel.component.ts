import { Component, effect, inject, input, signal } from '@angular/core';

import { ApiClientService } from '../../core/services/api-client.service';
import { ApiError } from '../../core/models/api-error.model';
import { DsDivisionProperties } from '../../core/models/ds-division.model';
import { VulnerabilityComposition, VulnerabilityQuery } from '../../core/models/vulnerability.model';

/**
 * FR-5.9/5.10/5.26: full score composition for the selected division.
 * Identity (name, district, province) comes straight off the clicked
 * boundary feature and always renders. The composition itself depends on
 * `GET /vulnerability/{unit}` (§9), which has no backend behind it yet, so
 * that part shows the FR-5.20 error state rather than pretending to have
 * data.
 */
@Component({
  selector: 'app-division-panel',
  standalone: true,
  templateUrl: './division-panel.component.html',
  styleUrl: './division-panel.component.scss',
})
export class DivisionPanelComponent {
  private readonly api = inject(ApiClientService);

  readonly division = input<DsDivisionProperties | null>(null);
  readonly query = input.required<VulnerabilityQuery>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly composition = signal<VulnerabilityComposition | null>(null);

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

  private loadComposition(dsCode: string, query: VulnerabilityQuery): void {
    this.loading.set(true);
    this.error.set(null);
    this.composition.set(null);
    this.api.getVulnerabilityComposition(dsCode, query).subscribe({
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
