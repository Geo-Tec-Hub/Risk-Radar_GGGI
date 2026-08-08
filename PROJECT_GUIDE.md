# Climate Vulnerability Web-GIS — Project Guide

> **Single source of truth** for building the DS-division-level Climate Vulnerability
> Assessment platform for Sri Lanka. This file sequences the entire build, names the
> skill/plugin to invoke for each piece, and tracks completion. **Update the checkboxes
> and the "Status log" at the bottom every time a task finishes.**

- **Owner:** Milinda
- **Created:** 2026-06-20
> **⚠ Superseded, 2026-08-08.** The build plan is now **SRS §10's ten stages**
> (`design/srs/SRS_v2.2.md`). The B1–B8 / F1–F6 numbering below and the prompts
> attached to it are kept as a record of what was run and why, not as
> instructions. Where a prompt names React or MapLibre it is describing a
> superseded decision — see the stack line.

- **Last synced:** 2026-07-26 (status lines below are stale; see `PROGRESS_TRACKER.md`)
- **Status:** Phase 0 — D1 ☑ · D2 ☑ · D3 ☑ · D5 ☑ · D6 ☑ · D8 ☑ · **D4 ◐ is all that remains**
  Phase 1 — **B1 database built & verified 2026-07-29**; next is B2
  (D7 ingestion loop unblocked). Live board: `PROGRESS_TRACKER.md`
- **Stack (locked 2026-08-08):** Angular + TypeScript · OpenLayers · FastAPI (Python) · PostgreSQL + PostGIS + pgvector

---

## 1. Concept (the model in one screen)

```
Vulnerability  =  f( Exposure , Hazard )      ... per DS division, per sector/subsector

Hazard      → many hazard TYPES (flood, drought, landslide, heat, sea-level rise, ...)
              each type has PARAMETERS (indicators) → normalized hazard index [0..1]

Exposure    → 13 SECTORS, each with SUBSECTORS
              each subsector has PARAMETERS (indicators) → normalized exposure index [0..1]

Three vulnerability TRACKS (same schema, distinguished by a `source` provenance column):
  1. Data-driven      → real indicator values (Excel upload or manual entry)
  2. Expert-driven    → external experts feed parameter values from their knowledge
  3. Community-driven  → community members feed values via their own logins

SSP scenarios (SSP1–SSP5) → scenario-parameter layer → projected impact on sectors/subsectors
AI agent layer  → RAG over Postgres + pgvector → "what is the impact and what measures help?"
                  experts can add inputs to agent outputs
Monitoring     → predicted impact (system) vs actual observed results → close the loop
```

**Design principles (decided):**

1. **Normalization happens server-side, not in Excel.** The Excel template and manual form
   carry *raw* indicator values + metadata. The backend computes the normalized index
   (min–max / z-score, configurable per indicator) so all three tracks normalize
   identically and stay comparable.
2. **Indicator schema is config-driven, not hardcoded.** Hazard types, the 13 sectors,
   subsectors, and their parameters live in an `indicator_catalog` table. Adding a hazard
   or sector is data entry, not a code migration. The Excel template *and* the manual-entry
   form generate themselves from the catalog.
3. **One Postgres instance** serves PostGIS geometry *and* the pgvector agent retrieval index.
4. **Three tracks = one schema + `source` column + role-based logins.** Not three systems.

---

## 2. Repository / folder layout

```
Risk Radar/
├── PROJECT_GUIDE.md          ← this file (the living plan)
├── design/                   ← Phase 0 outputs (finalize before any code)
│   ├── README.md             ← index of design artifacts
│   ├── architecture/         ← system, data-flow, agent-layer diagrams
│   ├── database/             ← ERD, schema DDL, indicator_catalog model
│   ├── ui/                   ← wireframes, UI mockups, screen inventory
│   ├── srs/                  ← software requirements spec → final Word doc
│   ├── templates/            ← Excel upload templates (hazard / exposure)
│   └── ingestion/            ← SECTOR_INGESTION_PLAYBOOK.md + SECTOR_REGISTRY.md
├── frontend/                 ← Angular + TS + OpenLayers (Stage 5)
├── FrontEnd/                 ← RETIRED React app, reference only
└── backend/                  ← FastAPI + PostGIS + pgvector (Phase 1+)
```

