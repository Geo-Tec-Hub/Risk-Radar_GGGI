import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiError } from '../../core/models/api-error.model';
import { PendingRegistration, RoleCode } from '../../core/models/auth.model';
import { PROVINCE_OPTIONS, ProvinceOption } from '../../core/models/reference-data.model';
import { AuthService } from '../../core/services/auth.service';

const ROLES: readonly RoleCode[] = ['data_officer', 'expert', 'community', 'admin'];

function roleNeedsProvince(role: RoleCode): boolean {
  return role === 'data_officer' || role === 'expert';
}

/**
 * T2b / FR-12.3: GET /admin/registrations, approve (role + province),
 * reject (reason required). Guarded by adminGuard client-side; every action
 * here is re-authorised server-side against the admin role regardless
 * (FR-12.8) -- this screen not existing for a non-admin is a convenience,
 * not the control.
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

  constructor() {
    this.load();
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

  canApprove(id: number): boolean {
    const role = this.roleFor(id);
    return !roleNeedsProvince(role) || this.selectedProvince()[id] !== undefined;
  }

  approve(reg: PendingRegistration): void {
    if (!this.canApprove(reg.id)) return;
    this.setBusy(reg.id, true);
    this.setRowError(reg.id, null);

    const role = this.roleFor(reg.id);
    this.auth.approveRegistration(reg.id, {
      role,
      province_id: roleNeedsProvince(role) ? this.selectedProvince()[reg.id] : undefined,
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
