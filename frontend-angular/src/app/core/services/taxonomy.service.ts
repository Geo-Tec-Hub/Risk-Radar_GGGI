import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Taxonomy } from '../models/taxonomy.model';

/**
 * Loads the filter taxonomy once, from the API rather than from constants.
 *
 * There is deliberately NO hardcoded fallback. A wrong sector or period list
 * is worse than an absent one: the controls would look populated and every
 * selection would 404, which reads to a user as "the data is missing" rather
 * than "the client is out of date". On failure the signal stays null and the
 * filter bar says it cannot offer options yet.
 */
@Injectable({ providedIn: 'root' })
export class TaxonomyService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<Taxonomy | null>(null);
  private readonly failed = signal<string | null>(null);
  private started = false;

  readonly taxonomy = this.state.asReadonly();
  readonly error = this.failed.asReadonly();

  load(): void {
    if (this.started) return;
    this.started = true;
    this.http.get<Taxonomy>(`${environment.apiBaseUrl}/reference/taxonomy`).subscribe({
      next: (t) => this.state.set(t),
      error: (err) => {
        this.started = false; // allow a retry when the API comes back
        this.failed.set(err?.message ?? 'Could not load the filter options.');
      },
    });
  }
}
