import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  imports: [FormsModule, DatePipe],
  templateUrl: './import-page.component.html',
  styleUrl: './import-page.component.scss',
})
export class ImportPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
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

  constructor() {
    effect(() => {
      const t = this.taxonomy();
      if (!t || this.sector() !== undefined) return;
      this.province.set(t.provinces[0]?.code);
      this.sector.set(t.sectors[0]?.code);
      this.subsector.set(t.sectors[0]?.subsectors[0]?.code);
      this.hazard.set(this.hazards()[0]?.code);
    });
  }

  ngOnInit(): void {
    this.taxonomyService.load();
    this.loadBatches();
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

    this.busy.set(true);
    this.report.set(null);
    this.failure.set(null);

    this.http
      .post<ImportReport>(`${this.base}/import/${action}`, body, { withCredentials: true })
      .subscribe({
        next: (r) => {
          this.report.set(r);
          this.busy.set(false);
          if (action === 'load') this.loadBatches();
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

  private loadBatches(): void {
    this.http
      .get<BatchRow[]>(`${this.base}/import/batches?limit=15`, { withCredentials: true })
      .subscribe({ next: (b) => this.batches.set(b), error: () => this.batches.set([]) });
  }
}
