import { Observable, OperatorFunction, TimeoutError, catchError, throwError, timeout } from 'rxjs';

import { ApiError } from '../models/api-error.model';

/**
 * A per-VIEW timeout (FR-5.22), applied only to the read requests that feed a
 * screen. It is deliberately NOT in the api-error interceptor: imports and
 * recomputes legitimately run long, and a global timeout would abort them
 * (QA 26 Sep 2026). Apply it at the call sites that paint a view -- the map
 * results, the score-composition panel, the entry form, the filter taxonomy.
 */
export const VIEW_TIMEOUT_MS = 20_000;

/** Convert an rxjs timeout into the ApiError shape every view already renders. */
export function withViewTimeout<T>(): OperatorFunction<T, T> {
  return (source: Observable<T>) =>
    source.pipe(
      timeout(VIEW_TIMEOUT_MS),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              ({ status: 0, message: 'The request timed out. Please try again.' }) as ApiError,
          );
        }
        return throwError(() => err);
      }),
    );
}
