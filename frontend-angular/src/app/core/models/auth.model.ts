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

/**
 * One sector an account works in, optionally narrowed to one subsector
 * (schema_write_scope_addendum.sql).
 *
 * `subsector` omitted means the WHOLE sector, which is the WIDER grant even
 * though it is the shorter object. Anywhere this is shown to an administrator
 * it must read "Agriculture (all subsectors)", never bare "Agriculture" --
 * approving the wider thing because it looked smaller is exactly the mistake
 * the screen has to prevent.
 */
export interface InterestArea {
  sector: string;
  subsector?: string | null;
}

/** GET /reference/interest-areas -- the FULL catalogue, not /taxonomy.
 * /taxonomy is scoped to profiles that exist, which is right for the map and
 * wrong here: nobody could ask to be the first officer for a sector that has
 * no data yet. */
export interface InterestAreaOption {
  code: string;
  name: string;
  subsectors: { code: string; name: string }[];
}

/** GET/PUT /admin/users/{id}/scope -- what an account may actually write. */
export interface WriteScope {
  user_id: number;
  areas: {
    sector_id: number;
    sector: string;
    sector_name: string;
    subsector_id: number | null;
    subsector: string | null;
    subsector_name: string | null;
  }[];
  may_write_hazard_domain: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  organization?: string;
  type: RegistrationType;
  province_id?: number;
  /** Required for agency and expert; must be empty for public. */
  interest_areas?: InterestArea[];
  /** Asks to write the shared climate variables (Met Dept / DMC). */
  hazard_domain?: boolean;
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
  /** What the applicant ASKED for. A wish, never a permission -- the admin
   * grants into user_write_scope, and may grant less. */
  requested_areas: InterestArea[];
  requested_hazard_domain: boolean;
}

export interface ApprovePayload {
  role: RoleCode;
  province_id?: number;
  /** REQUIRED for data_officer and expert. Never defaulted from the request
   * server-side: an approval that silently grants whatever was asked is not a
   * decision. */
  scopes?: InterestArea[];
  may_write_hazard_domain?: boolean;
  scope_note?: string;
}

/** PUT /admin/users/{id}/scope. REPLACES the whole scope; an empty list is a
 * valid decision and revokes everything. */
export interface ScopeAmendPayload {
  scopes: InterestArea[];
  may_write_hazard_domain: boolean;
  note?: string;
}

export interface RejectPayload {
  reason: string;
}
