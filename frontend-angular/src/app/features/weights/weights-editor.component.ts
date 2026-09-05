import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ApiClientService } from '../../core/services/api-client.service';
import { ApiError } from '../../core/models/api-error.model';
import { scopeFromQueryParams } from '../../core/models/query-param.util';
import { ProfileScope, ProfileVariable, ProfileWeights, WeightConsensus, WeightDecision } from '../../core/models/profile.model';

interface EditableRow {
  readonly indicatorCode: string;
  readonly indicatorName: string;
  readonly unit: string | null;
  /** Display symbol, derived from the catalogue enum at the boundary. The API
   * carries `relationship`; '+'/'-' is the legacy workbooks' shorthand and
   * belongs in the view, not in the contract. */
  readonly direction: '+' | '-';
  readonly isCompositeHazardIndex: boolean;
  weightPct: number | null;
  consensus: WeightConsensus;
  consensusNote: string | null;
  decidedBy: string | null;
}

function toEditableRows(vars: readonly ProfileVariable[] | undefined): EditableRow[] {
  // Defensive against undefined: this component crashed on `.map()` for weeks
  // because the response shape did not match and nothing here checked (4 Sep
  // QA). The shapes agree now; the guard costs nothing and turns a future
  // mismatch into an empty table rather than a blank page.
  return (vars ?? []).map((v) => ({
    indicatorCode: v.indicatorCode,
    indicatorName: v.indicatorName,
    unit: v.unit,
    direction: v.relationship === 'higher_is_better' ? '-' : '+',
    isCompositeHazardIndex: v.isCompositeIndex,
    weightPct: v.weightPct,
    consensus: v.consensus,
    consensusNote: v.consensusNote,
    decidedBy: v.decidedBy,
  }));
}

/** Rounds to 3dp -- FR-3.3: weights are exact decimals to three places, no tolerance applied. */
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** A row counts toward the domain total only if it was agreed/contested -- a rejected row contributes nothing (C4). */
function includedTotal(rows: readonly EditableRow[]): number {
  return round3(rows.reduce((sum, r) => sum + (r.consensus !== 'rejected' ? (r.weightPct ?? 0) : 0), 0));
}

/** Resolved = excluded, or weighted. Never a bare blank (C4/C6: a blank is never inferred, only decided). */
function isResolved(row: EditableRow): boolean {
  return row.consensus === 'rejected' || row.weightPct !== null;
}

/**
 * F4 / DATA_ENTRY_WORKFLOW.md Step 2, updated by CHANGES 2026-08-09 C4/C5/C6:
 *
 * - **C4** -- a blank weight is resolved by *excluding* the variable
 *   (`consensus: 'rejected'`), never by equal-weighting it. Exclusion is a
 *   recorded decision (who, when, optional note), never inferred from the
 *   blank alone.
 * - **C5** -- in the hazard domain, exclusion is offered only on the
 *   composite-index row. A blank *component* row holds the profile instead;
 *   no exclude action is offered for it at all.
 * - **C6** -- the accepted set is declared by the data-entering user, not by
 *   a vote tally. `decidedBy` is a free-text name for now (there is no auth
 *   yet -- Stage 9).
 *
 * Depends entirely on `GET /profiles/{scope}/weights` (§9), which has no
 * backend yet -- this will show the FR-5.20 error state until Stage 2
 * exists. The form logic below is real and ready for that day, not a mock.
 */
