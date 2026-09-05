import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApprovePayload,
  CurrentUser,
  LoginPayload,
  PendingRegistration,
  RegisterPayload,
  RejectPayload,
} from '../models/auth.model';
import { ImportBatch, ImportSummary } from '../models/import.model';
import { ProfileScope, ProfileWeights, ProfileWeightsVersion, SaveWeightsPayload, encodeProfileScope } from '../models/profile.model';
import { CoverageSummary, VulnerabilityComposition, VulnerabilityQuery, VulnerabilityUnit } from '../models/vulnerability.model';

/** The session cookie is opaque and HttpOnly (T2b) -- Angular never reads
 * it, but every auth call must still send/receive it, including across the
 * dev proxy's origin. withCredentials is a no-op for same-origin requests
 * and required for a genuinely cross-origin deployment, so it is set on
 * every call here rather than relying on same-origin defaults. */
const WITH_CREDENTIALS = { withCredentials: true };

function toHttpParams(query: Record<string, string | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, value);
    }
  }
  return params;
}

/**
 * Typed client for the endpoints in SRS §9 that the public map (Stage 5)
 * needs. Representative, not exhaustive -- extend per-endpoint as later
 * stages need them, matching the path and shape documented in §9.
 *
 * There is no backend yet (PROGRESS_TRACKER.md: Stage 2 -- the first FastAPI
 * code -- has not started), so every call here will fail until it exists.
 * Components must treat that failure as the FR-5.20 error state, not crash.
 */
@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** GET /vulnerability -- results for the current filter selection. */
  getVulnerability(query: VulnerabilityQuery): Observable<VulnerabilityUnit[]> {
    const params = toHttpParams({ ...query });
    return this.http.get<VulnerabilityUnit[]>(`${this.base}/vulnerability`, { params });
  }

  /** GET /vulnerability/{unit} -- full score composition for one division (FR-5.9). */
  getVulnerabilityComposition(
    dsCode: string,
    query: VulnerabilityQuery,
  ): Observable<VulnerabilityComposition> {
    const params = toHttpParams({ ...query });
    return this.http.get<VulnerabilityComposition>(`${this.base}/vulnerability/${dsCode}`, { params });
  }

  /** GET /coverage -- assessed/pending/unassessed counts for the current selection (FR-5.15). */
  getCoverage(query: VulnerabilityQuery): Observable<CoverageSummary> {
    const params = toHttpParams({ ...query });
    return this.http.get<CoverageSummary>(`${this.base}/coverage`, { params });
  }

  /** GET /health -- database, tiles, job queue and AI-layer status. */
  getHealth(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/health`);
  }

  /** GET /profiles/{scope}/weights -- current weighting (DATA_ENTRY_WORKFLOW.md Step 2). */
  getProfileWeights(scope: ProfileScope): Observable<ProfileWeights> {
    return this.http.get<ProfileWeights>(
      `${this.base}/profiles/${encodeProfileScope(scope)}/weights`, WITH_CREDENTIALS);
  }

  /** PUT /profiles/{scope}/weights -- saves as a new version; the previous one is kept. */
  /**
   * PUT /profiles/{scope}/weights.
   *
   * The editor works in two blocks; the API takes one flat `items` array with a
   * `domain` on each row, because that is what `save_profile_weights()` needs
   * to enforce the per-domain 100 rule in one pass. The flattening happens here,
   * once, at the boundary — not in the component, and not by making the API
   * carry a shape it does not use.
   */
  saveProfileWeights(scope: ProfileScope, payload: SaveWeightsPayload): Observable<ProfileWeights> {
    const items = [
      ...payload.hazardVariables.map((d) => ({ ...d, domain: 'hazard' as const })),
      ...payload.exposureVariables.map((d) => ({ ...d, domain: 'exposure' as const })),
    ];
    return this.http.put<ProfileWeights>(
      `${this.base}/profiles/${encodeProfileScope(scope)}/weights`,
      { items, panelNote: payload.panelNote },
      WITH_CREDENTIALS,
    );
  }

  /** GET /profiles/{scope}/weights/history -- version history. */
  getProfileWeightsHistory(scope: ProfileScope): Observable<ProfileWeightsVersion[]> {
    return this.http.get<ProfileWeightsVersion[]>(`${this.base}/profiles/${encodeProfileScope(scope)}/weights/history`);
  }

  /**
   * POST /imports -- upload a workbook for a resolved profile scope.
   * "Nothing loads partially": the caller must treat any error response as
   * the whole file having loaded nothing, not a partial success.
   */
  uploadImport(scope: ProfileScope, file: File): Observable<ImportBatch> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scope', encodeProfileScope(scope));
    return this.http.post<ImportBatch>(`${this.base}/imports`, formData);
  }

  /** GET /imports/{id} -- batch status and per-cell errors. */
  getImportBatch(id: string): Observable<ImportBatch> {
    return this.http.get<ImportBatch>(`${this.base}/imports/${id}`);
  }

  /** GET /imports/{id}/summary -- loaded / computed / outstanding (FR-2.12). */
  getImportSummary(id: string): Observable<ImportSummary> {
    return this.http.get<ImportSummary>(`${this.base}/imports/${id}/summary`);
  }

  /** POST /imports/{id}/rollback -- reverses a loaded batch (FR-2.10). */
  rollbackImport(id: string): Observable<ImportBatch> {
    return this.http.post<ImportBatch>(`${this.base}/imports/${id}/rollback`, {});
  }

  // --- T2b: auth & registration ---------------------------------------

  /** POST /auth/register -- self-registration; the account starts `pending`. */
  register(payload: RegisterPayload): Observable<{ id: number; status: string }> {
    return this.http.post<{ id: number; status: string }>(`${this.base}/auth/register`, payload, WITH_CREDENTIALS);
  }

  /** POST /auth/login -- sets the opaque session cookie on success. */
  login(payload: LoginPayload): Observable<CurrentUser> {
    return this.http.post<CurrentUser>(`${this.base}/auth/login`, payload, WITH_CREDENTIALS);
  }

  /** POST /auth/logout -- revokes the session row server-side, clears the cookie. */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/logout`, {}, WITH_CREDENTIALS);
  }

  /** GET /auth/me -- the server's answer to "who is this session", not a client guess. */
  getMe(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.base}/auth/me`, WITH_CREDENTIALS);
  }

  /** GET /admin/registrations -- the approval queue (admin only). */
  getPendingRegistrations(): Observable<PendingRegistration[]> {
    return this.http.get<PendingRegistration[]>(`${this.base}/admin/registrations`, WITH_CREDENTIALS);
  }

  /** POST /admin/registrations/{id}/approve -- grants role + province. */
  approveRegistration(id: number, payload: ApprovePayload): Observable<{ id: number; status: string; role: string }> {
    return this.http.post<{ id: number; status: string; role: string }>(
      `${this.base}/admin/registrations/${id}/approve`, payload, WITH_CREDENTIALS,
    );
  }

  /** POST /admin/registrations/{id}/reject -- also the revocation path for
   * an already-active account (schema_session_addendum.sql's trigger). */
  rejectRegistration(id: number, payload: RejectPayload): Observable<{ id: number; status: string }> {
    return this.http.post<{ id: number; status: string }>(
      `${this.base}/admin/registrations/${id}/reject`, payload, WITH_CREDENTIALS,
    );
  }
}
