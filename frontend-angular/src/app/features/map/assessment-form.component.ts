import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiClientService } from '../../core/services/api-client.service';
import { AuthService } from '../../core/services/auth.service';
import { withViewTimeout } from '../../core/services/view-request';
import { ApiError } from '../../core/models/api-error.model';
import { AssessmentForm, AssessmentResult, AssessmentVariable } from '../../core/models/assessment.model';
import { VulnerabilityQuery } from '../../core/models/vulnerability.model';

/**
 * Expert / community entry on the map (QA 26 Sep 2026).
 *
 * Replaces "import the same Excel template" for the two non-official tracks:
 * the person has already selected a DS division on the map and a sector /
 * hazard in the filter bar, so all that is left is their own figure for each
 * of that profile's hazard and exposure variables. Saving writes their own
 * track (never the official data) and returns the vulnerability at once --
 * the map then shows it under the expert or community track.
 */
@Component({
  selector: 'app-assessment-form',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './assessment-form.component.html',
  styleUrl: './assessment-form.component.scss',
})
export class AssessmentFormComponent {
  private readonly api = inject(ApiClientService);
  readonly auth = inject(AuthService);

  readonly dsCode = input.required<string>();
  readonly query = input.required<VulnerabilityQuery>();
  readonly saved = output<AssessmentResult>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = signal<AssessmentForm | null>(null);
  readonly values = signal<Record<string, number | null>>({});
  readonly note = signal('');
  readonly saving = signal(false);
  readonly result = signal<AssessmentResult | null>(null);
  readonly saveError = signal<string | null>(null);

  /** How this person assesses: a figure per variable, or the two indexes
   * directly (2 Oct 2026). One way per division -- saving one replaces the
   * other. The raw index and the normalised score are always computed. */
  readonly mode = signal<'parameters' | 'index'>('parameters');
  /** Figures exactly as typed, on the chosen scale. */
  readonly hazardIndex = signal<number | null>(null);
  readonly exposureIndex = signal<number | null>(null);
  /** Top of the rating scale: 4 (experts' 0-4 rating, the default) or 1.
   * Converted linearly to the model's 0-1 scale: 2.5 on 0-4 -> 0.625. */
  readonly indexScale = signal<1 | 4>(4);

  /** Cancelled when a newer form is requested, so a slow earlier one cannot
   * paint the wrong division's variables (QA 26 Sep 2026). */
  private request?: Subscription;

  readonly track = computed(() => this.query().track);
  readonly isEntryTrack = computed(() => this.track() === 'expert' || this.track() === 'community');

  readonly variables = computed<readonly AssessmentVariable[]>(() => {
    const f = this.form();
    return f ? [...f.hazardVariables, ...f.exposureVariables] : [];
  });

  readonly missing = computed(() =>
    this.variables().filter((v) => !this.isNumber(this.values()[v.code])).map((v) => v.code),
  );

  private inScale(v: number | null): boolean {
    return this.isNumber(v) && v >= 0 && v <= this.indexScale();
  }

  /** The 0-1 value the model will use for a typed figure. */
  to01(v: number | null): number | null {
    return this.isNumber(v) ? v / this.indexScale() : null;
  }

  /** Index mode is ready when both indexes are within the chosen scale. */
  readonly indexReady = computed(() => this.inScale(this.hazardIndex()) && this.inScale(this.exposureIndex()));

  /** H x E on the 0-1 scale, as the user types, so they see what will be scored. */
  readonly indexRaw = computed(() =>
    this.indexReady() ? (this.to01(this.hazardIndex()) as number) * (this.to01(this.exposureIndex()) as number) : null,
  );

  readonly canSave = computed(() =>
    this.mode() === 'index' ? this.indexReady() : this.missing().length === 0 && !!this.form()?.weightsComplete,
  );

  readonly anyOfficial = computed(() => this.variables().some((v) => v.officialValue !== null));

  constructor() {
    effect(() => {
      const code = this.dsCode();
      const q = this.query();
      // Re-read when the account changes too: signing in turns the form on.
      this.auth.currentUser();
      if (!this.isEntryTrack()) {
        this.form.set(null);
        return;
      }
      this.load(code, q);
    });
  }

