# Progress Tracker — Climate Vulnerability Web-GIS

> Living status board. Each **development function** maps to its design doc, the **prompt to
> run**, the **skill/plugin** used, and whether it's **executed**. Update the Executed cell
> (☐ → ◐ → ☑) + Date + Output every time something finishes. Log problems in §3.

- **Last updated:** 2026-08-08
- **Current phase:** SRS §10 **Stage 1 — schema completion**, not started. Database
  built and smoke-tested; **the FastAPI app has never been scaffolded**.
- **Authoritative spec:** `design/srs/SRS_v2.2.md`. Everything earlier is superseded.
- **Build plan:** SRS §10's **ten stages**. The B1–B8 / F1–F6 tables in §2 below and
  in `PROJECT_GUIDE.md` are **history, not a plan** — kept because the issues log
  refers to them by name.
- **Stack (locked 2026-08-08):** Angular + TypeScript · OpenLayers · FastAPI ·
  PostgreSQL + PostGIS + pgvector.

---

## 1. Status summary

Counted against the **stage board in §2a**, which is the plan of record.

| Stage | Actions | ☑ | ☐ | Gated by |
|---|---|---|---|---|
| 0 — precondition (database + data) | 5 | 5 | 0 | — **done** |
| 1 — Schema completion | 9 | 0 | 9 | — **next** |
| 2 — Catalogue + profile API | 5 | 0 | 5 | Stage 1 |
| 3 — Import pipeline | 7 | 0 | 7 | Stage 2 |
| 4 — Computation engine | 7 | 0 | 7 | Stage 3 · **O-9 → P-5** · O-10 at 4.6 |
| 5 — Tiles + Angular map | 8 | 0 | 8 | Stage 2 (not Stage 4) |
| 6 — Spatial toolbox | 4 | 0 | 4 | Stage 1 (`coverage_geom`, `sl_apportion_2`) |
| 7 — Community + expert tracks | 3 | 0 | 3 | Stages 1, 5 |
| 8 — Scenarios, monitoring, assistant | 4 | 0 | 4 | Stage 4 · O-4 at 8.4 |
| 9 — Admin, audit, interoperability | 5 | 0 | 5 | Stage 1 (`audit_log`) |
| 10 — Migration and cut-over | 4 | 0 | 4 | Stages 2–5 |
| **Total** | **61** | **5** | **56** | |

**The honest summary: the data foundation is real and complete; the application
layer does not exist.** Phase 0 design work is done bar D4, whose remaining
screens are now Stage 5 and Stage 7 work.

**Now / next:** ☑ D3 schema · ☑ **Catalog finalized (2026-07-26)** — expert-refined
`Variables by Sectors` supersedes the provisional dedup; **174 canonical variables, 33
profiles** (`design/ingestion/FINAL_VARIABLES.xlsx` + `seed_all.sql`).
☑ **D6 — all 243 templates generated** (`templates/generated/`), structurally verified,
legacy weights carried forward where variables survived (51% of slots).
☑ **A1 + A4 done (2026-07-26)** — official shapefiles received; **330 real DS divisions with
province and district** now in every template (17,826 data rows), rows grouped by district.
Full ADM1/ADM2/ADM3 hierarchy validated, topology clean, all layers staged in `design/spatial/`.
☑ **Weights flow decided & built (2026-07-26)** — captured in the app at import and editable
any time from **Profile weights**; saves take effect immediately (**no approval gate in V1** —
expert-panel review happens offline and is recorded as a note). Every save is versioned so
published scores stay explainable. The 1,783 blank slots no longer block distribution.
☑ **D8 spatial model done (2026-07-26)** — `spatial-model.sql` (5 tables, EPSG:5235 helpers).
◐ D4 prototype now runs on the real catalog.
☑ **A3 year-range rules decided (2026-07-26)** — *latest period wins* + *typical year, not a
total*; wired through schema, all 243 templates and `_META`. 174 variables classified
(160 average · 11 fixed_window · 3 max) — expert sign-off pending on 14 exceptions only.
☑ **ERD regenerated from the DDL (2026-07-26)** — 28 tables incl. D8; `generate_erd.py`
replaces the hand-written .dot so it cannot drift again.
☑ **B1 database BUILT and verified (2026-07-29)** — see the issues log; the first real run
exposed 6 bugs. ☑ **D1/D2 diagrams done.**
☑ **D5 SRS done (2026-07-29); v1.1 · v1.2 · v1.3 (2026-07-31)** — 36 pp for GGGI: real
DS-division maps, GIS/toolbox section, 17-screen prototype annex; every quantitative claim
machine-checked against source data. **v1.1 folds in the review of the deployed system**
at `riskradar.geoinfobox.com` — new §1.5, §5.5, §6.11, Annex A.0 and Annex D; §6.5 rewritten
around the assessed / pending / unassessed distinction.
**Phase 0 is complete except D4** (profile composer + mapping resolver screens).
**Nothing blocks data entry, and nothing blocks B3.**
See `FINAL_VARIABLES.xlsx → Issues_to_confirm` for the open confirmations.

---

## 1a. Open actions — what remains

> **Superseded 2026-08-08.** The live open-item register is **SRS v2.2 §11.3
> (O-1 … O-10)**, and the provisional decisions taken so the build is not
> blocked are **Annex C (P-1 … P-14)**. This section is kept because its A/N
> identifiers appear in §3 rows; every row below is either resolved or restated
> there. The one that matters today is **O-9**.

Ordered by what unblocks the most. "Owner" = who has to decide, not who types.

### Blocking (work cannot proceed until these land)

| # | Action | Owner | Blocks | Where |
|---|---|---|---|---|
| ~~A1~~ | ~~Official DS-division register~~ — **DONE 2026-07-26.** 330 real DS divisions now in every template; shapefiles staged in `design/spatial/` | — | — | `design/ingestion/dsd_register.csv` |
| A2 | Fill **weights for the 1,783 new variable slots** (51% inherited a legacy weight; the rest are variables experts newly added). **No longer a blocker** — weights are captured in the app at import, saved immediately, and editable any time (2026-07-26 decision) | Officers at import, after local expert-panel sign-off | Stage 4 (was B3) — now tracked as **O-1** | app: *Data import → Confirm weights*, or *Profile weights*; optional offline pre-fill on the workbook `WEIGHTS` tab |
| ~~A3~~ | ~~Year-range rules~~ — **DECIDED 2026-07-26.** Boundary year: **latest period wins**. Range value: **a typical year, not a multi-year total**. Both wired into schema, templates and `_META`. Remaining: expert sign-off on the 14 per-variable exceptions | Expert panel (review only) | nothing — B3 can be built against these rules | `design/ingestion/PERIOD_RULES_REVIEW.xlsx` |
| ~~A4~~ | ~~District (ADM2) layer~~ — **DONE 2026-07-26.** `SL_DSD.shp` (25 districts) received; all 330 DS divisions now carry their district | — | — | `design/spatial/SL_DSD.shp` |

### Confirmations (defaults applied — say the word to reverse)

| # | Question | Default I applied | Where |
|---|---|---|---|
| C1 | "Paddy **Food**" / "Tea Food" / "Vegetable & OFC Food" in the sector list | Read as **Flood** | fix at source in `1_Sectors_list.xlsx` |
| C2 | Is "total livestock **operators**" the same denominator as "total livestock **farmers**"? | Standardised all six species on `_LIVESTOCK_OPERATORS`; old codes kept as aliases | `FINAL_VARIABLES.xlsx → Crosswalk` |
| C3 | **Rubber × Flood** — declared but no variable sheet ("island wide only") | Excluded; no DSD-level profile, no template | — |
| C4 | **Vegetables & OFC** and **Inland Fishery** have legacy data for **Central only** (1 of 9 provinces) | Generated Central only. If collection is merely incomplete, I extend to all 9 (+16 workbooks) | `MANIFEST.csv` |
| C5 | 8 retired variables (4 CBO-connection, safe-well, 2 NWSDB-domestic splits, ambiguous monthly milk) | Retired, aliased | `FINAL_VARIABLES.xlsx → Crosswalk` |
| C6 | Embedding dimension for `agent_embedding` | `vector(1024)` placeholder until the self-hosted model is chosen | `schema.sql` |

Full list with a **your decision** column: `design/ingestion/FINAL_VARIABLES.xlsx → Issues_to_confirm` (14 rows).

### Next build steps (not blocked — can start now)

