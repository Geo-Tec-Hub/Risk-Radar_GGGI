import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ApiClientService } from './api-client.service';
import {
  ApprovePayload,
  CurrentUser,
  LoginPayload,
  PendingRegistration,
  RegisterPayload,
  RegistrationType,
  RejectPayload,
  RoleCode,
} from '../models/auth.model';
import { PROVINCES } from '../models/reference-data.model';

/** admin -> /admin/registrations, data_officer/expert -> /entry (their
 * write workflow starts there), everyone else (community, or no role yet)
 * -> /map (FR-12.8: route by role on sign-in). */
const ROLE_LANDING: Record<RoleCode, string> = {
  admin: '/admin/registrations',
  data_officer: '/entry',
  expert: '/entry',
  community: '/map',
};

/**
 * Session state (T2b). The single source of truth for "is anyone signed
 * in" is the server: `currentUser` starts unknown, `refreshMe()` asks
 * GET /auth/me, and `clearAuth()` -- called by the 401 interceptor path --
 * is the only other way it changes outside an explicit login/logout. This
 * is what keeps FR-5.21 true: the client must not appear signed in while
 * the API is rejecting its requests.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClientService);

  private readonly _currentUser = signal<CurrentUser | null>(null);
  private readonly _checked = signal(false);

  /** null = signed out (or not yet known); use `checked()` to tell those apart. */
  readonly currentUser = this._currentUser.asReadonly();
  /** True once the initial GET /auth/me has resolved (success or 401) --
   * lets app.ts avoid a flash of "signed out" UI before the first check. */
  readonly checked = this._checked.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  hasRole(role: RoleCode): boolean {
    return this._currentUser()?.roles.includes(role) ?? false;
  }

  /** Locate this account's province in the shared PROVINCES list (used by
   * <select> option values), tolerant of the "Northwestern"/"North Western"
   * spelling difference between the database and that constant -- see the
   * note on PROVINCES in reference-data.model.ts. */
  matchProvinceOption(): string | undefined {
    const dbName = this._currentUser()?.province;
    if (!dbName) return undefined;
    const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
    return PROVINCES.find((p) => normalize(p) === normalize(dbName));
  }

  landingRouteForCurrentUser(): string {
    const roles = this._currentUser()?.roles ?? [];
    for (const role of Object.keys(ROLE_LANDING) as RoleCode[]) {
      if (roles.includes(role)) return ROLE_LANDING[role];
    }
    return '/map';
  }

  /** Ask the server who -- if anyone -- this session belongs to. Call once
   * at app start; never assumes signed-out on a network error (leaves the
   * previous state alone) but does clear on an explicit 401. */
  refreshMe(): Observable<CurrentUser> {
    return this.api.getMe().pipe(
      tap({
        next: (user) => {
          this._currentUser.set(user);
          this._checked.set(true);
        },
        error: (err) => {
          if (err?.status === 401) this._currentUser.set(null);
          this._checked.set(true);
        },
      }),
    );
  }

  register(payload: RegisterPayload): Observable<{ id: number; status: string }> {
    return this.api.register(payload);
  }

  login(payload: LoginPayload): Observable<CurrentUser> {
    return this.api.login(payload).pipe(tap((user) => this._currentUser.set(user)));
  }

  logout(): Observable<void> {
    return this.api.logout().pipe(tap(() => this._currentUser.set(null)));
  }

  /** Called by api-error.interceptor.ts on any 401 (FR-5.21): the session
   * the client thought it had is not one the API honours, so the UI must
   * stop claiming otherwise immediately, not wait for the next /auth/me poll. */
  clearAuth(): void {
    this._currentUser.set(null);
  }

  listPendingRegistrations(): Observable<PendingRegistration[]> {
    return this.api.getPendingRegistrations();
  }

  approveRegistration(id: number, payload: ApprovePayload) {
    return this.api.approveRegistration(id, payload);
  }

  rejectRegistration(id: number, payload: RejectPayload) {
    return this.api.rejectRegistration(id, payload);
  }
}

export const REGISTRATION_TYPE_LABEL: Record<RegistrationType, string> = {
  agency: 'Data entry authorised agency',
  expert: 'External expert',
  public: 'Public user',
};
