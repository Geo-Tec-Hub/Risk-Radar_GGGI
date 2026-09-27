import { BANDS, bandFor } from './band.model';
import { VulnerabilityUnit } from './vulnerability.model';

/**
 * The three map layers of one sector profile (owner request, 27 Sep 2026).
 *
 * Every result row already carries hazardIndex, exposureIndex and the
 * published vulnerability value, so a hazard or exposure map is another
 * column of the same row -- per sector, because each profile has its own
 * hazard variables and weights and its own exposure. The rules below are
 * IDENTICAL to backend app/maps/layers.py, so the screen and the exported PDF
 * cannot disagree:
 *
 *   vulnerability  unchanged
 *   hazard         any division with a result shows its hazard index, including
 *                  one where the sector is not present (the hazard is real there)
 *   exposure       a scored division shows its exposure index; "sector not
 *                  present" stays so, never a low score
 *
 * Hazard and exposure are weighted sums of province-normalised variables,
 * already 0-1, so the same fixed quarters apply unchanged.
 */
export type MapLayer = 'vulnerability' | 'hazard' | 'exposure';

export const MAP_LAYERS: readonly MapLayer[] = ['vulnerability', 'hazard', 'exposure'];

export const LAYER_LABEL: Record<MapLayer, string> = {
  vulnerability: 'Vulnerability',
  hazard: 'Hazard',
  exposure: 'Exposure',
};

/**
 * Single-hue ramps at the SAME four OKLab lightness steps as the validated
 * vulnerability ramp (0.72 / 0.645 / 0.57 / 0.42, hue spread < 1 degree), so
 * severity still reads by lightness and in greyscale, and a hazard map can
 * never be mistaken for a vulnerability map. Vulnerability stays band.model.ts.
 */
export const LAYER_RAMPS: Record<Exclude<MapLayer, 'vulnerability'>, readonly [string, string, string, string]> = {
  hazard: ['#e78a45', '#cd732b', '#b45c03', '#773a00'],
  exposure: ['#67aaed', '#5092d3', '#397bbb', '#024f8a'],
};

export const LAYER_NOTE: Record<MapLayer, string> = {
  vulnerability:
    'Vulnerability index: hazard × exposure, rescaled 0–1 within the province.',
  hazard:
    "Hazard index: this sector profile's weighted, province-normalised hazard variables (0–1).",
  exposure:
    "Exposure index: this sector's weighted, province-normalised exposure variables (0–1).",
};

type UnitWithIndices = VulnerabilityUnit & {
  readonly hazardIndex?: number | null;
  readonly exposureIndex?: number | null;
};

/** One division as the chosen layer shows it. */
export function unitForLayer(unit: VulnerabilityUnit, layer: MapLayer): VulnerabilityUnit {
  if (layer === 'vulnerability') return unit;
  const u = unit as UnitWithIndices;
  let value: number | null = null;
  let state = unit.state;
  if (layer === 'hazard') {
    if ((unit.state === 'assessed' || unit.state === 'not_applicable') && u.hazardIndex != null) {
      state = 'assessed';
      value = u.hazardIndex;
    }
  } else if (unit.state === 'assessed' && u.exposureIndex != null) {
    value = u.exposureIndex;
  }
  if (value === null && state === 'assessed') state = unit.state;
  const spec = bandFor(value);
  const band = spec ? ((BANDS.indexOf(spec) + 1) as 1 | 2 | 3 | 4) : null;
  return { ...unit, state, value, band };
}
