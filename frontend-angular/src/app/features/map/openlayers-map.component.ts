import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import OlMap from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';

import { BoundaryService } from '../../core/services/boundary.service';
import { DsDivisionProperties } from '../../core/models/ds-division.model';
import { VulnerabilityUnit } from '../../core/models/vulnerability.model';
import { styleForState } from './coverage-style';
import { MapLayer } from '../../core/models/map-layer.model';
import {
  BasemapKey, OVERLAY_LIST, OverlayKey, SATELLITE_ATTRIBUTION, SATELLITE_URL, overlayStyle,
} from './base-layers';

const SRI_LANKA_CENTER = fromLonLat([80.7, 7.85]);

@Component({
  selector: 'app-openlayers-map',
  standalone: true,
  templateUrl: './openlayers-map.component.html',
  styleUrl: './openlayers-map.component.scss',
})
export class OpenlayersMapComponent implements AfterViewInit, OnDestroy {
  /** Results for the current filter selection, keyed by ds_code. Empty until Stage 4 exists. */
  readonly unitsByCode = input<ReadonlyMap<string, VulnerabilityUnit>>(new Map());
  readonly selectedCode = input<string | null>(null);
  /** Which index colours the divisions: vulnerability, hazard or exposure. */
  readonly layer = input<MapLayer>('vulnerability');
  /**
   * Province code of the current selection. The boundary asset holds all 340
   * divisions nationally, but a score is scaled WITHIN one province - so
   * without this every other province renders hatched, which reads as "no data
   * collected" rather than "not part of this view". Divisions outside the
   * province are hidden and the view is fitted to the ones that remain.
   */
  readonly provinceName = input<string | null>(null);

  readonly divisionSelected = output<DsDivisionProperties>();
  readonly boundariesLoaded = output<number>();
  readonly boundariesFailed = output<string>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly divisionCount = signal(0);

  private readonly mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');
  private readonly boundaryService = inject(BoundaryService);

  // ---- reference layers (tick boxes) ----------------------------------
  readonly overlayList = OVERLAY_LIST;
  readonly overlayOn = signal<Record<OverlayKey, boolean>>({
    province: false, district: false, gnd: false, schools: false, hospitals: false,
  });
  readonly basemap = signal<BasemapKey | null>('osm');
  readonly layersOpen = signal(true);
  readonly overlayError = signal<string | null>(null);
  private readonly http = inject(HttpClient);
  private readonly overlays = new Map<OverlayKey, VectorLayer<VectorSource>>();
  private readonly overlayLoaded = new Set<string>();
  private osmLayer?: TileLayer<OSM>;
  private satLayer?: TileLayer<XYZ>;
  private divisionLayer?: VectorLayer<VectorSource<Feature<Geometry>>>;

  private map?: OlMap;
  private allFeatures: Feature<Geometry>[] = [];
  private vectorSource = new VectorSource<Feature<Geometry>>();
  private resizeObserver?: ResizeObserver;

  constructor() {
    // Restyle whenever the joined results or the selection change.
    effect(() => {
      this.unitsByCode();
      this.selectedCode();
      this.layer();
      this.vectorSource.changed();
    });

    // Re-fit when the province changes, so the map opens on the area actually
    // being scored rather than on the whole country.
    effect(() => {
      this.provinceName();
      this.applyProvinceFilter();
    });

    // GN divisions come one province at a time: reload when the province or the
    // tick box changes.
    effect(() => {
      this.provinceName();
      this.overlayOn();
      this.syncOverlays();
    });
  }

