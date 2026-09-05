import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ApiError } from '../models/api-error.model';
import { AuthService } from '../services/auth.service';

/**
 * Normalises every failed HTTP call into an {@link ApiError} so components
 * can render the FR-5.20 error state without each one re-parsing
 * HttpErrorResponse. Never swallows the error -- it is rethrown, not caught
 * silently, so a failed call can never look like an empty or stale result.
 *
 * T2b / FR-5.21: a 401 from ANY endpoint means the session the client
 * thought it had is not one the API honours -- clear the signed-in state
 * here, at the one place every request passes through, rather than trusting
 * each caller to remember. A failed login attempt is also a 401 and also
 * clears it, which is harmless: there was nothing signed in to clear.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) auth.clearAuth();
        const apiError: ApiError = {
          status: err.status,
          message: err.status === 0
            ? 'Could not reach the server.'
            : (err.error?.detail ?? err.message ?? `Request failed (${err.status}).`),
        };
        return throwError(() => apiError);
      }
      return throwError(() => err);
    }),
  );
};