---

## 3. How to use this guide with skills

Each component below names a **skill or plugin** to invoke and a **copy-paste prompt**.
Workflow for every component:

1. Copy the **"Prompt to run"** block into the chat.
2. The relevant skill produces the artifact into the folder shown.
3. When it's done, **tick the checkbox**, fill the **Status log** row at the bottom, and
   move to the next component.

> Rule of thumb baked into these prompts: **research/define content first, then invoke the
> output-format skill** (docx/xlsx/pptx) to package it.

| Piece of the project | Skill / plugin | What it produces |
|---|---|---|
| Architecture & data-flow & ERD diagrams | `figma-generate-diagram` (or inline visualizer) | system / flow / ERD diagrams |
| Excel upload format + data model | `xlsx` | working `.xlsx` templates w/ validation |
| Reading sample data you upload | file/PDF reading (`pdf`) | parsed real schema, not guesses |
| Technical spec / design doc | `doc-coauthoring` → `docx` | structured spec → polished Word doc |
| Interactive UI mockups | `web-artifacts-builder` | clickable React/Tailwind prototypes |
| Stakeholder slides / one-pagers | `pptx`, `canvas-design` | decks, posters |

---

## 4. Build sequence

Legend: ☐ = not started · ◐ = in progress · ☑ = done

### PHASE 0 — Design (finalize before writing code)

#### ☑ D1. System architecture diagram
- **Produces:** `design/architecture/system-architecture.(svg|png)` — frontend ↔ FastAPI ↔ Postgres(PostGIS+pgvector) ↔ agent layer, plus the 3 tracks and SSP/monitoring flows.
- **Skill:** `figma-generate-diagram` (or inline visualizer — no Figma account needed).
- **Prompt to run:**
  > "Create a system architecture diagram for the climate vulnerability web-GIS: React+MapLibre frontend, FastAPI backend, one PostgreSQL+PostGIS+pgvector store, an AI agent RAG layer, and three ingestion tracks (data/expert/community) with role-based login. Show the SSP scenario engine and the predicted-vs-actual monitoring loop. Save to design/architecture/."

#### ☑ D2. Data-flow diagram (vulnerability pipeline)
- **Produces:** `design/architecture/data-flow.(svg|png)` — raw indicator → normalization → hazard/exposure index → vulnerability = f(E,H) → SSP projection → impact → monitoring.
- **Skill:** `figma-generate-diagram` / inline visualizer.
- **Prompt to run:**
  > "Create a data-flow diagram showing: raw indicator values (Excel/manual) → server-side normalization → normalized hazard index + normalized exposure index → vulnerability = f(exposure, hazard) per DS division → SSP scenario projection → sector/subsector impact → monitoring (predicted vs actual). Save to design/architecture/."

#### ☑ D3. Database ERD + schema
- **Produces:** `design/database/erd.(svg|png)` and `design/database/schema.sql` (DDL).
- **Core tables:** `ds_division` (geom), `indicator_catalog`, `hazard_type`, `sector`, `subsector`, `indicator_value` (with `source` enum: data/expert/community, `user_id`, `scenario_id`), `vulnerability_result`, `ssp_scenario`, `scenario_parameter`, `impact_projection`, `monitoring_observation`, `users`/`roles`, `agent_document` + `agent_embedding` (pgvector).
- **Skill:** `figma-generate-diagram` for the ERD; write DDL by hand into `schema.sql`.
- **Prompt to run:**
  > "Design the PostgreSQL+PostGIS+pgvector schema for this project. Produce an ERD diagram AND a schema.sql DDL file in design/database/. Make the indicator schema config-driven via an indicator_catalog table; use a single indicator_value table with a source provenance column (data/expert/community), user_id, and scenario_id. Include vulnerability_result, ssp_scenario, scenario_parameter, impact_projection, monitoring_observation, users/roles, and pgvector tables for the agent RAG layer."

