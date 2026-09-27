import {
  ApiClientService
} from "./chunk-QBP7AOH4.js";
import {
  PROVINCES
} from "./chunk-HN3O3DC2.js";
import {
  Injectable,
  computed,
  inject,
  setClassMetadata,
  signal,
  tap,
  ɵɵdefineInjectable
} from "./chunk-SAQOEXKZ.js";

// src/app/core/services/auth.service.ts
var ROLE_LANDING = {
  admin: "/admin/registrations",
  data_officer: "/import",
  expert: "/import",
  community: "/map"
};
var AuthService = class _AuthService {
  api = inject(ApiClientService);
  _currentUser = signal(
    null,
    ...ngDevMode ? [{ debugName: "_currentUser" }] : (
      /* istanbul ignore next */
      []
    )
  );
  _checked = signal(
    false,
    ...ngDevMode ? [{ debugName: "_checked" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** null = signed out (or not yet known); use `checked()` to tell those apart. */
  currentUser = this._currentUser.asReadonly();
  /** True once the initial GET /auth/me has resolved (success or 401) --
   * lets app.ts avoid a flash of "signed out" UI before the first check. */
  checked = this._checked.asReadonly();
  isAuthenticated = computed(
    () => this._currentUser() !== null,
    ...ngDevMode ? [{ debugName: "isAuthenticated" }] : (
      /* istanbul ignore next */
      []
    )
  );
  hasRole(role) {
    return this._currentUser()?.roles.includes(role) ?? false;
  }
  /** Locate this account's province in the shared PROVINCES list (used by
   * <select> option values), tolerant of the "Northwestern"/"North Western"
   * spelling difference between the database and that constant -- see the
   * note on PROVINCES in reference-data.model.ts. */
  matchProvinceOption() {
    const dbName = this._currentUser()?.province;
    if (!dbName)
      return void 0;
    const normalize = (s) => s.replace(/\s+/g, "").toLowerCase();
    return PROVINCES.find((p) => normalize(p) === normalize(dbName));
  }
  landingRouteForCurrentUser() {
    const roles = this._currentUser()?.roles ?? [];
    for (const role of Object.keys(ROLE_LANDING)) {
      if (roles.includes(role))
        return ROLE_LANDING[role];
    }
    return "/map";
  }
  /** Ask the server who -- if anyone -- this session belongs to. Call once
   * at app start; never assumes signed-out on a network error (leaves the
   * previous state alone) but does clear on an explicit 401. */
  refreshMe() {
    return this.api.getMe().pipe(tap({
      next: (user) => {
        this._currentUser.set(user);
        this._checked.set(true);
      },
      error: (err) => {
        if (err?.status === 401)
          this._currentUser.set(null);
        this._checked.set(true);
      }
    }));
  }
  register(payload) {
    return this.api.register(payload);
  }
  login(payload) {
    return this.api.login(payload).pipe(tap((user) => this._currentUser.set(user)));
  }
  logout() {
    return this.api.logout().pipe(tap(() => this._currentUser.set(null)));
  }
  /** Called by api-error.interceptor.ts on any 401 (FR-5.21): the session
   * the client thought it had is not one the API honours, so the UI must
   * stop claiming otherwise immediately, not wait for the next /auth/me poll. */
  clearAuth() {
    this._currentUser.set(null);
  }
  listPendingRegistrations() {
    return this.api.getPendingRegistrations();
  }
  approveRegistration(id, payload) {
    return this.api.approveRegistration(id, payload);
  }
  rejectRegistration(id, payload) {
    return this.api.rejectRegistration(id, payload);
  }
  static \u0275fac = function AuthService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AuthService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AuthService, factory: _AuthService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AuthService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();
var REGISTRATION_TYPE_LABEL = {
  agency: "Data entry authorised agency",
  expert: "External expert",
  public: "Public user"
};

export {
  AuthService,
  REGISTRATION_TYPE_LABEL
};
//# debugId=bdc149d6-4460-5e9b-b385-c919097a231a
//# sourceMappingURL=chunk-KEKSJGJ2.js.map
