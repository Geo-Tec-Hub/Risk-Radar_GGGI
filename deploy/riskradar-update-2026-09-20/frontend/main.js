import {
  AuthService
} from "./chunk-KEKSJGJ2.js";
import {
  ApiClientService
} from "./chunk-QBP7AOH4.js";
import "./chunk-HN3O3DC2.js";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  bootstrapApplication,
  provideRouter
} from "./chunk-UFWDULIL.js";
import {
  Component,
  HttpErrorResponse,
  catchError,
  inject,
  map,
  of,
  provideBrowserGlobalErrorListeners,
  provideHttpClient,
  setClassMetadata,
  signal,
  throwError,
  withInterceptors,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵdomElement,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵdomListener,
  ɵɵdomProperty,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-SAQOEXKZ.js";

// src/app/core/interceptors/api-error.interceptor.ts
var apiErrorInterceptor = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) auth.clearAuth();
        const apiError = {
          status: err.status,
          message: err.status === 0 ? "Could not reach the server." : err.error?.detail ?? err.message ?? `Request failed (${err.status}).`
        };
        return throwError(() => apiError);
      }
      return throwError(() => err);
    })
  );
};

// src/app/core/guards/admin.guard.ts
var adminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.refreshMe().pipe(
    map(() => {
      if (auth.hasRole("admin")) return true;
      return router.createUrlTree(["/login"]);
    }),
    // refreshMe() rethrows a 401 (see AuthService.refreshMe) after already
    // clearing currentUser -- a guard observable that errors fails the
    // navigation outright rather than redirecting, so catch it here too.
    catchError(() => of(router.createUrlTree(["/login"])))
  );
};

// src/app/app.routes.ts
var routes = [
  {
    path: "",
    loadComponent: () => import("./chunk-C36Q4SZ7.js").then((m) => m.LandingPageComponent),
    title: "Risk Radar",
    pathMatch: "full"
  },
  {
    path: "map",
    // Moved from '/' (T2b): the landing page is now the front door, but the
    // map must stay one click away with no account (FR-12.7, §3.1).
    loadComponent: () => import("./chunk-QJIX3BT5.js").then((m) => m.MapPageComponent),
    title: "Risk Radar \u2014 Climate Vulnerability Map"
  },
  {
    path: "login",
    loadComponent: () => import("./chunk-U7TRMECG.js").then((m) => m.LoginPageComponent),
    title: "Risk Radar \u2014 Sign in"
  },
  {
    path: "register",
    loadComponent: () => import("./chunk-H3IOY4A2.js").then((m) => m.RegisterPageComponent),
    title: "Risk Radar \u2014 Register"
  },
  {
    path: "admin/registrations",
    loadComponent: () => import("./chunk-BLQXDUAC.js").then((m) => m.AdminRegistrationsComponent),
    title: "Risk Radar \u2014 Registrations",
    canActivate: [adminGuard]
  },
  {
    // The model behind the map: profile variables, hazard types, and who may
    // write what. Separate from /admin/registrations, which approves accounts.
    path: "admin/model",
    loadComponent: () => import("./chunk-LR4UULVH.js").then((m) => m.AdminModelComponent),
    title: "Risk Radar \u2014 Model administration",
    canActivate: [adminGuard]
  },
  {
    path: "coverage",
    // FR-5.17 / Stage 5.6: why each profile in a province is or is not on the
    // map -- weights unfinished, values missing, or simply not recomputed.
    loadComponent: () => import("./chunk-A65OBDDP.js").then((m) => m.CoveragePageComponent),
    title: "Risk Radar \u2014 Coverage"
  },
  {
    // '/entry' WAS a scope picker that resolved province/sector/subsector/
    // hazard/period and then handed them to this screen or to /weights through
    // the URL. Import grew the same picker of its own, so the step became one
    // extra click that asked for exactly what the next screen asked for again.
    // Redirected rather than deleted: /weights, /admin/model and the post-login
    // landing for officers all still point at it, and query params survive a
    // router redirect, so a link carrying a scope still arrives with it.
    path: "entry",
    redirectTo: "import",
    pathMatch: "full"
  },
  {
    // The import tab: pick a scope, check the workbook, load it.
    path: "import",
    loadComponent: () => import("./chunk-GRPWQNOL.js").then((m) => m.ImportPageComponent),
    title: "Risk Radar \u2014 Import data"
  },
  {
    path: "weights",
    loadComponent: () => import("./chunk-5WJOYKHN.js").then((m) => m.WeightsEditorComponent),
    title: "Risk Radar \u2014 Profile weights"
  },
  {
    // The earlier upload screen, kept reachable but no longer at '/import'.
    // It was a SECOND route with that same path: the router takes the first
    // match, so it had become dead code that still compiled, still passed
    // type-checking and would have been found only by someone wondering why
    // their edits to it changed nothing. It targets `POST /imports`, which the
    // backend does not implement — the live tab uses /api/import/check|load.
    path: "import/legacy-upload",
    loadComponent: () => import("./chunk-XYPWNRFP.js").then((m) => m.ImportUploadComponent),
    title: "Risk Radar \u2014 Import (legacy screen)"
  },
  { path: "**", redirectTo: "" }
];