#### ◐ D4. UI screen inventory + wireframes
- **Produces:** `design/ui/screen-inventory.md` + low-fi wireframes.
- **Screens:** map dashboard (DS choropleth + layer/track/SSP toggles), data upload, manual entry form (catalog-driven), expert feedback form, community feedback form, sector/subsector impact explorer, AI agent chat, monitoring dashboard, admin/catalog manager (incl. pending-variable approval queue), **profile composer** (admin picks province×sector×hazard, selects parameters, assigns weights that must sum to 100 per domain, exports template), **ingestion mapping resolver** (reconciliation wizard for legacy sheets: unmatched columns → semantic suggestions from catalog+aliases → map-to-existing or propose-new-as-pending), auth.
- **Skill:** `web-artifacts-builder` (clickable prototype) — but first list screens in `screen-inventory.md`.
- **Prompt to run:**
  > "List every screen for the climate vulnerability web-GIS in design/ui/screen-inventory.md, then build a clickable React/Tailwind low-fi prototype of the main map dashboard (MapLibre DS-division choropleth with track + hazard/sector + SSP toggles and a side detail panel). Save the prototype to design/ui/."

#### ☑ D5. SRS / technical design document
- **Produces:** `design/srs/SRS.md` → `design/srs/SRS.docx` (for dev team / grant reviewer).
- **Skill:** `doc-coauthoring` to structure it, then `docx` to package.
- **Prompt to run:**
  > "Co-author a Software Requirements Specification for this project (scope, actors/roles, functional requirements for the 3 tracks, SSP engine, AI agent layer, monitoring; non-functional: spatial performance, security, data provenance; data model summary; API surface). Draft in design/srs/SRS.md, then produce design/srs/SRS.docx."

#### ☑ D6. Excel upload templates (hazard + exposure)
- **Produced (2026-07-26):** **243 per-profile workbooks** in `design/templates/generated/<Province>/`
  + `MANIFEST.csv`, built by `generate_templates.py` from `design/ingestion/FINAL_VARIABLES.xlsx`
  (174 canonical variables, 33 national profiles) and `design/ingestion/dsd_register.csv`
  (330 official DS divisions). Each workbook: 2 period tabs (2020–2025, 2025–2030) × real
  DS-division rows grouped by district, a reference-only WEIGHTS tab, README and hidden `_META`.
  Superseded the original two-generic-template idea — one workbook per province × sector × hazard
  is what the provincial teams actually fill.
- **Note:** templates carry **raw** values + metadata + DS-division key + indicator code (FK to catalog). Validation/dropdowns from catalog. Normalization is documented but performed server-side.
- **Ingestion is dual-path (decided 2026-07-02):** (1) **strict path** — generated per-profile templates (locked headers, pre-filled DS divisions, hidden metadata sheet w/ profile_code+version) validate exactly on import; (2) **reconciliation path** — legacy/ad-hoc sheets go through the mapping-resolver wizard: headers matched against catalog + `indicator_alias` (fuzzy/embedding suggestions); user maps to existing (alias persisted) or proposes new variable → lands as `status='pending'`, values held until admin approval; only 'active' variables can join profiles, and adding one to a profile forces a new profile version (weights re-sum to 100) — so new variables never silently affect calculations.
- **Weights are NOT carried by the workbook (decided 2026-07-26).** The WEIGHTS tab is
  reference-only. On import the app reads it, pre-fills a **Confirm weights** screen, and the
  officer confirms or edits before saving. Saving takes effect immediately — **no in-app approval
  gate in V1**; data is verified against a **local expert panel offline** and that sign-off is
  recorded as a free-text panel note. Weights stay editable afterwards from the **Profile weights**
  screen. Each save writes a new profile version so published scores remain explainable.
  Schema: `design/database/schema_weights_addendum.sql`.
