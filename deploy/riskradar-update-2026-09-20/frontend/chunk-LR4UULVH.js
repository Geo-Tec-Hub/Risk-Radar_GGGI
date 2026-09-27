import {
  scopeToQueryParams
} from "./chunk-WRSNWZSJ.js";
import {
  ApiClientService
} from "./chunk-QBP7AOH4.js";
import {
  TaxonomyService
} from "./chunk-BK36RS6Q.js";
import {
  Router,
  RouterLink
} from "./chunk-UFWDULIL.js";
import {
  CheckboxControlValueAccessor,
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
  HttpClient,
  __spreadProps,
  __spreadValues,
  computed,
  effect,
  inject,
  setClassMetadata,
  signal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵclassProp,
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
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-SAQOEXKZ.js";

// src/app/features/admin/admin-model.component.ts
var _forTrack0 = ($index, $item) => $item.code;
var _forTrack1 = ($index, $item) => $item.id;
function _forTrack2($index, $item) {
  return this.areaLabel($item);
}
function AdminModelComponent_For_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r1 = ctx.$implicit;
    \u0275\u0275property("ngValue", p_r1.code);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(p_r1.name);
  }
}
function AdminModelComponent_For_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const s_r2 = ctx.$implicit;
    \u0275\u0275property("ngValue", s_r2.code);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(s_r2.name);
  }
}
function AdminModelComponent_For_28_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const s_r3 = ctx.$implicit;
    \u0275\u0275property("ngValue", s_r3.code);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(s_r3.name);
  }
}
function AdminModelComponent_For_34_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const h_r4 = ctx.$implicit;
    \u0275\u0275property("ngValue", h_r4.code);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(h_r4.name);
  }
}
function AdminModelComponent_Conditional_35_Template(rf, ctx) {
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
function AdminModelComponent_Conditional_36_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 12);
    \u0275\u0275text(1, "Loading\u2026");
    \u0275\u0275elementEnd();
  }
}
function AdminModelComponent_Conditional_37_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    \u0275\u0275textInterpolate1(" \xB7 version ", ctx, " ");
  }
}
function AdminModelComponent_Conditional_37_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 38);
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "span", 39);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const v_r5 = ctx.$implicit;
    \u0275\u0275classProp("am__chip--hazard", v_r5.domain === "hazard");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", v_r5.name, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(v_r5.code);
  }
}
function AdminModelComponent_Conditional_37_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 12);
    \u0275\u0275text(1);
    \u0275\u0275conditionalCreate(2, AdminModelComponent_Conditional_37_Conditional_2_Template, 1, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "ul", 36);
    \u0275\u0275repeaterCreate(4, AdminModelComponent_Conditional_37_For_5_Template, 4, 4, "li", 37, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_2_0;
    const ctx_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r5.profileVariables().length, " variable(s) in this profile ");
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_2_0 = ctx_r5.profileVersion()) ? 2 : -1, tmp_2_0);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r5.profileVariables());
  }
}
function AdminModelComponent_For_57_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr")(1, "td")(2, "input", 40);
    \u0275\u0275listener("change", function AdminModelComponent_For_57_Template_input_change_2_listener() {
      const c_r8 = \u0275\u0275restoreView(_r7).$implicit;
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.toggleSelected(c_r8.code));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td", 41);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "td");
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "td");
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const c_r8 = ctx.$implicit;
    const ctx_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("checked", ctx_r5.selected().includes(c_r8.code));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(c_r8.name);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(c_r8.code);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(c_r8.domain);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", c_r8.usedInProfiles, " profile(s)");
  }
}
function AdminModelComponent_Conditional_64_For_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td", 41);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "td")(8, "button", 24);
    \u0275\u0275listener("click", function AdminModelComponent_Conditional_64_For_8_Template_button_click_8_listener() {
      const c_r10 = \u0275\u0275restoreView(_r9).$implicit;
      const ctx_r5 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r5.setStatus(c_r10, "active"));
    });
    \u0275\u0275text(9, "Approve");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "button", 24);
    \u0275\u0275listener("click", function AdminModelComponent_Conditional_64_For_8_Template_button_click_10_listener() {
      const c_r10 = \u0275\u0275restoreView(_r9).$implicit;
      const ctx_r5 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r5.setStatus(c_r10, "retired"));
    });
    \u0275\u0275text(11, "Reject");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const c_r10 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(c_r10.name);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(c_r10.code);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(c_r10.domain);
  }
}
function AdminModelComponent_Conditional_64_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 17)(1, "h4");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 12);
    \u0275\u0275text(4, " A code is permanent: values key to it, upload templates carry a column for it, and profiles cite it in their audit trail. Approve only what is genuinely a new fact. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "table", 14)(6, "tbody");
    \u0275\u0275repeaterCreate(7, AdminModelComponent_Conditional_64_For_8_Template, 12, 3, "tr", null, _forTrack1);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", ctx_r5.pending().length, " awaiting approval");
    \u0275\u0275advance(5);
    \u0275\u0275repeater(ctx_r5.pending());
  }
}
function AdminModelComponent_Conditional_82_Template(rf, ctx) {
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
function AdminModelComponent_Conditional_110_Template(rf, ctx) {
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
function AdminModelComponent_Conditional_111_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 29);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function AdminModelComponent_For_126_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td", 41);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const h_r11 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(h_r11.name);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(h_r11.code);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(h_r11.profiles);
  }
}
function AdminModelComponent_Conditional_138_Template(rf, ctx) {
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
function AdminModelComponent_Conditional_139_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 29);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function AdminModelComponent_For_151_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r12 = ctx.$implicit;
    \u0275\u0275property("ngValue", p_r12.name);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(p_r12.name);
  }
}
function AdminModelComponent_For_159_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const s_r13 = ctx.$implicit;
    \u0275\u0275property("ngValue", s_r13.name);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(s_r13.name);
  }
}
function AdminModelComponent_Conditional_160_Template(rf, ctx) {
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
function AdminModelComponent_Conditional_161_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 29);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function AdminModelComponent_For_179_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275text(1, "none");
    \u0275\u0275elementEnd();
  }
}
function AdminModelComponent_For_179_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const u_r15 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275textInterpolate1(" ", u_r15.scopes.join("; "), " ");
  }
}
function AdminModelComponent_For_179_For_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r16 = ctx.$implicit;
    \u0275\u0275property("ngValue", r_r16.code);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(r_r16.name);
  }
}
function AdminModelComponent_For_179_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 44);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const u_r15 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" holds ", u_r15.roles.join(", "), " \u2014 saving keeps only the one chosen ");
  }
}
function AdminModelComponent_For_179_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275element(3, "br");
    \u0275\u0275elementStart(4, "span", 12);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "td");
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "td");
    \u0275\u0275conditionalCreate(9, AdminModelComponent_For_179_Conditional_9_Template, 2, 0, "span", 12)(10, AdminModelComponent_For_179_Conditional_10_Template, 1, 1);
    \u0275\u0275element(11, "br");
    \u0275\u0275elementStart(12, "button", 42);
    \u0275\u0275listener("click", function AdminModelComponent_For_179_Template_button_click_12_listener() {
      const u_r15 = \u0275\u0275restoreView(_r14).$implicit;
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.editSectors(u_r15));
    });
    \u0275\u0275text(13, "Change sectors");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "td");
    \u0275\u0275text(15);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "td")(17, "select", 43);
    \u0275\u0275listener("ngModelChange", function AdminModelComponent_For_179_Template_select_ngModelChange_17_listener($event) {
      const u_r15 = \u0275\u0275restoreView(_r14).$implicit;
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.onRoleDraft(u_r15.id, $event));
    });
    \u0275\u0275elementStart(18, "option", 21);
    \u0275\u0275text(19, "\u2014");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(20, AdminModelComponent_For_179_For_21_Template, 2, 2, "option", 7, _forTrack0);
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275conditionalCreate(22, AdminModelComponent_For_179_Conditional_22_Template, 2, 1, "span", 44);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(23, "td")(24, "button", 24);
    \u0275\u0275listener("click", function AdminModelComponent_For_179_Template_button_click_24_listener() {
      const u_r15 = \u0275\u0275restoreView(_r14).$implicit;
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.saveRoles(u_r15));
    });
    \u0275\u0275text(25, "Save role");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const u_r15 = ctx.$implicit;
    const ctx_r5 = \u0275\u0275nextContext();
    \u0275\u0275classProp("am__row--inactive", u_r15.status !== "active");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", u_r15.fullName);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", u_r15.email, " \xB7 ", u_r15.status);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(u_r15.province ?? "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(u_r15.scopes.length === 0 ? 9 : 10);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(u_r15.mayWriteHazardDomain ? "yes" : "no");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", ctx_r5.roleDraft()[u_r15.id])("name", "role" + u_r15.id);
    \u0275\u0275control();
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r5.roles());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r5.wouldDropRoles(u_r15) ? 22 : -1);
  }
}
function AdminModelComponent_Conditional_180_Conditional_3_Template(rf, ctx) {
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
function AdminModelComponent_Conditional_180_For_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "li", 45);
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "button", 52);
    \u0275\u0275listener("click", function AdminModelComponent_Conditional_180_For_6_Template_button_click_2_listener() {
      const a_r19 = \u0275\u0275restoreView(_r18).$implicit;
      const ctx_r5 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r5.removeArea(a_r19));
    });
    \u0275\u0275text(3, "\xD7");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const a_r19 = ctx.$implicit;
    const ctx_r5 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r5.areaLabel(a_r19), " ");
  }
}
function AdminModelComponent_Conditional_180_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 46);
    \u0275\u0275text(1, " No sectors. Saving now revokes everything this account may write \u2014 which is a valid decision, but it is a revocation, not a blank form. ");
    \u0275\u0275elementEnd();
  }
}
function AdminModelComponent_Conditional_180_For_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const a_r20 = ctx.$implicit;
    \u0275\u0275property("ngValue", a_r20.code);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(a_r20.name);
  }
}
function AdminModelComponent_Conditional_180_For_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const sub_r21 = ctx.$implicit;
    \u0275\u0275property("ngValue", sub_r21.code);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(sub_r21.name);
  }
}
function AdminModelComponent_Conditional_180_Conditional_27_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275text(1, "Whole sector already granted \u2014 a subsector adds nothing.");
    \u0275\u0275elementEnd();
  }
}
function AdminModelComponent_Conditional_180_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 35)(1, "h4");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(3, AdminModelComponent_Conditional_180_Conditional_3_Template, 2, 1, "p", 11);
    \u0275\u0275elementStart(4, "ul", 36);
    \u0275\u0275repeaterCreate(5, AdminModelComponent_Conditional_180_For_6_Template, 4, 1, "li", 45, _forTrack2, true);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(7, AdminModelComponent_Conditional_180_Conditional_7_Template, 2, 0, "p", 46);
    \u0275\u0275elementStart(8, "div", 4)(9, "label", 5)(10, "span");
    \u0275\u0275text(11, "Sector");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "select", 47);
    \u0275\u0275listener("ngModelChange", function AdminModelComponent_Conditional_180_Template_select_ngModelChange_12_listener($event) {
      \u0275\u0275restoreView(_r17);
      const ctx_r5 = \u0275\u0275nextContext();
      ctx_r5.addSector.set($event);
      return \u0275\u0275resetView(ctx_r5.addSubsector.set(""));
    });
    \u0275\u0275elementStart(13, "option", 21);
    \u0275\u0275text(14, "Choose\u2026");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(15, AdminModelComponent_Conditional_180_For_16_Template, 2, 2, "option", 7, _forTrack0);
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "label", 5)(18, "span");
    \u0275\u0275text(19, "Subsector");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "select", 48);
    \u0275\u0275listener("ngModelChange", function AdminModelComponent_Conditional_180_Template_select_ngModelChange_20_listener($event) {
      \u0275\u0275restoreView(_r17);
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.addSubsector.set($event));
    });
    \u0275\u0275elementStart(21, "option", 21);
    \u0275\u0275text(22, "All subsectors");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(23, AdminModelComponent_Conditional_180_For_24_Template, 2, 2, "option", 7, _forTrack0);
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "button", 49);
    \u0275\u0275listener("click", function AdminModelComponent_Conditional_180_Template_button_click_25_listener() {
      \u0275\u0275restoreView(_r17);
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.addArea());
    });
    \u0275\u0275text(26, "Add");
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(27, AdminModelComponent_Conditional_180_Conditional_27_Template, 2, 0, "span", 12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "label", 50)(29, "input", 51);
    \u0275\u0275listener("ngModelChange", function AdminModelComponent_Conditional_180_Template_input_ngModelChange_29_listener($event) {
      \u0275\u0275restoreView(_r17);
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.draftHazardDomain.set($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275text(30, " May write climate (hazard) variables \u2014 shared by every sector, held centrally ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(31, "div", 15)(32, "button", 16);
    \u0275\u0275listener("click", function AdminModelComponent_Conditional_180_Template_button_click_32_listener() {
      \u0275\u0275restoreView(_r17);
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.saveSectors());
    });
    \u0275\u0275text(33);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(34, "button", 24);
    \u0275\u0275listener("click", function AdminModelComponent_Conditional_180_Template_button_click_34_listener() {
      \u0275\u0275restoreView(_r17);
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.cancelSectors());
    });
    \u0275\u0275text(35, "Cancel");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_3_0;
    const ctx_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Sectors ", ctx.fullName, " may write");
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_3_0 = ctx_r5.scopeError()) ? 3 : -1, tmp_3_0);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r5.draftAreas());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r5.draftAreas().length === 0 ? 7 : -1);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", ctx_r5.addSector());
    \u0275\u0275control();
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r5.areaOptions());
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", ctx_r5.addSubsector())("disabled", !ctx_r5.addSector() || ctx_r5.addSubsectorOptions().length === 0);
    \u0275\u0275control();
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r5.addSubsectorOptions());
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", !ctx_r5.addSector());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r5.alreadyWholeSector() ? 27 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", ctx_r5.draftHazardDomain());
    \u0275\u0275control();
    \u0275\u0275advance(3);
    \u0275\u0275property("disabled", ctx_r5.scopeBusy());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r5.scopeBusy() ? "Saving\u2026" : "Save sectors", " ");
  }
}
var AdminModelComponent = class _AdminModelComponent {
  api = inject(ApiClientService);
  http = inject(HttpClient);
  router = inject(Router);
  taxonomyService = inject(TaxonomyService);
  taxonomy = this.taxonomyService.taxonomy;
  provinces = computed(
    () => this.taxonomy()?.provinces ?? [],
    ...ngDevMode ? [{ debugName: "provinces" }] : (
      /* istanbul ignore next */
      []
    )
  );
  sectors = computed(
    () => this.taxonomy()?.sectors ?? [],
    ...ngDevMode ? [{ debugName: "sectors" }] : (
      /* istanbul ignore next */
      []
    )
  );
  hazardOptions = computed(
    () => this.taxonomy()?.hazards ?? [],
    ...ngDevMode ? [{ debugName: "hazardOptions" }] : (
      /* istanbul ignore next */
      []
    )
  );
  // ---- section 1: a profile's variables ---------------------------------
  province = signal(
    void 0,
    ...ngDevMode ? [{ debugName: "province" }] : (
      /* istanbul ignore next */
      []
    )
  );
  sector = signal(
    void 0,
    ...ngDevMode ? [{ debugName: "sector" }] : (
      /* istanbul ignore next */
      []
    )
  );
  subsector = signal(
    void 0,
    ...ngDevMode ? [{ debugName: "subsector" }] : (
      /* istanbul ignore next */
      []
    )
  );
  hazard = signal(
    void 0,
    ...ngDevMode ? [{ debugName: "hazard" }] : (
      /* istanbul ignore next */
      []
    )
  );
  subsectorOptions = computed(
    () => this.sectors().find((s) => s.code === this.sector())?.subsectors ?? [],
    ...ngDevMode ? [{ debugName: "subsectorOptions" }] : (
      /* istanbul ignore next */
      []
    )
  );
  profileVariables = signal(
    [],
    ...ngDevMode ? [{ debugName: "profileVariables" }] : (
      /* istanbul ignore next */
      []
    )
  );
  profileVersion = signal(
    null,
    ...ngDevMode ? [{ debugName: "profileVersion" }] : (
      /* istanbul ignore next */
      []
    )
  );
  profileError = signal(
    null,
    ...ngDevMode ? [{ debugName: "profileError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  loadingProfile = signal(
    false,
    ...ngDevMode ? [{ debugName: "loadingProfile" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Codes ticked in the catalogue list, waiting to be sent to the weights editor. */
  selected = signal(
    [],
    ...ngDevMode ? [{ debugName: "selected" }] : (
      /* istanbul ignore next */
      []
    )
  );
  scope = computed(
    () => {
      const p = this.province(), s = this.sector(), h = this.hazard();
      if (!p || !s || !h)
        return null;
      return { province: p, sector: s, hazard: h, subsector: this.subsector() || void 0 };
    },
    ...ngDevMode ? [{ debugName: "scope" }] : (
      /* istanbul ignore next */
      []
    )
  );
  // ---- section 2: the catalogue -----------------------------------------
  catalog = signal(
    [],
    ...ngDevMode ? [{ debugName: "catalog" }] : (
      /* istanbul ignore next */
      []
    )
  );
  catalogQuery = signal(
    "",
    ...ngDevMode ? [{ debugName: "catalogQuery" }] : (
      /* istanbul ignore next */
      []
    )
  );
  catalogDomain = signal(
    "",
    ...ngDevMode ? [{ debugName: "catalogDomain" }] : (
      /* istanbul ignore next */
      []
    )
  );
  catalogBusy = signal(
    false,
    ...ngDevMode ? [{ debugName: "catalogBusy" }] : (
      /* istanbul ignore next */
      []
    )
  );
  catalogError = signal(
    null,
    ...ngDevMode ? [{ debugName: "catalogError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  pending = computed(
    () => this.catalog().filter((c) => c.status === "pending"),
    ...ngDevMode ? [{ debugName: "pending" }] : (
      /* istanbul ignore next */
      []
    )
  );
  inProfile = computed(
    () => new Set(this.profileVariables().map((v) => v.code)),
    ...ngDevMode ? [{ debugName: "inProfile" }] : (
      /* istanbul ignore next */
      []
    )
  );
  addable = computed(
    () => this.catalog().filter((c) => c.status === "active" && !this.inProfile().has(c.code)),
    ...ngDevMode ? [{ debugName: "addable" }] : (
      /* istanbul ignore next */
      []
    )
  );
  newVar = signal(
    { code: "", name: "", domain: "exposure", unit: "" },
    ...ngDevMode ? [{ debugName: "newVar" }] : (
      /* istanbul ignore next */
      []
    )
  );
  proposeMessage = signal(
    null,
    ...ngDevMode ? [{ debugName: "proposeMessage" }] : (
      /* istanbul ignore next */
      []
    )
  );
  proposeError = signal(
    null,
    ...ngDevMode ? [{ debugName: "proposeError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  // ---- section 3: hazard types ------------------------------------------
  hazards = signal(
    [],
    ...ngDevMode ? [{ debugName: "hazards" }] : (
      /* istanbul ignore next */
      []
    )
  );
  newHazard = signal(
    { code: "", name: "" },
    ...ngDevMode ? [{ debugName: "newHazard" }] : (
      /* istanbul ignore next */
      []
    )
  );
  hazardMessage = signal(
    null,
    ...ngDevMode ? [{ debugName: "hazardMessage" }] : (
      /* istanbul ignore next */
      []
    )
  );
  hazardError = signal(
    null,
    ...ngDevMode ? [{ debugName: "hazardError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  // ---- section 4: people -------------------------------------------------
  users = signal(
    [],
    ...ngDevMode ? [{ debugName: "users" }] : (
      /* istanbul ignore next */
      []
    )
  );
  userProvince = signal(
    "",
    ...ngDevMode ? [{ debugName: "userProvince" }] : (
      /* istanbul ignore next */
      []
    )
  );
  userSector = signal(
    "",
    ...ngDevMode ? [{ debugName: "userSector" }] : (
      /* istanbul ignore next */
      []
    )
  );
  userError = signal(
    null,
    ...ngDevMode ? [{ debugName: "userError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Roles come from the `role` table, not a list typed in here: a hardcoded
   * one drifts the first time a role is added, and the drift shows up as a role
   * nobody can assign. */
  roles = signal(
    [],
    ...ngDevMode ? [{ debugName: "roles" }] : (
      /* istanbul ignore next */
      []
    )
  );
  roleDraft = signal(
    {},
    ...ngDevMode ? [{ debugName: "roleDraft" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** The account whose sectors are open for editing, and its scope as granted.
   * One at a time: a table of open editors invites saving the wrong row. */
  editingUser = signal(
    null,
    ...ngDevMode ? [{ debugName: "editingUser" }] : (
      /* istanbul ignore next */
      []
    )
  );
  editScope = signal(
    null,
    ...ngDevMode ? [{ debugName: "editScope" }] : (
      /* istanbul ignore next */
      []
    )
  );
  draftAreas = signal(
    [],
    ...ngDevMode ? [{ debugName: "draftAreas" }] : (
      /* istanbul ignore next */
      []
    )
  );
  draftHazardDomain = signal(
    false,
    ...ngDevMode ? [{ debugName: "draftHazardDomain" }] : (
      /* istanbul ignore next */
      []
    )
  );
  areaOptions = signal(
    [],
    ...ngDevMode ? [{ debugName: "areaOptions" }] : (
      /* istanbul ignore next */
      []
    )
  );
  addSector = signal(
    "",
    ...ngDevMode ? [{ debugName: "addSector" }] : (
      /* istanbul ignore next */
      []
    )
  );
  addSubsector = signal(
    "",
    ...ngDevMode ? [{ debugName: "addSubsector" }] : (
      /* istanbul ignore next */
      []
    )
  );
  scopeBusy = signal(
    false,
    ...ngDevMode ? [{ debugName: "scopeBusy" }] : (
      /* istanbul ignore next */
      []
    )
  );
  scopeError = signal(
    null,
    ...ngDevMode ? [{ debugName: "scopeError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  scopeMessage = signal(
    null,
    ...ngDevMode ? [{ debugName: "scopeMessage" }] : (
      /* istanbul ignore next */
      []
    )
  );
  addSubsectorOptions = computed(
    () => this.areaOptions().find((a) => a.code === this.addSector())?.subsectors ?? [],
    ...ngDevMode ? [{ debugName: "addSubsectorOptions" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** A whole-sector grant already covers every subsector under it, so offering
   * to add one on top would create a row that grants nothing new and reads as
   * if it narrowed something. */
  alreadyWholeSector = computed(
    () => this.draftAreas().some((a) => a.sector === this.addSector() && !a.subsector),
    ...ngDevMode ? [{ debugName: "alreadyWholeSector" }] : (
      /* istanbul ignore next */
      []
    )
  );
  constructor() {
    effect(() => {
      const t = this.taxonomy();
      if (!t || this.sector() !== void 0)
        return;
      this.province.set(t.provinces[0]?.code);
      this.sector.set(t.sectors[0]?.code);
      this.subsector.set(t.sectors[0]?.subsectors[0]?.code);
      this.hazard.set(t.hazards[0]?.code);
      this.loadProfile();
    });
  }
  ngOnInit() {
    this.taxonomyService.load();
    this.searchCatalog();
    this.loadHazards();
    this.loadUsers();
    this.api.getRoles().subscribe({ next: (r) => this.roles.set(r), error: () => this.roles.set([]) });
    this.api.getInterestAreaOptions().subscribe({
      next: (a) => this.areaOptions.set(a),
      error: () => this.areaOptions.set([])
    });
  }
  // ---- section 1 ---------------------------------------------------------
  onSectorChange(code) {
    this.sector.set(code || void 0);
    this.subsector.set(this.subsectorOptions()[0]?.code);
    this.loadProfile();
  }
  loadProfile() {
    const scope = this.scope();
    if (!scope)
      return;
    this.loadingProfile.set(true);
    this.profileError.set(null);
    this.selected.set([]);
    this.api.getProfileWeights(scope).subscribe({
      next: (w) => {
        this.profileVersion.set(w.profileVersion);
        this.profileVariables.set([...w.hazardVariables, ...w.exposureVariables].map((v) => ({
          id: 0,
          code: v.indicatorCode,
          name: v.indicatorName,
          domain: v.domain,
          unit: v.unit,
          direction: v.relationship,
          status: "active",
          usedInProfiles: 0
        })));
        this.loadingProfile.set(false);
      },
      error: (err) => {
        this.profileVariables.set([]);
        this.profileVersion.set(null);
        this.profileError.set(err.message ?? "This profile could not be loaded.");
        this.loadingProfile.set(false);
      }
    });
  }
  toggleSelected(code) {
    const cur = this.selected();
    this.selected.set(cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]);
  }
  /** Hand the chosen variables to the weights editor. Nothing is written here:
   * the profile changes only when the panel saves a new version there. */
  addToProfile() {
    const scope = this.scope();
    if (!scope || this.selected().length === 0)
      return;
    this.router.navigate(["/weights"], {
      queryParams: __spreadProps(__spreadValues({}, scopeToQueryParams(scope)), { add: this.selected().join(",") })
    });
  }
  // ---- section 2 ---------------------------------------------------------
  searchCatalog() {
    this.catalogBusy.set(true);
    this.catalogError.set(null);
    this.api.getCatalog({
      q: this.catalogQuery().trim() || void 0,
      domain: this.catalogDomain() || void 0
    }).subscribe({
      next: (items) => {
        this.catalog.set(items);
        this.catalogBusy.set(false);
      },
      error: (err) => {
        this.catalogError.set(err.message ?? "The catalogue could not be loaded.");
        this.catalogBusy.set(false);
      }
    });
  }
  propose() {
    const v = this.newVar();
    this.proposeError.set(null);
    this.proposeMessage.set(null);
    if (!v.code.trim() || !v.name.trim()) {
      this.proposeError.set("A new variable needs both a code and a name.");
      return;
    }
    this.api.proposeVariable({
      code: v.code.trim().toUpperCase(),
      name: v.name.trim(),
      domain: v.domain,
      unit: v.unit.trim() || void 0
    }).subscribe({
      next: (item) => {
        this.proposeMessage.set(`${item.code} proposed. It is pending until an administrator approves it \u2014 only then can it carry a weight.`);
        this.newVar.set({ code: "", name: "", domain: "exposure", unit: "" });
        this.searchCatalog();
      },
      error: (err) => this.proposeError.set(err?.error?.detail ?? err.message ?? "It could not be proposed.")
    });
  }
  setStatus(item, status) {
    this.catalogError.set(null);
    this.api.setVariableStatus(item.id, status).subscribe({
      next: () => this.searchCatalog(),
      error: (err) => this.catalogError.set(err?.error?.detail ?? err.message ?? "The change was refused.")
    });
  }
  // ---- section 3 ---------------------------------------------------------
  loadHazards() {
    this.api.getHazards().subscribe({
      next: (h) => this.hazards.set(h),
      error: () => this.hazards.set([])
    });
  }
  addHazard() {
    const h = this.newHazard();
    this.hazardError.set(null);
    this.hazardMessage.set(null);
    if (!h.code.trim() || !h.name.trim()) {
      this.hazardError.set("A hazard needs both a code and a name.");
      return;
    }
    this.api.addHazard({ code: h.code.trim(), name: h.name.trim() }).subscribe({
      next: (created) => {
        this.hazardMessage.set(`${created.name} added. It scores nothing yet: a profile is sector \xD7 hazard \xD7 province, so it stays out of every filter until profiles are built and weighted for it.`);
        this.newHazard.set({ code: "", name: "" });
        this.loadHazards();
      },
      error: (err) => this.hazardError.set(err?.error?.detail ?? err.message ?? "It could not be added.")
    });
  }
  // ---- section 4 ---------------------------------------------------------
  loadUsers() {
    this.userError.set(null);
    this.api.getUsers({
      province: this.userProvince() || void 0,
      sector: this.userSector() || void 0
    }).subscribe({
      next: (u) => {
        this.users.set(u);
        this.roleDraft.set(Object.fromEntries(u.map((x) => [x.id, x.roles[0] ?? ""])));
      },
      error: (err) => {
        this.users.set([]);
        this.userError.set(err.message ?? "Accounts could not be loaded \u2014 administrator only.");
      }
    });
  }
  onRoleDraft(id, value) {
    this.roleDraft.set(__spreadProps(__spreadValues({}, this.roleDraft()), { [id]: value }));
  }
  saveRoles(u) {
    const chosen = this.roleDraft()[u.id] ?? "";
    this.userError.set(null);
    if (!chosen) {
      this.userError.set("Choose a role first.");
      return;
    }
    this.api.setUserRoles(u.id, [chosen]).subscribe({
      next: () => this.loadUsers(),
      error: (err) => this.userError.set(err?.error?.detail ?? err.message ?? "The roles could not be changed.")
    });
  }
  /** True when saving the single chosen role would silently remove others. */
  wouldDropRoles(u) {
    return u.roles.length > 1;
  }
  // ---- sector grants -----------------------------------------------------
  editSectors(u) {
    this.scopeError.set(null);
    this.scopeMessage.set(null);
    this.editingUser.set(u);
    this.editScope.set(null);
    this.draftAreas.set([]);
    this.api.getUserScope(u.id).subscribe({
      next: (scope) => {
        this.editScope.set(scope);
        this.draftAreas.set(scope.areas.map((a) => ({ sector: a.sector, subsector: a.subsector ?? void 0 })));
        this.draftHazardDomain.set(scope.may_write_hazard_domain);
      },
      error: (err) => this.scopeError.set(err?.error?.detail ?? err.message ?? "The scope could not be read.")
    });
  }
  cancelSectors() {
    this.editingUser.set(null);
    this.editScope.set(null);
    this.draftAreas.set([]);
  }
  addArea() {
    const sector = this.addSector();
    if (!sector)
      return;
    const subsector = this.addSubsector() || void 0;
    const exists = this.draftAreas().some((a) => a.sector === sector && (a.subsector ?? "") === (subsector ?? ""));
    if (exists)
      return;
    let next = [...this.draftAreas(), { sector, subsector }];
    if (!subsector) {
      next = next.filter((a) => a.sector !== sector || !a.subsector);
    }
    this.draftAreas.set(next);
    this.addSubsector.set("");
  }
  removeArea(area) {
    this.draftAreas.set(this.draftAreas().filter((a) => !(a.sector === area.sector && (a.subsector ?? "") === (area.subsector ?? ""))));
  }
  areaLabel(a) {
    const opt = this.areaOptions().find((o) => o.code === a.sector);
    const sector = opt?.name ?? a.sector;
    if (!a.subsector)
      return sector + " (all subsectors)";
    const sub = opt?.subsectors.find((s) => s.code === a.subsector);
    return sector + " / " + (sub?.name ?? a.subsector);
  }
  saveSectors() {
    const u = this.editingUser();
    if (!u)
      return;
    this.scopeBusy.set(true);
    this.scopeError.set(null);
    this.scopeMessage.set(null);
    this.api.setUserScope(u.id, {
      scopes: this.draftAreas(),
      may_write_hazard_domain: this.draftHazardDomain()
    }).subscribe({
      next: () => {
        this.scopeBusy.set(false);
        this.scopeMessage.set(u.fullName + "'s sectors updated.");
        this.editingUser.set(null);
        this.loadUsers();
      },
      error: (err) => {
        this.scopeBusy.set(false);
        this.scopeError.set(err?.error?.detail ?? err.message ?? "The sectors could not be saved.");
      }
    });
  }
  static \u0275fac = function AdminModelComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AdminModelComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AdminModelComponent, selectors: [["app-admin-model"]], decls: 183, vars: 29, consts: [[1, "am"], ["routerLink", "/import", 1, "am__back"], [1, "am__lede"], [1, "am__section"], [1, "am__row"], [1, "am__field"], ["name", "p", 3, "ngModelChange", "ngModel"], [3, "ngValue"], ["name", "s", 3, "ngModelChange", "ngModel"], ["name", "ss", 3, "ngModelChange", "ngModel", "disabled"], ["name", "h", 3, "ngModelChange", "ngModel"], ["role", "alert", 1, "am__banner", "am__banner--error"], [1, "am__muted"], [1, "am__scroll"], [1, "am__table"], [1, "am__actions"], ["type", "button", 1, "am__primary", 3, "click", "disabled"], [1, "am__pending"], [1, "am__field", "am__field--grow"], ["type", "search", "name", "cq", "placeholder", "name or code", 3, "ngModelChange", "keyup.enter", "ngModel"], ["name", "cd", 3, "ngModelChange", "ngModel"], ["value", ""], ["value", "hazard"], ["value", "exposure"], ["type", "button", 3, "click"], ["name", "nvc", "placeholder", "PADDY_EXTENT", 3, "ngModelChange", "ngModel"], ["name", "nvn", "placeholder", "Extent of paddy land", 3, "ngModelChange", "ngModel"], ["name", "nvd", 3, "ngModelChange", "ngModel"], ["name", "nvu", "placeholder", "ha", 3, "ngModelChange", "ngModel"], [1, "am__banner", "am__banner--ok"], ["name", "nhc", "placeholder", "cyclone", 3, "ngModelChange", "ngModel"], ["name", "nhn", "placeholder", "Cyclone", 3, "ngModelChange", "ngModel"], ["name", "up", 3, "ngModelChange", "ngModel"], ["name", "us", 3, "ngModelChange", "ngModel"], [3, "am__row--inactive"], [1, "am__editor"], [1, "am__chips"], [1, "am__chip", 3, "am__chip--hazard"], [1, "am__chip"], [1, "am__code"], ["type", "checkbox", 3, "change", "checked"], [1, "am__mono"], ["type", "button", 1, "am__link", 3, "click"], [1, "am__roles", 3, "ngModelChange", "ngModel", "name"], ["title", "This account holds more than one role", 1, "am__warn"], [1, "am__chip", "am__chip--grant"], [1, "am__banner"], ["name", "as", 3, "ngModelChange", "ngModel"], ["name", "ass", 3, "ngModelChange", "ngModel", "disabled"], ["type", "button", 3, "click", "disabled"], [1, "am__check"], ["type", "checkbox", "name", "hz", 3, "ngModelChange", "ngModel"], ["type", "button", "aria-label", "Remove", 1, "am__chipx", 3, "click"]], template: function AdminModelComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "a", 1);
      \u0275\u0275text(2, "\u2190 Back to import");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "h2");
      \u0275\u0275text(4, "Model administration");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "p", 2);
      \u0275\u0275text(6, " The variables a profile carries, the hazards that exist, and who may write what. Weights are not set here \u2014 adding a variable sends you to the weights editor, where the panel decides its share and the save is recorded as a new profile version. ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "section", 3)(8, "h3");
      \u0275\u0275text(9, "Variables in a profile");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(10, "div", 4)(11, "label", 5)(12, "span");
      \u0275\u0275text(13, "Province");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(14, "select", 6);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_select_ngModelChange_14_listener($event) {
        ctx.province.set($event);
        return ctx.loadProfile();
      });
      \u0275\u0275repeaterCreate(15, AdminModelComponent_For_16_Template, 2, 2, "option", 7, _forTrack0);
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(17, "label", 5)(18, "span");
      \u0275\u0275text(19, "Sector");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(20, "select", 8);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_select_ngModelChange_20_listener($event) {
        return ctx.onSectorChange($event);
      });
      \u0275\u0275repeaterCreate(21, AdminModelComponent_For_22_Template, 2, 2, "option", 7, _forTrack0);
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(23, "label", 5)(24, "span");
      \u0275\u0275text(25, "Subsector");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(26, "select", 9);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_select_ngModelChange_26_listener($event) {
        ctx.subsector.set($event);
        return ctx.loadProfile();
      });
      \u0275\u0275repeaterCreate(27, AdminModelComponent_For_28_Template, 2, 2, "option", 7, _forTrack0);
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(29, "label", 5)(30, "span");
      \u0275\u0275text(31, "Hazard");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(32, "select", 10);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_select_ngModelChange_32_listener($event) {
        ctx.hazard.set($event);
        return ctx.loadProfile();
      });
      \u0275\u0275repeaterCreate(33, AdminModelComponent_For_34_Template, 2, 2, "option", 7, _forTrack0);
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd()();
      \u0275\u0275conditionalCreate(35, AdminModelComponent_Conditional_35_Template, 2, 1, "p", 11)(36, AdminModelComponent_Conditional_36_Template, 2, 0, "p", 12)(37, AdminModelComponent_Conditional_37_Template, 6, 2);
      \u0275\u0275elementStart(38, "h4");
      \u0275\u0275text(39, "Add a variable");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(40, "p", 12);
      \u0275\u0275text(41, " Only approved (active) variables appear here. Tick what this profile should carry, then set the weights \u2014 nothing changes until that new version is saved. ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(42, "div", 13)(43, "table", 14)(44, "thead")(45, "tr");
      \u0275\u0275element(46, "th");
      \u0275\u0275elementStart(47, "th");
      \u0275\u0275text(48, "Variable");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(49, "th");
      \u0275\u0275text(50, "Code");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(51, "th");
      \u0275\u0275text(52, "Domain");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(53, "th");
      \u0275\u0275text(54, "Used in");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(55, "tbody");
      \u0275\u0275repeaterCreate(56, AdminModelComponent_For_57_Template, 11, 5, "tr", null, _forTrack1);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(58, "div", 15)(59, "button", 16);
      \u0275\u0275listener("click", function AdminModelComponent_Template_button_click_59_listener() {
        return ctx.addToProfile();
      });
      \u0275\u0275text(60);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(61, "section", 3)(62, "h3");
      \u0275\u0275text(63, "Variable catalogue");
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(64, AdminModelComponent_Conditional_64_Template, 9, 1, "div", 17);
      \u0275\u0275elementStart(65, "div", 4)(66, "label", 18)(67, "span");
      \u0275\u0275text(68, "Search");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(69, "input", 19);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_input_ngModelChange_69_listener($event) {
        return ctx.catalogQuery.set($event);
      })("keyup.enter", function AdminModelComponent_Template_input_keyup_enter_69_listener() {
        return ctx.searchCatalog();
      });
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(70, "label", 5)(71, "span");
      \u0275\u0275text(72, "Domain");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(73, "select", 20);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_select_ngModelChange_73_listener($event) {
        ctx.catalogDomain.set($event);
        return ctx.searchCatalog();
      });
      \u0275\u0275elementStart(74, "option", 21);
      \u0275\u0275text(75, "Any");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(76, "option", 22);
      \u0275\u0275text(77, "Hazard");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(78, "option", 23);
      \u0275\u0275text(79, "Exposure");
      \u0275\u0275elementEnd()();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(80, "button", 24);
      \u0275\u0275listener("click", function AdminModelComponent_Template_button_click_80_listener() {
        return ctx.searchCatalog();
      });
      \u0275\u0275text(81, "Search");
      \u0275\u0275elementEnd()();
      \u0275\u0275conditionalCreate(82, AdminModelComponent_Conditional_82_Template, 2, 1, "p", 11);
      \u0275\u0275elementStart(83, "p", 12);
      \u0275\u0275text(84);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(85, "h4");
      \u0275\u0275text(86, "Propose a new variable");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(87, "div", 4)(88, "label", 5)(89, "span");
      \u0275\u0275text(90, "Code");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(91, "input", 25);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_input_ngModelChange_91_listener($event) {
        return ctx.newVar.set(__spreadProps(__spreadValues({}, ctx.newVar()), { code: $event }));
      });
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(92, "label", 18)(93, "span");
      \u0275\u0275text(94, "Name");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(95, "input", 26);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_input_ngModelChange_95_listener($event) {
        return ctx.newVar.set(__spreadProps(__spreadValues({}, ctx.newVar()), { name: $event }));
      });
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(96, "label", 5)(97, "span");
      \u0275\u0275text(98, "Domain");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(99, "select", 27);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_select_ngModelChange_99_listener($event) {
        return ctx.newVar.set(__spreadProps(__spreadValues({}, ctx.newVar()), { domain: $event }));
      });
      \u0275\u0275elementStart(100, "option", 23);
      \u0275\u0275text(101, "Exposure");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(102, "option", 22);
      \u0275\u0275text(103, "Hazard");
      \u0275\u0275elementEnd()();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(104, "label", 5)(105, "span");
      \u0275\u0275text(106, "Unit");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(107, "input", 28);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_input_ngModelChange_107_listener($event) {
        return ctx.newVar.set(__spreadProps(__spreadValues({}, ctx.newVar()), { unit: $event }));
      });
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(108, "button", 24);
      \u0275\u0275listener("click", function AdminModelComponent_Template_button_click_108_listener() {
        return ctx.propose();
      });
      \u0275\u0275text(109, "Propose");
      \u0275\u0275elementEnd()();
      \u0275\u0275conditionalCreate(110, AdminModelComponent_Conditional_110_Template, 2, 1, "p", 11);
      \u0275\u0275conditionalCreate(111, AdminModelComponent_Conditional_111_Template, 2, 1, "p", 29);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(112, "section", 3)(113, "h3");
      \u0275\u0275text(114, "Hazard types");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(115, "table", 14)(116, "thead")(117, "tr")(118, "th");
      \u0275\u0275text(119, "Hazard");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(120, "th");
      \u0275\u0275text(121, "Code");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(122, "th");
      \u0275\u0275text(123, "Active profiles");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(124, "tbody");
      \u0275\u0275repeaterCreate(125, AdminModelComponent_For_126_Template, 7, 3, "tr", null, _forTrack1);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(127, "div", 4)(128, "label", 5)(129, "span");
      \u0275\u0275text(130, "Code");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(131, "input", 30);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_input_ngModelChange_131_listener($event) {
        return ctx.newHazard.set(__spreadProps(__spreadValues({}, ctx.newHazard()), { code: $event }));
      });
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(132, "label", 18)(133, "span");
      \u0275\u0275text(134, "Name");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(135, "input", 31);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_input_ngModelChange_135_listener($event) {
        return ctx.newHazard.set(__spreadProps(__spreadValues({}, ctx.newHazard()), { name: $event }));
      });
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(136, "button", 24);
      \u0275\u0275listener("click", function AdminModelComponent_Template_button_click_136_listener() {
        return ctx.addHazard();
      });
      \u0275\u0275text(137, "Add hazard");
      \u0275\u0275elementEnd()();
      \u0275\u0275conditionalCreate(138, AdminModelComponent_Conditional_138_Template, 2, 1, "p", 11);
      \u0275\u0275conditionalCreate(139, AdminModelComponent_Conditional_139_Template, 2, 1, "p", 29);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(140, "section", 3)(141, "h3");
      \u0275\u0275text(142, "People and what they may write");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(143, "div", 4)(144, "label", 5)(145, "span");
      \u0275\u0275text(146, "Province");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(147, "select", 32);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_select_ngModelChange_147_listener($event) {
        ctx.userProvince.set($event);
        return ctx.loadUsers();
      });
      \u0275\u0275elementStart(148, "option", 21);
      \u0275\u0275text(149, "All");
      \u0275\u0275elementEnd();
      \u0275\u0275repeaterCreate(150, AdminModelComponent_For_151_Template, 2, 2, "option", 7, _forTrack0);
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(152, "label", 5)(153, "span");
      \u0275\u0275text(154, "Sector");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(155, "select", 33);
      \u0275\u0275listener("ngModelChange", function AdminModelComponent_Template_select_ngModelChange_155_listener($event) {
        ctx.userSector.set($event);
        return ctx.loadUsers();
      });
      \u0275\u0275elementStart(156, "option", 21);
      \u0275\u0275text(157, "All");
      \u0275\u0275elementEnd();
      \u0275\u0275repeaterCreate(158, AdminModelComponent_For_159_Template, 2, 2, "option", 7, _forTrack0);
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd()();
      \u0275\u0275conditionalCreate(160, AdminModelComponent_Conditional_160_Template, 2, 1, "p", 11);
      \u0275\u0275conditionalCreate(161, AdminModelComponent_Conditional_161_Template, 2, 1, "p", 29);
      \u0275\u0275elementStart(162, "div", 13)(163, "table", 14)(164, "thead")(165, "tr")(166, "th");
      \u0275\u0275text(167, "Name");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(168, "th");
      \u0275\u0275text(169, "Province");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(170, "th");
      \u0275\u0275text(171, "Sectors they may write");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(172, "th");
      \u0275\u0275text(173, "Climate");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(174, "th");
      \u0275\u0275text(175, "Role");
      \u0275\u0275elementEnd();
      \u0275\u0275element(176, "th");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(177, "tbody");
      \u0275\u0275repeaterCreate(178, AdminModelComponent_For_179_Template, 26, 11, "tr", 34, _forTrack1);
      \u0275\u0275elementEnd()()();
      \u0275\u0275conditionalCreate(180, AdminModelComponent_Conditional_180_Template, 36, 11, "div", 35);
      \u0275\u0275elementStart(181, "p", 12);
      \u0275\u0275text(182, " A whole-sector grant covers every subsector under it. Roles come from the database, so a role added there appears here without a code change. ");
      \u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      let tmp_13_0;
      let tmp_22_0;
      let tmp_32_0;
      let tmp_33_0;
      let tmp_39_0;
      let tmp_40_0;
      let tmp_47_0;
      let tmp_48_0;
      let tmp_50_0;
      \u0275\u0275advance(14);
      \u0275\u0275property("ngModel", ctx.province());
      \u0275\u0275control();
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.provinces());
      \u0275\u0275advance(5);
      \u0275\u0275property("ngModel", ctx.sector());
      \u0275\u0275control();
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.sectors());
      \u0275\u0275advance(5);
      \u0275\u0275property("ngModel", ctx.subsector())("disabled", ctx.subsectorOptions().length === 0);
      \u0275\u0275control();
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.subsectorOptions());
      \u0275\u0275advance(5);
      \u0275\u0275property("ngModel", ctx.hazard());
      \u0275\u0275control();
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.hazardOptions());
      \u0275\u0275advance(2);
      \u0275\u0275conditional((tmp_13_0 = ctx.profileError()) ? 35 : ctx.loadingProfile() ? 36 : 37, tmp_13_0);
      \u0275\u0275advance(21);
      \u0275\u0275repeater(ctx.addable());
      \u0275\u0275advance(3);
      \u0275\u0275property("disabled", ctx.selected().length === 0);
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" Add ", ctx.selected().length || "", " variable(s) and set weights \u2192 ");
      \u0275\u0275advance(4);
      \u0275\u0275conditional(ctx.pending().length ? 64 : -1);
      \u0275\u0275advance(5);
      \u0275\u0275property("ngModel", ctx.catalogQuery());
      \u0275\u0275control();
      \u0275\u0275advance(4);
      \u0275\u0275property("ngModel", ctx.catalogDomain());
      \u0275\u0275control();
      \u0275\u0275advance(9);
      \u0275\u0275conditional((tmp_22_0 = ctx.catalogError()) ? 82 : -1, tmp_22_0);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate2("", ctx.catalog().length, " variable(s)", ctx.catalogBusy() ? " \xB7 loading\u2026" : "");
      \u0275\u0275advance(7);
      \u0275\u0275property("ngModel", ctx.newVar().code);
      \u0275\u0275control();
      \u0275\u0275advance(4);
      \u0275\u0275property("ngModel", ctx.newVar().name);
      \u0275\u0275control();
      \u0275\u0275advance(4);
      \u0275\u0275property("ngModel", ctx.newVar().domain);
      \u0275\u0275control();
      \u0275\u0275advance(8);
      \u0275\u0275property("ngModel", ctx.newVar().unit);
      \u0275\u0275control();
      \u0275\u0275advance(3);
      \u0275\u0275conditional((tmp_32_0 = ctx.proposeError()) ? 110 : -1, tmp_32_0);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_33_0 = ctx.proposeMessage()) ? 111 : -1, tmp_33_0);
      \u0275\u0275advance(14);
      \u0275\u0275repeater(ctx.hazards());
      \u0275\u0275advance(6);
      \u0275\u0275property("ngModel", ctx.newHazard().code);
      \u0275\u0275control();
      \u0275\u0275advance(4);
      \u0275\u0275property("ngModel", ctx.newHazard().name);
      \u0275\u0275control();
      \u0275\u0275advance(3);
      \u0275\u0275conditional((tmp_39_0 = ctx.hazardError()) ? 138 : -1, tmp_39_0);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_40_0 = ctx.hazardMessage()) ? 139 : -1, tmp_40_0);
      \u0275\u0275advance(8);
      \u0275\u0275property("ngModel", ctx.userProvince());
      \u0275\u0275control();
      \u0275\u0275advance(3);
      \u0275\u0275repeater(ctx.provinces());
      \u0275\u0275advance(5);
      \u0275\u0275property("ngModel", ctx.userSector());
      \u0275\u0275control();
      \u0275\u0275advance(3);
      \u0275\u0275repeater(ctx.sectors());
      \u0275\u0275advance(2);
      \u0275\u0275conditional((tmp_47_0 = ctx.userError()) ? 160 : -1, tmp_47_0);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_48_0 = ctx.scopeMessage()) ? 161 : -1, tmp_48_0);
      \u0275\u0275advance(17);
      \u0275\u0275repeater(ctx.users());
      \u0275\u0275advance(2);
      \u0275\u0275conditional((tmp_50_0 = ctx.editingUser()) ? 180 : -1, tmp_50_0);
    }
  }, dependencies: [FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, CheckboxControlValueAccessor, SelectControlValueAccessor, NgControlStatus, NgModel, RouterLink], styles: ["\n.am[_ngcontent-%COMP%] {\n  max-width: 68rem;\n  padding: 1rem 1.25rem 3rem;\n}\n.am__back[_ngcontent-%COMP%] {\n  display: inline-block;\n  margin-bottom: 0.6rem;\n  font-size: 0.82rem;\n  color: #1864ab;\n  text-decoration: none;\n}\n.am__back[_ngcontent-%COMP%]:hover {\n  text-decoration: underline;\n}\n.am[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin: 0 0 0.3rem;\n}\n.am__lede[_ngcontent-%COMP%] {\n  margin: 0 0 1.2rem;\n  font-size: 0.88rem;\n  color: #495057;\n  max-width: 54rem;\n}\n.am__section[_ngcontent-%COMP%] {\n  margin: 0 0 2rem;\n  padding: 1rem 0 0;\n  border-top: 1px solid #e9ecef;\n}\n.am__section[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0 0 0.5rem;\n  font-size: 1rem;\n}\n.am__section[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%] {\n  margin: 1rem 0 0.35rem;\n  font-size: 0.86rem;\n}\n.am__row[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem;\n  align-items: flex-end;\n  margin: 0.5rem 0;\n}\n.am__field[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.2rem;\n  font-size: 0.78rem;\n  color: #495057;\n}\n.am__field--grow[_ngcontent-%COMP%] {\n  flex: 1 1 14rem;\n}\n.am__field[_ngcontent-%COMP%]   select[_ngcontent-%COMP%], \n.am__field[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  font: inherit;\n  font-size: 0.85rem;\n  padding: 0.3rem 0.4rem;\n}\n.am__muted[_ngcontent-%COMP%] {\n  color: #868e96;\n  font-size: 0.8rem;\n  margin: 0.35rem 0;\n}\n.am__mono[_ngcontent-%COMP%] {\n  font-family:\n    ui-monospace,\n    SFMono-Regular,\n    Menlo,\n    monospace;\n  font-size: 0.74rem;\n}\n.am__code[_ngcontent-%COMP%] {\n  color: #adb5bd;\n  font-size: 0.7rem;\n  font-family: ui-monospace, monospace;\n}\n.am__chips[_ngcontent-%COMP%] {\n  list-style: none;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.35rem;\n  padding: 0;\n  margin: 0.4rem 0;\n}\n.am__chip[_ngcontent-%COMP%] {\n  font-size: 0.76rem;\n  background: #f1f3f5;\n  border-radius: 3px;\n  padding: 0.18rem 0.45rem;\n}\n.am__chip--hazard[_ngcontent-%COMP%] {\n  background: #e7f5ff;\n}\n.am__scroll[_ngcontent-%COMP%] {\n  max-height: 22rem;\n  overflow: auto;\n  border: 1px solid #dee2e6;\n}\n.am__table[_ngcontent-%COMP%] {\n  border-collapse: collapse;\n  width: 100%;\n  font-size: 0.82rem;\n}\n.am__table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  position: sticky;\n  top: 0;\n  background: #f1f3f5;\n  text-align: left;\n  padding: 0.3rem 0.5rem;\n  border-bottom: 1px solid #dee2e6;\n}\n.am__table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.25rem 0.5rem;\n  border-bottom: 1px solid #f1f3f5;\n  vertical-align: top;\n}\n.am__row--inactive[_ngcontent-%COMP%] {\n  opacity: 0.6;\n}\n.am__roles[_ngcontent-%COMP%] {\n  width: 14rem;\n  font: inherit;\n  font-size: 0.78rem;\n  padding: 0.18rem 0.3rem;\n}\n.am__actions[_ngcontent-%COMP%] {\n  margin: 0.7rem 0;\n}\n.am__primary[_ngcontent-%COMP%] {\n  font: inherit;\n  padding: 0.4rem 0.8rem;\n  background: #1864ab;\n  color: #fff;\n  border: 0;\n  border-radius: 3px;\n  cursor: pointer;\n}\n.am__primary[_ngcontent-%COMP%]:disabled {\n  background: #adb5bd;\n  cursor: default;\n}\n.am__banner[_ngcontent-%COMP%] {\n  margin: 0.5rem 0;\n  padding: 0.45rem 0.6rem;\n  font-size: 0.82rem;\n  background: #f1f3f5;\n}\n.am__banner--error[_ngcontent-%COMP%] {\n  background: #fff0f0;\n  color: #8d1a1e;\n}\n.am__banner--ok[_ngcontent-%COMP%] {\n  background: #ebfbee;\n  color: #2b8a3e;\n}\n.am__pending[_ngcontent-%COMP%] {\n  padding: 0.6rem 0.75rem;\n  background: #fff9db;\n  border: 1px solid #ffe066;\n  margin: 0.5rem 0 1rem;\n}\n.am__pending[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%] {\n  margin-top: 0;\n}\n.am__link[_ngcontent-%COMP%] {\n  background: none;\n  border: 0;\n  padding: 0;\n  font: inherit;\n  font-size: 0.76rem;\n  color: #1864ab;\n  cursor: pointer;\n  text-decoration: underline;\n}\n.am__warn[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.7rem;\n  color: #a15c07;\n  margin-top: 0.15rem;\n}\n.am__editor[_ngcontent-%COMP%] {\n  margin: 1rem 0;\n  padding: 0.8rem 1rem;\n  background: #f8f9fa;\n  border: 1px solid #dee2e6;\n}\n.am__editor[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%] {\n  margin-top: 0;\n}\n.am__chip--grant[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.3rem;\n  background: #e7f5ff;\n}\n.am__chipx[_ngcontent-%COMP%] {\n  background: none;\n  border: 0;\n  cursor: pointer;\n  color: #1864ab;\n  font-size: 0.9rem;\n  line-height: 1;\n  padding: 0 0.1rem;\n}\n.am__check[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.4rem;\n  align-items: center;\n  font-size: 0.82rem;\n  margin: 0.6rem 0;\n}\n.am__roles[_ngcontent-%COMP%] {\n  font: inherit;\n  font-size: 0.78rem;\n  padding: 0.18rem 0.3rem;\n}\n/*# sourceMappingURL=admin-model.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AdminModelComponent, [{
    type: Component,
    args: [{ selector: "app-admin-model", standalone: true, imports: [FormsModule, RouterLink], template: `<div class="am">
  <a routerLink="/import" class="am__back">&larr; Back to import</a>
  <h2>Model administration</h2>
  <p class="am__lede">
    The variables a profile carries, the hazards that exist, and who may write what. Weights are not
    set here &mdash; adding a variable sends you to the weights editor, where the panel decides its
    share and the save is recorded as a new profile version.
  </p>

  <!-- 1 ------------------------------------------------------------------ -->
  <section class="am__section">
    <h3>Variables in a profile</h3>

    <div class="am__row">
      <label class="am__field">
        <span>Province</span>
        <select [ngModel]="province()" name="p" (ngModelChange)="province.set($event); loadProfile()">
          @for (p of provinces(); track p.code) { <option [ngValue]="p.code">{{ p.name }}</option> }
        </select>
      </label>
      <label class="am__field">
        <span>Sector</span>
        <select [ngModel]="sector()" name="s" (ngModelChange)="onSectorChange($event)">
          @for (s of sectors(); track s.code) { <option [ngValue]="s.code">{{ s.name }}</option> }
        </select>
      </label>
      <label class="am__field">
        <span>Subsector</span>
        <select
          [ngModel]="subsector()"
          name="ss"
          [disabled]="subsectorOptions().length === 0"
          (ngModelChange)="subsector.set($event); loadProfile()"
        >
          @for (s of subsectorOptions(); track s.code) { <option [ngValue]="s.code">{{ s.name }}</option> }
        </select>
      </label>
      <label class="am__field">
        <span>Hazard</span>
        <select [ngModel]="hazard()" name="h" (ngModelChange)="hazard.set($event); loadProfile()">
          @for (h of hazardOptions(); track h.code) { <option [ngValue]="h.code">{{ h.name }}</option> }
        </select>
      </label>
    </div>

    @if (profileError(); as e) {
      <p class="am__banner am__banner--error" role="alert">{{ e }}</p>
    } @else if (loadingProfile()) {
      <p class="am__muted">Loading\u2026</p>
    } @else {
      <p class="am__muted">
        {{ profileVariables().length }} variable(s) in this profile
        @if (profileVersion(); as v) { \xB7 version {{ v }} }
      </p>
      <ul class="am__chips">
        @for (v of profileVariables(); track v.code) {
          <li class="am__chip" [class.am__chip--hazard]="v.domain === 'hazard'">
            {{ v.name }} <span class="am__code">{{ v.code }}</span>
          </li>
        }
      </ul>
    }

    <h4>Add a variable</h4>
    <p class="am__muted">
      Only approved (active) variables appear here. Tick what this profile should carry, then set the
      weights &mdash; nothing changes until that new version is saved.
    </p>
    <div class="am__scroll">
      <table class="am__table">
        <thead>
          <tr><th></th><th>Variable</th><th>Code</th><th>Domain</th><th>Used in</th></tr>
        </thead>
        <tbody>
          @for (c of addable(); track c.id) {
            <tr>
              <td>
                <input
                  type="checkbox"
                  [checked]="selected().includes(c.code)"
                  (change)="toggleSelected(c.code)"
                />
              </td>
              <td>{{ c.name }}</td>
              <td class="am__mono">{{ c.code }}</td>
              <td>{{ c.domain }}</td>
              <td>{{ c.usedInProfiles }} profile(s)</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <div class="am__actions">
      <button type="button" class="am__primary" [disabled]="selected().length === 0" (click)="addToProfile()">
        Add {{ selected().length || '' }} variable(s) and set weights &rarr;
      </button>
    </div>
  </section>

  <!-- 2 ------------------------------------------------------------------ -->
  <section class="am__section">
    <h3>Variable catalogue</h3>

    @if (pending().length) {
      <div class="am__pending">
        <h4>{{ pending().length }} awaiting approval</h4>
        <p class="am__muted">
          A code is permanent: values key to it, upload templates carry a column for it, and profiles
          cite it in their audit trail. Approve only what is genuinely a new fact.
        </p>
        <table class="am__table">
          <tbody>
            @for (c of pending(); track c.id) {
              <tr>
                <td>{{ c.name }}</td>
                <td class="am__mono">{{ c.code }}</td>
                <td>{{ c.domain }}</td>
                <td>
                  <button type="button" (click)="setStatus(c, 'active')">Approve</button>
                  <button type="button" (click)="setStatus(c, 'retired')">Reject</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <div class="am__row">
      <label class="am__field am__field--grow">
        <span>Search</span>
        <input
          type="search"
          [ngModel]="catalogQuery()"
          name="cq"
          placeholder="name or code"
          (ngModelChange)="catalogQuery.set($event)"
          (keyup.enter)="searchCatalog()"
        />
      </label>
      <label class="am__field">
        <span>Domain</span>
        <select [ngModel]="catalogDomain()" name="cd" (ngModelChange)="catalogDomain.set($event); searchCatalog()">
          <option value="">Any</option>
          <option value="hazard">Hazard</option>
          <option value="exposure">Exposure</option>
        </select>
      </label>
      <button type="button" (click)="searchCatalog()">Search</button>
    </div>

    @if (catalogError(); as e) {
      <p class="am__banner am__banner--error" role="alert">{{ e }}</p>
    }
    <p class="am__muted">{{ catalog().length }} variable(s){{ catalogBusy() ? ' \xB7 loading\u2026' : '' }}</p>

    <h4>Propose a new variable</h4>
    <div class="am__row">
      <label class="am__field">
        <span>Code</span>
        <input
          [ngModel]="newVar().code"
          name="nvc"
          placeholder="PADDY_EXTENT"
          (ngModelChange)="newVar.set({ ...newVar(), code: $event })"
        />
      </label>
      <label class="am__field am__field--grow">
        <span>Name</span>
        <input
          [ngModel]="newVar().name"
          name="nvn"
          placeholder="Extent of paddy land"
          (ngModelChange)="newVar.set({ ...newVar(), name: $event })"
        />
      </label>
      <label class="am__field">
        <span>Domain</span>
        <select [ngModel]="newVar().domain" name="nvd" (ngModelChange)="newVar.set({ ...newVar(), domain: $event })">
          <option value="exposure">Exposure</option>
          <option value="hazard">Hazard</option>
        </select>
      </label>
      <label class="am__field">
        <span>Unit</span>
        <input
          [ngModel]="newVar().unit"
          name="nvu"
          placeholder="ha"
          (ngModelChange)="newVar.set({ ...newVar(), unit: $event })"
        />
      </label>
      <button type="button" (click)="propose()">Propose</button>
    </div>
    @if (proposeError(); as e) {
      <p class="am__banner am__banner--error" role="alert">{{ e }}</p>
    }
    @if (proposeMessage(); as m) {
      <p class="am__banner am__banner--ok">{{ m }}</p>
    }
  </section>

  <!-- 3 ------------------------------------------------------------------ -->
  <section class="am__section">
    <h3>Hazard types</h3>
    <table class="am__table">
      <thead><tr><th>Hazard</th><th>Code</th><th>Active profiles</th></tr></thead>
      <tbody>
        @for (h of hazards(); track h.id) {
          <tr>
            <td>{{ h.name }}</td>
            <td class="am__mono">{{ h.code }}</td>
            <td>{{ h.profiles }}</td>
          </tr>
        }
      </tbody>
    </table>

    <div class="am__row">
      <label class="am__field">
        <span>Code</span>
        <input
          [ngModel]="newHazard().code"
          name="nhc"
          placeholder="cyclone"
          (ngModelChange)="newHazard.set({ ...newHazard(), code: $event })"
        />
      </label>
      <label class="am__field am__field--grow">
        <span>Name</span>
        <input
          [ngModel]="newHazard().name"
          name="nhn"
          placeholder="Cyclone"
          (ngModelChange)="newHazard.set({ ...newHazard(), name: $event })"
        />
      </label>
      <button type="button" (click)="addHazard()">Add hazard</button>
    </div>
    @if (hazardError(); as e) {
      <p class="am__banner am__banner--error" role="alert">{{ e }}</p>
    }
    @if (hazardMessage(); as m) {
      <p class="am__banner am__banner--ok">{{ m }}</p>
    }
  </section>

  <!-- 4 ------------------------------------------------------------------ -->
  <section class="am__section">
    <h3>People and what they may write</h3>
    <div class="am__row">
      <label class="am__field">
        <span>Province</span>
        <select [ngModel]="userProvince()" name="up" (ngModelChange)="userProvince.set($event); loadUsers()">
          <option value="">All</option>
          @for (p of provinces(); track p.code) { <option [ngValue]="p.name">{{ p.name }}</option> }
        </select>
      </label>
      <label class="am__field">
        <span>Sector</span>
        <select [ngModel]="userSector()" name="us" (ngModelChange)="userSector.set($event); loadUsers()">
          <option value="">All</option>
          @for (s of sectors(); track s.code) { <option [ngValue]="s.name">{{ s.name }}</option> }
        </select>
      </label>
    </div>

    @if (userError(); as e) {
      <p class="am__banner am__banner--error" role="alert">{{ e }}</p>
    }

    @if (scopeMessage(); as m) {
      <p class="am__banner am__banner--ok">{{ m }}</p>
    }

    <div class="am__scroll">
      <table class="am__table">
        <thead>
          <tr><th>Name</th><th>Province</th><th>Sectors they may write</th><th>Climate</th><th>Role</th><th></th></tr>
        </thead>
        <tbody>
          @for (u of users(); track u.id) {
            <tr [class.am__row--inactive]="u.status !== 'active'">
              <td>
                {{ u.fullName }}<br />
                <span class="am__muted">{{ u.email }} &middot; {{ u.status }}</span>
              </td>
              <td>{{ u.province ?? '\u2014' }}</td>
              <td>
                @if (u.scopes.length === 0) {
                  <span class="am__muted">none</span>
                } @else {
                  {{ u.scopes.join('; ') }}
                }
                <br />
                <button type="button" class="am__link" (click)="editSectors(u)">Change sectors</button>
              </td>
              <td>{{ u.mayWriteHazardDomain ? 'yes' : 'no' }}</td>
              <td>
                <select
                  class="am__roles"
                  [ngModel]="roleDraft()[u.id]"
                  [name]="'role' + u.id"
                  (ngModelChange)="onRoleDraft(u.id, $event)"
                >
                  <option value="">\u2014</option>
                  @for (r of roles(); track r.code) {
                    <option [ngValue]="r.code">{{ r.name }}</option>
                  }
                </select>
                @if (wouldDropRoles(u)) {
                  <span class="am__warn" title="This account holds more than one role">
                    holds {{ u.roles.join(', ') }} \u2014 saving keeps only the one chosen
                  </span>
                }
              </td>
              <td><button type="button" (click)="saveRoles(u)">Save role</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Sector grants. The payload replaces the whole set, so the panel shows
         the whole set: what is on screen is what the account ends up with. -->
    @if (editingUser(); as u) {
      <div class="am__editor">
        <h4>Sectors {{ u.fullName }} may write</h4>

        @if (scopeError(); as e) {
          <p class="am__banner am__banner--error" role="alert">{{ e }}</p>
        }

        <ul class="am__chips">
          @for (a of draftAreas(); track areaLabel(a)) {
            <li class="am__chip am__chip--grant">
              {{ areaLabel(a) }}
              <button type="button" class="am__chipx" (click)="removeArea(a)" aria-label="Remove">&times;</button>
            </li>
          }
        </ul>
        @if (draftAreas().length === 0) {
          <p class="am__banner">
            No sectors. Saving now revokes everything this account may write \u2014 which is a valid
            decision, but it is a revocation, not a blank form.
          </p>
        }

        <div class="am__row">
          <label class="am__field">
            <span>Sector</span>
            <select [ngModel]="addSector()" name="as" (ngModelChange)="addSector.set($event); addSubsector.set('')">
              <option value="">Choose\u2026</option>
              @for (a of areaOptions(); track a.code) {
                <option [ngValue]="a.code">{{ a.name }}</option>
              }
            </select>
          </label>
          <label class="am__field">
            <span>Subsector</span>
            <select
              [ngModel]="addSubsector()"
              name="ass"
              [disabled]="!addSector() || addSubsectorOptions().length === 0"
              (ngModelChange)="addSubsector.set($event)"
            >
              <option value="">All subsectors</option>
              @for (sub of addSubsectorOptions(); track sub.code) {
                <option [ngValue]="sub.code">{{ sub.name }}</option>
              }
            </select>
          </label>
          <button type="button" [disabled]="!addSector()" (click)="addArea()">Add</button>
          @if (alreadyWholeSector()) {
            <span class="am__muted">Whole sector already granted \u2014 a subsector adds nothing.</span>
          }
        </div>

        <label class="am__check">
          <input
            type="checkbox"
            [ngModel]="draftHazardDomain()"
            name="hz"
            (ngModelChange)="draftHazardDomain.set($event)"
          />
          May write climate (hazard) variables \u2014 shared by every sector, held centrally
        </label>

        <div class="am__actions">
          <button type="button" class="am__primary" [disabled]="scopeBusy()" (click)="saveSectors()">
            {{ scopeBusy() ? 'Saving\u2026' : 'Save sectors' }}
          </button>
          <button type="button" (click)="cancelSectors()">Cancel</button>
        </div>
      </div>
    }

    <p class="am__muted">
      A whole-sector grant covers every subsector under it. Roles come from the database, so a role
      added there appears here without a code change.
    </p>
  </section>
</div>
`, styles: ["/* src/app/features/admin/admin-model.component.scss */\n.am {\n  max-width: 68rem;\n  padding: 1rem 1.25rem 3rem;\n}\n.am__back {\n  display: inline-block;\n  margin-bottom: 0.6rem;\n  font-size: 0.82rem;\n  color: #1864ab;\n  text-decoration: none;\n}\n.am__back:hover {\n  text-decoration: underline;\n}\n.am h2 {\n  margin: 0 0 0.3rem;\n}\n.am__lede {\n  margin: 0 0 1.2rem;\n  font-size: 0.88rem;\n  color: #495057;\n  max-width: 54rem;\n}\n.am__section {\n  margin: 0 0 2rem;\n  padding: 1rem 0 0;\n  border-top: 1px solid #e9ecef;\n}\n.am__section h3 {\n  margin: 0 0 0.5rem;\n  font-size: 1rem;\n}\n.am__section h4 {\n  margin: 1rem 0 0.35rem;\n  font-size: 0.86rem;\n}\n.am__row {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem;\n  align-items: flex-end;\n  margin: 0.5rem 0;\n}\n.am__field {\n  display: flex;\n  flex-direction: column;\n  gap: 0.2rem;\n  font-size: 0.78rem;\n  color: #495057;\n}\n.am__field--grow {\n  flex: 1 1 14rem;\n}\n.am__field select,\n.am__field input {\n  font: inherit;\n  font-size: 0.85rem;\n  padding: 0.3rem 0.4rem;\n}\n.am__muted {\n  color: #868e96;\n  font-size: 0.8rem;\n  margin: 0.35rem 0;\n}\n.am__mono {\n  font-family:\n    ui-monospace,\n    SFMono-Regular,\n    Menlo,\n    monospace;\n  font-size: 0.74rem;\n}\n.am__code {\n  color: #adb5bd;\n  font-size: 0.7rem;\n  font-family: ui-monospace, monospace;\n}\n.am__chips {\n  list-style: none;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.35rem;\n  padding: 0;\n  margin: 0.4rem 0;\n}\n.am__chip {\n  font-size: 0.76rem;\n  background: #f1f3f5;\n  border-radius: 3px;\n  padding: 0.18rem 0.45rem;\n}\n.am__chip--hazard {\n  background: #e7f5ff;\n}\n.am__scroll {\n  max-height: 22rem;\n  overflow: auto;\n  border: 1px solid #dee2e6;\n}\n.am__table {\n  border-collapse: collapse;\n  width: 100%;\n  font-size: 0.82rem;\n}\n.am__table th {\n  position: sticky;\n  top: 0;\n  background: #f1f3f5;\n  text-align: left;\n  padding: 0.3rem 0.5rem;\n  border-bottom: 1px solid #dee2e6;\n}\n.am__table td {\n  padding: 0.25rem 0.5rem;\n  border-bottom: 1px solid #f1f3f5;\n  vertical-align: top;\n}\n.am__row--inactive {\n  opacity: 0.6;\n}\n.am__roles {\n  width: 14rem;\n  font: inherit;\n  font-size: 0.78rem;\n  padding: 0.18rem 0.3rem;\n}\n.am__actions {\n  margin: 0.7rem 0;\n}\n.am__primary {\n  font: inherit;\n  padding: 0.4rem 0.8rem;\n  background: #1864ab;\n  color: #fff;\n  border: 0;\n  border-radius: 3px;\n  cursor: pointer;\n}\n.am__primary:disabled {\n  background: #adb5bd;\n  cursor: default;\n}\n.am__banner {\n  margin: 0.5rem 0;\n  padding: 0.45rem 0.6rem;\n  font-size: 0.82rem;\n  background: #f1f3f5;\n}\n.am__banner--error {\n  background: #fff0f0;\n  color: #8d1a1e;\n}\n.am__banner--ok {\n  background: #ebfbee;\n  color: #2b8a3e;\n}\n.am__pending {\n  padding: 0.6rem 0.75rem;\n  background: #fff9db;\n  border: 1px solid #ffe066;\n  margin: 0.5rem 0 1rem;\n}\n.am__pending h4 {\n  margin-top: 0;\n}\n.am__link {\n  background: none;\n  border: 0;\n  padding: 0;\n  font: inherit;\n  font-size: 0.76rem;\n  color: #1864ab;\n  cursor: pointer;\n  text-decoration: underline;\n}\n.am__warn {\n  display: block;\n  font-size: 0.7rem;\n  color: #a15c07;\n  margin-top: 0.15rem;\n}\n.am__editor {\n  margin: 1rem 0;\n  padding: 0.8rem 1rem;\n  background: #f8f9fa;\n  border: 1px solid #dee2e6;\n}\n.am__editor h4 {\n  margin-top: 0;\n}\n.am__chip--grant {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.3rem;\n  background: #e7f5ff;\n}\n.am__chipx {\n  background: none;\n  border: 0;\n  cursor: pointer;\n  color: #1864ab;\n  font-size: 0.9rem;\n  line-height: 1;\n  padding: 0 0.1rem;\n}\n.am__check {\n  display: flex;\n  gap: 0.4rem;\n  align-items: center;\n  font-size: 0.82rem;\n  margin: 0.6rem 0;\n}\n.am__roles {\n  font: inherit;\n  font-size: 0.78rem;\n  padding: 0.18rem 0.3rem;\n}\n/*# sourceMappingURL=admin-model.component.css.map */\n"] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AdminModelComponent, { className: "AdminModelComponent", filePath: "src/app/features/admin/admin-model.component.ts", lineNumber: 41 });
})();
export {
  AdminModelComponent
};
//# debugId=bb7b93e6-1fab-509f-a82f-ba3b09c7d352
//# sourceMappingURL=chunk-LR4UULVH.js.map
