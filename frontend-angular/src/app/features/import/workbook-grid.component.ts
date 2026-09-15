import {
  Component,
  HostListener,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * The import data, shown the way the workbook is shaped.
 *
 * WHY THIS REPLACED A LIST. The review and edit tables were long-format: one
 * row per single value, five columns -- period, division, variable, domain,
 * value. A normal sector workbook is ~15 divisions x ~20 variables x 2 periods,
 * so it arrived as ~600 rows in a 26rem box. Every fault an officer is looking
 * for is a fault in the SHAPE of the data -- a column shifted by one, a variable
 * nobody filled in, a period that never came through -- and shape is exactly
 * what a long list destroys. Six hundred rows that each look fine can be a
 * workbook that is entirely wrong.
 *
 * So the grid is the workbook: divisions down, variables across, one tab per
 * period, the division column frozen at the left. A hole in a column is now a
 * hole you can see.
 *
 * TWO MODES, BECAUSE 'BLANK' MEANS TWO THINGS.
 *   preview -- cells the file WOULD write, each with what the database holds
 *              today beside it. A missing cell means the workbook did not carry
 *              that value, which is the thing worth spotting before loading,
 *              and `current` supports new/changed marking.
 *   stored  -- values an import DID write. There is no `current` to compare
 *              against, so nothing is marked new or changed; a missing cell
 *              just means this batch did not write it.
 * Conflating them would have the edit screen paint every stored value as "new".
 *
 * ABSENT IS NEVER ZERO (NFR-10). A cell with no value renders empty and is
 * counted as missing. It is never shown as 0, never sorted as 0, and editing
 * cannot create one: an edit corrects a value the file carried.
 */

/** A variable column, described as the workbook describes it. */
export interface GridColumn {
  code: string;
  name: string;
  domain: string | null;
  unit: string | null;
  /** The entry rule, in the template's own words. */
  hint: string | null;
  order: number;
}

export interface GridDivision {
  code: string;
  name: string;
}

export interface GridCell {
  period: string;
  dsCode: string;
  dsName: string;
  variableCode: string;
  /** What will be written (preview) or what is stored (stored mode). */
  value: number;
  /** What the database holds today. Always null in stored mode. */
  current: number | null;
  /** Stable identity for the parent's edit map -- the parent chooses the
   * spelling, because the two screens key corrections differently: the preview
   * by (period, division, variable), the edit screen by the stored value's id. */
  key: string;
}

type CellState = 'missing' | 'same' | 'new' | 'changed' | 'edited' | 'invalid' | 'added';

interface RenderCell {
  readonly cell: GridCell | null;
  readonly state: CellState;
  readonly shown: number | null;
  readonly title: string;
  /** Identity for a cell the workbook did not carry, so a value typed into it
   * can be keyed exactly like one that was. */
  readonly key: string;
  readonly dsCode: string;
  readonly variableCode: string;
}

@Component({
  selector: 'app-workbook-grid',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './workbook-grid.component.html',
  styleUrl: './workbook-grid.component.scss',
})
export class WorkbookGridComponent {
  readonly cells = input.required<readonly GridCell[]>();
  readonly mode = input<'preview' | 'stored'>('preview');
  readonly editable = input(false);
  /** Corrections the parent holds, keyed by `GridCell.key`. */
  readonly edits = input<Record<string, number>>({});
  /** Render a WEIGHTS tab alongside the periods; its content is projected. */
  readonly showWeightsTab = input(false);
  readonly weightsBadge = input<string | null>(null);
  /** Period tabs that MUST be offered, whether or not they carried values.
   *
   * Deriving the tab strip from the data alone was wrong: a 2026-2030 tab that
   * came through empty simply had no tab, which reads as "that period was fine"
   * when it is the opposite. The file's own tab list is the truth, so the
   * caller passes it and an empty tab renders and says it is empty. */
  readonly tabs = input<readonly string[]>([]);
  /** The column contract: every variable of the profile, in the profile's own
   * order, with the name and entry rule the template prints. Passing this is
   * what lets a column with no values anywhere still appear -- and an empty
   * column is the one most worth seeing. Falls back to the codes found in the
   * data when not supplied. */
  readonly columns = input<readonly GridColumn[]>([]);
  /** Every division of the province, so a division whose row is entirely blank
   * still gets a row to type into. */
  readonly allDivisions = input<readonly GridDivision[]>([]);
  /** Allow typing into a cell the workbook left blank. Preview only: before an
   * import there is a file to add to, afterwards there is only stored data and
   * adding to that belongs on the entry screen. */
  readonly allowAdd = input(false);

  readonly cellEdit = output<{
    /** null when the workbook had no value here -- this is an addition. */
    cell: GridCell | null;
    raw: string;
    key: string;
    dsCode: string;
    variableCode: string;
    period: string;
  }>();

  readonly filter = signal('');
  readonly onlyIssues = signal(false);
  /** Lifts the grid into a fixed overlay filling the viewport. A workbook is
   * 20-odd variables wide and the import page is not; inside the page there is
   * no width to give it. A real second window was the other option and was
   * rejected: it would lose the unsaved corrections held in this component. */
  readonly fullScreen = signal(false);
  /** Narrower columns and smaller type, to fit more variables on one screen. */
  readonly compact = signal(false);
  /** A period tab name, or the literal 'WEIGHTS'. */
  readonly activeTab = signal<string | null>(null);

  readonly periods = computed(() =>
    [...new Set([...this.tabs(), ...this.cells().map((c) => c.period)])].sort(),
  );

  /** A declared tab that carried nothing. Worth saying out loud. */
  readonly tabIsEmpty = computed(() => this.periodCells().length === 0);

  constructor() {
    // Land on the first period whenever the data changes under us -- a re-check
    // or a different batch -- but never yank the tab out from under someone who
    // has chosen one that still exists.
    effect(() => {
      const tabs = this.periods();
      const weights = this.showWeightsTab();
      const current = untracked(this.activeTab);
      const stillThere =
        current !== null && (tabs.includes(current) || (current === 'WEIGHTS' && weights));
      if (!stillThere) this.activeTab.set(tabs[0] ?? (weights ? 'WEIGHTS' : null));
    });
  }

  readonly onWeights = computed(() => this.activeTab() === 'WEIGHTS');

  private readonly periodCells = computed(() => {
    const tab = this.activeTab();
    return this.cells().filter((c) => c.period === tab);
  });

  /** Columns, in the PROFILE's order when the contract was supplied -- which
   * is the order they sit in the workbook. Sorting alphabetically (what this
   * did before) silently reordered every file relative to the thing it is
   * meant to mirror. Only falls back to sorted codes from the data when no
   * contract came through. */
  readonly variables = computed<readonly GridColumn[]>(() => {
    const cols = this.columns();
    if (cols.length) return [...cols].sort((a, b) => a.order - b.order);
    return [...new Set(this.periodCells().map((c) => c.variableCode))]
      .sort()
      .map((code, i) => ({ code, name: code, domain: null, unit: null, hint: null, order: i }));
  });

  readonly variableCodes = computed(() => this.variables().map((v) => v.code));

  readonly divisions = computed<readonly GridDivision[]>(() => {
    const all = this.allDivisions();
    if (all.length) return [...all].sort((a, b) => a.name.localeCompare(b.name));
    const byCode = new Map<string, string>();
    for (const c of this.periodCells()) byCode.set(c.dsCode, c.dsName);
    return [...byCode.entries()]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  private readonly index = computed(() => {
    const m = new Map<string, GridCell>();
    for (const c of this.periodCells()) m.set(c.dsCode + ' ' + c.variableCode, c);
    return m;
  });

  private state(cell: GridCell | null, key: string): CellState {
    const edited = this.edits()[key];
    if (!cell) return edited === undefined ? 'missing' : 'added';
    const v = edited ?? cell.value;
    if (!Number.isFinite(v)) return 'invalid';
    if (edited !== undefined) return 'edited';
    if (this.mode() === 'stored') return 'same';
    if (cell.current === null) return 'new';
    return cell.current === cell.value ? 'same' : 'changed';
  }

  /** The key an empty cell would use -- the same (period, division, variable)
   * spelling the parent gives a cell that exists, so an addition and a
   * correction travel the same way. */
  private emptyKey(dsCode: string, variableCode: string): string {
    return this.activeTab() + '|' + dsCode + '|' + variableCode;
  }

  readonly visibleDivisions = computed(() => {
    const term = this.filter().trim().toLowerCase();
    const idx = this.index();
    const vars = this.variables();
    return this.divisions().filter((d) => {
      if (term && !(d.name + ' ' + d.code).toLowerCase().includes(term)) return false;
      if (!this.onlyIssues()) return true;
      return vars.some((col) => {
        const key = this.emptyKey(d.code, col.code);
        const s = this.state(idx.get(d.code + ' ' + col.code) ?? null, key);
        return s === 'missing' || s === 'changed' || s === 'new' || s === 'invalid';
      });
    });
  });

  /** The whole grid, built once per (data, tab, edits) rather than per cell --
   * a template calling a method per cell rebuilds it on every change-detection
   * pass, which on a 15 x 20 grid is 300 recomputations for one keystroke. */
  readonly grid = computed<readonly (readonly RenderCell[])[]>(() => {
    const idx = this.index();
    const vars = this.variables();
    const edits = this.edits();
    return this.visibleDivisions().map((d) =>
      vars.map((col) => {
        const v = col.code;
        const cell = idx.get(d.code + ' ' + v) ?? null;
        const key = cell ? cell.key : this.emptyKey(d.code, v);
        const state = this.state(cell, key);
        const shown = cell ? (edits[key] ?? cell.value) : (edits[key] ?? null);
        let title = '';
        if (!cell && state === 'added') title = 'added here -- this cell was blank in the workbook';
        else if (!cell) title = d.name + ' has no value for ' + col.name + ' in this period';
        else if (state === 'changed') title = 'was ' + cell.current + ', will be written as ' + shown;
        else if (state === 'new') title = 'new -- nothing in the database for this cell yet';
        else if (state === 'edited') title = 'corrected here from ' + cell.value;
        return { cell, state, shown, title, key, dsCode: d.code, variableCode: v } as RenderCell;
      }),
    );
  });

  /** Per-column issue count. This is the number that makes a shifted column
   * obvious: one variable reading 15 missing out of 15 divisions, while its
   * neighbours read 0, is a column nobody filled in -- or filled in one column
   * to the left. */
  readonly columnIssues = computed(() => {
    const idx = this.index();
    const divs = this.divisions();
    const preview = this.mode() === 'preview';
    const edits = this.edits();
    return this.variables().map((col) => {
      let missing = 0;
      let changed = 0;
      for (const d of divs) {
        const c = idx.get(d.code + ' ' + col.code) ?? null;
        if (!c) {
          if (edits[this.emptyKey(d.code, col.code)] === undefined) missing++;
        } else if (preview && c.current !== null && c.current !== c.value) changed++;
      }
      return { column: col, missing, changed, total: divs.length };
    });
  });

  readonly totalMissing = computed(() => this.columnIssues().reduce((a, c) => a + c.missing, 0));
  readonly filled = computed(() => this.periodCells().length);
  readonly expected = computed(() => this.divisions().length * this.variables().length);
  readonly addedCount = computed(() => {
    const idx = this.index();
    return Object.keys(this.edits()).filter((k) => {
      const p = k.split('|');
      return p[0] === this.activeTab() && !idx.has(p[1] + ' ' + p[2]);
    }).length;
  });

  /** Esc leaves full screen. Bound on the host so it works wherever focus is
   * inside the grid, and ignored when not expanded so it never swallows an Esc
   * the rest of the page wanted. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.fullScreen()) this.fullScreen.set(false);
  }

  /** One output for both acts. A correction carries the cell it came from; an
   * addition carries the identity of a cell that does not exist yet, which the
   * parent turns into the same (period, division, variable) key. */
  onEdit(rc: RenderCell, raw: string): void {
    this.cellEdit.emit({
      cell: rc.cell,
      raw,
      key: rc.key,
      dsCode: rc.dsCode,
      variableCode: rc.variableCode,
      period: this.activeTab() ?? '',
    });
  }

  /** Column headers show the variable code IN FULL, wrapped over as many lines
   * as it needs, in small type. It used to be truncated at 18 characters with
   * an ellipsis, which defeated the point of the header: the codes differ at
   * the END (..._1974_TO_2004 vs ..._2005_TO_2022), so the truncated forms of
   * two different variables were identical on screen. Small and wrapped beats
   * large and cut off. */
  /** Everything the template's sub-header says, for the cell tooltip. */
  fullTitle(c: GridColumn): string {
    const bits = [c.domain ? c.domain + ': ' + c.name : c.name];
    if (c.unit) bits.push('(' + c.unit + ')');
    if (c.hint) bits.push('\u00bb ' + c.hint);
    bits.push('[' + c.code + ']');
    return bits.join('  ');
  }

  label(code: string): string {
    // Break on the underscores so the wrap lands between words rather than
    // mid-token. A zero-width space is invisible and is not copied as a space.
    return code.replace(/_/g, '_\u200b');
  }
}
