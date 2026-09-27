import {
  AuthService
} from "./chunk-KEKSJGJ2.js";
import "./chunk-QBP7AOH4.js";
import "./chunk-HN3O3DC2.js";
import {
  RouterLink
} from "./chunk-UFWDULIL.js";
import {
  Component,
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-SAQOEXKZ.js";

// src/app/features/landing/landing-page.component.ts
function LandingPageComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("routerLink", ctx_r0.auth.landingRouteForCurrentUser());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Continue as ", ctx_r0.auth.currentUser()?.full_name, " ");
  }
}
function LandingPageComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 8);
    \u0275\u0275text(1, "Sign in");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "a", 9);
    \u0275\u0275text(3, "Register");
    \u0275\u0275elementEnd();
  }
}
var LandingPageComponent = class _LandingPageComponent {
  auth = inject(AuthService);
  static \u0275fac = function LandingPageComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LandingPageComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LandingPageComponent, selectors: [["app-landing-page"]], decls: 14, vars: 1, consts: [[1, "landing"], [1, "landing__title"], [1, "landing__subtitle"], [1, "landing__lead"], [1, "landing__actions"], ["routerLink", "/map", 1, "landing__cta", "landing__cta--primary"], [1, "landing__cta", 3, "routerLink"], [1, "landing__note"], ["routerLink", "/login", 1, "landing__cta"], ["routerLink", "/register", 1, "landing__cta"]], template: function LandingPageComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "h1", 1);
      \u0275\u0275text(2, "Risk Radar");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "p", 2);
      \u0275\u0275text(4, "DS-Division Climate Vulnerability Assessment \u2014 Sri Lanka");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "p", 3);
      \u0275\u0275text(6, " Explore hazard and exposure across every DS division, no account required. Sign in to submit data, set profile weights, or review community input. ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "div", 4)(8, "a", 5);
      \u0275\u0275text(9, "View the map");
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(10, LandingPageComponent_Conditional_10_Template, 2, 2, "a", 6)(11, LandingPageComponent_Conditional_11_Template, 4, 0);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(12, "p", 7);
      \u0275\u0275text(13, " Registration is reviewed by an administrator before an account can enter or change any data. Viewing the map never requires approval. ");
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(10);
      \u0275\u0275conditional(ctx.auth.checked() && ctx.auth.isAuthenticated() ? 10 : 11);
    }
  }, dependencies: [RouterLink], styles: ["\n.landing[_ngcontent-%COMP%] {\n  max-width: 640px;\n  margin: 4rem auto;\n  padding: 0 1.5rem;\n  text-align: center;\n}\n.landing__title[_ngcontent-%COMP%] {\n  font-size: 2rem;\n  margin: 0 0 0.25rem;\n  color: #1c3d5a;\n}\n.landing__subtitle[_ngcontent-%COMP%] {\n  color: #495057;\n  margin: 0 0 1.5rem;\n}\n.landing__lead[_ngcontent-%COMP%] {\n  color: #343a40;\n  line-height: 1.5;\n}\n.landing__actions[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: center;\n  gap: 0.75rem;\n  margin: 1.75rem 0;\n  flex-wrap: wrap;\n}\n.landing__cta[_ngcontent-%COMP%] {\n  padding: 0.6rem 1.25rem;\n  border-radius: 4px;\n  border: 1px solid #1c3d5a;\n  color: #1c3d5a;\n  text-decoration: none;\n  font-size: 0.9375rem;\n}\n.landing__cta[_ngcontent-%COMP%]:hover {\n  background: #eef2f6;\n}\n.landing__cta--primary[_ngcontent-%COMP%] {\n  background: #1c3d5a;\n  color: #fff;\n}\n.landing__cta--%NS%primary[_ngcontent-%COMP%]:hover {\n  background: #163049;\n}\n.landing__note[_ngcontent-%COMP%] {\n  color: #868e96;\n  font-size: 0.8125rem;\n}\n/*# sourceMappingURL=landing-page.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LandingPageComponent, [{
    type: Component,
    args: [{ selector: "app-landing-page", standalone: true, imports: [RouterLink], template: '<div class="landing">\n  <h1 class="landing__title">Risk Radar</h1>\n  <p class="landing__subtitle">DS-Division Climate Vulnerability Assessment \u2014 Sri Lanka</p>\n\n  <p class="landing__lead">\n    Explore hazard and exposure across every DS division, no account required. Sign in to\n    submit data, set profile weights, or review community input.\n  </p>\n\n  <div class="landing__actions">\n    <a class="landing__cta landing__cta--primary" routerLink="/map">View the map</a>\n\n    @if (auth.checked() && auth.isAuthenticated()) {\n      <a class="landing__cta" [routerLink]="auth.landingRouteForCurrentUser()">\n        Continue as {{ auth.currentUser()?.full_name }}\n      </a>\n    } @else {\n      <a class="landing__cta" routerLink="/login">Sign in</a>\n      <a class="landing__cta" routerLink="/register">Register</a>\n    }\n  </div>\n\n  <p class="landing__note">\n    Registration is reviewed by an administrator before an account can enter or change any\n    data. Viewing the map never requires approval.\n  </p>\n</div>\n', styles: ["/* src/app/features/landing/landing-page.component.scss */\n.landing {\n  max-width: 640px;\n  margin: 4rem auto;\n  padding: 0 1.5rem;\n  text-align: center;\n}\n.landing__title {\n  font-size: 2rem;\n  margin: 0 0 0.25rem;\n  color: #1c3d5a;\n}\n.landing__subtitle {\n  color: #495057;\n  margin: 0 0 1.5rem;\n}\n.landing__lead {\n  color: #343a40;\n  line-height: 1.5;\n}\n.landing__actions {\n  display: flex;\n  justify-content: center;\n  gap: 0.75rem;\n  margin: 1.75rem 0;\n  flex-wrap: wrap;\n}\n.landing__cta {\n  padding: 0.6rem 1.25rem;\n  border-radius: 4px;\n  border: 1px solid #1c3d5a;\n  color: #1c3d5a;\n  text-decoration: none;\n  font-size: 0.9375rem;\n}\n.landing__cta:hover {\n  background: #eef2f6;\n}\n.landing__cta--primary {\n  background: #1c3d5a;\n  color: #fff;\n}\n.landing__cta--primary:hover {\n  background: #163049;\n}\n.landing__note {\n  color: #868e96;\n  font-size: 0.8125rem;\n}\n/*# sourceMappingURL=landing-page.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LandingPageComponent, { className: "LandingPageComponent", filePath: "src/app/features/landing/landing-page.component.ts", lineNumber: 19 });
})();
export {
  LandingPageComponent
};
//# debugId=d153d84b-e8d8-5543-8132-279fcd3b7b30
//# sourceMappingURL=chunk-C36Q4SZ7.js.map
