import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';

import { DsDivisionProperties } from '../models/ds-division.model';

/**
 * Serves the DS-division boundaries currently in the register.
 *
 * Stand-in for `GET /tiles/{level}/{z}/{x}/{y}.mvt` (§9, Stage 5.2), which
 * does not exist yet -- there is no backend at all (PROGRESS_TRACKER.md).
 * This loads a single simplified GeoJSON asset instead of vector tiles,
 * which SRS §4.3 explicitly rules out at national scale for the *production*
 * case ("makes the map take tens of seconds to draw"). At ~270KB simplified
 * it is fine for local development; it is not a substitute for FR-5.2 and
 * must be replaced when the tile endpoint lands.
 *
 * **This asset is not the division register and its feature count is not the
 * division count.** It holds shapefile polygons; divisions can be registered
 * before any polygon exists (`boundary_status = 'boundary_pending'`), so its
 * count runs low by an amount that changes over time -- two since the Kalmunai
 * split (O-2, 10 Aug 2026), and more once the divisions in O-12 are registered.
 * Do **not** read
 * `features.length` as the division count, here or in any caller: it will
 * silently read one low forever, and a caller that treats it as authoritative
 * is the exact "absent rendered as present" defect this project has already
 * found once (`FrontEnd/`). Once a real catalogue/division-list endpoint
 * exists (Stage 2+), a division present in the register but absent from this
 * asset must render as *boundary pending* -- not dropped from any list, and
 * not drawn at a guessed location.
 *
 * Geometry only -- no result values. Coverage state is joined client-side
 * in the map component from `ApiClientService.getVulnerability()`, the same
 * way the real tile endpoint joins server-side (SRS §4.3).
 */
@Injectable({ providedIn: 'root' })
export class BoundaryService {
  private readonly http = inject(HttpClient);

  getDsDivisions(): Observable<FeatureCollection<Polygon | MultiPolygon, DsDivisionProperties>> {
    return this.http.get<FeatureCollection<Polygon | MultiPolygon, DsDivisionProperties>>(
      '/data/ds_divisions.simplified.geojson',
    );
  }
}
