import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ProfileScope } from '../../core/models/profile.model';
import { scopeToQueryParams } from '../../core/models/query-param.util';
import { ApiClientService } from '../../core/services/api-client.service';
import { AuthService } from '../../core/services/auth.service';
import { WeightRow } from './import-page.component';

/**
 * The workbook's WEIGHTS tab -- read, diffed against what the profile holds,
 * and editable in place.
 *
 * WHY IT EXISTS. Every generated template carries a WEIGHTS tab whose
 * instruction line has always said "on upload the importer READS this tab and
 * pre-fills the confirmation screen". Nothing read it. A panel could agree a
 * split, type it into the yellow column, upload the file, and have the numbers
 * go nowhere -- with the sheet still telling them it had worked.
 *
 * WHY IT IS EDITABLE HERE. It used to be read-only with a link to the separate
 * weights editor. That is a screen change, a re-pick of province/sector/hazard
 * and a loss of the place you were in, to type numbers you are already looking
 * at. The numbers are right here and so is the profile they belong to.
 *
 * WHAT DID NOT CHANGE IS WHO WRITES THEM. Save calls
 * `PUT /profiles/{scope}/weights` -- the same endpoint the standalone editor
 * calls, landing in the same `save_profile_weights()`, which mints a new
 * profile version per save and keeps the history. This is a second DOOR onto
 * the audited path, never a second path. Nothing here writes a weight itself,
 * and the importer still never writes one at all.
 *
 * TOTALS WARN, THEY DO NOT BLOCK -- until you save. A domain that does not
 * reach 100, or a variable left unweighted, is shown as a warning while you
 * work, because an unfinished weights tab is the normal mid-panel state. Save
 * is disabled until both domains are whole, because a profile that does not
 * total 100 is not computable and `v_profile_readiness` will refuse it anyway
 * -- better to say so here than to accept the save and fail later.
 */
@Component({
  selector: 'app-weights-confirm',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './weights-confirm.component.html',
  styleUrl: './weights-confirm.component.scss',
})
export class WeightsConfirmComponent {
  private readonly api = inject(ApiClientService);
  private readonly auth = inject(AuthService);

  readonly weights = input.required<readonly WeightRow[]>();
  readonly tabPresent = input(false);
  readonly scope = input<ProfileScope | null>(null);
  /** 'import' = a file being checked, whose WEIGHTS tab we just read.
   * 'stored'  = a batch opened from the list; weights are not part of an
   *             import, so the tab explains that rather than being hidden. */
  readonly context = input<'import' | 'stored'>('import');

  /** Weights typed here, by variable code. Held apart from the workbook's
   * proposals so "what the file said" survives editing and Reset is a discard
   * rather than a reload. */
  readonly draft = signal<Record<string, number | null>>({});
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly savedVersion = signal<number | null>(null);

  readonly editorLink = computed(() => {
    const s = this.scope();
    return s ? scopeToQueryParams(s) : null;
  });

  /** Only variables the profile actually carries can be weighted. */
  readonly rows = computed(() => this.weights().filter((w) => w.inProfile));
  readonly unknown = computed(() => this.weights().filter((w) => !w.inProfile));

  /** The number in play for a variable: what has been typed, else what the
   * workbook proposed, else what is saved. Blank stays blank throughout --
   * an unweighted variable is undecided, and 0 is a different statement. */
  value(w: WeightRow): number | null {
    const d = this.draft()[w.variableCode];
    if (d !== undefined) return d;
    return w.proposedPct ?? w.currentPct;
  }

  rowsFor(domain: string): readonly WeightRow[] {
    return domain === 'hazard'
      ? this.rows().filter((w) => w.domain === 'hazard')
      : this.rows().filter((w) => !!w.domain && w.domain !== 'hazard');
  }

  total(domain: string): number {
    const t = this.rowsFor(domain).reduce((sum, w) => sum + (this.value(w) ?? 0), 0);
    return Math.round(t * 1000) / 1000;
  }