- **Skill:** `xlsx`. If you have sample data, upload it first and I'll model your real schema (`pdf`/file reading).
- **Prompt to run:**
  > "Using the indicator_catalog model in design/database, create two Excel upload templates in design/templates/: one for hazard indicators, one for the 13 sectors/subsectors exposure indicators. Each row = DS division × indicator code × raw value + metadata (year, source, unit, notes). Add data validation/dropdowns and a README sheet. Do NOT normalize in Excel — note that normalization is server-side."

#### ◐ D7. Per-sector ingestion (repeatable loop, runs after D3)
- **Produces:** `sector` / `subsector` / `indicator_catalog` / `indicator_value` rows — one run per sector/subsector, from your uploaded Excel files. **No new tables per sector.**
- **Playbook:** `design/ingestion/SECTOR_INGESTION_PLAYBOOK.md` (full SOP + the copy-paste prompt). Each run logs to `design/ingestion/SECTOR_REGISTRY.md`.
- **Prompt to run (repeat per sector):**
  > "Ingest into the database: Sector = \<name\>, Subsector(s) = \<list or 'all sheets'\>, using the uploaded Excel file(s) \<filename\>. Treat domain as exposure (or hazard). Investigate every parameter column, register them in indicator_catalog under this sector/subsector, load raw DS-division values into indicator_value (source=data), compute normalized values, and update the sector registry."

#### ☑ D8. Spatial layer + toolbox data model
- **Produces:** `design/database/spatial-model.sql` + an addendum to the ERD. **No per-layer tables** — same catalog principle as indicators.
- **Tables:** `spatial_layer` (code, name, geometry_type, `attribute_schema` JSONB = national attribute contract), `spatial_feature` (layer_id, ds_division_id, feature_code, `geom geometry(Geometry,4326)`, `attributes` JSONB), `spatial_operation` (code, name, kind, params_schema), `computation_job`, `computation_result`. Extend `indicator_value` with `derivation` (raw_upload|computed|manual) + `computation_job_id` for lineage.
- **Decisions baked in:** geometry stored in EPSG:4326 for the map; **area/length/density computed in EPSG:5235 (SLD99 / Sri Lanka grid)** or via PostGIS `geography`; attributes validated against the layer's national `attribute_schema` on every import.
- **Prompt to run:**
  > "Design the spatial layer + analysis toolbox tables (spatial_layer with a national JSONB attribute_schema, spatial_feature with PostGIS geom + JSONB attributes keyed by ds_division and feature_code, spatial_operation/computation_job/computation_result for the geoprocessing toolbox) and add derivation + computation_job_id lineage fields to indicator_value. Output design/database/spatial-model.sql and update the ERD."

**☑ Gate:** Do not start Phase 1 (beyond B1) until D1–D6, D8 are reviewed and finalized.
D7 is an ongoing loop that begins as soon as D3's schema exists.

---

### PHASE 1 — Backend foundation (FastAPI + Postgres)

#### ☐ B1. Project scaffold + Postgres/PostGIS/pgvector setup
- FastAPI app skeleton, Docker Compose (Postgres w/ PostGIS + pgvector extensions), config, migrations (Alembic).
- **Prompt to run:**
  > "Scaffold the FastAPI backend in backend/: app structure, settings, SQLAlchemy + GeoAlchemy2, Alembic migrations, and a docker-compose with PostgreSQL enabling postgis and vector extensions. Apply the schema.sql / models from design/database."

#### ☐ B2. Indicator catalog + ingestion (Excel upload + manual entry API)
- Endpoints to manage `indicator_catalog`; parse uploaded Excel against the catalog; manual-entry endpoint. Stores raw values with `source`.
- **Prompt to run:**
  > "Implement catalog CRUD, an Excel ingestion endpoint that validates uploads against indicator_catalog and stores raw indicator_value rows with source provenance, and a manual-entry endpoint. Add tests."

