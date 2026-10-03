import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiClientService } from '../../core/services/api-client.service';
import { ApiError } from '../../core/models/api-error.model';
import { scopeFromQueryParams, scopeToQueryParams } from '../../core/models/query-param.util';
import { ProfileScope, ProfileVariable, ProfileWeights, WeightConsensus, WeightDecision } from '../../core/models/profile.model';

interface EditableRow {
  readonly indicatorCode: string;
  readonly indicatorName: string;
  unit: string | null;
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

/** A weight of exactly 0 passes isResolved() (it is not null) but the
 * database's own CHECK -- profile_indicator_weight_pct_check, `weight_pct >
 * 0` -- rejects it unconditionally. Nothing client-side caught that before:
 * the domain total still summed to 100 (0 contributes nothing) and every row
 * read as "resolved", so Save stayed enabled and the only sign anything was
 * wrong was a generic "the saved weights violate a schema rule" AFTER
 * clicking Save. A variable that should carry no weight is EXCLUDED
 * (consensus: 'rejected'), never agreed at 0. */
function hasInvalidZeroWeight(row: EditableRow): boolean {
  return row.consensus !== 'rejected' && row.weightPct === 0;
}

/**
 * F4 / DATA_ENTRY_WORKFLOW.md Step 2, updated by CHANGES 2026-08-09 C4/C5/C6:
 *
 * - **C4** -- a blank weight is resolved by *excluding* the variable
 *   (`consensus: 'rejected'`), never by equal-weighting it. Exclusion is a
 *   recorded decision (who, when, optional note), never inferred from the
 *   blank alone.
 * - **C5, relaxed 5 Sep 2026** -- originally this editor offered exclusion
 *   only on the hazard composite-index row. That turned out to be a UI-only
 *   restriction the database never enforced (no CHECK or trigger blocks a
 *   rejected component), and real data already contradicted it: the 3
 *   September panel import excluded DROUGHT_EVENTS_1974_TO_2022, a component,
 *   not the composite index (superseded by a two-way split). The old
 *   restriction meant that once such a row was reconsidered in this editor,
 *   it could never be re-excluded here again -- only reweighted -- which is a
 *   dead end for exactly the case the real data already exercises. Exclusion
 *   is now offered on every hazard row, matching what the backend already
 *   allows.
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
  imports: [FormsModule, RouterLink],
  templateUrl: './weights-editor.component.html',
  styleUrl: './weights-editor.component.scss',
})
export class WeightsEditorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiClientService);

  /** The scope travels on the URL already, so carrying it onward costs nothing
   * and saves the officer re-picking province, sector, subsector and hazard on
   * the next screen -- which is what they were doing before this existed. */
  readonly scopeParams = computed(() => {
    const s = this.scope();
    return s ? { ...scopeToQueryParams(s), from: 'weights' } : {};
  });

  /** Back goes where the user came from: the Coverage page (same province
   * and period) or the Import page (same profile). It always said "Back to
   * Import" before, even when opened from Coverage. */
  readonly back = computed(() => {
    const q = this.route.snapshot.queryParams;
    if (q['from'] === 'coverage') {
      return { link: '/coverage', label: 'Back to Coverage', params: {} as Record<string, string> };
    }
    const s = this.scope();
    return {
      link: '/import',
      label: 'Back to Import',
      params: (s ? { ...scopeToQueryParams(s), from: 'weights' } : {}) as Record<string, string>,
    };
  });

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
  readonly hazardComplete = computed(
    () => this.hazardTotal() === 100 && this.hazardRows().every(isResolved) && !this.hazardRows().some(hasInvalidZeroWeight),
  );
  readonly exposureComplete = computed(
    () => this.exposureTotal() === 100 && this.exposureRows().every(isResolved) && !this.exposureRows().some(hasInvalidZeroWeight),
  );
  readonly canSave = computed(() => this.hazardComplete() && this.exposureComplete());

