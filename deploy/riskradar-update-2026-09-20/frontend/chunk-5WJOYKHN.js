import {
  scopeFromQueryParams,
  scopeToQueryParams
} from "./chunk-WRSNWZSJ.js";
import {
  ApiClientService
} from "./chunk-QBP7AOH4.js";
import {
  ActivatedRoute,
  RouterLink
} from "./chunk-UFWDULIL.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel,
  NumberValueAccessor
} from "./chunk-4UD6LJ7E.js";
import {
  Component,
  __spreadProps,
  __spreadValues,
  computed,
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
  ɵɵtextInterpolate4
} from "./chunk-SAQOEXKZ.js";

// src/app/features/weights/weights-editor.component.ts
var _forTrack0 = ($index, $item) => $item.indicatorCode;
function WeightsEditorComponent_Conditional_5_Template(rf, ctx) {
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
function WeightsEditorComponent_Conditional_6_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("version ", ctx);
  }
}
function WeightsEditorComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 3);
    \u0275\u0275text(1);
    \u0275\u0275conditionalCreate(2, WeightsEditorComponent_Conditional_6_Conditional_2_Template, 2, 1, "span", 6);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_3_0;
    const s_r1 = ctx;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate4(" ", s_r1.sector, "", s_r1.subsector ? " \xB7 " + s_r1.subsector : "", " \xD7 ", s_r1.hazard, " \xB7 ", s_r1.province, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_3_0 = ctx_r1.profileVersion()) ? 2 : -1, tmp_3_0);
  }
}
function WeightsEditorComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 4);
    \u0275\u0275text(1, "Loading current weighting\u2026");
    \u0275\u0275elementEnd();
  }
}
function WeightsEditorComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Could not load weights: ", ctx);
  }
}
function WeightsEditorComponent_Conditional_9_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275textInterpolate1(" \xB7 ", ctx_r1.unresolvedHazard().length, " unresolved ");
  }
}
function WeightsEditorComponent_Conditional_9_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275textInterpolate1(" \xB7 ", ctx_r1.zeroWeightHazard().length, " weighted at 0 ");
  }
}
function WeightsEditorComponent_Conditional_9_For_29_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 20);
    \u0275\u0275text(1, "composite index");
    \u0275\u0275elementEnd();
  }
}
function WeightsEditorComponent_Conditional_9_For_29_Conditional_11_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const row_r5 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275textInterpolate1(' \u2014 "', row_r5.consensusNote, '" ');
  }
}
function WeightsEditorComponent_Conditional_9_For_29_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 23);
    \u0275\u0275text(1);
    \u0275\u0275conditionalCreate(2, WeightsEditorComponent_Conditional_9_For_29_Conditional_11_Conditional_2_Template, 1, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 12);
    \u0275\u0275listener("click", function WeightsEditorComponent_Conditional_9_For_29_Conditional_11_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r6);
      const row_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.reconsider("hazard", row_r5.indicatorCode));
    });
    \u0275\u0275text(4, "Reconsider");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Excluded by ", row_r5.decidedBy, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(row_r5.consensusNote ? 2 : -1);
  }
}
function WeightsEditorComponent_Conditional_9_For_29_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275text(1, "0 is not a valid weight");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "input", 25);
    \u0275\u0275listener("ngModelChange", function WeightsEditorComponent_Conditional_9_For_29_Conditional_12_Template_input_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r7);
      const row_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateNote("hazard", row_r5.indicatorCode, $event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementStart(3, "button", 18);
    \u0275\u0275listener("click", function WeightsEditorComponent_Conditional_9_For_29_Conditional_12_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r7);
      const row_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.exclude("hazard", row_r5.indicatorCode));
    });
    \u0275\u0275text(4, " Exclude ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r5 = \u0275\u0275nextContext().$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", row_r5.consensusNote);
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275property("disabled", !ctx_r1.decidedByName().trim());
  }
}
function WeightsEditorComponent_Conditional_9_For_29_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 25);
    \u0275\u0275listener("ngModelChange", function WeightsEditorComponent_Conditional_9_For_29_Conditional_13_Template_input_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const row_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateNote("hazard", row_r5.indicatorCode, $event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementStart(1, "button", 18);
    \u0275\u0275listener("click", function WeightsEditorComponent_Conditional_9_For_29_Conditional_13_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r8);
      const row_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.exclude("hazard", row_r5.indicatorCode));
    });
    \u0275\u0275text(2, " Exclude ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r5 = \u0275\u0275nextContext().$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngModel", row_r5.consensusNote);
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275property("disabled", !ctx_r1.decidedByName().trim());
  }
}
function WeightsEditorComponent_Conditional_9_For_29_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 22);
    \u0275\u0275text(1, "agreed");
    \u0275\u0275elementEnd();
  }
}
function WeightsEditorComponent_Conditional_9_For_29_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275conditionalCreate(3, WeightsEditorComponent_Conditional_9_For_29_Conditional_3_Template, 2, 0, "span", 20);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "td");
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "td");
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "td")(9, "input", 21);
    \u0275\u0275listener("ngModelChange", function WeightsEditorComponent_Conditional_9_For_29_Template_input_ngModelChange_9_listener($event) {
      const row_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateWeight("hazard", row_r5.indicatorCode, $event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "td");
    \u0275\u0275conditionalCreate(11, WeightsEditorComponent_Conditional_9_For_29_Conditional_11_Template, 5, 2)(12, WeightsEditorComponent_Conditional_9_For_29_Conditional_12_Template, 5, 2)(13, WeightsEditorComponent_Conditional_9_For_29_Conditional_13_Template, 3, 2)(14, WeightsEditorComponent_Conditional_9_For_29_Conditional_14_Template, 2, 0, "span", 22);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const row_r5 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("weights__row--unresolved", row_r5.consensus === null && row_r5.weightPct === null)("weights__row--excluded", row_r5.consensus === "rejected")("weights__row--invalid", ctx_r1.isInvalidZero(row_r5));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", row_r5.indicatorName, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(row_r5.isCompositeHazardIndex ? 3 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r5.unit);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r5.direction);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("weights__weight-input--invalid", ctx_r1.isInvalidZero(row_r5));
    \u0275\u0275property("ngModel", row_r5.weightPct)("disabled", row_r5.consensus === "rejected");
    \u0275\u0275control();
    \u0275\u0275advance(2);
    \u0275\u0275conditional(row_r5.consensus === "rejected" ? 11 : ctx_r1.isInvalidZero(row_r5) ? 12 : row_r5.weightPct === null ? 13 : 14);
  }
}
function WeightsEditorComponent_Conditional_9_Conditional_36_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275textInterpolate1(" \xB7 ", ctx_r1.unresolvedExposure().length, " unresolved ");
  }
}
function WeightsEditorComponent_Conditional_9_Conditional_37_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275textInterpolate1(" \xB7 ", ctx_r1.zeroWeightExposure().length, " weighted at 0 ");
  }
}
function WeightsEditorComponent_Conditional_9_For_55_Conditional_10_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const row_r10 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275textInterpolate1(' \u2014 "', row_r10.consensusNote, '" ');
  }
}
function WeightsEditorComponent_Conditional_9_For_55_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 23);
    \u0275\u0275text(1);
    \u0275\u0275conditionalCreate(2, WeightsEditorComponent_Conditional_9_For_55_Conditional_10_Conditional_2_Template, 1, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 12);
    \u0275\u0275listener("click", function WeightsEditorComponent_Conditional_9_For_55_Conditional_10_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r11);
      const row_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.reconsider("exposure", row_r10.indicatorCode));
    });
    \u0275\u0275text(4, "Reconsider");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Excluded by ", row_r10.decidedBy, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(row_r10.consensusNote ? 2 : -1);
  }
}
function WeightsEditorComponent_Conditional_9_For_55_Conditional_11_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275text(1, "0 is not a valid weight \u2014");
    \u0275\u0275elementEnd();
  }
}
function WeightsEditorComponent_Conditional_9_For_55_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275conditionalCreate(0, WeightsEditorComponent_Conditional_9_For_55_Conditional_11_Conditional_0_Template, 2, 0, "span", 24);
    \u0275\u0275elementStart(1, "input", 25);
    \u0275\u0275listener("ngModelChange", function WeightsEditorComponent_Conditional_9_For_55_Conditional_11_Template_input_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r12);
      const row_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateNote("exposure", row_r10.indicatorCode, $event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementStart(2, "button", 18);
    \u0275\u0275listener("click", function WeightsEditorComponent_Conditional_9_For_55_Conditional_11_Template_button_click_2_listener() {
      \u0275\u0275restoreView(_r12);
      const row_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.exclude("exposure", row_r10.indicatorCode));
    });
    \u0275\u0275text(3, " Exclude ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r10 = \u0275\u0275nextContext().$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(ctx_r1.isInvalidZero(row_r10) ? 0 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("ngModel", row_r10.consensusNote);
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275property("disabled", !ctx_r1.decidedByName().trim());
  }
}
function WeightsEditorComponent_Conditional_9_For_55_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 22);
    \u0275\u0275text(1, "agreed");
    \u0275\u0275elementEnd();
  }
}
function WeightsEditorComponent_Conditional_9_For_55_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "td")(8, "input", 21);
    \u0275\u0275listener("ngModelChange", function WeightsEditorComponent_Conditional_9_For_55_Template_input_ngModelChange_8_listener($event) {
      const row_r10 = \u0275\u0275restoreView(_r9).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateWeight("exposure", row_r10.indicatorCode, $event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "td");
    \u0275\u0275conditionalCreate(10, WeightsEditorComponent_Conditional_9_For_55_Conditional_10_Template, 5, 2)(11, WeightsEditorComponent_Conditional_9_For_55_Conditional_11_Template, 4, 3)(12, WeightsEditorComponent_Conditional_9_For_55_Conditional_12_Template, 2, 0, "span", 22);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const row_r10 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("weights__row--unresolved", row_r10.consensus === null && row_r10.weightPct === null)("weights__row--excluded", row_r10.consensus === "rejected")("weights__row--invalid", ctx_r1.isInvalidZero(row_r10));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r10.indicatorName);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r10.unit);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r10.direction);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("weights__weight-input--invalid", ctx_r1.isInvalidZero(row_r10));
    \u0275\u0275property("ngModel", row_r10.weightPct)("disabled", row_r10.consensus === "rejected");
    \u0275\u0275control();
    \u0275\u0275advance(2);
    \u0275\u0275conditional(row_r10.consensus === "rejected" ? 10 : row_r10.weightPct === null || ctx_r1.isInvalidZero(row_r10) ? 11 : 12);
  }
}
function WeightsEditorComponent_Conditional_9_Conditional_63_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275textInterpolate1(" Still blank: ", ctx_r1.unresolvedNames(), ". Weight each one, or type a name above and Exclude it. ");
  }
}
function WeightsEditorComponent_Conditional_9_Conditional_63_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275textInterpolate1(" Weighted at 0 (not allowed \u2014 the database requires a weight above 0): ", ctx_r1.zeroWeightNames(), ". Give it a real weight, or type a name above and Exclude it instead. ");
  }
}
function WeightsEditorComponent_Conditional_9_Conditional_63_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275text(1, " Both blocks must total exactly 100 from agreed/contested weights, with every row either weighted or explicitly excluded. ");
    \u0275\u0275conditionalCreate(2, WeightsEditorComponent_Conditional_9_Conditional_63_Conditional_2_Template, 1, 1);
    \u0275\u0275conditionalCreate(3, WeightsEditorComponent_Conditional_9_Conditional_63_Conditional_3_Template, 1, 1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r1.unresolvedNames() ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.zeroWeightNames() ? 3 : -1);
  }
}
function WeightsEditorComponent_Conditional_9_Conditional_64_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Save failed: ", ctx);
  }
}
function WeightsEditorComponent_Conditional_9_Conditional_65_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 26);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "a", 27);
    \u0275\u0275text(3, "Continue to import \u2192");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Saved as version ", ctx, ".");
    \u0275\u0275advance();
    \u0275\u0275property("queryParams", ctx_r1.scopeParams());
  }
}
function WeightsEditorComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label", 7)(1, "span");
    \u0275\u0275text(2, "Decided by (required to exclude a variable)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "input", 8);
    \u0275\u0275listener("ngModelChange", function WeightsEditorComponent_Conditional_9_Template_input_ngModelChange_3_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.decidedByName.set($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 9)(5, "div", 10)(6, "h3");
    \u0275\u0275text(7, "Hazard");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "span", 11);
    \u0275\u0275text(9);
    \u0275\u0275conditionalCreate(10, WeightsEditorComponent_Conditional_9_Conditional_10_Template, 1, 1);
    \u0275\u0275conditionalCreate(11, WeightsEditorComponent_Conditional_9_Conditional_11_Template, 1, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "button", 12);
    \u0275\u0275listener("click", function WeightsEditorComponent_Conditional_9_Template_button_click_12_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.distributeRemaining("hazard"));
    });
    \u0275\u0275text(13, "Distribute remaining");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "table", 13)(15, "thead")(16, "tr")(17, "th");
    \u0275\u0275text(18, "Parameter");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "th");
    \u0275\u0275text(20, "Unit");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "th");
    \u0275\u0275text(22, "Direction");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(23, "th");
    \u0275\u0275text(24, "Weight");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "th");
    \u0275\u0275text(26, "Decision");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(27, "tbody");
    \u0275\u0275repeaterCreate(28, WeightsEditorComponent_Conditional_9_For_29_Template, 15, 15, "tr", 14, _forTrack0);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(30, "div", 9)(31, "div", 10)(32, "h3");
    \u0275\u0275text(33, "Exposure");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(34, "span", 11);
    \u0275\u0275text(35);
    \u0275\u0275conditionalCreate(36, WeightsEditorComponent_Conditional_9_Conditional_36_Template, 1, 1);
    \u0275\u0275conditionalCreate(37, WeightsEditorComponent_Conditional_9_Conditional_37_Template, 1, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(38, "button", 12);
    \u0275\u0275listener("click", function WeightsEditorComponent_Conditional_9_Template_button_click_38_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.distributeRemaining("exposure"));
    });
    \u0275\u0275text(39, "Distribute remaining");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(40, "table", 13)(41, "thead")(42, "tr")(43, "th");
    \u0275\u0275text(44, "Parameter");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(45, "th");
    \u0275\u0275text(46, "Unit");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(47, "th");
    \u0275\u0275text(48, "Direction");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(49, "th");
    \u0275\u0275text(50, "Weight");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(51, "th");
    \u0275\u0275text(52, "Decision");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(53, "tbody");
    \u0275\u0275repeaterCreate(54, WeightsEditorComponent_Conditional_9_For_55_Template, 13, 14, "tr", 14, _forTrack0);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(56, "label", 15)(57, "span");
    \u0275\u0275text(58, "Panel note (optional)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(59, "textarea", 16);
    \u0275\u0275listener("ngModelChange", function WeightsEditorComponent_Conditional_9_Template_textarea_ngModelChange_59_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.panelNote.set($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(60, "div", 17)(61, "button", 18);
    \u0275\u0275listener("click", function WeightsEditorComponent_Conditional_9_Template_button_click_61_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.save());
    });
    \u0275\u0275text(62);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(63, WeightsEditorComponent_Conditional_9_Conditional_63_Template, 4, 2, "span", 19);
    \u0275\u0275conditionalCreate(64, WeightsEditorComponent_Conditional_9_Conditional_64_Template, 2, 1, "span", 5);
    \u0275\u0275conditionalCreate(65, WeightsEditorComponent_Conditional_9_Conditional_65_Template, 4, 2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_18_0;
    let tmp_19_0;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", ctx_r1.decidedByName());
    \u0275\u0275control();
    \u0275\u0275advance(5);
    \u0275\u0275classProp("weights__total--bad", ctx_r1.hazardTotal() !== 100 || ctx_r1.unresolvedHazard().length || ctx_r1.zeroWeightHazard().length);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.hazardTotal(), " / 100 ");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.unresolvedHazard().length ? 10 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.zeroWeightHazard().length ? 11 : -1);
    \u0275\u0275advance(17);
    \u0275\u0275repeater(ctx_r1.hazardRows());
    \u0275\u0275advance(6);
    \u0275\u0275classProp("weights__total--bad", ctx_r1.exposureTotal() !== 100 || ctx_r1.unresolvedExposure().length || ctx_r1.zeroWeightExposure().length);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.exposureTotal(), " / 100 ");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.unresolvedExposure().length ? 36 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.zeroWeightExposure().length ? 37 : -1);
    \u0275\u0275advance(17);
    \u0275\u0275repeater(ctx_r1.exposureRows());
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", ctx_r1.panelNote());
    \u0275\u0275control();
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", !ctx_r1.canSave() || ctx_r1.saving());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.saving() ? "Saving\u2026" : "Save (new version)", " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(!ctx_r1.canSave() ? 63 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_18_0 = ctx_r1.saveError()) ? 64 : -1, tmp_18_0);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_19_0 = ctx_r1.savedVersion()) ? 65 : -1, tmp_19_0);
  }
}
function toEditableRows(vars) {
  return (vars ?? []).map((v) => ({
    indicatorCode: v.indicatorCode,
    indicatorName: v.indicatorName,
    unit: v.unit,
    direction: v.relationship === "higher_is_better" ? "-" : "+",
    isCompositeHazardIndex: v.isCompositeIndex,
    weightPct: v.weightPct,
    consensus: v.consensus,
    consensusNote: v.consensusNote,
    decidedBy: v.decidedBy
  }));
}
function round3(n) {
  return Math.round(n * 1e3) / 1e3;
}
function includedTotal(rows) {
  return round3(rows.reduce((sum, r) => sum + (r.consensus !== "rejected" ? r.weightPct ?? 0 : 0), 0));
}
function isResolved(row) {
  return row.consensus === "rejected" || row.weightPct !== null;
}
function hasInvalidZeroWeight(row) {
  return row.consensus !== "rejected" && row.weightPct === 0;
}
var WeightsEditorComponent = class _WeightsEditorComponent {
  route = inject(ActivatedRoute);
  api = inject(ApiClientService);
  /** The scope travels on the URL already, so carrying it onward costs nothing
   * and saves the officer re-picking province, sector, subsector and hazard on
   * the next screen -- which is what they were doing before this existed. */
  scopeParams = computed(
    () => {
      const s = this.scope();
      return s ? __spreadProps(__spreadValues({}, scopeToQueryParams(s)), { from: "weights" }) : {};
    },
    ...ngDevMode ? [{ debugName: "scopeParams" }] : (
      /* istanbul ignore next */
      []
    )
  );
  scope = signal(
    null,
    ...ngDevMode ? [{ debugName: "scope" }] : (
      /* istanbul ignore next */
      []
    )
  );
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
  profileVersion = signal(
    null,
    ...ngDevMode ? [{ debugName: "profileVersion" }] : (
      /* istanbul ignore next */
      []
    )
  );
  hazardRows = signal(
    [],
    ...ngDevMode ? [{ debugName: "hazardRows" }] : (
      /* istanbul ignore next */
      []
    )
  );
  exposureRows = signal(
    [],
    ...ngDevMode ? [{ debugName: "exposureRows" }] : (
      /* istanbul ignore next */
      []
    )
  );
  panelNote = signal(
    "",
    ...ngDevMode ? [{ debugName: "panelNote" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Shared across every exclude action in this session -- see class doc on C6. */
  decidedByName = signal(
    "",
    ...ngDevMode ? [{ debugName: "decidedByName" }] : (
      /* istanbul ignore next */
      []
    )
  );
  hazardTotal = computed(
    () => includedTotal(this.hazardRows()),
    ...ngDevMode ? [{ debugName: "hazardTotal" }] : (
      /* istanbul ignore next */
      []
    )
  );
  exposureTotal = computed(
    () => includedTotal(this.exposureRows()),
    ...ngDevMode ? [{ debugName: "exposureTotal" }] : (
      /* istanbul ignore next */
      []
    )
  );
  hazardComplete = computed(
    () => this.hazardTotal() === 100 && this.hazardRows().every(isResolved) && !this.hazardRows().some(hasInvalidZeroWeight),
    ...ngDevMode ? [{ debugName: "hazardComplete" }] : (
      /* istanbul ignore next */
      []
    )
  );
  exposureComplete = computed(
    () => this.exposureTotal() === 100 && this.exposureRows().every(isResolved) && !this.exposureRows().some(hasInvalidZeroWeight),
    ...ngDevMode ? [{ debugName: "exposureComplete" }] : (
      /* istanbul ignore next */
      []
    )
  );
  canSave = computed(
    () => this.hazardComplete() && this.exposureComplete(),
    ...ngDevMode ? [{ debugName: "canSave" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Named so the block header doesn't read "100 / 100" (implying ready to
   * save) while a blank row is still silently missing from that total --
   * a weightless row contributes 0 and is invisible to includedTotal(). */
  unresolvedHazard = computed(
    () => this.hazardRows().filter((r) => !isResolved(r)).map((r) => r.indicatorName),
    ...ngDevMode ? [{ debugName: "unresolvedHazard" }] : (
      /* istanbul ignore next */
      []
    )
  );
  unresolvedExposure = computed(
    () => this.exposureRows().filter((r) => !isResolved(r)).map((r) => r.indicatorName),
    ...ngDevMode ? [{ debugName: "unresolvedExposure" }] : (
      /* istanbul ignore next */
      []
    )
  );
  unresolvedNames = computed(
    () => this.unresolvedHazard().concat(this.unresolvedExposure()).join(", "),
    ...ngDevMode ? [{ debugName: "unresolvedNames" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Rows typed as exactly 0 -- invalid, see hasInvalidZeroWeight(). Tracked
   * separately from "unresolved" because these rows are NOT blank; the fix
   * is to exclude or re-weight them, not to fill in a first value. */
  zeroWeightHazard = computed(
    () => this.hazardRows().filter(hasInvalidZeroWeight).map((r) => r.indicatorName),
    ...ngDevMode ? [{ debugName: "zeroWeightHazard" }] : (
      /* istanbul ignore next */
      []
    )
  );
  zeroWeightExposure = computed(
    () => this.exposureRows().filter(hasInvalidZeroWeight).map((r) => r.indicatorName),
    ...ngDevMode ? [{ debugName: "zeroWeightExposure" }] : (
      /* istanbul ignore next */
      []
    )
  );
  zeroWeightNames = computed(
    () => this.zeroWeightHazard().concat(this.zeroWeightExposure()).join(", "),
    ...ngDevMode ? [{ debugName: "zeroWeightNames" }] : (
      /* istanbul ignore next */
      []
    )
  );
  saving = signal(
    false,
    ...ngDevMode ? [{ debugName: "saving" }] : (
      /* istanbul ignore next */
      []
    )
  );
  saveError = signal(
    null,
    ...ngDevMode ? [{ debugName: "saveError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  savedVersion = signal(
    null,
    ...ngDevMode ? [{ debugName: "savedVersion" }] : (
      /* istanbul ignore next */
      []
    )
  );
  constructor() {
    const scope = scopeFromQueryParams(this.route.snapshot.queryParams);
    this.scope.set(scope);
    if (scope) {
      this.load(scope);
    } else {
      this.loading.set(false);
      this.error.set("No profile selected. Go back and choose province, sector, subsector and hazard.");
    }
  }
  /** Variables the admin screen asked to add to this profile, as ?add=A,B.
   * They arrive UNWEIGHTED and therefore unresolved, so the existing "still
   * blank" rule forces the panel to weight or exclude each one before the save
   * button unlocks -- which is the point. Adding a variable is an
   * administrative act; deciding what it is worth is a panel decision, and this
   * keeps the two in their own places while writing one audited version. */
  pendingAdditions = signal(
    [],
    ...ngDevMode ? [{ debugName: "pendingAdditions" }] : (
      /* istanbul ignore next */
      []
    )
  );
  load(scope) {
    this.loading.set(true);
    this.error.set(null);
    const add = String(this.route.snapshot.queryParams["add"] ?? "").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
    this.api.getProfileWeights(scope).subscribe({
      next: (weights) => {
        this.profileVersion.set(weights.profileVersion);
        const hazard = toEditableRows(weights.hazardVariables);
        const exposure = toEditableRows(weights.exposureVariables);
        const already = new Set(hazard.concat(exposure).map((r) => r.indicatorCode));
        const wanted = add.filter((c) => !already.has(c));
        this.hazardRows.set(hazard);
        this.exposureRows.set(exposure);
        this.pendingAdditions.set(wanted);
        if (wanted.length)
          this.appendAdditions(wanted);
        this.panelNote.set(weights.panelNote ?? "");
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
  /** Fetch the catalogue entries for ?add= codes and append them as blank rows.
   * The catalogue is asked for the name, domain and direction rather than the
   * URL carrying them: a link is easy to hand-edit, and a variable that entered
   * a profile under a direction someone typed into a query string would invert
   * a division's score with nothing in the audit trail explaining it. */
  appendAdditions(codes) {
    this.api.getCatalogItems(codes).subscribe({
      next: (items) => {
        const missing = codes.filter((c) => !items.some((i) => i.code === c));
        if (missing.length) {
          this.addNotice.set("Not added \u2014 no active variable with code " + missing.join(", ") + ".");
        }
        const blank = (i) => ({
          indicatorCode: i.code,
          indicatorName: i.name,
          unit: i.unit,
          direction: i.direction === "higher_is_better" ? "-" : "+",
          isCompositeHazardIndex: false,
          weightPct: null,
          consensus: null,
          consensusNote: null,
          decidedBy: null
        });
        const hazard = items.filter((i) => i.domain === "hazard").map(blank);
        const exposure = items.filter((i) => i.domain !== "hazard").map(blank);
        if (hazard.length)
          this.hazardRows.set(this.hazardRows().concat(hazard));
        if (exposure.length)
          this.exposureRows.set(this.exposureRows().concat(exposure));
        if (items.length) {
          this.addNotice.set(items.map((i) => i.name).join(", ") + " added to this profile. Give each one a weight (or exclude it), then save \u2014 the new version is what carries them.");
        }
      },
      error: (err) => this.addNotice.set("Could not load the variables to add: " + err.message)
    });
  }
  addNotice = signal(
    null,
    ...ngDevMode ? [{ debugName: "addNotice" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Template-facing wrapper for hasInvalidZeroWeight() -- see its doc comment. */
  isInvalidZero(row) {
    return hasInvalidZeroWeight(row);
  }
  /** FR-3.4: helps the user reach 100 rather than loosening the rule. Splits the shortfall evenly across undecided rows only -- never across excluded ones. */
  distributeRemaining(block) {
    const rows = block === "hazard" ? this.hazardRows() : this.exposureRows();
    const undecided = rows.filter((r) => r.consensus === null && r.weightPct === null);
    if (undecided.length === 0)
      return;
    const alreadyAssigned = includedTotal(rows);
    const remaining = round3(100 - alreadyAssigned);
    const share = round3(remaining / undecided.length);
    let assignedSoFar = 0;
    const updated = rows.map((r) => {
      if (r.consensus !== null || r.weightPct !== null)
        return r;
      const isLast = undecided.indexOf(r) === undecided.length - 1;
      const value = isLast ? round3(remaining - assignedSoFar) : share;
      assignedSoFar = round3(assignedSoFar + value);
      return __spreadProps(__spreadValues({}, r), { weightPct: value, consensus: "agreed" });
    });
    if (block === "hazard")
      this.hazardRows.set(updated);
    else
      this.exposureRows.set(updated);
  }
  updateWeight(block, code, value) {
    const setter = block === "hazard" ? this.hazardRows : this.exposureRows;
    setter.update((rows) => rows.map((r) => r.indicatorCode === code ? __spreadProps(__spreadValues({}, r), { weightPct: value, consensus: value === null ? null : "agreed" }) : r));
  }
  updateNote(block, code, note) {
    const setter = block === "hazard" ? this.hazardRows : this.exposureRows;
    setter.update((rows) => rows.map((r) => r.indicatorCode === code ? __spreadProps(__spreadValues({}, r), { consensusNote: note || null }) : r));
  }
  exclude(block, code) {
    const name = this.decidedByName().trim();
    if (!name)
      return;
    const setter = block === "hazard" ? this.hazardRows : this.exposureRows;
    setter.update((rows) => rows.map((r) => r.indicatorCode === code ? __spreadProps(__spreadValues({}, r), { weightPct: null, consensus: "rejected", decidedBy: name }) : r));
  }
  /** Reverses an exclude -- back to undecided. Nothing here is a permanent block. */
  reconsider(block, code) {
    const setter = block === "hazard" ? this.hazardRows : this.exposureRows;
    setter.update((rows) => rows.map((r) => r.indicatorCode === code ? __spreadProps(__spreadValues({}, r), { weightPct: null, consensus: null, consensusNote: null, decidedBy: null }) : r));
  }
  toDecisions(rows) {
    return rows.map((r) => ({
      indicatorCode: r.indicatorCode,
      weightPct: r.weightPct,
      consensus: r.consensus,
      consensusNote: r.consensusNote ?? void 0,
      decidedBy: r.decidedBy ?? this.decidedByName().trim()
    }));
  }
  save() {
    const scope = this.scope();
    if (!scope || !this.canSave())
      return;
    this.saving.set(true);
    this.saveError.set(null);
    this.savedVersion.set(null);
    this.api.saveProfileWeights(scope, {
      hazardVariables: this.toDecisions(this.hazardRows()),
      exposureVariables: this.toDecisions(this.exposureRows()),
      panelNote: this.panelNote() || void 0
    }).subscribe({
      next: (weights) => {
        this.profileVersion.set(weights.profileVersion);
        this.savedVersion.set(weights.profileVersion);
        this.saving.set(false);
      },
      error: (err) => {
        this.saveError.set(err.message);
        this.saving.set(false);
      }
    });
  }
  static \u0275fac = function WeightsEditorComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _WeightsEditorComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _WeightsEditorComponent, selectors: [["app-weights-editor"]], decls: 10, vars: 3, consts: [[1, "weights"], ["routerLink", "/import", 1, "weights__back"], ["role", "status", 1, "weights__added"], [1, "weights__scope"], ["role", "status"], ["role", "alert", 1, "weights__error"], [1, "weights__version"], [1, "weights__decider"], ["type", "text", "placeholder", "Officer or expert name", 3, "ngModelChange", "ngModel"], [1, "weights__block"], [1, "weights__block-header"], [1, "weights__total"], ["type", "button", 3, "click"], [1, "weights__table"], [3, "weights__row--unresolved", "weights__row--excluded", "weights__row--invalid"], [1, "weights__note"], ["rows", "2", 3, "ngModelChange", "ngModel"], [1, "weights__save"], ["type", "button", 3, "click", "disabled"], [1, "weights__save-hint"], [1, "weights__badge"], ["type", "number", "step", "0.001", 3, "ngModelChange", "ngModel", "disabled"], [1, "weights__decision"], [1, "weights__decision", "weights__decision--rejected"], [1, "weights__decision", "weights__decision--invalid"], ["type", "text", "placeholder", "Reason (optional)", 1, "weights__note-input", 3, "ngModelChange", "ngModel"], [1, "weights__saved"], ["routerLink", "/import", 1, "weights__next", 3, "queryParams"]], template: function WeightsEditorComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "a", 1);
      \u0275\u0275text(2, "\u2190 Back to Import");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "h2");
      \u0275\u0275text(4, "Profile weights");
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(5, WeightsEditorComponent_Conditional_5_Template, 2, 1, "p", 2);
      \u0275\u0275conditionalCreate(6, WeightsEditorComponent_Conditional_6_Template, 3, 5, "p", 3);
      \u0275\u0275conditionalCreate(7, WeightsEditorComponent_Conditional_7_Template, 2, 0, "p", 4)(8, WeightsEditorComponent_Conditional_8_Template, 2, 1, "p", 5)(9, WeightsEditorComponent_Conditional_9_Template, 66, 17);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_0_0;
      let tmp_1_0;
      let tmp_2_0;
      \u0275\u0275advance(5);
      \u0275\u0275conditional((tmp_0_0 = ctx.addNotice()) ? 5 : -1, tmp_0_0);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_1_0 = ctx.scope()) ? 6 : -1, tmp_1_0);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.loading() ? 7 : (tmp_2_0 = ctx.error()) ? 8 : 9, tmp_2_0);
    }
  }, dependencies: [FormsModule, DefaultValueAccessor, NumberValueAccessor, NgControlStatus, NgModel, RouterLink], styles: ["\n.weights[_ngcontent-%COMP%] {\n  max-width: 860px;\n  margin: 2rem auto;\n  padding: 0 1.5rem;\n}\n.weights__back[_ngcontent-%COMP%] {\n  display: inline-block;\n  margin-bottom: 0.75rem;\n  color: #1971c2;\n  text-decoration: none;\n  font-size: 0.9rem;\n}\n.weights__back[_ngcontent-%COMP%]:hover {\n  text-decoration: underline;\n}\n.weights__scope[_ngcontent-%COMP%] {\n  color: #495057;\n}\n.weights__version[_ngcontent-%COMP%] {\n  margin-left: 0.5rem;\n  padding: 0.1rem 0.4rem;\n  background: #e7f5ff;\n  color: #1971c2;\n  border-radius: 4px;\n  font-size: 0.75rem;\n}\n.weights__error[_ngcontent-%COMP%] {\n  color: #c92a2a;\n}\n.weights__block[_ngcontent-%COMP%] {\n  margin-bottom: 1.5rem;\n}\n.weights__block-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  margin-bottom: 0.5rem;\n}\n.weights__block-header[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0;\n}\n.weights__block-header[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  margin-left: auto;\n  padding: 0.3rem 0.6rem;\n  font-size: 0.8rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  background: #fff;\n  cursor: pointer;\n}\n.weights__total[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: #2f9e44;\n}\n.weights__total--bad[_ngcontent-%COMP%] {\n  color: #c92a2a;\n}\n.weights__table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.875rem;\n}\n.weights__table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.weights__table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  text-align: left;\n  padding: 0.4rem 0.5rem;\n  border-bottom: 1px solid #f1f3f5;\n}\n.weights__table[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  width: 6rem;\n  padding: 0.25rem 0.4rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n}\n.weights__table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  padding: 0.2rem 0.5rem;\n  font-size: 0.75rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  background: #fff;\n  cursor: pointer;\n}\n.weights__table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:disabled {\n  color: #adb5bd;\n  cursor: not-allowed;\n}\n.weights__decider[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.8125rem;\n  color: #495057;\n  max-width: 20rem;\n  margin-bottom: 1rem;\n}\n.weights__decider[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  padding: 0.4rem 0.5rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-size: 0.875rem;\n}\n.weights__held[_ngcontent-%COMP%] {\n  padding: 0.5rem 0.75rem;\n  background: #fff3bf;\n  color: #664d03;\n  border-radius: 4px;\n  font-size: 0.8125rem;\n  margin: 0 0 0.5rem;\n}\n.weights__row--unresolved[_ngcontent-%COMP%] {\n  background: #fff9db;\n}\n.weights__row--excluded[_ngcontent-%COMP%] {\n  background: #f1f3f5;\n  color: #868e96;\n}\n.weights__row--invalid[_ngcontent-%COMP%] {\n  background: #fff5f5;\n}\n.weights__weight-input--invalid[_ngcontent-%COMP%] {\n  border-color: #c92a2a !important;\n  background: #fff5f5;\n}\n.weights__decision--invalid[_ngcontent-%COMP%] {\n  color: #c92a2a;\n  margin-right: 0.4rem;\n}\n.weights__decision-hint[_ngcontent-%COMP%] {\n  color: #c92a2a;\n  font-size: 0.75rem;\n  font-style: italic;\n}\n.weights__badge[_ngcontent-%COMP%] {\n  margin-left: 0.4rem;\n  padding: 0.05rem 0.35rem;\n  background: #e7f5ff;\n  color: #1971c2;\n  border-radius: 3px;\n  font-size: 0.6875rem;\n  text-transform: uppercase;\n}\n.weights__note-input[_ngcontent-%COMP%] {\n  width: 9rem;\n  padding: 0.25rem 0.4rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-size: 0.8125rem;\n  margin-right: 0.4rem;\n}\n.weights__decision[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: #495057;\n}\n.weights__decision--rejected[_ngcontent-%COMP%] {\n  color: #862e2e;\n  margin-right: 0.4rem;\n}\n.weights__decision--held[_ngcontent-%COMP%] {\n  color: #664d03;\n  font-style: italic;\n}\n.weights__note[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.875rem;\n  margin-bottom: 1rem;\n}\n.weights__note[_ngcontent-%COMP%]   textarea[_ngcontent-%COMP%] {\n  padding: 0.4rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-family: inherit;\n}\n.weights__save[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n.weights__save[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  padding: 0.5rem 1.25rem;\n  border: none;\n  border-radius: 4px;\n  background: #1c3d5a;\n  color: #fff;\n  cursor: pointer;\n}\n.weights__save[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:disabled {\n  background: #ced4da;\n  cursor: not-allowed;\n}\n.weights__save-hint[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: #868e96;\n}\n.weights__saved[_ngcontent-%COMP%] {\n  color: #2f9e44;\n  font-size: 0.875rem;\n}\n.weights__next[_ngcontent-%COMP%] {\n  margin-left: 0.75rem;\n  font-weight: 600;\n  color: #1864ab;\n  text-decoration: none;\n}\n.weights__next[_ngcontent-%COMP%]:hover {\n  text-decoration: underline;\n}\n.weights__added[_ngcontent-%COMP%] {\n  margin: 0.4rem 0 0.8rem;\n  padding: 0.45rem 0.6rem;\n  background: #e7f5ff;\n  border-left: 3px solid #4dabf7;\n  font-size: 0.84rem;\n  color: #1864ab;\n}\n/*# sourceMappingURL=weights-editor.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(WeightsEditorComponent, [{
    type: Component,
    args: [{ selector: "app-weights-editor", standalone: true, imports: [FormsModule, RouterLink], template: `<div class="weights">
  <a routerLink="/import" class="weights__back">&larr; Back to Import</a>
  <h2>Profile weights</h2>

  @if (addNotice(); as m) {
    <p class="weights__added" role="status">{{ m }}</p>
  }

  @if (scope(); as s) {
    <p class="weights__scope">
      {{ s.sector }}{{ s.subsector ? ' \xB7 ' + s.subsector : '' }} \xD7 {{ s.hazard }} \xB7 {{ s.province }}
      @if (profileVersion(); as v) {
        <span class="weights__version">version {{ v }}</span>
      }
    </p>
  }

  @if (loading()) {
    <p role="status">Loading current weighting\u2026</p>
  } @else if (error(); as message) {
    <p class="weights__error" role="alert">Could not load weights: {{ message }}</p>
  } @else {
    <label class="weights__decider">
      <span>Decided by (required to exclude a variable)</span>
      <input type="text" [ngModel]="decidedByName()" (ngModelChange)="decidedByName.set($event)" placeholder="Officer or expert name" />
    </label>

    <div class="weights__block">
      <div class="weights__block-header">
        <h3>Hazard</h3>
        <span class="weights__total" [class.weights__total--bad]="hazardTotal() !== 100 || unresolvedHazard().length || zeroWeightHazard().length">
          {{ hazardTotal() }} / 100
          @if (unresolvedHazard().length) {
            &middot; {{ unresolvedHazard().length }} unresolved
          }
          @if (zeroWeightHazard().length) {
            &middot; {{ zeroWeightHazard().length }} weighted at 0
          }
        </span>
        <button type="button" (click)="distributeRemaining('hazard')">Distribute remaining</button>
      </div>

      <table class="weights__table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Unit</th>
            <th>Direction</th>
            <th>Weight</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          @for (row of hazardRows(); track row.indicatorCode) {
            <tr [class.weights__row--unresolved]="row.consensus === null && row.weightPct === null" [class.weights__row--excluded]="row.consensus === 'rejected'" [class.weights__row--invalid]="isInvalidZero(row)">
              <td>
                {{ row.indicatorName }}
                @if (row.isCompositeHazardIndex) {
                  <span class="weights__badge">composite index</span>
                }
              </td>
              <td>{{ row.unit }}</td>
              <td>{{ row.direction }}</td>
              <td>
                <input
                  type="number"
                  step="0.001"
                  [ngModel]="row.weightPct"
                  [disabled]="row.consensus === 'rejected'"
                  [class.weights__weight-input--invalid]="isInvalidZero(row)"
                  (ngModelChange)="updateWeight('hazard', row.indicatorCode, $event)"
                />
              </td>
              <td>
                @if (row.consensus === 'rejected') {
                  <span class="weights__decision weights__decision--rejected">
                    Excluded by {{ row.decidedBy }}
                    @if (row.consensusNote) { \u2014 "{{ row.consensusNote }}" }
                  </span>
                  <button type="button" (click)="reconsider('hazard', row.indicatorCode)">Reconsider</button>
                } @else if (isInvalidZero(row)) {
                  <span class="weights__decision weights__decision--invalid">0 is not a valid weight</span>
                  <input
                    type="text"
                    class="weights__note-input"
                    placeholder="Reason (optional)"
                    [ngModel]="row.consensusNote"
                    (ngModelChange)="updateNote('hazard', row.indicatorCode, $event)"
                  />
                  <button type="button" [disabled]="!decidedByName().trim()" (click)="exclude('hazard', row.indicatorCode)">
                    Exclude
                  </button>
                } @else if (row.weightPct === null) {
                  <input
                    type="text"
                    class="weights__note-input"
                    placeholder="Reason (optional)"
                    [ngModel]="row.consensusNote"
                    (ngModelChange)="updateNote('hazard', row.indicatorCode, $event)"
                  />
                  <button type="button" [disabled]="!decidedByName().trim()" (click)="exclude('hazard', row.indicatorCode)">
                    Exclude
                  </button>
                } @else {
                  <span class="weights__decision">agreed</span>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="weights__block">
      <div class="weights__block-header">
        <h3>Exposure</h3>
        <span class="weights__total" [class.weights__total--bad]="exposureTotal() !== 100 || unresolvedExposure().length || zeroWeightExposure().length">
          {{ exposureTotal() }} / 100
          @if (unresolvedExposure().length) {
            &middot; {{ unresolvedExposure().length }} unresolved
          }
          @if (zeroWeightExposure().length) {
            &middot; {{ zeroWeightExposure().length }} weighted at 0
          }
        </span>
        <button type="button" (click)="distributeRemaining('exposure')">Distribute remaining</button>
      </div>
      <table class="weights__table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Unit</th>
            <th>Direction</th>
            <th>Weight</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          @for (row of exposureRows(); track row.indicatorCode) {
            <tr [class.weights__row--unresolved]="row.consensus === null && row.weightPct === null" [class.weights__row--excluded]="row.consensus === 'rejected'" [class.weights__row--invalid]="isInvalidZero(row)">
              <td>{{ row.indicatorName }}</td>
              <td>{{ row.unit }}</td>
              <td>{{ row.direction }}</td>
              <td>
                <input
                  type="number"
                  step="0.001"
                  [ngModel]="row.weightPct"
                  [disabled]="row.consensus === 'rejected'"
                  [class.weights__weight-input--invalid]="isInvalidZero(row)"
                  (ngModelChange)="updateWeight('exposure', row.indicatorCode, $event)"
                />
              </td>
              <td>
                @if (row.consensus === 'rejected') {
                  <span class="weights__decision weights__decision--rejected">
                    Excluded by {{ row.decidedBy }}
                    @if (row.consensusNote) { \u2014 "{{ row.consensusNote }}" }
                  </span>
                  <button type="button" (click)="reconsider('exposure', row.indicatorCode)">Reconsider</button>
                } @else if (row.weightPct === null || isInvalidZero(row)) {
                  @if (isInvalidZero(row)) {
                    <span class="weights__decision weights__decision--invalid">0 is not a valid weight \u2014</span>
                  }
                  <input
                    type="text"
                    class="weights__note-input"
                    placeholder="Reason (optional)"
                    [ngModel]="row.consensusNote"
                    (ngModelChange)="updateNote('exposure', row.indicatorCode, $event)"
                  />
                  <button type="button" [disabled]="!decidedByName().trim()" (click)="exclude('exposure', row.indicatorCode)">
                    Exclude
                  </button>
                } @else {
                  <span class="weights__decision">agreed</span>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <label class="weights__note">
      <span>Panel note (optional)</span>
      <textarea [ngModel]="panelNote()" (ngModelChange)="panelNote.set($event)" rows="2"></textarea>
    </label>

    <div class="weights__save">
      <button type="button" [disabled]="!canSave() || saving()" (click)="save()">
        {{ saving() ? 'Saving\u2026' : 'Save (new version)' }}
      </button>
      @if (!canSave()) {
        <span class="weights__save-hint">
          Both blocks must total exactly 100 from agreed/contested weights, with every row either
          weighted or explicitly excluded.
          @if (unresolvedNames()) {
            Still blank: {{ unresolvedNames() }}. Weight each one, or type a name above and Exclude it.
          }
          @if (zeroWeightNames()) {
            Weighted at 0 (not allowed \u2014 the database requires a weight above 0): {{ zeroWeightNames() }}.
            Give it a real weight, or type a name above and Exclude it instead.
          }
        </span>
      }
      @if (saveError(); as message) {
        <span class="weights__error" role="alert">Save failed: {{ message }}</span>
      }
      @if (savedVersion(); as v) {
        <span class="weights__saved">Saved as version {{ v }}.</span>
        <!-- Weights are almost always saved on the way to loading the data they
             will score. Landing back on an empty scope picker made that a
             four-dropdown detour every time. -->
        <a
          class="weights__next"
          routerLink="/import"
          [queryParams]="scopeParams()"
          >Continue to import &rarr;</a
        >
      }
    </div>
  }
</div>
`, styles: ["/* src/app/features/weights/weights-editor.component.scss */\n.weights {\n  max-width: 860px;\n  margin: 2rem auto;\n  padding: 0 1.5rem;\n}\n.weights__back {\n  display: inline-block;\n  margin-bottom: 0.75rem;\n  color: #1971c2;\n  text-decoration: none;\n  font-size: 0.9rem;\n}\n.weights__back:hover {\n  text-decoration: underline;\n}\n.weights__scope {\n  color: #495057;\n}\n.weights__version {\n  margin-left: 0.5rem;\n  padding: 0.1rem 0.4rem;\n  background: #e7f5ff;\n  color: #1971c2;\n  border-radius: 4px;\n  font-size: 0.75rem;\n}\n.weights__error {\n  color: #c92a2a;\n}\n.weights__block {\n  margin-bottom: 1.5rem;\n}\n.weights__block-header {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  margin-bottom: 0.5rem;\n}\n.weights__block-header h3 {\n  margin: 0;\n}\n.weights__block-header button {\n  margin-left: auto;\n  padding: 0.3rem 0.6rem;\n  font-size: 0.8rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  background: #fff;\n  cursor: pointer;\n}\n.weights__total {\n  font-weight: 600;\n  color: #2f9e44;\n}\n.weights__total--bad {\n  color: #c92a2a;\n}\n.weights__table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.875rem;\n}\n.weights__table th,\n.weights__table td {\n  text-align: left;\n  padding: 0.4rem 0.5rem;\n  border-bottom: 1px solid #f1f3f5;\n}\n.weights__table input {\n  width: 6rem;\n  padding: 0.25rem 0.4rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n}\n.weights__table td button {\n  padding: 0.2rem 0.5rem;\n  font-size: 0.75rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  background: #fff;\n  cursor: pointer;\n}\n.weights__table td button:disabled {\n  color: #adb5bd;\n  cursor: not-allowed;\n}\n.weights__decider {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.8125rem;\n  color: #495057;\n  max-width: 20rem;\n  margin-bottom: 1rem;\n}\n.weights__decider input {\n  padding: 0.4rem 0.5rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-size: 0.875rem;\n}\n.weights__held {\n  padding: 0.5rem 0.75rem;\n  background: #fff3bf;\n  color: #664d03;\n  border-radius: 4px;\n  font-size: 0.8125rem;\n  margin: 0 0 0.5rem;\n}\n.weights__row--unresolved {\n  background: #fff9db;\n}\n.weights__row--excluded {\n  background: #f1f3f5;\n  color: #868e96;\n}\n.weights__row--invalid {\n  background: #fff5f5;\n}\n.weights__weight-input--invalid {\n  border-color: #c92a2a !important;\n  background: #fff5f5;\n}\n.weights__decision--invalid {\n  color: #c92a2a;\n  margin-right: 0.4rem;\n}\n.weights__decision-hint {\n  color: #c92a2a;\n  font-size: 0.75rem;\n  font-style: italic;\n}\n.weights__badge {\n  margin-left: 0.4rem;\n  padding: 0.05rem 0.35rem;\n  background: #e7f5ff;\n  color: #1971c2;\n  border-radius: 3px;\n  font-size: 0.6875rem;\n  text-transform: uppercase;\n}\n.weights__note-input {\n  width: 9rem;\n  padding: 0.25rem 0.4rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-size: 0.8125rem;\n  margin-right: 0.4rem;\n}\n.weights__decision {\n  font-size: 0.8125rem;\n  color: #495057;\n}\n.weights__decision--rejected {\n  color: #862e2e;\n  margin-right: 0.4rem;\n}\n.weights__decision--held {\n  color: #664d03;\n  font-style: italic;\n}\n.weights__note {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.875rem;\n  margin-bottom: 1rem;\n}\n.weights__note textarea {\n  padding: 0.4rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-family: inherit;\n}\n.weights__save {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n.weights__save button {\n  padding: 0.5rem 1.25rem;\n  border: none;\n  border-radius: 4px;\n  background: #1c3d5a;\n  color: #fff;\n  cursor: pointer;\n}\n.weights__save button:disabled {\n  background: #ced4da;\n  cursor: not-allowed;\n}\n.weights__save-hint {\n  font-size: 0.8125rem;\n  color: #868e96;\n}\n.weights__saved {\n  color: #2f9e44;\n  font-size: 0.875rem;\n}\n.weights__next {\n  margin-left: 0.75rem;\n  font-weight: 600;\n  color: #1864ab;\n  text-decoration: none;\n}\n.weights__next:hover {\n  text-decoration: underline;\n}\n.weights__added {\n  margin: 0.4rem 0 0.8rem;\n  padding: 0.45rem 0.6rem;\n  background: #e7f5ff;\n  border-left: 3px solid #4dabf7;\n  font-size: 0.84rem;\n  color: #1864ab;\n}\n/*# sourceMappingURL=weights-editor.component.css.map */\n"] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(WeightsEditorComponent, { className: "WeightsEditorComponent", filePath: "src/app/features/weights/weights-editor.component.ts", lineNumber: 103 });
})();
export {
  WeightsEditorComponent
};
//# debugId=eac87c57-dccc-5a62-b907-1754df488aa3
//# sourceMappingURL=chunk-5WJOYKHN.js.map