| # | Action | Note |
|---|---|---|
| ~~N1~~ | ~~**D8** — spatial layer + toolbox tables~~ — **DONE 2026-07-26**, ERD regenerated | `design/database/spatial-model.sql`, `erd.svg/.png`, `generate_erd.py` |
| ~~N2~~ | ~~**D1 / D2** diagrams~~ — **DONE 2026-07-29** via Graphviz, generated not hand-drawn | `design/architecture/generate_diagrams.py` |
| ~~N3~~ | ~~**D5** — SRS~~ — **DONE 2026-07-29.** 36 pp for GGGI: 4 real DS-division maps, expanded GIS/toolbox section, 17-screen prototype annex | `design/srs/SRS.docx` |
| N4 | **D4** — UI inventory + prototype | Must include the profile-composer and mapping-resolver screens (D3 rev 5) |
| ~~N5~~ | ~~**B1** — database~~ — **BUILT AND SMOKE-TESTED 2026-07-26 → 2026-07-29.** Native route run end-to-end against a pre-existing local PostgreSQL 15 + PostGIS server: `.\db\check_prereqs.ps1 && .\db\apply_native.ps1 -Reset && .\db\smoke_test_native.ps1`. FastAPI app still to scaffold | `backend/README.md` |

---

## 2. Development functions

Legend: ☐ pending · ◐ in progress · ☑ executed

### Phase 0 — Design

| # | Development function | Design doc / folder | Prompt to give | Skill / plugin | Executed | Date | Output |
|---|---|---|---|---|---|---|---|
| D1 | System architecture diagram | `design/architecture/` | "Create a system architecture diagram… (PROJECT_GUIDE §4 D1)" | Graphviz (Figma not authorised) | ☑ | 2026-07-29 | `system-architecture.svg/.png/.dot` via `generate_diagrams.py` — 6 layers, built-vs-planned shown by border style |
| D2 | Data-flow diagram | `design/architecture/` | "Create a data-flow diagram… (D2)" | Graphviz (Figma not authorised) | ☑ | 2026-07-29 | `data-flow.svg/.png/.dot` — raw → normalise → weight → indices → vulnerability → SSP → monitoring, with the A3 period rules and the readiness gate drawn in |
| D3 | Database ERD + schema.sql | `design/database/` | "Design the PostgreSQL+PostGIS+pgvector schema… (D3)" | Graphviz ERD + manual DDL | ☑ | 2026-07-02 | `schema.sql` (rev 2), `erd.svg/.png/.dot` |
| D4 | UI screen inventory + wireframes | `design/ui/` | "List every screen… then build a clickable prototype… (D4)" | web-artifacts-builder | ◐ | 2026-07-26 | `risk-radar-ui-prototype.html` — real catalog data (330 DSDs, 174 vars, 243 profiles); upload→confirm-weights→save flow + **Profile weights** editor with change history, jsdom-verified (0 errors). Still to add: profile-composer, mapping-resolver, impact explorer, toolbox |
| D5 | SRS / design document | `design/srs/` | "Co-author a Software Requirements Specification… (D5)" | markdown → pandoc → docx | ☑ | 2026-07-29 | `SRS.md` + `SRS.docx` (36 pp, 8.5 MB) — 56 functional + 9 non-functional requirements, 24 figures incl. **4 real DS-division maps**, expanded GIS/toolbox section, 17-screen prototype annex. `build_docx.py` + `generate_maps.py` regenerate |
| D6 | Excel upload templates | `design/templates/` | "Create two Excel upload templates… (D6)" | xlsx + generator script | ☑ | 2026-07-26 | **All 243 workbooks** in `templates/generated/<Province>/` + `MANIFEST.csv`; rebuilt `generate_templates.py` driven by `FINAL_VARIABLES.xlsx` + `dsd_register.csv` |
| D7 | Per-sector ingestion (loop) | `design/ingestion/` | "Ingest into the database: Sector = …, Subsector = …, using uploaded Excel… (playbook)" | xlsx + pdf reading | ☐ | | runs per sector |
| D8 | Spatial layer + toolbox model | `design/database/` | "Design the spatial layer + analysis toolbox tables… (D8)" | Graphviz ERD + manual DDL | ☑ | 2026-07-26 | `spatial-model.sql` — 5 tables + 3 types, metric helpers in EPSG:5235, `indicator_value.computation_job_id` lineage, 4 layers + 6 operations seeded. **ERD regenerated** (`erd.dot/.svg/.png`, 28 tables) |

> The Phase 1–4 tables that used to sit here (B1–B8, F1–F6, A1–A3, M1–M3) were
> **replaced on 2026-08-08** by the stage board in §2a. They described a plan
> that no longer exists. The old identifiers survive only inside §3 rows written
> before that date; read them there as history. `B1` maps to Stage 1's
> precondition — the database — which is built.

---

## 2a. Stage board — SRS §10

**The plan of record.** Ten stages, each naming what must be true before the
next begins. Nothing here has started: the database is built and smoke-tested,
and **nothing above it exists**.

Legend: ☐ pending · ◐ in progress · ☑ done

### Stage 0 — precondition (done)

| Item | State |
|---|---|
| Schema, 28 tables, negative tests passing | ☑ 2026-07-29 |
| Reference + catalogue data seeded — 9 provinces · 3 hazards · 8 sectors · 12 subsectors · 174 variables · 269 aliases · 243 profiles · 3,664 memberships | ☑ 2026-07-29 |
| 330 DS divisions loaded, topology validated, 65,976.7 km² | ☑ 2026-07-29 |
| Spatial toolbox schema + 6 operations | ☑ seeded, never exercised |
| 243 collection workbooks, 17,826 rows | ☑ 2026-07-26 |

### Stage 1 — Schema completion ☐ **← next**

*Nothing else can be tested against an incomplete schema, so this comes first.*
Goes in an **addendum**, not by editing `schema.sql` (working rule 4).

| # | Action | State |
|---|---|---|
| 1.1 | Add `community_rating` — a severity rating is not an indicator value; no `indicator_id`, keyed on sector × hazard | ☐ |
| 1.2 | Add `audit_log` — append-only, no update or delete path | ☐ |
| 1.3 | Add `nap_sector` + `sector_nap_map` (crosswalk, `is_assessable` flag) | ☐ |
| 1.4 | Add `spatial_layer.coverage_geom` (FR-6.2, FR-6.9) | ☐ |
| 1.5 | Add `sl_apportion_2()` for two-layer intersection (FR-6.5) | ☐ |
| 1.6 | Fix `iv_for_year()` ordering for determinism (§8.4) | ☐ |
| 1.7 | Re-seed periods non-overlapping — to 2025, then from 2026 (P-7) | ☐ |
| 1.8 | Regenerate the ERD (`generate_erd.py`) | ☐ |
| 1.9 | Re-run the semantic checker over all DDL — parsing is not verification (working rule 2) | ☐ |

**Exit:** every §8.3 constraint has a passing **negative** test — an attempt that
should fail, failing for the stated reason.

### Stage 2 — Catalogue and profile API ☐  *(first FastAPI code)*

| # | Action | State |
|---|---|---|
| 2.0 | Scaffold the FastAPI application — this has never been done | ☐ |
| 2.1 | Read endpoints: indicators, sectors, subsectors, hazards, NAP crosswalk | ☐ |
| 2.2 | Profile read, including readiness (`v_profile_readiness`) | ☐ |
| 2.3 | Weight save via `save_profile_weights()`, versioned, with history | ☐ |
| 2.4 | AHP endpoint returning the consistency ratio | ☐ |

**Exit:** a weighting can be saved, **rejected at 99.999**, versioned, and its
history read back.

### Stage 3 — Import pipeline ☐

| # | Action | State |
|---|---|---|
| 3.1 | Workbook generation from a profile | ☐ |
| 3.2 | Upload, full validation against Annex A, staging | ☐ |
| 3.3 | Weights read from the WEIGHTS tab and returned for confirmation — screen authoritative, file advisory | ☐ |
| 3.4 | Atomic load, batch rollback | ☐ |
| 3.5 | Alias reconciliation for unrecognised headers | ☐ |
| 3.6 | Granularity validation (FR-2.7) | ☐ |
| 3.7 | Province import summary — loaded, computed, outstanding (FR-2.12–2.16) | ☐ |

**Exit:** one fixture workbook per validation code, each producing its stated
error and **loading nothing**.

### Stage 4 — Normalisation and computation engine ☐ **gated on O-9 → P-5**

