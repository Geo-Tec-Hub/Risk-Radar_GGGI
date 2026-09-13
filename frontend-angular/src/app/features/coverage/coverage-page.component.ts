import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import { PERIODS } from '../../core/models/reference-data.model';
import { TaxonomyService } from '../../core/services/taxonomy.service';

/**
 * Coverage -- FR-5.17, "where is data missing, by province and profile".
 *
 * THE QUESTION THIS ANSWERS is why a province is not on the map, and the
 * answer is one of three quite different things: the weights are unfinished,
 * the values have not all arrived, or both are fine and nobody has recomputed.
 * Reading them off the map is impossible -- an unassessed division looks the
 * same whichever it is -- and the difference decides who has to do something.
 *
 * THE SERVER DECIDES THE STATUS, NOT THIS SCREEN. The rules it applies are the
 * engine's own (v_profile_readiness, "a division missing any weighted variable
 * is unassessed"), so a second opinion computed in the browser would eventually
 * disagree with the thing it is describing. Here we render what it says.
 *
 * PERIODS COME FROM THE CONSTANT, NOT THE TAXONOMY. /reference/taxonomy lists
 * only periods that already hold RESULTS -- correct for the map, useless here,
 * where the whole point is the period that has no results yet.
 */
export interface Gap {
  variableCode: string;
  domain: string;
  missing: number;
}

export interface ProfileCoverage {
  profileCode: string;
  sector: string;
  subsector: string | null;
  hazard: string;
  weightsOk: boolean;
  variables: number;
  missingWeights: number;
  hazardTotal: number | null;
  exposureTotal: number | null;
  divisionsComplete: number;
  divisionsPartial: number;
  divisionsEmpty: number;
  scored: number;
  status: string;
  note: string;
  gaps: Gap[];
}

export interface CoverageReport {
  province: string;
  period: string;
  divisions: number;
  profiles: ProfileCoverage[];
}

@Component({
  selector: 'app-coverage-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './coverage-page.component.html',
  styleUrl: './coverage-page.component.scss',
})
export class CoveragePageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly taxonomyService = inject(TaxonomyService);
  private readonly base = environment.apiBaseUrl;

  readonly taxonomy = this.taxonomyService.taxonomy;
  readonly periods = PERIODS;

  readonly province = signal<string | undefined>(undefined);
  readonly period = signal<string>(PERIODS[0]);
  readonly report = signal<CoverageReport | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly openProfile = signal<string | null>(null);
  readonly onlyProblems = signal(false);

  readonly provinces = computed(() => this.taxonomy()?.provinces ?? []);

  readonly rows = computed(() => {
    const all = this.report()?.profiles ?? [];
    return this.onlyProblems() ? all.filter((p) => p.status !== 'scored') : all;
  });

  /** A count per status, so the province reads as a sentence before anyone
   * scans the table. */
  readonly tally = computed(() => {
    const out: Record<string, number> = {};
    for (const p of this.report()?.profiles ?? []) out[p.status] = (out[p.status] ?? 0) + 1;
    return Object.entries(out);
  });

  ngOnInit(): void {
    this.taxonomyService.load();
  }

  /** The province list arrives with the taxonomy, so the first load happens
   * when the user picks -- or here, once, as soon as there is something to
   * pick. */
  choose(province: string): void {
    this.province.set(province);
    this.refresh();
  }

  setPeriod(period: string): void {
    this.period.set(period);
    if (this.province()) this.refresh();
  }

  toggleProfile(code: string): void {
    this.openProfile.set(this.openProfile() === code ? null : code);
  }

  refresh(): void {
    const province = this.province();
    if (!province) return;
    this.busy.set(true);
    this.error.set(null);
    const q = `?province=${encodeURIComponent(province)}&period=${encodeURIComponent(this.period())}`;
    this.http.get<CoverageReport>(`${this.base}/coverage${q}`).subscribe({
      next: (r) => {
        this.report.set(r);
        this.busy.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? err?.message ?? 'Coverage could not be loaded.');
        this.report.set(null);
        this.busy.set(false);
      },
    });
  }
}
