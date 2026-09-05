import { ProfileScope } from './profile.model';

/** Per-cell error, so the report can name row/column/value at once (FR-2.3). */
export interface ImportCellError {
  readonly dsDivision: string;
  readonly parameter: string;
  readonly message: string;
}

export type ImportBatchStatus = 'staged' | 'loaded' | 'failed' | 'rolled_back';

/** `POST /imports` response / `GET /imports/{id}` (§9). Nothing partially loads. */
export interface ImportBatch {
  readonly id: string;
  readonly scope: ProfileScope;
  readonly status: ImportBatchStatus;
  readonly errors: readonly ImportCellError[];
  /** Weights read from the workbook's WEIGHTS tab, for the confirm-weights diff. Advisory only. */
  readonly weightsRead: readonly { indicatorCode: string; weightPct: number }[];
  readonly variablesLackingWeight: readonly string[];
}

/** `GET /imports/{id}/summary` -- FR-2.12 to FR-2.16. */
export interface ImportSummary {
  readonly province: string;
  readonly loaded: number;
  readonly computable: number;
  readonly outstanding: number;
  readonly profilesStillMissingWeights: readonly string[];
}
