import { Component, input } from '@angular/core';

import { IndexScope } from '../../core/models/reference-data.model';
import { CoverageSummary } from '../../core/models/vulnerability.model';
import { BAND_LEGEND, COVERAGE_LEGEND } from './coverage-style';

/**
 * FR-5.14 / FR-5.15 / FR-5.16: the four coverage states rendered as
 * distinct legend entries (swatch + pattern hint, not colour alone), plus
 * the coverage statement -- counts and proportions for the current
 * selection.
 *
 * CHANGES 2026-08-09 C2: a division now carries two indexes (provincial /
 * national). This legend must name which one it describes and must never
 * show both scopes' coverage under one heading -- coverage for one scope
 * says nothing about the other (a province can be provincially complete
 * while the national index is still unassessed everywhere).
 */
@Component({
  selector: 'app-coverage-legend',
  standalone: true,
  templateUrl: './coverage-legend.component.html',
  styleUrl: './coverage-legend.component.scss',
})
export class CoverageLegendComponent {
  readonly coverage = input<CoverageSummary | null>(null);
  readonly indexScope = input.required<IndexScope>();

  readonly legend = COVERAGE_LEGEND;
  readonly bands = BAND_LEGEND;

  pct(n: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((n / total) * 100)}%`;
  }
}
