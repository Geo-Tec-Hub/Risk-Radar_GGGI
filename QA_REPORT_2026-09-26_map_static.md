# Risk Radar — QA report, map slice (static review), 26 September 2026

**Scope.** The public map: `frontend-angular/src/app/features/map/*`, the models and
services it reads (`core/models/band.model.ts`, `vulnerability.model.ts`,
`taxonomy.model.ts`, `reference-data.service.ts`, `taxonomy.service.ts`,
`boundary.service.ts`), the boundary asset `public/data/ds_divisions.simplified.geojson`,
and the API behind them: `backend/app/routers/vulnerability.py`,
`routers/reference.py`, `engine/vulnerability.py`. Checked against SRS v2.3 §2, §5
(FR-5.x) and `QA_BRIEF.md`.

**Method — read this first.** `QA_BRIEF.md` says *run it, do not report from
reading*. This pass was requested as **static review only**: no API, no database,
no browser. So every finding below is a **code-level reproduction** (file and
line) plus, where possible, the exact click sequence or SQL that would confirm
it at runtime. Findings that depend on data are marked **unconfirmed**. Two
static checks were run: `npm run check:templates` → **0 template/type errors**;
`python3 -m py_compile` on the six backend modules → clean. Nothing was fixed.
The seed (`design/ingestion/seed_all.sql`) was used as the authority for which
profiles exist; the live database may differ.

**Baseline not confirmed** (no database): 340 divisions / 33 Central profiles /
4,412 values / 1,323 results were not checked.

**Resolution, same day (26 Sep).** The four major findings and the higher-value
minors were fixed and verified against the live database:

- **#3** — confirmed live: `hazard_index = 0` was real for KE2 (Buffalo,
  Sabaragamuwa), NU8 and NU9 (Paddy, Central). `not_applicable` is now the
  engine's own `sector_absent` flag, decided from raw exposure values and stored
  per row in `method`; Central + Sabaragamuwa recomputed and those four divisions
  now render **assessed** at 0.000. New `tests/test_sector_absent.py`.
- **#2** — `pending` is emitted for a division holding every value but no result
  for the active version; the map shows an "awaiting recomputation" notice and
  the legend hides zero-count states. New `tests/test_pending.py`.
- **#1** — `/reference/taxonomy` now returns per-province hazard availability;
  the filter bar narrows sectors/subsectors/hazards by province and re-validates
  the selection when the province changes (Inland Fishery no longer offered in
  Eastern; Tea/Flood no longer offered in UVA).
- **#4** — the in-flight request is cancelled before a new one in the map, panel
  and assessment form.
- **Minors done** — #6 (panel shows track, period, last-updated, contributor),
  #7 (per-variable `boundMin`/`boundMax` from the engine's `variable_bounds`,
  shown in the variables table), #8 (20 s per-view timeout on map results,
  composition, entry form and taxonomy — not global, so long imports/recomputes
  are unaffected), #9 (legend swatches now carry the same 65% fill alpha as the
  map), #10 (`not_applicable` is now a distinct dot pattern, not a flat
  colour-only fill), #11 (largest-remainder so the coverage percentages sum to
  100), #12 (Official/Expert/Community labels, dev tag removed), #13 (dead
  national-scope reason replaced with the honest single sentence), #16 (stale
  comments fixed).

**Left as notes (not defects to fix):** #17 Sinhala name in the GeoJSON (no SRS
requirement found), #18 band-edge constants are in sync (a cross-language
equality test would be the only way to lock them), #19 out-of-scope Stage 5
items (vector tiles, ranking table, shareable URL, print, context layers,
cross-hazard/cross-period views).

## Findings

Severity: **blocker** · **major** (a documented rule not enforced) · **minor** · **note**.

