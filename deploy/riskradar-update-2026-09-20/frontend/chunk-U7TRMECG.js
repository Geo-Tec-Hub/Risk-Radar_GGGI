import {
  AuthService
} from "./chunk-KEKSJGJ2.js";
import "./chunk-QBP7AOH4.js";
import "./chunk-HN3O3DC2.js";
import {
  Router,
  RouterLink
} from "./chunk-UFWDULIL.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgControlStatusGroup,
  NgForm,
  NgModel,
  RequiredValidator,
  ɵNgNoValidate
} from "./chunk-4UD6LJ7E.js";
import {
  Component,
  inject,
  setClassMetadata,
  signal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵcontrol,
  ɵɵcontrolCreate,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵproperty,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-SAQOEXKZ.js";

// src/app/features/auth/login-page.component.ts
function LoginPageComponent_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
var LoginPageComponent = class _LoginPageComponent {
  auth = inject(AuthService);
  router = inject(Router);
  email = signal(
    "",
    ...ngDevMode ? [{ debugName: "email" }] : (
      /* istanbul ignore next */
      []
    )
  );
  password = signal(
    "",
    ...ngDevMode ? [{ debugName: "password" }] : (
      /* istanbul ignore next */
      []
    )
  );
  submitting = signal(
    false,
    ...ngDevMode ? [{ debugName: "submitting" }] : (
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
  submit() {
    if (!this.email() || !this.password())
      return;
    this.submitting.set(true);
    this.error.set(null);
    this.auth.login({ email: this.email(), password: this.password() }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigateByUrl(this.auth.landingRouteForCurrentUser());
      },
      error: (err) => {
        this.error.set(err.message);
        this.submitting.set(false);
      }
    });
  }
  static \u0275fac = function LoginPageComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LoginPageComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LoginPageComponent, selectors: [["app-login-page"]], decls: 19, vars: 5, consts: [[1, "auth"], [1, "auth__form", 3, "submit"], [1, "auth__field"], ["type", "email", "autocomplete", "username", "name", "email", "required", "", 3, "ngModelChange", "ngModel"], ["type", "password", "autocomplete", "current-password", "name", "password", "required", "", 3, "ngModelChange", "ngModel"], ["role", "alert", 1, "auth__error"], ["type", "submit", 3, "disabled"], [1, "auth__switch"], ["routerLink", "/register"]], template: function LoginPageComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "h2");
      \u0275\u0275text(2, "Sign in");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "form", 1);
      \u0275\u0275listener("submit", function LoginPageComponent_Template_form_submit_3_listener($event) {
        $event.preventDefault();
        return ctx.submit();
      });
      \u0275\u0275elementStart(4, "label", 2)(5, "span");
      \u0275\u0275text(6, "Email");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "input", 3);
      \u0275\u0275listener("ngModelChange", function LoginPageComponent_Template_input_ngModelChange_7_listener($event) {
        return ctx.email.set($event);
      });
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "label", 2)(9, "span");
      \u0275\u0275text(10, "Password");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(11, "input", 4);
      \u0275\u0275listener("ngModelChange", function LoginPageComponent_Template_input_ngModelChange_11_listener($event) {
        return ctx.password.set($event);
      });
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(12, LoginPageComponent_Conditional_12_Template, 2, 1, "p", 5);
      \u0275\u0275elementStart(13, "button", 6);
      \u0275\u0275text(14);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(15, "p", 7);
      \u0275\u0275text(16, "No account yet? ");
      \u0275\u0275elementStart(17, "a", 8);
      \u0275\u0275text(18, "Register");
      \u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      let tmp_4_0;
      \u0275\u0275advance(7);
      \u0275\u0275property("ngModel", ctx.email());
      \u0275\u0275control();
      \u0275\u0275advance(4);
      \u0275\u0275property("ngModel", ctx.password());
      \u0275\u0275control();
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_4_0 = ctx.error()) ? 12 : -1, tmp_4_0);
      \u0275\u0275advance();
      \u0275\u0275property("disabled", ctx.submitting() || !ctx.email() || !ctx.password());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.submitting() ? "Signing in\u2026" : "Sign in", " ");
    }
  }, dependencies: [FormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, RequiredValidator, NgModel, NgForm, RouterLink], styles: ["\n.auth[_ngcontent-%COMP%] {\n  max-width: 380px;\n  margin: 3rem auto;\n  padding: 0 1.5rem;\n}\n.auth__form[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n  margin: 1.5rem 0;\n}\n.auth__field[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.8125rem;\n  color: #495057;\n}\n.auth__field[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  padding: 0.5rem 0.6rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-size: 0.9375rem;\n}\n.auth__error[_ngcontent-%COMP%] {\n  color: #c92a2a;\n  background: #fff5f5;\n  border: 1px solid #ffc9c9;\n  border-radius: 4px;\n  padding: 0.5rem 0.75rem;\n  font-size: 0.8125rem;\n  margin: 0;\n}\nbutton[type=submit][_ngcontent-%COMP%] {\n  padding: 0.6rem 1rem;\n  border: none;\n  border-radius: 4px;\n  background: #1c3d5a;\n  color: #fff;\n  cursor: pointer;\n  font-size: 0.9375rem;\n}\nbutton[type=submit][_ngcontent-%COMP%]:disabled {\n  background: #adb5bd;\n  cursor: not-allowed;\n}\nbutton[type=submit][_ngcontent-%COMP%]:not(:disabled):hover {\n  background: #163049;\n}\n.auth__switch[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: #868e96;\n}\n/*# sourceMappingURL=login-page.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LoginPageComponent, [{
    type: Component,
    args: [{ selector: "app-login-page", standalone: true, imports: [FormsModule, RouterLink], template: `<div class="auth">
  <h2>Sign in</h2>

  <form class="auth__form" (submit)="$event.preventDefault(); submit()">
    <label class="auth__field">
      <span>Email</span>
      <input type="email" autocomplete="username" [ngModel]="email()" name="email" (ngModelChange)="email.set($event)" required />
    </label>

    <label class="auth__field">
      <span>Password</span>
      <input type="password" autocomplete="current-password" [ngModel]="password()" name="password" (ngModelChange)="password.set($event)" required />
    </label>

    @if (error(); as message) {
      <p class="auth__error" role="alert">{{ message }}</p>
    }

    <button type="submit" [disabled]="submitting() || !email() || !password()">
      {{ submitting() ? 'Signing in\u2026' : 'Sign in' }}
    </button>
  </form>

  <p class="auth__switch">No account yet? <a routerLink="/register">Register</a></p>
</div>
`, styles: ["/* src/app/features/auth/login-page.component.scss */\n.auth {\n  max-width: 380px;\n  margin: 3rem auto;\n  padding: 0 1.5rem;\n}\n.auth__form {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n  margin: 1.5rem 0;\n}\n.auth__field {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.8125rem;\n  color: #495057;\n}\n.auth__field input {\n  padding: 0.5rem 0.6rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-size: 0.9375rem;\n}\n.auth__error {\n  color: #c92a2a;\n  background: #fff5f5;\n  border: 1px solid #ffc9c9;\n  border-radius: 4px;\n  padding: 0.5rem 0.75rem;\n  font-size: 0.8125rem;\n  margin: 0;\n}\nbutton[type=submit] {\n  padding: 0.6rem 1rem;\n  border: none;\n  border-radius: 4px;\n  background: #1c3d5a;\n  color: #fff;\n  cursor: pointer;\n  font-size: 0.9375rem;\n}\nbutton[type=submit]:disabled {\n  background: #adb5bd;\n  cursor: not-allowed;\n}\nbutton[type=submit]:not(:disabled):hover {\n  background: #163049;\n}\n.auth__switch {\n  font-size: 0.8125rem;\n  color: #868e96;\n}\n/*# sourceMappingURL=login-page.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LoginPageComponent, { className: "LoginPageComponent", filePath: "src/app/features/auth/login-page.component.ts", lineNumber: 16 });
})();
export {
  LoginPageComponent
};
//# debugId=f957498b-b82b-5f92-936d-874962427faf
//# sourceMappingURL=chunk-U7TRMECG.js.map
