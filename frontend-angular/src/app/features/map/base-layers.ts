import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import RegularShape from 'ol/style/RegularShape';

import { zoomWidth } from './coverage-style';

/**
 * Optional reference layers for the map (client request NOTED-9, 26 Oct 2026):
 * Province / District / GND outlines, schools, hospitals, and the two
 * basemaps. Built from SHP/ by design/spatial/build_geo_assets.py; each file is
 * fetched only when its box is first ticked (GND per province, on demand).
 */
export type OverlayKey = 'province' | 'district' | 'gnd' | 'schools' | 'hospitals';
export type BasemapKey = 'osm' | 'satellite';

export const OVERLAY_LIST: readonly { key: OverlayKey; label: string; swatch: string; kind: 'outline' | 'point' }[] = [
  { key: 'province', label: 'Province boundary', swatch: '#111111', kind: 'outline' },
  { key: 'district', label: 'District boundary', swatch: '#c80000', kind: 'outline' },
  { key: 'gnd', label: 'GN division boundary', swatch: '#868e96', kind: 'outline' },
  { key: 'schools', label: 'Schools', swatch: '#2f9e44', kind: 'point' },
  { key: 'hospitals', label: 'Hospitals', swatch: '#e03131', kind: 'point' },
];

export const SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const SATELLITE_ATTRIBUTION = 'Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community';

/** Outlines only (no fill) so the division colours underneath stay visible. */
/** Outline widths follow the zoom (NOTED-17); points keep their size. */
const overlayCache = new Map<string, Style>();

export function overlayStyle(key: OverlayKey, resolution?: number): Style {
  const k = Math.round(zoomWidth(resolution, 1) * 10) / 10;
  const id = key + '|' + k;
  let st = overlayCache.get(id);
  if (!st) {
    st = buildOverlayStyle(key, k);
    overlayCache.set(id, st);
  }
  return st;
}

function buildOverlayStyle(key: OverlayKey, k: number): Style {
  const w = (base: number) => base * k;
  switch (key) {
    case 'province':
      // Zoomed out, a heavy black line swamps small provinces (NOTED-19): thinner and
      // slightly grey there, full weight when zoomed in.
      return new Style({ stroke: new Stroke({ color: k < 0.8 ? 'rgba(17,17,17,0.85)' : '#111111', width: w(2.2) }) });
    case 'district':
      // Red, RGB 200/0/0 (experts, NOTED-15).
      // Dashes only when zoomed in: at the country view they break into specks.
      return new Style({ stroke: new Stroke({ color: 'rgb(200, 0, 0)', width: w(1.6),
        lineDash: k < 0.8 ? undefined : [8 * k, 4 * k] }) });
    case 'gnd':
      return new Style({ stroke: new Stroke({ color: 'rgba(73, 80, 87, 0.8)', width: w(0.6) }) });
    case 'schools':
      return new Style({
        image: new CircleStyle({
          radius: 3.2,
          fill: new Fill({ color: '#2f9e44' }),
          stroke: new Stroke({ color: '#ffffff', width: 0.8 }),
        }),
      });
    case 'hospitals':
      return new Style({
        image: new RegularShape({
          points: 4, radius: 6, radius2: 2, angle: 0, // a plus sign
          fill: new Fill({ color: '#e03131' }),
          stroke: new Stroke({ color: '#ffffff', width: 1 }),
        }),
      });
  }
}