  ngAfterViewInit(): void {
    const vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: (feature) => this.styleFeature(feature as Feature<Geometry>),
    });
    this.divisionLayer = vectorLayer;
    this.osmLayer = new TileLayer({ source: new OSM(), visible: this.basemap() === 'osm' });
    this.satLayer = new TileLayer({
      source: new XYZ({ url: SATELLITE_URL, attributions: SATELLITE_ATTRIBUTION, maxZoom: 18 }),
      visible: this.basemap() === 'satellite',
    });

    this.map = new OlMap({
      target: this.mapEl().nativeElement,
      layers: [this.osmLayer, this.satLayer, vectorLayer],
      view: new View({ center: SRI_LANKA_CENTER, zoom: 7, minZoom: 6, maxZoom: 14 }),
    });

    this.map.on('singleclick', (evt) => {
      const feature = this.map!.forEachFeatureAtPixel(evt.pixel, (f) => f as Feature<Geometry>,
        { layerFilter: (l) => l === this.divisionLayer });
      // A division where the sector is not present carries no score, so there
      // is nothing for the detail panel to show. Opening an empty panel would
      // imply the data is missing; it is not, the question does not arise.
      if (feature && this.isSelectable(feature)) {
        this.divisionSelected.emit(feature.getProperties() as unknown as DsDivisionProperties);
      }
    });

    this.map.on('pointermove', (evt) => {
      const feature = this.map!.forEachFeatureAtPixel(evt.pixel, (f) => f as Feature<Geometry>,
        { layerFilter: (l) => l === this.divisionLayer });
      this.map!.getTargetElement().style.cursor =
        feature && this.isSelectable(feature) ? 'pointer' : '';
      this.updateRefLabel(evt.pixel, evt.dragging);
    });
    this.map.getViewport().addEventListener('mouseleave', () => this.refLabel.set(null));

    // The map is created inside a flex layout whose size isn't resolved
    // until after this view-child hook runs, so OL's own construction-time
    // size read can be 0x0 ("No map visible because the map container's
    // width or height are 0"). A ResizeObserver keeps it in sync from then
    // on, including later window/sidebar resizes.
    this.resizeObserver = new ResizeObserver(() => this.map?.updateSize());
    this.resizeObserver.observe(this.mapEl().nativeElement);

    this.loadBoundaries();
  }

  private loadBoundaries(): void {
    this.loading.set(true);
    this.error.set(null);
    this.boundaryService.getDsDivisions().subscribe({
      next: (fc) => {
        const features = new GeoJSON().readFeatures(fc, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        }) as Feature<Geometry>[];
        this.allFeatures = features;
        this.loading.set(false);
        this.applyProvinceFilter();
      },
      error: (err) => {
        const message = err?.message ?? 'Could not load DS-division boundaries.';
        this.error.set(message);
        this.boundariesFailed.emit(message);
        this.loading.set(false);
      },
    });
  }

  /** Show only the selected province's divisions, and fit the view to them. */
  private applyProvinceFilter(): void {
    if (!this.allFeatures.length) return;
    const province = this.provinceName();
    const shown = province
      ? this.allFeatures.filter((f) => f.get('province') === province)
      : this.allFeatures;

    this.vectorSource.clear();
    this.vectorSource.addFeatures(shown);
    this.divisionCount.set(shown.length);
    // The count reported is the number of boundaries DRAWN, which is not the
    // authoritative division count -- it runs low by however many divisions are
    // boundary-pending. The coverage denominator comes from the API.
    this.boundariesLoaded.emit(shown.length);

    const extent = this.vectorSource.getExtent();
    if (this.map && shown.length && extent && Number.isFinite(extent[0])) {
      this.map.getView().fit(extent, { padding: [24, 24, 24, 24], maxZoom: 11 });
    }
  }

  // ---- reference layers --------------------------------------------------
  setBasemap(key: BasemapKey, on: boolean): void {
    this.basemap.set(on ? key : (this.basemap() === key ? null : this.basemap()));
    this.osmLayer?.setVisible(this.basemap() === 'osm');
    this.satLayer?.setVisible(this.basemap() === 'satellite');
  }

  setOverlay(key: OverlayKey, on: boolean): void {
    this.overlayOn.update((m) => ({ ...m, [key]: on }));
  }

  private overlayUrl(key: OverlayKey): string | null {
    const base = '/data/geo/';
    switch (key) {
      case 'province': return base + 'province.geojson';
      case 'district': return base + 'district.geojson';
      case 'schools': return base + 'schools.geojson';
      case 'hospitals': return base + 'hospitals.geojson';
      case 'gnd': {
        const p = this.provinceName();
        return p ? `${base}gnd/${p.replace(/ /g, '_')}.geojson` : null;
      }
    }
  }

  /** Create/load/show/hide each reference layer to match the tick boxes. */
  private syncOverlays(): void {
    if (!this.map) return;
    const on = this.overlayOn();
    for (const { key } of OVERLAY_LIST) {
      let layer = this.overlays.get(key);
      if (!layer) {
        layer = new VectorLayer({
          source: new VectorSource(),
          style: overlayStyle(key),
          // Outlines sit above the division colours; points above those.
          zIndex: key === 'schools' || key === 'hospitals' ? 20 : 10,
          visible: false,
        });
        this.overlays.set(key, layer);
        this.map.addLayer(layer);
      }
      layer.setVisible(on[key]);
      const url = this.overlayUrl(key);
      if (!on[key] || !url || this.overlayLoaded.has(url)) {
        // GND shows one province at a time: clear it when the file changes.
        if (key === 'gnd' && on[key] && url && this.overlayLoaded.has(url) && !this.gndShowing(url)) this.loadOverlay(key, url);
        continue;
      }
      this.loadOverlay(key, url);
    }
  }

  private gndUrlShown?: string;
  private gndShowing(url: string): boolean { return this.gndUrlShown === url; }

  private loadOverlay(key: OverlayKey, url: string): void {
    const layer = this.overlays.get(key)!;
    this.http.get(url).subscribe({
      next: (fc) => {
        const feats = new GeoJSON().readFeatures(fc, {
          dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857',
        });
        const src = layer.getSource()!;
        src.clear();
        src.addFeatures(feats);
        this.overlayLoaded.add(url);
        if (key === 'gnd') this.gndUrlShown = url;
        this.overlayError.set(null);
      },
      error: () => this.overlayError.set('A reference layer could not be loaded.'),
    });
  }

  /**
   * Reference-layer labels (client NOTED-10): a name appears only when the
   * cursor comes close to a school, hospital or boundary line, never as a
   * permanent label -- printed labels for hundreds of points would bury the map.
   * Points win over outlines; within 8 px counts as close.
   */
  readonly refLabel = signal<{ text: string; x: number; y: number } | null>(null);

  private updateRefLabel(pixel: number[], dragging: boolean): void {
    if (!this.map || dragging) { this.refLabel.set(null); return; }
    let best: { text: string; rank: number } | null = null;
    const rank: Record<OverlayKey, number> = { hospitals: 0, schools: 1, gnd: 2, district: 3, province: 4 };
    for (const [key, layer] of this.overlays) {
      if (!layer.getVisible()) continue;
      if (best && best.rank <= rank[key]) continue;
      const f = this.map.forEachFeatureAtPixel(pixel, (x) => x as Feature<Geometry>,
        { layerFilter: (l) => l === layer, hitTolerance: 8 });
      const name = f?.get('name') as string | undefined;
      if (!name) continue;
      const kind = key === 'gnd' ? 'GN division' : key === 'district' ? 'District'
        : key === 'province' ? 'Province' : key === 'schools' ? 'School' : 'Hospital';
      best = { text: `${name} (${kind})`, rank: rank[key] };
    }
    this.refLabel.set(best ? { text: best.text, x: pixel[0], y: pixel[1] } : null);
  }

  private isSelectable(feature: Feature<Geometry>): boolean {
    // Overall hazard is a province-wide reference map, not a scored profile:
    // there is no division panel to open for it.
    if (this.layer() === 'hazard') return false;
    const unit = this.unitsByCode().get(feature.get('ds_code') as string);
    return unit?.state !== 'not_applicable';
  }

  private styleFeature(feature: Feature<Geometry>) {
    const dsCode = feature.get('ds_code') as string;
    const unit = this.unitsByCode().get(dsCode);
    const state = unit?.state ?? 'unassessed';
    const band = unit?.band ?? null;
    const selected = this.selectedCode() === dsCode;
    return styleForState(state, band, selected, this.layer());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.setTarget(undefined);
  }
}
