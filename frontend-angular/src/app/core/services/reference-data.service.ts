import { Injectable, Signal, signal } from '@angular/core';

import {
  DivisionCoverage,
  HAZARDS,
  Hazard,
  PERIODS,
  PROVINCES,
  SECTORS,
  Sector,
  TRACKS,
  Track,
} from '../models/reference-data.model';

/**
 * Serves the sector / subsector / hazard / province taxonomy for the filter
 * controls. Backed by the SRS §5.3 constants today; swap the bodies below
 * for `GET /catalogue/indicators` + `GET /catalogue/nap` (§9) once Stage 2
 * exists -- the taxonomy is stable enough that the *contract* (return
 * types) shouldn't need to change when that happens.
 */
@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  getSectors(): readonly Sector[] {
    return SECTORS;
  }

  getHazards(): readonly Hazard[] {
    return HAZARDS;
  }

  getProvinces(): readonly string[] {
    return PROVINCES;
  }

  getTracks(): readonly Track[] {
    return TRACKS;
  }

  getPeriods(): readonly string[] {
    return PERIODS;
  }

  /**
   * The DS-division counts, read from the API -- NEVER a constant.
   *
   * There is deliberately no fallback value here. A wrong division count is
   * worse than an absent one: it is reported to users as authoritative, it
   * feeds the coverage denominator, and it has already gone stale twice
   * (330 -> 331 on 10 Aug via the Kalmunai split, and the official total is
   * now reported as 340 with nine divisions unregistered -- SRS §11.3 O-2 and
   * O-12). Callers must handle `null` by saying less, not by guessing.
   *
   * `null` until `GET /reference/division-coverage` exists (Stage 2) and has
   * answered.
   */
  getDivisionCoverage(): Signal<DivisionCoverage | null> {
    return this.divisionCoverage.asReadonly();
  }

  /** Set once the API answers; see `getDivisionCoverage`. */
  setDivisionCoverage(coverage: DivisionCoverage | null): void {
    this.divisionCoverage.set(coverage);
  }

  private readonly divisionCoverage = signal<DivisionCoverage | null>(null);
}
