import {
  AuthService,
  REGISTRATION_TYPE_LABEL
} from "./chunk-KEKSJGJ2.js";
import {
  ApiClientService
} from "./chunk-QBP7AOH4.js";
import {
  PROVINCE_OPTIONS
} from "./chunk-HN3O3DC2.js";
import {
  Router,
  RouterLink
} from "./chunk-UFWDULIL.js";
import {
  DefaultValueAccessor,
  FormsModule,
  MinLengthValidator,
  NgControlStatus,
  NgControlStatusGroup,
  NgForm,
  NgModel,
  NgSelectOption,
  RequiredValidator,
  SelectControlValueAccessor,
  ɵNgNoValidate,
  ɵNgSelectMultipleOption
} from "./chunk-4UD6LJ7E.js";
import {
  Component,
  computed,
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
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-SAQOEXKZ.js";

// src/app/features/auth/register-page.component.ts
var _forTrack0 = ($index, $item) => $item.id;
var _forTrack1 = ($index, $item) => $item.code;
function RegisterPageComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "p");
    \u0275\u0275text(2, " Thanks \u2014 the registration for ");
    \u0275\u0275elementStart(3, "strong");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5, " is submitted. An administrator reviews every registration before the account can enter or change any data; you'll be able to sign in once it's approved. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "button", 2);
    \u0275\u0275listener("click", function RegisterPageComponent_Conditional_3_Template_button_click_6_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.goToLogin());
    });
    \u0275\u0275text(7, "Go to sign in");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx);
  }
}
function RegisterPageComponent_Conditional_4_For_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const t_r4 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngValue", t_r4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.typeLabel[t_r4]);
  }
}
function RegisterPageComponent_Conditional_4_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label", 4)(1, "span");
    \u0275\u0275text(2, "Organization");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "input", 15);
    \u0275\u0275listener("ngModelChange", function RegisterPageComponent_Conditional_4_Conditional_11_Template_input_ngModelChange_3_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.organization.set($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", ctx_r1.organization());
    \u0275\u0275control();
  }
}
function RegisterPageComponent_Conditional_4_Conditional_12_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r7 = ctx.$implicit;
    \u0275\u0275property("ngValue", p_r7.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(p_r7.name);
  }
}
function RegisterPageComponent_Conditional_4_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label", 4)(1, "span");
    \u0275\u0275text(2, "Province ");
    \u0275\u0275elementStart(3, "em");
    \u0275\u0275text(4, "required");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "select", 16);
    \u0275\u0275listener("ngModelChange", function RegisterPageComponent_Conditional_4_Conditional_12_Template_select_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.provinceId.set($event));
    });
    \u0275\u0275elementStart(6, "option", 6);
    \u0275\u0275text(7, "Choose a province\u2026");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(8, RegisterPageComponent_Conditional_4_Conditional_12_For_9_Template, 2, 2, "option", 6, _forTrack0);
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", ctx_r1.provinceId());
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275property("ngValue", void 0);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.provinces);
  }
}
function RegisterPageComponent_Conditional_4_Conditional_13_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Couldn't load the sector list (", ctx, "). Please try again shortly \u2014 registering without it isn't possible, because the areas have to be real. ");
  }
}
function RegisterPageComponent_Conditional_4_Conditional_13_For_9_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "em");
    \u0275\u0275text(1, "all subsectors");
    \u0275\u0275elementEnd();
  }
}
function RegisterPageComponent_Conditional_4_Conditional_13_For_9_Conditional_6_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label", 23)(1, "input", 20);
    \u0275\u0275listener("change", function RegisterPageComponent_Conditional_4_Conditional_13_For_9_Conditional_6_For_2_Template_input_change_1_listener() {
      const sub_r12 = \u0275\u0275restoreView(_r11).$implicit;
      const sec_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.toggle(sec_r10.code, sub_r12.code));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const sub_r12 = ctx.$implicit;
    const sec_r10 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("checked", ctx_r1.isChosen(sec_r10.code, sub_r12.code));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(sub_r12.name);
  }
}
function RegisterPageComponent_Conditional_4_Conditional_13_For_9_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 22);
    \u0275\u0275repeaterCreate(1, RegisterPageComponent_Conditional_4_Conditional_13_For_9_Conditional_6_For_2_Template, 4, 2, "label", 23, _forTrack1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const sec_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275repeater(sec_r10.subsectors);
  }
}
function RegisterPageComponent_Conditional_4_Conditional_13_For_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 18)(1, "label", 21)(2, "input", 20);
    \u0275\u0275listener("change", function RegisterPageComponent_Conditional_4_Conditional_13_For_9_Template_input_change_2_listener() {
      const sec_r10 = \u0275\u0275restoreView(_r9).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.toggle(sec_r10.code));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275conditionalCreate(5, RegisterPageComponent_Conditional_4_Conditional_13_For_9_Conditional_5_Template, 2, 0, "em");
    \u0275\u0275elementEnd()();
    \u0275\u0275conditionalCreate(6, RegisterPageComponent_Conditional_4_Conditional_13_For_9_Conditional_6_Template, 3, 0, "div", 22);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const sec_r10 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275property("checked", ctx_r1.isChosen(sec_r10.code));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", sec_r10.name, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(sec_r10.subsectors.length ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(sec_r10.subsectors.length ? 6 : -1);
  }
}
function RegisterPageComponent_Conditional_4_Conditional_13_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" You've ticked a whole sector and one of its subsectors (", ctx_r1.redundant().join(", "), "). The whole-sector tick already covers every subsector, so keep one or the other. ");
  }
}
function RegisterPageComponent_Conditional_4_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "fieldset", 8)(1, "legend");
    \u0275\u0275text(2, "Where you work ");
    \u0275\u0275elementStart(3, "em");
    \u0275\u0275text(4, "at least one");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "p", 17);
    \u0275\u0275text(6, " Every dataset belongs to a sector and subsector, and an import replaces whatever was there before \u2014 so an account can only write to the areas it was granted. Tick the ones you work in; an administrator reviews them and may grant fewer. ");
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(7, RegisterPageComponent_Conditional_4_Conditional_13_Conditional_7_Template, 2, 1, "p", 11);
    \u0275\u0275repeaterCreate(8, RegisterPageComponent_Conditional_4_Conditional_13_For_9_Template, 7, 4, "div", 18, _forTrack1);
    \u0275\u0275conditionalCreate(10, RegisterPageComponent_Conditional_4_Conditional_13_Conditional_10_Template, 2, 1, "p", 11);
    \u0275\u0275elementStart(11, "label", 19)(12, "input", 20);
    \u0275\u0275listener("change", function RegisterPageComponent_Conditional_4_Conditional_13_Template_input_change_12_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.hazardDomain.set(!ctx_r1.hazardDomain()));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "span");
    \u0275\u0275text(14, "I also maintain the shared climate variables ");
    \u0275\u0275elementStart(15, "em");
    \u0275\u0275text(16, "rainfall, SPI, warm days, event counts \u2014 Met Department / DMC");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(17, "p", 17);
    \u0275\u0275text(18, " These twelve variables are used by every sector, so they're approved separately from the sectors above. ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_2_0;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(7);
    \u0275\u0275conditional((tmp_2_0 = ctx_r1.optionsError()) ? 7 : -1, tmp_2_0);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.sectorOptions());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r1.redundant().length ? 10 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("checked", ctx_r1.hazardDomain());
  }
}
function RegisterPageComponent_Conditional_4_Conditional_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function RegisterPageComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "form", 3);
    \u0275\u0275listener("submit", function RegisterPageComponent_Conditional_4_Template_form_submit_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.submit());
    });
    \u0275\u0275elementStart(1, "label", 4)(2, "span");
    \u0275\u0275text(3, "Registering as");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "select", 5);
    \u0275\u0275listener("ngModelChange", function RegisterPageComponent_Conditional_4_Template_select_ngModelChange_4_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onTypeChange($event));
    });
    \u0275\u0275repeaterCreate(5, RegisterPageComponent_Conditional_4_For_6_Template, 2, 2, "option", 6, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "label", 4)(8, "span");
    \u0275\u0275text(9, "Full name");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "input", 7);
    \u0275\u0275listener("ngModelChange", function RegisterPageComponent_Conditional_4_Template_input_ngModelChange_10_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.fullName.set($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(11, RegisterPageComponent_Conditional_4_Conditional_11_Template, 4, 1, "label", 4);
    \u0275\u0275conditionalCreate(12, RegisterPageComponent_Conditional_4_Conditional_12_Template, 10, 2, "label", 4);
    \u0275\u0275conditionalCreate(13, RegisterPageComponent_Conditional_4_Conditional_13_Template, 19, 3, "fieldset", 8);
    \u0275\u0275elementStart(14, "label", 4)(15, "span");
    \u0275\u0275text(16, "Email");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "input", 9);
    \u0275\u0275listener("ngModelChange", function RegisterPageComponent_Conditional_4_Template_input_ngModelChange_17_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.email.set($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "label", 4)(19, "span");
    \u0275\u0275text(20, "Password ");
    \u0275\u0275elementStart(21, "em");
    \u0275\u0275text(22, "8+ characters");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(23, "input", 10);
    \u0275\u0275listener("ngModelChange", function RegisterPageComponent_Conditional_4_Template_input_ngModelChange_23_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.password.set($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(24, RegisterPageComponent_Conditional_4_Conditional_24_Template, 2, 1, "p", 11);
    \u0275\u0275elementStart(25, "button", 12);
    \u0275\u0275text(26);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(27, "p", 13);
    \u0275\u0275text(28, "Already have an account? ");
    \u0275\u0275elementStart(29, "a", 14);
    \u0275\u0275text(30, "Sign in");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_13_0;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275property("ngModel", ctx_r1.type());
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.types);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", ctx_r1.fullName());
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.type() !== "public" ? 11 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.needsProvince() ? 12 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.needsInterestAreas() ? 13 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngModel", ctx_r1.email());
    \u0275\u0275control();
    \u0275\u0275advance(6);
    \u0275\u0275property("ngModel", ctx_r1.password());
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_13_0 = ctx_r1.error()) ? 24 : -1, tmp_13_0);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r1.submitting() || !ctx_r1.canSubmit());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.submitting() ? "Registering\u2026" : "Register", " ");
  }
}
var TYPES = ["agency", "expert", "public"];
var RegisterPageComponent = class _RegisterPageComponent {
  auth = inject(AuthService);
  api = inject(ApiClientService);
  router = inject(Router);
  types = TYPES;
  typeLabel = REGISTRATION_TYPE_LABEL;
  provinces = PROVINCE_OPTIONS;
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
  fullName = signal(
    "",
    ...ngDevMode ? [{ debugName: "fullName" }] : (
      /* istanbul ignore next */
      []
    )
  );
  organization = signal(
    "",
    ...ngDevMode ? [{ debugName: "organization" }] : (
      /* istanbul ignore next */
      []
    )
  );
  type = signal(
    "public",
    ...ngDevMode ? [{ debugName: "type" }] : (
      /* istanbul ignore next */
      []
    )
  );
  provinceId = signal(
    void 0,
    ...ngDevMode ? [{ debugName: "provinceId" }] : (
      /* istanbul ignore next */
      []
    )
  );
  needsProvince = computed(
    () => this.type() !== "public",
    ...ngDevMode ? [{ debugName: "needsProvince" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Same rule as the province, and for the same reason: interest areas say
   * where this person may WRITE, and a community account never writes. */
  needsInterestAreas = this.needsProvince;
  sectorOptions = signal(
    [],
    ...ngDevMode ? [{ debugName: "sectorOptions" }] : (
      /* istanbul ignore next */
      []
    )
  );
  optionsError = signal(
    null,
    ...ngDevMode ? [{ debugName: "optionsError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Keys are `SECTOR` for a whole sector and `SECTOR/SUBSECTOR` for one
   * subsector -- the same two shapes the API takes. */
  chosen = signal(
    /* @__PURE__ */ new Set(),
    ...ngDevMode ? [{ debugName: "chosen" }] : (
      /* istanbul ignore next */
      []
    )
  );
  hazardDomain = signal(
    false,
    ...ngDevMode ? [{ debugName: "hazardDomain" }] : (
      /* istanbul ignore next */
      []
    )
  );
  selectedAreas = computed(
    () => [...this.chosen()].sort().map((key) => {
      const [sector, subsector] = key.split("/");
      return subsector ? { sector, subsector } : { sector };
    }),
    ...ngDevMode ? [{ debugName: "selectedAreas" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** A sector chosen whole AND by subsector. Harmless to the permission check
   * -- the whole-sector grant already answers yes -- but it almost always
   * means a box was ticked by accident, and an admin approving the list as
   * written would grant the whole sector without noticing. The server refuses
   * it; saying so here saves a round trip. */
  redundant = computed(
    () => {
      const keys = this.chosen();
      return [...keys].filter((k) => k.includes("/") && keys.has(k.split("/")[0])).map((k) => k.split("/")[0]);
    },
    ...ngDevMode ? [{ debugName: "redundant" }] : (
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
  registeredEmail = signal(
    null,
    ...ngDevMode ? [{ debugName: "registeredEmail" }] : (
      /* istanbul ignore next */
      []
    )
  );
  canSubmit = computed(
    () => !!this.email() && this.password().length >= 8 && !!this.fullName() && (!this.needsProvince() || this.provinceId() !== void 0) && (!this.needsInterestAreas() || this.chosen().size > 0) && this.redundant().length === 0,
    ...ngDevMode ? [{ debugName: "canSubmit" }] : (
      /* istanbul ignore next */
      []
    )
  );
  constructor() {
    this.api.getInterestAreaOptions().subscribe({
      next: (opts) => this.sectorOptions.set(opts),
      // No hardcoded fallback, for the reason TaxonomyService gives: a list
      // that has drifted from the database is worse than an absent one,
      // because every entry looks valid and the failure only surfaces later.
      error: (err) => this.optionsError.set(err.message)
    });
  }
  onTypeChange(value) {
    this.type.set(value);
    if (value === "public") {
      this.provinceId.set(void 0);
      this.chosen.set(/* @__PURE__ */ new Set());
      this.hazardDomain.set(false);
    }
  }
  key(sector, subsector) {
    return subsector ? `${sector}/${subsector}` : sector;
  }
  isChosen(sector, subsector) {
    return this.chosen().has(this.key(sector, subsector));
  }
  toggle(sector, subsector) {
    const next = new Set(this.chosen());
    const k = this.key(sector, subsector);
    if (next.has(k))
      next.delete(k);
    else
      next.add(k);
    this.chosen.set(next);
  }
  submit() {
    if (!this.canSubmit())
      return;
    this.submitting.set(true);
    this.error.set(null);
    this.auth.register({
      email: this.email(),
      password: this.password(),
      full_name: this.fullName(),
      organization: this.organization() || void 0,
      type: this.type(),
      province_id: this.needsProvince() ? this.provinceId() : void 0,
      interest_areas: this.needsInterestAreas() ? this.selectedAreas() : [],
      hazard_domain: this.needsInterestAreas() && this.hazardDomain()
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.registeredEmail.set(this.email());
      },
      error: (err) => {
        this.error.set(err.message);
        this.submitting.set(false);
      }
    });
  }
  goToLogin() {
    this.router.navigateByUrl("/login");
  }
  static \u0275fac = function RegisterPageComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RegisterPageComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RegisterPageComponent, selectors: [["app-register-page"]], decls: 5, vars: 1, consts: [[1, "auth"], [1, "auth__pending"], ["type", "button", 3, "click"], [1, "auth__form", 3, "submit"], [1, "auth__field"], ["name", "type", 3, "ngModelChange", "ngModel"], [3, "ngValue"], ["type", "text", "name", "fullName", "required", "", 3, "ngModelChange", "ngModel"], [1, "auth__areas"], ["type", "email", "autocomplete", "username", "name", "email", "required", "", 3, "ngModelChange", "ngModel"], ["type", "password", "autocomplete", "new-password", "name", "password", "required", "", "minlength", "8", 3, "ngModelChange", "ngModel"], ["role", "alert", 1, "auth__error"], ["type", "submit", 3, "disabled"], [1, "auth__switch"], ["routerLink", "/login"], ["type", "text", "name", "organization", 3, "ngModelChange", "ngModel"], ["name", "province", 3, "ngModelChange", "ngModel"], [1, "auth__hint"], [1, "auth__sector"], [1, "auth__check", "auth__check--hazard"], ["type", "checkbox", 3, "change", "checked"], [1, "auth__check"], [1, "auth__subsectors"], [1, "auth__check", "auth__check--sub"]], template: function RegisterPageComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "h2");
      \u0275\u0275text(2, "Register");
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(3, RegisterPageComponent_Conditional_3_Template, 8, 1, "div", 1)(4, RegisterPageComponent_Conditional_4_Template, 31, 10);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275advance(3);
      \u0275\u0275conditional((tmp_0_0 = ctx.registeredEmail()) ? 3 : 4, tmp_0_0);
    }
  }, dependencies: [FormsModule, \u0275NgNoValidate, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, SelectControlValueAccessor, NgControlStatus, NgControlStatusGroup, RequiredValidator, MinLengthValidator, NgModel, NgForm, RouterLink], styles: ["\n.auth[_ngcontent-%COMP%] {\n  max-width: 420px;\n  margin: 3rem auto;\n  padding: 0 1.5rem;\n}\n.auth__form[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n  margin: 1.5rem 0;\n}\n.auth__field[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.8125rem;\n  color: #495057;\n}\n.auth__field[_ngcontent-%COMP%]   em[_ngcontent-%COMP%] {\n  font-style: normal;\n  color: #adb5bd;\n  font-size: 0.7rem;\n}\n.auth__field[_ngcontent-%COMP%]   input[_ngcontent-%COMP%], \n.auth__field[_ngcontent-%COMP%]   select[_ngcontent-%COMP%] {\n  padding: 0.5rem 0.6rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-size: 0.9375rem;\n}\n.auth__error[_ngcontent-%COMP%] {\n  color: #c92a2a;\n  background: #fff5f5;\n  border: 1px solid #ffc9c9;\n  border-radius: 4px;\n  padding: 0.5rem 0.75rem;\n  font-size: 0.8125rem;\n  margin: 0;\n}\nbutton[type=submit][_ngcontent-%COMP%], \n.auth__pending[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  padding: 0.6rem 1rem;\n  border: none;\n  border-radius: 4px;\n  background: #1c3d5a;\n  color: #fff;\n  cursor: pointer;\n  font-size: 0.9375rem;\n}\nbutton[type=submit][_ngcontent-%COMP%]:disabled {\n  background: #adb5bd;\n  cursor: not-allowed;\n}\nbutton[type=submit][_ngcontent-%COMP%]:not(:disabled):hover, \n.auth__pending[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover {\n  background: #163049;\n}\n.auth__switch[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: #868e96;\n}\n.auth__pending[_ngcontent-%COMP%] {\n  padding: 1rem;\n  background: #ebfbee;\n  border: 1px solid #b2f2bb;\n  border-radius: 6px;\n}\n.auth__pending[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0 0 1rem;\n  line-height: 1.5;\n}\n.auth__areas[_ngcontent-%COMP%] {\n  border: 1px solid #dee2e6;\n  border-radius: 6px;\n  padding: 0.75rem 0.875rem 0.875rem;\n  margin: 0;\n}\n.auth__areas[_ngcontent-%COMP%]   legend[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  font-weight: 600;\n  padding: 0 0.375rem;\n}\n.auth__areas[_ngcontent-%COMP%]   legend[_ngcontent-%COMP%]   em[_ngcontent-%COMP%] {\n  font-style: normal;\n  font-weight: 400;\n  color: #868e96;\n  margin-left: 0.375rem;\n}\n.auth__hint[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  line-height: 1.5;\n  color: #868e96;\n  margin: 0 0 0.75rem;\n}\n.auth__sector[_ngcontent-%COMP%] {\n  padding: 0.375rem 0 0.5rem;\n  border-top: 1px solid #f1f3f5;\n}\n.auth__sector[_ngcontent-%COMP%]:first-of-type {\n  border-top: 0;\n}\n.auth__check[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: baseline;\n  gap: 0.5rem;\n  font-size: 0.8125rem;\n  cursor: pointer;\n}\n.auth__check[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  flex: none;\n}\n.auth__check[_ngcontent-%COMP%]   em[_ngcontent-%COMP%] {\n  font-style: normal;\n  color: #868e96;\n  margin-left: 0.375rem;\n  font-size: 0.75rem;\n}\n.auth__subsectors[_ngcontent-%COMP%] {\n  padding-left: 1.5rem;\n  margin-top: 0.25rem;\n  display: grid;\n  gap: 0.1875rem;\n}\n.auth__check--sub[_ngcontent-%COMP%] {\n  color: #495057;\n}\n.auth__check--hazard[_ngcontent-%COMP%] {\n  margin-top: 0.75rem;\n  padding-top: 0.75rem;\n  border-top: 1px solid #f1f3f5;\n}\n/*# sourceMappingURL=register-page.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RegisterPageComponent, [{
    type: Component,
    args: [{ selector: "app-register-page", standalone: true, imports: [FormsModule, RouterLink], template: `<div class="auth">
  <h2>Register</h2>

  @if (registeredEmail(); as email) {
    <div class="auth__pending">
      <p>
        Thanks \u2014 the registration for <strong>{{ email }}</strong> is submitted. An
        administrator reviews every registration before the account can enter or change any
        data; you'll be able to sign in once it's approved.
      </p>
      <button type="button" (click)="goToLogin()">Go to sign in</button>
    </div>
  } @else {
    <form class="auth__form" (submit)="$event.preventDefault(); submit()">
      <label class="auth__field">
        <span>Registering as</span>
        <select [ngModel]="type()" name="type" (ngModelChange)="onTypeChange($event)">
          @for (t of types; track t) {
            <option [ngValue]="t">{{ typeLabel[t] }}</option>
          }
        </select>
      </label>

      <label class="auth__field">
        <span>Full name</span>
        <input type="text" [ngModel]="fullName()" name="fullName" (ngModelChange)="fullName.set($event)" required />
      </label>

      @if (type() !== 'public') {
        <label class="auth__field">
          <span>Organization</span>
          <input type="text" [ngModel]="organization()" name="organization" (ngModelChange)="organization.set($event)" />
        </label>
      }

      @if (needsProvince()) {
        <label class="auth__field">
          <span>Province <em>required</em></span>
          <select [ngModel]="provinceId()" name="province" (ngModelChange)="provinceId.set($event)">
            <option [ngValue]="undefined">Choose a province\u2026</option>
            @for (p of provinces; track p.id) {
              <option [ngValue]="p.id">{{ p.name }}</option>
            }
          </select>
        </label>
      }

      @if (needsInterestAreas()) {
        <fieldset class="auth__areas">
          <legend>Where you work <em>at least one</em></legend>
          <p class="auth__hint">
            Every dataset belongs to a sector and subsector, and an import replaces
            whatever was there before \u2014 so an account can only write to the areas it
            was granted. Tick the ones you work in; an administrator reviews them and
            may grant fewer.
          </p>

          @if (optionsError(); as message) {
            <p class="auth__error" role="alert">
              Couldn't load the sector list ({{ message }}). Please try again shortly \u2014
              registering without it isn't possible, because the areas have to be real.
            </p>
          }

          @for (sec of sectorOptions(); track sec.code) {
            <div class="auth__sector">
              <label class="auth__check">
                <input type="checkbox" [checked]="isChosen(sec.code)"
                       (change)="toggle(sec.code)" />
                <span>{{ sec.name }}
                  @if (sec.subsectors.length) {<em>all subsectors</em>}
                </span>
              </label>

              @if (sec.subsectors.length) {
                <div class="auth__subsectors">
                  @for (sub of sec.subsectors; track sub.code) {
                    <label class="auth__check auth__check--sub">
                      <input type="checkbox" [checked]="isChosen(sec.code, sub.code)"
                             (change)="toggle(sec.code, sub.code)" />
                      <span>{{ sub.name }}</span>
                    </label>
                  }
                </div>
              }
            </div>
          }

          @if (redundant().length) {
            <p class="auth__error" role="alert">
              You've ticked a whole sector and one of its subsectors
              ({{ redundant().join(', ') }}). The whole-sector tick already covers every
              subsector, so keep one or the other.
            </p>
          }

          <label class="auth__check auth__check--hazard">
            <input type="checkbox" [checked]="hazardDomain()"
                   (change)="hazardDomain.set(!hazardDomain())" />
            <span>I also maintain the shared climate variables
              <em>rainfall, SPI, warm days, event counts \u2014 Met Department / DMC</em>
            </span>
          </label>
          <p class="auth__hint">
            These twelve variables are used by every sector, so they're approved
            separately from the sectors above.
          </p>
        </fieldset>
      }

      <label class="auth__field">
        <span>Email</span>
        <input type="email" autocomplete="username" [ngModel]="email()" name="email" (ngModelChange)="email.set($event)" required />
      </label>

      <label class="auth__field">
        <span>Password <em>8+ characters</em></span>
        <input type="password" autocomplete="new-password" [ngModel]="password()" name="password" (ngModelChange)="password.set($event)" required minlength="8" />
      </label>

      @if (error(); as message) {
        <p class="auth__error" role="alert">{{ message }}</p>
      }

      <button type="submit" [disabled]="submitting() || !canSubmit()">
        {{ submitting() ? 'Registering\u2026' : 'Register' }}
      </button>
    </form>

    <p class="auth__switch">Already have an account? <a routerLink="/login">Sign in</a></p>
  }
</div>
`, styles: ["/* src/app/features/auth/register-page.component.scss */\n.auth {\n  max-width: 420px;\n  margin: 3rem auto;\n  padding: 0 1.5rem;\n}\n.auth__form {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n  margin: 1.5rem 0;\n}\n.auth__field {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.8125rem;\n  color: #495057;\n}\n.auth__field em {\n  font-style: normal;\n  color: #adb5bd;\n  font-size: 0.7rem;\n}\n.auth__field input,\n.auth__field select {\n  padding: 0.5rem 0.6rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-size: 0.9375rem;\n}\n.auth__error {\n  color: #c92a2a;\n  background: #fff5f5;\n  border: 1px solid #ffc9c9;\n  border-radius: 4px;\n  padding: 0.5rem 0.75rem;\n  font-size: 0.8125rem;\n  margin: 0;\n}\nbutton[type=submit],\n.auth__pending button {\n  padding: 0.6rem 1rem;\n  border: none;\n  border-radius: 4px;\n  background: #1c3d5a;\n  color: #fff;\n  cursor: pointer;\n  font-size: 0.9375rem;\n}\nbutton[type=submit]:disabled {\n  background: #adb5bd;\n  cursor: not-allowed;\n}\nbutton[type=submit]:not(:disabled):hover,\n.auth__pending button:hover {\n  background: #163049;\n}\n.auth__switch {\n  font-size: 0.8125rem;\n  color: #868e96;\n}\n.auth__pending {\n  padding: 1rem;\n  background: #ebfbee;\n  border: 1px solid #b2f2bb;\n  border-radius: 6px;\n}\n.auth__pending p {\n  margin: 0 0 1rem;\n  line-height: 1.5;\n}\n.auth__areas {\n  border: 1px solid #dee2e6;\n  border-radius: 6px;\n  padding: 0.75rem 0.875rem 0.875rem;\n  margin: 0;\n}\n.auth__areas legend {\n  font-size: 0.8125rem;\n  font-weight: 600;\n  padding: 0 0.375rem;\n}\n.auth__areas legend em {\n  font-style: normal;\n  font-weight: 400;\n  color: #868e96;\n  margin-left: 0.375rem;\n}\n.auth__hint {\n  font-size: 0.75rem;\n  line-height: 1.5;\n  color: #868e96;\n  margin: 0 0 0.75rem;\n}\n.auth__sector {\n  padding: 0.375rem 0 0.5rem;\n  border-top: 1px solid #f1f3f5;\n}\n.auth__sector:first-of-type {\n  border-top: 0;\n}\n.auth__check {\n  display: flex;\n  align-items: baseline;\n  gap: 0.5rem;\n  font-size: 0.8125rem;\n  cursor: pointer;\n}\n.auth__check input {\n  flex: none;\n}\n.auth__check em {\n  font-style: normal;\n  color: #868e96;\n  margin-left: 0.375rem;\n  font-size: 0.75rem;\n}\n.auth__subsectors {\n  padding-left: 1.5rem;\n  margin-top: 0.25rem;\n  display: grid;\n  gap: 0.1875rem;\n}\n.auth__check--sub {\n  color: #495057;\n}\n.auth__check--hazard {\n  margin-top: 0.75rem;\n  padding-top: 0.75rem;\n  border-top: 1px solid #f1f3f5;\n}\n/*# sourceMappingURL=register-page.component.css.map */\n"] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RegisterPageComponent, { className: "RegisterPageComponent", filePath: "src/app/features/auth/register-page.component.ts", lineNumber: 40 });
})();
export {
  RegisterPageComponent
};
//# debugId=98746338-3684-5240-a1e4-89d80750ebda
//# sourceMappingURL=chunk-H3IOY4A2.js.map
