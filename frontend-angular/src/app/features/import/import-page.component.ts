import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import { TaxonomyService } from '../../core/services/taxonomy.service';

/**
 * Import tab — pick the scope, check the file, then load it.
 *
 * TWO BUTTONS ON PURPOSE. "Check" runs the identical server code path as
 * "Load" and stops before the last statement, so what it reports is what will
 * happen. A validator written separately from the loader eventually disagrees
 * with it, and the disagreement shows up as "it passed the check and then
 * failed to load", which destroys confidence in both.
 *
 * TWO KINDS OF WORKBOOK. A sector workbook is one sector x hazard x province.
 * A CLIMATE workbook is one province and no sector: it carries the hazard
 * variables every sector shares, so that they are entered once by the officer
 * who owns them instead of ~13 times inside sector files, where the last import
 * silently overwrote all the others. Choosing "Climate" hides the sector and
 * hazard pickers because there is nothing for them to mean.
 *
 * THE SCOPE PICKERS ARE A CROSS-CHECK, NOT ROUTING. The workbook's hidden
 * `_META` says which profile it is for, and that is what the server uses. The
 * selection here is compared against it and a mismatch is refused. Uploading
 * the right file under the wrong sector is an easy slip and an expensive one:
 * the values would key to real divisions under a real profile and look
 * entirely plausible afterwards.
 *
 * NOTHING LOADS PARTIALLY. Any error means the file loaded nothing, and every
 * error comes back together rather than one at a time (FR-2.3).
 */
export interface PreviewRow {
  period: string;
  dsCode: string;
  dsName: string;
  variableCode: string;
  value: number;
  /** What the database holds for this cell today. null = a new fact. */
  current: number | null;
  edited: boolean;
}

export interface ImportReport {
  filename: string;
  profileCode: string | null;
  dryRun: boolean;
  ok: boolean;
  valuesRead: number;
  valuesLoaded: number;
  divisions: number;
  batchId: number | null;
  errors: string[];
  warnings: string[];
  /** Populated on a check only. */
  rows: PreviewRow[];
  editsApplied: number;
}

export interface ProfileOutcome {
  profileCode: string;
  ok: boolean;
  scored: number;
  unassessed: string[];
  refusal: string | null;
}

export interface RecomputeReport {
  province: string;
  period: string;
  computed: number;
  refused: number;
  resultRows: number;
  profiles: ProfileOutcome[];
}

export interface StalenessReport {
  province: string;
  lastValueChange: string | null;
  lastComputed: string | null;
  stale: boolean;
  reason: string;
}

export interface BatchRow {
  id: number;
  filename: string;
  profileCode: string | null;
  status: string;
  rowsTotal: number | null;
  rowsLoaded: number | null;
  errorCount: number;
  uploadedAt: string;
  uploadedBy: string | null;
}

