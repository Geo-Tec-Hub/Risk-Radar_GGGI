/** Normalised shape for FR-5.20: every API failure gets an explicit, typed error state. */
export interface ApiError {
  readonly status: number;
  readonly message: string;
}