| # | Action | State |
|---|---|---|
| 4.1 | National-bounds normalisation — three methods, three temporal scopes | ☐ |
| 4.2 | Direction inversion | ☐ |
| 4.3 | Period resolution and carry-forward, **with marking** | ☐ |
| 4.4 | Hazard and exposure indices, then `V_raw = H × E` | ☐ |
| 4.5 | Provincial renormalisation, storing the bounds used (P-14) | ☐ |
| 4.6 | Banding, thresholds read from configuration (blocked on O-10) | ☐ |
| 4.7 | Refusal on unweighted variables, naming which | ☐ |

**Exit:** recomputation bit-identical; a profile with one unweighted variable
refuses and names it; a division outside a variable's data returns
**unassessed, not zero**; every province produces exactly one 1.000 and one
0.000 per profile — the signature that 4.5 ran.

### Stage 5 — Tiles and the public map ☐  *(may start once Stage 2 lands)*

Stands up the **Angular** client (SRS §4.1). Everything the frontend does later
builds on this scaffold.

| # | Action | State |
|---|---|---|
| 5.1 | Angular scaffold: routing, OpenLayers map component, typed API client checked against §9, environment config with **no hardcoded API host** | ☐ |
| 5.2 | Vector tile generation with per-zoom simplification | ☐ |
| 5.3 | Choropleth with the three coverage states rendered distinctly — **NFR-10, an absent value is not a zero** | ☐ |
| 5.4 | Sector, subsector, hazard, province, track and period controls | ☐ |
| 5.5 | Score composition panel | ☐ |
| 5.6 | Coverage statement and coverage screen | ☐ |
| 5.7 | Ranking chart and value table | ☐ |
| 5.8 | Shareable URL state, print output, error and loading states | ☐ |

**Exit:** NFR-3 timings met at national extent; no view renders an absent value
as zero, **asserted by an automated test, not by looking at the map**.

### Stage 6 — Spatial toolbox ☐

| # | Action | State |
|---|---|---|
| 6.1 | Layer registration with attribute contract and coverage extent | ☐ |
| 6.2 | The six single-layer operations, then the two-layer operation | ☐ |
| 6.3 | Job queue, review on map, commit with job linkage | ☐ |
| 6.4 | Extent-aware zero handling (FR-6.9) | ☐ |

**Exit:** a committed value traces back to layer, operation and parameters; a
division outside a layer's extent is unassessed.

### Stage 7 — Community and expert tracks ☐

| # | Action | State |
|---|---|---|
| 7.1 | Expert value entry — map-select → side panel, multi-select (§6.2). Interaction carries over from the retired React client; its code does not | ☐ |
| 7.2 | Community rating with the uniqueness key and session flagging | ☐ |
| 7.3 | Three-track comparison view with divergence listing | ☐ |

### Stage 8 — Scenarios, monitoring, assistant ☐

| # | Action | State |
|---|---|---|
| 8.1 | SSP scenarios and projection, stored **separately from observations** | ☐ |
| 8.2 | Impact explorer | ☐ |
| 8.3 | Monitoring dashboard — predicted vs actual | ☐ |
| 8.4 | Document indexing, retrieval-augmented answers, expert review workflow (blocked on O-4; needs `schema_agent_pgvector.sql` applied) | ☐ |

### Stage 9 — Administration, audit, interoperability ☐

| # | Action | State |
|---|---|---|
| 9.1 | User, role and provincial scope management; registration approval | ☐ |
| 9.2 | Catalogue governance | ☐ |
| 9.3 | Audit log write path on **every** mutating endpoint, plus the query interface | ☐ |
| 9.4 | OGC services (GeoServer) and exports | ☐ |
| 9.5 | Health endpoint and observability | ☐ |

### Stage 10 — Migration and cut-over ☐

| # | Action | State |
|---|---|---|
| 10.1 | Reference-data reconciliation with an unmatched report | ☐ |
| 10.2 | Archived historical results with `pre-migration` origin — composition recorded as unknown, not faked | ☐ |
| 10.3 | GND-level preservation | ☐ |
| 10.4 | Reconciliation report, **accepted before cut-over** | ☐ |

### Not in the ten stages

| Item | Why |
|---|---|
| Risk layer `Risk = f(H, E, V)` | Specified in §6.9, **deferred to phase 2** (P-12). Needs asset layers (O-7) and Stage 6's two-layer operation |
| D4 prototype completion | The prototype was a design instrument. Its unbuilt screens are now Stage 5 and Stage 7 work, in Angular |
| Security review / CI (old M2) | Folded into Stage 9 and NFR-4b–4d, not a separate late phase |
| Stakeholder deck (old M3) | Delivery artefact, not a build stage |

### What gates what

- **Stage 4 cannot complete until O-9 is answered.** It settles P-5, and P-5
  explains all 558 hazard-domain blanks. Ask the panel **now**, not at Stage 4.
- **Stage 5 can begin before Stage 4 finishes** — coverage states are testable
  with no scores at all.
- **Stage 6's two-layer operation** is required before the fourteen intersection
  variables (P-11), and before any phase-2 risk work.
- **Stage 8's assistant must degrade without affecting anything else**
  (FR-10.3), so it can safely be sequenced last.
- **O-1** (1,783 unweighted memberships) limits *which* profiles Stage 4 can
  compute, not whether the engine works. **O-8** and **O-10** bite at 4.6.
  **O-4** blocks 8.4 only. **O-6** blocks NFR-12.

---

## 3. Issues & solutions log

