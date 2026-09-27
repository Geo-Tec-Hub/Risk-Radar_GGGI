import {
  HttpClient,
  HttpParams,
  Injectable,
  __spreadProps,
  __spreadValues,
  environment,
  inject,
  map,
  setClassMetadata,
  ɵɵdefineInjectable
} from "./chunk-SAQOEXKZ.js";

// src/app/core/models/profile.model.ts
function encodeProfileScope(scope) {
  return [scope.province, scope.sector, scope.subsector ?? "-", scope.hazard].map(encodeURIComponent).join(":");
}

// src/app/core/services/api-client.service.ts
var WITH_CREDENTIALS = { withCredentials: true };
function toHttpParams(query) {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== void 0 && value !== null && value !== "") {
      params = params.set(key, value);
    }
  }
  return params;
}
var ApiClientService = class _ApiClientService {
  http = inject(HttpClient);
  base = environment.apiBaseUrl;
  /** GET /vulnerability -- results for the current filter selection. */
  getVulnerability(query) {
    const params = toHttpParams(__spreadValues({}, query));
    return this.http.get(`${this.base}/vulnerability`, { params });
  }
  /** GET /vulnerability/{unit} -- full score composition for one division (FR-5.9). */
  getVulnerabilityComposition(dsCode, query) {
    const params = toHttpParams(__spreadValues({}, query));
    return this.http.get(`${this.base}/vulnerability/${dsCode}`, { params });
  }
  /** GET /coverage -- assessed/pending/unassessed counts for the current selection (FR-5.15). */
  getCoverage(query) {
    const params = toHttpParams(__spreadValues({}, query));
    return this.http.get(`${this.base}/coverage`, { params });
  }
  /** GET /health -- database, tiles, job queue and AI-layer status. */
  getHealth() {
    return this.http.get(`${this.base}/health`);
  }
  /** GET /profiles/{scope}/weights -- current weighting (DATA_ENTRY_WORKFLOW.md Step 2). */
  getProfileWeights(scope) {
    return this.http.get(`${this.base}/profiles/${encodeProfileScope(scope)}/weights`, WITH_CREDENTIALS);
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
  saveProfileWeights(scope, payload) {
    const items = [
      ...payload.hazardVariables.map((d) => __spreadProps(__spreadValues({}, d), { domain: "hazard" })),
      ...payload.exposureVariables.map((d) => __spreadProps(__spreadValues({}, d), { domain: "exposure" }))
    ];
    return this.http.put(`${this.base}/profiles/${encodeProfileScope(scope)}/weights`, { items, panelNote: payload.panelNote }, WITH_CREDENTIALS);
  }
  /** GET /admin/catalog -- the variable catalogue.
   *
   * `codes` fetches specific variables (the ?add= flow). The filter is applied
   * client-side because the endpoint searches by substring, and a substring
   * search for "PADDY_EXTENT" would also return "PADDY_EXTENT_FINAL" -- close
   * enough to be picked up by mistake, which is exactly the confusion a code is
   * supposed to prevent.
   */
  getCatalog(params = {}) {
    let qs = new HttpParams();
    if (params.q)
      qs = qs.set("q", params.q);
    if (params.domain)
      qs = qs.set("domain", params.domain);
    if (params.status)
      qs = qs.set("status", params.status);
    return this.http.get(`${this.base}/admin/catalog`, __spreadProps(__spreadValues({}, WITH_CREDENTIALS), {
      params: qs
    }));
  }
  getCatalogItems(codes) {
    const wanted = new Set(codes);
    return this.getCatalog({ status: "active" }).pipe(map((items) => items.filter((i) => wanted.has(i.code))));
  }
  proposeVariable(body) {
    return this.http.post(`${this.base}/admin/catalog`, body, WITH_CREDENTIALS);
  }
  setVariableStatus(id, status) {
    return this.http.post(`${this.base}/admin/catalog/${id}/status`, { status }, WITH_CREDENTIALS);
  }
  getHazards() {
    return this.http.get(`${this.base}/admin/hazards`, WITH_CREDENTIALS);
  }
  addHazard(body) {
    return this.http.post(`${this.base}/admin/hazards`, body, WITH_CREDENTIALS);
  }
  getUsers(params = {}) {
    let qs = new HttpParams();
    if (params.province)
      qs = qs.set("province", params.province);
    if (params.sector)
      qs = qs.set("sector", params.sector);
    return this.http.get(`${this.base}/admin/users`, __spreadProps(__spreadValues({}, WITH_CREDENTIALS), {
      params: qs
    }));
  }
  getRoles() {
    return this.http.get(`${this.base}/admin/roles`, WITH_CREDENTIALS);
  }
  setUserRoles(id, roles) {
    return this.http.put(`${this.base}/admin/users/${id}/roles`, { roles }, WITH_CREDENTIALS);
  }
  /** GET /profiles/{scope}/weights/history -- version history. */
  getProfileWeightsHistory(scope) {
    return this.http.get(`${this.base}/profiles/${encodeProfileScope(scope)}/weights/history`);
  }
  /**
   * POST /imports -- upload a workbook for a resolved profile scope.
   * "Nothing loads partially": the caller must treat any error response as
   * the whole file having loaded nothing, not a partial success.
   */
  uploadImport(scope, file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", encodeProfileScope(scope));
    return this.http.post(`${this.base}/imports`, formData);
  }
  /** GET /imports/{id} -- batch status and per-cell errors. */
  getImportBatch(id) {
    return this.http.get(`${this.base}/imports/${id}`);
  }
  /** GET /imports/{id}/summary -- loaded / computed / outstanding (FR-2.12). */
  getImportSummary(id) {
    return this.http.get(`${this.base}/imports/${id}/summary`);
  }
  /** POST /imports/{id}/rollback -- reverses a loaded batch (FR-2.10). */
  rollbackImport(id) {
    return this.http.post(`${this.base}/imports/${id}/rollback`, {});
  }
  // --- T2b: auth & registration ---------------------------------------
  /** GET /reference/interest-areas -- the FULL sector/subsector catalogue.
   * Public, because the registration form has no session yet. Deliberately not
   * /taxonomy, which is scoped to profiles that exist: a sector with no data
   * would be unaskable, and the data cannot exist until someone is granted the
   * sector. */
  getInterestAreaOptions() {
    return this.http.get(`${this.base}/reference/interest-areas`);
  }
  /** POST /auth/register -- self-registration; the account starts `pending`. */
  register(payload) {
    return this.http.post(`${this.base}/auth/register`, payload, WITH_CREDENTIALS);
  }
  /** POST /auth/login -- sets the opaque session cookie on success. */
  login(payload) {
    return this.http.post(`${this.base}/auth/login`, payload, WITH_CREDENTIALS);
  }
  /** POST /auth/logout -- revokes the session row server-side, clears the cookie. */
  logout() {
    return this.http.post(`${this.base}/auth/logout`, {}, WITH_CREDENTIALS);
  }
  /** GET /auth/me -- the server's answer to "who is this session", not a client guess. */
  getMe() {
    return this.http.get(`${this.base}/auth/me`, WITH_CREDENTIALS);
  }
  /** GET /admin/registrations -- the approval queue (admin only). */
  getPendingRegistrations() {
    return this.http.get(`${this.base}/admin/registrations`, WITH_CREDENTIALS);
  }
  /** POST /admin/registrations/{id}/approve -- grants role + province. */
  approveRegistration(id, payload) {
    return this.http.post(`${this.base}/admin/registrations/${id}/approve`, payload, WITH_CREDENTIALS);
  }
  /** GET /admin/users/{id}/scope -- what this account may write, as granted. */
  getUserScope(id) {
    return this.http.get(`${this.base}/admin/users/${id}/scope`, WITH_CREDENTIALS);
  }
  /** PUT /admin/users/{id}/scope -- REPLACES the scope. An empty list revokes
   * everything, which is a decision the screen must present as such. */
  setUserScope(id, payload) {
    return this.http.put(`${this.base}/admin/users/${id}/scope`, payload, WITH_CREDENTIALS);
  }
  /** POST /admin/registrations/{id}/reject -- also the revocation path for
   * an already-active account (schema_session_addendum.sql's trigger). */
  rejectRegistration(id, payload) {
    return this.http.post(`${this.base}/admin/registrations/${id}/reject`, payload, WITH_CREDENTIALS);
  }
  static \u0275fac = function ApiClientService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ApiClientService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ApiClientService, factory: _ApiClientService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ApiClientService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();

export {
  ApiClientService
};
//# debugId=dcc3c27e-d994-594e-97be-2e3584d4437a
//# sourceMappingURL=chunk-QBP7AOH4.js.map