| # | Sev | What I did / where | What happens (in the code) | What should happen | File / endpoint |
|---|---|---|---|---|---|
| 1 | **major** | Counted, in `seed_all.sql`, which sector × subsector × hazard combinations exist per province. **13 of the 33 combinations are missing in at least one province** (Inland Fishery and Vegetables & OFC exist in Central only; Tea/drought missing in EAS, NCE, NOR, NWE; Tea/flood also missing in UVA; Human Settlements/landslide, Transportation/landslide and Potable Water/landslide missing in EAS, NCE, NOR; Pig & Sheep missing in NOR; Irrigation Water missing in WES). `GET /reference/taxonomy` builds sectors/subsectors/hazards with `SELECT DISTINCT … FROM vulnerability_profile` **with no province dimension** (`reference.py` 167–178), and `filter-bar.component.ts` offers the same list for every province. | Pick **Eastern → Inland Fishery** (or **Northern → Agriculture → Tea → Drought**). `GET /vulnerability` returns **404** "no active profile for EAS / INLAND_FISHERY / INLAND_FISHERY / drought". The map banner reads *"Results are unavailable (…). Every division is shown as unassessed **until this recovers**."* — a permanent, by-design absence (O-3: "243 stands") reported as a transient outage. This is the same defect class the 4 Sep QA closed for hazards, left open on the province axis. | The dropdowns must not offer a combination with no profile behind it (the stated purpose of `/taxonomy`). Either take `?province=` on `/taxonomy` or return the set of provinces per subsector/hazard and narrow client-side, the way hazards are narrowed today. | `backend/app/routers/reference.py` `taxonomy()`; `features/map/filter-bar.component.ts` `hazards`, `subsectorOptions`; `map-page.component.html` banner |
| 2 | **major** | Followed what happens to the map after a weights save. `save_profile_weights()` retires the active version and inserts a new `vulnerability_profile` row (`schema_weights_addendum.sql` 119–147). `results()` joins results **on the new active profile's id** (`vulnerability.py` 229–237), and `store()` only ever writes rows for the profile id it computed. | After **any** weights save, every division of that province renders **hatched "unassessed"** for that profile, `profileVersion: null`, coverage reads "0 assessed", with nothing on the map saying why — until someone runs a recompute. "Unassessed" is documented (module docstring, line 23) as *"lacks a value for at least one weighted variable"*, which is false here: the values are all present, the scores are simply not computed for the new version. The **`pending` state exists for exactly this** ("data received but not yet computed", line 25) and is **never emitted** anywhere. | Emit `pending` when the division has values for every weighted variable of the active version but no result row — or, at minimum, have the map banner state "scores not yet computed for profile version N" (`/api/compute/status` already knows). FR-5.20: never present an empty view as if it were data. | `backend/app/routers/vulnerability.py` `results()`, `composition()`; `design/database/schema_weights_addendum.sql`; `map-page.component.ts` |
| 3 | **major** — *unconfirmed* | Read how `not_applicable` ("sector not present") is decided. It is **inferred**: `structural = hazard_index == 0 or exposure_index == 0` (`vulnerability.py` 245–246 and 346–347). The engine sets `H = 0` for any division that is the **provincial minimum on every weighted hazard variable** (`engine/vulnerability.py` 202–222: min–max to 0, weighted sum). Hazard variables are province-wide climate variables shared by every profile of a hazard. | If one division is driest / fewest events / lowest SPI across the board, it gets `H = 0` in **every drought profile of that province at once**, and the map shows it flat, **unselectable**, "This sector is not present in this division" — for Paddy, Tea, Coconut, Cattle, everything. A real division with a real sector, silenced. Not reproducible without data; check: `SELECT profile_id, count(*) FROM vulnerability_result WHERE hazard_index = 0 GROUP BY 1;` — any row is this defect (the fishery/pig-and-sheep zeros are all `exposure_index = 0`). | "Sector not present" is a fact about the **exposure raw values being all zero**, not about a normalised index. Record it in the engine (`method` or a column) when the exposure domain's raw values are all 0, and read that; never derive it from `hazard_index`. | `backend/app/routers/vulnerability.py` 245, 346; `backend/app/engine/vulnerability.py` |
| 4 | **major** | Read `MapPageComponent.refresh()` (148–167). Each filter change fires a new `getVulnerability()` subscription; the previous one is **not cancelled** and there is no request token. | Change sector twice quickly on a slow link: the **first** (slower) response can land last and overwrite `unitsByCode` with the **previous profile's** scores under the new filter labels — Paddy colours labelled as Tea. Reproduce with DevTools "Slow 3G" and two rapid dropdown changes. Same pattern in `DivisionPanelComponent.loadComposition()` (66–84) and `AssessmentFormComponent.load()`. | `switchMap` over a query signal/subject, or compare a request id before applying the response. | `features/map/map-page.component.ts`, `division-panel.component.ts`, `assessment-form.component.ts` |
| 5 | minor | Followed the panel's own instruction: *"To add your own assessment for X, set **Track** to **expert** in the filter bar"* (`division-panel.component.html` 105–110). Changing Track calls `onQueryChange()`, which does `this.selectedDivision.set(null)` (`map-page.component.ts` 82). | The panel empties; the user has to find and click the division again. The hint sends them down a path that discards their selection. | Keep the selection when only `track` (or `period`) changes; clear it only when the province changes. | `features/map/map-page.component.ts` `onQueryChange()` |
| 6 | minor | Compared the panel against FR-5.10, FR-5.12, FR-5.18. The API returns `lastUpdated`, `track`, `period` (`vulnerability.py` 453–469). | `lastUpdated` is **never rendered**; the panel states neither the **period** nor the **track** it describes ("every displayed figure shall state the period", FR-5.18); `contributedBy` is shown **only** on expert/community (`@if (c.contributedBy && query().track !== 'data')`, line 96), so the official track never names its contributing user (FR-5.10). No source citation anywhere (FR-5.12). | Show period, track, last-updated and contributor in the panel header for every track. | `features/map/division-panel.component.html` |
| 7 | minor | FR-5.9: each normalised value "shall state the provincial minimum and maximum that produced it". The engine stores them (`method.variable_bounds`) and the composition endpoint reads them to compute `normalisedValue` (414–420) — then **drops them**. | The panel shows a normalised 0.83 with no lo/hi beside it; the product bounds (`boundMin`/`boundMax`) are shown, the per-variable ones are not. | Add `boundMin`/`boundMax` (or `provinceMin`/`provinceMax`) to `VariableContribution` and print them. | `backend/app/routers/vulnerability.py` `composition()`; `vulnerability.model.ts`; `division-panel.component.html` |
| 8 | minor | FR-5.22: "every asynchronous view shall have a defined loading state **and a defined timeout**". Grepped `api-client.service.ts`, `api-error.interceptor.ts`, all map components for `timeout`. | None. A hung (not refused) API leaves "Loading score composition…" and the map's `resultsLoading` forever; the interceptor only handles status 0 and HTTP errors. | An RxJS `timeout()` in the interceptor or client, mapped to an `ApiError`. | `core/services/api-client.service.ts`, `core/interceptors/api-error.interceptor.ts` |
| 9 | minor | Compared legend swatches with map fills. Map fills use `withAlpha(…, 0.65)` (`coverage-style.ts` 41, 90); `BAND_LEGEND.swatch = b.light` is the **opaque** hex (134). `PENDING_FILL` / `NOT_APPLICABLE_FILL` in the legend **are** rgba. | Legend band colours are visibly darker/more saturated than the same band on the map over OSM; two of the four coverage swatches are translucent and two are not. Legend and map "can never drift" per the file's own comment — the alpha is the drift. | Apply the same alpha (or render the legend swatch over the same light surface). | `features/map/coverage-style.ts`, `coverage-legend.component.html` |
| 10 | minor | FR-5.16: "absence shall never be conveyed by colour alone". `unassessed` is hatched, `pending` dashed — but `not_applicable` is a **flat** pale fill with a pale stroke (`coverage-style.ts` 56–57, 99–104), deliberately. | A flat `#f2f1ee` at 65% over OSM against `very_low` `#eb827b` at 65% over OSM is a lightness/hue difference only; in greyscale print the two are close. The one state chosen to be "flat" is the one the SRS says must not be colour-only. | A distinct texture (e.g. dots) or a `∅` label; the flat-vs-hatched distinction can be kept alongside it. | `features/map/coverage-style.ts` |
| 11 | minor | Legend content vs. what the API can emit. `pending` is never emitted (`vulnerability.py` 25–26). `pct()` rounds each share independently. | Legend always lists **Pending (dashed outline)** and the statement always reads "**0 pending (0%)**"; four rounded percentages can sum to 99 or 101. | Hide states with a zero count (or hide `pending` until it is emitted); round to one decimal or use largest-remainder. | `features/map/coverage-legend.component.html`, `.ts` |
| 12 | minor | Read user-facing strings. | Panel footnote prints *"(CHANGES 2026-08-09 C1)"* — an internal change-log reference (`division-panel.component.html` 101). Track dropdown shows raw codes **data / expert / community** (`filter-bar.component.html` 53). | Plain labels: "Official", "Expert", "Community"; drop the change-log tag. | `features/map/division-panel.component.html`, `filter-bar.component.html` |
| 13 | minor | Traced `nationalScopeDisabledReason` (`filter-bar.component.ts` 102–116). It reads `referenceData.getDivisionCoverage()`; **`setDivisionCoverage()` is never called anywhere** (grep). | The elaborate "N of M registered divisions hold a value" text is dead; the UI always shows the generic sentence. `/taxonomy` already returns `divisionCoverage`, but with different fields (`registered / withGeometry / boundaryPending`) from the model the filter bar expects (`official / registered / drawable / withValues`) — two models for one fact. | Feed the taxonomy's counts into the reason, or delete the dead branch and the duplicate model. | `features/map/filter-bar.component.ts`; `core/services/reference-data.service.ts`; `core/models/reference-data.model.ts` vs `taxonomy.model.ts` |
| 14 | minor | Compared the raw-value queries in `composition()`. Data track filters `scenario_id IS NULL` (399); expert/community query (404–412) does **not**. | If a scenario value ever exists on a non-official track, the panel's "Raw" column averages it in while the engine (`track.py`) may not. Low impact today. | Add the same filter, or state why it differs. | `backend/app/routers/vulnerability.py` 404–412 |
| 15 | minor | Type drift between `VariableContribution` in Python (`weightPct: Optional[float]`, `unit: Optional[str]`) and TypeScript (`weightPct: number`, `unit: string`). | Templates cope (`??`), but the TS type promises a number the API can send as `null`; the same class of drift as the profiles.py casing item still open in the tracker. | Make the TS fields nullable. | `core/models/vulnerability.model.ts` 58–66 |
| 16 | note | Stale comments that will mislead the next reader. | `engine/vulnerability.py` 10: "Bands = even fifths" (four quarters since 18 Sep). `map-page.component.ts` 17–20: "`GET /vulnerability` has no backend behind it yet". `boundary.service.ts`: "~270KB" — the asset is **1.87 MB** (602 KB gzipped per `generate_simplified_geojson.py`). `reference-data.model.ts` 33–41 says the database seeds "North Western"; `seed_all.sql` seeds **"Northwestern"** and the GeoJSON matches it — the province name join works, the comment is wrong. | Fix in passing. | as listed |
| 17 | note | Checked the GeoJSON asset: 340 features, no duplicate `ds_code`, provinces 41/45/29/34/46/29/50/26/40, byte-identical to `design/spatial/ds_divisions.simplified.geojson`. Properties are `ds_code, ds_division, district, province` only. | **`ds_division_si` is not in the asset**, and `VulnerabilityUnit` carries no Sinhala name, so the brief's Sinhala round-trip cannot reach the map at all. Not an SRS requirement I could find for the map; recorded for the brief's §6. | Add the field if Sinhala labels are wanted on the map. | `design/spatial/generate_simplified_geojson.py` |
| 18 | note | Verified band edges agree: backend `BAND_EDGES = (0.25, 0.5, 0.75)`, `value < edge` → 1–4, `1.0 → 4`; frontend `BANDS` `[min, max)` with top closed, `bandFor(1.0) → high`. `null → null` on both sides. | In sync. The map colours from `unit.band` (server) while the legend ranges come from `BANDS` (client) — fine today because the constants match; if either is revised alone they diverge silently. | A test that asserts the two constants are equal would close this. | `band.model.ts`, `vulnerability.py` |
| 19 | note | Already on the Stage 5 board, **not re-reported**: 5.2 vector tiles (static GeoJSON stopgap), 5.7 ranking/value table, 5.8 shareable URL and print, FR-5.6 context layers, FR-5.11 cross-hazard comparison, FR-5.19 values across periods / carry-forward marks (the engine records `carried_forward` in `method`; nothing surfaces it), FR-5.23 summary panel. | — | — | `PROGRESS_TRACKER.md` Stage 5 |

