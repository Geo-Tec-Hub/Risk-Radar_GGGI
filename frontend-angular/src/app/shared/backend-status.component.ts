import { Component, inject, signal } from '@angular/core';

import { ApiClientService } from '../core/services/api-client.service';
import { ApiError } from '../core/models/api-error.model';

/**
 * Header badge pinging `GET /api/health` (T2, Stage 2.0). Exists so T2's own
 * "done when" bar -- a screen actually stops showing its error state -- has
 * something to point at: `ApiClientService.getHealth()` has been typed since
 * Stage 5 but nothing ever called it. This is the first thing in the app
 * that talks to the backend and can prove, live, that Stage 2 exists.
 */
@Component({
  selector: 'app-backend-status',
  standalone: true,
  templateUrl: './backend-status.component.html',
  styleUrl: './backend-status.component.scss',
})
export class BackendStatusComponent {
  private readonly api = inject(ApiClientService);

  readonly status = signal<'checking' | 'connected' | 'error'>('checking');
  readonly error = signal<string | null>(null);

  constructor() {
    this.check();
  }

  check(): void {
    this.status.set('checking');
    this.error.set(null);
    this.api.getHealth().subscribe({
      next: () => this.status.set('connected'),
      error: (err: ApiError) => {
        this.status.set('error');
        this.error.set(err.message);
      },
    });
  }
}