  unweighted(domain: string): number {
    return this.rowsFor(domain).filter((w) => this.value(w) === null).length;
  }

  /** Whole = reaches 100 AND every variable in it carries a number. Nine
   * variables summing to 100 over six of them is not a finished split, and a
   * bare total would hide that. */
  whole(domain: string): boolean {
    if (this.rowsFor(domain).length === 0) return true;
    return Math.abs(this.total(domain) - 100) < 0.01 && this.unweighted(domain) === 0;
  }

  readonly domains = computed(() =>
    ['hazard', 'exposure'].filter((d) => this.rowsFor(d).length > 0),
  );

  readonly canSave = computed(
    () => !!this.scope() && this.rows().length > 0 && this.domains().every((d) => this.whole(d)),
  );

  readonly dirty = computed(() => Object.keys(this.draft()).length > 0);

  readonly wouldChange = computed(
    () => this.rows().filter((w) => this.value(w) !== w.currentPct).length,
  );

  onWeight(w: WeightRow, raw: string): void {
    const next = { ...this.draft() };
    const t = raw.trim();
    if (t === '') next[w.variableCode] = null;
    else {
      const n = Number(t);
      if (Number.isNaN(n)) return;
      next[w.variableCode] = n;
    }
    this.draft.set(next);
    this.savedVersion.set(null);
  }

  /** Spread what is left of 100 evenly over the unweighted variables of a
   * domain. A convenience for a first pass, not a policy: an equal split is a
   * decision the panel is making, and they can type over any of it. */
  fillEvenly(domain: string): void {
    const rows = this.rowsFor(domain);
    const blanks = rows.filter((w) => this.value(w) === null);
    if (blanks.length === 0) return;
    const used = rows.reduce((s, w) => s + (this.value(w) ?? 0), 0);
    const each = Math.round(((100 - used) / blanks.length) * 100) / 100;
    if (each <= 0) return;
    const next = { ...this.draft() };
    for (const w of blanks) next[w.variableCode] = each;
    this.draft.set(next);
  }

  reset(): void {
    this.draft.set({});
    this.saveError.set(null);
    this.savedVersion.set(null);
  }

  label(status: string): string {
    switch (status) {
      case 'same':
        return 'unchanged';
      case 'changed':
        return 'differs from saved';
      case 'new':
        return 'no saved weight yet';
      case 'blank':
        return 'not proposed';
      default:
        return 'not in this profile';
    }
  }

  save(): void {
    const scope = this.scope();
    if (!scope || !this.canSave()) return;
    this.saving.set(true);
    this.saveError.set(null);

    // A decision is recorded against a person, and here that is whoever is
    // signed in -- they are the one making it. The standalone editor asks for a
    // name because a panel session is often typed up by someone on behalf of
    // the room; this is one officer confirming what a file proposed.
    const decidedBy = this.auth.currentUser()?.full_name ?? '';

    const decide = (w: WeightRow) => ({
      indicatorCode: w.variableCode,
      weightPct: this.value(w),
      decidedBy,
      // Typing a weight IS the decision to include the variable. Exclusion --
      // 'rejected', a weight of none rather than a weight of zero -- stays in
      // the full editor, where the note and the reasoning belong with it.
      consensus: 'agreed' as const,
    });

    this.api
      .saveProfileWeights(scope, {
        hazardVariables: this.rowsFor('hazard').map(decide),
        exposureVariables: this.rowsFor('exposure').map(decide),
        panelNote: 'confirmed from the import review screen',
      })
      .subscribe({
        next: (weights) => {
          this.savedVersion.set(weights.profileVersion);
          this.draft.set({});
          this.saving.set(false);
        },
        error: (err: { message?: string }) => {
          this.saveError.set(err?.message ?? 'The weights could not be saved.');
          this.saving.set(false);
        },
      });
  }
}
