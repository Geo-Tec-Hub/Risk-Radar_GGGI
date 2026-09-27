import { Component, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { ApiClientService } from '../../core/services/api-client.service';
import { TaxonomyService } from '../../core/services/taxonomy.service';
import { withViewTimeout } from '../../core/services/view-request';
import { ApiError } from '../../core/models/api-error.model';
import { DsDivisionProperties } from '../../core/models/ds-division.model';
import { CoverageSummary, VulnerabilityQuery, VulnerabilityUnit } from '../../core/models/vulnerability.model';
import { CoverageLegendComponent } from './coverage-legend.component';
import { DivisionPanelComponent } from './division-panel.component';
import { FilterBarComponent } from './filter-bar.component';
import { OpenlayersMapComponent } from './openlayers-map.component';
import { LAYER_LABEL, MAP_LAYERS, MapLayer, unitForLayer } from '../../core/models/map-layer.model';

/**
 * Composes the public map screen (SRS §6.5 / Stage 5): filter bar, map,
 * legend and the division detail panel. This is the route target for `/`.
 *
 * `GET /vulnerability` (§9) is served by `backend/app/routers/vulnerability.py`;
 * when it is unreachable the failure is surfaced (FR-5.20), not hidden, and the
 * map still renders every division as `unassessed`, which is the honest state
 * of a system with no reachable scores.
 */
@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [FilterBarComponent, OpenlayersMapComponent, CoverageLegendComponent, DivisionPanelComponent],
  templateUrl: './map-page.component.html',
  styleUrl: './map-page.component.scss',
})
export class MapPageComponent {
  private readonly api = inject(ApiClientService);
  private readonly taxonomyService = inject(TaxonomyService);

  readonly query = signal<VulnerabilityQuery>({});
  readonly unitsByCode = signal<ReadonlyMap<string, VulnerabilityUnit>>(new Map());

  /** Which index colours the map (27 Sep 2026): vulnerability, or the same
   * profile's hazard or exposure index. The map, the legend and the coverage
   * counts all read `displayUnits`, so they always describe the same layer. */
  readonly layer = signal<MapLayer>('vulnerability');
  readonly layers = MAP_LAYERS;
  readonly layerLabel = LAYER_LABEL;
  readonly displayUnits = computed<ReadonlyMap<string, VulnerabilityUnit>>(() => {
    const layer = this.layer();
    const out = new Map<string, VulnerabilityUnit>();
    for (const [k, u] of this.unitsByCode()) out.set(k, unitForLayer(u, layer));
    return out;
  });

  // ---- PDF export ------------------------------------------------------
  readonly exportBusy = signal<'one' | 'all' | null>(null);
  readonly exportError = signal<string | null>(null);
  readonly exportPanelOpen = signal(false);
  readonly exportLayers = signal<Record<MapLayer, boolean>>({
    vulnerability: true, hazard: true, exposure: true,
  });

  onLayerChange(layer: MapLayer): void {
    this.layer.set(layer);
    this.recomputeCoverage();
  }

  toggleExportLayer(layer: MapLayer, on: boolean): void {
    this.exportLayers.update((m) => ({ ...m, [layer]: on }));
  }

  /** The map on screen: this profile, this layer, as a one-page PDF. */
  exportThisMap(): void {
    const q = this.query();
    this.download('one', {
      province: q.province, period: q.period, track: q.track,
      sector: q.sector, subsector: q.subsector, hazard: q.hazard,
      layers: this.layer(),
    });
  }

  /** Every profile of the province with scores for the period, chosen layers. */
  exportAllMaps(): void {
    const q = this.query();
    const layers = MAP_LAYERS.filter((l) => this.exportLayers()[l]);
    if (!layers.length) {
      this.exportError.set('Choose at least one layer to export.');
      return;
    }
    this.download('all', { province: q.province, period: q.period, track: q.track, layers: layers.join(',') });
  }

