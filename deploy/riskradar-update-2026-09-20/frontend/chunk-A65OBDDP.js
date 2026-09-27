import {
  PERIODS
} from "./chunk-HN3O3DC2.js";
import {
  TaxonomyService
} from "./chunk-BK36RS6Q.js";
import {
  RouterLink
} from "./chunk-UFWDULIL.js";
import {
  FormsModule,
  NgSelectOption,
  ɵNgSelectMultipleOption
} from "./chunk-4UD6LJ7E.js";
import {
  Component,
  HttpClient,
  computed,
  environment,
  inject,
  setClassMetadata,
  signal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinterpolate1,
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
  ɵɵtextInterpolate2,
  ɵɵtextInterpolate3,
  ɵɵtextInterpolate5
} from "./chunk-SAQOEXKZ.js";

// src/app/features/coverage/coverage-page.component.ts
var _forTrack0 = ($index, $item) => $item.code;
var _forTrack1 = ($index, $item) => $item[0];
var _forTrack2 = ($index, $item) => $item.profileCode;
var _forTrack3 = ($index, $item) => $item.variableCode;
function CoveragePageComponent_For_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r1 = ctx.$implicit;
    \u0275\u0275property("value", p_r1.name);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(p_r1.name);
  }
}
function CoveragePageComponent_For_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r2 = ctx.$implicit;
    \u0275\u0275property("value", p_r2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(p_r2);
  }
}
function CoveragePageComponent_Conditional_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function CoveragePageComponent_Conditional_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275text(1, "Choose a province to see where its data stands.");
    \u0275\u0275elementEnd();
  }
}
function CoveragePageComponent_Conditional_25_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const t_r3 = ctx.$implicit;
    \u0275\u0275classMap(\u0275\u0275interpolate1("coverage__pill coverage__pill--", t_r3[0]));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2("", t_r3[1], " ", t_r3[0]);
  }
}
function CoveragePageComponent_Conditional_25_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275text(1, "Nothing to show \u2014 every profile here is complete and scored.");
    \u0275\u0275elementEnd();
  }
}
function CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const p_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275textInterpolate1(" / ", p_r5.subsector, " ");
  }
}
function CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " complete ");
  }
}
function CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 16);
    \u0275\u0275text(1, "incomplete");
    \u0275\u0275elementEnd();
  }
}
function CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_19_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275text(1, "Every weighted variable has a value everywhere.");
    \u0275\u0275elementEnd();
  }
}
function CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_19_Conditional_5_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li")(1, "code");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 11);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const g_r7 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(g_r7.variableCode);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(g_r7.domain);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" \u2014 missing in ", g_r7.missing, " division(s) ");
  }
}
function CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_19_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275text(1, "Missing values, most-missing first:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "ul", 21);
    \u0275\u0275repeaterCreate(3, CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_19_Conditional_5_For_4_Template, 6, 3, "li", null, _forTrack3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r5 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275repeater(p_r5.gaps);
  }
}
function CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 17)(1, "td", 18)(2, "p");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(4, CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_19_Conditional_4_Template, 2, 0, "p", 11)(5, CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_19_Conditional_5_Template, 5, 0);
    \u0275\u0275elementStart(6, "p")(7, "a", 19);
    \u0275\u0275text(8, "Import data");
    \u0275\u0275elementEnd();
    \u0275\u0275text(9, " \xB7 ");
    \u0275\u0275elementStart(10, "a", 20);
    \u0275\u0275text(11, "Weights");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const p_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate5(" ", p_r5.variables, " weighted variables \xB7 hazard ", p_r5.hazardTotal ?? 0, "% \xB7 exposure ", p_r5.exposureTotal ?? 0, "% \xB7 ", p_r5.divisionsPartial, " division(s) part-filled \xB7 ", p_r5.divisionsEmpty, " with nothing at all ");
    \u0275\u0275advance();
    \u0275\u0275conditional(p_r5.gaps.length === 0 ? 4 : 5);
  }
}
function CoveragePageComponent_Conditional_25_Conditional_7_For_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr", 15);
    \u0275\u0275listener("click", function CoveragePageComponent_Conditional_25_Conditional_7_For_17_Template_tr_click_0_listener() {
      const p_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r5 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r5.toggleProfile(p_r5.profileCode));
    });
    \u0275\u0275elementStart(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275conditionalCreate(3, CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_3_Template, 1, 1);
    \u0275\u0275elementStart(4, "span", 11);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "td");
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "td");
    \u0275\u0275conditionalCreate(9, CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_9_Template, 1, 0)(10, CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_10_Template, 2, 0, "span", 16);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "td");
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td");
    \u0275\u0275text(14);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "td")(16, "span");
    \u0275\u0275text(17);
    \u0275\u0275elementEnd();
    \u0275\u0275text(18);
    \u0275\u0275elementEnd()();
    \u0275\u0275conditionalCreate(19, CoveragePageComponent_Conditional_25_Conditional_7_For_17_Conditional_19_Template, 12, 6, "tr", 17);
  }
  if (rf & 2) {
    const p_r5 = ctx.$implicit;
    const r_r8 = \u0275\u0275nextContext(2);
    const ctx_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", p_r5.sector);
    \u0275\u0275advance();
    \u0275\u0275conditional(p_r5.subsector ? 3 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(p_r5.profileCode);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(p_r5.hazard);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(p_r5.weightsOk ? 9 : 10);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", p_r5.divisionsComplete, " / ", r_r8.divisions);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(p_r5.scored);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(\u0275\u0275interpolate1("coverage__pill coverage__pill--", p_r5.status));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(p_r5.status);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", p_r5.note, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r5.openProfile() === p_r5.profileCode ? 19 : -1);
  }
}
function CoveragePageComponent_Conditional_25_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "table", 14)(1, "thead")(2, "tr")(3, "th");
    \u0275\u0275text(4, "Profile");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "th");
    \u0275\u0275text(6, "Hazard");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "th");
    \u0275\u0275text(8, "Weights");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "th");
    \u0275\u0275text(10, "Divisions complete");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "th");
    \u0275\u0275text(12, "Scored");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "th");
    \u0275\u0275text(14, "What is holding it up");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(15, "tbody");
    \u0275\u0275repeaterCreate(16, CoveragePageComponent_Conditional_25_Conditional_7_For_17_Template, 20, 14, null, null, _forTrack2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r5 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(16);
    \u0275\u0275repeater(ctx_r5.rows());
  }
}
function CoveragePageComponent_Conditional_25_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 12)(1, "strong");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275repeaterCreate(4, CoveragePageComponent_Conditional_25_For_5_Template, 2, 5, "span", 13, _forTrack1);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(6, CoveragePageComponent_Conditional_25_Conditional_6_Template, 2, 0, "p", 11)(7, CoveragePageComponent_Conditional_25_Conditional_7_Template, 18, 0, "table", 14);
  }
  if (rf & 2) {
    const r_r8 = ctx;
    const ctx_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(r_r8.province);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate3(" \xB7 ", r_r8.period, " \xB7 ", r_r8.divisions, " divisions \xB7 ", r_r8.profiles.length, " profiles ");
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r5.tally());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r5.rows().length === 0 ? 6 : 7);
  }
}
var CoveragePageComponent = class _CoveragePageComponent {
  http = inject(HttpClient);
  taxonomyService = inject(TaxonomyService);
  base = environment.apiBaseUrl;
  taxonomy = this.taxonomyService.taxonomy;
  periods = PERIODS;
  province = signal(
    void 0,
    ...ngDevMode ? [{ debugName: "province" }] : (
      /* istanbul ignore next */
      []
    )
  );
  period = signal(
    PERIODS[0],
    ...ngDevMode ? [{ debugName: "period" }] : (
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
  busy = signal(
    false,
    ...ngDevMode ? [{ debugName: "busy" }] : (
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
  openProfile = signal(
    null,
    ...ngDevMode ? [{ debugName: "openProfile" }] : (
      /* istanbul ignore next */
      []
    )
  );
  onlyProblems = signal(
    false,
    ...ngDevMode ? [{ debugName: "onlyProblems" }] : (
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
  rows = computed(
    () => {
      const all = this.report()?.profiles ?? [];
      return this.onlyProblems() ? all.filter((p) => p.status !== "scored") : all;
    },
    ...ngDevMode ? [{ debugName: "rows" }] : (
      /* istanbul ignore next */
      []
    )
  );
  /** A count per status, so the province reads as a sentence before anyone
   * scans the table. */
  tally = computed(
    () => {
      const out = {};
      for (const p of this.report()?.profiles ?? [])
        out[p.status] = (out[p.status] ?? 0) + 1;
      return Object.entries(out);
    },
    ...ngDevMode ? [{ debugName: "tally" }] : (
      /* istanbul ignore next */
      []
    )
  );
  ngOnInit() {
    this.taxonomyService.load();
  }
  /** The province list arrives with the taxonomy, so the first load happens
   * when the user picks -- or here, once, as soon as there is something to
   * pick. */
  choose(province) {
    this.province.set(province);
    this.refresh();
  }
  setPeriod(period) {
    this.period.set(period);
    if (this.province())
      this.refresh();
  }
  toggleProfile(code) {
    this.openProfile.set(this.openProfile() === code ? null : code);
  }
  refresh() {
    const province = this.province();
    if (!province)
      return;
    this.busy.set(true);
    this.error.set(null);
    const q = `?province=${encodeURIComponent(province)}&period=${encodeURIComponent(this.period())}`;
    this.http.get(`${this.base}/coverage${q}`).subscribe({
      next: (r) => {
        this.report.set(r);
        this.busy.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? err?.message ?? "Coverage could not be loaded.");
        this.report.set(null);
        this.busy.set(false);
      }
    });
  }
  static \u0275fac = function CoveragePageComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CoveragePageComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CoveragePageComponent, selectors: [["app-coverage-page"]], decls: 26, vars: 8, consts: [[1, "coverage"], [1, "coverage__title"], [1, "coverage__lead"], [1, "coverage__controls"], [3, "change", "value"], ["value", "", "disabled", ""], [3, "value"], [1, "coverage__check"], ["type", "checkbox", 3, "change", "checked"], ["type", "button", 3, "click", "disabled"], [1, "coverage__error"], [1, "coverage__muted"], [1, "coverage__summary"], [3, "class"], [1, "coverage__table"], [1, "coverage__row", 3, "click"], [1, "coverage__bad"], [1, "coverage__detail"], ["colspan", "6"], ["routerLink", "/import"], ["routerLink", "/weights"], [1, "coverage__gaps"]], template: function CoveragePageComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "h2", 1);
      \u0275\u0275text(2, "Coverage");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "p", 2);
      \u0275\u0275text(4, " Why each profile in a province is, or is not, on the map \u2014 whether the weights are finished, whether every division has every weighted value, and whether the scores have been computed since. ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "div", 3)(6, "label");
      \u0275\u0275text(7, " Province ");
      \u0275\u0275elementStart(8, "select", 4);
      \u0275\u0275listener("change", function CoveragePageComponent_Template_select_change_8_listener($event) {
        return ctx.choose($event.target.value);
      });
      \u0275\u0275elementStart(9, "option", 5);
      \u0275\u0275text(10, "Choose a province");
      \u0275\u0275elementEnd();
      \u0275\u0275repeaterCreate(11, CoveragePageComponent_For_12_Template, 2, 2, "option", 6, _forTrack0);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(13, "label");
      \u0275\u0275text(14, " Period ");
      \u0275\u0275elementStart(15, "select", 4);
      \u0275\u0275listener("change", function CoveragePageComponent_Template_select_change_15_listener($event) {
        return ctx.setPeriod($event.target.value);
      });
      \u0275\u0275repeaterCreate(16, CoveragePageComponent_For_17_Template, 2, 2, "option", 6, \u0275\u0275repeaterTrackByIdentity);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(18, "label", 7)(19, "input", 8);
      \u0275\u0275listener("change", function CoveragePageComponent_Template_input_change_19_listener($event) {
        return ctx.onlyProblems.set($event.target.checked);
      });
      \u0275\u0275elementEnd();
      \u0275\u0275text(20, " Only what is not finished ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(21, "button", 9);
      \u0275\u0275listener("click", function CoveragePageComponent_Template_button_click_21_listener() {
        return ctx.refresh();
      });
      \u0275\u0275text(22);
      \u0275\u0275elementEnd()();
      \u0275\u0275conditionalCreate(23, CoveragePageComponent_Conditional_23_Template, 2, 1, "p", 10);
      \u0275\u0275conditionalCreate(24, CoveragePageComponent_Conditional_24_Template, 2, 0, "p", 11);
      \u0275\u0275conditionalCreate(25, CoveragePageComponent_Conditional_25_Template, 8, 5);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_7_0;
      let tmp_9_0;
      \u0275\u0275advance(8);
      \u0275\u0275property("value", ctx.province() ?? "");
      \u0275\u0275advance(3);
      \u0275\u0275repeater(ctx.provinces());
      \u0275\u0275advance(4);
      \u0275\u0275property("value", ctx.period());
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.periods);
      \u0275\u0275advance(3);
      \u0275\u0275property("checked", ctx.onlyProblems());
      \u0275\u0275advance(2);
      \u0275\u0275property("disabled", !ctx.province() || ctx.busy());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.busy() ? "Loading\u2026" : "Refresh", " ");
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_7_0 = ctx.error()) ? 23 : -1, tmp_7_0);
      \u0275\u0275advance();
      \u0275\u0275conditional(!ctx.province() ? 24 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_9_0 = ctx.report()) ? 25 : -1, tmp_9_0);
    }
  }, dependencies: [FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, RouterLink], styles: ["\n.coverage[_ngcontent-%COMP%] {\n  padding: 1.5rem 2rem 3rem;\n  color: #212529;\n}\n.coverage__title[_ngcontent-%COMP%] {\n  margin: 0 0 0.3rem;\n  font-size: 1.25rem;\n}\n.coverage__lead[_ngcontent-%COMP%] {\n  margin: 0 0 1.2rem;\n  max-width: 46rem;\n  font-size: 0.85rem;\n  color: #495057;\n  line-height: 1.55;\n}\n.coverage__controls[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1rem;\n  align-items: flex-end;\n  margin-bottom: 1rem;\n  font-size: 0.8rem;\n}\n.coverage__controls[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n}\n.coverage__check[_ngcontent-%COMP%] {\n  flex-direction: row !important;\n  align-items: center;\n  gap: 0.4rem !important;\n}\n.coverage__summary[_ngcontent-%COMP%] {\n  font-size: 0.82rem;\n  margin: 0 0 0.8rem;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.4rem;\n  align-items: center;\n}\n.coverage__muted[_ngcontent-%COMP%] {\n  color: #868e96;\n  font-size: 0.78rem;\n}\n.coverage__bad[_ngcontent-%COMP%] {\n  color: #a4243b;\n}\n.coverage__error[_ngcontent-%COMP%] {\n  color: #a4243b;\n  font-size: 0.85rem;\n}\n.coverage__pill[_ngcontent-%COMP%] {\n  display: inline-block;\n  padding: 0.05rem 0.45rem;\n  border-radius: 999px;\n  font-size: 0.72rem;\n  background: #e9ecef;\n  color: #343a40;\n}\n.coverage__pill--scored[_ngcontent-%COMP%] {\n  background: #e3f2e6;\n  color: #21603a;\n}\n.coverage__pill--weights[_ngcontent-%COMP%] {\n  background: #fdecea;\n  color: #8f2a1d;\n}\n.coverage__pill--partial[_ngcontent-%COMP%] {\n  background: #fff4e0;\n  color: #8a5a09;\n}\n.coverage__pill--no[_ngcontent-%COMP%] {\n  background: #fdecea;\n  color: #8f2a1d;\n}\n.coverage__table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.8rem;\n}\n.coverage__table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.coverage__table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  text-align: left;\n  padding: 0.4rem 0.55rem;\n  border-bottom: 1px solid #e9ecef;\n  vertical-align: top;\n}\n.coverage__table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: #495057;\n}\n.coverage__row[_ngcontent-%COMP%] {\n  cursor: pointer;\n}\n.coverage__row[_ngcontent-%COMP%]:hover   td[_ngcontent-%COMP%] {\n  background: #f6f7f9;\n}\n.coverage__detail[_ngcontent-%COMP%]    > td[_ngcontent-%COMP%] {\n  background: #fbfcfd;\n  font-size: 0.78rem;\n}\n.coverage__gaps[_ngcontent-%COMP%] {\n  margin: 0.3rem 0 0.6rem;\n  padding-left: 1.1rem;\n}\n.coverage__gaps[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n  margin-bottom: 0.15rem;\n}\n/*# sourceMappingURL=coverage-page.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CoveragePageComponent, [{
    type: Component,
    args: [{ selector: "app-coverage-page", standalone: true, imports: [FormsModule, RouterLink], template: `<div class="coverage">
  <h2 class="coverage__title">Coverage</h2>
  <p class="coverage__lead">
    Why each profile in a province is, or is not, on the map \u2014 whether the weights are
    finished, whether every division has every weighted value, and whether the scores have
    been computed since.
  </p>

  <div class="coverage__controls">
    <label>
      Province
      <select [value]="province() ?? ''" (change)="choose($any($event.target).value)">
        <option value="" disabled>Choose a province</option>
        @for (p of provinces(); track p.code) {
          <option [value]="p.name">{{ p.name }}</option>
        }
      </select>
    </label>
    <label>
      Period
      <select [value]="period()" (change)="setPeriod($any($event.target).value)">
        @for (p of periods; track p) {
          <option [value]="p">{{ p }}</option>
        }
      </select>
    </label>
    <label class="coverage__check">
      <input
        type="checkbox"
        [checked]="onlyProblems()"
        (change)="onlyProblems.set($any($event.target).checked)"
      />
      Only what is not finished
    </label>
    <button type="button" [disabled]="!province() || busy()" (click)="refresh()">
      {{ busy() ? 'Loading\u2026' : 'Refresh' }}
    </button>
  </div>

  @if (error(); as e) {
    <p class="coverage__error">{{ e }}</p>
  }

  @if (!province()) {
    <p class="coverage__muted">Choose a province to see where its data stands.</p>
  }

  @if (report(); as r) {
    <p class="coverage__summary">
      <strong>{{ r.province }}</strong> \xB7 {{ r.period }} \xB7 {{ r.divisions }} divisions \xB7
      {{ r.profiles.length }} profiles
      @for (t of tally(); track t[0]) {
        <span class="coverage__pill coverage__pill--{{ t[0] }}">{{ t[1] }} {{ t[0] }}</span>
      }
    </p>

    @if (rows().length === 0) {
      <p class="coverage__muted">Nothing to show \u2014 every profile here is complete and scored.</p>
    } @else {
      <table class="coverage__table">
        <thead>
          <tr>
            <th>Profile</th>
            <th>Hazard</th>
            <th>Weights</th>
            <th>Divisions complete</th>
            <th>Scored</th>
            <th>What is holding it up</th>
          </tr>
        </thead>
        <tbody>
          @for (p of rows(); track p.profileCode) {
            <tr class="coverage__row" (click)="toggleProfile(p.profileCode)">
              <td>
                {{ p.sector }}@if (p.subsector) { / {{ p.subsector }} }
                <span class="coverage__muted">{{ p.profileCode }}</span>
              </td>
              <td>{{ p.hazard }}</td>
              <td>
                @if (p.weightsOk) { complete } @else {
                  <span class="coverage__bad">incomplete</span>
                }
              </td>
              <td>{{ p.divisionsComplete }} / {{ r.divisions }}</td>
              <td>{{ p.scored }}</td>
              <td>
                <span class="coverage__pill coverage__pill--{{ p.status }}">{{ p.status }}</span>
                {{ p.note }}
              </td>
            </tr>
            @if (openProfile() === p.profileCode) {
              <tr class="coverage__detail">
                <td colspan="6">
                  <p>
                    {{ p.variables }} weighted variables \xB7 hazard {{ p.hazardTotal ?? 0 }}% \xB7
                    exposure {{ p.exposureTotal ?? 0 }}% \xB7
                    {{ p.divisionsPartial }} division(s) part-filled \xB7
                    {{ p.divisionsEmpty }} with nothing at all
                  </p>
                  @if (p.gaps.length === 0) {
                    <p class="coverage__muted">Every weighted variable has a value everywhere.</p>
                  } @else {
                    <p class="coverage__muted">Missing values, most-missing first:</p>
                    <ul class="coverage__gaps">
                      @for (g of p.gaps; track g.variableCode) {
                        <li>
                          <code>{{ g.variableCode }}</code>
                          <span class="coverage__muted">{{ g.domain }}</span>
                          \u2014 missing in {{ g.missing }} division(s)
                        </li>
                      }
                    </ul>
                  }
                  <p>
                    <a routerLink="/import">Import data</a> \xB7
                    <a routerLink="/weights">Weights</a>
                  </p>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    }
  }
</div>
`, styles: ["/* src/app/features/coverage/coverage-page.component.scss */\n.coverage {\n  padding: 1.5rem 2rem 3rem;\n  color: #212529;\n}\n.coverage__title {\n  margin: 0 0 0.3rem;\n  font-size: 1.25rem;\n}\n.coverage__lead {\n  margin: 0 0 1.2rem;\n  max-width: 46rem;\n  font-size: 0.85rem;\n  color: #495057;\n  line-height: 1.55;\n}\n.coverage__controls {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1rem;\n  align-items: flex-end;\n  margin-bottom: 1rem;\n  font-size: 0.8rem;\n}\n.coverage__controls label {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n}\n.coverage__check {\n  flex-direction: row !important;\n  align-items: center;\n  gap: 0.4rem !important;\n}\n.coverage__summary {\n  font-size: 0.82rem;\n  margin: 0 0 0.8rem;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.4rem;\n  align-items: center;\n}\n.coverage__muted {\n  color: #868e96;\n  font-size: 0.78rem;\n}\n.coverage__bad {\n  color: #a4243b;\n}\n.coverage__error {\n  color: #a4243b;\n  font-size: 0.85rem;\n}\n.coverage__pill {\n  display: inline-block;\n  padding: 0.05rem 0.45rem;\n  border-radius: 999px;\n  font-size: 0.72rem;\n  background: #e9ecef;\n  color: #343a40;\n}\n.coverage__pill--scored {\n  background: #e3f2e6;\n  color: #21603a;\n}\n.coverage__pill--weights {\n  background: #fdecea;\n  color: #8f2a1d;\n}\n.coverage__pill--partial {\n  background: #fff4e0;\n  color: #8a5a09;\n}\n.coverage__pill--no {\n  background: #fdecea;\n  color: #8f2a1d;\n}\n.coverage__table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.8rem;\n}\n.coverage__table th,\n.coverage__table td {\n  text-align: left;\n  padding: 0.4rem 0.55rem;\n  border-bottom: 1px solid #e9ecef;\n  vertical-align: top;\n}\n.coverage__table th {\n  font-weight: 600;\n  color: #495057;\n}\n.coverage__row {\n  cursor: pointer;\n}\n.coverage__row:hover td {\n  background: #f6f7f9;\n}\n.coverage__detail > td {\n  background: #fbfcfd;\n  font-size: 0.78rem;\n}\n.coverage__gaps {\n  margin: 0.3rem 0 0.6rem;\n  padding-left: 1.1rem;\n}\n.coverage__gaps li {\n  margin-bottom: 0.15rem;\n}\n/*# sourceMappingURL=coverage-page.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CoveragePageComponent, { className: "CoveragePageComponent", filePath: "src/app/features/coverage/coverage-page.component.ts", lineNumber: 67 });
})();
export {
  CoveragePageComponent
};
//# debugId=1f6d192b-b4ae-5f44-a4a3-014c4974ce38
//# sourceMappingURL=chunk-A65OBDDP.js.map
