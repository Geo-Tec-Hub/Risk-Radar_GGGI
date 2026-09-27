import { Component, computed, input } from '@angular/core';

import { IndexScope } from '../../core/models/reference-data.model';
import { CoverageSummary } from '../../core/models/vulnerability.model';
import { COVERAGE_LEGEND, bandLegendFor } from './coverage-style';
import { LAYER_LABEL, LAYER_NOTE, MapLayer } from '../../core/models/map-layer.model';

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
  readonly layer = input<MapLayer>('vulnerability');

  readonly legend = COVERAGE_LEGEND;
  readonly bands = computed(() => bandLegendFor(this.layer()));
  readonly layerLabel = computed(() => LAYER_LABEL[this.layer()]);
  readonly layerNote = computed(() => LAYER_NOTE[this.layer()]);

  /**
   * Only the states that actually appear in the current selection. Before any
   * results arrive the legend shows all four as a definition ("what each state
   * would look like"); once counts exist, a state with zero divisions is
   * dropped so "0 pending (0%)" no longer sits in the legend claiming a state
   * the map is not showing (QA 26 Sep 2026).
   */
  readonly visibleStates = computed(() => {
    const c = this.coverage();
    if (!c) return this.legend;
    const counts: Record<string, number> = {
      assessed: c.assessed,
      pending: c.pending,
      unassessed: c.unassessed,
      not_applicable: c.notApplicable,
    };
    return this.legend.filter((item) => (counts[item.state] ?? 0) > 0);
  });

  /**
   * The one-sentence coverage statement, built here so the percentages can be
   * rounded together (largest remainder) rather than each independently -- four
   * independent `Math.round`s can sum to 99 or 101, which reads as a bookkeeping
   * error next to a statement whose counts DO sum to the total (QA 26 Sep).
   */
  readonly statement = computed(() => {
    const c = this.coverage();
    if (!c) return null;
    const p = this.largestRemainder(c);
    const parts = [
      `${c.assessed} assessed (${p.assessed}%)`,
      `${c.unassessed} unassessed (${p.unassessed}%)`,
    ];
    if (c.pending > 0) parts.push(`${c.pending} pending (${p.pending}%)`);
    if (c.notApplicable > 0) {
      parts.push(`${c.notApplicable} where the sector is not present (${p.notApplicable}%)`);
    }
    return `${parts.join(' · ')} — ${c.total} DS divisions`;
  });

  /** Whole-number percentages that sum to exactly 100. */
  private largestRemainder(
    c: CoverageSummary,
  ): { assessed: number; pending: number; unassessed: number; notApplicable: number } {
    const keys = ['assessed', 'pending', 'unassessed', 'notApplicable'] as const;
    const values = { assessed: c.assessed, pending: c.pending, unassessed: c.unassessed, notApplicable: c.notApplicable };
    if (c.total === 0) return { assessed: 0, pending: 0, unassessed: 0, notApplicable: 0 };

    const entries = keys.map((k) => {
      const exact = (values[k] / c.total) * 100;
      return { key: k, exact, whole: Math.floor(exact) };
    });
    let remainder = 100 - entries.reduce((s, e) => s + e.whole, 0);
    const byFraction = [...entries].sort((a, b) => (b.exact - b.whole) - (a.exact - a.whole));
    for (const e of byFraction) {
      if (remainder <= 0) break;
      e.whole += 1;
      remainder -= 1;
    }
    return {
      assessed: entries[0].whole,
      pending: entries[1].whole,
      unassessed: entries[2].whole,
      notApplicable: entries[3].whole,
    };
  }
}
