/**
 * Vulnerability bands and their colours.
 *
 * SRS v2.3 §2.7, FR-4.13 and FR-4.13b. **Owner decision, 14 August 2026 —
 * [O-10] and [O-11] closed, [P-4] and [P-14] confirmed.**
 *
 * The published index is the raw product `H × E` min-max rescaled to [0, 1]
 * within its province, and these five bands are the even fifths of that scale.
 * The thresholds are FIXED. They are deliberately **not** derived from the
 * observed distribution, and quantile / natural-breaks classification are
 * rejected.
 *
 * Why, because it will look wrong the first time you see a real map: the index
 * is a product of two numbers in [0, 1], so it is right-skewed, and rescaling
 * moves a distribution's endpoints without changing its shape. The bottom band
 * will hold roughly 45-50% of divisions rather than 20%. **That is accepted and
 * is not a bug to fix.** A data-derived classification would re-cut its bands
 * every time a province completed — and data arrives in instalments over months
 * — so the same colour would mean different numbers at different times, and a
 * map exported today would silently disagree with the same map next quarter.
 * A fixed legend is what makes a published map still true six months later.
 *
 * Do not "improve" this by computing quantiles. If it ever genuinely must
 * change, it is a settings edit (the values are configuration) and an owner
 * decision — not a frontend refactor.
 */

/** The five bands, in ascending severity. Order is meaningful. */
export type Band = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface BandSpec {
  readonly band: Band;
  /** Inclusive lower bound on the rescaled 0-1 index. */
  readonly min: number;
  /**
   * Exclusive upper bound — except for `very_high`, whose interval is closed
   * at 1 so that the single division scoring exactly 1.000 in each province
   * lands in a band at all.
   */
  readonly max: number;
  readonly label: string;
  /** Fill for a light chart/map surface. */
  readonly light: string;
  /** Fill for a dark surface — a re-step, NOT an inversion; see below. */
  readonly dark: string;
}

/**
 * A single-hue sequential ramp: severity is carried by **lightness, not hue**,
 * so the map stays readable under every form of colour-vision deficiency and in
 * greyscale print.
 *
 * The dark column is not the light column reversed by accident. In both modes
 * *Very high* is the most visually prominent step and *Very low* the least — on
 * a light surface prominence is darkness, on a dark surface it is lightness.
 * Salience direction is preserved; lightness direction is not.
 *
 * Both sets are validated: monotone lightness, every adjacent pair separated by
 * >= 0.06 in perceptual lightness, single hue (spread <= 1 degree), and the step
 * nearest the surface clearing 2:1 contrast against it. That last check is the
 * one that matters most here — it is what stops *Very low* receding into the
 * background and being read as *no data*, which is the "absent rendered as
 * present" defect this project has already found once in the retired client.
 */
export const BANDS: readonly BandSpec[] = [
  { band: 'very_low',  min: 0.0, max: 0.2, label: 'Very low',  light: '#eb827b', dark: '#971a20' },
  { band: 'low',       min: 0.2, max: 0.4, label: 'Low',       light: '#d36963', dark: '#b03e3b' },
  { band: 'moderate',  min: 0.4, max: 0.6, label: 'Moderate',  light: '#bc504c', dark: '#c95d57' },
  { band: 'high',      min: 0.6, max: 0.8, label: 'High',      light: '#a43735', dark: '#e27a73' },
  { band: 'very_high', min: 0.8, max: 1.0, label: 'Very high', light: '#8d1a1e', dark: '#fb9890' },
];

/**
 * None of the band colours may be reused for a coverage state (FR-5.14):
 * `pending` carries a texture and `unassessed` a neutral fill, neither of which
 * appears in the ramp above. Exported here so a reviewer can see the two sets
 * are disjoint rather than having to trust it.
 */
export const COVERAGE_STATE_FILLS = {
  /** Neutral, no hue from the ramp. Always accompanied by a legend entry. */
  unassessed: { light: '#e4e3df', dark: '#3a3a37' },
  /** Rendered as a texture over this base, never as a flat fill. */
  pending: { light: '#c9c8c2', dark: '#55554f' },
} as const;

/**
 * Classify a rescaled index into its band.
 *
 * Intervals are half-open — `[min, max)` — so every value falls in exactly one
 * band, with the top interval closed at 1 ([P-4]).
 *
 * Returns `null` for `null`/`undefined`, and that is the point: an absent score
 * is a coverage state, never a band, and never a zero (NFR-10, §5.6). Callers
 * must render `null` as *pending* or *unassessed*, not as *Very low*.
 */
export function bandFor(index: number | null | undefined): BandSpec | null {
  if (index === null || index === undefined || Number.isNaN(index)) return null;
  if (index < 0 || index > 1) return null;
  return BANDS.find((b) => index < b.max) ?? BANDS[BANDS.length - 1];
}
