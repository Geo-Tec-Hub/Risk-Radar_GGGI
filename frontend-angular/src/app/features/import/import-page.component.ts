import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
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
  /** The server scopes this list to the reader's province, so this is here for
   * the administrator's view, where several provinces appear at once. */
  province: string | null;
}

/** One stored value an import wrote, as it stands today. `id` is the value's
 * own id and is what a correction names: an edit changes a fact this batch
 * wrote and cannot introduce a new one. */
export interface ValueRow {
  id: number;
  dsCode: string;
  dsName: string;
  variableCode: string;
  domain: string;
  value: number;
  period: string;
}

export interface BatchDetail {
  id: number;
  filename: string;
  profileCode: string | null;
  status: string;
  province: string | null;
  uploadedAt: string;
  uploadedBy: string | null;
  /** Whether THIS reader may correct it, decided by the server from the same
   * grant that governs uploading. The server checks again on the way in. */
  editable: boolean;
  values: ValueRow[];
}

export interface CorrectionReport {
  updated: number;
  province: string | null;
  recomputeNeeded: boolean;
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
  private readonly auth = inject(AuthService);
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

  // ---- the opened dataset ----------------------------------------------
  readonly openBatchId = signal<number | null>(null);
  readonly detail = signal<BatchDetail | null>(null);
  readonly detailError = signal<string | null>(null);
  readonly detailFilter = signal('');
  readonly editing = signal(false);
  readonly saving = signal(false);
  /** Corrections keyed by the stored value's id. */
  readonly valueEdits = signal<Record<number, number>>({});
  readonly correction = signal<CorrectionReport | null>(null);
  readonly valueEditCount = computed(() => Object.keys(this.valueEdits()).length);

  readonly detailRows = computed(() => {
    const term = this.detailFilter().trim().toLowerCase();
    const rows = this.detail()?.values ?? [];
    if (!term) return rows;
    return rows.filter((r) =>
      (r.dsName + ' ' + r.dsCode + ' ' + r.variableCode).toLowerCase().includes(term),
    );
  });

  readonly provinces = computed(() => this.taxonomy()?.provinces ?? []);

  /**
   * A data officer or expert is bound to one province (SRS 3.2), so the picker
   * is pre-set and locked for them. Carried over from the Data entry screen
   * this tab absorbed: without it the form invites a choice the server will
   * refuse, and the refusal arrives only after the file has been uploaded.
   * Administrators are national by the same rule and stay free; reading is
   * never locked anywhere.
   */
  readonly provinceLocked = computed(
    () => this.auth.hasRole('data_officer') || this.auth.hasRole('expert'),
  );

  /** The account's province as a TAXONOMY CODE. The auth service answers with
   * the name it matched in the shared province list, and this form speaks
   * codes; comparing loosely because the two lists spell 'Northwestern'
   * differently and always have. */
  private readonly lockedProvinceCode = computed(() => {
    const name = this.auth.matchProvinceOption();
    if (!name) return undefined;
    const flat = (x: string) => x.toLowerCase().replace(/[^a-z]/g, '');
    return this.provinces().find((p) => flat(p.name) === flat(name))?.code;
  });
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
    this.route.snapshot.queryParams['from'] === 'weights' ? '/weights' : '/map',
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
    // AuthService.refreshMe() resolves after this component may have mounted,
    // so the lock is re-applied when the account settles rather than only at
    // construction -- a direct navigation to /import on page load loses that
    // race otherwise.
    effect(() => {
      if (!this.provinceLocked()) return;
      const code = this.lockedProvinceCode();
      if (code && this.province() !== code) this.province.set(code);
    });

    // Keep the recent-imports list on the province being looked at. Reading
    // the signal here is what subscribes to it; loadBatches() is untracked so
    // its own reads cannot re-trigger this.
    effect(() => {
      this.province();
      if (this.taxonomy()) untracked(() => this.loadBatches());
    });

