# Risk Radar — orientation for Claude Code

DS-division-level Climate Vulnerability Assessment platform for Sri Lanka.
Owner: Milinda. Phase 0 (design) is essentially complete; Phase 1 (backend) has
just started.

**Read first:** `PROGRESS_TRACKER.md` — live board, open decisions, and a dated
issues log explaining *why* things are the way they are. `PROJECT_GUIDE.md` has
the full build sequence and the copy-paste prompt for each step.

**Authoritative spec: `design/srs/SRS_v2.2.md`.** Everything earlier (SRS.md,
v1.x, v2.0, v2.1) is superseded. Edit the markdown, then rebuild the docx with
`python build_docx.py SRS_v2.2.md`.

## The model in one line

`Vulnerability = f(Exposure, Hazard)` per DS division, per sector × hazard.
Each side is a weighted set of normalised indicators. Three parallel tracks —
data / expert / community — share one schema, separated by a `source` column.

The published score is the **raw product `H × E`, min–max renormalised within
its own province** (SRS §2.1, P-14, expert-panel instruction 7 Aug 2026). So a
score is *relative to its province*: no cross-province comparison, no national
ranking, and every province yields exactly one 1.000 and one 0.000 per profile.
Two earlier formulations — the geometric mean, then `√(H × E)` — are dead.

## Stack (locked)

**Angular + TypeScript · OpenLayers · FastAPI (Python) · PostgreSQL + PostGIS + pgvector**

Not MapLibre, and no longer React. `FrontEnd/` is a **retired** React + Vite +
OpenLayers app, kept as reference for its map-select → side-panel entry
workflow; do not extend it (SRS §4.1, §10.0, decision 8 Aug 2026).

## Where things are

```
design/database/    schema.sql (18 tables) + weights addendum + spatial-model (D8)
                    generate_erd.py -> erd.svg/.png   [re-run after ANY schema change]
design/ingestion/   FINAL_VARIABLES.xlsx (the catalog), dsd_register.csv (330 DSDs),
                    generate_seed.py -> seed_all.sql
design/templates/   generate_templates.py -> generated/<Province>/*.xlsx (243 workbooks)
design/spatial/     SL_RDSD (ADM3) · SL_DSD (ADM2) · SL_PD (ADM1) shapefiles
design/ui/          risk-radar-ui-prototype.html (clickable, runs on real catalog data)
design/srs/         SRS_v2.2.md + .docx  <- THE spec; build_docx.py rebuilds it
backend/            docker-compose.yml + db/*.ps1 / *.sh
FrontEnd/           RETIRED React app — reference only, do not extend
```

## Hard-won facts — do not re-derive these

- **174 canonical variables · 33 national profiles · 243 province-profiles ·
  3,664 memberships · 330 DS divisions.** These numbers are load-bearing; the
  smoke tests assert them.
- **1,783 of 3,664 memberships have `weight_pct IS NULL` on purpose.** Weights
  are entered in the app at import, not carried by the spreadsheet. NULL means
  "belongs to the profile, weight not set yet". B3 must refuse to compute a
  profile while any weight is NULL (`v_profile_readiness`).
- **No approval workflow in V1.** Expert-panel review happens offline; the app
  records it as a free-text `panel_note`. Saving weights takes effect
  immediately but writes a **new profile version**, so published scores stay
  explainable.
- **Year ranges, not years.** Data covers 2020–2025 and 2025–2030.
  A value means a **typical year**, not a multi-year total (see
  `indicator_catalog.period_aggregation`: 160 average / 11 fixed_window / 3 max).
  2025 sits in both periods — **latest period wins** (`iv_for_year()`).
- **Geometry in EPSG:4326, measurement in EPSG:5235.** Area or length computed
  in 4326 yields degrees, not metres. `sl_area_km2()` / `sl_length_km()` exist
  so nobody has to remember. Total country area should land near 65,600 km².
- **The toolbox never writes to `indicator_value` directly.** It emits
  `computation_result`, which a user commits. A CHECK makes
  `derivation='computed'` impossible without a `computation_job_id`.
- `design/ingestion/seed_indicator_catalog_final.sql` is **superseded — do not
  run it.** Use `seed_all.sql`.

## Working rules

1. **Generated files are generated.** `seed_all.sql`, `erd.*`, and the 243
   workbooks come from scripts. Change the script and re-run; never hand-edit
   the output.
2. **Parsing is not verification.** `pglast` accepted a seed that referenced
   columns which did not exist. After schema edits, re-run the semantic check
   that resolves every INSERT column, FK target and NOT NULL against the DDL
   (see the 2026-07-26 "SQL verification" row in the tracker).
3. **Update `PROGRESS_TRACKER.md` when something lands** — tick the function,
   and add an issues-log row saying what broke and why the fix is what it is.
   The log is the project's memory.
4. Schema changes go in an **addendum**, not by editing `schema.sql` in place,
   so the original design and its amendments stay readable.

5. **The build plan is SRS §10's ten stages.** The old B1–B8 / F1–F6 numbering
   in `PROGRESS_TRACKER.md` and `PROJECT_GUIDE.md` is superseded — read it as
   history, not as a plan.

## Current state and next steps

**Database built and smoke-tested (2026-07-29); nothing above it exists.**
`backend/` has Docker and native-PostgreSQL routes (`db/apply_native.ps1`,
`db/check_prereqs.ps1`, `db/smoke_test_native.ps1`). Milinda is on **Windows
PowerShell, no Docker**; the database runs on a pre-existing local PostgreSQL 15
+ PostGIS server found already on port 5432 (see the 2026-07-29 tracker rows for
the six script bugs that first real run exposed). **The FastAPI app has never
been scaffolded.**

Next, in order (SRS §10):

- **Stage 1 — schema completion.** Add `community_rating`, `audit_log`,
  `nap_sector`, `sector_nap_map`, `spatial_layer.coverage_geom`,
  `sl_apportion_2()`; fix `iv_for_year()` determinism; re-seed periods
  non-overlapping (to 2025 / from 2026, P-7); regenerate the ERD. As an
  addendum, per rule 4. Exit: every §8.3 constraint has a passing negative test.
- **Stage 2** catalogue + profile API (first FastAPI code) · **Stage 3** import
  pipeline · **Stage 4** the engine · **Stage 5** Angular client + tiles.

Stage 5 can start before Stage 4 — coverage states are testable with no scores
at all. **Stage 4 is gated on O-9/P-5** (below).

## Waiting on Milinda

- **O-9 — the one real blocker.** Do component hazard values exist for the
  provinces that historically supplied only a composite index? It decides
  whether P-5 is implementable, P-5 explains all 558 hazard-domain blanks, and
  Stage 4 cannot complete without it. Worth asking the panel now, not at Stage 4.
- O-1 weights (1,783 memberships; equal-weight interim per P-6) · O-8 fixed
  bounds for 134 count/extent variables · O-10 band thresholds still placeholder.
- Older confirmations with defaults applied: `PROGRESS_TRACKER.md §1a`,
  `FINAL_VARIABLES.xlsx → Issues_to_confirm`, 14 period-rule exceptions in
  `PERIOD_RULES_REVIEW.xlsx`. Two data questions stand: the shapefile has **330**
  DS divisions where 331 is usually quoted, and Vegetables & OFC / Inland
  Fishery have legacy data for **Central province only**.
