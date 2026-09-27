import {
  HttpClient,
  Injectable,
  environment,
  inject,
  setClassMetadata,
  signal,
  ɵɵdefineInjectable
} from "./chunk-SAQOEXKZ.js";

// src/app/core/services/taxonomy.service.ts
var TaxonomyService = class _TaxonomyService {
  http = inject(HttpClient);
  state = signal(
    null,
    ...ngDevMode ? [{ debugName: "state" }] : (
      /* istanbul ignore next */
      []
    )
  );
  failed = signal(
    null,
    ...ngDevMode ? [{ debugName: "failed" }] : (
      /* istanbul ignore next */
      []
    )
  );
  started = false;
  taxonomy = this.state.asReadonly();
  error = this.failed.asReadonly();
  load() {
    if (this.started)
      return;
    this.started = true;
    this.http.get(`${environment.apiBaseUrl}/reference/taxonomy`).subscribe({
      next: (t) => this.state.set(t),
      error: (err) => {
        this.started = false;
        this.failed.set(err?.message ?? "Could not load the filter options.");
      }
    });
  }
  static \u0275fac = function TaxonomyService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _TaxonomyService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TaxonomyService, factory: _TaxonomyService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TaxonomyService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();

export {
  TaxonomyService
};
//# debugId=c4d126ef-c804-5506-b167-77082add52c3
//# sourceMappingURL=chunk-BK36RS6Q.js.map
