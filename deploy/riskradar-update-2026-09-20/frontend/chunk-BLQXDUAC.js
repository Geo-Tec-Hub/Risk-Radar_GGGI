import {
  AuthService
} from "./chunk-KEKSJGJ2.js";
import {
  ApiClientService
} from "./chunk-QBP7AOH4.js";
import {
  PROVINCE_OPTIONS
} from "./chunk-HN3O3DC2.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel,
  NgSelectOption,
  SelectControlValueAccessor,
  ɵNgSelectMultipleOption
} from "./chunk-4UD6LJ7E.js";
import {
  Component,
  __spreadProps,
  __spreadValues,
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
  ɵɵelement,
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
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-SAQOEXKZ.js";

// src/app/features/admin/admin-registrations.component.ts
var _forTrack0 = ($index, $item) => $item.id;
var _forTrack1 = ($index, $item) => $item.code;
function AdminRegistrationsComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p");
    \u0275\u0275text(1, "Loading\u2026");
    \u0275\u0275elementEnd();
  }
}
function AdminRegistrationsComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 2);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function AdminRegistrationsComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 3);
    \u0275\u0275text(1, "Nothing waiting on approval.");
    \u0275\u0275elementEnd();
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "br");
    \u0275\u0275elementStart(1, "span", 9);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(r_r2.organization);
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "br");
    \u0275\u0275elementStart(1, "span", 9);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(r_r2.requested_province);
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_For_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const role_r4 = ctx.$implicit;
    \u0275\u0275property("ngValue", role_r4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(role_r4);
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_16_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r6 = ctx.$implicit;
    \u0275\u0275property("ngValue", p_r6.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(p_r6.name);
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "select", 6);
    \u0275\u0275listener("ngModelChange", function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_16_Template_select_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const r_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.setProvince(r_r2.id, $event));
    });
    \u0275\u0275elementStart(1, "option", 7);
    \u0275\u0275text(2, "Choose\u2026");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(3, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_16_For_4_Template, 2, 2, "option", 7, _forTrack0);
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
  }
  if (rf & 2) {
    const r_r2 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngModel", ctx_r2.selectedProvince()[r_r2.id]);
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275property("ngValue", void 0);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r2.provinces);
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 9);
    \u0275\u0275text(1, "national");
    \u0275\u0275elementEnd();
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275text(1, "+ shared climate variables");
    \u0275\u0275elementEnd();
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "em");
    \u0275\u0275text(1, "Nothing granted yet \u2014 this account will not be able to write.");
    \u0275\u0275elementEnd();
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_7_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " , plus the climate variables ");
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275conditionalCreate(1, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_7_Conditional_1_Template, 1, 0);
    \u0275\u0275text(2, ". ");
  }
  if (rf & 2) {
    const r_r2 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275textInterpolate2(" Granting ", ctx_r2.keysFor(r_r2.id).size, " ", ctx_r2.keysFor(r_r2.id).size === 1 ? "area" : "areas");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.hazardFor(r_r2.id) ? 1 : -1);
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 22);
    \u0275\u0275listener("click", function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_13_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r8);
      const r_r2 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.clearGrant(r_r2.id));
    });
    \u0275\u0275text(1, "Clear");
    \u0275\u0275elementEnd();
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 16);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Couldn't load the sector list (", ctx, "). ");
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_For_3_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "em");
    \u0275\u0275text(1, "all subsectors");
    \u0275\u0275elementEnd();
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_For_3_Conditional_6_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label", 30)(1, "input", 27);
    \u0275\u0275listener("change", function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_For_3_Conditional_6_For_2_Template_input_change_1_listener() {
      const sub_r13 = \u0275\u0275restoreView(_r12).$implicit;
      const sec_r11 = \u0275\u0275nextContext(2).$implicit;
      const r_r2 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleGrant(r_r2.id, sec_r11.code, sub_r13.code));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const sub_r13 = ctx.$implicit;
    const sec_r11 = \u0275\u0275nextContext(2).$implicit;
    const r_r2 = \u0275\u0275nextContext(3).$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("checked", ctx_r2.isGranted(r_r2.id, sec_r11.code, sub_r13.code));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(sub_r13.name);
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_For_3_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 29);
    \u0275\u0275repeaterCreate(1, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_For_3_Conditional_6_For_2_Template, 4, 2, "label", 30, _forTrack1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const sec_r11 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275repeater(sec_r11.subsectors);
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_For_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 25)(1, "label", 28)(2, "input", 27);
    \u0275\u0275listener("change", function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_For_3_Template_input_change_2_listener() {
      const sec_r11 = \u0275\u0275restoreView(_r10).$implicit;
      const r_r2 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleGrant(r_r2.id, sec_r11.code));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275conditionalCreate(5, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_For_3_Conditional_5_Template, 2, 0, "em");
    \u0275\u0275elementEnd()();
    \u0275\u0275conditionalCreate(6, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_For_3_Conditional_6_Template, 3, 0, "div", 29);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const sec_r11 = ctx.$implicit;
    const r_r2 = \u0275\u0275nextContext(3).$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("checked", ctx_r2.isGranted(r_r2.id, sec_r11.code));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", sec_r11.name, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(sec_r11.subsectors.length ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(sec_r11.subsectors.length ? 6 : -1);
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 24);
    \u0275\u0275conditionalCreate(1, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_Conditional_1_Template, 2, 1, "p", 16);
    \u0275\u0275repeaterCreate(2, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_For_3_Template, 7, 4, "div", 25, _forTrack1);
    \u0275\u0275elementStart(4, "label", 26)(5, "input", 27);
    \u0275\u0275listener("change", function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_Template_input_change_5_listener() {
      \u0275\u0275restoreView(_r9);
      const r_r2 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.setHazard(r_r2.id, !ctx_r2.hazardFor(r_r2.id)));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "span");
    \u0275\u0275text(7, "Shared climate variables ");
    \u0275\u0275elementStart(8, "em");
    \u0275\u0275text(9, "rainfall, SPI, warm days, event counts \u2014 used by every sector");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    let tmp_13_0;
    const r_r2 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_13_0 = ctx_r2.optionsError()) ? 1 : -1, tmp_13_0);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.sectorOptions());
    \u0275\u0275advance(3);
    \u0275\u0275property("checked", ctx_r2.hazardFor(r_r2.id));
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 16);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r2 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.redundantFor(r_r2.id).join(", "), " is ticked both as a whole sector and as one of its subsectors. The whole-sector tick already covers every subsector. ");
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "p", 17)(1, "span", 18);
    \u0275\u0275text(2, "Asked for");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275conditionalCreate(4, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_4_Template, 2, 0, "span", 19);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "p", 20);
    \u0275\u0275conditionalCreate(6, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_6_Template, 2, 0, "em")(7, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_7_Template, 3, 3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 21)(9, "button", 22);
    \u0275\u0275listener("click", function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r7);
      const r_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.grantAsRequested(r_r2));
    });
    \u0275\u0275text(10, "Grant what was asked");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "button", 22);
    \u0275\u0275listener("click", function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Template_button_click_11_listener() {
      \u0275\u0275restoreView(_r7);
      const r_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleScopePanel(r_r2.id));
    });
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(13, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_13_Template, 2, 0, "button", 23);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(14, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_14_Template, 10, 2, "div", 24);
    \u0275\u0275conditionalCreate(15, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Conditional_15_Template, 2, 1, "p", 16);
  }
  if (rf & 2) {
    const r_r2 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r2.describeRequest(r_r2), " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(r_r2.requested_hazard_domain ? 4 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r2.keysFor(r_r2.id).size === 0 ? 6 : 7);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", ctx_r2.scopeOpen()[r_r2.id] ? "Hide areas" : "Choose areas", " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.keysFor(r_r2.id).size || ctx_r2.hazardFor(r_r2.id) ? 13 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.scopeOpen()[r_r2.id] ? 14 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.redundantFor(r_r2.id).length ? 15 : -1);
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 9);
    \u0275\u0275text(1, "reads only");
    \u0275\u0275elementEnd();
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Conditional_28_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 16);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function AdminRegistrationsComponent_Conditional_11_For_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr")(1, "td")(2, "strong");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275element(4, "br");
    \u0275\u0275elementStart(5, "span", 5);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(7, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_7_Template, 3, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "td");
    \u0275\u0275text(9);
    \u0275\u0275conditionalCreate(10, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_10_Template, 3, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "td")(12, "select", 6);
    \u0275\u0275listener("ngModelChange", function AdminRegistrationsComponent_Conditional_11_For_17_Template_select_ngModelChange_12_listener($event) {
      const r_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.setRole(r_r2.id, $event));
    });
    \u0275\u0275repeaterCreate(13, AdminRegistrationsComponent_Conditional_11_For_17_For_14_Template, 2, 2, "option", 7, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "td");
    \u0275\u0275conditionalCreate(16, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_16_Template, 5, 2, "select", 8)(17, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_17_Template, 2, 0, "span", 9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "td", 10);
    \u0275\u0275conditionalCreate(19, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_19_Template, 16, 7)(20, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_20_Template, 2, 0, "span", 9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "td", 11)(22, "button", 12);
    \u0275\u0275listener("click", function AdminRegistrationsComponent_Conditional_11_For_17_Template_button_click_22_listener() {
      const r_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.approve(r_r2));
    });
    \u0275\u0275text(23, " Approve ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "div", 13)(25, "input", 14);
    \u0275\u0275listener("ngModelChange", function AdminRegistrationsComponent_Conditional_11_For_17_Template_input_ngModelChange_25_listener($event) {
      const r_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.setReason(r_r2.id, $event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementStart(26, "button", 15);
    \u0275\u0275listener("click", function AdminRegistrationsComponent_Conditional_11_For_17_Template_button_click_26_listener() {
      const r_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.reject(r_r2));
    });
    \u0275\u0275text(27, " Reject ");
    \u0275\u0275elementEnd()();
    \u0275\u0275conditionalCreate(28, AdminRegistrationsComponent_Conditional_11_For_17_Conditional_28_Template, 2, 1, "p", 16);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_25_0;
    const r_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(r_r2.full_name);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(r_r2.email);
    \u0275\u0275advance();
    \u0275\u0275conditional(r_r2.organization ? 7 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", r_r2.requested_role_name || r_r2.requested_role || "\u2014", " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(r_r2.requested_province ? 10 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", ctx_r2.roleFor(r_r2.id));
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.roles);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(ctx_r2.roleNeedsProvince(ctx_r2.roleFor(r_r2.id)) ? 16 : 17);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(ctx_r2.roleNeedsScope(ctx_r2.roleFor(r_r2.id)) ? 19 : 20);
    \u0275\u0275advance(3);
    \u0275\u0275property("disabled", ctx_r2.rowBusy()[r_r2.id] || !ctx_r2.canApprove(r_r2.id));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", ctx_r2.rejectReason()[r_r2.id] ?? "");
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r2.rowBusy()[r_r2.id]);
    \u0275\u0275advance(2);
    \u0275\u0275conditional((tmp_25_0 = ctx_r2.rowError()[r_r2.id]) ? 28 : -1, tmp_25_0);
  }
}
function AdminRegistrationsComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "table", 4)(1, "thead")(2, "tr")(3, "th");
    \u0275\u0275text(4, "Applicant");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "th");
    \u0275\u0275text(6, "Requested");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "th");
    \u0275\u0275text(8, "Grant role");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "th");
    \u0275\u0275text(10, "Province");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "th");
    \u0275\u0275text(12, "Write access");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "th");
    \u0275\u0275text(14, "Actions");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(15, "tbody");
    \u0275\u0275repeaterCreate(16, AdminRegistrationsComponent_Conditional_11_For_17_Template, 29, 12, "tr", null, _forTrack0);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(16);
    \u0275\u0275repeater(ctx_r2.registrations());
  }
}
var ROLES = ["data_officer", "expert", "community", "admin"];
function roleNeedsProvince(role) {
  return role === "data_officer" || role === "expert";
}
var AdminRegistrationsComponent = class _AdminRegistrationsComponent {
  auth = inject(AuthService);
  api = inject(ApiClientService);
  roles = ROLES;
  provinces = PROVINCE_OPTIONS;
  roleNeedsProvince = roleNeedsProvince;
  loading = signal(
    true,
    ...ngDevMode ? [{ debugName: "loading" }] : (
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
  registrations = signal(
    [],
    ...ngDevMode ? [{ debugName: "registrations" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Per-row working state, keyed by app_user.id, so acting on one row
   * cannot disable or spinner every other row on the screen. */
  selectedRole = signal(
    {},
    ...ngDevMode ? [{ debugName: "selectedRole" }] : (
      /* istanbul ignore next */
      []
    )
  );
  selectedProvince = signal(
    {},
    ...ngDevMode ? [{ debugName: "selectedProvince" }] : (
      /* istanbul ignore next */
      []
    )
  );
  rejectReason = signal(
    {},
    ...ngDevMode ? [{ debugName: "rejectReason" }] : (
      /* istanbul ignore next */
      []
    )
  );
  rowBusy = signal(
    {},
    ...ngDevMode ? [{ debugName: "rowBusy" }] : (
      /* istanbul ignore next */
      []
    )
  );
  rowError = signal(
    {},
    ...ngDevMode ? [{ debugName: "rowError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** The full catalogue, so an admin can grant a sector the applicant did not
   * think to ask for. */
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
  /** Per row: the keys ticked to GRANT. Starts empty on purpose -- see the
   * class comment. Keys are `SECTOR` or `SECTOR/SUBSECTOR`. */
  grantKeys = signal(
    {},
    ...ngDevMode ? [{ debugName: "grantKeys" }] : (
      /* istanbul ignore next */
      []
    )
  );
  grantHazard = signal(
    {},
    ...ngDevMode ? [{ debugName: "grantHazard" }] : (
      /* istanbul ignore next */
      []
    )
  );
  scopeOpen = signal(
    {},
    ...ngDevMode ? [{ debugName: "scopeOpen" }] : (
      /* istanbul ignore next */
      []
    )
  );
  constructor() {
    this.load();
    this.api.getInterestAreaOptions().subscribe({
      next: (opts) => this.sectorOptions.set(opts),
      error: (err) => this.optionsError.set(err.message)
    });
  }
  // --- write scope ------------------------------------------------------
  key(sector, subsector) {
    return subsector ? `${sector}/${subsector}` : sector;
  }
  keysFor(id) {
    return this.grantKeys()[id] ?? /* @__PURE__ */ new Set();
  }
  isGranted(id, sector, subsector) {
    return this.keysFor(id).has(this.key(sector, subsector));
  }
  toggleGrant(id, sector, subsector) {
    const next = new Set(this.keysFor(id));
    const k = this.key(sector, subsector);
    if (next.has(k))
      next.delete(k);
    else
      next.add(k);
    this.grantKeys.set(__spreadProps(__spreadValues({}, this.grantKeys()), { [id]: next }));
  }
  /** One deliberate click that says what it does, instead of a default that
   * does it silently. */
  grantAsRequested(reg) {
    const keys = new Set(reg.requested_areas.map((a) => this.key(a.sector, a.subsector)));
    this.grantKeys.set(__spreadProps(__spreadValues({}, this.grantKeys()), { [reg.id]: keys }));
    this.grantHazard.set(__spreadProps(__spreadValues({}, this.grantHazard()), { [reg.id]: reg.requested_hazard_domain }));
    this.scopeOpen.set(__spreadProps(__spreadValues({}, this.scopeOpen()), { [reg.id]: true }));
  }
  clearGrant(id) {
    this.grantKeys.set(__spreadProps(__spreadValues({}, this.grantKeys()), { [id]: /* @__PURE__ */ new Set() }));
    this.grantHazard.set(__spreadProps(__spreadValues({}, this.grantHazard()), { [id]: false }));
  }
  toggleScopePanel(id) {
    this.scopeOpen.set(__spreadProps(__spreadValues({}, this.scopeOpen()), { [id]: !this.scopeOpen()[id] }));
  }
  hazardFor(id) {
    return this.grantHazard()[id] ?? false;
  }
  setHazard(id, on) {
    this.grantHazard.set(__spreadProps(__spreadValues({}, this.grantHazard()), { [id]: on }));
  }
  /** Reads the request back in the admin's language. A whole-sector request is
   * the WIDER one and must not read as the bare sector name. */
  describeRequest(reg) {
    if (!reg.requested_areas.length)
      return "no areas named";
    return reg.requested_areas.map((a) => a.subsector ? `${a.sector} / ${a.subsector}` : `${a.sector} (all subsectors)`).join(", ");
  }
  /** A whole sector granted alongside one of its subsectors. The server
   * refuses this; catching it here saves a round trip and explains it in
   * place. */
  redundantFor(id) {
    const keys = this.keysFor(id);
    return [...keys].filter((k) => k.includes("/") && keys.has(k.split("/")[0])).map((k) => k.split("/")[0]);
  }
  grantPayload(id) {
    return [...this.keysFor(id)].sort().map((k) => {
      const [sector, subsector] = k.split("/");
      return subsector ? { sector, subsector } : { sector };
    });
  }
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.auth.listPendingRegistrations().subscribe({
      next: (rows) => {
        this.registrations.set(rows);
        this.loading.set(false);
        const roles = {};
        for (const r of rows) {
          if (r.requested_role)
            roles[r.id] = r.requested_role;
        }
        this.selectedRole.set(__spreadValues(__spreadValues({}, this.selectedRole()), roles));
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
  roleFor(id) {
    return this.selectedRole()[id] ?? "community";
  }
  setRole(id, role) {
    this.selectedRole.set(__spreadProps(__spreadValues({}, this.selectedRole()), { [id]: role }));
  }
  setProvince(id, provinceId) {
    this.selectedProvince.set(__spreadProps(__spreadValues({}, this.selectedProvince()), { [id]: provinceId }));
  }
  setReason(id, reason) {
    this.rejectReason.set(__spreadProps(__spreadValues({}, this.rejectReason()), { [id]: reason }));
  }
  /** roleNeedsProvince and roleNeedsScope are the same predicate today, and
   * deliberately named separately: they answer different questions (SRS §3.2
   * binding vs. schema_write_scope_addendum.sql) and either could change
   * without the other. */
  roleNeedsScope(role) {
    return roleNeedsProvince(role);
  }
  canApprove(id) {
    const role = this.roleFor(id);
    if (roleNeedsProvince(role) && this.selectedProvince()[id] === void 0)
      return false;
    if (this.roleNeedsScope(role) && this.keysFor(id).size === 0)
      return false;
    return this.redundantFor(id).length === 0;
  }
  approve(reg) {
    if (!this.canApprove(reg.id))
      return;
    this.setBusy(reg.id, true);
    this.setRowError(reg.id, null);
    const role = this.roleFor(reg.id);
    const scoped = this.roleNeedsScope(role);
    this.auth.approveRegistration(reg.id, {
      role,
      province_id: roleNeedsProvince(role) ? this.selectedProvince()[reg.id] : void 0,
      scopes: scoped ? this.grantPayload(reg.id) : void 0,
      may_write_hazard_domain: scoped ? this.hazardFor(reg.id) : void 0
    }).subscribe({
      next: () => {
        this.setBusy(reg.id, false);
        this.registrations.set(this.registrations().filter((r) => r.id !== reg.id));
      },
      error: (err) => {
        this.setBusy(reg.id, false);
        this.setRowError(reg.id, err.message);
      }
    });
  }
  reject(reg) {
    const reason = (this.rejectReason()[reg.id] ?? "").trim();
    if (!reason) {
      this.setRowError(reg.id, "A reason is required to reject a registration.");
      return;
    }
    this.setBusy(reg.id, true);
    this.setRowError(reg.id, null);
    this.auth.rejectRegistration(reg.id, { reason }).subscribe({
      next: () => {
        this.setBusy(reg.id, false);
        this.registrations.set(this.registrations().filter((r) => r.id !== reg.id));
      },
      error: (err) => {
        this.setBusy(reg.id, false);
        this.setRowError(reg.id, err.message);
      }
    });
  }
  setBusy(id, busy) {
    this.rowBusy.set(__spreadProps(__spreadValues({}, this.rowBusy()), { [id]: busy }));
  }
  setRowError(id, message) {
    const next = __spreadValues({}, this.rowError());
    if (message)
      next[id] = message;
    else
      delete next[id];
    this.rowError.set(next);
  }
  static \u0275fac = function AdminRegistrationsComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AdminRegistrationsComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AdminRegistrationsComponent, selectors: [["app-admin-registrations"]], decls: 12, vars: 1, consts: [[1, "admin"], [1, "admin__hint"], ["role", "alert", 1, "admin__error"], [1, "admin__empty"], [1, "admin__table"], [1, "admin__email"], [3, "ngModelChange", "ngModel"], [3, "ngValue"], [3, "ngModel"], [1, "admin__org"], [1, "admin__scope"], [1, "admin__actions"], ["type", "button", 3, "click", "disabled"], [1, "admin__reject"], ["type", "text", "placeholder", "Reason (required to reject)", 3, "ngModelChange", "ngModel"], ["type", "button", 1, "admin__reject-btn", 3, "click", "disabled"], ["role", "alert", 1, "admin__row-error"], [1, "admin__asked"], [1, "admin__asked-label"], [1, "admin__hazard-tag"], [1, "admin__granting"], [1, "admin__scope-buttons"], ["type", "button", 3, "click"], ["type", "button"], [1, "admin__areas"], [1, "admin__sector"], [1, "admin__check", "admin__check--hazard"], ["type", "checkbox", 3, "change", "checked"], [1, "admin__check"], [1, "admin__subsectors"], [1, "admin__check", "admin__check--sub"]], template: function AdminRegistrationsComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "h2");
      \u0275\u0275text(2, "Pending registrations");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "p", 1);
      \u0275\u0275text(4, " Every self-registration sits here until approved or rejected. Approving grants a role and, for a data officer or expert, binds them to exactly one province (SRS \xA73.2) and to the sectors they may write to \u2014 nothing they submit is written until that happens. ");
      \u0275\u0275elementStart(5, "strong");
      \u0275\u0275text(6, "The areas an applicant asked for are a request, not a grant");
      \u0275\u0275elementEnd();
      \u0275\u0275text(7, ": the boxes start empty, and an approval grants only what you tick. ");
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(8, AdminRegistrationsComponent_Conditional_8_Template, 2, 0, "p")(9, AdminRegistrationsComponent_Conditional_9_Template, 2, 1, "p", 2)(10, AdminRegistrationsComponent_Conditional_10_Template, 2, 0, "p", 3)(11, AdminRegistrationsComponent_Conditional_11_Template, 18, 0, "table", 4);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275advance(8);
      \u0275\u0275conditional(ctx.loading() ? 8 : (tmp_0_0 = ctx.error()) ? 9 : ctx.registrations().length === 0 ? 10 : 11, tmp_0_0);
    }
  }, dependencies: [FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, SelectControlValueAccessor, NgControlStatus, NgModel], styles: ["\n.admin[_ngcontent-%COMP%] {\n  max-width: 960px;\n  margin: 2rem auto;\n  padding: 0 1.5rem;\n}\n.admin__hint[_ngcontent-%COMP%] {\n  color: #495057;\n  margin-top: 0;\n}\n.admin__error[_ngcontent-%COMP%] {\n  color: #c92a2a;\n  background: #fff5f5;\n  border: 1px solid #ffc9c9;\n  border-radius: 4px;\n  padding: 0.5rem 0.75rem;\n  font-size: 0.875rem;\n}\n.admin__empty[_ngcontent-%COMP%] {\n  color: #868e96;\n  font-style: italic;\n}\n.admin__table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.875rem;\n}\n.admin__table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.admin__table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  text-align: left;\n  padding: 0.6rem 0.75rem;\n  border-bottom: 1px solid #e9ecef;\n  vertical-align: top;\n}\n.admin__table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  color: #495057;\n  font-weight: 600;\n  font-size: 0.8125rem;\n}\n.admin__table[_ngcontent-%COMP%]   select[_ngcontent-%COMP%], \n.admin__table[_ngcontent-%COMP%]   input[type=text][_ngcontent-%COMP%] {\n  padding: 0.35rem 0.5rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-size: 0.8125rem;\n}\n.admin__email[_ngcontent-%COMP%], \n.admin__org[_ngcontent-%COMP%] {\n  color: #868e96;\n  font-size: 0.8125rem;\n}\n.admin__actions[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  min-width: 220px;\n}\n.admin__actions[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  padding: 0.4rem 0.75rem;\n  border: none;\n  border-radius: 4px;\n  background: #2f9e44;\n  color: #fff;\n  cursor: pointer;\n  font-size: 0.8125rem;\n}\n.admin__actions[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:disabled {\n  background: #adb5bd;\n  cursor: not-allowed;\n}\n.admin__reject[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.4rem;\n}\n.admin__reject[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  flex: 1;\n}\n.admin__reject-btn[_ngcontent-%COMP%] {\n  background: #c92a2a !important;\n}\n.admin__row-error[_ngcontent-%COMP%] {\n  color: #c92a2a;\n  font-size: 0.75rem;\n  margin: 0;\n}\n.admin__scope[_ngcontent-%COMP%] {\n  min-width: 20rem;\n  vertical-align: top;\n}\n.admin__asked[_ngcontent-%COMP%] {\n  margin: 0 0 0.375rem;\n  font-size: 0.75rem;\n  line-height: 1.5;\n  color: #495057;\n}\n.admin__asked-label[_ngcontent-%COMP%] {\n  display: inline-block;\n  font-weight: 600;\n  color: #868e96;\n  margin-right: 0.375rem;\n}\n.admin__hazard-tag[_ngcontent-%COMP%] {\n  display: inline-block;\n  margin-left: 0.375rem;\n  padding: 0 0.375rem;\n  border-radius: 3px;\n  background: #fff3bf;\n  color: #856404;\n}\n.admin__granting[_ngcontent-%COMP%] {\n  margin: 0 0 0.5rem;\n  font-size: 0.75rem;\n  color: #495057;\n}\n.admin__granting[_ngcontent-%COMP%]   em[_ngcontent-%COMP%] {\n  color: #c92a2a;\n  font-style: normal;\n}\n.admin__scope-buttons[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.375rem;\n}\n.admin__scope-buttons[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  padding: 0.25rem 0.5rem;\n}\n.admin__areas[_ngcontent-%COMP%] {\n  margin-top: 0.5rem;\n  padding: 0.5rem 0.625rem;\n  border: 1px solid #dee2e6;\n  border-radius: 4px;\n  max-height: 18rem;\n  overflow-y: auto;\n}\n.admin__sector[_ngcontent-%COMP%] {\n  padding: 0.25rem 0;\n  border-top: 1px solid #f1f3f5;\n}\n.admin__sector[_ngcontent-%COMP%]:first-of-type {\n  border-top: 0;\n}\n.admin__check[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: baseline;\n  gap: 0.4375rem;\n  font-size: 0.75rem;\n  cursor: pointer;\n}\n.admin__check[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  flex: none;\n}\n.admin__check[_ngcontent-%COMP%]   em[_ngcontent-%COMP%] {\n  font-style: normal;\n  color: #868e96;\n  margin-left: 0.3125rem;\n}\n.admin__subsectors[_ngcontent-%COMP%] {\n  padding-left: 1.375rem;\n  display: grid;\n  gap: 0.125rem;\n}\n.admin__check--sub[_ngcontent-%COMP%] {\n  color: #495057;\n}\n.admin__check--hazard[_ngcontent-%COMP%] {\n  margin-top: 0.5rem;\n  padding-top: 0.5rem;\n  border-top: 1px solid #f1f3f5;\n}\n/*# sourceMappingURL=admin-registrations.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AdminRegistrationsComponent, [{
    type: Component,
    args: [{ selector: "app-admin-registrations", standalone: true, imports: [FormsModule], template: `<div class="admin">
  <h2>Pending registrations</h2>
  <p class="admin__hint">
    Every self-registration sits here until approved or rejected. Approving grants a role and,
    for a data officer or expert, binds them to exactly one province (SRS \xA73.2) and to the
    sectors they may write to \u2014 nothing they submit is written until that happens.
    <strong>The areas an applicant asked for are a request, not a grant</strong>: the boxes start
    empty, and an approval grants only what you tick.
  </p>

  @if (loading()) {
    <p>Loading\u2026</p>
  } @else if (error(); as message) {
    <p class="admin__error" role="alert">{{ message }}</p>
  } @else if (registrations().length === 0) {
    <p class="admin__empty">Nothing waiting on approval.</p>
  } @else {
    <table class="admin__table">
      <thead>
        <tr>
          <th>Applicant</th>
          <th>Requested</th>
          <th>Grant role</th>
          <th>Province</th>
          <th>Write access</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (r of registrations(); track r.id) {
          <tr>
            <td>
              <strong>{{ r.full_name }}</strong><br />
              <span class="admin__email">{{ r.email }}</span>
              @if (r.organization) {
                <br /><span class="admin__org">{{ r.organization }}</span>
              }
            </td>
            <td>
              {{ r.requested_role_name || r.requested_role || '\u2014' }}
              @if (r.requested_province) {
                <br /><span class="admin__org">{{ r.requested_province }}</span>
              }
            </td>
            <td>
              <select [ngModel]="roleFor(r.id)" (ngModelChange)="setRole(r.id, $event)">
                @for (role of roles; track role) {
                  <option [ngValue]="role">{{ role }}</option>
                }
              </select>
            </td>
            <td>
              @if (roleNeedsProvince(roleFor(r.id))) {
                <select [ngModel]="selectedProvince()[r.id]" (ngModelChange)="setProvince(r.id, $event)">
                  <option [ngValue]="undefined">Choose\u2026</option>
                  @for (p of provinces; track p.id) {
                    <option [ngValue]="p.id">{{ p.name }}</option>
                  }
                </select>
              } @else {
                <span class="admin__org">national</span>
              }
            </td>
            <td class="admin__scope">
              @if (roleNeedsScope(roleFor(r.id))) {
                <p class="admin__asked">
                  <span class="admin__asked-label">Asked for</span>
                  {{ describeRequest(r) }}
                  @if (r.requested_hazard_domain) {
                    <span class="admin__hazard-tag">+ shared climate variables</span>
                  }
                </p>

                <p class="admin__granting">
                  @if (keysFor(r.id).size === 0) {
                    <em>Nothing granted yet \u2014 this account will not be able to write.</em>
                  } @else {
                    Granting {{ keysFor(r.id).size }}
                    {{ keysFor(r.id).size === 1 ? 'area' : 'areas' }}@if (hazardFor(r.id)) {
                      , plus the climate variables
                    }.
                  }
                </p>

                <div class="admin__scope-buttons">
                  <button type="button" (click)="grantAsRequested(r)">Grant what was asked</button>
                  <button type="button" (click)="toggleScopePanel(r.id)">
                    {{ scopeOpen()[r.id] ? 'Hide areas' : 'Choose areas' }}
                  </button>
                  @if (keysFor(r.id).size || hazardFor(r.id)) {
                    <button type="button" (click)="clearGrant(r.id)">Clear</button>
                  }
                </div>

                @if (scopeOpen()[r.id]) {
                  <div class="admin__areas">
                    @if (optionsError(); as message) {
                      <p class="admin__row-error" role="alert">
                        Couldn't load the sector list ({{ message }}).
                      </p>
                    }
                    @for (sec of sectorOptions(); track sec.code) {
                      <div class="admin__sector">
                        <label class="admin__check">
                          <input type="checkbox" [checked]="isGranted(r.id, sec.code)"
                                 (change)="toggleGrant(r.id, sec.code)" />
                          <span>{{ sec.name }}
                            @if (sec.subsectors.length) {<em>all subsectors</em>}
                          </span>
                        </label>
                        @if (sec.subsectors.length) {
                          <div class="admin__subsectors">
                            @for (sub of sec.subsectors; track sub.code) {
                              <label class="admin__check admin__check--sub">
                                <input type="checkbox"
                                       [checked]="isGranted(r.id, sec.code, sub.code)"
                                       (change)="toggleGrant(r.id, sec.code, sub.code)" />
                                <span>{{ sub.name }}</span>
                              </label>
                            }
                          </div>
                        }
                      </div>
                    }
                    <label class="admin__check admin__check--hazard">
                      <input type="checkbox" [checked]="hazardFor(r.id)"
                             (change)="setHazard(r.id, !hazardFor(r.id))" />
                      <span>Shared climate variables
                        <em>rainfall, SPI, warm days, event counts \u2014 used by every sector</em>
                      </span>
                    </label>
                  </div>
                }

                @if (redundantFor(r.id).length) {
                  <p class="admin__row-error" role="alert">
                    {{ redundantFor(r.id).join(', ') }} is ticked both as a whole sector and as one
                    of its subsectors. The whole-sector tick already covers every subsector.
                  </p>
                }
              } @else {
                <span class="admin__org">reads only</span>
              }
            </td>
            <td class="admin__actions">
              <button type="button" [disabled]="rowBusy()[r.id] || !canApprove(r.id)" (click)="approve(r)">
                Approve
              </button>
              <div class="admin__reject">
                <input
                  type="text"
                  placeholder="Reason (required to reject)"
                  [ngModel]="rejectReason()[r.id] ?? ''"
                  (ngModelChange)="setReason(r.id, $event)"
                />
                <button type="button" class="admin__reject-btn" [disabled]="rowBusy()[r.id]" (click)="reject(r)">
                  Reject
                </button>
              </div>
              @if (rowError()[r.id]; as message) {
                <p class="admin__row-error" role="alert">{{ message }}</p>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  }
</div>
`, styles: ["/* src/app/features/admin/admin-registrations.component.scss */\n.admin {\n  max-width: 960px;\n  margin: 2rem auto;\n  padding: 0 1.5rem;\n}\n.admin__hint {\n  color: #495057;\n  margin-top: 0;\n}\n.admin__error {\n  color: #c92a2a;\n  background: #fff5f5;\n  border: 1px solid #ffc9c9;\n  border-radius: 4px;\n  padding: 0.5rem 0.75rem;\n  font-size: 0.875rem;\n}\n.admin__empty {\n  color: #868e96;\n  font-style: italic;\n}\n.admin__table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.875rem;\n}\n.admin__table th,\n.admin__table td {\n  text-align: left;\n  padding: 0.6rem 0.75rem;\n  border-bottom: 1px solid #e9ecef;\n  vertical-align: top;\n}\n.admin__table th {\n  color: #495057;\n  font-weight: 600;\n  font-size: 0.8125rem;\n}\n.admin__table select,\n.admin__table input[type=text] {\n  padding: 0.35rem 0.5rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-size: 0.8125rem;\n}\n.admin__email,\n.admin__org {\n  color: #868e96;\n  font-size: 0.8125rem;\n}\n.admin__actions {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  min-width: 220px;\n}\n.admin__actions button {\n  padding: 0.4rem 0.75rem;\n  border: none;\n  border-radius: 4px;\n  background: #2f9e44;\n  color: #fff;\n  cursor: pointer;\n  font-size: 0.8125rem;\n}\n.admin__actions button:disabled {\n  background: #adb5bd;\n  cursor: not-allowed;\n}\n.admin__reject {\n  display: flex;\n  gap: 0.4rem;\n}\n.admin__reject input {\n  flex: 1;\n}\n.admin__reject-btn {\n  background: #c92a2a !important;\n}\n.admin__row-error {\n  color: #c92a2a;\n  font-size: 0.75rem;\n  margin: 0;\n}\n.admin__scope {\n  min-width: 20rem;\n  vertical-align: top;\n}\n.admin__asked {\n  margin: 0 0 0.375rem;\n  font-size: 0.75rem;\n  line-height: 1.5;\n  color: #495057;\n}\n.admin__asked-label {\n  display: inline-block;\n  font-weight: 600;\n  color: #868e96;\n  margin-right: 0.375rem;\n}\n.admin__hazard-tag {\n  display: inline-block;\n  margin-left: 0.375rem;\n  padding: 0 0.375rem;\n  border-radius: 3px;\n  background: #fff3bf;\n  color: #856404;\n}\n.admin__granting {\n  margin: 0 0 0.5rem;\n  font-size: 0.75rem;\n  color: #495057;\n}\n.admin__granting em {\n  color: #c92a2a;\n  font-style: normal;\n}\n.admin__scope-buttons {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.375rem;\n}\n.admin__scope-buttons button {\n  font-size: 0.75rem;\n  padding: 0.25rem 0.5rem;\n}\n.admin__areas {\n  margin-top: 0.5rem;\n  padding: 0.5rem 0.625rem;\n  border: 1px solid #dee2e6;\n  border-radius: 4px;\n  max-height: 18rem;\n  overflow-y: auto;\n}\n.admin__sector {\n  padding: 0.25rem 0;\n  border-top: 1px solid #f1f3f5;\n}\n.admin__sector:first-of-type {\n  border-top: 0;\n}\n.admin__check {\n  display: flex;\n  align-items: baseline;\n  gap: 0.4375rem;\n  font-size: 0.75rem;\n  cursor: pointer;\n}\n.admin__check input {\n  flex: none;\n}\n.admin__check em {\n  font-style: normal;\n  color: #868e96;\n  margin-left: 0.3125rem;\n}\n.admin__subsectors {\n  padding-left: 1.375rem;\n  display: grid;\n  gap: 0.125rem;\n}\n.admin__check--sub {\n  color: #495057;\n}\n.admin__check--hazard {\n  margin-top: 0.5rem;\n  padding-top: 0.5rem;\n  border-top: 1px solid #f1f3f5;\n}\n/*# sourceMappingURL=admin-registrations.component.css.map */\n"] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AdminRegistrationsComponent, { className: "AdminRegistrationsComponent", filePath: "src/app/features/admin/admin-registrations.component.ts", lineNumber: 44 });
})();
export {
  AdminRegistrationsComponent
};
//# debugId=6e2c6317-626f-525c-8c11-6baf7bc3ec7e
//# sourceMappingURL=chunk-BLQXDUAC.js.map
