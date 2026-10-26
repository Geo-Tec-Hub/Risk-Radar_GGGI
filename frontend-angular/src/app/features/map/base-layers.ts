import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import RegularShape from 'ol/style/RegularShape';

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
  { key: 'district', label: 'District boundary', swatch: '#1c7ed6', kind: 'outline' },
  { key: 'gnd', label: 'GN division boundary', swatch: '#868e96', kind: 'outline' },
  { key: 'schools', label: 'Schools', swatch: '#2f9e44', kind: 'point' },
  { key: 'hospitals', label: 'Hospitals', swatch: '#e03131', kind: 'point' },
];

export const SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const SATELLITE_ATTRIBUTION = 'Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community';

/** Outlines only (no fill) so the division colours underneath stay visible. */
export function overlayStyle(key: OverlayKey): Style {
  switch (key) {
    case 'province':
      return new Style({ stroke: new Stroke({ color: '#111111', width: 2.6 }) });
    case 'district':
      return new Style({ stroke: new Stroke({ color: '#1c7ed6', width: 1.6, lineDash: [8, 4] }) });
    case 'gnd':
      return new Style({ stroke: new Stroke({ color: 'rgba(73, 80, 87, 0.8)', width: 0.6 }) });
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
