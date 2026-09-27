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

/**
 * A hazard, and the provinces a profile actually exists in for it.
 *
 * `hazards` used to be a flat list of hazard codes — the union across every
 * province. That let a province's dropdown offer a combination that only
 * exists elsewhere (Inland Fishery is Central-only; Eastern offered it and
 * `/vulnerability` 404ed). The filter now narrows on the province too.
 */
export interface HazardAvailability {
  readonly hazard: string;
  readonly provinces: readonly string[];
}

export interface SubsectorOption extends CodeName {
  /** Hazards a profile actually exists for under this subsector, per province. */
  readonly hazards: readonly HazardAvailability[];
}

export interface SectorOption extends CodeName {
  readonly subsectors: readonly SubsectorOption[];
  /** Hazards for the sector as a whole (no subsector selected), per province. */
  readonly hazards: readonly HazardAvailability[];
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
  /** Only periods that actually hold RESULTS, so no selection returns an empty
   * map. Right for reading scores, wrong for collecting or reviewing data. */
  readonly periods: readonly string[];
  /** Every period the system COLLECTS for, scored or not. Deriving the list
   * from results is circular the moment a person has to CHOOSE a period in
   * order to enter data for it: 2026-2030 held no results, so it appeared
   * nowhere, so its tab never showed in the import grid, so the data that
   * would have given it results could not be entered. */
  readonly collectionPeriods: readonly string[];
  readonly divisionCoverage: DivisionCoverageCounts;
}
