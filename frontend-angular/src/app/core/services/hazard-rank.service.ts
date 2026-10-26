import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

/** Overall hazard rank per DS division (client shapefiles, Oct 2026).
 *  1 (lowest) - 4 (highest); 0 = no hazard of that kind in the division. */
export interface HazardRankRow {
  readonly p: string;   // province name
  readonly dr: number;  // drought
  readonly fl: number;  // flood
  readonly ls: number;  // landslide
}

/**
 * Serves `/data/geo/hazard_ranks.json`, built from SHP/Hazard by
 * design/spatial/build_geo_assets.py and keyed by the register's DS code.
 * A province absent from the file (Sabaragamuwa until its layer arrives) simply
 * has no rows - the map shows it as unassessed, never as rank 0.
 */
@Injectable({ providedIn: 'root' })
export class HazardRankService {
  private readonly http = inject(HttpClient);
  readonly ranks = signal<Readonly<Record<string, HazardRankRow>> | null>(null);
  readonly error = signal<string | null>(null);
  private started = false;

  load(): void {
    if (this.started) return;
    this.started = true;
    this.http.get<Record<string, HazardRankRow>>('/data/geo/hazard_ranks.json').subscribe({
      next: (r) => this.ranks.set(r),
      error: (e) => this.error.set(e?.message ?? 'Hazard layers could not be loaded.'),
    });
  }
}
