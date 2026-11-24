import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';

interface Change {
  id: number; kind: string; province: string; summary: string; submittedBy: string; submittedAt: string;
  status: string; decidedBy: string | null; decidedAt: string | null; decisionNote: string | null;
}

/**
 * Approvals (client NOTED-17, item 9): expert assessments and official data
 * imports/corrections of the province wait here. Approving applies the change
 * exactly as the person entered it; until then the maps keep the approved
 * values. A provincial administrator sees their province; the super
 * administrator sees all.
 */
@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [FormsModule, DatePipe],
  styleUrl: './admin-shared.scss',
  template: `
  <section class="adm">
    <h2>Approvals</h2>
    <p class="adm__hint">Data entered by experts and official data-entry users waits here. Approving applies it; the
      maps keep showing the approved values until then. After approving imports or corrections, recompute the
      province on the Import tab to publish them.</p>
    <div class="adm__inline">
      <label class="adm__muted">Show
        <select [ngModel]="status()" (ngModelChange)="status.set($event); load()" name="status">
          <option value="pending">waiting for approval</option>
          <option value="all">all recent</option>
        </select>
      </label>
    </div>
    @if (error(); as e) { <p class="adm__error" role="alert">{{ e }}</p> }
    @if (changes().length === 0) { <p class="adm__muted">Nothing {{ status() === 'pending' ? 'is waiting' : 'yet' }}.</p> }
    <table class="adm__table">
      <thead><tr><th>Change</th><th>Province</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
      <tbody>
        @for (c of changes(); track c.id) {
          <tr>
            <td>{{ c.summary }}</td>
            <td>{{ c.province }}</td>
            <td>{{ c.submittedBy }}<br /><span class="adm__muted">{{ c.submittedAt | date: 'medium' }}</span></td>
            <td><span [class]="'adm__status adm__status--' + c.status">{{ c.status }}</span>
              @if (c.decisionNote) { <br /><span class="adm__muted">{{ c.decisionNote }}</span> }
              @if (c.decidedBy) { <br /><span class="adm__muted">by {{ c.decidedBy }}</span> }
            </td>
            <td>
              @if (c.status === 'pending') {
                <div class="adm__actions">
                  <input placeholder="note (needed to reject)" [ngModel]="notes()[c.id] ?? ''"
                         (ngModelChange)="setNote(c.id, $event)" [name]="'note' + c.id" />
                  <button class="adm__btn" type="button" [disabled]="busy() === c.id" (click)="decide(c, 'approve')">Approve</button>
                  <button class="adm__btn adm__btn--danger" type="button" [disabled]="busy() === c.id" (click)="decide(c, 'reject')">Reject</button>
                </div>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  </section>`,
})
export class AdminApprovalsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;
  readonly changes = signal<Change[]>([]);
  readonly status = signal<'pending' | 'all'>('pending');
  readonly error = signal<string | null>(null);
  readonly busy = signal<number | null>(null);
  readonly notes = signal<Record<number, string>>({});

  ngOnInit(): void { this.load(); }

  setNote(id: number, v: string): void { this.notes.update((n) => ({ ...n, [id]: v })); }

  load(): void {
    this.http.get<Change[]>(`${this.base}/approvals?status=${this.status()}`, { withCredentials: true }).subscribe({
      next: (c) => this.changes.set(c),
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Could not load the approvals.'),
    });
  }

  decide(c: Change, action: 'approve' | 'reject'): void {
    const note = (this.notes()[c.id] ?? '').trim();
    if (action === 'reject' && !note) {
      this.error.set('Write a short reason before rejecting — the person who entered the data will see it.');
      return;
    }
    this.error.set(null);
    this.busy.set(c.id);
    this.http.post<Change>(`${this.base}/approvals/${c.id}/${action}`, { note: note || null }, { withCredentials: true })
      .subscribe({
        next: () => { this.busy.set(null); this.load(); },
        error: (e) => { this.busy.set(null); this.error.set(e?.error?.detail ?? e?.message ?? 'Not done.'); this.load(); },
      });
  }
}
