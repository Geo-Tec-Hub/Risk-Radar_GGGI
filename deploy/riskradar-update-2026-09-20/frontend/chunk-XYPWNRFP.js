import {
  scopeFromQueryParams
} from "./chunk-WRSNWZSJ.js";
import {
  ApiClientService
} from "./chunk-QBP7AOH4.js";
import {
  ActivatedRoute
} from "./chunk-UFWDULIL.js";
import {
  Component,
  inject,
  setClassMetadata,
  signal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵdomListener,
  ɵɵdomProperty,
  ɵɵgetCurrentView,
  ɵɵnextContext,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate4
} from "./chunk-SAQOEXKZ.js";

// src/app/features/import/import-upload.component.ts
var _forTrack0 = ($index, $item) => $item.dsDivision + $item.parameter;
function ImportUploadComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "p", 1);
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const s_r1 = ctx;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate4(" ", s_r1.sector, "", s_r1.subsector ? " \xB7 " + s_r1.subsector : "", " \xD7 ", s_r1.hazard, " \xB7 ", s_r1.province, " ");
  }
}
function ImportUploadComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "p", 2);
    \u0275\u0275text(1, "No profile selected. Go back and choose province, sector, subsector and hazard.");
    \u0275\u0275domElementEnd();
  }
}
function ImportUploadComponent_Conditional_5_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "p", 2);
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Upload failed: ", ctx);
  }
}
function ImportUploadComponent_Conditional_5_Conditional_7_Conditional_5_For_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275domElementEnd();
    \u0275\u0275domElementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275domElementEnd();
    \u0275\u0275domElementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275domElementEnd()();
  }
  if (rf & 2) {
    const e_r4 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(e_r4.dsDivision);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(e_r4.parameter);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(e_r4.message);
  }
}
function ImportUploadComponent_Conditional_5_Conditional_7_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "table", 10)(1, "thead")(2, "tr")(3, "th");
    \u0275\u0275text(4, "Division");
    \u0275\u0275domElementEnd();
    \u0275\u0275domElementStart(5, "th");
    \u0275\u0275text(6, "Parameter");
    \u0275\u0275domElementEnd();
    \u0275\u0275domElementStart(7, "th");
    \u0275\u0275text(8, "Error");
    \u0275\u0275domElementEnd()()();
    \u0275\u0275domElementStart(9, "tbody");
    \u0275\u0275repeaterCreate(10, ImportUploadComponent_Conditional_5_Conditional_7_Conditional_5_For_11_Template, 7, 3, "tr", null, _forTrack0);
    \u0275\u0275domElementEnd()();
  }
  if (rf & 2) {
    const b_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance(10);
    \u0275\u0275repeater(b_r5.errors);
  }
}
function ImportUploadComponent_Conditional_5_Conditional_7_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "p", 11);
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const b_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Variables lacking a weight: ", b_r5.variablesLackingWeight.join(", "), " \u2014 set them on the Weights screen. ");
  }
}
function ImportUploadComponent_Conditional_5_Conditional_7_Conditional_7_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "p", 2);
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Rollback failed: ", ctx);
  }
}
function ImportUploadComponent_Conditional_5_Conditional_7_Conditional_7_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "dl", 12)(1, "dt");
    \u0275\u0275text(2, "Loaded");
    \u0275\u0275domElementEnd();
    \u0275\u0275domElementStart(3, "dd");
    \u0275\u0275text(4);
    \u0275\u0275domElementEnd();
    \u0275\u0275domElementStart(5, "dt");
    \u0275\u0275text(6, "Now computable");
    \u0275\u0275domElementEnd();
    \u0275\u0275domElementStart(7, "dd");
    \u0275\u0275text(8);
    \u0275\u0275domElementEnd();
    \u0275\u0275domElementStart(9, "dt");
    \u0275\u0275text(10, "Outstanding");
    \u0275\u0275domElementEnd();
    \u0275\u0275domElementStart(11, "dd");
    \u0275\u0275text(12);
    \u0275\u0275domElementEnd()();
  }
  if (rf & 2) {
    const s2_r7 = ctx;
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(s2_r7.loaded);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(s2_r7.computable);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(s2_r7.outstanding);
  }
}
function ImportUploadComponent_Conditional_5_Conditional_7_Conditional_7_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "p", 2);
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Summary unavailable: ", ctx);
  }
}
function ImportUploadComponent_Conditional_5_Conditional_7_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275domElementStart(0, "button", 5);
    \u0275\u0275domListener("click", function ImportUploadComponent_Conditional_5_Conditional_7_Conditional_7_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.rollback());
    });
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
    \u0275\u0275conditionalCreate(2, ImportUploadComponent_Conditional_5_Conditional_7_Conditional_7_Conditional_2_Template, 2, 1, "p", 2);
    \u0275\u0275conditionalCreate(3, ImportUploadComponent_Conditional_5_Conditional_7_Conditional_7_Conditional_3_Template, 13, 3, "dl", 12)(4, ImportUploadComponent_Conditional_5_Conditional_7_Conditional_7_Conditional_4_Template, 2, 1, "p", 2);
  }
  if (rf & 2) {
    let tmp_6_0;
    let tmp_7_0;
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275domProperty("disabled", ctx_r2.rollingBack());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.rollingBack() ? "Rolling back\u2026" : "Roll back this batch", " ");
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_6_0 = ctx_r2.rollbackError()) ? 2 : -1, tmp_6_0);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_7_0 = ctx_r2.summary()) ? 3 : (tmp_7_0 = ctx_r2.summaryError()) ? 4 : -1, tmp_7_0);
  }
}
function ImportUploadComponent_Conditional_5_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "div", 8)(1, "p", 9);
    \u0275\u0275text(2);
    \u0275\u0275domElementStart(3, "strong");
    \u0275\u0275text(4);
    \u0275\u0275domElementEnd()();
    \u0275\u0275conditionalCreate(5, ImportUploadComponent_Conditional_5_Conditional_7_Conditional_5_Template, 12, 0, "table", 10);
    \u0275\u0275conditionalCreate(6, ImportUploadComponent_Conditional_5_Conditional_7_Conditional_6_Template, 2, 1, "p", 11);
    \u0275\u0275conditionalCreate(7, ImportUploadComponent_Conditional_5_Conditional_7_Conditional_7_Template, 5, 4);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const b_r5 = ctx;
    \u0275\u0275classProp("import__result--failed", b_r5.errors.length > 0);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" Batch ", b_r5.id, " \u2014 ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(b_r5.status);
    \u0275\u0275advance();
    \u0275\u0275conditional(b_r5.errors.length > 0 ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(b_r5.variablesLackingWeight.length > 0 ? 6 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(b_r5.status === "loaded" ? 7 : -1);
  }
}
function ImportUploadComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275domElementStart(0, "div", 3)(1, "input", 4);
    \u0275\u0275domListener("change", function ImportUploadComponent_Conditional_5_Template_input_change_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onFileSelected($event));
    });
    \u0275\u0275domElementEnd();
    \u0275\u0275domElementStart(2, "button", 5);
    \u0275\u0275domListener("click", function ImportUploadComponent_Conditional_5_Template_button_click_2_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.upload());
    });
    \u0275\u0275text(3);
    \u0275\u0275domElementEnd()();
    \u0275\u0275domElementStart(4, "p", 6);
    \u0275\u0275text(5, " Structure is validated against the workbook's hidden metadata sheet. Any error means the whole file loads nothing \u2014 fix everything listed below and re-upload. ");
    \u0275\u0275domElementEnd();
    \u0275\u0275conditionalCreate(6, ImportUploadComponent_Conditional_5_Conditional_6_Template, 2, 1, "p", 2);
    \u0275\u0275conditionalCreate(7, ImportUploadComponent_Conditional_5_Conditional_7_Template, 8, 7, "div", 7);
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275domProperty("disabled", !ctx_r2.selectedFile() || ctx_r2.uploading());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.uploading() ? "Uploading\u2026" : "Upload", " ");
    \u0275\u0275advance(3);
    \u0275\u0275conditional((tmp_3_0 = ctx_r2.uploadError()) ? 6 : -1, tmp_3_0);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_4_0 = ctx_r2.batch()) ? 7 : -1, tmp_4_0);
  }
}
var ImportUploadComponent = class _ImportUploadComponent {
  route = inject(ActivatedRoute);
  api = inject(ApiClientService);
  scope = signal(
    null,
    ...ngDevMode ? [{ debugName: "scope" }] : (
      /* istanbul ignore next */
      []
    )
  );
  selectedFile = signal(
    null,
    ...ngDevMode ? [{ debugName: "selectedFile" }] : (
      /* istanbul ignore next */
      []
    )
  );
  uploading = signal(
    false,
    ...ngDevMode ? [{ debugName: "uploading" }] : (
      /* istanbul ignore next */
      []
    )
  );
  uploadError = signal(
    null,
    ...ngDevMode ? [{ debugName: "uploadError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  batch = signal(
    null,
    ...ngDevMode ? [{ debugName: "batch" }] : (
      /* istanbul ignore next */
      []
    )
  );
  summary = signal(
    null,
    ...ngDevMode ? [{ debugName: "summary" }] : (
      /* istanbul ignore next */
      []
    )
  );
  summaryError = signal(
    null,
    ...ngDevMode ? [{ debugName: "summaryError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  rollingBack = signal(
    false,
    ...ngDevMode ? [{ debugName: "rollingBack" }] : (
      /* istanbul ignore next */
      []
    )
  );
  rollbackError = signal(
    null,
    ...ngDevMode ? [{ debugName: "rollbackError" }] : (
      /* istanbul ignore next */
      []
    )
  );
  constructor() {
    this.scope.set(scopeFromQueryParams(this.route.snapshot.queryParams));
  }
  onFileSelected(event) {
    const input = event.target;
    this.selectedFile.set(input.files?.[0] ?? null);
    this.batch.set(null);
    this.summary.set(null);
    this.uploadError.set(null);
  }
  upload() {
    const scope = this.scope();
    const file = this.selectedFile();
    if (!scope || !file)
      return;
    this.uploading.set(true);
    this.uploadError.set(null);
    this.batch.set(null);
    this.api.uploadImport(scope, file).subscribe({
      next: (batch) => {
        this.batch.set(batch);
        this.uploading.set(false);
        if (batch.status === "loaded") {
          this.loadSummary(batch.id);
        }
      },
      error: (err) => {
        this.uploadError.set(err.message);
        this.uploading.set(false);
      }
    });
  }
  loadSummary(batchId) {
    this.summaryError.set(null);
    this.api.getImportSummary(batchId).subscribe({
      next: (summary) => this.summary.set(summary),
      error: (err) => this.summaryError.set(err.message)
    });
  }
  rollback() {
    const current = this.batch();
    if (!current)
      return;
    this.rollingBack.set(true);
    this.rollbackError.set(null);
    this.api.rollbackImport(current.id).subscribe({
      next: (batch) => {
        this.batch.set(batch);
        this.summary.set(null);
        this.rollingBack.set(false);
      },
      error: (err) => {
        this.rollbackError.set(err.message);
        this.rollingBack.set(false);
      }
    });
  }
  static \u0275fac = function ImportUploadComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ImportUploadComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ImportUploadComponent, selectors: [["app-import-upload"]], decls: 6, vars: 2, consts: [[1, "import"], [1, "import__scope"], ["role", "alert", 1, "import__error"], [1, "import__picker"], ["type", "file", "accept", ".xlsx", 3, "change"], ["type", "button", 3, "click", "disabled"], [1, "import__hint"], [1, "import__result", 3, "import__result--failed"], [1, "import__result"], [1, "import__status"], [1, "import__errors"], [1, "import__note"], [1, "import__summary"]], template: function ImportUploadComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275domElementStart(0, "div", 0)(1, "h2");
      \u0275\u0275text(2, "Import a workbook");
      \u0275\u0275domElementEnd();
      \u0275\u0275conditionalCreate(3, ImportUploadComponent_Conditional_3_Template, 2, 4, "p", 1)(4, ImportUploadComponent_Conditional_4_Template, 2, 0, "p", 2);
      \u0275\u0275conditionalCreate(5, ImportUploadComponent_Conditional_5_Template, 8, 4);
      \u0275\u0275domElementEnd();
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275advance(3);
      \u0275\u0275conditional((tmp_0_0 = ctx.scope()) ? 3 : 4, tmp_0_0);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.scope() ? 5 : -1);
    }
  }, styles: ["\n.import[_ngcontent-%COMP%] {\n  max-width: 720px;\n  margin: 2rem auto;\n  padding: 0 1.5rem;\n}\n.import__scope[_ngcontent-%COMP%] {\n  color: #495057;\n}\n.import__error[_ngcontent-%COMP%] {\n  color: #c92a2a;\n}\n.import__picker[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.75rem;\n  align-items: center;\n  margin: 1rem 0 0.5rem;\n}\n.import__picker[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  padding: 0.5rem 1.25rem;\n  border: none;\n  border-radius: 4px;\n  background: #1c3d5a;\n  color: #fff;\n  cursor: pointer;\n}\n.import__picker[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:disabled {\n  background: #ced4da;\n  cursor: not-allowed;\n}\n.import__hint[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: #868e96;\n  margin-bottom: 1rem;\n}\n.import__result[_ngcontent-%COMP%] {\n  padding: 1rem;\n  border-radius: 6px;\n  background: #ebfbee;\n  border: 1px solid #b2f2bb;\n}\n.import__result--failed[_ngcontent-%COMP%] {\n  background: #fff5f5;\n  border-color: #ffc9c9;\n}\n.import__status[_ngcontent-%COMP%] {\n  margin: 0 0 0.5rem;\n}\n.import__errors[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.8125rem;\n  margin-bottom: 0.75rem;\n}\n.import__errors[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.import__errors[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  text-align: left;\n  padding: 0.3rem 0.5rem;\n  border-bottom: 1px solid #ffe3e3;\n}\n.import__note[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: #495057;\n}\n.import__summary[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: auto 1fr;\n  gap: 0.25rem 0.75rem;\n  margin-top: 0.75rem;\n}\n.import__summary[_ngcontent-%COMP%]   dt[_ngcontent-%COMP%] {\n  color: #868e96;\n}\n.import__summary[_ngcontent-%COMP%]   dd[_ngcontent-%COMP%] {\n  margin: 0;\n  font-weight: 500;\n}\n/*# sourceMappingURL=import-upload.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ImportUploadComponent, [{
    type: Component,
    args: [{ selector: "app-import-upload", standalone: true, template: `<div class="import">
  <h2>Import a workbook</h2>

  @if (scope(); as s) {
    <p class="import__scope">
      {{ s.sector }}{{ s.subsector ? ' \xB7 ' + s.subsector : '' }} \xD7 {{ s.hazard }} \xB7 {{ s.province }}
    </p>
  } @else {
    <p class="import__error" role="alert">No profile selected. Go back and choose province, sector, subsector and hazard.</p>
  }

  @if (scope()) {
    <div class="import__picker">
      <input type="file" accept=".xlsx" (change)="onFileSelected($event)" />
      <button type="button" [disabled]="!selectedFile() || uploading()" (click)="upload()">
        {{ uploading() ? 'Uploading\u2026' : 'Upload' }}
      </button>
    </div>
    <p class="import__hint">
      Structure is validated against the workbook's hidden metadata sheet. Any error means the whole
      file loads nothing \u2014 fix everything listed below and re-upload.
    </p>

    @if (uploadError(); as message) {
      <p class="import__error" role="alert">Upload failed: {{ message }}</p>
    }

    @if (batch(); as b) {
      <div class="import__result" [class.import__result--failed]="b.errors.length > 0">
        <p class="import__status">
          Batch {{ b.id }} \u2014 <strong>{{ b.status }}</strong>
        </p>

        @if (b.errors.length > 0) {
          <table class="import__errors">
            <thead>
              <tr>
                <th>Division</th>
                <th>Parameter</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              @for (e of b.errors; track e.dsDivision + e.parameter) {
                <tr>
                  <td>{{ e.dsDivision }}</td>
                  <td>{{ e.parameter }}</td>
                  <td>{{ e.message }}</td>
                </tr>
              }
            </tbody>
          </table>
        }

        @if (b.variablesLackingWeight.length > 0) {
          <p class="import__note">
            Variables lacking a weight: {{ b.variablesLackingWeight.join(', ') }} \u2014 set them on the Weights screen.
          </p>
        }

        @if (b.status === 'loaded') {
          <button type="button" [disabled]="rollingBack()" (click)="rollback()">
            {{ rollingBack() ? 'Rolling back\u2026' : 'Roll back this batch' }}
          </button>
          @if (rollbackError(); as message) {
            <p class="import__error" role="alert">Rollback failed: {{ message }}</p>
          }

          @if (summary(); as s2) {
            <dl class="import__summary">
              <dt>Loaded</dt>
              <dd>{{ s2.loaded }}</dd>
              <dt>Now computable</dt>
              <dd>{{ s2.computable }}</dd>
              <dt>Outstanding</dt>
              <dd>{{ s2.outstanding }}</dd>
            </dl>
          } @else if (summaryError(); as message) {
            <p class="import__error" role="alert">Summary unavailable: {{ message }}</p>
          }
        }
      </div>
    }
  }
</div>
`, styles: ["/* src/app/features/import/import-upload.component.scss */\n.import {\n  max-width: 720px;\n  margin: 2rem auto;\n  padding: 0 1.5rem;\n}\n.import__scope {\n  color: #495057;\n}\n.import__error {\n  color: #c92a2a;\n}\n.import__picker {\n  display: flex;\n  gap: 0.75rem;\n  align-items: center;\n  margin: 1rem 0 0.5rem;\n}\n.import__picker button {\n  padding: 0.5rem 1.25rem;\n  border: none;\n  border-radius: 4px;\n  background: #1c3d5a;\n  color: #fff;\n  cursor: pointer;\n}\n.import__picker button:disabled {\n  background: #ced4da;\n  cursor: not-allowed;\n}\n.import__hint {\n  font-size: 0.8125rem;\n  color: #868e96;\n  margin-bottom: 1rem;\n}\n.import__result {\n  padding: 1rem;\n  border-radius: 6px;\n  background: #ebfbee;\n  border: 1px solid #b2f2bb;\n}\n.import__result--failed {\n  background: #fff5f5;\n  border-color: #ffc9c9;\n}\n.import__status {\n  margin: 0 0 0.5rem;\n}\n.import__errors {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.8125rem;\n  margin-bottom: 0.75rem;\n}\n.import__errors th,\n.import__errors td {\n  text-align: left;\n  padding: 0.3rem 0.5rem;\n  border-bottom: 1px solid #ffe3e3;\n}\n.import__note {\n  font-size: 0.8125rem;\n  color: #495057;\n}\n.import__summary {\n  display: grid;\n  grid-template-columns: auto 1fr;\n  gap: 0.25rem 0.75rem;\n  margin-top: 0.75rem;\n}\n.import__summary dt {\n  color: #868e96;\n}\n.import__summary dd {\n  margin: 0;\n  font-weight: 500;\n}\n/*# sourceMappingURL=import-upload.component.css.map */\n"] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ImportUploadComponent, { className: "ImportUploadComponent", filePath: "src/app/features/import/import-upload.component.ts", lineNumber: 24 });
})();
export {
  ImportUploadComponent
};
//# debugId=8c75d179-de24-5227-ba01-7c09b94e70a2
//# sourceMappingURL=chunk-XYPWNRFP.js.map
