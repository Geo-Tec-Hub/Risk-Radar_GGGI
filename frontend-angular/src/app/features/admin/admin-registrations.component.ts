import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiError } from '../../core/models/api-error.model';
import {
  InterestArea, InterestAreaOption, PendingRegistration, RoleCode,
} from '../../core/models/auth.model';
import { PROVINCE_OPTIONS, ProvinceOption } from '../../core/models/reference-data.model';
import { ApiClientService } from '../../core/services/api-client.service';
import { AuthService } from '../../core/services/auth.service';

const ROLES: readonly RoleCode[] = ['data_officer', 'expert', 'community', 'admin'];

function roleNeedsProvince(role: RoleCode): boolean {
  return role === 'data_officer' || role === 'expert';
}

/**
 * T2b / FR-12.3: GET /admin/registrations, approve (role + province + write
 * scope), reject (reason required). Guarded by adminGuard client-side; every
 * action here is re-authorised server-side against the admin role regardless
 * (FR-12.8) -- this screen not existing for a non-admin is a convenience,
 * not the control.
 *
 * WHY THE REQUESTED AREAS ARE NOT PRE-TICKED (5 Sep 2026).
 * The API refuses an approval that does not name a scope, precisely so that
 * granting is a decision rather than a side effect of clicking Approve. Ticking
 * the applicant's request for the administrator would hand that decision
 * straight back: every row would arrive pre-approved for whatever was asked,
 * and the guard would be satisfied by a form the admin never read.
 *
 * So the request is shown as TEXT, prominently, and the boxes start empty.
 * Granting it in full is one button that says what it does. Granting less is
 * ticking what should be granted. Either way the administrator has looked at
 * the request before anything is granted, which is the whole point.
 */
