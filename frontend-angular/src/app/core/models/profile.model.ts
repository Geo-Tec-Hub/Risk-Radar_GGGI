import { Hazard } from './reference-data.model';

/**
 * Resolves Step 1 of the entry workflow (design/ui/DATA_ENTRY_WORKFLOW.md):
 * sector -> subsector -> hazard -> province identifies exactly one profile.
 * Weights and values are set against this scope, not per-track -- "weights are
 * per profile, not per division" (§Step 2).
 *
 * `period` was here and is GONE. A profile has no period: periods belong to
 * indicator values and results (SRS §2.5), and including it implied weights
 * differ by period, which they do not. It also made every request 400 -- the
 * scope arrived as five colon-separated segments where the API accepts four,
 * so the weights editor could not load any profile at all. The backend settled
 * this on 11 Aug (see routers/profiles.py's docstring); this file was never
 * aligned, and the 4 Sep QA pass found the editor had therefore never worked.
 */
export interface ProfileScope {
  readonly province: string;
  readonly sector: string;
  readonly subsector?: string;
  readonly hazard: Hazard;
}

/**
 * Encodes a ProfileScope into the `{scope}` path segment used by
 * `/profiles/{scope}/weights` and `/profiles/{scope}/weights/history` (§9):
 *
 *     province:sector:subsector:hazard      e.g. CEN:AGRICULTURE:PADDY:drought
 *     NAT   for a profile with no province
 *     -     for a profile with no subsector
 *
 * Four segments, and NOT the profile code: save_profile_weights() mints a new
 * code on every save, so a client holding a code holds a pointer to a version
 * a colleague's save has already retired. The scope is what is stable.
 */
export function encodeProfileScope(scope: ProfileScope): string {
  return [scope.province, scope.sector, scope.subsector ?? '-', scope.hazard]
    .map(encodeURIComponent)
    .join(':');
}

/**
 * Whether a variable's membership in the profile has been decided, and how.
 * CHANGES 2026-08-09 C4/C6: a blank weight is never inferred to mean
 * "not significant" -- that has to be a recorded decision. `v_profile_readiness`
 * counts only `agreed` + `contested` variables; a `rejected` one neither
 * carries weight nor blocks the domain from reaching 100. `null` means
 * genuinely undecided -- the state a fresh blank starts in.
 */
export type WeightConsensus = 'agreed' | 'contested' | 'rejected' | null;

/** One row in a profile's hazard or exposure block (DATA_ENTRY_WORKFLOW.md Step 2). */
export interface ProfileVariable {
  readonly indicatorCode: string;
  readonly indicatorName: string;
  readonly unit: string | null;
  readonly domain: 'hazard' | 'exposure';
  /** The catalogue enum, not a '+'/'-' symbol — the symbol is a display
   * convention from the legacy workbooks and would be lossy in the contract.
   * Map it for display at the point of rendering. */
  readonly relationship: 'higher_is_worse' | 'higher_is_better';
  /**
   * Pre-filled from the current version. `null` means undecided -- not yet
   * resolved either by a weight or by exclusion (C4). It is never averaged,
   * defaulted or equal-weighted; `[P-6]`'s equal-weight fallback is
   * superseded and must not be reimplemented anywhere.
   */
  readonly weightPct: number | null;
  readonly consensus: WeightConsensus;
  readonly consensusNote: string | null;
  readonly decidedBy: string | null;
  readonly decidedAt: string | null;
  /**
   * True only for the hazard domain's composite-index row. C5: exclusion is
   * permitted for a blank *only* on this row. A blank on any other
   * (component) row in the hazard domain must hold the profile pending --
   * excluding a component would silently hand the whole domain back to the
   * composite index, reversing [P-5].
   */
  readonly isCompositeIndex: boolean;
}

/** `GET /profiles/{scope}/weights` (§9). */
/** Per-domain totals, stated so the client never has to work out why a domain
 * of nine variables sums over six of them. */
export interface DomainTotal {
  readonly domain: 'hazard' | 'exposure';
  readonly total: number;
  readonly counted: number;
  readonly excluded: number;
  readonly undecided: number;
}

export interface ProfileWeights {
  /** The encoded scope string the request was made with, echoed back. */
  readonly scope: string;
  readonly profileId: number;
  readonly code: string;
  readonly profileVersion: number;
  readonly publication: string;
  readonly owner: string | null;
  readonly derivedFrom: string | null;
  readonly panelNote: string | null;
  readonly isComputable: boolean;
  readonly totals: readonly DomainTotal[];
  readonly hazardVariables: readonly ProfileVariable[];
  readonly exposureVariables: readonly ProfileVariable[];
}

/**
 * One variable's resolved decision as submitted on save (C4/C6): either a
 * weight with `consensus: 'agreed'` (or `'contested'`), or an exclusion --
 * `weightPct: null` with `consensus: 'rejected'` -- but never a blank with
 * no consensus. The save API must reject a domain that reaches 100 only by
 * counting a `rejected` row.
 */
export interface WeightDecision {
  readonly indicatorCode: string;
  readonly weightPct: number | null;
  readonly consensus: 'agreed' | 'contested' | 'rejected';
  readonly consensusNote?: string;
  /** Who declared it -- there is no auth yet (Stage 9), so this is a free-text name for now. */
  readonly decidedBy: string;
}

/** `PUT /profiles/{scope}/weights` (§9) -- each save is a new version, none edited in place. */
export interface SaveWeightsPayload {
  readonly hazardVariables: readonly WeightDecision[];
  readonly exposureVariables: readonly WeightDecision[];
  readonly panelNote?: string;
}

export interface ProfileWeightsVersion {
  readonly version: number;
  readonly savedAt: string;
  readonly savedBy: string;
  readonly panelNote: string | null;
}