  private download(kind: 'one' | 'all', params: Record<string, string | undefined>): void {
    if (!params['province'] || !params['period']) return;
    this.exportBusy.set(kind);
    this.exportError.set(null);
    this.api.downloadMapsPdf(params).subscribe({
      next: (res) => {
        const cd = res.headers.get('Content-Disposition') ?? '';
        const name = /filename="?([^";]+)"?/.exec(cd)?.[1] ?? 'RiskRadar_maps.pdf';
        const url = URL.createObjectURL(res.body as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        this.exportBusy.set(null);
        if (kind === 'all') this.exportPanelOpen.set(false);
      },
      error: async (err) => {
        // The error body of a blob request is itself a Blob.
        let msg = err?.message ?? 'The PDF could not be produced.';
        try {
          const text = await (err?.error as Blob)?.text?.();
          if (text) msg = JSON.parse(text).detail ?? msg;
        } catch { /* keep the generic message */ }
        this.exportError.set(msg);
        this.exportBusy.set(null);
      },
    });
  }
  readonly selectedDivision = signal<DsDivisionProperties | null>(null);

  /**
   * Sidebar width, drag-resizable via the handle between map and panel
   * (2026-09-18, Milinda). Persisted per-browser in localStorage -- a
   * remembered layout preference, not app state, so it is read/written
   * defensively (private browsing, blocked storage) rather than trusted.
   */
  private static readonly SIDEBAR_MIN = 260;
  private static readonly SIDEBAR_DEFAULT = 320;
  private static readonly SIDEBAR_STORAGE_KEY = 'rr-sidebar-width';
  private resizingSidebar = false;

  readonly sidebarWidth = signal<number>(this.loadSidebarWidth());

  readonly resultsLoading = signal(false);
  readonly resultsError = signal<string | null>(null);

  /**
   * The in-flight results request, cancelled when a newer one starts. Without
   * this a slow response to an OLD filter selection could land last and paint
   * the wrong profile's scores under the new labels (QA 26 Sep 2026).
   */
  private resultsRequest?: Subscription;

  /**
   * Count of boundaries actually drawn, from the stopgap GeoJSON asset --
   * NOT the authoritative division count, and never to be presented as one.
   * It is the *drawable* count (SRS §5.1) and it runs low against the register
   * by however many divisions are boundary-pending: two since the Kalmunai
   * split (Stage 1.14, O-2), more once O-12's divisions are registered.
   * Only used below to build a fallback coverage statement when /coverage
   * is unreachable (which is always, today). Once Stage 2's catalogue
   * endpoint exists, replace this with `ReferenceDataService.getDivisionCoverage()`
   * and stop deriving "total" from what merely rendered on screen.
   */
  readonly divisionTotal = signal(0);
  readonly boundaryError = signal<string | null>(null);

  readonly coverage = signal<CoverageSummary | null>(null);

  /**
   * Divisions that hold a value for every weighted variable of the active
   * profile version but have no score for it yet -- the `pending` state the
   * API emits after a weights save (new version, results not yet recomputed).
   * Surfaced as a notice, not an error: the data is present, the scores are
   * simply not computed for the new version.
   */
  readonly pendingCount = computed(() => this.coverage()?.pending ?? 0);

  /**
   * The province NAME the boundary asset carries, resolved from the province
   * CODE the filter emits. The two are not interchangeable: the API keys on
   * codes (CEN) and ds_divisions.simplified.geojson carries names (Central).
   */
  readonly provinceName = computed(() => {
    const code = this.query().province;
    if (!code) return null;
    return this.taxonomyService.taxonomy()?.provinces.find((p) => p.code === code)?.name ?? null;
  });

  onQueryChange(query: VulnerabilityQuery): void {
    this.query.set(query);
    this.selectedDivision.set(null);
    this.refresh(query);
  }

  /** An expert/community score was just saved: re-read the map, keep the selection. */
  onAssessmentSaved(): void {
    this.refresh(this.query());
  }

  onDivisionSelected(division: DsDivisionProperties): void {
    this.selectedDivision.set(division);
  }

  onBoundariesLoaded(count: number): void {
    this.divisionTotal.set(count);
  }

  onBoundariesFailed(message: string): void {
    this.boundaryError.set(message);
  }

  /** Leaves at least this much width for the map itself, however wide the window. */
  private sidebarMax(): number {
    return Math.max(MapPageComponent.SIDEBAR_MIN, window.innerWidth - 360);
  }

  private loadSidebarWidth(): number {
    try {
      const stored = Number(localStorage.getItem(MapPageComponent.SIDEBAR_STORAGE_KEY));
      if (Number.isFinite(stored) && stored >= MapPageComponent.SIDEBAR_MIN) {
        return Math.min(stored, this.sidebarMax());
      }
    } catch {
      // Private window, blocked storage, etc. -- fall through to the default.
    }
    return MapPageComponent.SIDEBAR_DEFAULT;
  }

  onSidebarResizeStart(event: PointerEvent): void {
    event.preventDefault();
    this.resizingSidebar = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onSidebarResizeMove(event: PointerEvent): void {
    if (!this.resizingSidebar) return;
    // The sidebar sits on the right edge, so its width is the distance from
    // the pointer to the right edge of the viewport.
    const width = Math.min(
      this.sidebarMax(),
      Math.max(MapPageComponent.SIDEBAR_MIN, window.innerWidth - event.clientX),
    );
    this.sidebarWidth.set(width);
  }

  onSidebarResizeEnd(event: PointerEvent): void {
    if (!this.resizingSidebar) return;
    this.resizingSidebar = false;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    try {
      localStorage.setItem(MapPageComponent.SIDEBAR_STORAGE_KEY, String(this.sidebarWidth()));
    } catch {
      // Not persisted this session -- the drag itself still worked.
    }
  }

  private refresh(query: VulnerabilityQuery): void {
    this.resultsRequest?.unsubscribe();
    this.resultsLoading.set(true);
    this.resultsError.set(null);

    this.resultsRequest = this.api.getVulnerability(query).pipe(withViewTimeout()).subscribe({
      next: (units) => {
        this.unitsByCode.set(new Map(units.map((u) => [u.dsCode, u])));
        this.resultsLoading.set(false);
        this.recomputeCoverage();
      },
      error: (err: ApiError) => {
        this.resultsError.set(err.message);
        this.resultsLoading.set(false);
        // No results reachable -- every division stays unassessed, which
        // is the truthful default (NFR-10), not an empty/stale view.
        this.unitsByCode.set(new Map());
        this.recomputeCoverage();
      },
    });
  }

  /**
   * Coverage is counted from the RESULTS, not from the boundaries on screen.
   *
   * It used to derive `total` from however many polygons the GeoJSON asset
   * happened to render -- 340 nationally -- while the units belong to one
   * province, so a 41-division province reported 41 assessed of 340 and the
   * statement read as 12% coverage of a complete province. The API returns one
   * unit per division of the province, scored or not, which is exactly the
   * denominator the statement needs.
   */
  private recomputeCoverage(): void {
    const units = Array.from(this.displayUnits().values());
    if (units.length === 0) {
      this.coverage.set(null);
      return;
    }
    const assessed = units.filter((u) => u.state === 'assessed').length;
    const pending = units.filter((u) => u.state === 'pending').length;
    const notApplicable = units.filter((u) => u.state === 'not_applicable').length;
    this.coverage.set({
      assessed,
      pending,
      notApplicable,
      unassessed: units.length - assessed - pending - notApplicable,
      total: units.length,
    });
  }
}