#### ☐ B3. Normalization + vulnerability compute engine
- Server-side normalization (min–max / z-score per catalog config) → hazard index, exposure index → `vulnerability = f(exposure, hazard)` per DS division. Recompute per track.
- **Prompt to run:**
  > "Implement the normalization service (configurable per indicator) and the vulnerability computation (combine normalized hazard + exposure per DS division, per sector/subsector, per track). Persist vulnerability_result. Add unit tests with known fixtures."

#### ☐ B4. Auth + roles (data / expert / community + admin)
- Role-based login; experts and community users get their own accounts; feedback writes carry their `user_id` and `source`.
- **Prompt to run:**
  > "Add JWT auth and role-based access (admin, analyst, expert, community). Expert and community submissions write indicator_value rows tagged with their source and user_id. Add tests for permission boundaries."

#### ☐ B5. SSP scenario + impact projection API
- `ssp_scenario`, `scenario_parameter`; endpoint to project sector/subsector impact under a chosen SSP.
- **Prompt to run:**
  > "Implement SSP scenario management and an impact-projection endpoint that applies scenario parameters to the vulnerability model and returns projected sector/subsector impact per DS division."

#### ☐ B6. Spatial / GeoJSON API for the map
- Serve DS-division boundaries (GADM / Survey Dept) + joined index values as GeoJSON / vector tiles for the choropleth.
- **Prompt to run:**
  > "Add endpoints that return DS-division geometry joined to hazard/exposure/vulnerability values, filterable by track, hazard/sector, and SSP scenario. Serve geometry as vector tiles (MVT), not raw GeoJSON — see SRS §4.3."

---

#### ☐ B7. Spatial layer import (shapefile + API)
- Import vector layers per DS division; reproject to 4326; validate columns against the layer's national `attribute_schema`; bulk-insert `spatial_feature`.
- **Prompt to run:**
  > "Implement spatial layer import: a shapefile endpoint (ogr2ogr/GeoPandas → reproject to 4326 → validate against spatial_layer.attribute_schema → bulk insert spatial_feature) and an equivalent API/GeoJSON import. Add layer CRUD and tests."

#### ☐ B8. Spatial analysis toolbox (geoprocessing → indicator)
- Library of PostGIS operations (areal %, count/length density, proximity, zonal stats) computed in EPSG:5235; preview results per DS; commit selected results into `indicator_value` with `derivation='computed'` + `computation_job_id`.
- **Prompt to run:**
  > "Implement the spatial toolbox: parameterized PostGIS operations (areal_pct, count_density, length_density, proximity, zonal_stat) run over a chosen layer + admin scope in EPSG:5235, stored as computation_job/computation_result for preview, plus a commit endpoint that writes results into a chosen indicator_catalog target as indicator_value rows with computed-derivation lineage. Add tests."

### PHASE 2 — Frontend (Angular + TS + OpenLayers) — now SRS §10 Stage 5

#### ☐ F1. Scaffold (Angular + TS + OpenLayers)
- **Prompt to run:**
  > "Scaffold the Angular frontend with OpenLayers and a typed API client for the FastAPI backend, checked against SRS §9. No hardcoded API host — environment configuration."

#### ☐ F2. Map dashboard (DS choropleth + track/hazard/sector/SSP toggles)
- **Prompt to run:**
  > "Build the main map dashboard: OpenLayers DS-division choropleth fed by vector tiles, layer switcher (track: data/expert/community; hazard type; sector/subsector; SSP scenario), legend, and a clickable detail panel per division. Assessed / pending / unassessed must render as three distinct states — an absent value is never a zero (NFR-10)."

#### ☐ F3. Data upload + manual entry UI (catalog-driven forms)
- **Prompt to run:**
  > "Build the Excel upload screen and the catalog-driven manual-entry form (fields generated from indicator_catalog), with client-side validation mirroring server rules."