// src/app/app.config.ts
var appConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiErrorInterceptor]))
  ]
};

// src/app/shared/backend-status.component.ts
function BackendStatusComponent_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Backend connected ");
  }
}
function BackendStatusComponent_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Backend unreachable ");
  }
}
function BackendStatusComponent_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Checking backend\u2026 ");
  }
}
var BackendStatusComponent = class _BackendStatusComponent {
  api = inject(ApiClientService);
  status = signal(
    "checking",
    ...ngDevMode ? [{ debugName: "status" }] : (
      /* istanbul ignore next */
      []
    )
  );
  error = signal(
    null,
    ...ngDevMode ? [{ debugName: "error" }] : (
      /* istanbul ignore next */
      []
    )
  );
  constructor() {
    this.check();
  }
  check() {
    this.status.set("checking");
    this.error.set(null);
    this.api.getHealth().subscribe({
      next: () => this.status.set("connected"),
      error: (err) => {
        this.status.set("error");
        this.error.set(err.message);
      }
    });
  }
  static \u0275fac = function BackendStatusComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BackendStatusComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _BackendStatusComponent, selectors: [["app-backend-status"]], decls: 5, vars: 8, consts: [["type", "button", 1, "backend-status", 3, "click", "title"], [1, "backend-status__dot"]], template: function BackendStatusComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275domElementStart(0, "button", 0);
      \u0275\u0275domListener("click", function BackendStatusComponent_Template_button_click_0_listener() {
        return ctx.check();
      });
      \u0275\u0275domElement(1, "span", 1);
      \u0275\u0275conditionalCreate(2, BackendStatusComponent_Case_2_Template, 1, 0)(3, BackendStatusComponent_Case_3_Template, 1, 0)(4, BackendStatusComponent_Case_4_Template, 1, 0);
      \u0275\u0275domElementEnd();
    }
    if (rf & 2) {
      let tmp_4_0;
      \u0275\u0275classProp("backend-status--connected", ctx.status() === "connected")("backend-status--error", ctx.status() === "error")("backend-status--checking", ctx.status() === "checking");
      \u0275\u0275domProperty("title", ctx.error() ?? "GET /api/health \u2014 click to recheck");
      \u0275\u0275advance(2);
      \u0275\u0275conditional((tmp_4_0 = ctx.status()) === "connected" ? 2 : tmp_4_0 === "error" ? 3 : 4);
    }
  }, styles: ["\n.backend-status[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.4rem;\n  padding: 0.25rem 0.6rem;\n  border: 1px solid transparent;\n  border-radius: 999px;\n  background: rgba(255, 255, 255, 0.1);\n  color: #cdd8e3;\n  font-size: 0.75rem;\n  cursor: pointer;\n}\n.backend-status__dot[_ngcontent-%COMP%] {\n  width: 0.5rem;\n  height: 0.5rem;\n  border-radius: 50%;\n  background: #adb5bd;\n}\n.backend-status--checking[_ngcontent-%COMP%]   .backend-status__dot[_ngcontent-%COMP%] {\n  background: #f5c518;\n}\n.backend-status--connected[_ngcontent-%COMP%] {\n  color: #b2f2bb;\n}\n.backend-status--connected[_ngcontent-%COMP%]   .backend-status__dot[_ngcontent-%COMP%] {\n  background: #2f9e44;\n}\n.backend-status--error[_ngcontent-%COMP%] {\n  color: #ffc9c9;\n}\n.backend-status--error[_ngcontent-%COMP%]   .backend-status__dot[_ngcontent-%COMP%] {\n  background: #c92a2a;\n}\n/*# sourceMappingURL=backend-status.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BackendStatusComponent, [{
    type: Component,
    args: [{ selector: "app-backend-status", standalone: true, template: `<button
  type="button"
  class="backend-status"
  [class.backend-status--connected]="status() === 'connected'"
  [class.backend-status--error]="status() === 'error'"
  [class.backend-status--checking]="status() === 'checking'"
  [title]="error() ?? 'GET /api/health \u2014 click to recheck'"
  (click)="check()"
>
  <span class="backend-status__dot"></span>
  @switch (status()) {
    @case ('connected') { Backend connected }
    @case ('error') { Backend unreachable }
    @default { Checking backend\u2026 }
  }
</button>
`, styles: ["/* src/app/shared/backend-status.component.scss */\n.backend-status {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.4rem;\n  padding: 0.25rem 0.6rem;\n  border: 1px solid transparent;\n  border-radius: 999px;\n  background: rgba(255, 255, 255, 0.1);\n  color: #cdd8e3;\n  font-size: 0.75rem;\n  cursor: pointer;\n}\n.backend-status__dot {\n  width: 0.5rem;\n  height: 0.5rem;\n  border-radius: 50%;\n  background: #adb5bd;\n}\n.backend-status--checking .backend-status__dot {\n  background: #f5c518;\n}\n.backend-status--connected {\n  color: #b2f2bb;\n}\n.backend-status--connected .backend-status__dot {\n  background: #2f9e44;\n}\n.backend-status--error {\n  color: #ffc9c9;\n}\n.backend-status--error .backend-status__dot {\n  background: #c92a2a;\n}\n/*# sourceMappingURL=backend-status.component.css.map */\n"] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(BackendStatusComponent, { className: "BackendStatusComponent", filePath: "src/app/shared/backend-status.component.ts", lineNumber: 19 });
})();

// src/app/app.ts
function App_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 10);
    \u0275\u0275text(1, "Registrations");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "a", 11);
    \u0275\u0275text(3, "Model");
    \u0275\u0275elementEnd();
  }
}
function App_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 8)(1, "span", 12);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 13);
    \u0275\u0275listener("click", function App_Conditional_14_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.signOut());
    });
    \u0275\u0275text(4, "Sign out");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Signed in as ", ctx_r1.auth.currentUser()?.full_name);
  }
}
function App_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 8)(1, "a", 14);
    \u0275\u0275text(2, "Sign in");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "a", 15);
    \u0275\u0275text(4, "Register");
    \u0275\u0275elementEnd()();
  }
}
var App = class _App {
  auth = inject(AuthService);
  router = inject(Router);
  constructor() {
    this.auth.refreshMe().subscribe();
  }
  signOut() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl("/"));
  }
  static \u0275fac = function App_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _App)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _App, selectors: [["app-root"]], decls: 19, vars: 2, consts: [[1, "app-shell"], [1, "app-header"], ["routerLink", "/", 1, "app-header__title"], [1, "app-header__subtitle"], [1, "app-header__nav"], ["routerLink", "/map", "routerLinkActive", "is-active"], ["routerLink", "/coverage", "routerLinkActive", "is-active"], ["routerLink", "/import", "routerLinkActive", "is-active"], [1, "app-header__user"], [1, "app-main"], ["routerLink", "/admin/registrations", "routerLinkActive", "is-active"], ["routerLink", "/admin/model", "routerLinkActive", "is-active"], [1, "app-header__whoami"], ["type", "button", 1, "app-header__signout", 3, "click"], ["routerLink", "/login"], ["routerLink", "/register"]], template: function App_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "header", 1)(2, "a", 2);
      \u0275\u0275text(3, "Risk Radar");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(4, "span", 3);
      \u0275\u0275text(5, "DS-Division Climate Vulnerability \u2014 Sri Lanka");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "nav", 4)(7, "a", 5);
      \u0275\u0275text(8, "Map");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "a", 6);
      \u0275\u0275text(10, "Coverage");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(11, "a", 7);
      \u0275\u0275text(12, "Import");
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(13, App_Conditional_13_Template, 4, 0);
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(14, App_Conditional_14_Template, 5, 1, "span", 8)(15, App_Conditional_15_Template, 5, 0, "span", 8);
      \u0275\u0275element(16, "app-backend-status");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(17, "main", 9);
      \u0275\u0275element(18, "router-outlet");
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(13);
      \u0275\u0275conditional(ctx.auth.hasRole("admin") ? 13 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.auth.checked() && ctx.auth.isAuthenticated() ? 14 : ctx.auth.checked() ? 15 : -1);
    }
  }, dependencies: [RouterOutlet, RouterLink, RouterLinkActive, BackendStatusComponent], styles: ["\n.app-shell[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n}\n.app-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: baseline;\n  gap: 0.75rem;\n  padding: 0.6rem 1.25rem;\n  background: #1c3d5a;\n  color: #fff;\n  flex-shrink: 0;\n}\n.app-header__title[_ngcontent-%COMP%] {\n  font-weight: 700;\n  font-size: 1.1rem;\n  color: #fff;\n  text-decoration: none;\n}\n.app-header__subtitle[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: #cdd8e3;\n}\n.app-header__nav[_ngcontent-%COMP%] {\n  margin-left: auto;\n  display: flex;\n  gap: 1rem;\n}\n.app-header__nav[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {\n  color: #cdd8e3;\n  text-decoration: none;\n  font-size: 0.875rem;\n}\n.app-header__nav[_ngcontent-%COMP%]   a.is-active[_ngcontent-%COMP%] {\n  color: #fff;\n  font-weight: 600;\n}\n.app-header__nav[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {\n  color: #fff;\n}\n.app-header__user[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  font-size: 0.8125rem;\n  color: #cdd8e3;\n}\n.app-header__user[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {\n  color: #cdd8e3;\n  text-decoration: none;\n}\n.app-header__user[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {\n  color: #fff;\n}\n.app-header__signout[_ngcontent-%COMP%] {\n  padding: 0.25rem 0.6rem;\n  border: 1px solid #4a6a89;\n  border-radius: 4px;\n  background: transparent;\n  color: #cdd8e3;\n  cursor: pointer;\n  font-size: 0.75rem;\n}\n.app-header__signout[_ngcontent-%COMP%]:hover {\n  border-color: #fff;\n  color: #fff;\n}\n.app-main[_ngcontent-%COMP%] {\n  flex: 1;\n  min-height: 0;\n}\n.app-header__whoami[_ngcontent-%COMP%] {\n  font-size: 0.78rem;\n  color: #adb5bd;\n  font-weight: 400;\n  cursor: default;\n}\n/*# sourceMappingURL=app.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(App, [{
    type: Component,
    args: [{ selector: "app-root", imports: [RouterOutlet, RouterLink, RouterLinkActive, BackendStatusComponent], template: `<div class="app-shell">
  <header class="app-header">
    <a class="app-header__title" routerLink="/">Risk Radar</a>
    <span class="app-header__subtitle">DS-Division Climate Vulnerability \u2014 Sri Lanka</span>
    <nav class="app-header__nav">
      <a routerLink="/map" routerLinkActive="is-active">Map</a>
      <a routerLink="/coverage" routerLinkActive="is-active">Coverage</a>
      <a routerLink="/import" routerLinkActive="is-active">Import</a>
      @if (auth.hasRole('admin')) {
        <a routerLink="/admin/registrations" routerLinkActive="is-active">Registrations</a>
        <a routerLink="/admin/model" routerLinkActive="is-active">Model</a>
      }
    </nav>

    @if (auth.checked() && auth.isAuthenticated()) {
      <span class="app-header__user">
        <span class="app-header__whoami">Signed in as {{ auth.currentUser()?.full_name }}</span>
        <button type="button" class="app-header__signout" (click)="signOut()">Sign out</button>
      </span>
    } @else if (auth.checked()) {
      <span class="app-header__user">
        <a routerLink="/login">Sign in</a>
        <a routerLink="/register">Register</a>
      </span>
    }

    <app-backend-status />
  </header>

  <main class="app-main">
    <router-outlet />
  </main>
</div>
`, styles: ["/* src/app/app.scss */\n.app-shell {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n}\n.app-header {\n  display: flex;\n  align-items: baseline;\n  gap: 0.75rem;\n  padding: 0.6rem 1.25rem;\n  background: #1c3d5a;\n  color: #fff;\n  flex-shrink: 0;\n}\n.app-header__title {\n  font-weight: 700;\n  font-size: 1.1rem;\n  color: #fff;\n  text-decoration: none;\n}\n.app-header__subtitle {\n  font-size: 0.8125rem;\n  color: #cdd8e3;\n}\n.app-header__nav {\n  margin-left: auto;\n  display: flex;\n  gap: 1rem;\n}\n.app-header__nav a {\n  color: #cdd8e3;\n  text-decoration: none;\n  font-size: 0.875rem;\n}\n.app-header__nav a.is-active {\n  color: #fff;\n  font-weight: 600;\n}\n.app-header__nav a:hover {\n  color: #fff;\n}\n.app-header__user {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  font-size: 0.8125rem;\n  color: #cdd8e3;\n}\n.app-header__user a {\n  color: #cdd8e3;\n  text-decoration: none;\n}\n.app-header__user a:hover {\n  color: #fff;\n}\n.app-header__signout {\n  padding: 0.25rem 0.6rem;\n  border: 1px solid #4a6a89;\n  border-radius: 4px;\n  background: transparent;\n  color: #cdd8e3;\n  cursor: pointer;\n  font-size: 0.75rem;\n}\n.app-header__signout:hover {\n  border-color: #fff;\n  color: #fff;\n}\n.app-main {\n  flex: 1;\n  min-height: 0;\n}\n.app-header__whoami {\n  font-size: 0.78rem;\n  color: #adb5bd;\n  font-weight: 400;\n  cursor: default;\n}\n/*# sourceMappingURL=app.css.map */\n"] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(App, { className: "App", filePath: "src/app/app.ts", lineNumber: 13 });
})();

// src/main.ts
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
//# debugId=685045d2-0c92-5d38-98a2-7085a97e08ce
//# sourceMappingURL=main.js.map
