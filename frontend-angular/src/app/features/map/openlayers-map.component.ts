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
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import OlMap from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';

import { BoundaryService } from '../../core/services/boundary.service';
import { DsDivisionProperties } from '../../core/models/ds-division.model';
import { VulnerabilityUnit } from '../../core/models/vulnerability.model';
import { styleForState } from './coverage-style';

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

  private map?: OlMap;
  private allFeatures: Feature<Geometry>[] = [];
  private vectorSource = new VectorSource<Feature<Geometry>>();
  private resizeObserver?: ResizeObserver;

  constructor() {
    // Restyle whenever the joined results or the selection change.
    effect(() => {
      this.unitsByCode();
      this.selectedCode();
      this.vectorSource.changed();
    });

    // Re-fit when the province changes, so the map opens on the area actually
    // being scored rather than on the whole country.
    effect(() => {
      this.provinceName();
      this.applyProvinceFilter();
    });
  }

  ngAfterViewInit(): void {
    const vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: (feature) => this.styleFeature(feature as Feature<Geometry>),
    });

    this.map = new OlMap({
      target: this.mapEl().nativeElement,
      layers: [new TileLayer({ source: new OSM() }), vectorLayer],
      view: new View({ center: SRI_LANKA_CENTER, zoom: 7, minZoom: 6, maxZoom: 14 }),
    });

    this.map.on('singleclick', (evt) => {
      const feature = this.map!.forEachFeatureAtPixel(evt.pixel, (f) => f as Feature<Geometry>);
      // A division where the sector is not present carries no score, so there
      // is nothing for the detail panel to show. Opening an empty panel would
      // imply the data is missing; it is not, the question does not arise.
      if (feature && this.isSelectable(feature)) {
        this.divisionSelected.emit(feature.getProperties() as unknown as DsDivisionProperties);
      }
    });

    this.map.on('pointermove', (evt) => {
      const feature = this.map!.forEachFeatureAtPixel(evt.pixel, (f) => f as Feature<Geometry>);
      this.map!.getTargetElement().style.cursor =
        feature && this.isSelectable(feature) ? 'pointer' : '';
    });

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

  private isSelectable(feature: Feature<Geometry>): boolean {
    const unit = this.unitsByCode().get(feature.get('ds_code') as string);
    return unit?.state !== 'not_applicable';
  }

  private styleFeature(feature: Feature<Geometry>) {
    const dsCode = feature.get('ds_code') as string;
    const unit = this.unitsByCode().get(dsCode);
    const state = unit?.state ?? 'unassessed';
    const band = unit?.band ?? null;
    const selected = this.selectedCode() === dsCode;
    return styleForState(state, band, selected);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.setTarget(undefined);
  }
}