@Component({
  selector: 'app-weights-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './weights-editor.component.html',
  styleUrl: './weights-editor.component.scss',
})
export class WeightsEditorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiClientService);

  readonly scope = signal<ProfileScope | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly profileVersion = signal<number | null>(null);

  readonly hazardRows = signal<EditableRow[]>([]);
  readonly exposureRows = signal<EditableRow[]>([]);
  readonly panelNote = signal('');

  /** Shared across every exclude action in this session -- see class doc on C6. */
  readonly decidedByName = signal('');

  readonly hazardTotal = computed(() => includedTotal(this.hazardRows()));
  readonly exposureTotal = computed(() => includedTotal(this.exposureRows()));
  readonly hazardComplete = computed(() => this.hazardTotal() === 100 && this.hazardRows().every(isResolved));
  readonly exposureComplete = computed(() => this.exposureTotal() === 100 && this.exposureRows().every(isResolved));
  readonly canSave = computed(() => this.hazardComplete() && this.exposureComplete());

  /** True while any blank hazard *component* row exists -- C5: the profile holds, no exclusion offered. */
  readonly hazardHeldPendingComponents = computed(() =>
    this.hazardRows().some((r) => !r.isCompositeHazardIndex && !isResolved(r)),
  );

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly savedVersion = signal<number | null>(null);

  constructor() {
    const scope = scopeFromQueryParams(this.route.snapshot.queryParams);
    this.scope.set(scope);
    if (scope) {
      this.load(scope);
    } else {
      this.loading.set(false);
      this.error.set('No profile selected. Go back and choose province, sector, subsector and hazard.');
    }
  }

  private load(scope: ProfileScope): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getProfileWeights(scope).subscribe({
      next: (weights: ProfileWeights) => {
        this.profileVersion.set(weights.profileVersion);
        this.hazardRows.set(toEditableRows(weights.hazardVariables));
        this.exposureRows.set(toEditableRows(weights.exposureVariables));
        this.panelNote.set(weights.panelNote ?? '');
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  /** May the exclude action be offered for this row? (C5: hazard components never get it.) */
  canExclude(block: 'hazard' | 'exposure', row: EditableRow): boolean {
    return block === 'exposure' || !!row.isCompositeHazardIndex;
  }

  /** FR-3.4: helps the user reach 100 rather than loosening the rule. Splits the shortfall evenly across undecided rows only -- never across excluded ones. */
  distributeRemaining(block: 'hazard' | 'exposure'): void {
    const rows = block === 'hazard' ? this.hazardRows() : this.exposureRows();
    const undecided = rows.filter((r) => r.consensus === null && r.weightPct === null);
    if (undecided.length === 0) return;

    const alreadyAssigned = includedTotal(rows);
    const remaining = round3(100 - alreadyAssigned);
    const share = round3(remaining / undecided.length);

    let assignedSoFar = 0;
    const updated = rows.map((r) => {
      if (r.consensus !== null || r.weightPct !== null) return r;
      const isLast = undecided.indexOf(r) === undecided.length - 1;
      const value = isLast ? round3(remaining - assignedSoFar) : share;
      assignedSoFar = round3(assignedSoFar + value);
      return { ...r, weightPct: value, consensus: 'agreed' as const };
    });

    if (block === 'hazard') this.hazardRows.set(updated);
    else this.exposureRows.set(updated);
  }

  updateWeight(block: 'hazard' | 'exposure', code: string, value: number | null): void {
    const setter = block === 'hazard' ? this.hazardRows : this.exposureRows;
    setter.update((rows) =>
      rows.map((r) =>
        r.indicatorCode === code
          ? { ...r, weightPct: value, consensus: value === null ? null : ('agreed' as const) }
          : r,
      ),
    );
  }

  updateNote(block: 'hazard' | 'exposure', code: string, note: string): void {
    const setter = block === 'hazard' ? this.hazardRows : this.exposureRows;
    setter.update((rows) => rows.map((r) => (r.indicatorCode === code ? { ...r, consensusNote: note || null } : r)));
  }

  exclude(block: 'hazard' | 'exposure', code: string): void {
    const name = this.decidedByName().trim();
    if (!name) return;
    const setter = block === 'hazard' ? this.hazardRows : this.exposureRows;
    setter.update((rows) =>
      rows.map((r) => (r.indicatorCode === code ? { ...r, weightPct: null, consensus: 'rejected', decidedBy: name } : r)),
    );
  }

  /** Reverses an exclude -- back to undecided. Nothing here is a permanent block. */
  reconsider(block: 'hazard' | 'exposure', code: string): void {
    const setter = block === 'hazard' ? this.hazardRows : this.exposureRows;
    setter.update((rows) =>
      rows.map((r) =>
        r.indicatorCode === code ? { ...r, weightPct: null, consensus: null, consensusNote: null, decidedBy: null } : r,
      ),
    );
  }

  private toDecisions(rows: readonly EditableRow[]): WeightDecision[] {
    return rows.map((r) => ({
      indicatorCode: r.indicatorCode,
      weightPct: r.weightPct,
      consensus: r.consensus as 'agreed' | 'contested' | 'rejected',
      consensusNote: r.consensusNote ?? undefined,
      decidedBy: r.decidedBy ?? this.decidedByName().trim(),
    }));
  }

  save(): void {
    const scope = this.scope();
    if (!scope || !this.canSave()) return;

    this.saving.set(true);
    this.saveError.set(null);
    this.savedVersion.set(null);

    this.api
      .saveProfileWeights(scope, {
        hazardVariables: this.toDecisions(this.hazardRows()),
        exposureVariables: this.toDecisions(this.exposureRows()),
        panelNote: this.panelNote() || undefined,
      })
      .subscribe({
        next: (weights) => {
          this.profileVersion.set(weights.profileVersion);
          this.savedVersion.set(weights.profileVersion);
          this.saving.set(false);
        },
        error: (err: ApiError) => {
          this.saveError.set(err.message);
          this.saving.set(false);
        },
      });
  }
}