| Date | Component | Issue encountered | Resolution / decision | Status |
|---|---|---|---|---|
| 2026-06-20 | D3/D8 | Risk of per-sector & per-layer tables exploding the schema | Adopted config-driven catalogs (indicator_catalog, spatial_layer) — heterogeneity as data, not tables | Resolved |
| 2026-06-20 | D8 toolbox | Area/density indices wrong if computed in WGS84 degrees | Compute in EPSG:5235 (SLD99); store geom in 4326 for display | Resolved |
| 2026-06-20 | Tracks | Three tracks could drift if each normalizes differently | Normalize server-side from raw values; tracks share catalog, differ by `source` | Resolved |
| 2026-07-02 | D3 ERD | Figma connector not authorized in session | Generated ERD with Graphviz (svg/png + editable .dot source); guide already allowed non-Figma fallback | Resolved |
| 2026-07-02 | D3 schema | Embedding dimension unknown (self-hosted model TBD, §5 open question) | `agent_embedding.embedding vector(1024)` placeholder — adjust when model chosen | Open |
| 2026-07-02 | D3 rev 2 | Paddy sample (Eastern prov.) shows variable sets + weights are per sector×hazard, weights contextual, variables reused across hazards | Added weighting layer: `vulnerability_profile` + `profile_indicator` (weight_pct, +/- relationship, versioned, national scope); `indicator_catalog` → pure variable registry (weight removed); `vulnerability_result.profile_id` lineage | Resolved |
| 2026-07-02 | Sample data | Flood sheet has duplicate label E7 (% forest cover AND paddy production) | Catalog codes must be globally unique variable codes; sheet labels (E1/H1) kept as display labels on profile_indicator | Resolved |
| 2026-07-02 | D3 rev 3 | Per-year min–max makes vulnerability incomparable across years (temporal variation misleading) | Added `indicator_catalog.norm_scope` (pooled default / per_year / fixed_bounds); engine rule: carry latest value forward for missing years | Resolved |
| 2026-07-02 | D3 rev 4 | 9-province workbooks (243 files parsed): same sector×hazard has different variables/weights per province — reverses rev 2 "national scope" decision | Added `province` table; `province_id` on ds_division + vulnerability_profile (NULL = national fallback); unique key + scope index updated | Resolved |
| 2026-07-02 | D3 rev 5 | Legacy datasheets won't match templates; hard rejects would block ingestion, but open registration would duplicate variables | Dual-path ingestion: strict (templates) + reconciliation wizard; added `indicator_alias` (remembered mappings) and `indicator_catalog.status` pending/active/retired + `proposed_by` (admin approval gate); D4 gains profile-composer + mapping-resolver screens | Resolved |
| 2026-07-18 | D6 yearly layout | Yearly data collection: layout decided — one Data tab per year (2020–2024), YEAR pre-filled+locked per tab, importer cross-checks tab name vs YEAR column; skip a tab if no data for that year | Templates regenerated with 5 year-tabs each | Superseded by rev 6 |
| 2026-07-26 | **A3 year-range rules RESOLVED** | Two gaps open since 2026-07-18: (a) 2025 sits in **both** period tabs, so a query for 2025 had two candidate answers and any naive sum double-counted it; (b) nothing said whether a range value was a **six-year total** or a **typical year** — a factor-of-six difference. Risk was not a crash but a **quietly wrong, believable map**: if one province entered totals and another averages for the same variable, normalisation would read the first as ~6× more exposed | **Decisions (Milinda):** boundary = **latest period wins**; range value = **typical year**. Chosen because a typical year is the only reading valid for both stocks (population, extent, %) and flows (production, events) — summing a stock over six years inflates it sixfold. Implemented: `period_aggregation` enum + column on `indicator_catalog`; `iv_for_year()` resolves the boundary with `ORDER BY year_start DESC LIMIT 1`; per-column instruction printed in every workbook sub-header; rule + full per-variable map carried in hidden `_META` so the importer can validate; README states both rules. All 243 regenerated and verified | **Resolved** |
| 2026-07-26 | Per-variable exceptions | A blanket "typical year" is wrong for some variables | Classified all 174: **160 average · 11 fixed_window · 3 max**. `fixed_window` = the variable defines its own year window (`FLOOD_EVENTS_1974_TO_2023`, the three hazard indices, SPI, TX90p…) so the same value belongs on both tabs; `max` = `MAXIMUM_*_AFFECTED_PEOPLE`, already an aggregate. Machine-readable in `period_aggregation.json/.csv`; review sheet `PERIOD_RULES_REVIEW.xlsx` (14 non-average rows highlighted, hazard-domain rows flagged for a closer look) | Open — expert review only, nothing blocked |
| 2026-07-18 | D3 rev 6 + D6 | Expert input: datasets cover YEAR RANGES (2020–2025, 2025–2030), not single years | Schema: `year` → `year_start`/`year_end` in indicator_value, vulnerability_result, impact_projection (single year = equal values); templates: one tab per period, locked YEAR_START/YEAR_END. Engine rule for shared boundary year (2025 in both): latest period wins — CONFIRM with expert. Also confirm per variable: range totals vs range averages | Resolved (2 confirmations pending) |
| 2026-07-18 | Catalog dedup | 311 raw descriptions → 265 normalized → **213 proposed canonical variables** (token-level fuzzy clustering; first pass over-merged cattle/buffalo etc. — fixed) | `catalog_dedup_review.xlsx` 62 CHECK rows — **no longer needs manual review**: superseded by the expert-refined list (see 2026-07-26 row). Kept as the alias source for legacy sheet labels | Superseded 2026-07-26 |
| 2026-07-18 | D6 prototype | DS-division lists and catalog codes not yet official | Sample templates used placeholder DSD lists (8/province) + provisional slug codes | Superseded 2026-07-26 — codes now official; DSD placeholder issue carried forward to the 2026-07-26 "DS divisions" row |
| 2026-07-26 | Catalog FINAL | Expert-refined `Variables by Sectors` (14 workbooks) received — supersedes the 213-variable provisional dedup. Experts assigned official codes per sector×hazard | **174 canonical variables, 33 profiles, 463 profile-variable rows.** Crosswalk: 129 unchanged, 76 renamed, 8 retired, 4 new. Fixed 2 malformed codes (`PCT_PADDY_LAND_TOTAL _LAND_AREA` space; 74-char fish-processing code). Outputs: `FINAL_VARIABLES.xlsx`, `seed_indicator_catalog_final.sql` | Resolved — supersedes 2026-07-18 dedup row |
| 2026-07-26 | Sector list | `1_Sectors_list.xlsx` hazard labels read "Paddy **Food**", "Tea Food", "Vegetable & OFC Food" | Typo for "Flood" — treated as Flood; fix at source | Open (confirm) |
| 2026-07-26 | Livestock denominators | Buffalo/Cattle/Goat used `..._LIVESTOCK_OPERATORS`; Pig/Sheep/Poultry used `..._LIVESTOCK_FARMERS` | **Applied:** standardised all six on `_LIVESTOCK_OPERATORS` (majority form); old codes retained as aliases so it is reversible. Still needs expert confirmation that the denominator is genuinely the same | Applied — confirm |
| 2026-07-26 | Coverage | Rubber × Flood declared in sector list but no variable sheet supplied | Note says "Analyzed for Island wide only" — no DSD-level profile created | Open (confirm) |
| 2026-07-26 | Weights | Refined list defines WHICH variables per profile but carries no weight % | Legacy weights carried forward from the 9-province workbooks where the variable survived — **1,881 of 3,664 slots (51%)** pre-filled; hazard-domain weights already sum to 100 in all 243. Remaining 1,783 slots are NEW variables: sector teams fill `CONFIRMED WEIGHT %` on each workbook's WEIGHTS tab (live SUM check per domain) | Open — blocks vulnerability compute (B3) |
| 2026-07-26 | D6 regenerate | 243 templates rebuilt against the final catalog | `generate_templates.py` rewritten: reads `FINAL_VARIABLES.xlsx` (codes + membership), `dsd_register.csv` (rows), `variables_inventory.csv` (province coverage), `legacy_weight_map.json` (weight carry-forward). Adds WEIGHTS tab + DISTRICT column; supports `--resume`. All 243 verified: sheet set, header vs `_META.expected_columns`, variable set vs catalog, cell protection, SUM formulas | Resolved |
| 2026-07-26 | DS divisions | No official DS-division register yet | Rows externalised to `design/ingestion/dsd_register.csv` so the register is a one-file swap | Resolved same day — see next row |
| 2026-07-26 | **A1 RESOLVED** | Official shapefiles received (`SL_RDSD` = 330 DS divisions/ADM3, `SL_PD` = 9 provinces/ADM1, `SL_GND` = 14,019 GNDs/ADM4). **None carried parent columns** — DSD file has only `ADM3_EN`/`ADM3_SI` | Derived province per DSD by **max-area spatial overlap** against `SL_PD`. Result: all 330 assigned, **zero straddling** (every DSD ≥95% inside one province). Topology validated: 0 invalid geometries, 0 overlapping pairs, DSDs tile the provinces to within 0.054% (coastal slivers). All 330 DSD names are **unique nationally** → safe join key. Generated `ds_code` (`CEN-001`…) alphabetically within province since no official code exists. Shapefiles staged in `design/spatial/` | **Resolved** |
| 2026-07-26 | GND layer | `SL_GND.shp` (14,019 polygons) supplied first — wrong admin level (ADM4, not ADM3) and no parent columns; 935 GND names are reused nationally (e.g. "Medagama" ×19) so names alone cannot identify a division | Not used for the register. Retained as a candidate finer-grain layer for later spatial analysis (D8/B8) if needed | Parked |
| 2026-07-26 | Districts | Neither `SL_PD` (ADM1) nor `SL_RDSD` (ADM3) carries a district field | **Resolved same day:** `SL_DSD.shp` (ADM2, 25 districts) supplied. Spatial join assigned all 330 DSDs a district with **zero ambiguity**; province-via-district matches province-direct for all 330, and all 25 districts are used. Template rows now **ordered by district** within each province so collectors work district by district. `ds_code` re-issued in that order (nothing had been entered yet) | **Resolved** |
| 2026-07-26 | DSD count | Shapefile has **330** DS divisions; the figure usually quoted for Sri Lanka is 331 | Difference is one division — likely a boundary revision or a merged/split DSD in this vintage. Worth confirming against the source register before the data is treated as authoritative | Open (confirm) |
| 2026-07-26 | Coverage gap | Vegetables & OFC and Inland Fishery have legacy data for **Central province only** (1 of 9) | Templates generated for Central only, per legacy coverage. Is this real, or is collection simply incomplete elsewhere? | Open (confirm) |
| 2026-07-26 | **Weights → captured in the app** | Weights were to be pre-filled in 243 workbooks, leaving 1,783 blank slots blocking B3 | **Decision (Milinda):** weights are entered while importing the Excel, per sector-vulnerability profile. Implemented: officer uploads workbook first → importer reads its `WEIGHTS` tab → **Confirm weights** screen pre-filled and **editable every time**, live Σ per domain, blocks save until each domain totals 100 with no blanks. Excel `WEIGHTS` tab kept **visible but reference-only** — the app is master | **Resolved** |
| 2026-07-26 | **No approval gate in V1** | First cut had officer *proposes* → expert *approves* in-app | **Decision (Milinda): drop it — don't complicate V1.** All data is verified against a **local expert panel offline**; once the panel signs off, the data feeder/admin edits and saves directly. No pending states, no hard rules. Proposal tables and the approvals queue were removed; replaced by a **Profile weights** screen (province × sector × subsector × hazard → edit → Save) open to officer, expert and admin, plus a free-text **panel sign-off note** captured at save so the offline review is still recorded | **Resolved** |
| 2026-07-26 | Weight versioning | Overwriting weights would silently invalidate every past `vulnerability_result` — a published score could no longer be explained | Kept, because it is invisible to the user: one button, one save. `save_profile_weights()` writes a **new `vulnerability_profile` version** instead of mutating `profile_indicator`; a **change-history** table on the weights screen shows version, who saved, date, source file and panel note. Deliberately cheap to reverse — drop the function and UPDATE in place if it ever gets in the way. Also added the missing **`import_batch`** table (schema.sql had no handle for "which file did this come from") and `indicator_value.import_batch_id` so a bad import can be undone as a unit. See `design/database/schema_weights_addendum.sql` | Resolved |
| 2026-07-26 | D8 spatial model | Toolbox could write straight into `indicator_value`, blurring "someone ran a calculation" with "this is an official number"; and area/density computed in 4326 would come out in degrees | `spatial-model.sql`: `spatial_layer` (national attribute contract in JSONB, validated by trigger), `spatial_feature` (GIST + GIN indexed, geometry type enforced against the layer), `spatial_operation`, `computation_job`, `computation_result`. Toolbox writes **results**, which a user explicitly **commits**; `indicator_value.computation_job_id` + a CHECK make a `derivation='computed'` row *impossible* without a job. Helpers `sl_area_km2()` / `sl_length_km()` / `sl_apportion()` all transform to **EPSG:5235** first. `spatial_feature.ds_division_id` left **nullable** on purpose — a road or river crosses divisions, so per-division apportionment is computed, not stored. Seeded 4 layers (LULC/water/roads/buildings — matching the map toggles) + 6 operations | Resolved |
| 2026-07-26 | pgvector blocked a native Windows install | Milinda has no Docker and pgvector has **no official Windows binary** (needs Visual Studio build tools). `schema.sql` did `CREATE EXTENSION vector` and declared `agent_embedding.embedding vector(1024)`, so the whole 18-table core failed to build over 4 tables that belong to **Phase 3** | Split the agent RAG tables into `design/database/schema_agent_pgvector.sql`. `schema.sql` is now 18 tables with **zero** vector references and needs only PostGIS. `apply_native.ps1` probes for pgvector and skips that one file when absent, saying so. Run it later when the agent layer starts. Also added a full native-Postgres route (`apply_native.ps1`, `load_spatial.ps1`, `smoke_test_native.ps1`) so Docker is optional | Resolved |
| 2026-07-26 | **Seed SQL was broken** | Building B1 for real exposed that `seed_indicator_catalog_final.sql` **did not match `schema.sql` at all**. It inserted `vulnerability_profile.sector/subsector/hazard/status` (text) and `profile_indicator.indicator_code` — none of which exist; the real columns are `sector_id`/`subsector_id`/`hazard_type_id`/`is_active` and `indicator_id`. It had parsed cleanly for weeks because **syntax checking never resolves column names**. Also had no reference data at all: no provinces, hazards, sectors or subsectors to point its foreign keys at | Replaced by **`seed_all.sql`**, generated by `generate_seed.py` from the same artefacts the templates use. Resolves every FK by *code* in a subquery, so it is order-independent and re-runnable. Now seeds 9 provinces · 3 hazards · 8 sectors · 12 subsectors · 174 variables · 269 aliases · 243 profiles · 3,664 memberships. Old file kept with a DO-NOT-RUN banner. Semantic checker extended to verify NOT NULL columns are supplied, not just that named columns exist | **Resolved** |
| 2026-07-26 | `weight_pct NOT NULL` blocked the seed | `profile_indicator.weight_pct` was `NOT NULL CHECK (> 0)`, written before the decision that weights are entered in the app. Seeding was therefore impossible: 1,783 of 3,664 memberships are variables the expert refresh added and legitimately have no weight yet | Addendum rev 4 drops the NOT NULL. `NULL` now means "belongs to the profile, weight not set" — exactly what the UI renders as *new — needs weight*. CHECK still applies when a weight is present. Added `v_profile_readiness` so an admin can see which of the 243 profiles are computable and B3 can refuse to compute a profile with missing weights | Resolved |
| 2026-07-29 | SRS had no real maps | Milinda's review: *"I cannot see any polygons of DS divisions, and where is the web-GIS analysis?"* Fair. The prototype draws a **schematic tile grid**, not real geometry, so the screen annex left a reader unable to see this is a GIS at all — and the toolbox appeared only as five lines of requirement text | Added `generate_maps.py`, rendering **4 figures from the actual 330-polygon shapefile**: divisions by province, ADM1/2/3 nesting, area per division, and a worked `DIST_TO_NEAREST` toolbox output. Expanded §6.7 with the six seeded operations, why derived indicators need them, and why the two-step commit exists. Annex A2 now states plainly that the prototype's tiles demonstrate interaction, not cartography, and points to Figure 2 for the real boundaries. **No figure is a mock vulnerability score** — none exists yet, and inventing one for a funder document would misrepresent the project | Resolved |
| 2026-07-29 | Toolbox figure took 3 attempts | A worked example has to *vary* to be worth printing. Using the district layer as the overlay gave every division ~100% (districts tile the country); a 10 km coastal band was nearly as flat, Sri Lanka being narrow. A third attempt reported a maximum of 12 km inland — wrong, because simplifying each division independently left slivers, so the union's **interior holes were counted as coastline** | Union the buffered divisions and take **exterior rings only**. Distance now runs 0–107 km with 54 divisions within 5 km of the sea, and the interior gradient is visibly correct. Worth remembering: a figure that comes out uniform is usually a bug, not a finding | Resolved |
| 2026-07-29 | D5 SRS | Needed a specification credible to a funder, not a wish-list | `SRS.md` → `SRS.docx` (30 pp). Written for **GGGI review**: methodology and data provenance up front, 53 functional and 9 non-functional requirements, and a **§10 Delivery status** table stating plainly what is built versus specified — the database and data foundation are real, the application layer is not. Annex A is a **17-screen walkthrough of the prototype**, each figure tied to the requirements it illustrates and captioned as *prototype, not delivered software*. Annex C lists the passing negative tests, which is what shows the integrity rules are enforced rather than merely described. Every quantitative claim (174 / 330 / 243 / 3,664 / 1,783 / 65,976.7 km² / 17,826) was machine-checked against the source artefacts — 0 mismatches | Resolved |
| 2026-07-29 | Word packaging | Pandoc renders most tables correctly but silently mangles others: short tables get **no `tblGrid` at all** (later columns fall off the page), and tables it does size are sized from content length alone, making a "Method" column so narrow that POST wrapped one letter per line. Separator-dash width has no effect — the behaviour depends on whether content forces wrapping | `build_docx.py` post-processes the `.docx`: computes column widths from the source markdown, then rewrites **every** table's `tblGrid` *and* its per-cell `tcW` (which override the grid in Word), with a 1250-DXA floor. All 26 tables now sized, none below the floor, each summing to the text width. Verified by rendering to PDF and reading the pages | Resolved |
| 2026-07-29 | Screenshot capture | Headless Chromium would not start in the sandbox (missing X libraries, no root) and the browser extension mangles `file://` URLs | `apt-get download` + `dpkg -x` into a user-writable prefix with `LD_LIBRARY_PATH` — 16 libraries, no root required. Added `fonts-noto-color-emoji` after the first pass rendered sidebar icons as tofu boxes. 17 screens captured at 2x against the real catalogue | Resolved |
| 2026-07-29 | D1 + D2 diagrams | Phase 0's two diagrams were still outstanding, and the Figma connector was never authorised | Generated with Graphviz instead — `design/architecture/generate_diagrams.py`, same reproducible pattern as the ERD. **D1** shows 6 layers (users · inputs · frontend · FastAPI · PostgreSQL · agent) with **border style carrying status**: solid = built and verified, dashed = designed only. So the picture states plainly that the database is real and everything above it is not yet. **D2** traces raw value → `import_batch` → normalisation → weighting → hazard/exposure indices → `vulnerability_result` → SSP projection → monitoring, with the A3 period rules and the `v_profile_readiness` gate drawn as constraints rather than left implicit. Both document the system **as built**, not as originally imagined | Resolved |
| 2026-07-26 | ERD regenerated | `erd.dot` was **hand-written**, which is exactly why it silently went stale when D8 added five tables — nothing tied the picture to the schema | Replaced with `generate_erd.py`, which **parses the DDL** (all three SQL files, including `ALTER … ADD COLUMN`) and emits `.dot/.svg/.png`. Now **28 tables, 65 relationships, 0 unclassified**, grouped into 9 colour-coded modules with the D8 toolbox and `import_batch` as their own clusters. Also switched `rankdir` LR→TB: LR produced a 1499×4160 strip (ratio 0.36) that was unusable on a page; TB gives 3141×2031 (~1.55, landscape). Re-run after any schema change — the diagram can no longer disagree with the database | Resolved |
| 2026-07-26 | SQL verification | `pglast` proves syntax only — it accepted an INSERT naming a column that did not exist | Added a semantic pass over all three DDL files: builds the table→column map (including `ALTER … ADD COLUMN`) and checks every INSERT column list and every FK target. Caught `spatial_layer.output_note`; now **0 problems across 28 tables / 11 types**. Worth re-running after any schema edit | Resolved |
| 2026-07-26 | UI prototype refresh | Prototype still carried invented DS lists (21 for Central) and 3 hand-written sample profiles | Regenerated its reference data from the real artefacts: **330 DS divisions**, 174 canonical variables, **243 real profiles** with carried-forward weights. Rewrote the data-officer wizard to the upload→confirm→save order and added the Profile weights screen. Verified headlessly under jsdom: import→save→re-edit→v3 loop, all roles/screens, **72 weights-screen and 216 map combinations — 0 runtime errors** | Resolved |
| 2026-07-02 | D7 prep | Inventory of all 243 workbooks → `design/ingestion/variables_inventory.csv` (1,916 variable rows, 243 profiles, ~300 distinct variables, hazards: Flood/Drought/Landslide) | 3 anomalies for sector teams (see VARIABLES_INVENTORY_NOTES.md): NW Cattle–Flood exposure sums 85; Uva Hu.Settlements–Landslide sums 105; Eastern Paddy–Flood duplicate E7. Livestock subsector names need normalization (Buffalo/Buffaloa/Pig Sheep) | Mostly resolved 2026-07-26 — duplicate E7 fixed by unique catalog codes; subsector names normalised in generator (`LEGACY2NEW`). The two weight-sum anomalies are moot: weights are being re-confirmed per profile anyway (see Weights row). Inventory retained as the source of province coverage + legacy weights |
| 2026-07-29 | B1 first real run | `check_prereqs.ps1` reported PostgreSQL missing, so a fresh PostgreSQL 16 install was attempted via winget — it failed with "port not available." Investigation found a **pre-existing PostgreSQL 15 server already installed and running** (2026-05-03, `C:\Program Files\PostgreSQL\15`) with a full PostGIS bundle (PostGIS, pgRouting, MobilityDB, h3-pg, pgpointcloud, ogrfdw) — from an earlier, unrelated setup on this machine | No install needed. Built `riskradar` as a new database on the existing server instead (does not touch any other database there). The failed PG16 winget attempt left no files behind — nothing to clean up. Credentials for the existing server: `postgres` / (given by Milinda in chat, not stored here) | Resolved |
| 2026-07-29 | `apply_native.ps1` crash on optional pgvector check | Script sets `$ErrorActionPreference = 'Stop'`; the pgvector probe (`CREATE EXTENSION IF NOT EXISTS vector` with stderr redirected via `*>$null`) is *meant* to fail silently when pgvector is absent, but the redirected native-command stderr became a terminating error under `Stop` and aborted the whole build | Wrapped that one call in `try {...} catch {}` so the expected failure is swallowed and `$HasVector` still resolves correctly from `$LASTEXITCODE` | Resolved |
| 2026-07-29 | `generate_seed.py` emitted an invalid enum value | Line ~231 wrote `direction = "lower_is_worse"` for indicators with a `-` relationship (e.g. `PCT_FOREST_COVER` — more forest cover lowers vulnerability), but `schema.sql`'s `indicator_direction` enum only defines `higher_is_worse` / `higher_is_better` — no `lower_*` variants exist. Seed load failed 4,432 lines in with `invalid input value for enum indicator_direction`. Same class of bug as the 2026-07-26 "Seed SQL was broken" row: parsing had never caught it because nothing resolves enum labels against the type definition | `lower_is_worse` ⇔ `higher_is_better` are the same semantic (low value is bad ⟺ high value is good), so fixed the generator to emit the enum's actual label and regenerated `seed_all.sql` (counts unchanged: 174/243/3,664, 99 rows affected). Per working rule 1, the generator was fixed, not the generated SQL | Resolved |
| 2026-07-29 | `load_spatial.ps1` — GDAL build has no live PostgreSQL driver | The `ogr2ogr` bundled with the PostGIS install (GDAL 3.7.1) was built **without libpq** — `ogr2ogr -f PostgreSQL ...` (direct-connect driver) failed with "Unable to find driver \`PostgreSQL'." Only the `PGDUMP` driver is present. No QGIS/OSGeo4W install exists on this machine to fall back to. This path had never been exercised end-to-end before (see the "Nothing in backend/ has been executed against a real server" note) | Switched all three shapefile loads (`SL_RDSD`, `SL_PD`, `SL_DSD`) to `ogr2ogr -f PGDUMP` → temp `.sql` → `psql -f`, using the same GDAL binary already present — no new install required. Refactored into a shared `Load-Shapefile` helper | Resolved |
| 2026-07-29 | `load_spatial.ps1` — GDAL LAUNDERs field names | The PGDUMP/PG writer lowercases shapefile field names by default (`ADM3_EN` → `adm3_en`, same for `ADM1_EN`/`ADM2_EN`). The merge SQL referenced the original-case quoted names (`s."ADM3_EN"`), which would have failed on the very first real run of this script regardless of which ogr2ogr driver was used — a latent bug, not something the driver switch introduced | Updated all references (the DSD↔register join, the "no match" check, and the province/district `spatial_feature` inserts) to the lowercase laundered names | Resolved |
| 2026-07-29 | `load_spatial.ps1` — PowerShell mangled SQL with embedded double quotes | The `Sql()` helper passed multi-line SQL to `psql -c $string`. When PowerShell serialises a string argument containing embedded `"` (JSON literals like `'{"name":{"type":"string"...}}'`, or quoted identifiers) into a native process's raw command line, it can drop the inner quotes — `psql` received `{name:{type:string...}}` and errored with `invalid input syntax for type json`. Not caught earlier because most `Sql()` calls in this file happened not to contain literal double quotes | Rewrote `Sql()` to write the statement to a temp `.sql` file and invoke `psql -f`, sidestepping native-argument quoting entirely. Also converted the one remaining raw `psql -c` heredoc call in the file to use the same helper for consistency | Resolved |
| 2026-07-29 | `smoke_test.sql` — geometry-type test tripped the wrong trigger | The "polygon rejected on the LINESTRING-only ROAD layer" test inserted a polygon **without** the `class` attribute that the ROAD layer's `attribute_schema` also requires. PostgreSQL fires multiple `BEFORE INSERT` triggers in alphabetical order by trigger name, so `spatial_feature_attr_guard_trg` ran before `spatial_feature_type_guard_trg` and raised "Layer 3 requires attribute \"class\"" instead of the intended geometry-type error — an ordering detail nothing should rely on, and the test wasn't isolating the one condition it meant to check (the LULC attribute test right below it already did this correctly, with valid geometry) | Added a valid `'{"class": "A"}'` attributes payload to the ROAD-layer test insert so only the geometry-type mismatch is exercised, matching the isolation pattern already used by the attribute test. Shared by both `smoke_test_native.ps1` and `smoke_test.sh` (Docker), since both run the same `smoke_test.sql` | Resolved |
| 2026-07-29 | **B1 database — first successful build** | First real execution of the native-PostgreSQL route end-to-end, against the pre-existing PostgreSQL 15 + PostGIS server (see row above) | `apply_native.ps1 -Reset` then `smoke_test_native.ps1` — **all smoke tests pass.** 9 provinces, 3 hazards, 8 sectors, 12 subsectors, 174 variables, 269 aliases, 243 profiles, 3,664 memberships (1,881 weighted / 1,783 awaiting weight, as designed), 330 DS divisions (all valid geometry, no overlaps, total area 65,976.7 km² — confirms EPSG:5235 was used), 6 spatial layers, 6 toolbox operations. `v_profile_readiness`: 0/243 computable pending weights, exactly as intended (B3 must refuse until weights are filled in-app) | **Resolved** |
| 2026-07-30 | **Reviewed the deployed Risk Radar** | Milinda: *"i need improved version of it"* — a first version is already live at `riskradar.geoinfobox.com` with a Django REST API. Everything designed so far had been designed **without looking at what users already have**, which is how a replacement ends up being an unfamiliar rewrite rather than a better version of the same thing | Inspected the running system first-hand, **read-only**, stopping at the point each issue was confirmed. Findings in `design/LIVE_SYSTEM_REVIEW.md`, UI mapping in `design/ui/UI_REDESIGN_BRIEF.md`. Two classes: **functional** (a score cannot be decomposed; no time, track or provenance; DSD layer ≈20 s to draw because geometry ships as raw GeoJSON; stale session state shows *Logout* while the API returns 401) and **security** (DRF has no `DEFAULT_PERMISSION_CLASSES`, so every endpoint including writes is open to anonymous users; `DEBUG=True` dumps settings, paths and the full URL table; running on `manage.py runserver`; CORS allow-all with credentials; cookies not `Secure`). **I did not log in** — entering a password into a form is a hard limit — so *Add Data* and *My Data* remain uninspected. Recommended rotating the shared credential, which is weak and has passed through a chat log | Resolved |
| 2026-07-30 | **0% and "no data" are the same colour** | The single most consequential finding. At DSD level most divisions render `0.0%` and are left uncoloured; the three-band legend starts at 1%, so zero falls outside every band. Colombo, Galle, Kalutara, Badulla, Kilinochchi, Mannar and Mullaitivu all read `0.0%` at district level — which cannot be a real assessment result. **A planner reading that map concludes those areas are safe.** For a tool meant to steer adaptation finance that is not a presentation nit, it is a correctness failure | Promoted to a first-class concept rather than a UI fix: **assessed / pending / unassessed** defined in SRS §1.3, required to stay distinct through database, API and map (FR-5.8 to FR-5.11), given a system-wide non-functional rule (NFR-10 *honest absence* — absence must not become zero at a layer boundary, which is where it usually does), and surfaced as a coverage statement on every view. `v_profile_readiness` already distinguishes *pending*; what was missing was carrying it to the surface | Resolved |
| 2026-07-30 | SRS revised to v1.1 | The SRS was written before the deployed system was seen. Left as-is it would have specified a replacement without acknowledging the thing being replaced — and would have repeated its geometry-delivery mistake, since NFR-3 said only "2 seconds per province" with nothing about how geometry reaches the browser | Added **§1.5** (what the deployed system does well and this keeps — the map-is-the-app structure, the sector/hazard/level controls, four admin levels, public read, print — against what it cannot do), **§5.5** (its `vulndata` row is a *conclusion*, not an indicator, so FR-11.2 migrates it as an archived result with composition recorded as unknown rather than faking provenance), **§6.11** (8 migration requirements), **Annex A.0** (screen-by-screen continuity table), **Annex D** (the review). Rewrote **§6.5** into five groups: core map, explaining the score, coverage, time, interface states. Hardened NFR-3 to require vector tiles, and added NFR-4b/4c/4d so the deployed system's security posture is not rebuilt by default. **Nothing in §2, §5.1–5.4 or §8 changed** — the review confirmed the model rather than challenging it; every capability the deployed system lacks is one the schema already provides for. 91 requirement IDs, no duplicates, no dangling cross-references (checked programmatically). Opened **O-7** (do the extra 7 sectors / 17 hazards stay?), **O-8** (is GND data real?) and **O-9** (deployed security findings unremediated — independent of this build, should not wait for it) | Resolved |
| 2026-07-31 | **Reviewed the existing React frontend** | Milinda added `FrontEnd/` to the repo. Everything designed so far had assumed the frontend did not exist | 45 files, ~8,400 lines. **The map-select → side-panel entry flow already exists and already supports multi-select** (`FindByName_DSD.jsx` → `DataInput_SidePanel_v4.jsx` takes a *list* of divisions) — so the workflow agreed the previous day is half-built, not new. **What is entered is a 1–10 ordinal from a dropdown**, multiplied by 10 and displayed with a `%` sign — so the live map's "66.0%" is an average of ten-point opinion ratings. Located the 0%-vs-no-data bug exactly: `DataAnalyse_Map.js:70`, where 0, null and undefined all fall through to `transparent`. Two more in the same expression: a rating of exactly **10 renders invisible** (`< 10`), and the identical rule is written three times with one copy disagreeing. Also `response.ok` tested on an axios response (always undefined) so **every POST is followed by a redundant GET+PUT** — 45 requests to save 15 divisions. Four numbered copies of the side panel with three live; two mapping libraries (Leaflet not in `package.json`); `dist/` committed; hardcoded API URL; no tests. Full findings in `design/ui/FRONTEND_CODE_REVIEW.md` | Resolved |
| 2026-07-31 | Map-first data entry workflow | Milinda: *"i do not need something like this... i need to visually select ds division and add vulnerable data"* — rejecting both the schematic tile prototype and the workbook-first flow. Then clarified the order: sector → subsector → hazard → **weights** → import, with experts editing imported values and general users giving only a perceived rating | `design/ui/DATA_ENTRY_WORKFLOW.md`. Context resolves to one profile, then the map becomes the **worklist** — coloured by entry state (empty / part-filled / complete / error), not by vulnerability, because nothing is computed yet. Resolved the one conflict in the stated order: weights come before upload, but the workbook carries a WEIGHTS tab, so **the screen is authoritative and the file advisory** — on upload a diff is shown and the officer chooses. Two open questions raised: min–max normalisation shifts every score as the last divisions arrive (recommend holding until a province is complete), and part-filled divisions should be *pending*, not scored on a subset | Resolved |
| 2026-07-31 | **Merged an independent IEEE 29148 SRS** | Milinda commissioned a parallel SRS from Gemini 2.5 Pro — 20 modules, ~180 requirements, Angular/NestJS/GeoServer/Kubernetes stack, 5 AI agents. Written without sight of anything built, so taken wholesale it would discard the 174 variables, 243 profiles, the tested 28-table database and the running React frontend | Merged selectively — 6 modules adopted, 9 adapted, 3 deferred to a new Annex F, 2 rejected. Analysis in `SRS_INTEGRATION_GEMINI.md`. **Three conflicts settled by Milinda, all to the recommended option:** (1) risk equation — keep `Vulnerability = f(Exposure, Hazard)` and add `Risk = H × E × V` as a *second, separately stored output*, because our 174 variables are already split into two domains and re-classifying into three would invalidate all 243 profiles; the new asset-exposure term needs no new collection, it is a spatial-toolbox intersection; (2) stack — keep React + FastAPI + PostGIS, take **GeoServer only** for OGC; (3) scope — core plus cheap wins. **Three real gaps the draft caught: Tamil** (NFR-8 said English + Sinhala only — a compliance failure for a Sri Lankan government platform, now O-10), **no audit log** in any of the 28 tables, and **no OGC services**. Also adopted AHP + entropy weighting (AHP's consistency ratio is exactly the credibility check the offline panel sign-off lacks), 18 coded validation rules, time slider and swipe, health check and backup. Corrected four Sri Lanka facts the draft got wrong (331 vs 330 DSDs, 14,022 vs 14,019 GNDs, storage SRID, weights summing to 1.0 vs 100 per domain) | Resolved |
| 2026-07-31 | SRS v1.2 | v1.1 had no risk layer, no audit trail, no OGC, no Tamil, and every requirement read as equally mandatory | New **§1.6** (how the draft was merged), **§2.6** (the risk layer, and why two decompositions of exposure coexist without contradiction), **§6.12** risk assessment, **§6.13** audit and versioning, **§6.14** interoperability, **Annex E** (18 validation codes as an interface contract — addable, never renumbered), **Annex F** (Phase 2 backlog recorded with reasons, so deferral is visible rather than silent). Added FR-3.8–3.11 for AHP/entropy, NFR-11–13, a Must/Should/Could convention, and O-10/O-11. **§2.1–2.5, §5.1–5.4 and §8 untouched.** 122 requirement IDs, no duplicates, no dangling cross-references (checked programmatically); 47 tables sized in the docx build | Resolved |
| 2026-07-31 | **Independent review of SRS v1.2 (GLM 5.2)** | Milinda commissioned a third-party review. 24 recommendations across IEEE 29148 compliance, functional completeness, technical consistency and editorial | Adopted 20, adapted 2, declined 2 — all with reasons. Strongest catch was the **dual meaning of *exposure***: §2.1 uses it for *characteristics of the exposed system* (a vulnerability domain), §2.6 for *assets in harm's way* (a risk multiplier). v1.2 acknowledged the tension in prose but kept one word for both. New **§2.7** names them apart — *exposure characteristics* vs *asset exposure* — and FR-5.16 now forbids a bare "exposure" anywhere in the interface. The stored enum stays `exposure`, since 3,664 rows carry it; only labels change. Also adopted: acronyms list, carry-forward flag semantics, AHP justification text, community rate limiting, SSP parameter mechanism, monitoring entry path, raster deferral stated openly, AI graceful degradation, expert-review states for AI answers, notifications (§6.15), and NFR-14–18 | Resolved |
| 2026-07-31 | **Risk index was mathematically wrong — caught by testing the review, not by the review** | v1.2 defined `Risk = H × E × V` with all three terms in [0,1], then applied the same five-band classification used for vulnerability. Neither the Gemini draft nor the GLM review questioned it | Simulated 200,000 divisions with independent uniform inputs. The raw product has mean **0.125** and puts **78% of divisions in "very low" and 0% in "very high"** — not a finding about Sri Lanka, an artefact of multiplying fractions. Changed FR-12.1 to the **geometric mean** `(H·E·V)^(1/3)`, which preserves the properties that made the multiplicative form right (any zero term zeroes risk; no term compensates for another) while returning mean 0.422 and a usable spread across all five bands, on the same scale as vulnerability so the two can share a legend. Worth remembering: a formula that type-checks can still be unusable, and the cheapest way to find out is to run numbers through it | Resolved |
| 2026-07-31 | Declined two of the 24 review recommendations | R1 asked for a ±0.01 tolerance on the weight-sum rule, reasoning from floating-point drift. R19 asked to renumber FR IDs so they ascend down the page | **R1 rests on a false premise.** `profile_indicator.weight_pct` is `NUMERIC(6,3)` — exact decimal, not float. 33.333 + 33.333 + 33.334 is exactly 100.000, and three decimal places always admit an exact split. Loosening an exact rule to accommodate a problem the schema does not have would let a genuine 99.99 through. Instead FR-3.3 now states the exactness is achievable and required, clients must round to 3dp before submitting, and FR-3.3b makes the **UI** help the user reach 100 (distribute the remainder) rather than the rule bend. **R19 was declined** because a requirement ID is a stable name, not a position — renumbering would falsify every ID already cited in this log, in the UI briefs and in the review itself. Added an explicit identifier convention in §6 instead, and Annex G lists everything in numeric order | Resolved |
| 2026-07-31 | Annex G is generated, not written | IEEE 29148 wants requirements-to-verification traceability. A hand-maintained 146-row matrix drifts the first time a requirement is added | `generate_traceability.py` derives Annex G from the requirement tables in SRS.md itself and injects it between markers; `--check` fails a build if it is stale. Assigns verification method per section (Test / Demonstration / Inspection / Analysis) since that is a property of the kind of requirement, not the line. **First run reported itself permanently stale** — `collect()` was reading the generated annex's own table rows and doubling every requirement. Fixed by stripping the marker region before parsing. Now 146 requirements: 125 FR, 21 NFR, 120 Must / 24 Should / 2 Could | Resolved |
| 2026-08-01 | SRS v1.3 → expert panel | v1.2 had been reviewed by two AI systems but never by the people who own the domain. A specification that has only ever been checked for internal consistency can be consistently wrong | Issued `SRS_v1.3_Expert_Panel_Questions.docx` — the open modelling choices put as questions rather than buried as assumptions, each stated with the option already applied so a non-answer still leaves the build unblocked. Panel responses recorded in `SRS_v1.3_Panel_Review_Resolution.docx` (2026-08-06), and `Expert Review/Expert rewview_v1.docx` alongside | Resolved |
| 2026-08-06 | SRS v2.0 | v1.x had grown by accretion — three merges and two review rounds layered onto a document written before the deployed system was seen. It could no longer be handed to a developer and read straight through | Rewritten as **v2.0: complete and self-contained**, buildable without reference to any earlier document. Panel answers folded in as definite rules, each marked **[P-n]** and listed in **Annex C** with what would change if reversed — so the build proceeds on stated assumptions instead of stalling on open ones. §10 replaced the B/F numbering with **ten stages**, each naming what must be true before the next begins | Resolved |
| 2026-08-07 | **The formula changed again — third time in eight days** | v1.2 used the geometric mean `(H·E·V)^(1/3)`; v2.0 used `√(H × E)`, chosen because the raw product clusters near zero and leaves the map nearly uninformative. The panel instructed otherwise | **v2.1: the published index is the raw product `H × E`, min–max renormalised within its own province** (P-14). Renormalisation fixes the clustering that the square root was introduced to fix, so the spread is recovered — but at a price the square root did not carry, and it must be understood: the score is now **relative to its province**. No cross-province comparison, no national ranking, every province yields exactly one 1.000 and one 0.000 per profile, and **a division's published score moves when its neighbours' data arrives**. That last point is not yet resolved anywhere: publishing a partly-collected province shows scores that will change without anything about that division changing | **Resolved as specified — the moving-score consequence is open** |
| 2026-08-08 | **Frontend stack reversed: React → Angular** | Milinda: *"we use openlayers and angular for building this app."* OpenLayers was already correct in the SRS (§4.1, FR-5.1); the live change is Angular. This **reverses the 2026-07-31 Gemini-merge decision**, where Angular was proposed and rejected in favour of keeping the working React code | **Angular + TypeScript + OpenLayers**, backend unchanged. Recorded in SRS **v2.2 §4.1** with the reasoning stated in the spec rather than only here: a codebase the maintaining team cannot service is worth less than a rebuild, and the earlier decision rested on preserving working code — the grounds changed, so the decision follows. Cost is bounded because (a) Angular is a frontend choice and implies nothing for FastAPI, the 28-table schema, the generators or the toolbox, and (b) the **interaction** the React app arrived at — map-select → multi-select side panel — is the workflow in §6.2 and carries over; only its code does not. `FrontEnd/` marked **retired, reference only**: read it for the workflow and for the three defects a rebuild must not repeat (absent value rendered as zero, maximum rating invisible, redundant read-and-update after every write). Updated: `CLAUDE.md`, `PROJECT_GUIDE.md`, this file, `FRONTEND_CODE_REVIEW.md`, and `generate_diagrams.py` — script edited and **re-run**, per working rule 1 | **Resolved** |
| 2026-08-08 | Documentation had drifted for eight days | The tracker was last updated 2026-07-31 while the SRS moved v1.3 → v2.0 → v2.1. Seven files still specified **MapLibre**, which was never used — the deployed and local frontends are both OpenLayers. Nothing recorded the ten-stage plan, so two build plans were live at once. There is **no git repository**, so this file is the only history that exists | Reconciled all of it against v2.2 and added the rows above. `build_docx.py` was hardcoded to `SRS.md`; parameterised to take the source on the command line so a version bump no longer needs a script edit. Note `generate_traceability.py` targets the **superseded** `SRS.md` only — v2.x carries Annexes A–D and no Annex G, so it is not part of the v2.2 build. **Version control is still the outstanding recommendation**: three formula revisions in eight days with no history is the risk this log is carrying alone | Resolved — git still open |
| 2026-08-08 | **Git initialised** | Seven weeks of design decisions, three formula revisions and a stack reversal, with **no version history** — this file was the only record, and a bad edit to it was unrecoverable | `git init` + `.gitignore`, initial commit `37ff8e3`: **664 files, 42,296 insertions**, 78 MB. Policy is deliberately *not* clever — track source **and** the irreplaceable data (36 MB of shapefiles, the 243 distributed workbooks, the SRS builds actually sent for review); ignore only what a command can recreate (`node_modules`, `dist`, `__pycache__`, `.angular`) plus `.env` so the database password cannot be committed. `FrontEnd/dist` was in the tree and is now correctly excluded. `git fsck` clean, working tree clean | Resolved |
| 2026-08-08 | Git on a OneDrive mount — two traps | `git add -A` over the whole tree timed out mid-write and was killed, leaving a stale `.git/index.lock` and **464 orphaned `tmp_obj_*` files** in `.git/objects`. A later `git add` then refused to run at all, reporting another git process — the classic misleading message, since nothing was running | Removed the stale lock and the 464 temp objects, then staged in chunks rather than one pass: the 500 spreadsheets alone took 48 s. `git fsck` afterwards returns clean, so the repository is sound. **Two things follow.** (1) Run git **natively in PowerShell**, not through a mounted sandbox path — it is far faster and avoids this entirely. (2) `.git` living inside a synced OneDrive folder is a real corruption risk if two machines sync mid-write; exclude `.git` from sync, or push to a remote and treat that as the source of truth | Resolved — remote still recommended |
| | | | | |

---

## 4. Maintenance rule

When a function finishes: set its **Executed** cell to ☑, fill **Date** + **Output**, update
the **§1 summary counts** and the **Current phase** field, and add any problems to **§3**.
Keep this file and `PROJECT_GUIDE.md`'s Status log in sync.