## Things that are right and worth saying

- **Absent is never a low score.** Both endpoints return `value: null`, `band: null`
  for unassessed and not-applicable; `bandFor(null)` is `null`; `styleFeature`
  defaults an unknown code to `unassessed`, never to band 1. The coverage
  denominator is the province's units, not the 340 drawn polygons.
- `indexScope=national` → **409 with a reason** on both endpoints.
- `/vulnerability/periods` is declared before `/vulnerability/{ds_code}`, so it is
  not shadowed.
- The GeoJSON → register join is on `ds_code`, and the province filter is on a
  name that does match the seed for all nine provinces.
- Template type-check: 0 errors.

## What I could not test, and why

Everything the brief's §5 and §6 actually ask for needs the app running:

- The four 404 combinations in #1 against the **live** database (the seed is the
  authority I used; a hand-edited profile set would change the list).
- Whether #3 has ever happened (`hazard_index = 0` rows) — one SQL query.
- The race in #4 — needs a browser and a throttled network.
- Rendering: hatch/flat/band contrast (#9, #10), sidebar drag, province re-fit,
  legend overlay on small screens.
- The 26 Sep expert/community form end to end, panel figures vs. database,
  Sinhala round trip, API-down error state, stack-trace leakage.
- Backend `pytest` (needs `DATABASE_URL`), `ng build`, and the dataset baseline.

Recommend a runtime pass along `QA_BRIEF.md` §5–6 once the 26 Sep changes are
deployed; #1, #2 and #3 are the ones to confirm first, since each can put a
wrong *state* on a published map.
