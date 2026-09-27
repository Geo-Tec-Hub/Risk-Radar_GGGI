import { Fill, Stroke, Style } from 'ol/style';

import { BANDS, COVERAGE_STATE_FILLS } from '../../core/models/band.model';
import { CoverageState } from '../../core/models/reference-data.model';
import { LAYER_RAMPS, MapLayer } from '../../core/models/map-layer.model';

/**
 * Styling for the four coverage states (FR-5.14) plus the 4-band score
 * ramp for assessed divisions. FR-5.16: absence must never be colour alone,
 * so `unassessed` gets a hatch pattern and `pending` gets a dotted outline
 * on top of a distinct fill -- state is still legible in greyscale or to a
 * colour-blind viewer.
 */

/**
 * The ramp is taken from band.model.ts, NOT defined here.
 *
 * This file previously carried its own green-yellow-red scale. That is a
 * multi-hue ramp, and SRS section 2.7 / FR-4.13b specifies a SINGLE-HUE
 * sequential ramp where severity is carried by lightness, so the map stays
 * readable under colour-vision deficiency and in greyscale print. band.model.ts
 * is the validated set - monotone lightness, adjacent steps separated by
 * >= 0.06, hue spread <= 1 degree, lightest step clearing 2:1 against the
 * surface - and its comment says in terms not to swap colours by eye. Two
 * definitions of the same ramp meant the legend and the map could disagree,
 * and only one of them had been checked.
 */
const BAND_COLORS: Record<1 | 2 | 3 | 4, string> = {
  1: BANDS[0].light,
  2: BANDS[1].light,
  3: BANDS[2].light,
  4: BANDS[3].light,
};

/**
 * Fill alpha for every polygon state (18 Sep 2026, Milinda): the vulnerability
 * layer sits on top of the OSM basemap, and place names/roads under it were
 * fully hidden by an opaque fill. Applied to FILL only, never to Stroke --
 * boundaries stay crisp at full opacity so province/division edges remain
 * legible; only the colour wash is see-through.
 */
const FILL_ALPHA = 0.65;

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Disjoint from the ramp by construction (FR-5.14): a coverage state must
// never be mistakable for a score.
const PENDING_FILL = withAlpha(COVERAGE_STATE_FILLS.pending.light, FILL_ALPHA);
const PENDING_STROKE = '#868e96';
const SELECTED_STROKE = '#1c7ed6';

const NOT_APPLICABLE_FILL = withAlpha('#f2f1ee', FILL_ALPHA);
const NOT_APPLICABLE_STROKE = '#c9c8c2';

let hatchPattern: CanvasPattern | null = null;
let dotsPattern: CanvasPattern | null = null;

/** A diagonal-line pattern so "unassessed" reads as absence, not as a flat colour choice. */
function getHatchPattern(): CanvasPattern {
  if (hatchPattern) return hatchPattern;

  const size = 8;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = withAlpha(COVERAGE_STATE_FILLS.unassessed.light, FILL_ALPHA);
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#ced4da';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(size, 0);
  ctx.stroke();

  hatchPattern = ctx.createPattern(canvas, 'repeat')!;
  return hatchPattern;
}

/**
 * A dot pattern so "sector not present" is never conveyed by colour alone
 * (FR-5.16). It is deliberately DIFFERENT from the two other absence marks --
 * `unassessed` is diagonal hatch, `pending` is a dashed outline -- so the three
 * states stay tellable apart in greyscale and to a colour-blind viewer. A flat
 * pale fill (the 3 Sep 2026 decision) was close enough to `very_low`'s red that
 * the two could be confused; the dots keep the "set aside" lightness while
 * carrying their own texture.
 */
function getDotsPattern(): CanvasPattern {
  if (dotsPattern) return dotsPattern;

  const size = 8;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = NOT_APPLICABLE_FILL;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#adb5bd';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 1.25, 0, Math.PI * 2);
  ctx.fill();

  dotsPattern = ctx.createPattern(canvas, 'repeat')!;
  return dotsPattern;
}

