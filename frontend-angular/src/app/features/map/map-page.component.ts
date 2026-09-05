import { Component, computed, inject, signal } from '@angular/core';

import { ApiClientService } from '../../core/services/api-client.service';
import { TaxonomyService } from '../../core/services/taxonomy.service';
import { ApiError } from '../../core/models/api-error.model';
import { DsDivisionProperties } from '../../core/models/ds-division.model';
import { CoverageSummary, VulnerabilityQuery, VulnerabilityUnit } from '../../core/models/vulnerability.model';
import { CoverageLegendComponent } from './coverage-legend.component';
import { DivisionPanelComponent } from './division-panel.component';
import { FilterBarComponent } from './filter-bar.component';
import { OpenlayersMapComponent } from './openlayers-map.component';

/**
 * Composes the public map screen (SRS §6.5 / Stage 5): filter bar, map,
 * legend and the division detail panel. This is the route target for `/`.
 *
 * `GET /vulnerability` (§9) has no backend behind it yet -- every request
 * here fails today. That failure is surfaced (FR-5.20), not hidden, and the
 * map still renders every division as `unassessed`, which is the honest
 * state of a system with no computation engine (Stage 4 not started).
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
  readonly selectedDivision = signal<DsDivisionProperties | null>(null);

  readonly resultsLoading = signal(false);
  readonly resultsError = signal<string | null>(null);

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

  onDivisionSelected(division: DsDivisionProperties): void {
    this.selectedDivision.set(division);
  }

  onBoundariesLoaded(count: number): void {
    this.divisionTotal.set(count);
  }

  onBoundariesFailed(message: string): void {
    this.boundaryError.set(message);
  }

  private refresh(query: VulnerabilityQuery): void {
    this.resultsLoading.set(true);
    this.resultsError.set(null);

    this.api.getVulnerability(query).subscribe({
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
    const units = Array.from(this.unitsByCode().values());
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
