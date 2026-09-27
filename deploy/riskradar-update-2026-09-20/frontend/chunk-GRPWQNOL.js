import {
  AuthService
} from "./chunk-KEKSJGJ2.js";
import {
  scopeToQueryParams
} from "./chunk-WRSNWZSJ.js";
import {
  ApiClientService
} from "./chunk-QBP7AOH4.js";
import "./chunk-HN3O3DC2.js";
import {
  TaxonomyService
} from "./chunk-BK36RS6Q.js";
import {
  ActivatedRoute,
  RouterLink
} from "./chunk-UFWDULIL.js";
import {
  CheckboxControlValueAccessor,
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgControlStatusGroup,
  NgForm,
  NgModel,
  NgSelectOption,
  SelectControlValueAccessor,
  ɵNgNoValidate,
  ɵNgSelectMultipleOption
} from "./chunk-4UD6LJ7E.js";
import {
  Component,
  DatePipe,
  HostListener,
  HttpClient,
  Input,
  Output,
  __spreadValues,
  computed,
  effect,
  environment,
  inject,
  input,
  output,
  setClassMetadata,
  signal,
  untracked,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
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
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtextInterpolate4,
  ɵɵtextInterpolate5
} from "./chunk-SAQOEXKZ.js";

// src/app/features/import/weights-confirm.component.ts
var _forTrack0 = ($index, $item) => $item.variableCode;
function WeightsConfirmComponent_Conditional_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 2);
    \u0275\u0275text(1, "Open the weights editor \u2192");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("queryParams", ctx);
  }
}
function WeightsConfirmComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 1);
    \u0275\u0275text(1, " Weights are not stored with an import. They belong to the profile and are versioned there every time they change, so this batch carries values only. ");
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(2, WeightsConfirmComponent_Conditional_1_Conditional_2_Template, 2, 1, "a", 2);
  }
  if (rf & 2) {
    let tmp_1_0;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275conditional((tmp_1_0 = ctx_r0.editorLink()) ? 2 : -1, tmp_1_0);
  }
}
function WeightsConfirmComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 1);
    \u0275\u0275text(1, " This workbook has no WEIGHTS tab, so it proposed no weights. ");
    \u0275\u0275elementEnd();
  }
}
function WeightsConfirmComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 1);
    \u0275\u0275text(1, " The WEIGHTS tab was read but none of its rows match a variable of this profile. ");
    \u0275\u0275elementEnd();
  }
}
function WeightsConfirmComponent_Conditional_4_For_4_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 16);
    \u0275\u0275text(1, "\u2713 totals 100");
    \u0275\u0275elementEnd();
  }
}
function WeightsConfirmComponent_Conditional_4_For_4_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const d_r3 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("\u26A0 ", ctx_r0.unweighted(d_r3), " variable(s) still unweighted");
  }
}
function WeightsConfirmComponent_Conditional_4_For_4_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const d_r3 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("\u26A0 must total 100, not ", ctx_r0.total(d_r3));
  }
}
function WeightsConfirmComponent_Conditional_4_For_4_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 18);
    \u0275\u0275listener("click", function WeightsConfirmComponent_Conditional_4_For_4_Conditional_8_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const d_r3 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.fillEvenly(d_r3));
    });
    \u0275\u0275text(1, " Spread the remainder evenly ");
    \u0275\u0275elementEnd();
  }
}
function WeightsConfirmComponent_Conditional_4_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 13)(1, "span", 14);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 15);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(5, WeightsConfirmComponent_Conditional_4_For_4_Conditional_5_Template, 2, 0, "span", 16)(6, WeightsConfirmComponent_Conditional_4_For_4_Conditional_6_Template, 2, 1, "span", 17)(7, WeightsConfirmComponent_Conditional_4_For_4_Conditional_7_Template, 2, 1, "span", 17);
    \u0275\u0275conditionalCreate(8, WeightsConfirmComponent_Conditional_4_For_4_Conditional_8_Template, 2, 0, "button", 9);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const d_r3 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("wc__total--bad", !ctx_r0.whole(d_r3));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(d_r3);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.total(d_r3));
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r0.whole(d_r3) ? 5 : ctx_r0.unweighted(d_r3) ? 6 : 7);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(ctx_r0.unweighted(d_r3) ? 8 : -1);
  }
}
function WeightsConfirmComponent_Conditional_4_For_6_For_20_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 10);
    \u0275\u0275text(1, "\u26A0 unweighted");
    \u0275\u0275elementEnd();
  }
}
function WeightsConfirmComponent_Conditional_4_For_6_For_20_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const w_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275textInterpolate1(" ", ctx_r0.label(w_r6.status), " ");
  }
}
function WeightsConfirmComponent_Conditional_4_For_6_For_20_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementStart(3, "span", 24);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "td", 25);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "td", 22);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "td", 25);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "td", 22)(12, "input", 26);
    \u0275\u0275listener("change", function WeightsConfirmComponent_Conditional_4_For_6_For_20_Template_input_change_12_listener($event) {
      const w_r6 = \u0275\u0275restoreView(_r5).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.onWeight(w_r6, $event.target.value));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "td", 27);
    \u0275\u0275conditionalCreate(14, WeightsConfirmComponent_Conditional_4_For_6_For_20_Conditional_14_Template, 2, 0, "span", 10)(15, WeightsConfirmComponent_Conditional_4_For_6_For_20_Conditional_15_Template, 1, 1);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const w_r6 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275classMap("wc__row--" + w_r6.status);
    \u0275\u0275classProp("wc__row--blank", ctx_r0.value(w_r6) === null);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", w_r6.variableName ?? w_r6.variableCode, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(w_r6.variableCode);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(w_r6.legacyPct ?? "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(w_r6.currentPct ?? "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(w_r6.proposedPct ?? "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("wc__input--blank", ctx_r0.value(w_r6) === null);
    \u0275\u0275property("value", ctx_r0.value(w_r6));
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r0.value(w_r6) === null ? 14 : 15);
  }
}
function WeightsConfirmComponent_Conditional_4_For_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h4", 19);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 20)(3, "table", 21)(4, "thead")(5, "tr")(6, "th");
    \u0275\u0275text(7, "Variable");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 22);
    \u0275\u0275text(9, "Legacy");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "th", 22);
    \u0275\u0275text(11, "Saved now");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "th", 22);
    \u0275\u0275text(13, "From the file");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "th", 22);
    \u0275\u0275text(15, "Weight %");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "th");
    \u0275\u0275text(17, "Status");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(18, "tbody");
    \u0275\u0275repeaterCreate(19, WeightsConfirmComponent_Conditional_4_For_6_For_20_Template, 16, 13, "tr", 23, _forTrack0);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const d_r7 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(d_r7 === "hazard" ? "Hazard" : "Exposure");
    \u0275\u0275advance(18);
    \u0275\u0275repeater(ctx_r0.rowsFor(d_r7));
  }
}
function WeightsConfirmComponent_Conditional_4_Conditional_7_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const w_r8 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(w_r8.variableCode);
  }
}
function WeightsConfirmComponent_Conditional_4_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "span", 28);
    \u0275\u0275repeaterCreate(3, WeightsConfirmComponent_Conditional_4_Conditional_7_For_4_Template, 2, 1, "span", 24, _forTrack0);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5, " Add the variable to the profile first, then set its weight. ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" \u26A0 ", ctx_r0.unknown().length, " row(s) in the WEIGHTS tab name a variable this profile does not carry, so they cannot be weighted here: ");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r0.unknown());
  }
}
function WeightsConfirmComponent_Conditional_4_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 18);
    \u0275\u0275listener("click", function WeightsConfirmComponent_Conditional_4_Conditional_11_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.reset());
    });
    \u0275\u0275text(1, "Discard my changes");
    \u0275\u0275elementEnd();
  }
}
function WeightsConfirmComponent_Conditional_4_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 10);
    \u0275\u0275text(1, "Pick a province, sector and hazard above to save.");
    \u0275\u0275elementEnd();
  }
}
function WeightsConfirmComponent_Conditional_4_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 10);
    \u0275\u0275text(1, " \u26A0 Not saveable yet \u2014 each domain must total 100 with every variable weighted. ");
    \u0275\u0275elementEnd();
  }
}
function WeightsConfirmComponent_Conditional_4_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 11);
    \u0275\u0275text(1, " Full editor (exclusions, notes, history) \u2192 ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("queryParams", ctx);
  }
}
function WeightsConfirmComponent_Conditional_4_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function WeightsConfirmComponent_Conditional_4_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 12);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" \u2713 Saved as profile version ", ctx, ". The map keeps its current scores until the province is recomputed. ");
  }
}
function WeightsConfirmComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "p", 3);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "ul", 4);
    \u0275\u0275repeaterCreate(3, WeightsConfirmComponent_Conditional_4_For_4_Template, 9, 6, "li", 5, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(5, WeightsConfirmComponent_Conditional_4_For_6_Template, 21, 1, null, null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275conditionalCreate(7, WeightsConfirmComponent_Conditional_4_Conditional_7_Template, 6, 1, "p", 6);
    \u0275\u0275elementStart(8, "div", 7)(9, "button", 8);
    \u0275\u0275listener("click", function WeightsConfirmComponent_Conditional_4_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.save());
    });
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(11, WeightsConfirmComponent_Conditional_4_Conditional_11_Template, 2, 0, "button", 9);
    \u0275\u0275conditionalCreate(12, WeightsConfirmComponent_Conditional_4_Conditional_12_Template, 2, 0, "span", 10)(13, WeightsConfirmComponent_Conditional_4_Conditional_13_Template, 2, 0, "span", 10);
    \u0275\u0275conditionalCreate(14, WeightsConfirmComponent_Conditional_4_Conditional_14_Template, 2, 1, "a", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(15, WeightsConfirmComponent_Conditional_4_Conditional_15_Template, 2, 1, "p", 6);
    \u0275\u0275conditionalCreate(16, WeightsConfirmComponent_Conditional_4_Conditional_16_Template, 2, 1, "p", 12);
  }
  if (rf & 2) {
    let tmp_10_0;
    let tmp_11_0;
    let tmp_12_0;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Type the weights here and save \u2014 this writes through the same audited path as the weights editor, creating a new profile version. The workbook's proposals are filled in for you; ", ctx_r0.wouldChange(), " of them differ from what is saved today. ");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r0.domains());
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r0.domains());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r0.unknown().length ? 7 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", !ctx_r0.canSave() || ctx_r0.saving())("title", ctx_r0.canSave() ? "Writes a new profile version" : "Every domain must total 100 with no variable left unweighted");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.saving() ? "Saving\u2026" : "Save these weights", " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r0.dirty() ? 11 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(!ctx_r0.scope() ? 12 : !ctx_r0.canSave() ? 13 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional((tmp_10_0 = ctx_r0.editorLink()) ? 14 : -1, tmp_10_0);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_11_0 = ctx_r0.saveError()) ? 15 : -1, tmp_11_0);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_12_0 = ctx_r0.savedVersion()) ? 16 : -1, tmp_12_0);
  }
}
var WeightsConfirmComponent = class _WeightsConfirmComponent {
  api = inject(ApiClientService);
  auth = inject(AuthService);
  weights = input.required(
    ...ngDevMode ? [{ debugName: "weights" }] : (
      /* istanbul ignore next */
      []
    )
  );
  tabPresent = input(
    false,
    ...ngDevMode ? [{ debugName: "tabPresent" }] : (
      /* istanbul ignore next */
      []
    )
  );
  scope = input(
    null,
    ...ngDevMode ? [{ debugName: "scope" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** 'import' = a file being checked, whose WEIGHTS tab we just read.
   * 'stored'  = a batch opened from the list; weights are not part of an
   *             import, so the tab explains that rather than being hidden. */
  context = input(
    "import",
    ...ngDevMode ? [{ debugName: "context" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Weights typed here, by variable code. Held apart from the workbook's
   * proposals so "what the file said" survives editing and Reset is a discard
   * rather than a reload. */
  draft = signal(
    {},
    ...ngDevMode ? [{ debugName: "draft" }] : (
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
  editorLink = computed(
    () => {
      const s = this.scope();
      return s ? scopeToQueryParams(s) : null;
    },
    ...ngDevMode ? [{ debugName: "editorLink" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Only variables the profile actually carries can be weighted. */
  rows = computed(
    () => this.weights().filter((w) => w.inProfile),
    ...ngDevMode ? [{ debugName: "rows" }] : (
      /* istanbul ignore next */
      []
    )
  );
  unknown = computed(
    () => this.weights().filter((w) => !w.inProfile),
    ...ngDevMode ? [{ debugName: "unknown" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** The number in play for a variable: what has been typed, else what the
   * workbook proposed, else what is saved. Blank stays blank throughout --
   * an unweighted variable is undecided, and 0 is a different statement. */
  value(w) {
    const d = this.draft()[w.variableCode];
    if (d !== void 0)
      return d;
    return w.proposedPct ?? w.currentPct;
  }
  rowsFor(domain) {
    return domain === "hazard" ? this.rows().filter((w) => w.domain === "hazard") : this.rows().filter((w) => !!w.domain && w.domain !== "hazard");
  }
  total(domain) {
    const t = this.rowsFor(domain).reduce((sum, w) => sum + (this.value(w) ?? 0), 0);
    return Math.round(t * 1e3) / 1e3;
  }
  unweighted(domain) {
    return this.rowsFor(domain).filter((w) => this.value(w) === null).length;
  }
  /** Whole = reaches 100 AND every variable in it carries a number. Nine
   * variables summing to 100 over six of them is not a finished split, and a
   * bare total would hide that. */
  whole(domain) {
    if (this.rowsFor(domain).length === 0)
      return true;
    return Math.abs(this.total(domain) - 100) < 0.01 && this.unweighted(domain) === 0;
  }
  domains = computed(
    () => ["hazard", "exposure"].filter((d) => this.rowsFor(d).length > 0),
    ...ngDevMode ? [{ debugName: "domains" }] : (
      /* istanbul ignore next */
      []
    )
  );
  canSave = computed(
    () => !!this.scope() && this.rows().length > 0 && this.domains().every((d) => this.whole(d)),
    ...ngDevMode ? [{ debugName: "canSave" }] : (
      /* istanbul ignore next */
      []
    )
  );
  dirty = computed(
    () => Object.keys(this.draft()).length > 0,
    ...ngDevMode ? [{ debugName: "dirty" }] : (
      /* istanbul ignore next */
      []
    )
  );
  wouldChange = computed(
    () => this.rows().filter((w) => this.value(w) !== w.currentPct).length,
    ...ngDevMode ? [{ debugName: "wouldChange" }] : (
      /* istanbul ignore next */
      []
    )
  );
  onWeight(w, raw) {
    const next = __spreadValues({}, this.draft());
    const t = raw.trim();
    if (t === "")
      next[w.variableCode] = null;
    else {
      const n = Number(t);
      if (Number.isNaN(n))
        return;
      next[w.variableCode] = n;
    }
    this.draft.set(next);
    this.savedVersion.set(null);
  }
  /** Spread what is left of 100 evenly over the unweighted variables of a
   * domain. A convenience for a first pass, not a policy: an equal split is a
   * decision the panel is making, and they can type over any of it. */
  fillEvenly(domain) {
    const rows = this.rowsFor(domain);
    const blanks = rows.filter((w) => this.value(w) === null);
    if (blanks.length === 0)
      return;
    const used = rows.reduce((s, w) => s + (this.value(w) ?? 0), 0);
    const each = Math.round((100 - used) / blanks.length * 100) / 100;
    if (each <= 0)
      return;
    const next = __spreadValues({}, this.draft());
    for (const w of blanks)
      next[w.variableCode] = each;
    this.draft.set(next);
  }
  reset() {
    this.draft.set({});
    this.saveError.set(null);
    this.savedVersion.set(null);
  }
  label(status) {
    switch (status) {
      case "same":
        return "unchanged";
      case "changed":
        return "differs from saved";
      case "new":
        return "no saved weight yet";
      case "blank":
        return "not proposed";
      default:
        return "not in this profile";
    }
  }
  save() {
    const scope = this.scope();
    if (!scope || !this.canSave())
      return;
    this.saving.set(true);
    this.saveError.set(null);
    const decidedBy = this.auth.currentUser()?.full_name ?? "";
    const decide = (w) => ({
      indicatorCode: w.variableCode,
      weightPct: this.value(w),
      decidedBy,
      // Typing a weight IS the decision to include the variable. Exclusion --
      // 'rejected', a weight of none rather than a weight of zero -- stays in
      // the full editor, where the note and the reasoning belong with it.
      consensus: "agreed"
    });
    this.api.saveProfileWeights(scope, {
      hazardVariables: this.rowsFor("hazard").map(decide),
      exposureVariables: this.rowsFor("exposure").map(decide),
      panelNote: "confirmed from the import review screen"
    }).subscribe({
      next: (weights) => {
        this.savedVersion.set(weights.profileVersion);
        this.draft.set({});
        this.saving.set(false);
      },
      error: (err) => {
        this.saveError.set(err?.message ?? "The weights could not be saved.");
        this.saving.set(false);
      }
    });
  }
  static \u0275fac = function WeightsConfirmComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _WeightsConfirmComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _WeightsConfirmComponent, selectors: [["app-weights-confirm"]], inputs: { weights: [1, "weights"], tabPresent: [1, "tabPresent"], scope: [1, "scope"], context: [1, "context"] }, decls: 5, vars: 1, consts: [[1, "wc"], [1, "wc__note", "wc__note--muted"], ["routerLink", "/weights", 1, "wc__cta", 3, "queryParams"], [1, "wc__lead"], [1, "wc__totals"], [1, "wc__total", 3, "wc__total--bad"], [1, "wc__note", "wc__note--warn"], [1, "wc__actions"], ["type", "button", 1, "wc__cta", 3, "click", "disabled", "title"], ["type", "button", 1, "wc__mini"], [1, "wc__warn"], ["routerLink", "/weights", 1, "wc__link", 3, "queryParams"], [1, "wc__saved"], [1, "wc__total"], [1, "wc__total-dom"], [1, "wc__total-num"], [1, "wc__ok"], [1, "wc__bad"], ["type", "button", 1, "wc__mini", 3, "click"], [1, "wc__h"], [1, "wc__scroll"], [1, "wc__table"], [1, "wc__num"], [3, "class", "wc__row--blank"], [1, "wc__code"], [1, "wc__num", "wc__muted"], ["type", "number", "step", "any", "min", "0", "max", "100", "placeholder", "\u2014", 1, "wc__input", 3, "change", "value"], [1, "wc__status"], [1, "wc__codes"]], template: function WeightsConfirmComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275conditionalCreate(1, WeightsConfirmComponent_Conditional_1_Template, 3, 1)(2, WeightsConfirmComponent_Conditional_2_Template, 2, 0, "p", 1)(3, WeightsConfirmComponent_Conditional_3_Template, 2, 0, "p", 1)(4, WeightsConfirmComponent_Conditional_4_Template, 17, 10);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.context() === "stored" ? 1 : !ctx.tabPresent() && ctx.rows().length === 0 ? 2 : ctx.rows().length === 0 ? 3 : 4);
    }
  }, dependencies: [FormsModule, RouterLink], styles: ["\n.wc[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n}\n.wc__lead[_ngcontent-%COMP%] {\n  margin: 0 0 0.75rem;\n  padding: 0.6rem 0.75rem;\n  background: #e7f5ff;\n  border-left: 3px solid #1c7ed6;\n  border-radius: 0 4px 4px 0;\n  color: #1864ab;\n  line-height: 1.5;\n}\n.wc__totals[_ngcontent-%COMP%] {\n  list-style: none;\n  margin: 0 0 1rem;\n  padding: 0;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.5rem;\n}\n.wc__total[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  align-items: baseline;\n  gap: 0.5rem;\n  padding: 0.5rem 0.75rem;\n  border: 1px solid #dee2e6;\n  border-left: 3px solid #2f9e44;\n  border-radius: 4px;\n  background: #fff;\n}\n.wc__total--bad[_ngcontent-%COMP%] {\n  border-left-color: #e8590c;\n  background: #fff9f5;\n}\n.wc__total-dom[_ngcontent-%COMP%] {\n  font-weight: 600;\n  text-transform: capitalize;\n}\n.wc__total-num[_ngcontent-%COMP%] {\n  font-size: 1.125rem;\n  font-weight: 600;\n  font-variant-numeric: tabular-nums;\n}\n.wc__total-of[_ngcontent-%COMP%], \n.wc__total-cur[_ngcontent-%COMP%] {\n  color: #868e96;\n  font-size: 0.8125rem;\n}\n.wc__ok[_ngcontent-%COMP%] {\n  color: #2f9e44;\n  font-size: 0.8125rem;\n}\n.wc__bad[_ngcontent-%COMP%] {\n  color: #e8590c;\n  font-size: 0.8125rem;\n}\n.wc__h[_ngcontent-%COMP%] {\n  margin: 0.75rem 0 0.375rem;\n  font-size: 0.8125rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.03em;\n  color: #495057;\n}\n.wc__scroll[_ngcontent-%COMP%] {\n  max-height: 22rem;\n  overflow: auto;\n  border: 1px solid #dee2e6;\n  border-radius: 4px;\n  background: #fff;\n}\n.wc__table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.8125rem;\n}\n.wc__table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.wc__table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.3rem 0.6rem;\n  border-bottom: 1px solid #e9ecef;\n  text-align: left;\n}\n.wc__table[_ngcontent-%COMP%]   thead[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  position: sticky;\n  top: 0;\n  background: #f8f9fa;\n  font-weight: 600;\n  color: #495057;\n}\n.wc__num[_ngcontent-%COMP%] {\n  text-align: right;\n  font-variant-numeric: tabular-nums;\n}\n.wc__proposed[_ngcontent-%COMP%] {\n  font-weight: 600;\n}\n.wc__muted[_ngcontent-%COMP%] {\n  color: #adb5bd;\n}\n.wc__code[_ngcontent-%COMP%] {\n  color: #adb5bd;\n  font-size: 0.75rem;\n  margin-left: 0.25rem;\n}\n.wc__codes[_ngcontent-%COMP%]   .wc__code[_ngcontent-%COMP%] {\n  display: inline-block;\n  margin: 0 0.25rem 0 0;\n  color: #495057;\n}\n.wc__status[_ngcontent-%COMP%] {\n  color: #868e96;\n  font-size: 0.75rem;\n}\n.wc__row--changed[_ngcontent-%COMP%] {\n  background: #fff4e6;\n}\n.wc__row--new[_ngcontent-%COMP%] {\n  background: #ebfbee;\n}\n.wc__row--unknown[_ngcontent-%COMP%] {\n  background: #fff5f5;\n}\n.wc__note[_ngcontent-%COMP%] {\n  margin: 0.75rem 0 0;\n  line-height: 1.5;\n}\n.wc__note--muted[_ngcontent-%COMP%] {\n  color: #868e96;\n  font-style: italic;\n}\n.wc__note--warn[_ngcontent-%COMP%] {\n  padding: 0.5rem 0.75rem;\n  background: #fff5f5;\n  border-left: 3px solid #e03131;\n  border-radius: 0 4px 4px 0;\n  color: #c92a2a;\n}\n.wc__cta[_ngcontent-%COMP%] {\n  display: inline-block;\n  margin-top: 0.75rem;\n  padding: 0.45rem 0.9rem;\n  background: #1c7ed6;\n  color: #fff;\n  border-radius: 4px;\n  text-decoration: none;\n  font-weight: 600;\n}\n.wc__cta[_ngcontent-%COMP%]:hover {\n  background: #1864ab;\n}\n.wc__input[_ngcontent-%COMP%] {\n  width: 5.5rem;\n  padding: 0.2rem 0.35rem;\n  border: 1px solid #ced4da;\n  border-radius: 3px;\n  font: inherit;\n  text-align: right;\n  font-variant-numeric: tabular-nums;\n}\n.wc__input--blank[_ngcontent-%COMP%] {\n  border-style: dashed;\n  background: #fffdf5;\n}\n.wc__row--blank[_ngcontent-%COMP%] {\n  background: #fff9db;\n}\n.wc__warn[_ngcontent-%COMP%] {\n  color: #e8590c;\n  font-size: 0.75rem;\n  font-weight: 600;\n}\n.wc__actions[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 0.75rem;\n  margin-top: 0.9rem;\n}\n.wc__cta[disabled][_ngcontent-%COMP%] {\n  background: #ced4da;\n  cursor: not-allowed;\n}\n.wc__mini[_ngcontent-%COMP%] {\n  padding: 0.2rem 0.55rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  background: #fff;\n  color: #495057;\n  font: inherit;\n  font-size: 0.75rem;\n  cursor: pointer;\n}\n.wc__mini[_ngcontent-%COMP%]:hover {\n  background: #f1f3f5;\n}\n.wc__link[_ngcontent-%COMP%] {\n  color: #1c7ed6;\n  font-size: 0.8125rem;\n}\n.wc__saved[_ngcontent-%COMP%] {\n  margin: 0.6rem 0 0;\n  padding: 0.5rem 0.75rem;\n  background: #ebfbee;\n  border-left: 3px solid #2f9e44;\n  border-radius: 0 4px 4px 0;\n  color: #2b8a3e;\n}\n/*# sourceMappingURL=weights-confirm.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(WeightsConfirmComponent, [{
    type: Component,
    args: [{ selector: "app-weights-confirm", standalone: true, imports: [FormsModule, RouterLink], template: `<div class="wc">
  @if (context() === 'stored') {
    <p class="wc__note wc__note--muted">
      Weights are not stored with an import. They belong to the profile and are versioned there
      every time they change, so this batch carries values only.
    </p>
    @if (editorLink(); as qp) {
      <a class="wc__cta" routerLink="/weights" [queryParams]="qp">Open the weights editor \u2192</a>
    }
  } @else if (!tabPresent() && rows().length === 0) {
    <p class="wc__note wc__note--muted">
      This workbook has no WEIGHTS tab, so it proposed no weights.
    </p>
  } @else if (rows().length === 0) {
    <p class="wc__note wc__note--muted">
      The WEIGHTS tab was read but none of its rows match a variable of this profile.
    </p>
  } @else {
    <p class="wc__lead">
      Type the weights here and save \u2014 this writes through the same audited path as the weights
      editor, creating a new profile version. The workbook's proposals are filled in for you;
      {{ wouldChange() }} of them differ from what is saved today.
    </p>

    <ul class="wc__totals">
      @for (d of domains(); track d) {
        <li class="wc__total" [class.wc__total--bad]="!whole(d)">
          <span class="wc__total-dom">{{ d }}</span>
          <span class="wc__total-num">{{ total(d) }}</span>
          @if (whole(d)) {
            <span class="wc__ok">\u2713 totals 100</span>
          } @else if (unweighted(d)) {
            <span class="wc__bad">\u26A0 {{ unweighted(d) }} variable(s) still unweighted</span>
          } @else {
            <span class="wc__bad">\u26A0 must total 100, not {{ total(d) }}</span>
          }
          @if (unweighted(d)) {
            <button type="button" class="wc__mini" (click)="fillEvenly(d)">
              Spread the remainder evenly
            </button>
          }
        </li>
      }
    </ul>

    @for (d of domains(); track d) {
      <h4 class="wc__h">{{ d === 'hazard' ? 'Hazard' : 'Exposure' }}</h4>
      <div class="wc__scroll">
        <table class="wc__table">
          <thead>
            <tr>
              <th>Variable</th>
              <th class="wc__num">Legacy</th>
              <th class="wc__num">Saved now</th>
              <th class="wc__num">From the file</th>
              <th class="wc__num">Weight %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (w of rowsFor(d); track w.variableCode) {
              <tr [class]="'wc__row--' + w.status" [class.wc__row--blank]="value(w) === null">
                <td>
                  {{ w.variableName ?? w.variableCode }}
                  <span class="wc__code">{{ w.variableCode }}</span>
                </td>
                <td class="wc__num wc__muted">{{ w.legacyPct ?? '\u2014' }}</td>
                <td class="wc__num">{{ w.currentPct ?? '\u2014' }}</td>
                <td class="wc__num wc__muted">{{ w.proposedPct ?? '\u2014' }}</td>
                <td class="wc__num">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    class="wc__input"
                    [class.wc__input--blank]="value(w) === null"
                    [value]="value(w)"
                    placeholder="\u2014"
                    (change)="onWeight(w, $any($event.target).value)"
                  />
                </td>
                <td class="wc__status">
                  @if (value(w) === null) {
                    <span class="wc__warn">\u26A0 unweighted</span>
                  } @else {
                    {{ label(w.status) }}
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (unknown().length) {
      <p class="wc__note wc__note--warn">
        \u26A0 {{ unknown().length }} row(s) in the WEIGHTS tab name a variable this profile does not
        carry, so they cannot be weighted here:
        <span class="wc__codes">
          @for (w of unknown(); track w.variableCode) {
            <span class="wc__code">{{ w.variableCode }}</span>
          }
        </span>
        Add the variable to the profile first, then set its weight.
      </p>
    }

    <div class="wc__actions">
      <button
        type="button"
        class="wc__cta"
        [disabled]="!canSave() || saving()"
        (click)="save()"
        [title]="canSave() ? 'Writes a new profile version' : 'Every domain must total 100 with no variable left unweighted'"
      >
        {{ saving() ? 'Saving\u2026' : 'Save these weights' }}
      </button>
      @if (dirty()) {
        <button type="button" class="wc__mini" (click)="reset()">Discard my changes</button>
      }
      @if (!scope()) {
        <span class="wc__warn">Pick a province, sector and hazard above to save.</span>
      } @else if (!canSave()) {
        <span class="wc__warn">
          \u26A0 Not saveable yet \u2014 each domain must total 100 with every variable weighted.
        </span>
      }
      @if (editorLink(); as qp) {
        <a class="wc__link" routerLink="/weights" [queryParams]="qp">
          Full editor (exclusions, notes, history) \u2192
        </a>
      }
    </div>

    @if (saveError(); as m) {
      <p class="wc__note wc__note--warn">{{ m }}</p>
    }
    @if (savedVersion(); as v) {
      <p class="wc__saved">
        \u2713 Saved as profile version {{ v }}. The map keeps its current scores until the province is
        recomputed.
      </p>
    }
  }
</div>
`, styles: ["/* src/app/features/import/weights-confirm.component.scss */\n.wc {\n  font-size: 0.875rem;\n}\n.wc__lead {\n  margin: 0 0 0.75rem;\n  padding: 0.6rem 0.75rem;\n  background: #e7f5ff;\n  border-left: 3px solid #1c7ed6;\n  border-radius: 0 4px 4px 0;\n  color: #1864ab;\n  line-height: 1.5;\n}\n.wc__totals {\n  list-style: none;\n  margin: 0 0 1rem;\n  padding: 0;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.5rem;\n}\n.wc__total {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  align-items: baseline;\n  gap: 0.5rem;\n  padding: 0.5rem 0.75rem;\n  border: 1px solid #dee2e6;\n  border-left: 3px solid #2f9e44;\n  border-radius: 4px;\n  background: #fff;\n}\n.wc__total--bad {\n  border-left-color: #e8590c;\n  background: #fff9f5;\n}\n.wc__total-dom {\n  font-weight: 600;\n  text-transform: capitalize;\n}\n.wc__total-num {\n  font-size: 1.125rem;\n  font-weight: 600;\n  font-variant-numeric: tabular-nums;\n}\n.wc__total-of,\n.wc__total-cur {\n  color: #868e96;\n  font-size: 0.8125rem;\n}\n.wc__ok {\n  color: #2f9e44;\n  font-size: 0.8125rem;\n}\n.wc__bad {\n  color: #e8590c;\n  font-size: 0.8125rem;\n}\n.wc__h {\n  margin: 0.75rem 0 0.375rem;\n  font-size: 0.8125rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.03em;\n  color: #495057;\n}\n.wc__scroll {\n  max-height: 22rem;\n  overflow: auto;\n  border: 1px solid #dee2e6;\n  border-radius: 4px;\n  background: #fff;\n}\n.wc__table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.8125rem;\n}\n.wc__table th,\n.wc__table td {\n  padding: 0.3rem 0.6rem;\n  border-bottom: 1px solid #e9ecef;\n  text-align: left;\n}\n.wc__table thead th {\n  position: sticky;\n  top: 0;\n  background: #f8f9fa;\n  font-weight: 600;\n  color: #495057;\n}\n.wc__num {\n  text-align: right;\n  font-variant-numeric: tabular-nums;\n}\n.wc__proposed {\n  font-weight: 600;\n}\n.wc__muted {\n  color: #adb5bd;\n}\n.wc__code {\n  color: #adb5bd;\n  font-size: 0.75rem;\n  margin-left: 0.25rem;\n}\n.wc__codes .wc__code {\n  display: inline-block;\n  margin: 0 0.25rem 0 0;\n  color: #495057;\n}\n.wc__status {\n  color: #868e96;\n  font-size: 0.75rem;\n}\n.wc__row--changed {\n  background: #fff4e6;\n}\n.wc__row--new {\n  background: #ebfbee;\n}\n.wc__row--unknown {\n  background: #fff5f5;\n}\n.wc__note {\n  margin: 0.75rem 0 0;\n  line-height: 1.5;\n}\n.wc__note--muted {\n  color: #868e96;\n  font-style: italic;\n}\n.wc__note--warn {\n  padding: 0.5rem 0.75rem;\n  background: #fff5f5;\n  border-left: 3px solid #e03131;\n  border-radius: 0 4px 4px 0;\n  color: #c92a2a;\n}\n.wc__cta {\n  display: inline-block;\n  margin-top: 0.75rem;\n  padding: 0.45rem 0.9rem;\n  background: #1c7ed6;\n  color: #fff;\n  border-radius: 4px;\n  text-decoration: none;\n  font-weight: 600;\n}\n.wc__cta:hover {\n  background: #1864ab;\n}\n.wc__input {\n  width: 5.5rem;\n  padding: 0.2rem 0.35rem;\n  border: 1px solid #ced4da;\n  border-radius: 3px;\n  font: inherit;\n  text-align: right;\n  font-variant-numeric: tabular-nums;\n}\n.wc__input--blank {\n  border-style: dashed;\n  background: #fffdf5;\n}\n.wc__row--blank {\n  background: #fff9db;\n}\n.wc__warn {\n  color: #e8590c;\n  font-size: 0.75rem;\n  font-weight: 600;\n}\n.wc__actions {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 0.75rem;\n  margin-top: 0.9rem;\n}\n.wc__cta[disabled] {\n  background: #ced4da;\n  cursor: not-allowed;\n}\n.wc__mini {\n  padding: 0.2rem 0.55rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  background: #fff;\n  color: #495057;\n  font: inherit;\n  font-size: 0.75rem;\n  cursor: pointer;\n}\n.wc__mini:hover {\n  background: #f1f3f5;\n}\n.wc__link {\n  color: #1c7ed6;\n  font-size: 0.8125rem;\n}\n.wc__saved {\n  margin: 0.6rem 0 0;\n  padding: 0.5rem 0.75rem;\n  background: #ebfbee;\n  border-left: 3px solid #2f9e44;\n  border-radius: 0 4px 4px 0;\n  color: #2b8a3e;\n}\n/*# sourceMappingURL=weights-confirm.component.css.map */\n"] }]
  }], null, { weights: [{ type: Input, args: [{ isSignal: true, alias: "weights", required: true }] }], tabPresent: [{ type: Input, args: [{ isSignal: true, alias: "tabPresent", required: false }] }], scope: [{ type: Input, args: [{ isSignal: true, alias: "scope", required: false }] }], context: [{ type: Input, args: [{ isSignal: true, alias: "context", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(WeightsConfirmComponent, { className: "WeightsConfirmComponent", filePath: "src/app/features/import/weights-confirm.component.ts", lineNumber: 47 });
})();

// src/app/features/import/workbook-grid.component.ts
var _c0 = [[["", "weightsPanel", ""]]];
var _c1 = ["[weightsPanel]"];
var _forTrack02 = ($index, $item) => $item.column.code;
var _forTrack1 = ($index, $item) => $item.code;
function WorkbookGridComponent_For_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 6);
    \u0275\u0275listener("click", function WorkbookGridComponent_For_3_Template_button_click_0_listener() {
      const p_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.activeTab.set(p_r2));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("wg__tab--on", ctx_r2.activeTab() === p_r2);
    \u0275\u0275attribute("aria-selected", ctx_r2.activeTab() === p_r2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", p_r2, " ");
  }
}
function WorkbookGridComponent_Conditional_4_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function WorkbookGridComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 7);
    \u0275\u0275listener("click", function WorkbookGridComponent_Conditional_4_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.activeTab.set("WEIGHTS"));
    });
    \u0275\u0275text(1, " WEIGHTS ");
    \u0275\u0275conditionalCreate(2, WorkbookGridComponent_Conditional_4_Conditional_2_Template, 2, 1, "span", 8);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_3_0;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("wg__tab--on", ctx_r2.onWeights());
    \u0275\u0275attribute("aria-selected", ctx_r2.onWeights());
    \u0275\u0275advance(2);
    \u0275\u0275conditional((tmp_3_0 = ctx_r2.weightsBadge()) ? 2 : -1, tmp_3_0);
  }
}
function WorkbookGridComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275projection(1);
    \u0275\u0275elementEnd();
  }
}
function WorkbookGridComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 5);
    \u0275\u0275text(1, "This workbook carried no values.");
    \u0275\u0275elementEnd();
  }
}
function WorkbookGridComponent_Conditional_7_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " \xB7 ");
    \u0275\u0275elementStart(1, "strong", 24);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", ctx_r2.totalMissing(), " empty");
  }
}
function WorkbookGridComponent_Conditional_7_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " \xB7 ");
    \u0275\u0275elementStart(1, "strong", 25);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", ctx_r2.addedCount(), " added here");
  }
}
function WorkbookGridComponent_Conditional_7_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li");
    \u0275\u0275element(1, "span", 26);
    \u0275\u0275text(2, " new");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "li");
    \u0275\u0275element(4, "span", 27);
    \u0275\u0275text(5, " changes what is stored");
    \u0275\u0275elementEnd();
  }
}
function WorkbookGridComponent_Conditional_7_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li");
    \u0275\u0275element(1, "span", 28);
    \u0275\u0275text(2, " added here \u2014 was blank in the file");
    \u0275\u0275elementEnd();
  }
}
function WorkbookGridComponent_Conditional_7_Conditional_23_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Nothing has been imported for ");
    \u0275\u0275elementStart(1, "strong");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.activeTab());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" yet. Upload the workbook's ", ctx_r2.activeTab(), " tab to fill it in. ");
  }
}
function WorkbookGridComponent_Conditional_7_Conditional_23_Conditional_2_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " You can type them straight into the grid below, or check the file if the data was supposed to be in it. ");
  }
}
function WorkbookGridComponent_Conditional_7_Conditional_23_Conditional_2_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " If that period was meant to be filled in, the data has not come through \u2014 check the file before importing. ");
  }
}
function WorkbookGridComponent_Conditional_7_Conditional_23_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " The ");
    \u0275\u0275elementStart(1, "strong");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275text(3, " tab is in this workbook but carried no values at all. ");
    \u0275\u0275conditionalCreate(4, WorkbookGridComponent_Conditional_7_Conditional_23_Conditional_2_Conditional_4_Template, 1, 0)(5, WorkbookGridComponent_Conditional_7_Conditional_23_Conditional_2_Conditional_5_Template, 1, 0);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.activeTab());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r2.allowAdd() && ctx_r2.editable() ? 4 : 5);
  }
}
function WorkbookGridComponent_Conditional_7_Conditional_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 19);
    \u0275\u0275conditionalCreate(1, WorkbookGridComponent_Conditional_7_Conditional_23_Conditional_1_Template, 4, 2)(2, WorkbookGridComponent_Conditional_7_Conditional_23_Conditional_2_Template, 6, 2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.mode() === "stored" ? 1 : 2);
  }
}
function WorkbookGridComponent_Conditional_7_For_31_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 30);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r6 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(c_r6.column.domain);
  }
}
function WorkbookGridComponent_Conditional_7_For_31_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 32);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r6 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("(", c_r6.column.unit, ")");
  }
}
function WorkbookGridComponent_Conditional_7_For_31_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 33);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r6 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("\xBB ", c_r6.column.hint);
  }
}
function WorkbookGridComponent_Conditional_7_For_31_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 34);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.label(c_r6.column.code));
  }
}
function WorkbookGridComponent_Conditional_7_For_31_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 35);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r6 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("title", c_r6.missing + " of " + c_r6.total + " divisions have no value");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" \u26A0 ", c_r6.missing, " empty ");
  }
}
function WorkbookGridComponent_Conditional_7_For_31_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 36);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r6 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", c_r6.changed, " changed");
  }
}
function WorkbookGridComponent_Conditional_7_For_31_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 37);
    \u0275\u0275text(1, "complete");
    \u0275\u0275elementEnd();
  }
}
function WorkbookGridComponent_Conditional_7_For_31_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 29);
    \u0275\u0275conditionalCreate(1, WorkbookGridComponent_Conditional_7_For_31_Conditional_1_Template, 2, 1, "span", 30);
    \u0275\u0275elementStart(2, "span", 31);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(4, WorkbookGridComponent_Conditional_7_For_31_Conditional_4_Template, 2, 1, "span", 32);
    \u0275\u0275conditionalCreate(5, WorkbookGridComponent_Conditional_7_For_31_Conditional_5_Template, 2, 1, "span", 33);
    \u0275\u0275conditionalCreate(6, WorkbookGridComponent_Conditional_7_For_31_Conditional_6_Template, 2, 1, "span", 34);
    \u0275\u0275conditionalCreate(7, WorkbookGridComponent_Conditional_7_For_31_Conditional_7_Template, 2, 2, "span", 35)(8, WorkbookGridComponent_Conditional_7_For_31_Conditional_8_Template, 2, 1, "span", 36)(9, WorkbookGridComponent_Conditional_7_For_31_Conditional_9_Template, 2, 0, "span", 37);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r6 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("wg__colhead--bad", c_r6.missing === c_r6.total && c_r6.total > 0)("wg__colhead--hazard", c_r6.column.domain === "hazard");
    \u0275\u0275property("title", ctx_r2.fullTitle(c_r6.column));
    \u0275\u0275advance();
    \u0275\u0275conditional(c_r6.column.domain ? 1 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(c_r6.column.name);
    \u0275\u0275advance();
    \u0275\u0275conditional(c_r6.column.unit ? 4 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(c_r6.column.hint ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(c_r6.column.name !== c_r6.column.code ? 6 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(c_r6.missing ? 7 : c_r6.changed ? 8 : 9);
  }
}
function WorkbookGridComponent_Conditional_7_For_34_For_6_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 44);
    \u0275\u0275listener("change", function WorkbookGridComponent_Conditional_7_For_34_For_6_Conditional_1_Template_input_change_0_listener($event) {
      \u0275\u0275restoreView(_r7);
      const rc_r8 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.onEdit(rc_r8, $event.target.value));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const rc_r8 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275classProp("wg__input--empty", rc_r8.shown === null);
    \u0275\u0275property("value", rc_r8.shown);
  }
}
function WorkbookGridComponent_Conditional_7_For_34_For_6_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 43);
    \u0275\u0275text(1, "\u2014");
    \u0275\u0275elementEnd();
  }
}
function WorkbookGridComponent_Conditional_7_For_34_For_6_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const rc_r8 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275textInterpolate1(" ", rc_r8.shown, " ");
  }
}
function WorkbookGridComponent_Conditional_7_For_34_For_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 41);
    \u0275\u0275conditionalCreate(1, WorkbookGridComponent_Conditional_7_For_34_For_6_Conditional_1_Template, 1, 3, "input", 42)(2, WorkbookGridComponent_Conditional_7_For_34_For_6_Conditional_2_Template, 2, 0, "span", 43)(3, WorkbookGridComponent_Conditional_7_For_34_For_6_Conditional_3_Template, 1, 1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const rc_r8 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275classMap("wg__cell--" + rc_r8.state);
    \u0275\u0275property("title", rc_r8.title);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.editable() && (rc_r8.cell !== null || ctx_r2.allowAdd()) ? 1 : rc_r8.cell === null ? 2 : 3);
  }
}
function WorkbookGridComponent_Conditional_7_For_34_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "th", 38);
    \u0275\u0275text(2);
    \u0275\u0275elementStart(3, "span", 39);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
    \u0275\u0275repeaterCreate(5, WorkbookGridComponent_Conditional_7_For_34_For_6_Template, 4, 4, "td", 40, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const d_r9 = ctx.$implicit;
    const \u0275$index_151_r10 = ctx.$index;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", d_r9.name, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(d_r9.code);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.grid()[\u0275$index_151_r10]);
  }
}
function WorkbookGridComponent_Conditional_7_Conditional_35_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 5);
    \u0275\u0275text(1, "No division matches that filter.");
    \u0275\u0275elementEnd();
  }
}
function WorkbookGridComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "input", 10);
    \u0275\u0275listener("ngModelChange", function WorkbookGridComponent_Conditional_7_Template_input_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.filter.set($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementStart(2, "label", 11)(3, "input", 12);
    \u0275\u0275listener("ngModelChange", function WorkbookGridComponent_Conditional_7_Template_input_ngModelChange_3_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onlyIssues.set($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275text(4, " Only rows with something to look at ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 13);
    \u0275\u0275text(6);
    \u0275\u0275conditionalCreate(7, WorkbookGridComponent_Conditional_7_Conditional_7_Template, 3, 1);
    \u0275\u0275conditionalCreate(8, WorkbookGridComponent_Conditional_7_Conditional_8_Template, 3, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "label", 11)(10, "input", 14);
    \u0275\u0275listener("ngModelChange", function WorkbookGridComponent_Conditional_7_Template_input_ngModelChange_10_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.compact.set($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275text(11, " Compact ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "button", 15);
    \u0275\u0275listener("click", function WorkbookGridComponent_Conditional_7_Template_button_click_12_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.fullScreen.set(!ctx_r2.fullScreen()));
    });
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "ul", 16)(15, "li");
    \u0275\u0275element(16, "span", 17);
    \u0275\u0275text(17, " empty \u2014 no value in the file");
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(18, WorkbookGridComponent_Conditional_7_Conditional_18_Template, 6, 0);
    \u0275\u0275elementStart(19, "li");
    \u0275\u0275element(20, "span", 18);
    \u0275\u0275text(21, " corrected here");
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(22, WorkbookGridComponent_Conditional_7_Conditional_22_Template, 3, 0, "li");
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(23, WorkbookGridComponent_Conditional_7_Conditional_23_Template, 3, 1, "p", 19);
    \u0275\u0275elementStart(24, "div", 20)(25, "table", 21)(26, "thead")(27, "tr")(28, "th", 22);
    \u0275\u0275text(29, "Division");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(30, WorkbookGridComponent_Conditional_7_For_31_Template, 10, 11, "th", 23, _forTrack02);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(32, "tbody");
    \u0275\u0275repeaterCreate(33, WorkbookGridComponent_Conditional_7_For_34_Template, 7, 2, "tr", null, _forTrack1);
    \u0275\u0275elementEnd()()();
    \u0275\u0275conditionalCreate(35, WorkbookGridComponent_Conditional_7_Conditional_35_Template, 2, 0, "p", 5);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngModel", ctx_r2.filter());
    \u0275\u0275control();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", ctx_r2.onlyIssues());
    \u0275\u0275control();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate4(" ", ctx_r2.divisions().length, " divisions \xD7 ", ctx_r2.variables().length, " variables \xB7 ", ctx_r2.filled(), " of ", ctx_r2.expected(), " cells filled ");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.totalMissing() ? 7 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.addedCount() ? 8 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", ctx_r2.compact());
    \u0275\u0275control();
    \u0275\u0275advance(2);
    \u0275\u0275property("title", ctx_r2.fullScreen() ? "Back to the page (Esc)" : "Fill the screen");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.fullScreen() ? "\u2715 Close full screen" : "\u2922 Full screen", " ");
    \u0275\u0275advance(5);
    \u0275\u0275conditional(ctx_r2.mode() === "preview" ? 18 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275conditional(ctx_r2.allowAdd() ? 22 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.tabIsEmpty() ? 23 : -1);
    \u0275\u0275advance(7);
    \u0275\u0275repeater(ctx_r2.columnIssues());
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r2.visibleDivisions());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r2.visibleDivisions().length === 0 ? 35 : -1);
  }
}
var WorkbookGridComponent = class _WorkbookGridComponent {
  cells = input.required(
    ...ngDevMode ? [{ debugName: "cells" }] : (
      /* istanbul ignore next */
      []
    )
  );
  mode = input(
    "preview",
    ...ngDevMode ? [{ debugName: "mode" }] : (
      /* istanbul ignore next */
      []
    )
  );
  editable = input(
    false,
    ...ngDevMode ? [{ debugName: "editable" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Corrections the parent holds, keyed by `GridCell.key`. */
  edits = input(
    {},
    ...ngDevMode ? [{ debugName: "edits" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Render a WEIGHTS tab alongside the periods; its content is projected. */
  showWeightsTab = input(
    false,
    ...ngDevMode ? [{ debugName: "showWeightsTab" }] : (
      /* istanbul ignore next */
      []
    )
  );
  weightsBadge = input(
    null,
    ...ngDevMode ? [{ debugName: "weightsBadge" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Period tabs that MUST be offered, whether or not they carried values.
   *
   * Deriving the tab strip from the data alone was wrong: a 2026-2030 tab that
   * came through empty simply had no tab, which reads as "that period was fine"
   * when it is the opposite. The file's own tab list is the truth, so the
   * caller passes it and an empty tab renders and says it is empty. */
  tabs = input(
    [],
    ...ngDevMode ? [{ debugName: "tabs" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** The column contract: every variable of the profile, in the profile's own
   * order, with the name and entry rule the template prints. Passing this is
   * what lets a column with no values anywhere still appear -- and an empty
   * column is the one most worth seeing. Falls back to the codes found in the
   * data when not supplied. */
  columns = input(
    [],
    ...ngDevMode ? [{ debugName: "columns" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Every division of the province, so a division whose row is entirely blank
   * still gets a row to type into. */
  allDivisions = input(
    [],
    ...ngDevMode ? [{ debugName: "allDivisions" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Allow typing into a cell the workbook left blank. Preview only: before an
   * import there is a file to add to, afterwards there is only stored data and
   * adding to that belongs on the entry screen. */
  allowAdd = input(
    false,
    ...ngDevMode ? [{ debugName: "allowAdd" }] : (
      /* istanbul ignore next */
      []
    )
  );
  cellEdit = output();
  filter = signal(
    "",
    ...ngDevMode ? [{ debugName: "filter" }] : (
      /* istanbul ignore next */
      []
    )
  );
  onlyIssues = signal(
    false,
    ...ngDevMode ? [{ debugName: "onlyIssues" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Lifts the grid into a fixed overlay filling the viewport. A workbook is
   * 20-odd variables wide and the import page is not; inside the page there is
   * no width to give it. A real second window was the other option and was
   * rejected: it would lose the unsaved corrections held in this component. */
  fullScreen = signal(
    false,
    ...ngDevMode ? [{ debugName: "fullScreen" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Narrower columns and smaller type, to fit more variables on one screen. */
  compact = signal(
    false,
    ...ngDevMode ? [{ debugName: "compact" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** A period tab name, or the literal 'WEIGHTS'. */
  activeTab = signal(
    null,
    ...ngDevMode ? [{ debugName: "activeTab" }] : (
      /* istanbul ignore next */
      []
    )
  );
  periods = computed(
    () => [.../* @__PURE__ */ new Set([...this.tabs(), ...this.cells().map((c) => c.period)])].sort(),
    ...ngDevMode ? [{ debugName: "periods" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** A declared tab that carried nothing. Worth saying out loud. */
  tabIsEmpty = computed(
    () => this.periodCells().length === 0,
    ...ngDevMode ? [{ debugName: "tabIsEmpty" }] : (
      /* istanbul ignore next */
      []
    )
  );
  constructor() {
    effect(() => {
      const tabs = this.periods();
      const weights = this.showWeightsTab();
      const current = untracked(this.activeTab);
      const stillThere = current !== null && (tabs.includes(current) || current === "WEIGHTS" && weights);
      if (!stillThere)
        this.activeTab.set(tabs[0] ?? (weights ? "WEIGHTS" : null));
    });
  }
  onWeights = computed(
    () => this.activeTab() === "WEIGHTS",
    ...ngDevMode ? [{ debugName: "onWeights" }] : (
      /* istanbul ignore next */
      []
    )
  );
  periodCells = computed(
    () => {
      const tab = this.activeTab();
      return this.cells().filter((c) => c.period === tab);
    },
    ...ngDevMode ? [{ debugName: "periodCells" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Columns, in the PROFILE's order when the contract was supplied -- which
   * is the order they sit in the workbook. Sorting alphabetically (what this
   * did before) silently reordered every file relative to the thing it is
   * meant to mirror. Only falls back to sorted codes from the data when no
   * contract came through. */
  variables = computed(
    () => {
      const cols = this.columns();
      if (cols.length)
        return [...cols].sort((a, b) => a.order - b.order);
      return [...new Set(this.periodCells().map((c) => c.variableCode))].sort().map((code, i) => ({ code, name: code, domain: null, unit: null, hint: null, order: i }));
    },
    ...ngDevMode ? [{ debugName: "variables" }] : (
      /* istanbul ignore next */
      []
    )
  );
  variableCodes = computed(
    () => this.variables().map((v) => v.code),
    ...ngDevMode ? [{ debugName: "variableCodes" }] : (
      /* istanbul ignore next */
      []
    )
  );
  divisions = computed(
    () => {
      const all = this.allDivisions();
      if (all.length)
        return [...all].sort((a, b) => a.name.localeCompare(b.name));
      const byCode = /* @__PURE__ */ new Map();
      for (const c of this.periodCells())
        byCode.set(c.dsCode, c.dsName);
      return [...byCode.entries()].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
    },
    ...ngDevMode ? [{ debugName: "divisions" }] : (
      /* istanbul ignore next */
      []
    )
  );
  index = computed(
    () => {
      const m = /* @__PURE__ */ new Map();
      for (const c of this.periodCells())
        m.set(c.dsCode + " " + c.variableCode, c);
      return m;
    },
    ...ngDevMode ? [{ debugName: "index" }] : (
      /* istanbul ignore next */
      []
    )
  );
  state(cell, key) {
    const edited = this.edits()[key];
    if (!cell)
      return edited === void 0 ? "missing" : "added";
    const v = edited ?? cell.value;
    if (!Number.isFinite(v))
      return "invalid";
    if (edited !== void 0)
      return "edited";
    if (this.mode() === "stored")
      return "same";
    if (cell.current === null)
      return "new";
    return cell.current === cell.value ? "same" : "changed";
  }
  /** The key an empty cell would use -- the same (period, division, variable)
   * spelling the parent gives a cell that exists, so an addition and a
   * correction travel the same way. */
  emptyKey(dsCode, variableCode) {
    return this.activeTab() + "|" + dsCode + "|" + variableCode;
  }
  visibleDivisions = computed(
    () => {
      const term = this.filter().trim().toLowerCase();
      const idx = this.index();
      const vars = this.variables();
      return this.divisions().filter((d) => {
        if (term && !(d.name + " " + d.code).toLowerCase().includes(term))
          return false;
        if (!this.onlyIssues())
          return true;
        return vars.some((col) => {
          const key = this.emptyKey(d.code, col.code);
          const s = this.state(idx.get(d.code + " " + col.code) ?? null, key);
          return s === "missing" || s === "changed" || s === "new" || s === "invalid";
        });
      });
    },
    ...ngDevMode ? [{ debugName: "visibleDivisions" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** The whole grid, built once per (data, tab, edits) rather than per cell --
   * a template calling a method per cell rebuilds it on every change-detection
   * pass, which on a 15 x 20 grid is 300 recomputations for one keystroke. */
  grid = computed(
    () => {
      const idx = this.index();
      const vars = this.variables();
      const edits = this.edits();
      return this.visibleDivisions().map((d) => vars.map((col) => {
        const v = col.code;
        const cell = idx.get(d.code + " " + v) ?? null;
        const key = cell ? cell.key : this.emptyKey(d.code, v);
        const state = this.state(cell, key);
        const shown = cell ? edits[key] ?? cell.value : edits[key] ?? null;
        let title = "";
        if (!cell && state === "added")
          title = "added here -- this cell was blank in the workbook";
        else if (!cell)
          title = d.name + " has no value for " + col.name + " in this period";
        else if (state === "changed")
          title = "was " + cell.current + ", will be written as " + shown;
        else if (state === "new")
          title = "new -- nothing in the database for this cell yet";
        else if (state === "edited")
          title = "corrected here from " + cell.value;
        return { cell, state, shown, title, key, dsCode: d.code, variableCode: v };
      }));
    },
    ...ngDevMode ? [{ debugName: "grid" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Per-column issue count. This is the number that makes a shifted column
   * obvious: one variable reading 15 missing out of 15 divisions, while its
   * neighbours read 0, is a column nobody filled in -- or filled in one column
   * to the left. */
  columnIssues = computed(
    () => {
      const idx = this.index();
      const divs = this.divisions();
      const preview = this.mode() === "preview";
      const edits = this.edits();
      return this.variables().map((col) => {
        let missing = 0;
        let changed = 0;
        for (const d of divs) {
          const c = idx.get(d.code + " " + col.code) ?? null;
          if (!c) {
            if (edits[this.emptyKey(d.code, col.code)] === void 0)
              missing++;
          } else if (preview && c.current !== null && c.current !== c.value)
            changed++;
        }
        return { column: col, missing, changed, total: divs.length };
      });
    },
    ...ngDevMode ? [{ debugName: "columnIssues" }] : (
      /* istanbul ignore next */
      []
    )
  );
  totalMissing = computed(
    () => this.columnIssues().reduce((a, c) => a + c.missing, 0),
    ...ngDevMode ? [{ debugName: "totalMissing" }] : (
      /* istanbul ignore next */
      []
    )
  );
  filled = computed(
    () => this.periodCells().length,
    ...ngDevMode ? [{ debugName: "filled" }] : (
      /* istanbul ignore next */
      []
    )
  );
  expected = computed(
    () => this.divisions().length * this.variables().length,
    ...ngDevMode ? [{ debugName: "expected" }] : (
      /* istanbul ignore next */
      []
    )
  );
  addedCount = computed(
    () => {
      const idx = this.index();
      return Object.keys(this.edits()).filter((k) => {
        const p = k.split("|");
        return p[0] === this.activeTab() && !idx.has(p[1] + " " + p[2]);
      }).length;
    },
    ...ngDevMode ? [{ debugName: "addedCount" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Esc leaves full screen. Bound on the host so it works wherever focus is
   * inside the grid, and ignored when not expanded so it never swallows an Esc
   * the rest of the page wanted. */
  onEscape() {
    if (this.fullScreen())
      this.fullScreen.set(false);
  }
  /** One output for both acts. A correction carries the cell it came from; an
   * addition carries the identity of a cell that does not exist yet, which the
   * parent turns into the same (period, division, variable) key. */
  onEdit(rc, raw) {
    this.cellEdit.emit({
      cell: rc.cell,
      raw,
      key: rc.key,
      dsCode: rc.dsCode,
      variableCode: rc.variableCode,
      period: this.activeTab() ?? ""
    });
  }
  /** Column headers show the variable code IN FULL, wrapped over as many lines
   * as it needs, in small type. It used to be truncated at 18 characters with
   * an ellipsis, which defeated the point of the header: the codes differ at
   * the END (..._1974_TO_2004 vs ..._2005_TO_2022), so the truncated forms of
   * two different variables were identical on screen. Small and wrapped beats
   * large and cut off. */
  /** Everything the template's sub-header says, for the cell tooltip. */
  fullTitle(c) {
    const bits = [c.domain ? c.domain + ": " + c.name : c.name];
    if (c.unit)
      bits.push("(" + c.unit + ")");
    if (c.hint)
      bits.push("\xBB " + c.hint);
    bits.push("[" + c.code + "]");
    return bits.join("  ");
  }
  label(code) {
    return code.replace(/_/g, "_\u200B");
  }
  static \u0275fac = function WorkbookGridComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _WorkbookGridComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _WorkbookGridComponent, selectors: [["app-workbook-grid"]], hostBindings: function WorkbookGridComponent_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("keydown.escape", function WorkbookGridComponent_keydown_escape_HostBindingHandler() {
        return ctx.onEscape();
      }, \u0275\u0275resolveDocument);
    }
  }, inputs: { cells: [1, "cells"], mode: [1, "mode"], editable: [1, "editable"], edits: [1, "edits"], showWeightsTab: [1, "showWeightsTab"], weightsBadge: [1, "weightsBadge"], tabs: [1, "tabs"], columns: [1, "columns"], allDivisions: [1, "allDivisions"], allowAdd: [1, "allowAdd"] }, outputs: { cellEdit: "cellEdit" }, ngContentSelectors: _c1, decls: 8, vars: 6, consts: [[1, "wg"], ["role", "tablist", 1, "wg__tabs"], ["type", "button", "role", "tab", 1, "wg__tab", 3, "wg__tab--on"], ["type", "button", "role", "tab", 1, "wg__tab", "wg__tab--weights", 3, "wg__tab--on"], [1, "wg__panel"], [1, "wg__empty"], ["type", "button", "role", "tab", 1, "wg__tab", 3, "click"], ["type", "button", "role", "tab", 1, "wg__tab", "wg__tab--weights", 3, "click"], [1, "wg__badge"], [1, "wg__bar"], ["type", "search", "placeholder", "Find a division\u2026", "name", "wgFilter", 1, "wg__search", 3, "ngModelChange", "ngModel"], [1, "wg__toggle"], ["type", "checkbox", "name", "wgOnlyIssues", 3, "ngModelChange", "ngModel"], [1, "wg__count"], ["type", "checkbox", "name", "wgCompact", 3, "ngModelChange", "ngModel"], ["type", "button", 1, "wg__expand", 3, "click", "title"], [1, "wg__key"], [1, "wg__chip", "wg__chip--missing"], [1, "wg__chip", "wg__chip--edited"], [1, "wg__notice"], [1, "wg__scroll"], [1, "wg__table"], [1, "wg__corner"], [1, "wg__colhead", 3, "wg__colhead--bad", "wg__colhead--hazard", "title"], [1, "wg__count-bad"], [1, "wg__count-add"], [1, "wg__chip", "wg__chip--new"], [1, "wg__chip", "wg__chip--changed"], [1, "wg__chip", "wg__chip--added"], [1, "wg__colhead", 3, "title"], [1, "wg__coldomain"], [1, "wg__colname"], [1, "wg__colunit"], [1, "wg__colhint"], [1, "wg__colcode"], [1, "wg__colissue", 3, "title"], [1, "wg__colissue", "wg__colissue--chg"], [1, "wg__colissue", "wg__colissue--ok"], ["scope", "row", 1, "wg__rowhead"], [1, "wg__code"], [1, "wg__cell", 3, "class", "title"], [1, "wg__cell", 3, "title"], ["type", "number", "step", "any", "placeholder", "\u2014", 1, "wg__input", 3, "wg__input--empty", "value"], ["aria-label", "no value", 1, "wg__blank"], ["type", "number", "step", "any", "placeholder", "\u2014", 1, "wg__input", 3, "change", "value"]], template: function WorkbookGridComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef(_c0);
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
      \u0275\u0275repeaterCreate(2, WorkbookGridComponent_For_3_Template, 2, 4, "button", 2, \u0275\u0275repeaterTrackByIdentity);
      \u0275\u0275conditionalCreate(4, WorkbookGridComponent_Conditional_4_Template, 3, 4, "button", 3);
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(5, WorkbookGridComponent_Conditional_5_Template, 2, 0, "div", 4)(6, WorkbookGridComponent_Conditional_6_Template, 2, 0, "p", 5)(7, WorkbookGridComponent_Conditional_7_Template, 36, 15);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275classProp("wg--full", ctx.fullScreen())("wg--compact", ctx.compact());
      \u0275\u0275advance(2);
      \u0275\u0275repeater(ctx.periods());
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.showWeightsTab() ? 4 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.onWeights() ? 5 : ctx.activeTab() === null ? 6 : 7);
    }
  }, dependencies: [FormsModule, DefaultValueAccessor, CheckboxControlValueAccessor, NgControlStatus, NgModel], styles: ["\n.wg[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n}\n.wg--full[_ngcontent-%COMP%] {\n  position: fixed;\n  inset: 0;\n  z-index: 1000;\n  background: #fff;\n  padding: 1rem 1.25rem;\n  overflow: auto;\n  display: flex;\n  flex-direction: column;\n}\n.wg--full[_ngcontent-%COMP%]   .wg__scroll[_ngcontent-%COMP%] {\n  flex: 1 1 auto;\n  max-height: none;\n}\n.wg__tabs[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.25rem;\n  border-bottom: 2px solid #dee2e6;\n  margin-bottom: 0.75rem;\n}\n.wg__tab[_ngcontent-%COMP%] {\n  padding: 0.4rem 0.9rem;\n  border: 1px solid #dee2e6;\n  border-bottom: none;\n  border-radius: 5px 5px 0 0;\n  background: #f1f3f5;\n  color: #495057;\n  font: inherit;\n  font-weight: 600;\n  cursor: pointer;\n  margin-bottom: -2px;\n}\n.wg__tab[_ngcontent-%COMP%]:hover {\n  background: #e9ecef;\n}\n.wg__tab--on[_ngcontent-%COMP%] {\n  background: #fff;\n  color: #1c7ed6;\n  border-bottom: 2px solid #fff;\n}\n.wg__tab--weights[_ngcontent-%COMP%] {\n  margin-left: 0.5rem;\n}\n.wg__badge[_ngcontent-%COMP%] {\n  display: inline-block;\n  margin-left: 0.375rem;\n  padding: 0 0.4rem;\n  border-radius: 999px;\n  background: #e7f5ff;\n  color: #1864ab;\n  font-size: 0.75rem;\n}\n.wg__bar[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 0.75rem;\n  margin-bottom: 0.5rem;\n}\n.wg__search[_ngcontent-%COMP%] {\n  padding: 0.3rem 0.5rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  min-width: 14rem;\n  font: inherit;\n}\n.wg__toggle[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.375rem;\n  color: #495057;\n}\n.wg__count[_ngcontent-%COMP%] {\n  margin-left: auto;\n  color: #868e96;\n  font-size: 0.8125rem;\n}\n.wg__count-bad[_ngcontent-%COMP%] {\n  color: #c92a2a;\n}\n.wg__key[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.25rem 1rem;\n  list-style: none;\n  margin: 0 0 0.5rem;\n  padding: 0;\n  color: #868e96;\n  font-size: 0.75rem;\n}\n.wg__key[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.375rem;\n}\n.wg__chip[_ngcontent-%COMP%] {\n  width: 12px;\n  height: 12px;\n  border-radius: 2px;\n  border: 1px solid #adb5bd;\n  display: inline-block;\n}\n.wg__chip--missing[_ngcontent-%COMP%] {\n  background: #f1f3f5;\n  border-style: dashed;\n}\n.wg__chip--new[_ngcontent-%COMP%] {\n  background: #ebfbee;\n  border-color: #40c057;\n}\n.wg__chip--changed[_ngcontent-%COMP%] {\n  background: #fff4e6;\n  border-color: #f76707;\n}\n.wg__chip--edited[_ngcontent-%COMP%] {\n  background: #e7f5ff;\n  border-color: #1c7ed6;\n}\n.wg__scroll[_ngcontent-%COMP%] {\n  max-height: 32rem;\n  overflow: auto;\n  border: 1px solid #dee2e6;\n  border-radius: 4px;\n  background: #fff;\n}\n.wg__table[_ngcontent-%COMP%] {\n  border-collapse: separate;\n  border-spacing: 0;\n  font-size: 0.8125rem;\n}\n.wg__table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.wg__table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  border-right: 1px solid #e9ecef;\n  border-bottom: 1px solid #e9ecef;\n  padding: 0.3rem 0.5rem;\n  white-space: nowrap;\n}\n.wg__corner[_ngcontent-%COMP%] {\n  position: sticky;\n  top: 0;\n  left: 0;\n  z-index: 3;\n  background: #f8f9fa;\n  text-align: left;\n  min-width: 13rem;\n  border-right: 2px solid #ced4da;\n}\n.wg__colhead[_ngcontent-%COMP%] {\n  position: sticky;\n  top: 0;\n  z-index: 2;\n  background: #f8f9fa;\n  text-align: left;\n  vertical-align: bottom;\n  min-width: 7rem;\n  max-width: 9.5rem;\n  white-space: normal;\n  overflow-wrap: anywhere;\n  padding-top: 0.4rem;\n}\n.wg__colhead--bad[_ngcontent-%COMP%] {\n  background: #fff5f5;\n}\n.wg__coldomain[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.5rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n  color: #1c7ed6;\n}\n.wg__colhead--hazard[_ngcontent-%COMP%]   .wg__coldomain[_ngcontent-%COMP%] {\n  color: #e8590c;\n}\n.wg__colname[_ngcontent-%COMP%] {\n  display: block;\n  font-weight: 600;\n  font-size: 0.625rem;\n  line-height: 1.3;\n  color: #212529;\n}\n.wg__colunit[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.5625rem;\n  color: #868e96;\n}\n.wg__colhint[_ngcontent-%COMP%] {\n  display: block;\n  margin-top: 0.1rem;\n  font-size: 0.5rem;\n  line-height: 1.25;\n  font-style: italic;\n  color: #5c940d;\n}\n.wg__colcode[_ngcontent-%COMP%] {\n  display: block;\n  margin-top: 0.15rem;\n  font-weight: 400;\n  font-size: 0.5rem;\n  line-height: 1.2;\n  color: #adb5bd;\n  letter-spacing: 0.01em;\n}\n.wg__colissue[_ngcontent-%COMP%] {\n  display: block;\n  font-weight: 400;\n  font-size: 0.5625rem;\n  margin-top: 0.15rem;\n  color: #c92a2a;\n}\n.wg__colissue--chg[_ngcontent-%COMP%] {\n  color: #e8590c;\n}\n.wg__colissue--ok[_ngcontent-%COMP%] {\n  color: #2f9e44;\n}\n.wg__rowhead[_ngcontent-%COMP%] {\n  position: sticky;\n  left: 0;\n  z-index: 1;\n  background: #fff;\n  text-align: left;\n  font-weight: 500;\n  border-right: 2px solid #ced4da;\n}\n.wg__code[_ngcontent-%COMP%] {\n  color: #adb5bd;\n  font-size: 0.75rem;\n}\n.wg__cell[_ngcontent-%COMP%] {\n  text-align: right;\n  font-variant-numeric: tabular-nums;\n}\n.wg__cell--missing[_ngcontent-%COMP%] {\n  background: #f1f3f5;\n  border-left: 3px dashed #ced4da;\n}\n.wg__cell--new[_ngcontent-%COMP%] {\n  background: #ebfbee;\n  border-left: 3px solid #40c057;\n}\n.wg__cell--changed[_ngcontent-%COMP%] {\n  background: #fff4e6;\n  border-left: 3px solid #f76707;\n}\n.wg__cell--edited[_ngcontent-%COMP%] {\n  background: #e7f5ff;\n  border-left: 3px solid #1c7ed6;\n}\n.wg__cell--invalid[_ngcontent-%COMP%] {\n  background: #ffe3e3;\n  border-left: 3px solid #e03131;\n}\n.wg__cell--same[_ngcontent-%COMP%] {\n  border-left: 3px solid transparent;\n}\n.wg__blank[_ngcontent-%COMP%] {\n  color: #ced4da;\n}\n.wg__input[_ngcontent-%COMP%] {\n  width: 6rem;\n  padding: 0.15rem 0.3rem;\n  border: 1px solid #ced4da;\n  border-radius: 3px;\n  font: inherit;\n  text-align: right;\n}\n.wg__empty[_ngcontent-%COMP%] {\n  color: #868e96;\n  font-style: italic;\n  margin: 0.5rem 0;\n}\n.wg__panel[_ngcontent-%COMP%] {\n  padding-top: 0.25rem;\n}\n.wg__expand[_ngcontent-%COMP%] {\n  padding: 0.3rem 0.7rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  background: #fff;\n  color: #1c7ed6;\n  font: inherit;\n  font-weight: 600;\n  cursor: pointer;\n  white-space: nowrap;\n}\n.wg__expand[_ngcontent-%COMP%]:hover {\n  background: #e7f5ff;\n  border-color: #1c7ed6;\n}\n.wg__notice[_ngcontent-%COMP%] {\n  margin: 0 0 0.5rem;\n  padding: 0.5rem 0.75rem;\n  background: #fff9db;\n  border-left: 3px solid #f59f00;\n  border-radius: 0 4px 4px 0;\n  color: #7c5a00;\n  line-height: 1.45;\n}\n.wg--compact[_ngcontent-%COMP%]   .wg__table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.wg--compact[_ngcontent-%COMP%]   .wg__table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.15rem 0.3rem;\n}\n.wg--compact[_ngcontent-%COMP%]   .wg__colhead[_ngcontent-%COMP%] {\n  min-width: 5rem;\n  max-width: 6.5rem;\n}\n.wg--compact[_ngcontent-%COMP%]   .wg__colunit[_ngcontent-%COMP%], \n.wg--compact[_ngcontent-%COMP%]   .wg__colhint[_ngcontent-%COMP%], \n.wg--compact[_ngcontent-%COMP%]   .wg__colcode[_ngcontent-%COMP%], \n.wg--compact[_ngcontent-%COMP%]   .wg__coldomain[_ngcontent-%COMP%] {\n  display: none;\n}\n.wg--compact[_ngcontent-%COMP%]   .wg__corner[_ngcontent-%COMP%], \n.wg--compact[_ngcontent-%COMP%]   .wg__rowhead[_ngcontent-%COMP%] {\n  min-width: 9.5rem;\n  font-size: 0.75rem;\n}\n.wg--compact[_ngcontent-%COMP%]   .wg__cell[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n}\n.wg--compact[_ngcontent-%COMP%]   .wg__input[_ngcontent-%COMP%] {\n  width: 4rem;\n  font-size: 0.75rem;\n}\n.wg--compact[_ngcontent-%COMP%]   .wg__code[_ngcontent-%COMP%] {\n  display: none;\n}\n.wg__cell--added[_ngcontent-%COMP%] {\n  background: #f3f0ff;\n  border-left: 3px solid #7048e8;\n}\n.wg__chip--added[_ngcontent-%COMP%] {\n  background: #f3f0ff;\n  border-color: #7048e8;\n}\n.wg__count-add[_ngcontent-%COMP%] {\n  color: #5f3dc4;\n}\n.wg__input--empty[_ngcontent-%COMP%] {\n  background: #fcfcfd;\n  border-style: dashed;\n  color: #868e96;\n}\n.wg__input[_ngcontent-%COMP%]::placeholder {\n  color: #ced4da;\n}\n/*# sourceMappingURL=workbook-grid.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(WorkbookGridComponent, [{
    type: Component,
    args: [{ selector: "app-workbook-grid", standalone: true, imports: [FormsModule], template: `<div class="wg" [class.wg--full]="fullScreen()" [class.wg--compact]="compact()">
  <!-- The tab strip mirrors the workbook, so an officer looking for "the
       2026-2030 tab" finds something called that. -->
  <div class="wg__tabs" role="tablist">
    @for (p of periods(); track p) {
      <button
        type="button"
        role="tab"
        class="wg__tab"
        [class.wg__tab--on]="activeTab() === p"
        [attr.aria-selected]="activeTab() === p"
        (click)="activeTab.set(p)"
      >
        {{ p }}
      </button>
    }
    @if (showWeightsTab()) {
      <button
        type="button"
        role="tab"
        class="wg__tab wg__tab--weights"
        [class.wg__tab--on]="onWeights()"
        [attr.aria-selected]="onWeights()"
        (click)="activeTab.set('WEIGHTS')"
      >
        WEIGHTS
        @if (weightsBadge(); as b) {
          <span class="wg__badge">{{ b }}</span>
        }
      </button>
    }
  </div>

  @if (onWeights()) {
    <div class="wg__panel"><ng-content select="[weightsPanel]" /></div>
  } @else if (activeTab() === null) {
    <p class="wg__empty">This workbook carried no values.</p>
  } @else {
    <div class="wg__bar">
      <input
        type="search"
        class="wg__search"
        placeholder="Find a division\u2026"
        [ngModel]="filter()"
        name="wgFilter"
        (ngModelChange)="filter.set($event)"
      />
      <label class="wg__toggle">
        <input
          type="checkbox"
          [ngModel]="onlyIssues()"
          name="wgOnlyIssues"
          (ngModelChange)="onlyIssues.set($event)"
        />
        Only rows with something to look at
      </label>
      <span class="wg__count">
        {{ divisions().length }} divisions \xD7 {{ variables().length }} variables \xB7
        {{ filled() }} of {{ expected() }} cells filled
        @if (totalMissing()) {
          \xB7 <strong class="wg__count-bad">{{ totalMissing() }} empty</strong>
        }
        @if (addedCount()) {
          \xB7 <strong class="wg__count-add">{{ addedCount() }} added here</strong>
        }
      </span>

      <label class="wg__toggle">
        <input
          type="checkbox"
          [ngModel]="compact()"
          name="wgCompact"
          (ngModelChange)="compact.set($event)"
        />
        Compact
      </label>

      <!-- Expands over the page rather than opening a real second window: a new
           window would lose the unsaved corrections held in this component. -->
      <button
        type="button"
        class="wg__expand"
        (click)="fullScreen.set(!fullScreen())"
        [title]="fullScreen() ? 'Back to the page (Esc)' : 'Fill the screen'"
      >
        {{ fullScreen() ? '\u2715 Close full screen' : '\u2922 Full screen' }}
      </button>
    </div>

    <!-- CELL COLOURS ARE NEVER THE ONLY SIGNAL. Each state also carries a
         title and a distinct left border, so the grid survives greyscale and
         colour-vision deficiency -- the same rule the map legend follows. -->
    <ul class="wg__key">
      <li><span class="wg__chip wg__chip--missing"></span> empty \u2014 no value in the file</li>
      @if (mode() === 'preview') {
        <li><span class="wg__chip wg__chip--new"></span> new</li>
        <li><span class="wg__chip wg__chip--changed"></span> changes what is stored</li>
      }
      <li><span class="wg__chip wg__chip--edited"></span> corrected here</li>
      @if (allowAdd()) {
        <li><span class="wg__chip wg__chip--added"></span> added here \u2014 was blank in the file</li>
      }
    </ul>

    @if (tabIsEmpty()) {
      <p class="wg__notice">
        @if (mode() === 'stored') {
          Nothing has been imported for <strong>{{ activeTab() }}</strong> yet. Upload the
          workbook's {{ activeTab() }} tab to fill it in.
        } @else {
          The <strong>{{ activeTab() }}</strong> tab is in this workbook but carried no values at
          all.
          @if (allowAdd() && editable()) {
            You can type them straight into the grid below, or check the file if the data was
            supposed to be in it.
          } @else {
            If that period was meant to be filled in, the data has not come through \u2014 check the
            file before importing.
          }
        }
      </p>
    }

    <div class="wg__scroll">
      <table class="wg__table">
        <thead>
          <tr>
            <th class="wg__corner">Division</th>
            @for (c of columnIssues(); track c.column.code) {
              <th
                class="wg__colhead"
                [class.wg__colhead--bad]="c.missing === c.total && c.total > 0"
                [class.wg__colhead--hazard]="c.column.domain === 'hazard'"
                [title]="fullTitle(c.column)"
              >
                @if (c.column.domain) {
                  <span class="wg__coldomain">{{ c.column.domain }}</span>
                }
                <span class="wg__colname">{{ c.column.name }}</span>
                @if (c.column.unit) {
                  <span class="wg__colunit">({{ c.column.unit }})</span>
                }
                @if (c.column.hint) {
                  <span class="wg__colhint">&raquo; {{ c.column.hint }}</span>
                }
                @if (c.column.name !== c.column.code) {
                  <span class="wg__colcode">{{ label(c.column.code) }}</span>
                }
                @if (c.missing) {
                  <span
                    class="wg__colissue"
                    [title]="c.missing + ' of ' + c.total + ' divisions have no value'"
                  >
                    \u26A0 {{ c.missing }} empty
                  </span>
                } @else if (c.changed) {
                  <span class="wg__colissue wg__colissue--chg">{{ c.changed }} changed</span>
                } @else {
                  <span class="wg__colissue wg__colissue--ok">complete</span>
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (d of visibleDivisions(); track d.code; let i = $index) {
            <tr>
              <th class="wg__rowhead" scope="row">
                {{ d.name }} <span class="wg__code">{{ d.code }}</span>
              </th>
              @for (rc of grid()[i]; track $index) {
                <td class="wg__cell" [class]="'wg__cell--' + rc.state" [title]="rc.title">
                  @if (editable() && (rc.cell !== null || allowAdd())) {
                    <!-- A blank cell gets an input too, so a gap can be filled
                         where it is seen. The placeholder keeps blank looking
                         blank: an empty box, never a 0. -->
                    <input
                      type="number"
                      step="any"
                      class="wg__input"
                      [class.wg__input--empty]="rc.shown === null"
                      [value]="rc.shown"
                      placeholder="\u2014"
                      (change)="onEdit(rc, $any($event.target).value)"
                    />
                  } @else if (rc.cell === null) {
                    <span class="wg__blank" aria-label="no value">\u2014</span>
                  } @else {
                    {{ rc.shown }}
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (visibleDivisions().length === 0) {
      <p class="wg__empty">No division matches that filter.</p>
    }
  }
</div>
`, styles: ["/* src/app/features/import/workbook-grid.component.scss */\n.wg {\n  font-size: 0.875rem;\n}\n.wg--full {\n  position: fixed;\n  inset: 0;\n  z-index: 1000;\n  background: #fff;\n  padding: 1rem 1.25rem;\n  overflow: auto;\n  display: flex;\n  flex-direction: column;\n}\n.wg--full .wg__scroll {\n  flex: 1 1 auto;\n  max-height: none;\n}\n.wg__tabs {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.25rem;\n  border-bottom: 2px solid #dee2e6;\n  margin-bottom: 0.75rem;\n}\n.wg__tab {\n  padding: 0.4rem 0.9rem;\n  border: 1px solid #dee2e6;\n  border-bottom: none;\n  border-radius: 5px 5px 0 0;\n  background: #f1f3f5;\n  color: #495057;\n  font: inherit;\n  font-weight: 600;\n  cursor: pointer;\n  margin-bottom: -2px;\n}\n.wg__tab:hover {\n  background: #e9ecef;\n}\n.wg__tab--on {\n  background: #fff;\n  color: #1c7ed6;\n  border-bottom: 2px solid #fff;\n}\n.wg__tab--weights {\n  margin-left: 0.5rem;\n}\n.wg__badge {\n  display: inline-block;\n  margin-left: 0.375rem;\n  padding: 0 0.4rem;\n  border-radius: 999px;\n  background: #e7f5ff;\n  color: #1864ab;\n  font-size: 0.75rem;\n}\n.wg__bar {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 0.75rem;\n  margin-bottom: 0.5rem;\n}\n.wg__search {\n  padding: 0.3rem 0.5rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  min-width: 14rem;\n  font: inherit;\n}\n.wg__toggle {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.375rem;\n  color: #495057;\n}\n.wg__count {\n  margin-left: auto;\n  color: #868e96;\n  font-size: 0.8125rem;\n}\n.wg__count-bad {\n  color: #c92a2a;\n}\n.wg__key {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.25rem 1rem;\n  list-style: none;\n  margin: 0 0 0.5rem;\n  padding: 0;\n  color: #868e96;\n  font-size: 0.75rem;\n}\n.wg__key li {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.375rem;\n}\n.wg__chip {\n  width: 12px;\n  height: 12px;\n  border-radius: 2px;\n  border: 1px solid #adb5bd;\n  display: inline-block;\n}\n.wg__chip--missing {\n  background: #f1f3f5;\n  border-style: dashed;\n}\n.wg__chip--new {\n  background: #ebfbee;\n  border-color: #40c057;\n}\n.wg__chip--changed {\n  background: #fff4e6;\n  border-color: #f76707;\n}\n.wg__chip--edited {\n  background: #e7f5ff;\n  border-color: #1c7ed6;\n}\n.wg__scroll {\n  max-height: 32rem;\n  overflow: auto;\n  border: 1px solid #dee2e6;\n  border-radius: 4px;\n  background: #fff;\n}\n.wg__table {\n  border-collapse: separate;\n  border-spacing: 0;\n  font-size: 0.8125rem;\n}\n.wg__table th,\n.wg__table td {\n  border-right: 1px solid #e9ecef;\n  border-bottom: 1px solid #e9ecef;\n  padding: 0.3rem 0.5rem;\n  white-space: nowrap;\n}\n.wg__corner {\n  position: sticky;\n  top: 0;\n  left: 0;\n  z-index: 3;\n  background: #f8f9fa;\n  text-align: left;\n  min-width: 13rem;\n  border-right: 2px solid #ced4da;\n}\n.wg__colhead {\n  position: sticky;\n  top: 0;\n  z-index: 2;\n  background: #f8f9fa;\n  text-align: left;\n  vertical-align: bottom;\n  min-width: 7rem;\n  max-width: 9.5rem;\n  white-space: normal;\n  overflow-wrap: anywhere;\n  padding-top: 0.4rem;\n}\n.wg__colhead--bad {\n  background: #fff5f5;\n}\n.wg__coldomain {\n  display: block;\n  font-size: 0.5rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n  color: #1c7ed6;\n}\n.wg__colhead--hazard .wg__coldomain {\n  color: #e8590c;\n}\n.wg__colname {\n  display: block;\n  font-weight: 600;\n  font-size: 0.625rem;\n  line-height: 1.3;\n  color: #212529;\n}\n.wg__colunit {\n  display: block;\n  font-size: 0.5625rem;\n  color: #868e96;\n}\n.wg__colhint {\n  display: block;\n  margin-top: 0.1rem;\n  font-size: 0.5rem;\n  line-height: 1.25;\n  font-style: italic;\n  color: #5c940d;\n}\n.wg__colcode {\n  display: block;\n  margin-top: 0.15rem;\n  font-weight: 400;\n  font-size: 0.5rem;\n  line-height: 1.2;\n  color: #adb5bd;\n  letter-spacing: 0.01em;\n}\n.wg__colissue {\n  display: block;\n  font-weight: 400;\n  font-size: 0.5625rem;\n  margin-top: 0.15rem;\n  color: #c92a2a;\n}\n.wg__colissue--chg {\n  color: #e8590c;\n}\n.wg__colissue--ok {\n  color: #2f9e44;\n}\n.wg__rowhead {\n  position: sticky;\n  left: 0;\n  z-index: 1;\n  background: #fff;\n  text-align: left;\n  font-weight: 500;\n  border-right: 2px solid #ced4da;\n}\n.wg__code {\n  color: #adb5bd;\n  font-size: 0.75rem;\n}\n.wg__cell {\n  text-align: right;\n  font-variant-numeric: tabular-nums;\n}\n.wg__cell--missing {\n  background: #f1f3f5;\n  border-left: 3px dashed #ced4da;\n}\n.wg__cell--new {\n  background: #ebfbee;\n  border-left: 3px solid #40c057;\n}\n.wg__cell--changed {\n  background: #fff4e6;\n  border-left: 3px solid #f76707;\n}\n.wg__cell--edited {\n  background: #e7f5ff;\n  border-left: 3px solid #1c7ed6;\n}\n.wg__cell--invalid {\n  background: #ffe3e3;\n  border-left: 3px solid #e03131;\n}\n.wg__cell--same {\n  border-left: 3px solid transparent;\n}\n.wg__blank {\n  color: #ced4da;\n}\n.wg__input {\n  width: 6rem;\n  padding: 0.15rem 0.3rem;\n  border: 1px solid #ced4da;\n  border-radius: 3px;\n  font: inherit;\n  text-align: right;\n}\n.wg__empty {\n  color: #868e96;\n  font-style: italic;\n  margin: 0.5rem 0;\n}\n.wg__panel {\n  padding-top: 0.25rem;\n}\n.wg__expand {\n  padding: 0.3rem 0.7rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  background: #fff;\n  color: #1c7ed6;\n  font: inherit;\n  font-weight: 600;\n  cursor: pointer;\n  white-space: nowrap;\n}\n.wg__expand:hover {\n  background: #e7f5ff;\n  border-color: #1c7ed6;\n}\n.wg__notice {\n  margin: 0 0 0.5rem;\n  padding: 0.5rem 0.75rem;\n  background: #fff9db;\n  border-left: 3px solid #f59f00;\n  border-radius: 0 4px 4px 0;\n  color: #7c5a00;\n  line-height: 1.45;\n}\n.wg--compact .wg__table th,\n.wg--compact .wg__table td {\n  padding: 0.15rem 0.3rem;\n}\n.wg--compact .wg__colhead {\n  min-width: 5rem;\n  max-width: 6.5rem;\n}\n.wg--compact .wg__colunit,\n.wg--compact .wg__colhint,\n.wg--compact .wg__colcode,\n.wg--compact .wg__coldomain {\n  display: none;\n}\n.wg--compact .wg__corner,\n.wg--compact .wg__rowhead {\n  min-width: 9.5rem;\n  font-size: 0.75rem;\n}\n.wg--compact .wg__cell {\n  font-size: 0.75rem;\n}\n.wg--compact .wg__input {\n  width: 4rem;\n  font-size: 0.75rem;\n}\n.wg--compact .wg__code {\n  display: none;\n}\n.wg__cell--added {\n  background: #f3f0ff;\n  border-left: 3px solid #7048e8;\n}\n.wg__chip--added {\n  background: #f3f0ff;\n  border-color: #7048e8;\n}\n.wg__count-add {\n  color: #5f3dc4;\n}\n.wg__input--empty {\n  background: #fcfcfd;\n  border-style: dashed;\n  color: #868e96;\n}\n.wg__input::placeholder {\n  color: #ced4da;\n}\n/*# sourceMappingURL=workbook-grid.component.css.map */\n"] }]
  }], () => [], { cells: [{ type: Input, args: [{ isSignal: true, alias: "cells", required: true }] }], mode: [{ type: Input, args: [{ isSignal: true, alias: "mode", required: false }] }], editable: [{ type: Input, args: [{ isSignal: true, alias: "editable", required: false }] }], edits: [{ type: Input, args: [{ isSignal: true, alias: "edits", required: false }] }], showWeightsTab: [{ type: Input, args: [{ isSignal: true, alias: "showWeightsTab", required: false }] }], weightsBadge: [{ type: Input, args: [{ isSignal: true, alias: "weightsBadge", required: false }] }], tabs: [{ type: Input, args: [{ isSignal: true, alias: "tabs", required: false }] }], columns: [{ type: Input, args: [{ isSignal: true, alias: "columns", required: false }] }], allDivisions: [{ type: Input, args: [{ isSignal: true, alias: "allDivisions", required: false }] }], allowAdd: [{ type: Input, args: [{ isSignal: true, alias: "allowAdd", required: false }] }], cellEdit: [{ type: Output, args: ["cellEdit"] }], onEscape: [{
    type: HostListener,
    args: ["document:keydown.escape"]
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(WorkbookGridComponent, { className: "WorkbookGridComponent", filePath: "src/app/features/import/workbook-grid.component.ts", lineNumber: 96 });
})();

// src/app/features/import/import-page.component.ts
var _c02 = () => [];
var _forTrack03 = ($index, $item) => $item.code;
var _forTrack12 = ($index, $item) => $item.profileCode;
var _forTrack2 = ($index, $item) => $item.id;
function ImportPageComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 3);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Filter options could not be loaded, so no scope can be chosen yet. ", ctx_r0.taxonomyError(), " ");
  }
}
function ImportPageComponent_For_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r2 = ctx.$implicit;
    \u0275\u0275property("ngValue", p_r2.code);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(p_r2.name);
  }
}
function ImportPageComponent_Conditional_21_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const s_r4 = ctx.$implicit;
    \u0275\u0275property("ngValue", s_r4.code);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(s_r4.name);
  }
}
function ImportPageComponent_Conditional_21_For_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const s_r5 = ctx.$implicit;
    \u0275\u0275property("ngValue", s_r5.code);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(s_r5.name);
  }
}
function ImportPageComponent_Conditional_21_For_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const h_r6 = ctx.$implicit;
    \u0275\u0275property("ngValue", h_r6.code);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(h_r6.name);
  }
}
function ImportPageComponent_Conditional_21_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label", 5)(1, "span");
    \u0275\u0275text(2, "Sector");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "select", 28);
    \u0275\u0275listener("ngModelChange", function ImportPageComponent_Conditional_21_Template_select_ngModelChange_3_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onSectorChange($event));
    });
    \u0275\u0275repeaterCreate(4, ImportPageComponent_Conditional_21_For_5_Template, 2, 2, "option", 10, _forTrack03);
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "label", 5)(7, "span");
    \u0275\u0275text(8, "Subsector");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "select", 29);
    \u0275\u0275listener("ngModelChange", function ImportPageComponent_Conditional_21_Template_select_ngModelChange_9_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onSubsectorChange($event));
    });
    \u0275\u0275repeaterCreate(10, ImportPageComponent_Conditional_21_For_11_Template, 2, 2, "option", 10, _forTrack03);
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "label", 5)(13, "span");
    \u0275\u0275text(14, "Hazard");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "select", 30);
    \u0275\u0275listener("ngModelChange", function ImportPageComponent_Conditional_21_Template_select_ngModelChange_15_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.hazard.set($event));
    });
    \u0275\u0275repeaterCreate(16, ImportPageComponent_Conditional_21_For_17_Template, 2, 2, "option", 10, _forTrack03);
    \u0275\u0275elementEnd();
    \u0275\u0275controlCreate();
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", ctx_r0.sector());
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r0.sectors());
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", ctx_r0.subsector())("disabled", ctx_r0.subsectorOptions().length === 0);
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r0.subsectorOptions());
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", ctx_r0.hazard());
    \u0275\u0275control();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r0.hazards());
  }
}
function ImportPageComponent_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275text(1, " Climate variables belong to the division and the period, not to a sector \u2014 the same rainfall is read by every sector. They are collected once per province, by the officer who owns them, so that no sector import can overwrite them. Importing this file needs the hazard-data grant. ");
    \u0275\u0275elementEnd();
  }
}
function ImportPageComponent_Conditional_39_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 17);
    \u0275\u0275text(1, "Working\u2026");
    \u0275\u0275elementEnd();
  }
}
function ImportPageComponent_Conditional_40_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function ImportPageComponent_Conditional_41_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const r_r7 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" \xB7 profile ", r_r7.profileCode, " ");
  }
}
function ImportPageComponent_Conditional_41_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const r_r7 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate2(" \xB7 ", r_r7.valuesLoaded, " loaded across ", r_r7.divisions, " divisions ");
  }
}
function ImportPageComponent_Conditional_41_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const r_r7 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" \xB7 ", r_r7.divisions, " divisions matched \u2014 nothing written ");
  }
}
function ImportPageComponent_Conditional_41_Conditional_9_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const e_r8 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(e_r8);
  }
}
function ImportPageComponent_Conditional_41_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "ul", 33);
    \u0275\u0275repeaterCreate(1, ImportPageComponent_Conditional_41_Conditional_9_For_2_Template, 2, 1, "li", null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r7 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(r_r7.errors);
  }
}
function ImportPageComponent_Conditional_41_Conditional_10_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const w_r9 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(w_r9);
  }
}
function ImportPageComponent_Conditional_41_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "details", 34)(1, "summary");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "ul");
    \u0275\u0275repeaterCreate(4, ImportPageComponent_Conditional_41_Conditional_10_For_5_Template, 2, 1, "li", null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const r_r7 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", r_r7.warnings.length, " note(s) about how this file was read");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(r_r7.warnings);
  }
}
function ImportPageComponent_Conditional_41_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 31)(1, "h3");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 32);
    \u0275\u0275text(4);
    \u0275\u0275conditionalCreate(5, ImportPageComponent_Conditional_41_Conditional_5_Template, 1, 1);
    \u0275\u0275text(6);
    \u0275\u0275conditionalCreate(7, ImportPageComponent_Conditional_41_Conditional_7_Template, 1, 2);
    \u0275\u0275conditionalCreate(8, ImportPageComponent_Conditional_41_Conditional_8_Template, 1, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(9, ImportPageComponent_Conditional_41_Conditional_9_Template, 3, 0, "ul", 33);
    \u0275\u0275conditionalCreate(10, ImportPageComponent_Conditional_41_Conditional_10_Template, 6, 1, "details", 34);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r7 = ctx;
    \u0275\u0275classProp("import__report--bad", !r_r7.ok);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", r_r7.ok ? r_r7.dryRun ? "Check passed" : "Imported" : "Refused \u2014 nothing was loaded", " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", r_r7.filename, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(r_r7.profileCode ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" \xB7 ", r_r7.valuesRead, " values read ");
    \u0275\u0275advance();
    \u0275\u0275conditional(!r_r7.dryRun && r_r7.ok ? 7 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(r_r7.dryRun && r_r7.ok ? 8 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(r_r7.errors.length ? 9 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(r_r7.warnings.length ? 10 : -1);
  }
}
function ImportPageComponent_Conditional_42_Conditional_0_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", ctx_r0.editCount(), " corrected here");
  }
}
function ImportPageComponent_Conditional_42_Conditional_0_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "p", 43)(1, "button", 44);
    \u0275\u0275listener("click", function ImportPageComponent_Conditional_42_Conditional_0_Conditional_12_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.clearEdits());
    });
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" Undo my ", ctx_r0.editCount(), " correction(s) ");
  }
}
function ImportPageComponent_Conditional_42_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "section", 35)(1, "div", 36)(2, "h3");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 37)(5, "span", 38);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 39);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(9, ImportPageComponent_Conditional_42_Conditional_0_Conditional_9_Template, 2, 1, "span", 40);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "app-workbook-grid", 41);
    \u0275\u0275listener("cellEdit", function ImportPageComponent_Conditional_42_Conditional_0_Template_app_workbook_grid_cellEdit_10_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onPreviewGridEdit($event));
    });
    \u0275\u0275element(11, "app-weights-confirm", 42);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(12, ImportPageComponent_Conditional_42_Conditional_0_Conditional_12_Template, 3, 1, "p", 43);
    \u0275\u0275elementStart(13, "p", 11);
    \u0275\u0275text(14, " A correction here replaces the workbook's number for that cell and is recorded against the value as a correction, so the workbook stays the record of what was submitted. It cannot add a value the file did not carry. Press ");
    \u0275\u0275elementStart(15, "strong");
    \u0275\u0275text(16, "Import");
    \u0275\u0275elementEnd();
    \u0275\u0275text(17, " to write these numbers. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "div", 14)(19, "button", 16);
    \u0275\u0275listener("click", function ImportPageComponent_Conditional_42_Conditional_0_Template_button_click_19_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.load());
    });
    \u0275\u0275text(20);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("Review the ", ctx_r0.previewRows().length, " values before importing");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", ctx_r0.newCount(), " new");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", ctx_r0.changedCount(), " change existing");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r0.editCount() ? 9 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("cells", ctx_r0.previewCells())("tabs", ctx_r0.workbookTabs())("columns", ctx_r0.workbookColumns())("allDivisions", ctx_r0.workbookDivisions())("allowAdd", true)("editable", true)("edits", ctx_r0.edits())("showWeightsTab", true)("weightsBadge", ctx_r0.weightsBadge());
    \u0275\u0275advance();
    \u0275\u0275property("weights", ctx_r0.weightRows())("tabPresent", ctx_r0.weightsTabPresent())("scope", ctx_r0.importScope());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r0.editCount() ? 12 : -1);
    \u0275\u0275advance(7);
    \u0275\u0275property("disabled", !ctx_r0.canSubmit());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Import these ", ctx_r0.previewRows().length, " values ");
  }
}
function ImportPageComponent_Conditional_42_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275conditionalCreate(0, ImportPageComponent_Conditional_42_Conditional_0_Template, 21, 19, "section", 35);
  }
  if (rf & 2) {
    const r_r12 = ctx;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275conditional(r_r12.dryRun && r_r12.ok && ctx_r0.previewRows().length ? 0 : -1);
  }
}
function ImportPageComponent_Conditional_46_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "date");
  }
  if (rf & 2) {
    const st_r13 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" Last computed ", \u0275\u0275pipeBind2(1, 1, st_r13.lastComputed, "short"), ". ");
  }
}
function ImportPageComponent_Conditional_46_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 45);
    \u0275\u0275text(1);
    \u0275\u0275conditionalCreate(2, ImportPageComponent_Conditional_46_Conditional_2_Template, 2, 4);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const st_r13 = ctx;
    \u0275\u0275classProp("recompute__state--stale", st_r13.stale);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", st_r13.reason, ". ");
    \u0275\u0275advance();
    \u0275\u0275conditional(st_r13.lastComputed ? 2 : -1);
  }
}
function ImportPageComponent_Conditional_47_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 23);
    \u0275\u0275text(1, "Score status unavailable \u2014 sign in to see it.");
    \u0275\u0275elementEnd();
  }
}
function ImportPageComponent_For_54_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r14 = ctx.$implicit;
    \u0275\u0275property("ngValue", p_r14);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(p_r14);
  }
}
function ImportPageComponent_Conditional_57_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function ImportPageComponent_Conditional_58_Conditional_2_For_5_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r15 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(p_r15.refusal);
  }
}
function ImportPageComponent_Conditional_58_Conditional_2_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275conditionalCreate(0, ImportPageComponent_Conditional_58_Conditional_2_For_5_Conditional_0_Template, 2, 1, "li");
  }
  if (rf & 2) {
    const p_r15 = ctx.$implicit;
    \u0275\u0275conditional(!p_r15.ok ? 0 : -1);
  }
}
function ImportPageComponent_Conditional_58_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "details", 34)(1, "summary");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "ul");
    \u0275\u0275repeaterCreate(4, ImportPageComponent_Conditional_58_Conditional_2_For_5_Template, 1, 1, null, null, _forTrack12);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const rr_r16 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", rr_r16.refused, " profile(s) could not be scored");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(rr_r16.profiles);
  }
}
function ImportPageComponent_Conditional_58_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 46);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(2, ImportPageComponent_Conditional_58_Conditional_2_Template, 6, 1, "details", 34);
  }
  if (rf & 2) {
    const rr_r16 = ctx;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate5(" ", rr_r16.computed, " profile(s) computed, ", rr_r16.refused, " refused, ", rr_r16.resultRows, " result rows for ", rr_r16.province, " ", rr_r16.period, ". ");
    \u0275\u0275advance();
    \u0275\u0275conditional(rr_r16.refused ? 2 : -1);
  }
}
function ImportPageComponent_Conditional_61_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 23);
    \u0275\u0275text(1, "Nothing imported yet, or you are not signed in.");
    \u0275\u0275elementEnd();
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 50);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.detailError());
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 23);
    \u0275\u0275text(1, "Opening\u2026");
    \u0275\u0275elementEnd();
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const d_r20 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" in ", d_r20.province, " ");
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const d_r20 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" \xB7 uploaded by ", d_r20.uploadedBy, " ");
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 53);
    \u0275\u0275listener("click", function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_7_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r21);
      const ctx_r0 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r0.toggleEditing());
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.editing() ? "Cancel editing" : "Turn on editing", " ");
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 23);
    \u0275\u0275text(1, " Read only \u2014 correcting this needs the grant that covers uploading it. ");
    \u0275\u0275elementEnd();
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 23);
    \u0275\u0275text(1, " Change a number and save. An edit corrects a value this import wrote; it cannot add one the file did not carry. The map keeps its current scores until the province is recomputed. ");
    \u0275\u0275elementEnd();
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 23);
    \u0275\u0275text(1, "This import wrote no values.");
    \u0275\u0275elementEnd();
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r22 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-workbook-grid", 55);
    \u0275\u0275listener("cellEdit", function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_13_Template_app_workbook_grid_cellEdit_0_listener($event) {
      \u0275\u0275restoreView(_r22);
      const ctx_r0 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r0.onDetailGridEdit($event));
    });
    \u0275\u0275element(1, "app-weights-confirm", 56);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(5);
    \u0275\u0275property("cells", ctx_r0.detailCells())("tabs", ctx_r0.storedTabs())("columns", ctx_r0.storedColumns())("allDivisions", ctx_r0.storedDivisions())("editable", ctx_r0.editing())("edits", ctx_r0.detailEditsByKey())("showWeightsTab", true);
    \u0275\u0275advance();
    \u0275\u0275property("weights", \u0275\u0275pureFunction0(9, _c02))("scope", ctx_r0.importScope());
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 51)(1, "button", 15);
    \u0275\u0275listener("click", function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_14_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r23);
      const ctx_r0 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r0.saveCorrections());
    });
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r0.valueEditCount() === 0 || ctx_r0.saving());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.saving() ? "Saving\u2026" : "Save " + ctx_r0.valueEditCount() + " correction(s)", " ");
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_15_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const c_r24 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" The published scores still reflect the old numbers \u2014 recompute ", c_r24.province ?? "the province", " above to update the map. ");
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275text(1);
    \u0275\u0275conditionalCreate(2, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_15_Conditional_2_Template, 1, 1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r24 = ctx;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", c_r24.updated, " value(s) corrected. ");
    \u0275\u0275advance();
    \u0275\u0275conditional(c_r24.recomputeNeeded ? 2 : -1);
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 51)(1, "span")(2, "strong");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275text(4, " values ");
    \u0275\u0275conditionalCreate(5, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_5_Template, 1, 1);
    \u0275\u0275conditionalCreate(6, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_6_Template, 1, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(7, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_7_Template, 2, 1, "button", 52)(8, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_8_Template, 2, 0, "span", 23);
    \u0275\u0275elementStart(9, "button", 53);
    \u0275\u0275listener("click", function ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r19);
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.closeBatch());
    });
    \u0275\u0275text(10, "Close");
    \u0275\u0275elementEnd()();
    \u0275\u0275conditionalCreate(11, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_11_Template, 2, 0, "p", 23);
    \u0275\u0275conditionalCreate(12, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_12_Template, 2, 0, "p", 23)(13, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_13_Template, 2, 10, "app-workbook-grid", 54);
    \u0275\u0275conditionalCreate(14, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_14_Template, 3, 2, "div", 51);
    \u0275\u0275conditionalCreate(15, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Conditional_15_Template, 3, 2, "p", 11);
  }
  if (rf & 2) {
    let tmp_21_0;
    const d_r20 = ctx;
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(d_r20.values.length);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(d_r20.province ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(d_r20.uploadedBy ? 6 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(d_r20.editable ? 7 : 8);
    \u0275\u0275advance(4);
    \u0275\u0275conditional(ctx_r0.editing() ? 11 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(d_r20.values.length === 0 ? 12 : 13);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r0.editing() ? 14 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_21_0 = ctx_r0.correction()) ? 15 : -1, tmp_21_0);
  }
}
function ImportPageComponent_Conditional_62_For_19_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 48)(1, "td", 49);
    \u0275\u0275conditionalCreate(2, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_2_Template, 2, 1, "p", 50);
    \u0275\u0275conditionalCreate(3, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_3_Template, 2, 0, "p", 23);
    \u0275\u0275conditionalCreate(4, ImportPageComponent_Conditional_62_For_19_Conditional_16_Conditional_4_Template, 16, 8);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_14_0;
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r0.detailError() ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(!ctx_r0.detail() && !ctx_r0.detailError() ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_14_0 = ctx_r0.detail()) ? 4 : -1, tmp_14_0);
  }
}
function ImportPageComponent_Conditional_62_For_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr", 47);
    \u0275\u0275listener("click", function ImportPageComponent_Conditional_62_For_19_Template_tr_click_0_listener() {
      const b_r18 = \u0275\u0275restoreView(_r17).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.openBatch(b_r18.id));
    });
    \u0275\u0275elementStart(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "td");
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "td");
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "td");
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td");
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "date");
    \u0275\u0275elementEnd()();
    \u0275\u0275conditionalCreate(16, ImportPageComponent_Conditional_62_For_19_Conditional_16_Template, 5, 3, "tr", 48);
  }
  if (rf & 2) {
    const b_r18 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("import__row--bad", b_r18.status === "rejected")("import__row--open", ctx_r0.openBatchId() === b_r18.id);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(b_r18.filename);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(b_r18.profileCode ?? "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(b_r18.status);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(b_r18.rowsTotal ?? "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(b_r18.rowsLoaded ?? "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(b_r18.errorCount);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(15, 12, b_r18.uploadedAt, "short"));
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r0.openBatchId() === b_r18.id ? 16 : -1);
  }
}
function ImportPageComponent_Conditional_62_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "table", 27)(1, "thead")(2, "tr")(3, "th");
    \u0275\u0275text(4, "File");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "th");
    \u0275\u0275text(6, "Profile");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "th");
    \u0275\u0275text(8, "Status");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "th");
    \u0275\u0275text(10, "Read");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "th");
    \u0275\u0275text(12, "Loaded");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "th");
    \u0275\u0275text(14, "Errors");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "th");
    \u0275\u0275text(16, "When");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(17, "tbody");
    \u0275\u0275repeaterCreate(18, ImportPageComponent_Conditional_62_For_19_Template, 17, 15, null, null, _forTrack2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(18);
    \u0275\u0275repeater(ctx_r0.batches());
  }
}
var ImportPageComponent = class _ImportPageComponent {
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  taxonomyService = inject(TaxonomyService);
  auth = inject(AuthService);
  base = environment.apiBaseUrl;
  taxonomy = this.taxonomyService.taxonomy;
  taxonomyError = this.taxonomyService.error;
  /** 'sector' = one sector x hazard workbook. 'climate' = the province-wide
   * hazard-variable workbook. The server reads the kind from the file's _META
   * regardless; this only decides what the form asks for and sends. */
  kind = signal(
    "sector",
    ...ngDevMode ? [{ debugName: "kind" }] : (
      /* istanbul ignore next */
      []
    )
  );
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
  file = signal(
    null,
    ...ngDevMode ? [{ debugName: "file" }] : (
      /* istanbul ignore next */
      []
    )
  );
  busy = signal(
    false,
    ...ngDevMode ? [{ debugName: "busy" }] : (
      /* istanbul ignore next */
      []
    )
  );
  report = signal(
    null,
    ...ngDevMode ? [{ debugName: "report" }] : (
      /* istanbul ignore next */
      []
    )
  );
  // ---- review before writing -------------------------------------------
  /** Corrections keyed "period|dsCode|variableCode". Held apart from the
   * preview rows so re-running Check does not discard what has been corrected,
   * and so the payload is exactly the set of deliberate changes. */
  edits = signal(
    {},
    ...ngDevMode ? [{ debugName: "edits" }] : (
      /* istanbul ignore next */
      []
    )
  );
  previewRows = computed(
    () => this.report()?.rows ?? [],
    ...ngDevMode ? [{ debugName: "previewRows" }] : (
      /* istanbul ignore next */
      []
    )
  );
  changedCount = computed(
    () => this.previewRows().filter((r) => r.current !== null && r.current !== r.value).length,
    ...ngDevMode ? [{ debugName: "changedCount" }] : (
      /* istanbul ignore next */
      []
    )
  );
  newCount = computed(
    () => this.previewRows().filter((r) => r.current === null).length,
    ...ngDevMode ? [{ debugName: "newCount" }] : (
      /* istanbul ignore next */
      []
    )
  );
  editCount = computed(
    () => Object.keys(this.edits()).length,
    ...ngDevMode ? [{ debugName: "editCount" }] : (
      /* istanbul ignore next */
      []
    )
  );
  // ---- recompute --------------------------------------------------------
  period = signal(
    void 0,
    ...ngDevMode ? [{ debugName: "period" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Periods that hold RESULTS. */
  periods = computed(
    () => this.taxonomy()?.periods ?? [],
    ...ngDevMode ? [{ debugName: "periods" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Periods the system COLLECTS for. What a person picks from on this screen:
   * both the recompute picker and the grid's tab strip are about a period you
   * are trying to GIVE results to, and a list derived from results cannot ever
   * offer one. */
  collectionPeriods = computed(
    () => this.taxonomy()?.collectionPeriods ?? this.taxonomy()?.periods ?? [],
    ...ngDevMode ? [{ debugName: "collectionPeriods" }] : (
      /* istanbul ignore next */
      []
    )
  );
  staleness = signal(
    null,
    ...ngDevMode ? [{ debugName: "staleness" }] : (
      /* istanbul ignore next */
      []
    )
  );
  recomputing = signal(
    false,
    ...ngDevMode ? [{ debugName: "recomputing" }] : (
      /* istanbul ignore next */
      []
    )
  );
  recomputeReport = signal(
    null,
    ...ngDevMode ? [{ debugName: "recomputeReport" }] : (
      /* istanbul ignore next */
      []
    )
  );
  recomputeError = signal(
    null,
    ...ngDevMode ? [{ debugName: "recomputeError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  failure = signal(
    null,
    ...ngDevMode ? [{ debugName: "failure" }] : (
      /* istanbul ignore next */
      []
    )
  );
  batches = signal(
    [],
    ...ngDevMode ? [{ debugName: "batches" }] : (
      /* istanbul ignore next */
      []
    )
  );
  // ---- the opened dataset ----------------------------------------------
  openBatchId = signal(
    null,
    ...ngDevMode ? [{ debugName: "openBatchId" }] : (
      /* istanbul ignore next */
      []
    )
  );
  detail = signal(
    null,
    ...ngDevMode ? [{ debugName: "detail" }] : (
      /* istanbul ignore next */
      []
    )
  );
  detailError = signal(
    null,
    ...ngDevMode ? [{ debugName: "detailError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  editing = signal(
    false,
    ...ngDevMode ? [{ debugName: "editing" }] : (
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
  /** Corrections keyed by the stored value's id. */
  valueEdits = signal(
    {},
    ...ngDevMode ? [{ debugName: "valueEdits" }] : (
      /* istanbul ignore next */
      []
    )
  );
  correction = signal(
    null,
    ...ngDevMode ? [{ debugName: "correction" }] : (
      /* istanbul ignore next */
      []
    )
  );
  valueEditCount = computed(
    () => Object.keys(this.valueEdits()).length,
    ...ngDevMode ? [{ debugName: "valueEditCount" }] : (
      /* istanbul ignore next */
      []
    )
  );
  provinces = computed(
    () => this.taxonomy()?.provinces ?? [],
    ...ngDevMode ? [{ debugName: "provinces" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /**
   * A data officer or expert is bound to one province (SRS 3.2), so the picker
   * is pre-set and locked for them. Carried over from the Data entry screen
   * this tab absorbed: without it the form invites a choice the server will
   * refuse, and the refusal arrives only after the file has been uploaded.
   * Administrators are national by the same rule and stay free; reading is
   * never locked anywhere.
   */
  provinceLocked = computed(
    () => this.auth.hasRole("data_officer") || this.auth.hasRole("expert"),
    ...ngDevMode ? [{ debugName: "provinceLocked" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** The account's province as a TAXONOMY CODE. The auth service answers with
   * the name it matched in the shared province list, and this form speaks
   * codes; comparing loosely because the two lists spell 'Northwestern'
   * differently and always have. */
  lockedProvinceCode = computed(
    () => {
      const name = this.auth.matchProvinceOption();
      if (!name)
        return void 0;
      const flat = (x) => x.toLowerCase().replace(/[^a-z]/g, "");
      return this.provinces().find((p) => flat(p.name) === flat(name))?.code;
    },
    ...ngDevMode ? [{ debugName: "lockedProvinceCode" }] : (
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
  /** Narrowed to hazards a profile exists for, same as the map's filter bar —
   * an import scope that cannot exist is refused by the server anyway, so
   * offering it here only wastes an upload. */
  hazards = computed(
    () => {
      const all = this.taxonomy()?.hazards ?? [];
      const sector = this.sectors().find((s) => s.code === this.sector());
      if (!sector)
        return all;
      const sub = sector.subsectors.find((x) => x.code === this.subsector());
      const allowed = sub ? sub.hazards : sector.hazards;
      if (!allowed || allowed.length === 0)
        return all;
      const set = new Set(allowed);
      return all.filter((h) => set.has(h.code));
    },
    ...ngDevMode ? [{ debugName: "hazards" }] : (
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
  /** Names rather than codes: the scope check compares against `_META`, which
   * carries the names the generator wrote into the workbook. */
  nameOf = computed(
    () => {
      const t = this.taxonomy();
      return {
        province: t?.provinces.find((p) => p.code === this.province())?.name,
        sector: t?.sectors.find((s) => s.code === this.sector())?.name,
        subsector: this.subsectorOptions().find((s) => s.code === this.subsector())?.name,
        hazard: t?.hazards.find((h) => h.code === this.hazard())?.name
      };
    },
    ...ngDevMode ? [{ debugName: "nameOf" }] : (
      /* istanbul ignore next */
      []
    )
  );
  canSubmit = computed(
    () => {
      if (!this.file() || !this.province() || this.busy())
        return false;
      return this.kind() === "climate" || !!this.sector() && !!this.hazard();
    },
    ...ngDevMode ? [{ debugName: "canSubmit" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Where "Back" goes. The weights editor and the context selector both link
   * here carrying `from`, so back returns to whichever one sent you rather than
   * to a fixed page you may never have visited. */
  backTarget = computed(
    () => this.route.snapshot.queryParams["from"] === "weights" ? "/weights" : "/map",
    ...ngDevMode ? [{ debugName: "backTarget" }] : (
      /* istanbul ignore next */
      []
    )
  );
  backLabel = computed(
    () => this.backTarget() === "/weights" ? "Back to weights" : "Back to data entry",
    ...ngDevMode ? [{ debugName: "backLabel" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** The scope this page is working in, so Back does not drop it either. */
  backParams = computed(
    () => {
      const { province, sector, subsector, hazard, period } = this.route.snapshot.queryParams;
      return { province, sector, subsector, hazard, period };
    },
    ...ngDevMode ? [{ debugName: "backParams" }] : (
      /* istanbul ignore next */
      []
    )
  );
  constructor() {
    effect(() => {
      if (!this.provinceLocked())
        return;
      const code = this.lockedProvinceCode();
      if (code && this.province() !== code)
        this.province.set(code);
    });
    effect(() => {
      this.province();
      if (this.taxonomy())
        untracked(() => this.loadBatches());
    });
    effect(() => {
      const t = this.taxonomy();
      if (!t || this.sector() !== void 0)
        return;
      const q = this.route.snapshot.queryParams;
      const known = (list, code) => typeof code === "string" && list.some((x) => x.code === code) ? code : void 0;
      this.province.set(known(t.provinces, q["province"]) ?? t.provinces[0]?.code);
      const sector = known(t.sectors, q["sector"]) ?? t.sectors[0]?.code;
      this.sector.set(sector);
      const subs = t.sectors.find((x) => x.code === sector)?.subsectors ?? [];
      this.subsector.set(known(subs, q["subsector"]) ?? subs[0]?.code);
      this.hazard.set(known(this.hazards(), q["hazard"]) ?? this.hazards()[0]?.code);
      if (q["kind"] === "climate")
        this.kind.set("climate");
    });
  }
  ngOnInit() {
    this.taxonomyService.load();
    this.loadBatches();
    this.refreshStaleness();
  }
  onSectorChange(code) {
    this.sector.set(code || void 0);
    this.subsector.set(this.subsectorOptions()[0]?.code);
    this.keepHazardValid();
  }
  onSubsectorChange(code) {
    this.subsector.set(code || void 0);
    this.keepHazardValid();
  }
  keepHazardValid() {
    const options = this.hazards();
    if (!options.some((h) => h.code === this.hazard())) {
      this.hazard.set(options[0]?.code);
    }
  }
  onKindChange(kind) {
    this.kind.set(kind);
    this.report.set(null);
    this.failure.set(null);
  }
  onFileSelected(event) {
    this.file.set(event.target.files?.[0] ?? null);
    this.report.set(null);
    this.failure.set(null);
    this.edits.set({});
  }
  rowKey(r) {
    return r.period + "|" + r.dsCode + "|" + r.variableCode;
  }
  // ---- the workbook view ------------------------------------------------
  //
  // Both screens feed the same grid. The long-format tables they replaced put
  // one value on a row, which meant a 15 x 20 x 2 workbook arrived as ~600
  // rows -- and the faults worth catching before a load (a column nobody
  // filled, a period that never came through, a column shifted by one) are
  // faults in the SHAPE of the data, which a list of 600 correct-looking rows
  // hides completely.
  /** Preview cells: what the file would write, with what is stored beside it. */
  previewCells = computed(
    () => this.previewRows().map((r) => ({
      period: r.period,
      dsCode: r.dsCode,
      dsName: r.dsName,
      variableCode: r.variableCode,
      value: r.value,
      current: r.current,
      key: this.rowKey(r)
    })),
    ...ngDevMode ? [{ debugName: "previewCells" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Stored cells, for a batch opened from the list. `current` is null: these
   * ARE what is stored, so there is nothing to compare them against and the
   * grid must not paint them as new. */
  detailCells = computed(
    () => (this.detail()?.values ?? []).map((v) => ({
      period: v.period,
      dsCode: v.dsCode,
      dsName: v.dsName,
      variableCode: v.variableCode,
      value: v.value,
      current: null,
      key: String(v.id)
    })),
    ...ngDevMode ? [{ debugName: "detailCells" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** The grid keys corrections by string; the detail screen keys them by the
   * stored value's own id. Converted here rather than changing either. */
  detailEditsByKey = computed(
    () => {
      const out = {};
      for (const [id, v] of Object.entries(this.valueEdits()))
        out[id] = v;
      return out;
    },
    ...ngDevMode ? [{ debugName: "detailEditsByKey" }] : (
      /* istanbul ignore next */
      []
    )
  );
  onPreviewGridEdit(e) {
    const next = __spreadValues({}, this.edits());
    const n = Number(e.raw);
    if (e.raw.trim() === "" || Number.isNaN(n) || e.cell !== null && n === e.cell.value) {
      delete next[e.key];
    } else {
      next[e.key] = n;
    }
    this.edits.set(next);
  }
  /** Stored mode never offers a blank cell to type into (`allowAdd` is off
   * there), so `cell` is always present -- but the output is shared with the
   * review grid, which does, hence the guard. Adding a value that no import
   * wrote is an entry act, not a correction to a batch. */
  onDetailGridEdit(e) {
    if (!e.cell)
      return;
    const key = e.cell.key;
    const row = (this.detail()?.values ?? []).find((v) => String(v.id) === key);
    if (row)
      this.editValue(row, e.raw);
  }
  /** The scope the form is pointed at, for the WEIGHTS panel's link into the
   * weights editor. Null until enough of it is chosen -- a climate workbook
   * has no profile and therefore no weights to confirm. */
  importScope = computed(
    () => {
      if (this.kind() !== "sector")
        return null;
      const province = this.province();
      const sector = this.sector();
      const hazard = this.hazard();
      if (!province || !sector || !hazard)
        return null;
      return { province, sector, hazard, subsector: this.subsector() };
    },
    ...ngDevMode ? [{ debugName: "importScope" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Tabs the review grid must offer. From the file, so an empty 2026-2030
   * tab is still shown and still says it is empty. */
  workbookTabs = computed(
    () => this.report()?.periods ?? [],
    ...ngDevMode ? [{ debugName: "workbookTabs" }] : (
      /* istanbul ignore next */
      []
    )
  );
  workbookColumns = computed(
    () => this.report()?.columns ?? [],
    ...ngDevMode ? [{ debugName: "workbookColumns" }] : (
      /* istanbul ignore next */
      []
    )
  );
  workbookDivisions = computed(
    () => this.report()?.divisionsAll ?? [],
    ...ngDevMode ? [{ debugName: "workbookDivisions" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Tabs the stored-batch grid must offer: every period the system collects,
   * so a batch that wrote only one of them still shows the other as empty
   * rather than looking complete. */
  storedTabs = computed(
    () => this.detail()?.periods ?? this.collectionPeriods(),
    ...ngDevMode ? [{ debugName: "storedTabs" }] : (
      /* istanbul ignore next */
      []
    )
  );
  storedColumns = computed(
    () => this.detail()?.columns ?? [],
    ...ngDevMode ? [{ debugName: "storedColumns" }] : (
      /* istanbul ignore next */
      []
    )
  );
  storedDivisions = computed(
    () => this.detail()?.divisionsAll ?? [],
    ...ngDevMode ? [{ debugName: "storedDivisions" }] : (
      /* istanbul ignore next */
      []
    )
  );
  weightRows = computed(
    () => this.report()?.weights ?? [],
    ...ngDevMode ? [{ debugName: "weightRows" }] : (
      /* istanbul ignore next */
      []
    )
  );
  weightsTabPresent = computed(
    () => this.report()?.weightsTabPresent ?? false,
    ...ngDevMode ? [{ debugName: "weightsTabPresent" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** Shown on the WEIGHTS tab so the count is visible without opening it. */
  weightsBadge = computed(
    () => {
      if (!this.weightsTabPresent())
        return null;
      const n = this.weightRows().filter((w) => w.status === "changed" || w.status === "new").length;
      return n ? String(n) : null;
    },
    ...ngDevMode ? [{ debugName: "weightsBadge" }] : (
      /* istanbul ignore next */
      []
    )
  );
  onCellEdit(r, raw) {
    const key = this.rowKey(r);
    const next = __spreadValues({}, this.edits());
    const n = Number(raw);
    if (raw.trim() === "" || Number.isNaN(n) || n === r.value) {
      delete next[key];
    } else {
      next[key] = n;
    }
    this.edits.set(next);
  }
  clearEdits() {
    this.edits.set({});
  }
  check() {
    this.submit("check");
  }
  load() {
    this.submit("load");
  }
  submit(action) {
    const file = this.file();
    if (!file)
      return;
    const n = this.nameOf();
    const body = new FormData();
    body.append("file", file, file.name);
    if (n.province)
      body.append("province", n.province);
    if (this.kind() === "sector") {
      if (n.sector)
        body.append("sector", n.sector);
      if (n.subsector)
        body.append("subsector", n.subsector);
      if (n.hazard)
        body.append("hazard", n.hazard);
    }
    const edits = this.edits();
    const keys = Object.keys(edits);
    if (keys.length) {
      body.append("edits", JSON.stringify(keys.map((k) => {
        const [period, dsCode, variableCode] = k.split("|");
        return { period, dsCode, variableCode, value: edits[k] };
      })));
    }
    this.busy.set(true);
    this.report.set(null);
    this.failure.set(null);
    this.http.post(`${this.base}/import/${action}`, body, { withCredentials: true }).subscribe({
      next: (r) => {
        this.report.set(r);
        this.busy.set(false);
        if (action === "load") {
          this.loadBatches();
          this.edits.set({});
          this.refreshStaleness();
        }
      },
      error: (err) => {
        this.failure.set(err?.status === 401 ? "You need to be signed in to import. The map is public; writing data is not." : err?.error?.detail ?? err?.message ?? "The import could not be completed.");
        this.busy.set(false);
      }
    });
  }
  refreshStaleness() {
    const province = this.nameOf().province;
    if (!province)
      return;
    this.http.get(`${this.base}/compute/status?province=${encodeURIComponent(province)}`, {
      withCredentials: true
    }).subscribe({ next: (s) => this.staleness.set(s), error: () => this.staleness.set(null) });
  }
  recompute() {
    const province = this.nameOf().province;
    const period = this.period() ?? this.periods()[0];
    if (!province || !period)
      return;
    this.recomputing.set(true);
    this.recomputeError.set(null);
    this.recomputeReport.set(null);
    this.http.post(`${this.base}/compute/run`, { province, period }, { withCredentials: true }).subscribe({
      next: (r) => {
        this.recomputeReport.set(r);
        this.recomputing.set(false);
        this.refreshStaleness();
      },
      error: (err) => {
        this.recomputeError.set(err?.error?.detail ?? err?.message ?? "The recompute could not be completed.");
        this.recomputing.set(false);
      }
    });
  }
  // ---- one loaded dataset ----------------------------------------------
  /**
   * Opening a batch shows what it actually wrote, not what the file said. The
   * two can differ -- a later import supersedes an earlier one -- and the
   * question being asked here is always "what is in the database now".
   *
   * EDITING IS OFF UNTIL IT IS TURNED ON. Every row is an editable number the
   * moment the table renders, and a table you can change by clicking in it is
   * a table you can change by accident. The toggle is the deliberate act.
   */
  openBatch(id) {
    if (this.openBatchId() === id) {
      this.closeBatch();
      return;
    }
    this.openBatchId.set(id);
    this.detail.set(null);
    this.detailError.set(null);
    this.editing.set(false);
    this.valueEdits.set({});
    this.correction.set(null);
    this.http.get(`${this.base}/import/batches/${id}`, { withCredentials: true }).subscribe({
      next: (d) => this.detail.set(d),
      error: (err) => this.detailError.set(err?.error?.detail ?? err?.message ?? "That import could not be opened.")
    });
  }
  closeBatch() {
    this.openBatchId.set(null);
    this.detail.set(null);
    this.editing.set(false);
    this.valueEdits.set({});
  }
  toggleEditing() {
    const on = !this.editing();
    this.editing.set(on);
    if (!on)
      this.valueEdits.set({});
  }
  /** A corrected cell is held apart from the row it came from, so "changed"
   * stays visible and Cancel is a discard rather than a reload. A value typed
   * back to what it already was is dropped rather than sent. */
  editValue(row, raw) {
    const n = Number(raw);
    const next = __spreadValues({}, this.valueEdits());
    if (raw.trim() === "" || Number.isNaN(n) || n === row.value)
      delete next[row.id];
    else
      next[row.id] = n;
    this.valueEdits.set(next);
  }
  saveCorrections() {
    const d = this.detail();
    const edits = this.valueEdits();
    const ids = Object.keys(edits);
    if (!d || ids.length === 0)
      return;
    this.saving.set(true);
    this.detailError.set(null);
    this.http.put(`${this.base}/import/batches/${d.id}/values`, { edits: ids.map((k) => ({ id: Number(k), value: edits[Number(k)] })) }, { withCredentials: true }).subscribe({
      next: (r) => {
        this.correction.set(r);
        this.saving.set(false);
        this.valueEdits.set({});
        this.editing.set(false);
        this.openBatchId.set(null);
        this.openBatch(d.id);
        this.refreshStaleness();
      },
      error: (err) => {
        this.detailError.set(err?.error?.detail ?? err?.message ?? "The corrections could not be saved.");
        this.saving.set(false);
      }
    });
  }
  /**
   * The server already scopes this list to the reader's own province, so for a
   * data officer or expert the province parameter changes nothing. It is here
   * for an administrator, who has no province of their own and would otherwise
   * face every province's imports at once: the scope picker above is what they
   * are already thinking in, so the list follows it.
   */
  loadBatches() {
    const province = this.nameOf().province;
    const q = province ? `?limit=15&province=${encodeURIComponent(province)}` : "?limit=15";
    this.closeBatch();
    this.http.get(`${this.base}/import/batches${q}`, { withCredentials: true }).subscribe({ next: (b) => this.batches.set(b), error: () => this.batches.set([]) });
  }
  static \u0275fac = function ImportPageComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ImportPageComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ImportPageComponent, selectors: [["app-import-page"]], decls: 63, vars: 22, consts: [[1, "import"], [1, "import__back", 3, "routerLink", "queryParams"], [1, "import__title"], ["role", "status", 1, "import__banner", "import__banner--error"], [1, "import__form", 3, "submit"], [1, "import__field"], ["name", "kind", 3, "ngModelChange", "ngModel"], ["value", "sector"], ["value", "climate"], ["name", "province", 3, "ngModelChange", "ngModel", "disabled"], [3, "ngValue"], [1, "import__note"], [1, "import__field", "import__field--file"], ["type", "file", "accept", ".xlsx", 3, "change"], [1, "import__actions"], ["type", "button", 3, "click", "disabled"], ["type", "button", 1, "import__primary", 3, "click", "disabled"], ["role", "status", 1, "import__banner"], ["role", "alert", 1, "import__banner", "import__banner--error"], [1, "import__report", 3, "import__report--bad"], [1, "recompute"], [1, "import__subtitle"], [1, "recompute__state", 3, "recompute__state--stale"], [1, "import__muted"], [1, "recompute__actions"], [1, "import__field", "import__field--inline"], ["name", "period", 3, "ngModelChange", "ngModel"], [1, "import__batches"], ["name", "sector", 3, "ngModelChange", "ngModel"], ["name", "subsector", 3, "ngModelChange", "ngModel", "disabled"], ["name", "hazard", 3, "ngModelChange", "ngModel"], [1, "import__report"], [1, "import__report-line"], [1, "import__errors"], [1, "import__warnings"], [1, "preview"], [1, "preview__head"], [1, "preview__tally"], [1, "preview__pill", "preview__pill--new"], [1, "preview__pill", "preview__pill--chg"], [1, "preview__pill", "preview__pill--edit"], ["mode", "preview", 3, "cellEdit", "cells", "tabs", "columns", "allDivisions", "allowAdd", "editable", "edits", "showWeightsTab", "weightsBadge"], ["weightsPanel", "", 3, "weights", "tabPresent", "scope"], [1, "preview__undo"], ["type", "button", 1, "preview__reset", 3, "click"], [1, "recompute__state"], [1, "recompute__done"], [1, "import__batchrow", 3, "click"], [1, "import__detailrow"], ["colspan", "7"], [1, "import__error"], [1, "import__detailhead"], ["type", "button"], ["type", "button", 3, "click"], ["mode", "stored", 3, "cells", "tabs", "columns", "allDivisions", "editable", "edits", "showWeightsTab"], ["mode", "stored", 3, "cellEdit", "cells", "tabs", "columns", "allDivisions", "editable", "edits", "showWeightsTab"], ["weightsPanel", "", "context", "stored", 3, "weights", "scope"]], template: function ImportPageComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "a", 1);
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "h2", 2);
      \u0275\u0275text(4, "Import raw data");
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(5, ImportPageComponent_Conditional_5_Template, 2, 1, "p", 3);
      \u0275\u0275elementStart(6, "form", 4);
      \u0275\u0275listener("submit", function ImportPageComponent_Template_form_submit_6_listener($event) {
        return $event.preventDefault();
      });
      \u0275\u0275elementStart(7, "label", 5)(8, "span");
      \u0275\u0275text(9, "Data type");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(10, "select", 6);
      \u0275\u0275listener("ngModelChange", function ImportPageComponent_Template_select_ngModelChange_10_listener($event) {
        return ctx.onKindChange($event);
      });
      \u0275\u0275elementStart(11, "option", 7);
      \u0275\u0275text(12, "Sector workbook");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(13, "option", 8);
      \u0275\u0275text(14, "Climate (whole province)");
      \u0275\u0275elementEnd()();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(15, "label", 5)(16, "span");
      \u0275\u0275text(17, "Province");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(18, "select", 9);
      \u0275\u0275listener("ngModelChange", function ImportPageComponent_Template_select_ngModelChange_18_listener($event) {
        return ctx.province.set($event);
      });
      \u0275\u0275repeaterCreate(19, ImportPageComponent_For_20_Template, 2, 2, "option", 10, _forTrack03);
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(21, ImportPageComponent_Conditional_21_Template, 18, 4);
      \u0275\u0275conditionalCreate(22, ImportPageComponent_Conditional_22_Template, 2, 0, "p", 11);
      \u0275\u0275elementStart(23, "label", 12)(24, "span");
      \u0275\u0275text(25, "Workbook");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(26, "input", 13);
      \u0275\u0275listener("change", function ImportPageComponent_Template_input_change_26_listener($event) {
        return ctx.onFileSelected($event);
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(27, "div", 14)(28, "button", 15);
      \u0275\u0275listener("click", function ImportPageComponent_Template_button_click_28_listener() {
        return ctx.check();
      });
      \u0275\u0275text(29, "Check only");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(30, "button", 16);
      \u0275\u0275listener("click", function ImportPageComponent_Template_button_click_30_listener() {
        return ctx.load();
      });
      \u0275\u0275text(31, " Import ");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(32, "p", 11)(33, "strong");
      \u0275\u0275text(34, "Check");
      \u0275\u0275elementEnd();
      \u0275\u0275text(35, " runs exactly what ");
      \u0275\u0275elementStart(36, "strong");
      \u0275\u0275text(37, "Import");
      \u0275\u0275elementEnd();
      \u0275\u0275text(38, " runs and stops before writing, so what it reports is what will happen. The sector and hazard above are compared against the workbook's own record of which profile it is for \u2014 a mismatch is refused rather than loaded. Nothing loads partially: any error means the file loaded nothing. ");
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(39, ImportPageComponent_Conditional_39_Template, 2, 0, "p", 17);
      \u0275\u0275conditionalCreate(40, ImportPageComponent_Conditional_40_Template, 2, 1, "p", 18);
      \u0275\u0275conditionalCreate(41, ImportPageComponent_Conditional_41_Template, 11, 10, "section", 19);
      \u0275\u0275conditionalCreate(42, ImportPageComponent_Conditional_42_Template, 1, 1);
      \u0275\u0275elementStart(43, "section", 20)(44, "h3", 21);
      \u0275\u0275text(45, "Published scores");
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(46, ImportPageComponent_Conditional_46_Template, 3, 4, "p", 22)(47, ImportPageComponent_Conditional_47_Template, 2, 0, "p", 23);
      \u0275\u0275elementStart(48, "div", 24)(49, "label", 25)(50, "span");
      \u0275\u0275text(51, "Period");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(52, "select", 26);
      \u0275\u0275listener("ngModelChange", function ImportPageComponent_Template_select_ngModelChange_52_listener($event) {
        return ctx.period.set($event);
      });
      \u0275\u0275repeaterCreate(53, ImportPageComponent_For_54_Template, 2, 2, "option", 10, \u0275\u0275repeaterTrackByIdentity);
      \u0275\u0275elementEnd();
      \u0275\u0275controlCreate();
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(55, "button", 15);
      \u0275\u0275listener("click", function ImportPageComponent_Template_button_click_55_listener() {
        return ctx.recompute();
      });
      \u0275\u0275text(56);
      \u0275\u0275elementEnd()();
      \u0275\u0275conditionalCreate(57, ImportPageComponent_Conditional_57_Template, 2, 1, "p", 18);
      \u0275\u0275conditionalCreate(58, ImportPageComponent_Conditional_58_Template, 3, 6);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(59, "h3", 21);
      \u0275\u0275text(60, "Recent imports");
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(61, ImportPageComponent_Conditional_61_Template, 2, 0, "p", 23)(62, ImportPageComponent_Conditional_62_Template, 20, 0, "table", 27);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_15_0;
      let tmp_16_0;
      let tmp_17_0;
      let tmp_18_0;
      let tmp_24_0;
      let tmp_25_0;
      \u0275\u0275advance();
      \u0275\u0275property("routerLink", ctx.backTarget())("queryParams", ctx.backParams());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1("\u2190 ", ctx.backLabel());
      \u0275\u0275advance(3);
      \u0275\u0275conditional(ctx.taxonomyError() ? 5 : -1);
      \u0275\u0275advance(5);
      \u0275\u0275property("ngModel", ctx.kind());
      \u0275\u0275control();
      \u0275\u0275advance(8);
      \u0275\u0275property("ngModel", ctx.province())("disabled", ctx.provinceLocked());
      \u0275\u0275control();
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.provinces());
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.kind() === "sector" ? 21 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.kind() === "climate" ? 22 : -1);
      \u0275\u0275advance(6);
      \u0275\u0275property("disabled", !ctx.canSubmit());
      \u0275\u0275advance(2);
      \u0275\u0275property("disabled", !ctx.canSubmit());
      \u0275\u0275advance(9);
      \u0275\u0275conditional(ctx.busy() ? 39 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_15_0 = ctx.failure()) ? 40 : -1, tmp_15_0);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_16_0 = ctx.report()) ? 41 : -1, tmp_16_0);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_17_0 = ctx.report()) ? 42 : -1, tmp_17_0);
      \u0275\u0275advance(4);
      \u0275\u0275conditional((tmp_18_0 = ctx.staleness()) ? 46 : 47, tmp_18_0);
      \u0275\u0275advance(6);
      \u0275\u0275property("ngModel", ctx.period() ?? ctx.collectionPeriods()[0]);
      \u0275\u0275control();
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.collectionPeriods());
      \u0275\u0275advance(2);
      \u0275\u0275property("disabled", ctx.recomputing() || !ctx.province());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.recomputing() ? "Recomputing\u2026" : "Recompute this province", " ");
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_24_0 = ctx.recomputeError()) ? 57 : -1, tmp_24_0);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_25_0 = ctx.recomputeReport()) ? 58 : -1, tmp_25_0);
      \u0275\u0275advance(3);
      \u0275\u0275conditional(ctx.batches().length === 0 ? 61 : 62);
    }
  }, dependencies: [FormsModule, \u0275NgNoValidate, NgSelectOption, \u0275NgSelectMultipleOption, SelectControlValueAccessor, NgControlStatus, NgControlStatusGroup, NgModel, NgForm, RouterLink, WorkbookGridComponent, WeightsConfirmComponent, DatePipe], styles: ["\n.import__back[_ngcontent-%COMP%] {\n  display: inline-block;\n  margin: 0 0 0.6rem;\n  font-size: 0.82rem;\n  color: #1864ab;\n  text-decoration: none;\n}\n.import__back[_ngcontent-%COMP%]:hover {\n  text-decoration: underline;\n}\n.import[_ngcontent-%COMP%] {\n  padding: 1rem 1.25rem;\n  max-width: 60rem;\n}\n.import__title[_ngcontent-%COMP%] {\n  margin: 0 0 0.75rem;\n  font-size: 1.15rem;\n}\n.import__subtitle[_ngcontent-%COMP%] {\n  margin: 1.75rem 0 0.5rem;\n  font-size: 1rem;\n}\n.import__form[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.75rem 1rem;\n  align-items: flex-end;\n}\n.import__field[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.8rem;\n}\n.import__field[_ngcontent-%COMP%]   select[_ngcontent-%COMP%], \n.import__field[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  padding: 0.35rem 0.5rem;\n}\n.import__field--file[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  padding: 0.2rem 0;\n}\n.import__actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n}\n.import__actions[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  padding: 0.4rem 0.9rem;\n  cursor: pointer;\n}\n.import__actions[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:disabled {\n  cursor: not-allowed;\n  opacity: 0.5;\n}\n.import__primary[_ngcontent-%COMP%] {\n  font-weight: 600;\n}\n.import__note[_ngcontent-%COMP%] {\n  margin: 0.9rem 0 0;\n  font-size: 0.78rem;\n  line-height: 1.5;\n  color: #495057;\n  max-width: 52rem;\n}\n.import__banner[_ngcontent-%COMP%] {\n  margin: 0.9rem 0 0;\n  padding: 0.5rem 0.7rem;\n  background: #f1f3f5;\n  font-size: 0.85rem;\n}\n.import__banner--error[_ngcontent-%COMP%] {\n  background: #fff0f0;\n  color: #8d1a1e;\n}\n.import__report[_ngcontent-%COMP%] {\n  margin-top: 1rem;\n  padding: 0.75rem 0.9rem;\n  background: #f4f7f4;\n  border-left: 4px solid #2b8a3e;\n}\n.import__report--bad[_ngcontent-%COMP%] {\n  background: #fff0f0;\n  border-left-color: #8d1a1e;\n}\n.import__report[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0 0 0.35rem;\n  font-size: 0.95rem;\n}\n.import__report-line[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 0.82rem;\n  color: #343a40;\n}\n.import__errors[_ngcontent-%COMP%] {\n  margin: 0.6rem 0 0;\n  padding-left: 1.1rem;\n  font-size: 0.8rem;\n}\n.import__errors[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n  margin-bottom: 0.2rem;\n}\n.import__warnings[_ngcontent-%COMP%] {\n  margin-top: 0.6rem;\n  font-size: 0.78rem;\n  color: #495057;\n}\n.import__batches[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.78rem;\n}\n.import__batches[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.import__batches[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  text-align: left;\n  padding: 0.3rem 0.5rem;\n  border-bottom: 1px solid #e9ecef;\n}\n.import__row--bad[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  color: #8d1a1e;\n}\n.import__muted[_ngcontent-%COMP%] {\n  font-size: 0.82rem;\n  color: #868e96;\n}\n.preview[_ngcontent-%COMP%] {\n  margin: 1.4rem 0 0;\n}\n.preview__head[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem 1rem;\n  align-items: baseline;\n}\n.preview__head[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1rem;\n}\n.preview__tally[_ngcontent-%COMP%] {\n  margin: 0;\n  display: flex;\n  gap: 0.4rem;\n  flex-wrap: wrap;\n}\n.preview__pill[_ngcontent-%COMP%] {\n  font-size: 0.72rem;\n  padding: 0.12rem 0.45rem;\n  border-radius: 3px;\n  white-space: nowrap;\n}\n.preview__pill--new[_ngcontent-%COMP%] {\n  background: #e7f5ff;\n  color: #1864ab;\n}\n.preview__pill--chg[_ngcontent-%COMP%] {\n  background: #fff4e6;\n  color: #a15c07;\n}\n.preview__pill--edit[_ngcontent-%COMP%] {\n  background: #f3f0ff;\n  color: #5f3dc4;\n}\n.preview__controls[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem;\n  align-items: center;\n  margin: 0.7rem 0;\n}\n.preview__search[_ngcontent-%COMP%] {\n  flex: 1 1 16rem;\n  padding: 0.32rem 0.5rem;\n  font: inherit;\n  font-size: 0.85rem;\n}\n.preview__toggle[_ngcontent-%COMP%] {\n  display: inline-flex;\n  gap: 0.35rem;\n  align-items: center;\n  font-size: 0.82rem;\n}\n.preview__reset[_ngcontent-%COMP%] {\n  font: inherit;\n  font-size: 0.78rem;\n  padding: 0.25rem 0.55rem;\n  cursor: pointer;\n  background: #f8f0ff;\n  border: 1px solid #d0bfff;\n  border-radius: 3px;\n  color: #5f3dc4;\n}\n.preview__scroll[_ngcontent-%COMP%] {\n  max-height: 26rem;\n  overflow: auto;\n  border: 1px solid #dee2e6;\n}\n.preview__table[_ngcontent-%COMP%] {\n  border-collapse: collapse;\n  width: 100%;\n  font-size: 0.82rem;\n}\n.preview__table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  position: sticky;\n  top: 0;\n  z-index: 1;\n  background: #f1f3f5;\n  text-align: left;\n  padding: 0.35rem 0.5rem;\n  border-bottom: 1px solid #dee2e6;\n  font-weight: 600;\n}\n.preview__table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.22rem 0.5rem;\n  border-bottom: 1px solid #f1f3f5;\n}\n.preview__num[_ngcontent-%COMP%] {\n  text-align: right;\n  font-variant-numeric: tabular-nums;\n}\n.preview__muted[_ngcontent-%COMP%] {\n  color: #868e96;\n}\n.preview__code[_ngcontent-%COMP%] {\n  color: #adb5bd;\n  font-size: 0.72rem;\n}\n.preview__var[_ngcontent-%COMP%] {\n  font-family:\n    ui-monospace,\n    SFMono-Regular,\n    Menlo,\n    monospace;\n  font-size: 0.74rem;\n}\n.preview__input[_ngcontent-%COMP%] {\n  width: 7rem;\n  text-align: right;\n  font: inherit;\n  font-size: 0.82rem;\n  padding: 0.12rem 0.3rem;\n  border: 1px solid transparent;\n  background: transparent;\n}\n.preview__input[_ngcontent-%COMP%]:hover, \n.preview__input[_ngcontent-%COMP%]:focus {\n  border-color: #ced4da;\n  background: #fff;\n}\n.preview__input--edited[_ngcontent-%COMP%] {\n  border-color: #b197fc;\n  background: #f8f0ff;\n  font-weight: 600;\n}\n.preview__row--edited[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  background: #fcfaff;\n}\n.recompute[_ngcontent-%COMP%] {\n  margin: 1.6rem 0 0;\n  padding-top: 1rem;\n  border-top: 1px solid #e9ecef;\n}\n.recompute__state[_ngcontent-%COMP%] {\n  margin: 0 0 0.6rem;\n  font-size: 0.85rem;\n  color: #495057;\n}\n.recompute__state--stale[_ngcontent-%COMP%] {\n  color: #a15c07;\n  font-weight: 600;\n}\n.recompute__actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.75rem;\n  align-items: flex-end;\n  flex-wrap: wrap;\n}\n.recompute__done[_ngcontent-%COMP%] {\n  margin: 0.6rem 0 0;\n  font-size: 0.85rem;\n  color: #2f9e44;\n}\n.import__field--inline[_ngcontent-%COMP%] {\n  margin: 0;\n}\n.import__batchrow[_ngcontent-%COMP%] {\n  cursor: pointer;\n}\n.import__batchrow[_ngcontent-%COMP%]:hover   td[_ngcontent-%COMP%] {\n  background: #f6f7f9;\n}\n.import__row--open[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  background: #eef1f6;\n}\n.import__detailrow[_ngcontent-%COMP%]    > td[_ngcontent-%COMP%] {\n  padding: 0.8rem 1rem 1.1rem;\n  background: #fbfcfd;\n}\n.import__detailhead[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem;\n  align-items: center;\n  margin-bottom: 0.6rem;\n  font-size: 0.8rem;\n}\n.import__detailhead[_ngcontent-%COMP%]   input[type=search][_ngcontent-%COMP%] {\n  flex: 1 1 14rem;\n  min-width: 10rem;\n  padding: 0.3rem 0.5rem;\n}\n.import__detailscroll[_ngcontent-%COMP%] {\n  max-height: 26rem;\n  overflow: auto;\n}\n.import__detailscroll[_ngcontent-%COMP%]   input[type=number][_ngcontent-%COMP%] {\n  width: 8rem;\n  padding: 0.2rem 0.35rem;\n}\n.import__error[_ngcontent-%COMP%] {\n  margin: 0.4rem 0;\n  font-size: 0.8rem;\n  color: #a4243b;\n}\n/*# sourceMappingURL=import-page.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ImportPageComponent, [{
    type: Component,
    args: [{ selector: "app-import-page", standalone: true, imports: [FormsModule, DatePipe, RouterLink, WorkbookGridComponent, WeightsConfirmComponent], template: `<div class="import">
  <a class="import__back" [routerLink]="backTarget()" [queryParams]="backParams()"
    >&larr; {{ backLabel() }}</a
  >
  <h2 class="import__title">Import raw data</h2>

  @if (taxonomyError()) {
    <p class="import__banner import__banner--error" role="status">
      Filter options could not be loaded, so no scope can be chosen yet. {{ taxonomyError() }}
    </p>
  }

  <form class="import__form" (submit)="$event.preventDefault()">
    <label class="import__field">
      <span>Data type</span>
      <select [ngModel]="kind()" name="kind" (ngModelChange)="onKindChange($event)">
        <option value="sector">Sector workbook</option>
        <option value="climate">Climate (whole province)</option>
      </select>
    </label>

    <label class="import__field">
      <span>Province</span>
      <select
        [ngModel]="province()"
        name="province"
        [disabled]="provinceLocked()"
        (ngModelChange)="province.set($event)"
      >
        @for (p of provinces(); track p.code) {
          <option [ngValue]="p.code">{{ p.name }}</option>
        }
      </select>
    </label>

    @if (kind() === 'sector') {
    <label class="import__field">
      <span>Sector</span>
      <select [ngModel]="sector()" name="sector" (ngModelChange)="onSectorChange($event)">
        @for (s of sectors(); track s.code) {
          <option [ngValue]="s.code">{{ s.name }}</option>
        }
      </select>
    </label>

    <label class="import__field">
      <span>Subsector</span>
      <select
        [ngModel]="subsector()"
        name="subsector"
        [disabled]="subsectorOptions().length === 0"
        (ngModelChange)="onSubsectorChange($event)"
      >
        @for (s of subsectorOptions(); track s.code) {
          <option [ngValue]="s.code">{{ s.name }}</option>
        }
      </select>
    </label>

    <label class="import__field">
      <span>Hazard</span>
      <select [ngModel]="hazard()" name="hazard" (ngModelChange)="hazard.set($event)">
        @for (h of hazards(); track h.code) {
          <option [ngValue]="h.code">{{ h.name }}</option>
        }
      </select>
    </label>
    }

    @if (kind() === 'climate') {
      <p class="import__note">
        Climate variables belong to the division and the period, not to a sector &mdash; the same
        rainfall is read by every sector. They are collected once per province, by the officer who
        owns them, so that no sector import can overwrite them. Importing this file needs the
        hazard-data grant.
      </p>
    }

    <label class="import__field import__field--file">
      <span>Workbook</span>
      <input type="file" accept=".xlsx" (change)="onFileSelected($event)" />
    </label>

    <div class="import__actions">
      <button type="button" [disabled]="!canSubmit()" (click)="check()">Check only</button>
      <button type="button" class="import__primary" [disabled]="!canSubmit()" (click)="load()">
        Import
      </button>
    </div>
  </form>

  <p class="import__note">
    <strong>Check</strong> runs exactly what <strong>Import</strong> runs and stops before writing,
    so what it reports is what will happen. The sector and hazard above are compared against the
    workbook's own record of which profile it is for \u2014 a mismatch is refused rather than loaded.
    Nothing loads partially: any error means the file loaded nothing.
  </p>

  @if (busy()) {
    <p class="import__banner" role="status">Working\u2026</p>
  }

  @if (failure(); as message) {
    <p class="import__banner import__banner--error" role="alert">{{ message }}</p>
  }

  @if (report(); as r) {
    <section class="import__report" [class.import__report--bad]="!r.ok">
      <h3>
        {{ r.ok ? (r.dryRun ? 'Check passed' : 'Imported') : 'Refused \u2014 nothing was loaded' }}
      </h3>
      <p class="import__report-line">
        {{ r.filename }}
        @if (r.profileCode) {
          \xB7 profile {{ r.profileCode }}
        }
        \xB7 {{ r.valuesRead }} values read
        @if (!r.dryRun && r.ok) {
          \xB7 {{ r.valuesLoaded }} loaded across {{ r.divisions }} divisions
        }
        @if (r.dryRun && r.ok) {
          \xB7 {{ r.divisions }} divisions matched \u2014 nothing written
        }
      </p>

      @if (r.errors.length) {
        <ul class="import__errors">
          @for (e of r.errors; track e) {
            <li>{{ e }}</li>
          }
        </ul>
      }

      @if (r.warnings.length) {
        <details class="import__warnings">
          <summary>{{ r.warnings.length }} note(s) about how this file was read</summary>
          <ul>
            @for (w of r.warnings; track w) {
              <li>{{ w }}</li>
            }
          </ul>
        </details>
      }
    </section>
  }

  <!-- REVIEW BEFORE WRITING. A count tells an officer how much will be written
       but never what, and "451 values loaded" reads identically whether the
       file is right or a column is shifted by one. -->
  @if (report(); as r) {
    @if (r.dryRun && r.ok && previewRows().length) {
      <section class="preview">
        <div class="preview__head">
          <h3>Review the {{ previewRows().length }} values before importing</h3>
          <p class="preview__tally">
            <span class="preview__pill preview__pill--new">{{ newCount() }} new</span>
            <span class="preview__pill preview__pill--chg">{{ changedCount() }} change existing</span>
            @if (editCount()) {
              <span class="preview__pill preview__pill--edit">{{ editCount() }} corrected here</span>
            }
          </p>
        </div>

        <app-workbook-grid
          [cells]="previewCells()"
          [tabs]="workbookTabs()"
          [columns]="workbookColumns()"
          [allDivisions]="workbookDivisions()"
          [allowAdd]="true"
          mode="preview"
          [editable]="true"
          [edits]="edits()"
          [showWeightsTab]="true"
          [weightsBadge]="weightsBadge()"
          (cellEdit)="onPreviewGridEdit($event)"
        >
          <app-weights-confirm
            weightsPanel
            [weights]="weightRows()"
            [tabPresent]="weightsTabPresent()"
            [scope]="importScope()"
          />
        </app-workbook-grid>

        @if (editCount()) {
          <p class="preview__undo">
            <button type="button" class="preview__reset" (click)="clearEdits()">
              Undo my {{ editCount() }} correction(s)
            </button>
          </p>
        }

        <p class="import__note">
          A correction here replaces the workbook's number for that cell and is recorded against the
          value as a correction, so the workbook stays the record of what was submitted. It cannot
          add a value the file did not carry. Press <strong>Import</strong> to write these numbers.
        </p>
        <div class="import__actions">
          <button type="button" class="import__primary" [disabled]="!canSubmit()" (click)="load()">
            Import these {{ previewRows().length }} values
          </button>
        </div>
      </section>
    }
  }

  <!-- The map reads computed results, not values, so an import changes nothing
       a person can see until the engine runs. -->
  <section class="recompute">
    <h3 class="import__subtitle">Published scores</h3>
    @if (staleness(); as st) {
      <p class="recompute__state" [class.recompute__state--stale]="st.stale">
        {{ st.reason }}.
        @if (st.lastComputed) {
          Last computed {{ st.lastComputed | date: 'short' }}.
        }
      </p>
    } @else {
      <p class="import__muted">Score status unavailable \u2014 sign in to see it.</p>
    }

    <div class="recompute__actions">
      <label class="import__field import__field--inline">
        <span>Period</span>
        <select [ngModel]="period() ?? collectionPeriods()[0]" name="period" (ngModelChange)="period.set($event)">
          @for (p of collectionPeriods(); track p) {
            <option [ngValue]="p">{{ p }}</option>
          }
        </select>
      </label>
      <button type="button" [disabled]="recomputing() || !province()" (click)="recompute()">
        {{ recomputing() ? 'Recomputing\u2026' : 'Recompute this province' }}
      </button>
    </div>

    @if (recomputeError(); as m) {
      <p class="import__banner import__banner--error" role="alert">{{ m }}</p>
    }
    @if (recomputeReport(); as rr) {
      <p class="recompute__done">
        {{ rr.computed }} profile(s) computed, {{ rr.refused }} refused, {{ rr.resultRows }} result
        rows for {{ rr.province }} {{ rr.period }}.
      </p>
      @if (rr.refused) {
        <details class="import__warnings">
          <summary>{{ rr.refused }} profile(s) could not be scored</summary>
          <ul>
            @for (p of rr.profiles; track p.profileCode) {
              @if (!p.ok) {
                <li>{{ p.refusal }}</li>
              }
            }
          </ul>
        </details>
      }
    }
  </section>

  <h3 class="import__subtitle">Recent imports</h3>
  @if (batches().length === 0) {
    <p class="import__muted">Nothing imported yet, or you are not signed in.</p>
  } @else {
    <table class="import__batches">
      <thead>
        <tr><th>File</th><th>Profile</th><th>Status</th><th>Read</th><th>Loaded</th><th>Errors</th><th>When</th></tr>
      </thead>
      <tbody>
        @for (b of batches(); track b.id) {
          <tr
            class="import__batchrow"
            [class.import__row--bad]="b.status === 'rejected'"
            [class.import__row--open]="openBatchId() === b.id"
            (click)="openBatch(b.id)"
          >
            <td>{{ b.filename }}</td>
            <td>{{ b.profileCode ?? '\u2014' }}</td>
            <td>{{ b.status }}</td>
            <td>{{ b.rowsTotal ?? '\u2014' }}</td>
            <td>{{ b.rowsLoaded ?? '\u2014' }}</td>
            <td>{{ b.errorCount }}</td>
            <td>{{ b.uploadedAt | date: 'short' }}</td>
          </tr>
          @if (openBatchId() === b.id) {
            <tr class="import__detailrow">
              <td colspan="7">
                @if (detailError()) {
                  <p class="import__error">{{ detailError() }}</p>
                }
                @if (!detail() && !detailError()) {
                  <p class="import__muted">Opening\u2026</p>
                }
                @if (detail(); as d) {
                  <div class="import__detailhead">
                    <span>
                      <strong>{{ d.values.length }}</strong> values
                      @if (d.province) { in {{ d.province }} }
                      @if (d.uploadedBy) { \xB7 uploaded by {{ d.uploadedBy }} }
                    </span>
                    @if (d.editable) {
                      <button type="button" (click)="toggleEditing()">
                        {{ editing() ? 'Cancel editing' : 'Turn on editing' }}
                      </button>
                    } @else {
                      <span class="import__muted">
                        Read only \u2014 correcting this needs the grant that covers uploading it.
                      </span>
                    }
                    <button type="button" (click)="closeBatch()">Close</button>
                  </div>

                  @if (editing()) {
                    <p class="import__muted">
                      Change a number and save. An edit corrects a value this import wrote; it
                      cannot add one the file did not carry. The map keeps its current scores
                      until the province is recomputed.
                    </p>
                  }

                  @if (d.values.length === 0) {
                    <p class="import__muted">This import wrote no values.</p>
                  } @else {
                    <!-- The same grid the review screen uses, in \`stored\` mode:
                         these values ARE what is in the database, so there is
                         nothing to diff them against and none of them is new. -->
                    <app-workbook-grid
                      [cells]="detailCells()"
                      [tabs]="storedTabs()"
                      [columns]="storedColumns()"
                      [allDivisions]="storedDivisions()"
                      mode="stored"
                      [editable]="editing()"
                      [edits]="detailEditsByKey()"
                      [showWeightsTab]="true"
                      (cellEdit)="onDetailGridEdit($event)"
                    >
                      <app-weights-confirm
                        weightsPanel
                        context="stored"
                        [weights]="[]"
                        [scope]="importScope()"
                      />
                    </app-workbook-grid>
                  }

                  @if (editing()) {
                    <div class="import__detailhead">
                      <button
                        type="button"
                        [disabled]="valueEditCount() === 0 || saving()"
                        (click)="saveCorrections()"
                      >
                        {{ saving() ? 'Saving\u2026' : 'Save ' + valueEditCount() + ' correction(s)' }}
                      </button>
                    </div>
                  }

                  @if (correction(); as c) {
                    <p class="import__note">
                      {{ c.updated }} value(s) corrected.
                      @if (c.recomputeNeeded) {
                        The published scores still reflect the old numbers \u2014 recompute
                        {{ c.province ?? 'the province' }} above to update the map.
                      }
                    </p>
                  }
                }
              </td>
            </tr>
          }
        }
      </tbody>
    </table>
  }
</div>
`, styles: ["/* src/app/features/import/import-page.component.scss */\n.import__back {\n  display: inline-block;\n  margin: 0 0 0.6rem;\n  font-size: 0.82rem;\n  color: #1864ab;\n  text-decoration: none;\n}\n.import__back:hover {\n  text-decoration: underline;\n}\n.import {\n  padding: 1rem 1.25rem;\n  max-width: 60rem;\n}\n.import__title {\n  margin: 0 0 0.75rem;\n  font-size: 1.15rem;\n}\n.import__subtitle {\n  margin: 1.75rem 0 0.5rem;\n  font-size: 1rem;\n}\n.import__form {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.75rem 1rem;\n  align-items: flex-end;\n}\n.import__field {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.8rem;\n}\n.import__field select,\n.import__field input {\n  padding: 0.35rem 0.5rem;\n}\n.import__field--file input {\n  padding: 0.2rem 0;\n}\n.import__actions {\n  display: flex;\n  gap: 0.5rem;\n}\n.import__actions button {\n  padding: 0.4rem 0.9rem;\n  cursor: pointer;\n}\n.import__actions button:disabled {\n  cursor: not-allowed;\n  opacity: 0.5;\n}\n.import__primary {\n  font-weight: 600;\n}\n.import__note {\n  margin: 0.9rem 0 0;\n  font-size: 0.78rem;\n  line-height: 1.5;\n  color: #495057;\n  max-width: 52rem;\n}\n.import__banner {\n  margin: 0.9rem 0 0;\n  padding: 0.5rem 0.7rem;\n  background: #f1f3f5;\n  font-size: 0.85rem;\n}\n.import__banner--error {\n  background: #fff0f0;\n  color: #8d1a1e;\n}\n.import__report {\n  margin-top: 1rem;\n  padding: 0.75rem 0.9rem;\n  background: #f4f7f4;\n  border-left: 4px solid #2b8a3e;\n}\n.import__report--bad {\n  background: #fff0f0;\n  border-left-color: #8d1a1e;\n}\n.import__report h3 {\n  margin: 0 0 0.35rem;\n  font-size: 0.95rem;\n}\n.import__report-line {\n  margin: 0;\n  font-size: 0.82rem;\n  color: #343a40;\n}\n.import__errors {\n  margin: 0.6rem 0 0;\n  padding-left: 1.1rem;\n  font-size: 0.8rem;\n}\n.import__errors li {\n  margin-bottom: 0.2rem;\n}\n.import__warnings {\n  margin-top: 0.6rem;\n  font-size: 0.78rem;\n  color: #495057;\n}\n.import__batches {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.78rem;\n}\n.import__batches th,\n.import__batches td {\n  text-align: left;\n  padding: 0.3rem 0.5rem;\n  border-bottom: 1px solid #e9ecef;\n}\n.import__row--bad td {\n  color: #8d1a1e;\n}\n.import__muted {\n  font-size: 0.82rem;\n  color: #868e96;\n}\n.preview {\n  margin: 1.4rem 0 0;\n}\n.preview__head {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem 1rem;\n  align-items: baseline;\n}\n.preview__head h3 {\n  margin: 0;\n  font-size: 1rem;\n}\n.preview__tally {\n  margin: 0;\n  display: flex;\n  gap: 0.4rem;\n  flex-wrap: wrap;\n}\n.preview__pill {\n  font-size: 0.72rem;\n  padding: 0.12rem 0.45rem;\n  border-radius: 3px;\n  white-space: nowrap;\n}\n.preview__pill--new {\n  background: #e7f5ff;\n  color: #1864ab;\n}\n.preview__pill--chg {\n  background: #fff4e6;\n  color: #a15c07;\n}\n.preview__pill--edit {\n  background: #f3f0ff;\n  color: #5f3dc4;\n}\n.preview__controls {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem;\n  align-items: center;\n  margin: 0.7rem 0;\n}\n.preview__search {\n  flex: 1 1 16rem;\n  padding: 0.32rem 0.5rem;\n  font: inherit;\n  font-size: 0.85rem;\n}\n.preview__toggle {\n  display: inline-flex;\n  gap: 0.35rem;\n  align-items: center;\n  font-size: 0.82rem;\n}\n.preview__reset {\n  font: inherit;\n  font-size: 0.78rem;\n  padding: 0.25rem 0.55rem;\n  cursor: pointer;\n  background: #f8f0ff;\n  border: 1px solid #d0bfff;\n  border-radius: 3px;\n  color: #5f3dc4;\n}\n.preview__scroll {\n  max-height: 26rem;\n  overflow: auto;\n  border: 1px solid #dee2e6;\n}\n.preview__table {\n  border-collapse: collapse;\n  width: 100%;\n  font-size: 0.82rem;\n}\n.preview__table th {\n  position: sticky;\n  top: 0;\n  z-index: 1;\n  background: #f1f3f5;\n  text-align: left;\n  padding: 0.35rem 0.5rem;\n  border-bottom: 1px solid #dee2e6;\n  font-weight: 600;\n}\n.preview__table td {\n  padding: 0.22rem 0.5rem;\n  border-bottom: 1px solid #f1f3f5;\n}\n.preview__num {\n  text-align: right;\n  font-variant-numeric: tabular-nums;\n}\n.preview__muted {\n  color: #868e96;\n}\n.preview__code {\n  color: #adb5bd;\n  font-size: 0.72rem;\n}\n.preview__var {\n  font-family:\n    ui-monospace,\n    SFMono-Regular,\n    Menlo,\n    monospace;\n  font-size: 0.74rem;\n}\n.preview__input {\n  width: 7rem;\n  text-align: right;\n  font: inherit;\n  font-size: 0.82rem;\n  padding: 0.12rem 0.3rem;\n  border: 1px solid transparent;\n  background: transparent;\n}\n.preview__input:hover,\n.preview__input:focus {\n  border-color: #ced4da;\n  background: #fff;\n}\n.preview__input--edited {\n  border-color: #b197fc;\n  background: #f8f0ff;\n  font-weight: 600;\n}\n.preview__row--edited td {\n  background: #fcfaff;\n}\n.recompute {\n  margin: 1.6rem 0 0;\n  padding-top: 1rem;\n  border-top: 1px solid #e9ecef;\n}\n.recompute__state {\n  margin: 0 0 0.6rem;\n  font-size: 0.85rem;\n  color: #495057;\n}\n.recompute__state--stale {\n  color: #a15c07;\n  font-weight: 600;\n}\n.recompute__actions {\n  display: flex;\n  gap: 0.75rem;\n  align-items: flex-end;\n  flex-wrap: wrap;\n}\n.recompute__done {\n  margin: 0.6rem 0 0;\n  font-size: 0.85rem;\n  color: #2f9e44;\n}\n.import__field--inline {\n  margin: 0;\n}\n.import__batchrow {\n  cursor: pointer;\n}\n.import__batchrow:hover td {\n  background: #f6f7f9;\n}\n.import__row--open td {\n  background: #eef1f6;\n}\n.import__detailrow > td {\n  padding: 0.8rem 1rem 1.1rem;\n  background: #fbfcfd;\n}\n.import__detailhead {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem;\n  align-items: center;\n  margin-bottom: 0.6rem;\n  font-size: 0.8rem;\n}\n.import__detailhead input[type=search] {\n  flex: 1 1 14rem;\n  min-width: 10rem;\n  padding: 0.3rem 0.5rem;\n}\n.import__detailscroll {\n  max-height: 26rem;\n  overflow: auto;\n}\n.import__detailscroll input[type=number] {\n  width: 8rem;\n  padding: 0.2rem 0.35rem;\n}\n.import__error {\n  margin: 0.4rem 0;\n  font-size: 0.8rem;\n  color: #a4243b;\n}\n/*# sourceMappingURL=import-page.component.css.map */\n"] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ImportPageComponent, { className: "ImportPageComponent", filePath: "src/app/features/import/import-page.component.ts", lineNumber: 197 });
})();
export {
  ImportPageComponent
};
//# debugId=343a3ab1-73ec-5433-825e-ba40f21de979
//# sourceMappingURL=chunk-GRPWQNOL.js.map