/** The fill for a band on a layer: vulnerability keeps band.model.ts, hazard
 * and exposure use their own ramps (core/models/map-layer.model.ts). */
function bandColor(band: 1 | 2 | 3 | 4, layer: MapLayer): string {
  return layer === 'vulnerability' ? BAND_COLORS[band] : LAYER_RAMPS[layer][band - 1];
}

export function styleForState(
  state: CoverageState,
  band: 1 | 2 | 3 | 4 | null,
  selected: boolean,
  layer: MapLayer = 'vulnerability',
): Style {
  if (state === 'assessed' && band !== null) {
    return new Style({
      fill: new Fill({ color: withAlpha(bandColor(band, layer), FILL_ALPHA) }),
      stroke: new Stroke({ color: selected ? SELECTED_STROKE : '#495057', width: selected ? 3 : 1 }),
    });
  }

  // The sector is not present in this division. DOTTED where `unassessed` is
  // hatched: the two must not be read as the same thing. One says we do not
  // know, the other says the question does not arise. Pale with its own dots
  // reads as "set aside" rather than as a step on the ramp, and never as
  // colour alone (FR-5.16).
  if (state === 'not_applicable') {
    return new Style({
      fill: new Fill({ color: getDotsPattern() }),
      stroke: new Stroke({ color: NOT_APPLICABLE_STROKE, width: 1 }),
    });
  }

  if (state === 'pending') {
    return new Style({
      fill: new Fill({ color: PENDING_FILL }),
      stroke: new Stroke({
        color: selected ? SELECTED_STROKE : PENDING_STROKE,
        width: selected ? 3 : 1.5,
        lineDash: [4, 3],
      }),
    });
  }

  // unassessed
  return new Style({
    fill: new Fill({ color: getHatchPattern() }),
    stroke: new Stroke({ color: selected ? SELECTED_STROKE : '#adb5bd', width: selected ? 3 : 1 }),
  });
}

/**
 * The 4-band vulnerability ramp, for the legend.
 *
 * Taken straight from BANDS so the legend can never drift from the map fill.
 * `range` is the fixed interval on the rescaled 0-1 index (FR-4.13b) -- the
 * thresholds are configuration, not data-derived, so printing them is safe.
 */
// Legend swatches carry the SAME 65% fill alpha as the map so a legend swatch
// and the colour it explains are the same colour value -- the two previously
// drifted (opaque hex in the legend, 65% rgba on the map), which made the
// legend look darker and more saturated than the map it described (QA 26 Sep).
export const BAND_LEGEND = BANDS.map((b) => ({
  band: b.band,
  label: b.label,
  swatch: withAlpha(b.light, FILL_ALPHA),
  range: `${b.min.toFixed(2)}\u2013${b.max.toFixed(2)}`,
}));

/** The same four steps in the colours of `layer`. */
export function bandLegendFor(layer: MapLayer) {
  return BANDS.map((b, i) => ({
    band: b.band,
    label: b.label,
    swatch: withAlpha(bandColor((i + 1) as 1 | 2 | 3 | 4, layer), FILL_ALPHA),
    range: `${b.min.toFixed(2)}\u2013${b.max.toFixed(2)}`,
  }));
}

export const COVERAGE_LEGEND = [
  { state: 'assessed' as const, label: 'Assessed', swatch: withAlpha(BAND_COLORS[3], FILL_ALPHA), hint: 'coloured by band' },
  { state: 'pending' as const, label: 'Pending', swatch: PENDING_FILL, hint: 'dashed outline' },
  { state: 'unassessed' as const, label: 'Unassessed', swatch: withAlpha(COVERAGE_STATE_FILLS.unassessed.light, FILL_ALPHA), hint: 'hatched — not yet known' },
  { state: 'not_applicable' as const, label: 'Sector not present', swatch: NOT_APPLICABLE_FILL, hint: 'dotted — no score, not selectable' },
];
