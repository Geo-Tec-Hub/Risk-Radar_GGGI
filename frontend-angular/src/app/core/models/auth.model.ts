/**
 * T2b: landing page, sign-in, registration. Types mirror
 * backend/app/routers/auth.py and admin.py exactly -- role codes are the
 * database's role.code values (data_officer, expert, community, admin), and
 * RegistrationType is the public-facing wording from BUILD_BRIEF T2b
 * ("agency / expert / public"), mapped to a role server-side.
 */

export type RegistrationType = 'agency' | 'expert' | 'public';

export type RoleCode = 'admin' | 'data_officer' | 'expert' | 'community';

export type AccountStatus = 'pending' | 'active' | 'rejected' | 'suspended';

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  organization?: string;
  type: RegistrationType;
  province_id?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/** GET /auth/me, and the body of POST /auth/login on success. */
export interface CurrentUser {
  id: number;
  email: string;
  full_name: string;
  organization: string | null;
  status: AccountStatus;
  province: string | null;
  roles: RoleCode[];
}

/** One row of GET /admin/registrations (v_pending_registration). */
export interface PendingRegistration {
  id: number;
  email: string;
  full_name: string;
  organization: string | null;
  registered_at: string;
  requested_role: RoleCode | null;
  requested_role_name: string | null;
  requested_province: string | null;
}

export interface ApprovePayload {
  role: RoleCode;
  province_id?: number;
}

export interface RejectPayload {
  reason: string;
}