@Component({
  selector: 'app-admin-registrations',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-registrations.component.html',
  styleUrl: './admin-registrations.component.scss',
})
export class AdminRegistrationsComponent {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiClientService);

  readonly roles = ROLES;
  readonly provinces: readonly ProvinceOption[] = PROVINCE_OPTIONS;
  readonly roleNeedsProvince = roleNeedsProvince;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly registrations = signal<PendingRegistration[]>([]);

  /** Per-row working state, keyed by app_user.id, so acting on one row
   * cannot disable or spinner every other row on the screen. */
  readonly selectedRole = signal<Record<number, RoleCode>>({});
  readonly selectedProvince = signal<Record<number, number | undefined>>({});
  readonly rejectReason = signal<Record<number, string>>({});
  readonly rowBusy = signal<Record<number, boolean>>({});
  readonly rowError = signal<Record<number, string>>({});

  /** The full catalogue, so an admin can grant a sector the applicant did not
   * think to ask for. */
  readonly sectorOptions = signal<InterestAreaOption[]>([]);
  readonly optionsError = signal<string | null>(null);

  /** Per row: the keys ticked to GRANT. Starts empty on purpose -- see the
   * class comment. Keys are `SECTOR` or `SECTOR/SUBSECTOR`. */
  readonly grantKeys = signal<Record<number, ReadonlySet<string>>>({});
  readonly grantHazard = signal<Record<number, boolean>>({});
  readonly scopeOpen = signal<Record<number, boolean>>({});

  constructor() {
    this.load();
    this.api.getInterestAreaOptions().subscribe({
      next: (opts) => this.sectorOptions.set(opts),
      error: (err: ApiError) => this.optionsError.set(err.message),
    });
  }

  // --- write scope ------------------------------------------------------

  key(sector: string, subsector?: string | null): string {
    return subsector ? `${sector}/${subsector}` : sector;
  }

  keysFor(id: number): ReadonlySet<string> {
    return this.grantKeys()[id] ?? new Set<string>();
  }

  isGranted(id: number, sector: string, subsector?: string | null): boolean {
    return this.keysFor(id).has(this.key(sector, subsector));
  }

  toggleGrant(id: number, sector: string, subsector?: string | null): void {
    const next = new Set(this.keysFor(id));
    const k = this.key(sector, subsector);
    if (next.has(k)) next.delete(k); else next.add(k);
    this.grantKeys.set({ ...this.grantKeys(), [id]: next });
  }

  /** One deliberate click that says what it does, instead of a default that
   * does it silently. */
  grantAsRequested(reg: PendingRegistration): void {
    const keys = new Set(reg.requested_areas.map((a) => this.key(a.sector, a.subsector)));
    this.grantKeys.set({ ...this.grantKeys(), [reg.id]: keys });
    this.grantHazard.set({ ...this.grantHazard(), [reg.id]: reg.requested_hazard_domain });
    this.scopeOpen.set({ ...this.scopeOpen(), [reg.id]: true });
  }

  clearGrant(id: number): void {
    this.grantKeys.set({ ...this.grantKeys(), [id]: new Set<string>() });
    this.grantHazard.set({ ...this.grantHazard(), [id]: false });
  }

  toggleScopePanel(id: number): void {
    this.scopeOpen.set({ ...this.scopeOpen(), [id]: !this.scopeOpen()[id] });
  }

  hazardFor(id: number): boolean {
    return this.grantHazard()[id] ?? false;
  }

  setHazard(id: number, on: boolean): void {
    this.grantHazard.set({ ...this.grantHazard(), [id]: on });
  }

  /** Reads the request back in the admin's language. A whole-sector request is
   * the WIDER one and must not read as the bare sector name. */
  describeRequest(reg: PendingRegistration): string {
    if (!reg.requested_areas.length) return 'no areas named';
    return reg.requested_areas
      .map((a) => (a.subsector ? `${a.sector} / ${a.subsector}` : `${a.sector} (all subsectors)`))
      .join(', ');
  }

  /** A whole sector granted alongside one of its subsectors. The server
   * refuses this; catching it here saves a round trip and explains it in
   * place. */
  redundantFor(id: number): string[] {
    const keys = this.keysFor(id);
    return [...keys].filter((k) => k.includes('/') && keys.has(k.split('/')[0]))
      .map((k) => k.split('/')[0]);
  }

  private grantPayload(id: number): InterestArea[] {
    return [...this.keysFor(id)].sort().map((k) => {
      const [sector, subsector] = k.split('/');
      return subsector ? { sector, subsector } : { sector };
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.listPendingRegistrations().subscribe({
      next: (rows) => {
        this.registrations.set(rows);
        this.loading.set(false);
        const roles: Record<number, RoleCode> = {};
        for (const r of rows) {
          if (r.requested_role) roles[r.id] = r.requested_role as RoleCode;
        }
        this.selectedRole.set({ ...this.selectedRole(), ...roles });
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  roleFor(id: number): RoleCode {
    return this.selectedRole()[id] ?? 'community';
  }

  setRole(id: number, role: RoleCode): void {
    this.selectedRole.set({ ...this.selectedRole(), [id]: role });
  }

  setProvince(id: number, provinceId: number | undefined): void {
    this.selectedProvince.set({ ...this.selectedProvince(), [id]: provinceId });
  }

  setReason(id: number, reason: string): void {
    this.rejectReason.set({ ...this.rejectReason(), [id]: reason });
  }

  /** roleNeedsProvince and roleNeedsScope are the same predicate today, and
   * deliberately named separately: they answer different questions (SRS §3.2
   * binding vs. schema_write_scope_addendum.sql) and either could change
   * without the other. */
  roleNeedsScope(role: RoleCode): boolean {
    return roleNeedsProvince(role);
  }

  canApprove(id: number): boolean {
    const role = this.roleFor(id);
    if (roleNeedsProvince(role) && this.selectedProvince()[id] === undefined) return false;
    if (this.roleNeedsScope(role) && this.keysFor(id).size === 0) return false;
    return this.redundantFor(id).length === 0;
  }

  approve(reg: PendingRegistration): void {
    if (!this.canApprove(reg.id)) return;
    this.setBusy(reg.id, true);
    this.setRowError(reg.id, null);

    const role = this.roleFor(reg.id);
    const scoped = this.roleNeedsScope(role);
    this.auth.approveRegistration(reg.id, {
      role,
      province_id: roleNeedsProvince(role) ? this.selectedProvince()[reg.id] : undefined,
      scopes: scoped ? this.grantPayload(reg.id) : undefined,
      may_write_hazard_domain: scoped ? this.hazardFor(reg.id) : undefined,
    }).subscribe({
      next: () => {
        this.setBusy(reg.id, false);
        this.registrations.set(this.registrations().filter((r) => r.id !== reg.id));
      },
      error: (err: ApiError) => {
        this.setBusy(reg.id, false);
        this.setRowError(reg.id, err.message);
      },
    });
  }

  reject(reg: PendingRegistration): void {
    const reason = (this.rejectReason()[reg.id] ?? '').trim();
    if (!reason) {
      this.setRowError(reg.id, 'A reason is required to reject a registration.');
      return;
    }
    this.setBusy(reg.id, true);
    this.setRowError(reg.id, null);

    this.auth.rejectRegistration(reg.id, { reason }).subscribe({
      next: () => {
        this.setBusy(reg.id, false);
        this.registrations.set(this.registrations().filter((r) => r.id !== reg.id));
      },
      error: (err: ApiError) => {
        this.setBusy(reg.id, false);
        this.setRowError(reg.id, err.message);
      },
    });
  }

  private setBusy(id: number, busy: boolean): void {
    this.rowBusy.set({ ...this.rowBusy(), [id]: busy });
  }

  private setRowError(id: number, message: string | null): void {
    const next = { ...this.rowError() };
    if (message) next[id] = message; else delete next[id];
    this.rowError.set(next);
  }
}
