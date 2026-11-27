import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RoleCode } from '../../core/models/auth.model';
import { PROVINCE_OPTIONS } from '../../core/models/reference-data.model';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Account {
  id: number; email: string; full_name: string; organization: string | null; status: string;
  roles: string[]; province: string | null; provinces: string[];
  created_by: string | null; created_by_id: number | null; created_at: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Super administrator', province_admin: 'Provincial administrator',
  data_sharing_admin: 'Data sharing administrator', data_officer: 'Official data entry',
  expert: 'Expert', community: 'Public user',
};

/**
 * Accounts (client NOTED-17, item 9). The super administrator creates
 * provincial and data sharing administrators and sees, for every account, who
 * created or approved it. A provincial administrator creates the experts and
 * official data-entry users of their own province. Server-side rules in
 * backend/app/routers/accounts.py are the real control.
 */
@Component({
  selector: 'app-admin-accounts',
  standalone: true,
  imports: [FormsModule],
  styleUrl: './admin-shared.scss',
  template: `
  <section class="adm">
    <h2>Accounts</h2>
    <p class="adm__hint">
      @if (isSuper()) {
        Create provincial administrators and data sharing administrators. The list shows who created
        or approved each account, so you can see the users each provincial administrator has added.
      } @else {
        Create the experts and official data-entry users of {{ auth.currentUser()?.province }} Province.
        Their data changes come to you for approval.
      }
    </p>

    <form class="adm__form" (submit)="$event.preventDefault(); create()">
      <label>Role
        <select [ngModel]="role()" name="role" (ngModelChange)="setRole($event)">
          @for (r of roleOptions(); track r) { <option [ngValue]="r">{{ label(r) }}</option> }
        </select>
      </label>
      <label>Full name <input [ngModel]="name()" (ngModelChange)="name.set($event)" name="name" required /></label>
      <label>E-mail <input type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" name="email" required /></label>
      <label>Organisation <input [ngModel]="org()" (ngModelChange)="org.set($event)" name="org" /></label>
      <label>First password (8+ characters)
        <input type="text" [ngModel]="password()" (ngModelChange)="password.set($event)" name="pw" autocomplete="off" />
      </label>
      @if (isSuper() && needsProvince()) {
        <label style="grid-column: 1 / -1">Province{{ role() === 'expert' ? '(s) — an expert may work in several' : '' }}
          <span class="adm__checks">
            @for (p of provinces; track p.id) {
              <label><input [type]="role() === 'expert' ? 'checkbox' : 'radio'" name="prov"
                            [checked]="picked().includes(p.id)" (change)="toggleProvince(p.id)" /> {{ p.name }}</label>
            }
          </span>
        </label>
      }
      <div class="adm__actions" style="grid-column: 1 / -1">
        <button class="adm__btn" type="submit" [disabled]="busy()">{{ busy() ? 'Creating…' : 'Create account' }}</button>
        <span class="adm__muted">Experts and data-entry users get every sector of their province; narrow it later on Registrations if needed.</span>
      </div>
    </form>
    @if (error(); as e) { <p class="adm__error" role="alert">{{ e }}</p> }
    @if (done(); as d) { <p class="adm__ok" role="status">{{ d }}</p> }

    <div class="adm__inline">
      <strong>{{ shown().length }} account(s)</strong>
      @if (isSuper()) {
        <label class="adm__muted">Created / approved by
          <select [ngModel]="creator()" (ngModelChange)="creator.set($event)" name="creator">
            <option [ngValue]="null">anyone</option>
            @for (c of creators(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
          </select>
        </label>
      }
    </div>
    <table class="adm__table">
      <thead><tr><th>Name</th><th>Role</th><th>Province(s)</th><th>Status</th><th>Created / approved by</th><th></th></tr></thead>
      <tbody>
        @for (a of shown(); track a.id) {
          <tr>
            <td>{{ a.full_name }}<br /><span class="adm__muted">{{ a.email }}</span></td>
            <td>{{ rolesOf(a) }}</td>
            <td>{{ a.provinces.length ? a.provinces.join(', ') : (a.province ?? 'national') }}</td>
            <td><span class="adm__status" [class]="'adm__status adm__status--' + a.status">{{ a.status }}</span></td>
            <td>{{ a.created_by ?? 'self-registered' }}<br /><span class="adm__muted">{{ a.created_at?.slice(0, 10) }}</span></td>
            <td>@if (a.id !== auth.currentUser()?.id) {
              <button class="adm__btn adm__btn--danger" type="button" (click)="remove(a)">Remove</button> }</td>
          </tr>
        }
      </tbody>
    </table>
  </section>`,
})
export class AdminAccountsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;
  readonly provinces = PROVINCE_OPTIONS;

  readonly accounts = signal<Account[]>([]);
  readonly error = signal<string | null>(null);
  readonly done = signal<string | null>(null);
  readonly busy = signal(false);
  readonly creator = signal<number | null>(null);

  readonly role = signal<RoleCode>('expert');
  readonly name = signal('');
  readonly email = signal('');
  readonly org = signal('');
  readonly password = signal('');
  readonly picked = signal<number[]>([]);

  readonly isSuper = computed(() => this.auth.hasRole('admin'));
  readonly roleOptions = computed<RoleCode[]>(() => this.isSuper()
    ? ['province_admin', 'data_sharing_admin', 'expert', 'data_officer', 'admin']
    : ['expert', 'data_officer']);
  readonly needsProvince = computed(() => ['province_admin', 'expert', 'data_officer'].includes(this.role()));
  readonly creators = computed(() => {
    const m = new Map<number, string>();
    for (const a of this.accounts()) if (a.created_by_id && a.created_by) m.set(a.created_by_id, a.created_by);
    return [...m].map(([id, name]) => ({ id, name }));
  });
  readonly shown = computed(() => {
    const c = this.creator();
    return c === null ? this.accounts() : this.accounts().filter((a) => a.created_by_id === c);
  });

  ngOnInit(): void {
    if (this.isSuper()) this.role.set('province_admin');
    this.load();
  }

  label(r: string): string { return ROLE_LABEL[r] ?? r; }
  rolesOf(a: Account): string { return a.roles.map((r) => this.label(r)).join(', ') || '—'; }

  setRole(r: RoleCode): void {
    this.role.set(r);
    if (r !== 'expert' && this.picked().length > 1) this.picked.set(this.picked().slice(0, 1));
  }

  toggleProvince(id: number): void {
    if (this.role() !== 'expert') { this.picked.set([id]); return; }
    this.picked.update((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  load(): void {
    this.http.get<Account[]>(`${this.base}/admin/accounts`, { withCredentials: true }).subscribe({
      next: (a) => this.accounts.set(a),
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Accounts could not be loaded.'),
    });
  }

  /** Remove an unwanted account (NOTED-19). One that entered data is closed
   * rather than deleted, so the records keep their author. */
  remove(a: Account): void {
    if (!confirm(`Remove the account of ${a.full_name} (${a.email})? They will no longer be able to sign in.`)) return;
    this.http.delete(`${this.base}/admin/accounts/${a.id}`, { withCredentials: true }).subscribe({
      next: () => { this.done.set(`Removed ${a.full_name}.`); this.load(); },
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Not removed.'),
    });
  }

  create(): void {
    this.error.set(null);
    this.done.set(null);
    if (!this.name().trim() || !this.email().trim() || this.password().length < 8) {
      this.error.set('Give a name, an e-mail and a first password of at least 8 characters.');
      return;
    }
    this.busy.set(true);
    this.http.post<Account>(`${this.base}/admin/accounts`, {
      role: this.role(), full_name: this.name().trim(), email: this.email().trim(),
      organization: this.org().trim() || null, password: this.password(),
      province_ids: this.isSuper() && this.needsProvince() ? this.picked() : [],
    }, { withCredentials: true }).subscribe({
      next: (a) => {
        this.busy.set(false);
        this.done.set(`Created ${a.full_name} (${this.rolesOf(a)}). Give them the e-mail and first password.`);
        this.name.set(''); this.email.set(''); this.org.set(''); this.password.set(''); this.picked.set([]);
        this.load();
      },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.detail ?? e?.message ?? 'Not created.'); },
    });
  }
}
