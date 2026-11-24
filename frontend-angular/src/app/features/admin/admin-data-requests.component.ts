import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';

interface DataRequest {
  id: number; full_name: string; email: string; organization: string | null; purpose: string;
  province: string | null; sector: string | null; subsector: string | null; hazard: string | null;
  period: string | null; requested_at: string; status: string; handled_by: string | null; note: string | null;
}

/**
 * Data requests (client NOTED-17, item 10), for the data sharing
 * administrator. Download the index data of the requested map as a PDF (H, E,
 * H x E, present exposure, and the profile weights with data source, unit and
 * direction, with the data-sharing disclaimer), send it to the person by
 * e-mail, and mark the request shared.
 */
@Component({
  selector: 'app-admin-data-requests',
  standalone: true,
  imports: [FormsModule, DatePipe],
  styleUrl: './admin-shared.scss',
  template: `
  <section class="adm">
    <h2>Data requests</h2>
    <p class="adm__hint">Requests from the public for index data. Download the PDF, send it to the person by e-mail,
      then mark the request as shared. Only index data (H, E, H × E and profile weights) is included.</p>
    @if (error(); as e) { <p class="adm__error" role="alert">{{ e }}</p> }
    @if (requests().length === 0) { <p class="adm__muted">No requests yet.</p> }
    <table class="adm__table">
      <thead><tr><th>From</th><th>Data asked for</th><th>Purpose</th><th>Status</th><th></th></tr></thead>
      <tbody>
        @for (r of requests(); track r.id) {
          <tr>
            <td>{{ r.full_name }}<br /><span class="adm__muted">{{ r.email }}{{ r.organization ? ' · ' + r.organization : '' }}</span>
              <br /><span class="adm__muted">{{ r.requested_at | date: 'medium' }}</span></td>
            <td>{{ r.province }} · {{ r.sector }}{{ r.subsector ? ' / ' + r.subsector : '' }} · {{ r.hazard }} · {{ r.period }}</td>
            <td>{{ r.purpose }}</td>
            <td><span [class]="'adm__status adm__status--' + r.status">{{ r.status }}</span>
              @if (r.handled_by) { <br /><span class="adm__muted">by {{ r.handled_by }}</span> }
              @if (r.note) { <br /><span class="adm__muted">{{ r.note }}</span> }</td>
            <td>
              <div class="adm__actions">
                <button class="adm__btn" type="button" [disabled]="busy() === r.id" (click)="pdf(r)">
                  {{ busy() === r.id ? 'Preparing…' : 'Download PDF' }}</button>
                @if (r.status !== 'shared') {
                  <button class="adm__btn adm__btn--ghost" type="button" (click)="mark(r, 'shared')">Mark shared</button>
                }
                @if (r.status === 'new') {
                  <button class="adm__btn adm__btn--danger" type="button" (click)="mark(r, 'declined')">Decline</button>
                }
              </div>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </section>`,
})
export class AdminDataRequestsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;
  readonly requests = signal<DataRequest[]>([]);
  readonly error = signal<string | null>(null);
  readonly busy = signal<number | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.http.get<DataRequest[]>(`${this.base}/data-requests`, { withCredentials: true }).subscribe({
      next: (r) => this.requests.set(r),
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Could not load the requests.'),
    });
  }

  pdf(r: DataRequest): void {
    this.busy.set(r.id);
    this.http.get(`${this.base}/data-requests/${r.id}/pdf`, { withCredentials: true, responseType: 'blob', observe: 'response' })
      .subscribe({
        next: (res) => {
          const cd = res.headers.get('Content-Disposition') ?? '';
          const name = /filename="?([^";]+)"?/.exec(cd)?.[1] ?? 'Climatica_data.pdf';
          const url = URL.createObjectURL(res.body as Blob);
          const a = document.createElement('a');
          a.href = url; a.download = name; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          this.busy.set(null);
        },
        error: async (e) => {
          let msg = e?.message ?? 'The PDF could not be produced.';
          try { const t = await (e?.error as Blob)?.text?.(); if (t) msg = JSON.parse(t).detail ?? msg; } catch { /* keep */ }
          this.error.set(msg);
          this.busy.set(null);
        },
      });
  }

  mark(r: DataRequest, status: 'shared' | 'declined'): void {
    this.http.post(`${this.base}/data-requests/${r.id}/status`, { status }, { withCredentials: true }).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Not updated.'),
    });
  }
}