  private load(code: string, q: VulnerabilityQuery): void {
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.saveError.set(null);
    this.request?.unsubscribe();
    this.request = this.api.getAssessmentForm(code, q).pipe(withViewTimeout()).subscribe({
      next: (f) => {
        this.form.set(f);
        const v: Record<string, number | null> = {};
        for (const x of [...f.hazardVariables, ...f.exposureVariables]) v[x.code] = x.myValue;
        this.values.set(v);
        // Reopen on the scale the person used; a first entry starts on 0-4.
        const scale: 1 | 4 = f.myIndexScale === 1 || f.myIndexScale === 4 ? f.myIndexScale : f.myMode === 'index' ? 1 : 4;
        this.indexScale.set(scale);
        this.hazardIndex.set(f.myHazardEntered ?? f.myHazardIndex);
        this.exposureIndex.set(f.myExposureEntered ?? f.myExposureIndex);
        // Open in the way this person last used; index when the weights are
        // unfinished, because parameters cannot be scored without them.
        this.mode.set(f.myMode === 'index' || !f.weightsComplete ? 'index' : 'parameters');
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  isNumber(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v);
  }

  setValue(code: string, raw: unknown): void {
    const n = raw === '' || raw === null || raw === undefined ? null : Number(raw);
    this.values.update((m) => ({ ...m, [code]: n !== null && Number.isFinite(n) ? n : null }));
    this.result.set(null);
  }

  setMode(m: 'parameters' | 'index'): void {
    this.mode.set(m);
    this.result.set(null);
    this.saveError.set(null);
  }

  /** Switching scale converts what is already typed, so the meaning is kept
   * (2.5 on 0-4 becomes 0.625 on 0-1, and back). */
  setScale(raw: unknown): void {
    const next: 1 | 4 = Number(raw) === 1 ? 1 : 4;
    const prev = this.indexScale();
    if (next === prev) return;
    const conv = (v: number | null) => (this.isNumber(v) ? Math.round((v / prev) * next * 1000) / 1000 : v);
    this.hazardIndex.set(conv(this.hazardIndex()));
    this.exposureIndex.set(conv(this.exposureIndex()));
    this.indexScale.set(next);
    this.result.set(null);
  }

  setIndex(which: 'hazard' | 'exposure', raw: unknown): void {
    const n = raw === '' || raw === null || raw === undefined ? null : Number(raw);
    const v = n !== null && Number.isFinite(n) ? n : null;
    (which === 'hazard' ? this.hazardIndex : this.exposureIndex).set(v);
    this.result.set(null);
  }

  /** Start from the official figures -- the expert then changes only what they disagree with. */
  copyOfficial(onlyBlanks: boolean): void {
    this.values.update((m) => {
      const next = { ...m };
      for (const v of this.variables()) {
        if (v.officialValue === null) continue;
        if (onlyBlanks && this.isNumber(next[v.code])) continue;
        next[v.code] = v.officialValue;
      }
      return next;
    });
  }

  submit(): void {
    const f = this.form();
    const q = this.query();
    if (!f || !f.canSubmit || !this.canSave()) return;
    const index = this.mode() === 'index';
    if (!q.province || !q.sector || !q.hazard || !q.period) return;
    this.saving.set(true);
    this.saveError.set(null);
    this.api
      .saveAssessment({
        province: q.province,
        sector: q.sector,
        subsector: q.subsector ?? null,
        hazard: q.hazard,
        period: q.period,
        track: f.track,
        dsCode: f.dsCode,
        mode: this.mode(),
        values: index ? [] : this.variables().map((v) => ({ code: v.code, value: this.values()[v.code] as number })),
        hazardIndex: index ? this.hazardIndex() : null,
        exposureIndex: index ? this.exposureIndex() : null,
        indexScale: this.indexScale(),
        note: this.note().trim() || null,
      })
      .subscribe({
        next: (r) => {
          this.saving.set(false);
          this.result.set(r);
          this.saved.emit(r);
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.saveError.set(err.message);
        },
      });
  }
}