@Component({
  selector: 'app-import-page',
  standalone: true,
  // DatePipe is used by the recent-imports table. A standalone component must
  // import every pipe its template uses; `tsc --noEmit` does not check
  // templates, so a missing one surfaces only at `ng build`.
  imports: [FormsModule, DatePipe, RouterLink],
  templateUrl: './import-page.component.html',
  styleUrl: './import-page.component.scss',
})
export class ImportPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly taxonomyService = inject(TaxonomyService);
  private readonly base = environment.apiBaseUrl;

  readonly taxonomy = this.taxonomyService.taxonomy;
  readonly taxonomyError = this.taxonomyService.error;

  /** 'sector' = one sector x hazard workbook. 'climate' = the province-wide
   * hazard-variable workbook. The server reads the kind from the file's _META
   * regardless; this only decides what the form asks for and sends. */
  readonly kind = signal<'sector' | 'climate'>('sector');

  readonly province = signal<string | undefined>(undefined);
  readonly sector = signal<string | undefined>(undefined);
  readonly subsector = signal<string | undefined>(undefined);
  readonly hazard = signal<string | undefined>(undefined);
  readonly file = signal<File | null>(null);

  readonly busy = signal(false);
  readonly report = signal<ImportReport | null>(null);

  // ---- review before writing -------------------------------------------
  /** Corrections keyed "period|dsCode|variableCode". Held apart from the
   * preview rows so re-running Check does not discard what has been corrected,
   * and so the payload is exactly the set of deliberate changes. */
  readonly edits = signal<Record<string, number>>({});
  readonly showOnlyChanges = signal(false);
  readonly rowFilter = signal('');

  readonly previewRows = computed(() => this.report()?.rows ?? []);
  readonly changedCount = computed(
    () => this.previewRows().filter((r) => r.current !== null && r.current !== r.value).length,
  );
  readonly newCount = computed(() => this.previewRows().filter((r) => r.current === null).length);
  readonly editCount = computed(() => Object.keys(this.edits()).length);

  readonly visibleRows = computed(() => {
    const term = this.rowFilter().trim().toLowerCase();
    return this.previewRows().filter((r) => {
      if (this.showOnlyChanges() && r.current !== null && r.current === r.value) return false;
      if (!term) return true;
      return (r.dsName + ' ' + r.dsCode + ' ' + r.variableCode).toLowerCase().includes(term);
    });
  });

  // ---- recompute --------------------------------------------------------
  readonly period = signal<string | undefined>(undefined);
  readonly periods = computed(() => this.taxonomy()?.periods ?? []);
  readonly staleness = signal<StalenessReport | null>(null);
  readonly recomputing = signal(false);
  readonly recomputeReport = signal<RecomputeReport | null>(null);
  readonly recomputeError = signal<string | null>(null);
  readonly failure = signal<string | null>(null);
  readonly batches = signal<BatchRow[]>([]);

  readonly provinces = computed(() => this.taxonomy()?.provinces ?? []);
  readonly sectors = computed(() => this.taxonomy()?.sectors ?? []);
  /** Narrowed to hazards a profile exists for, same as the map's filter bar —
   * an import scope that cannot exist is refused by the server anyway, so
   * offering it here only wastes an upload. */
  readonly hazards = computed(() => {
    const all = this.taxonomy()?.hazards ?? [];
    const sector = this.sectors().find((s) => s.code === this.sector());
    if (!sector) return all;
    const sub = sector.subsectors.find((x) => x.code === this.subsector());
    const allowed = sub ? sub.hazards : sector.hazards;
    // FAIL OPEN, NOT SHUT. An API that has not been restarted still serves the
    // old taxonomy, which carries no per-subsector hazard list. Narrowing
    // against a missing list yielded an EMPTY dropdown -- no hazard could be
    // chosen, so no query was ever sent and the map stayed blank with nothing
    // saying why. Offering all three is the previous behaviour: at worst a
    // combination 404s and says so, which is a far better failure than a
    // control that cannot be used.
    if (!allowed || allowed.length === 0) return all;
    const set = new Set(allowed);
    return all.filter((h) => set.has(h.code));
  });
  readonly subsectorOptions = computed(
    () => this.sectors().find((s) => s.code === this.sector())?.subsectors ?? [],
  );

  /** Names rather than codes: the scope check compares against `_META`, which
   * carries the names the generator wrote into the workbook. */
  private readonly nameOf = computed(() => {
    const t = this.taxonomy();
    return {
      province: t?.provinces.find((p) => p.code === this.province())?.name,
      sector: t?.sectors.find((s) => s.code === this.sector())?.name,
      subsector: this.subsectorOptions().find((s) => s.code === this.subsector())?.name,
      hazard: t?.hazards.find((h) => h.code === this.hazard())?.name,
    };
  });

  readonly canSubmit = computed(() => {
    if (!this.file() || !this.province() || this.busy()) return false;
    // A climate file has no sector or hazard to require.
    return this.kind() === 'climate' || (!!this.sector() && !!this.hazard());
  });

  /** Where "Back" goes. The weights editor and the context selector both link
   * here carrying `from`, so back returns to whichever one sent you rather than
   * to a fixed page you may never have visited. */
  readonly backTarget = computed(() =>
    this.route.snapshot.queryParams['from'] === 'weights' ? '/weights' : '/entry',
  );
  readonly backLabel = computed(() =>
    this.backTarget() === '/weights' ? 'Back to weights' : 'Back to data entry',
  );
  /** The scope this page is working in, so Back does not drop it either. */
  readonly backParams = computed(() => {
    const { province, sector, subsector, hazard, period } = this.route.snapshot.queryParams;
    return { province, sector, subsector, hazard, period };
  });

  constructor() {
    effect(() => {
      const t = this.taxonomy();
      if (!t || this.sector() !== undefined) return;
      // THE URL WINS OVER THE DEFAULTS. /weights and /entry both link here with
      // the scope already chosen; ignoring it meant an officer who had just
      // settled a profile's weights had to re-pick province, sector, subsector
      // and hazard from scratch before they could load the data those weights
      // score. Anything the URL does not carry still falls back to the first
      // option, so a bare /import behaves exactly as before.
      const q = this.route.snapshot.queryParams;
      const known = <T extends { code: string }>(list: readonly T[], code: unknown) =>
        typeof code === 'string' && list.some((x) => x.code === code) ? code : undefined;

      this.province.set(known(t.provinces, q['province']) ?? t.provinces[0]?.code);
      const sector = known(t.sectors, q['sector']) ?? t.sectors[0]?.code;
      this.sector.set(sector);
      const subs = t.sectors.find((x) => x.code === sector)?.subsectors ?? [];
      this.subsector.set(known(subs, q['subsector']) ?? subs[0]?.code);
      this.hazard.set(known(this.hazards(), q['hazard']) ?? this.hazards()[0]?.code);

      // A climate workbook has no sector, so a scope arriving from the weights
      // editor is by definition a sector import.
      if (q['kind'] === 'climate') this.kind.set('climate');
    });
  }

  ngOnInit(): void {
    this.taxonomyService.load();
    this.loadBatches();
    this.refreshStaleness();
  }

  onSectorChange(code: string): void {
    this.sector.set(code || undefined);
    this.subsector.set(this.subsectorOptions()[0]?.code);
    this.keepHazardValid();
  }

  onSubsectorChange(code: string): void {
    this.subsector.set(code || undefined);
    this.keepHazardValid();
  }

  private keepHazardValid(): void {
    const options = this.hazards();
    if (!options.some((h) => h.code === this.hazard())) {
      this.hazard.set(options[0]?.code);
    }
  }

  onKindChange(kind: 'sector' | 'climate'): void {
    this.kind.set(kind);
    // A report about the previous kind of file would be read as being about
    // this one.
    this.report.set(null);
    this.failure.set(null);
  }

  onFileSelected(event: Event): void {
    this.file.set((event.target as HTMLInputElement).files?.[0] ?? null);
    this.report.set(null);
    this.failure.set(null);
    // Corrections belong to the file they were made against.
    this.edits.set({});
  }

  rowKey(r: PreviewRow): string {
    return r.period + '|' + r.dsCode + '|' + r.variableCode;
  }

  /** The number that will actually be written for a row. */
  effectiveValue(r: PreviewRow): number {
    const e = this.edits()[this.rowKey(r)];
    return e === undefined ? r.value : e;
  }

  isEdited(r: PreviewRow): boolean {
    return this.edits()[this.rowKey(r)] !== undefined;
  }

  onCellEdit(r: PreviewRow, raw: string): void {
    const key = this.rowKey(r);
    const next = { ...this.edits() };
    const n = Number(raw);
    if (raw.trim() === '' || Number.isNaN(n) || n === r.value) {
      // Typing the workbook's own number back is not a correction, so it does
      // not travel as one -- otherwise every visited cell would be marked
      // "corrected during import review" in the audit trail.
      delete next[key];
    } else {
      next[key] = n;
    }
    this.edits.set(next);
  }

  clearEdits(): void {
    this.edits.set({});
  }

  check(): void {
    this.submit('check');
  }

  load(): void {
    this.submit('load');
  }

  private submit(action: 'check' | 'load'): void {
    const file = this.file();
    if (!file) return;
    const n = this.nameOf();

    const body = new FormData();
    body.append('file', file, file.name);
    if (n.province) body.append('province', n.province);
    // Sending a stale sector for a climate file would be refused by the server,
    // correctly -- the file names no sector to match it against.
    if (this.kind() === 'sector') {
      if (n.sector) body.append('sector', n.sector);
      if (n.subsector) body.append('subsector', n.subsector);
      if (n.hazard) body.append('hazard', n.hazard);
    }

    // Corrections ride with BOTH check and load, so the check the reviewer
    // reads is the check of what will actually be written -- a preview of the
    // uncorrected file would be a preview of something nobody intends to load.
    const edits = this.edits();
    const keys = Object.keys(edits);
    if (keys.length) {
      body.append(
        'edits',
        JSON.stringify(
          keys.map((k) => {
            const [period, dsCode, variableCode] = k.split('|');
            return { period, dsCode, variableCode, value: edits[k] };
          }),
        ),
      );
    }

    this.busy.set(true);
    this.report.set(null);
    this.failure.set(null);

    this.http
      .post<ImportReport>(`${this.base}/import/${action}`, body, { withCredentials: true })
      .subscribe({
        next: (r) => {
          this.report.set(r);
          this.busy.set(false);
          if (action === 'load') {
            this.loadBatches();
            this.edits.set({});
            // The map still shows the old scores until the engine runs, and
            // nothing on screen would otherwise say so.
            this.refreshStaleness();
          }
        },
        error: (err) => {
          // 401 is the common one and deserves plain words: importing writes
          // data, so it needs a signed-in account even though the map does not.
          this.failure.set(
            err?.status === 401
              ? 'You need to be signed in to import. The map is public; writing data is not.'
              : (err?.error?.detail ?? err?.message ?? 'The import could not be completed.'),
          );
          this.busy.set(false);
        },
      });
  }

  refreshStaleness(): void {
    const province = this.nameOf().province;
    if (!province) return;
    this.http
      .get<StalenessReport>(`${this.base}/compute/status?province=${encodeURIComponent(province)}`, {
        withCredentials: true,
      })
      .subscribe({ next: (s) => this.staleness.set(s), error: () => this.staleness.set(null) });
  }

  recompute(): void {
    const province = this.nameOf().province;
    const period = this.period() ?? this.periods()[0];
    if (!province || !period) return;

    this.recomputing.set(true);
    this.recomputeError.set(null);
    this.recomputeReport.set(null);

    this.http
      .post<RecomputeReport>(
        `${this.base}/compute/run`,
        { province, period },
        { withCredentials: true },
      )
      .subscribe({
        next: (r) => {
          this.recomputeReport.set(r);
          this.recomputing.set(false);
          this.refreshStaleness();
        },
        error: (err) => {
          this.recomputeError.set(
            err?.error?.detail ?? err?.message ?? 'The recompute could not be completed.',
          );
          this.recomputing.set(false);
        },
      });
  }

  private loadBatches(): void {
    this.http
      .get<BatchRow[]>(`${this.base}/import/batches?limit=15`, { withCredentials: true })
      .subscribe({ next: (b) => this.batches.set(b), error: () => this.batches.set([]) });
  }
}
