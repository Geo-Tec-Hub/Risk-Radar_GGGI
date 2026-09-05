import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Guards /admin/registrations (T2b). This is a UI convenience only -- the
 * real control is server-side (require_admin on every /admin/* route,
 * FR-12.8: hiding an action in the UI is never the only control). Its job
 * is just to avoid rendering an admin screen for someone whose subsequent
 * API calls will all 403 anyway.
 *
 * Always re-checks with the server (refreshMe()) rather than trusting a
 * possibly-stale currentUser signal, so a revoked admin session cannot
 * still see this screen simply because the tab was already open.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.refreshMe().pipe(
    map(() => {
      if (auth.hasRole('admin')) return true;
      return router.createUrlTree(['/login']);
    }),
    // refreshMe() rethrows a 401 (see AuthService.refreshMe) after already
    // clearing currentUser -- a guard observable that errors fails the
    // navigation outright rather than redirecting, so catch it here too.
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
