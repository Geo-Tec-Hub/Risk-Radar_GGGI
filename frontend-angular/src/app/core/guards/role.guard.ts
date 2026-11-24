import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { RoleCode } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

/**
 * Like adminGuard, for screens shared by several administrator roles
 * (NOTED-17: provincial and data sharing administrators). A UI convenience
 * only; every API call behind these screens is re-authorised server-side.
 */
export function roleGuard(...roles: RoleCode[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.refreshMe().pipe(
      map(() => (roles.some((r) => auth.hasRole(r)) ? true : router.createUrlTree(['/login']))),
      catchError(() => of(router.createUrlTree(['/login']))),
    );
  };
}