    effect(() => {
      const t = this.taxonomy();
      if (!t || this.sector() !== undefined) return;
      // THE URL WINS OVER THE DEFAULTS. /weights links here with
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

  // ---- one loaded dataset ----------------------------------------------
  /**
   * Opening a batch shows what it actually wrote, not what the file said. The
   * two can differ -- a later import supersedes an earlier one -- and the
   * question being asked here is always "what is in the database now".
   *
   * EDITING IS OFF UNTIL IT IS TURNED ON. Every row is an editable number the
   * moment the table renders, and a table you can change by clicking in it is
   * a table you can change by accident. The toggle is the deliberate act.
   */
  openBatch(id: number): void {
    if (this.openBatchId() === id) {
      this.closeBatch();
      return;
    }
    this.openBatchId.set(id);
    this.detail.set(null);
    this.detailError.set(null);
    this.editing.set(false);
    this.valueEdits.set({});
    this.correction.set(null);
    this.http
      .get<BatchDetail>(`${this.base}/import/batches/${id}`, { withCredentials: true })
      .subscribe({
        next: (d) => this.detail.set(d),
        error: (err) =>
          this.detailError.set(
            err?.error?.detail ?? err?.message ?? 'That import could not be opened.',
          ),
      });
  }

  closeBatch(): void {
    this.openBatchId.set(null);
    this.detail.set(null);
    this.editing.set(false);
    this.valueEdits.set({});
  }

  toggleEditing(): void {
    const on = !this.editing();
    this.editing.set(on);
    if (!on) this.valueEdits.set({});
  }

  /** A corrected cell is held apart from the row it came from, so "changed"
   * stays visible and Cancel is a discard rather than a reload. A value typed
   * back to what it already was is dropped rather than sent. */
  editValue(row: ValueRow, raw: string): void {
    const n = Number(raw);
    const next = { ...this.valueEdits() };
    if (raw.trim() === '' || Number.isNaN(n) || n === row.value) delete next[row.id];
    else next[row.id] = n;
    this.valueEdits.set(next);
  }

  saveCorrections(): void {
    const d = this.detail();
    const edits = this.valueEdits();
    const ids = Object.keys(edits);
    if (!d || ids.length === 0) return;
    this.saving.set(true);
    this.detailError.set(null);
    this.http
      .put<CorrectionReport>(
        `${this.base}/import/batches/${d.id}/values`,
        { edits: ids.map((k) => ({ id: Number(k), value: edits[Number(k)] })) },
        { withCredentials: true },
      )
      .subscribe({
        next: (r) => {
          this.correction.set(r);
          this.saving.set(false);
          this.valueEdits.set({});
          this.editing.set(false);
          // Re-read rather than patching the rows in memory: what the server
          // stored is the answer, and a table that shows the edit while the
          // save silently failed is the worst of both.
          this.openBatchId.set(null);
          this.openBatch(d.id);
          // The map still shows the old score until the engine runs.
          this.refreshStaleness();
        },
        error: (err) => {
          this.detailError.set(
            err?.error?.detail ?? err?.message ?? 'The corrections could not be saved.',
          );
          this.saving.set(false);
        },
      });
  }

  /**
   * The server already scopes this list to the reader's own province, so for a
   * data officer or expert the province parameter changes nothing. It is here
   * for an administrator, who has no province of their own and would otherwise
   * face every province's imports at once: the scope picker above is what they
   * are already thinking in, so the list follows it.
   */
  private loadBatches(): void {
    const province = this.nameOf().province;
    const q = province ? `?limit=15&province=${encodeURIComponent(province)}` : '?limit=15';
    this.closeBatch();
    this.http
      .get<BatchRow[]>(`${this.base}/import/batches${q}`, { withCredentials: true })
      .subscribe({ next: (b) => this.batches.set(b), error: () => this.batches.set([]) });
  }
}