#### ☐ F4. Expert + community feedback UIs
- **Prompt to run:**
  > "Build the expert feedback and community feedback forms (role-gated), submitting indicator values tagged with the user's source. Show how their inputs compare to the data-driven track."

#### ☐ F5. Impact explorer + monitoring dashboard
- **Prompt to run:**
  > "Build the sector/subsector impact explorer (by SSP scenario) and the monitoring dashboard comparing predicted impact vs actual observations."

---

#### ☐ F6. Map toolbox UI (calculate index → commit to table)
- Layer manager + import UI; the toolbox panel: pick admin area → operation → input layer → Run → preview per-division table → "Insert into…" target indicator (hazard/exposure).
- **Prompt to run:**
  > "Build the map toolbox UI: a layer panel (list/import shapefile or API), and a geoprocessing panel where the user selects an admin scope, a spatial operation, and an input layer, runs it, previews the per-DS-division result table, then picks a target hazard/exposure indicator and commits the values."

### PHASE 3 — AI agent layer (RAG over Postgres + pgvector)

#### ☐ A1. Embedding + ingestion pipeline
- Embed catalog, indicator values, results, and reference docs into `agent_embedding` (pgvector).
- **Prompt to run:**
  > "Build the embedding/ingestion pipeline that indexes the vulnerability tables and reference documents into pgvector for retrieval."

#### ☐ A2. Agent endpoints ("impact on sectors? measures to overcome?")
- RAG agent that reads the databases and answers impact + mitigation questions per sector/subsector; experts can add inputs to its outputs.
- **Prompt to run:**
  > "Implement a RAG agent endpoint that answers 'what is the projected impact on sector X and what measures help?' grounded in the Postgres data, with a path for experts to review and append inputs to agent answers."

#### ☐ A3. Agent chat UI + expert review loop
- **Prompt to run:**
  > "Build the AI agent chat UI with source citations to the underlying data and an expert-review/append workflow."

---

### PHASE 4 — Monitoring, hardening, delivery

#### ☐ M1. Predicted-vs-actual monitoring pipeline + alerts
#### ☐ M2. Security review, tests, CI
#### ☐ M3. Stakeholder deck + one-pager (`pptx`, `canvas-design`)
- **Prompt to run:**
  > "Create a stakeholder slide deck and a one-page poster summarizing the platform, the 3 tracks, SSP scenarios, and the monitoring loop."

---

## 5. Open questions to resolve during Phase 0

- ☑ **DS-division boundaries — RESOLVED 2026-07-26.** Official shapefiles supplied:
  `SL_RDSD` (ADM3, **330 DS divisions**), `SL_DSD` (ADM2, 25 districts), `SL_PD` (ADM1, 9 provinces),
  `SL_GND` (ADM4, 14,019 GNDs, parked). All WGS84/EPSG:4326, staged in `design/spatial/`.
  None carried parent columns, so district and province were derived by **max-area spatial overlap**
  — zero ambiguity, zero overlapping polygons, tiles the country to within 0.054%.
  Register: `design/ingestion/dsd_register.csv`. *Open:* file has 330 divisions, the usual figure is
  331 — confirm against the source register. No official DSD code in the attribute table, so codes
  are generated (`CEN-001`…); swap for official codes before bulk data entry if they exist.
- ☑ **Hazard types + sectors/subsectors + parameters — RESOLVED 2026-07-26.** Expert-refined
  `Variables by Sectors` → **174 canonical variables, 33 national profiles, 3 hazards**
  (Drought/Flood/Landslide). See `design/ingestion/FINAL_VARIABLES.xlsx` and
  `seed_indicator_catalog_final.sql`. Supersedes the provisional 213-variable dedup.
  *Open confirmations* are listed in that workbook's `Issues_to_confirm` sheet.
- ☑ **Weighting — RESOLVED 2026-07-26.** Weights are per **sector × hazard × province** (243 sets),
  split by domain: hazard weights sum to 100, exposure weights sum to 100. Entered in the app at
  import, editable thereafter, versioned on save. Relationship per variable is `+` (raises
  vulnerability) or `−` (lowers it).
