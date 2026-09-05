/**
 * The filter taxonomy, as served by `GET /api/reference/taxonomy`.
 *
 * WHY THIS REPLACES THE CONSTANTS IN `reference-data.model.ts`.
 * Those literals had to agree with the database and were maintained by hand
 * where nothing could check them. By 3 September 2026 three had drifted:
 *
 *  - subsectors were display names ('Cattle', 'Pig & Sheep', 'Poultry
 *    farming') where the API keys on codes (CATTLE_FARMING,
 *    PIG_AND_SHEEP_FARMING, POULTRY_FARMING), so every livestock filter would
 *    have produced a 404;
 *  - provinces were names with no code, so 'Central' was sent where CEN was
 *    expected;
 *  - PERIODS still read 2020-2025 / 2025-2030, superseded by the Central
 *    panel's 2021-2025 / 2026-2030.
 *
 * Hazards are carried PER SUBSECTOR, not as one flat list. Offering all three
 * everywhere left 15 of 48 combinations 404ing straight from the dropdowns
 * (Coconut + Landslide, every Livestock subsector + Landslide, ...) — found by
 * the 4 Sep QA pass.
 *
 * The SECTORS/PROVINCES/PERIODS constants are kept only as the shape of the
 * SRS §5.3 taxonomy; nothing that talks to the API should read them.
 */

export interface CodeName {
  readonly code: string;
  readonly name: string;
}

export interface SubsectorOption extends CodeName {
  /** Hazard codes a profile actually exists for under this subsector. */
  readonly hazards: readonly string[];
}

export interface SectorOption extends CodeName {
  readonly subsectors: readonly SubsectorOption[];
  /** Hazard codes for the sector as a whole (no subsector selected). */
  readonly hazards: readonly string[];
}

/** Register counts. Never a constant: 330 -> 331 -> 340 inside three weeks. */
export interface DivisionCoverageCounts {
  readonly registered: number;
  readonly withGeometry: number;
  readonly boundaryPending: number;
}

export interface Taxonomy {
  readonly provinces: readonly CodeName[];
  readonly sectors: readonly SectorOption[];
  readonly hazards: readonly CodeName[];
  /** Only periods that actually hold results, so no selection returns an empty map. */
  readonly periods: readonly string[];
  readonly divisionCoverage: DivisionCoverageCounts;
}
