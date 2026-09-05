import { Params } from '@angular/router';

import { ProfileScope } from './profile.model';

/** Shared query-param shape linking the context selector to /weights and /import (F4/F5). */
export function scopeToQueryParams(scope: ProfileScope): Params {
  return {
    province: scope.province,
    sector: scope.sector,
    subsector: scope.subsector ?? null,
    hazard: scope.hazard,
  };
}

export function scopeFromQueryParams(params: Params): ProfileScope | null {
  // `period` is deliberately absent: a profile has no period (SRS §2.5), and
  // carrying it made the encoded scope five segments where the API takes four.
  const { province, sector, hazard, subsector } = params;
  if (!province || !sector || !hazard) return null;
  return { province, sector, hazard, subsector: subsector || undefined };
}
