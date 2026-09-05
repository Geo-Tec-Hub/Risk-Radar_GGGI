/**
 * Static reference data for the sector / subsector / hazard / province
 * taxonomy (SRS §5.3). These are catalogue rows, not schema, and are stable
 * enough to ship as constants for the filter controls until
 * `GET /catalogue/indicators` (§9) is backed by a running API -- see
 * ReferenceDataService.
 */

export type Hazard = 'drought' | 'flood' | 'landslide';

export const HAZARDS: readonly Hazard[] = ['drought', 'flood', 'landslide'];

export interface Sector {
  readonly code: string;
  readonly name: string;
  readonly subsectors: readonly string[];
}

/** 8 sectors, 12 subsectors (SRS §5.3). */
export const SECTORS: readonly Sector[] = [
  { code: 'AGRICULTURE', name: 'Agriculture', subsectors: ['Coconut', 'Paddy', 'Tea', 'Vegetable & Other Field Crops'] },
  { code: 'HUMAN_SETTLEMENTS', name: 'Human Settlements', subsectors: [] },
  { code: 'INDUSTRY', name: 'Industry', subsectors: [] },
  { code: 'INLAND_FISHERY', name: 'Inland Fishery', subsectors: ['Inland Fishery'] },
  { code: 'LIVESTOCK', name: 'Livestock', subsectors: ['Buffalo', 'Cattle', 'Goat', 'Pig & Sheep', 'Poultry farming'] },
  { code: 'TOURISM', name: 'Tourism', subsectors: [] },
  { code: 'TRANSPORTATION', name: 'Transportation', subsectors: [] },
  { code: 'WATER', name: 'Water', subsectors: ['Irrigation Water', 'Potable Water'] },
];

/** 9 provinces (design/ingestion/dsd_register.csv). NOTE: "Northwestern"
 *  here (no space) does not match province.name in the database, which
 *  seeds 'North Western' (schema.sql) -- a pre-existing inconsistency, not
 *  introduced by T2b. This list matches the shipped GeoJSON asset's own
 *  `province` property, which the map's filter logic depends on, so it is
 *  left as-is rather than "fixed" in a way that would break that matching;
 *  auth.service.ts normalises spacing/case when it needs to line an
 *  account's database province name up against this list (province lock,
 *  T2b). The real fix is a GET /provinces endpoint that replaces both
 *  copies -- out of scope here. */
export const PROVINCES: readonly string[] = [
  'Central',
  'Eastern',
  'North Central',
  'Northern',
  'Northwestern',
  'Sabaragamuwa',
  'Southern',
  'Uva',
  'Western',
];

/** id + code, for the registration form's province picker, which needs
 *  province_id (POST /auth/register) rather than the display name PROVINCES
 *  carries. IDs mirror province's seed insertion order in schema.sql --
 *  there is no GET /provinces endpoint yet, so this is a second static copy
 *  of the same 9 rows, not a derivation of PROVINCES. */
export interface ProvinceOption {
  readonly id: number;
  readonly code: string;
  readonly name: string;
}

export const PROVINCE_OPTIONS: readonly ProvinceOption[] = [
  { id: 1, code: 'CEN', name: 'Central' },
  { id: 2, code: 'EAS', name: 'Eastern' },
  { id: 3, code: 'NCE', name: 'North Central' },
  { id: 4, code: 'NOR', name: 'Northern' },
  { id: 5, code: 'NWE', name: 'North Western' },
  { id: 6, code: 'SAB', name: 'Sabaragamuwa' },
  { id: 7, code: 'SOU', name: 'Southern' },
  { id: 8, code: 'UVA', name: 'Uva' },
  { id: 9, code: 'WES', name: 'Western' },
];

export type Track = 'data' | 'expert' | 'community';

export const TRACKS: readonly Track[] = ['data', 'expert', 'community'];

/**
 * SRS §9.1 rule 1: an absent value is a state, never a bare 0.
 *
 * `not_applicable` was added 3 September 2026, on the first real data. Where a
 * sector is simply not present in a division its exposure index is 0 and so is
 * the product — 19 of Central's 41 divisions have no inland fishery at all. The
 * zero is arithmetically correct, but rendered in the lowest band it reads as
 * *least vulnerable*, indistinguishable from a division with a thriving fishery
 * that is coping well. Owner decision: such a division is not selectable and
 * carries no score.
 *
 * It is NOT the same as `unassessed`. Unassessed means we do not know;
 * not-applicable means we do know, and the answer is that the question does not
 * arise here. Both must be visually distinct from each other and from the ramp.
 */
export type CoverageState = 'assessed' | 'pending' | 'unassessed' | 'not_applicable';

/**
 * A division carries two coexisting vulnerability indexes for the same
 * profile and period -- neither overwrites the other (SRS §2.2, CHANGES
 * 2026-08-09 C2).
 *
 * - `provincial` -- bounds from its own province; exists once that province
 *   is complete; this is the headline published score (P-14).
 * - `national` -- bounds from all divisions nationally; exists once *every*
 *   division in the register holds a value. Currently blocked on two counts:
 *   the register is incomplete against the official DS-division total (SRS
 *   §11.3 O-12), and no division holds values yet. Filter controls must
 *   disable this option and say why, not merely omit it -- and must derive
 *   the "why" from `DivisionCoverage`, never from a literal. The literal that
 *   used to live here said 330-of-331 and was stale within five days.
 */
export type IndexScope = 'provincial' | 'national';

/**
 * The three DS-division counts, which are different numbers and must never be
 * collapsed into one (SRS §5.1):
 *
 * - `official`   -- how many divisions the Government recognises. Set outside
 *                   this system; `null` when not yet reconciled (O-12).
 * - `registered` -- rows in the register. The denominator for EVERY
 *                   completeness statement, including §2.2.
 * - `drawable`   -- registered divisions carrying geometry. Always <=
 *                   `registered`; what the map can actually draw.
 * - `withValues` -- registered divisions holding at least one indicator value
 *                   for the current query. The numerator of coverage.
 *
 * `official > registered` means divisions exist that the system does not know
 * about; that is a blocking gap for the national index, and the UI must say so
 * rather than reporting coverage against a denominator it knows is short.
 */
export interface DivisionCoverage {
  readonly official: number | null;
  readonly registered: number;
  readonly drawable: number;
  readonly withValues: number;
}

export const INDEX_SCOPES: readonly IndexScope[] = ['provincial', 'national'];

export type AdminLevel = 'province' | 'district' | 'ds_division';

/** The two collection periods carried by every template workbook (SRS §2.5). */
export const PERIODS: readonly string[] = ['2020-2025', '2025-2030'];