  /** Named so the block header doesn't read "100 / 100" (implying ready to
   * save) while a blank row is still silently missing from that total --
   * a weightless row contributes 0 and is invisible to includedTotal(). */
  readonly unresolvedHazard = computed(() => this.hazardRows().filter((r) => !isResolved(r)).map((r) => r.indicatorName));
  readonly unresolvedExposure = computed(() => this.exposureRows().filter((r) => !isResolved(r)).map((r) => r.indicatorName));
  readonly unresolvedNames = computed(() => this.unresolvedHazard().concat(this.unresolvedExposure()).join(', '));

  /** Rows typed as exactly 0 -- invalid, see hasInvalidZeroWeight(). Tracked
   * separately from "unresolved" because these rows are NOT blank; the fix
   * is to exclude or re-weight them, not to fill in a first value. */
  readonly zeroWeightHazard = computed(() => this.hazardRows().filter(hasInvalidZeroWeight).map((r) => r.indicatorName));
  readonly zeroWeightExposure = computed(() => this.exposureRows().filter(hasInvalidZeroWeight).map((r) => r.indicatorName));
  readonly zeroWeightNames = computed(() => this.zeroWeightHazard().concat(this.zeroWeightExposure()).join(', '));

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

  /** Variables the admin screen asked to add to this profile, as ?add=A,B.
   * They arrive UNWEIGHTED and therefore unresolved, so the existing "still
   * blank" rule forces the panel to weight or exclude each one before the save
   * button unlocks -- which is the point. Adding a variable is an
   * administrative act; deciding what it is worth is a panel decision, and this
   * keeps the two in their own places while writing one audited version. */
  readonly pendingAdditions = signal<string[]>([]);