- ◐ Normalization method per indicator (min–max vs z-score). Partly settled: `indicator_catalog.norm_scope`
  (pooled / per_year / fixed_bounds) exists, and directionality is captured per profile as the
  `+`/`−` relationship. Still to decide: the default method, and the exact form of `f(E,H)`.
- ☐ Self-hosted LLM choice for the agent layer (model, embedding model) — `agent_embedding.embedding`
  is a `vector(1024)` placeholder until this lands.
- ☐ Year-range semantics (raised 2026-07-18, still open): the boundary year 2025 appears in both
  periods — rule is "latest period wins", needs expert confirmation; and per variable, whether a
  range value is a **total** or an **average**.

---

## 6. Status log

| Date | Component | Status | Artifact(s) | Notes |
|---|---|---|---|---|
| 2026-06-20 | PROJECT_GUIDE.md | ☑ done | PROJECT_GUIDE.md | Initial plan created |
| | D1 system architecture | ☐ | | |
| | D2 data-flow | ☐ | | |
| 2026-07-02 | D3 ERD + schema | ☑ done | `design/database/schema.sql`, `erd.svg/.png/.dot` | 18 tables; DDL syntax-verified with real PG parser; vector(1024) placeholder pending embedding-model choice |
| 2026-07-02 | D3 rev 2 — weighting layer | ☑ done | `schema.sql` (20 tables), updated ERD; sample archived at `design/ingestion/samples/` | From paddy sample: added vulnerability_profile + profile_indicator (per sector×hazard variable sets, weight %, +/- relationship, versioned, national scope); indicator_catalog is now a pure variable registry |
| 2026-07-02 | D3 rev 3–4 + 9-province inventory | ☑ done | `schema.sql` (21 tables: + province, + norm_scope), updated ERD; `design/ingestion/variables_inventory.csv` + `VARIABLES_INVENTORY_NOTES.md` | Profiles are province-scoped (243 profiles parsed from `Variabes_9 Provinces/`); norm_scope added for valid temporal comparison; 3 data anomalies pending with sector teams |
| 2026-07-10 | D4 UI wireframes (part 1) | ◐ in progress | `design/ui/risk-radar-ui-prototype.html` | Clickable prototype for GGGI: role-based login (admin/data/expert/community), admin user mgmt + registration monitor, 4-step data-entry wizard (province→DS→sector/subsector→hazard → parameter weights w/ 100% validation → Excel import or manual entry → review). Uses real Central-Province profiles from variables inventory. Map dashboard + remaining screens pending |
| 2026-07-16 | D4 UI wireframes (part 2) — prototype v2 | ◐ in progress | `design/ui/risk-radar-ui-prototype.html` | Decisions: actual-data uploads versioned w/ last-active + admin revert (not silent overwrite); general users rate 1–5 + comment (shown w/ n, hidden below n≥10); public read-only map (login only for data entry). Added: public visualization tab (schematic DS tile choropleth, radio track switch actual/expert/ratings/compare, divergence table, per-DS bar charts, weight-composition donuts, LULC/water/roads/buildings layer toggles + opacity), expert rules (actual-table params locked 🔒, own params added → renormalised mean, n≥2 threshold; free selection if no actual table), community 3-step rating wizard, version history panel in admin. Real MapLibre map still pending |
| 2026-07-18 | D3 rev 6 — year ranges | ☑ done | `schema.sql` | Datasets cover **year ranges**, not single years: `year` → `year_start`/`year_end` on indicator_value, vulnerability_result, impact_projection. Boundary-year rule and totals-vs-averages still pending expert confirmation |
| 2026-07-26 | Catalog FINAL | ☑ done | `design/ingestion/FINAL_VARIABLES.xlsx`, `seed_indicator_catalog_final.sql` | Expert-refined `Variables by Sectors` supersedes the 213-variable provisional dedup: **174 canonical variables, 33 profiles, 463 profile-variable rows**. Crosswalk: 129 unchanged, 76 renamed, 8 retired, 4 new. 2 malformed codes fixed; livestock share-denominators standardised on `_LIVESTOCK_OPERATORS` (old codes kept as aliases) |
| 2026-07-26 | DS-division register | ☑ done | `design/ingestion/dsd_register.csv`, `design/spatial/*.shp` | §5 open question closed. **330 DS divisions** with district + province, derived from official ADM3/ADM2/ADM1 shapefiles by spatial overlap — zero ambiguity, zero overlaps, tiles to within 0.054%. Codes generated (no official code in the source) |
| 2026-07-26 | D6 Excel templates | ☑ done | `design/templates/generated/` (243 workbooks) + `MANIFEST.csv`, `generate_templates.py` | One workbook per province × sector × hazard: 2 period tabs × real DS-division rows grouped by district, reference-only WEIGHTS tab, README, hidden `_META`. **17,826 data rows.** Legacy weights carried forward where the variable survived (1,881 of 3,664 slots, 51%); hazard-domain weights already total 100 in all 243. All 243 structurally verified |
| 2026-07-26 | Weights flow + D4 part 3 | ◐ in progress | `design/ui/risk-radar-ui-prototype.html`, `design/database/schema_weights_addendum.sql` | **Decision: weights entered in the app at import, no approval gate in V1** (expert panel reviews offline; sign-off recorded as a panel note). Officer uploads → importer reads the WEIGHTS tab → **Confirm weights** screen, pre-filled and editable, Σ100 per domain enforced → save takes effect immediately. New **Profile weights** screen allows editing any profile any time, with change history. Each save writes a new profile version so published scores stay explainable. Schema gains `import_batch` (was missing entirely), `save_profile_weights()`, weight-history view. Prototype reference data regenerated from the real catalog (330 DSDs, 174 vars, 243 profiles); verified under jsdom — 0 runtime errors across all roles, 72 weights and 216 map combinations |
| 2026-07-29 | B1 database | ☑ done | `backend/` + live `riskradar` DB | Built on a pre-existing local **PostgreSQL 15 + PostGIS** (a full server was already running on 5432). All smoke tests pass: 9 provinces · 3 hazards · 174 variables · 243 profiles · 3,664 memberships · **330 DS divisions, total area 65,976.7 km²**. First real run exposed 6 bugs — see the tracker's 2026-07-29 rows |
| 2026-07-29 | D1 + D2 diagrams | ☑ done | `design/architecture/system-architecture.*`, `data-flow.*`, `generate_diagrams.py` | Graphviz, generated not hand-drawn. Border style encodes built vs designed, so the diagrams stay honest about what exists |
| 2026-07-29 | D5 SRS | ☑ done | `design/srs/SRS.md`, `SRS.docx`, `figures/`, `build_docx.py` | 30 pp for GGGI review. 53 FR + 9 NFR, 20 figures, 17-screen prototype annex, delivery-status table separating built from specified. All quantitative claims machine-checked |
| 2026-07-26 | D8 spatial layer + toolbox | ☑ done | `design/database/spatial-model.sql` | 5 tables + 3 enums, no per-layer tables. Attribute contract per layer in JSONB, validated on import; geometry type enforced against the layer. Toolbox writes `computation_result` which a user explicitly **commits** to `indicator_value`; `computation_job_id` + CHECK make a computed value impossible without a job. `sl_area_km2()`/`sl_length_km()`/`sl_apportion()` transform to **EPSG:5235** before measuring. Seeded 4 layers + 6 operations. **ERD regenerated** by `generate_erd.py`, which parses the DDL instead of being hand-maintained — 28 tables, 65 relationships, 9 colour-coded modules |

> **Maintenance rule:** when a component finishes, change its ☐ to ☑ in §4, add a row here,
> and update the top-of-file **Status** field.