  private load(scope: ProfileScope): void {
    this.loading.set(true);
    this.error.set(null);
    const add = String(this.route.snapshot.queryParams['add'] ?? '')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    this.api.getProfileWeights(scope).subscribe({
      next: (weights: ProfileWeights) => {
        this.profileVersion.set(weights.profileVersion);
        const hazard = toEditableRows(weights.hazardVariables);
        const exposure = toEditableRows(weights.exposureVariables);
        const already = new Set(
          hazard.concat(exposure).map((r) => r.indicatorCode),
        );
        const wanted = add.filter((c) => !already.has(c));
        this.hazardRows.set(hazard);
        this.exposureRows.set(exposure);
        this.pendingAdditions.set(wanted);
        if (wanted.length) this.appendAdditions(wanted);
        this.panelNote.set(weights.panelNote ?? '');
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  /** Fetch the catalogue entries for ?add= codes and append them as blank rows.
   * The catalogue is asked for the name, domain and direction rather than the
   * URL carrying them: a link is easy to hand-edit, and a variable that entered
   * a profile under a direction someone typed into a query string would invert
   * a division's score with nothing in the audit trail explaining it. */
  private appendAdditions(codes: string[]): void {
    this.api.getCatalogItems(codes).subscribe({
      next: (items) => {
        const missing = codes.filter((c) => !items.some((i) => i.code === c));
        if (missing.length) {
          this.addNotice.set(
            'Not added — no active variable with code ' + missing.join(', ') + '.',
          );
        }
        const blank = (i: (typeof items)[number]): EditableRow => ({
          indicatorCode: i.code,
          indicatorName: i.name,
          unit: i.unit,
          direction: i.direction === 'higher_is_better' ? '-' : '+',
          isCompositeHazardIndex: false,
          weightPct: null,
          consensus: null,
          consensusNote: null,
          decidedBy: null,
        });
        const hazard = items.filter((i) => i.domain === 'hazard').map(blank);
        const exposure = items.filter((i) => i.domain !== 'hazard').map(blank);
        if (hazard.length) this.hazardRows.set(this.hazardRows().concat(hazard));
        if (exposure.length) this.exposureRows.set(this.exposureRows().concat(exposure));
        if (items.length) {
          this.addNotice.set(
            items.map((i) => i.name).join(', ') +
              ' added to this profile. Give each one a weight (or exclude it), then save — the new version is what carries them.',
          );
        }
      },
      error: (err: ApiError) => this.addNotice.set('Could not load the variables to add: ' + err.message),
    });
  }

  readonly addNotice = signal<string | null>(null);

  /** Template-facing wrapper for hasInvalidZeroWeight() -- see its doc comment. */
  isInvalidZero(row: EditableRow): boolean {
    return hasInvalidZeroWeight(row);
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

  /** True when every row is decided (weighted or excluded) but the weighted
   * ones no longer total 100 -- the state a removal leaves behind. Offered,
   * never applied automatically: the weights are the panel's judgement, so a
   * person presses the button and the save records who did. */
  canRescale(block: 'hazard' | 'exposure'): boolean {
    const rows = block === 'hazard' ? this.hazardRows() : this.exposureRows();
    const weighted = rows.filter((r) => r.consensus !== 'rejected' && (r.weightPct ?? 0) > 0);
    const total = includedTotal(rows);
    return weighted.length > 0 && total !== 100 && rows.every(isResolved);
  }

  /** Proportional rescale of the weighted rows so they total exactly 100
   * (3 dp; the last row takes the rounding remainder). Excluded rows stay
   * excluded and carry no weight. */
  rescaleToHundred(block: 'hazard' | 'exposure'): void {
    if (!this.canRescale(block)) return;
    const rows = block === 'hazard' ? this.hazardRows() : this.exposureRows();
    const weighted = rows.filter((r) => r.consensus !== 'rejected' && (r.weightPct ?? 0) > 0);
    const total = weighted.reduce((s, r) => s + (r.weightPct ?? 0), 0);
    const last = weighted[weighted.length - 1];
    let assigned = 0;
    const updated = rows.map((r) => {
      if (!weighted.includes(r)) return r;
      const value = r === last ? round3(100 - assigned) : round3(((r.weightPct ?? 0) * 100) / total);
      assigned = round3(assigned + value);
      return { ...r, weightPct: value };
    });
    if (block === 'hazard') this.hazardRows.set(updated);
    else this.exposureRows.set(updated);
  }

  // ---- units ----------------------------------------------------------
  /** Which row's unit is being edited (by code), and the draft value. Units
   * are saved straight away and on their own: a unit describes the parameter,
   * so it is not part of the weights save and writes no new profile version. */
  readonly unitEditing = signal<string | null>(null);
  readonly unitEditValue = signal('');
  readonly unitSaving = signal(false);
  readonly unitNotice = signal<string | null>(null);

  editUnit(row: EditableRow): void {
    this.unitNotice.set(null);
    this.unitEditValue.set(row.unit ?? '');
    this.unitEditing.set(row.indicatorCode);
  }

  saveUnit(code: string): void {
    const value = this.unitEditValue().trim();
    this.unitSaving.set(true);
    this.api.setVariableUnit(code, value || null).subscribe({
      next: (saved) => {
        const apply = (rows: EditableRow[]) =>
          rows.map((r) => (r.indicatorCode === code ? { ...r, unit: saved.unit } : r));
        this.hazardRows.set(apply(this.hazardRows()));
        this.exposureRows.set(apply(this.exposureRows()));
        this.unitEditing.set(null);
        this.unitSaving.set(false);
        this.unitNotice.set(
          `Unit for "${saved.name}" ${saved.unit ? 'set to "' + saved.unit + '"' : 'cleared'}. ` +
            'This applies in every province and sector that uses it, and the change is recorded with your name.',
        );
      },
      error: (err: { error?: { detail?: string }; message?: string }) => {
        this.unitSaving.set(false);
        this.unitNotice.set('The unit could not be saved: ' + (err?.error?.detail ?? err?.message ?? 'unknown error'));
      },
    });
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
