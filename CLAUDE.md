# Risk Radar — orientation for Claude Code

DS-division-level Climate Vulnerability Assessment platform for Sri Lanka.
Owner: Milinda. Phase 0 (design) is essentially complete; Phase 1 (backend) has
just started.

**Read first:** `PROGRESS_TRACKER.md` — live board, open decisions, and a dated
issues log explaining *why* things are the way they are. `PROJECT_GUIDE.md` has
the full build sequence and the copy-paste prompt for each step.

**Authoritative spec: `design/srs/SRS_v2.3.md`.** Everything earlier (SRS.md,
v1.x, v2.0, v2.1, v2.2) is superseded. Edit the markdown, then rebuild the docx
with `python build_docx.py SRS_v2.3.md`.

## The model in one line

`Vulnerability = f(Exposure, Hazard)` per DS division, per sector × hazard.
Each side is a weighted set of normalised indicators. Three parallel tracks —
data / expert / community — share one schema, separated by a `source` column.

The published score is the **raw product `H × E`, min–max renormalised within
its own province** (SRS §2.1, P-14, expert-panel instruction 7 Aug 2026). So a
score is *relative to its province*: no cross-province comparison, no national
ranking, and every province yields exactly one 1.000 and one 0.000 per profile.
Two earlier formulations — the geometric mean, then `√(H × E)` — are dead.

**Normalisation is provincial too, since 9 Aug 2026 (SRS v2.3 §2.2).** A
variable min–max scales across the divisions of **one province**, computed only
once **every division of that province has a value**. A province publishes
without waiting for the other eight; no fixed ceilings are needed. This
**reverses P-2** — ignore any text still claiming national bounds. So the
relativisation now happens *twice*, and **no quantity is comparable across a
provincial boundary**: a normalised 0.8 means "high for this province". A
division carries **two coexisting indexes** — a **provincial** one (the headline,
available when its province completes) and a **national** one (comparison view,
available only when every division in the register holds a value). Neither
overwrites the other and nothing is ever recomputed; `index_scope` is part of
`vulnerability_result`'s unique key. Never mix them in one legend, export column
or ranking.
**The measurement model is CLOSED (owner, 14 Aug 2026). O-10 and O-11 both
answered; P-4 and P-14 confirmed.** The index **is** `H × E` min–max rescaled to
**[0, 1]** within its province — the second rescale stays — and the five bands
are the **even fifths of that scale, fixed**: 0.2 / 0.4 / 0.6 / 0.8. **Do not
re-derive thresholds from the data**; quantile and natural-breaks are rejected.
The bottom band will hold ~45–50% of divisions rather than 20%, because a
product is right-skewed and rescaling does not change a distribution's shape —
**that is accepted, not a bug to fix.** The reason is publication rather than
statistics: a fixed legend means a map exported today is still true in six
months, whereas a data-derived one re-cuts its bands every time a province
completes. Band colours are a single-hue ramp (severity carried by lightness,
not hue) in `core/models/band.model.ts`, SRS §2.7 and FR-4.13b. FR-4.15's
distribution report is **monitoring only** now, not a threshold input. Stage 4
therefore has **no decision gate left** — build §2.1–§2.8 straight through.

## Stack (locked)

**Angular + TypeScript · OpenLayers · FastAPI (Python) · PostgreSQL + PostGIS + pgvector**

Not MapLibre, and no longer React. `FrontEnd/` is a **retired** React + Vite +
OpenLayers app, kept as reference for its map-select → side-panel entry
workflow; do not extend it (SRS §4.1, §10.0, decision 8 Aug 2026).

## Where things are

```
design/database/    schema.sql (18 tables) + weights addendum + spatial-model (D8)
                    generate_erd.py -> erd.svg/.png   [re-run after ANY schema change]
design/ingestion/   FINAL_VARIABLES.xlsx (the catalog), dsd_register.csv (THE
                    authority for which DS divisions exist — count it, never
                    assume it), generate_seed.py -> seed_all.sql
design/templates/   generate_templates.py -> generated/<Province>/*.xlsx (243 workbooks)
design/spatial/     DS_Boundary (ADM3, 2025 revision, THE source) · SL_DSD (ADM2)
                    SL_PD (ADM1) · SL_RDSD = superseded, do not load
design/ui/          risk-radar-ui-prototype.html (clickable, runs on real catalog data)
design/srs/         SRS_v2.3.md + .docx  <- THE spec; build_docx.py rebuilds it
backend/            docker-compose.yml + db/*.ps1 / *.sh
FrontEnd/           RETIRED React app — reference only, do not extend
```

## Hard-won facts — do not re-derive these

- **174 canonical variables · 33 national profiles · 243 province-profiles ·
  3,664 memberships.** These are load-bearing and the smoke tests assert them.
- **The DS-division count is NOT one of them. Never hardcode it — not 330, not
  331, not 340.** It moved three times in three weeks (330 shapefile → 331
  Kalmunai split → **340**, the Survey Department's 2025-10-09 revision, loaded
  14 Aug). It has settled; **that is not a reason to write it down.** Three
  counts exist and can differ: *official*, *registered* (rows in
  `dsd_register.csv` — the denominator for every completeness rule) and
  *drawable* (`geom IS NOT NULL`). They happen to be equal today. Read them; do
  not assert them. Tests assert the **relationship**, never a literal. Read
  `ds_division.boundary_status` rather than checking `geom IS NULL`.
- **Boundaries: `design/spatial/DS_Boundary.shp`** (Survey Dept, 2025-10-09,
  **EPSG:5234 Kandawala** — not 4326; the loader passes `-s_srs` explicitly
  because that .prj has no EPSG authority code). `SL_RDSD.shp` is the superseded
  330-polygon revision — do not load it.
- **`ds_division.code` is the OFFICIAL code** (`KA1`, `AM8`, `GA14`) since
  14 Aug 2026 — SRS [O-5] closed. The old generated codes (`CEN-001`) live on as
  `legacy_code`, for diagnosing stale references only, **never as a join key**.
  `EAS-008`, `CEN-032` and `CEN-034` are **retired and never reused** — each was
  split in two, and a retired code must fail loudly rather than quietly resolve
  to half the area it used to mean.
- **Join the shapefile to the register on `new_ds_cod`, never on name.** Nine
  divisions were renamed in the 2025 revision ("Koralai Pattu North" →
  "KORALAI PATTU NORTH (VAHARAI)"); a name join loads them as boundary-pending
  with a perfectly good polygon sitting unused in staging. No error, no map.
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
- **An unweighted variable is resolved by exclusion, never by equal-weighting
  it** (`[P-6]` superseded 9 Aug 2026). `profile_indicator.consensus`
  (`proposed`/`agreed`/`contested`/`rejected`) records the decision; only
  `rejected` — weight `NULL`, never a weight of 0 — is excluded from a
  domain's 100 and from blocking readiness. In the hazard domain this is
  permitted **only** on the composite-index row; a blank component holds the
  profile instead (§2.4, §2.8, SRS v2.3). Schema:
  `schema_consensus_addendum.sql`, applied and negative-tested 9 Aug 2026
  (Stage 1.12).
- **Provincial scope (§3.2) is now enforced, not merely specified.** A
  `data_officer`/`expert` cannot be granted without `app_user.province_id`
  set; an `admin` cannot be granted *with* one. Trigger
  `user_role_province_scope`. Registration defaults an account to `pending`
  and inactive until an administrator approves it. Schema:
  `schema_auth_addendum.sql`, applied and negative-tested 9 Aug 2026 (Stage
  1.13). Role `analyst` no longer exists — renamed to `data_officer` to match
  the spec, which never had an Analyst.
- **`$env:PGPASSWORD` is the working route, not `pgpass.conf`** (corrected 18
  Aug 2026 — the pgpass.conf claim from 9 Aug was wrong; a Claude Code session
  that tries it hits a file that doesn't exist at the real `%APPDATA%` path,
  or is a sandboxed session's own stale writeback, not something `psql`/
  asyncpg outside that sandbox ever reads). Set `$env:PGPASSWORD` for the
  session instead — asyncpg resolves it the same way `psql` does, with no
  code change (`backend/app/db.py` never passes `password=`). Still don't ask
  Milinda for the password unprompted; when a task needs one, ask directly.

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

**Database built and smoke-tested (2026-07-29). The FastAPI app now exists
(T2, 2026-08-11) and has real auth (T2b, 2026-08-11) — sign-in, registration
and admin approval are no longer plans.**
`backend/` has Docker and native-PostgreSQL routes (`db/apply_native.ps1`,
`db/check_prereqs.ps1`, `db/smoke_test_native.ps1`). Milinda is on **Windows
PowerShell, no Docker**; the database runs on a pre-existing local PostgreSQL 15
+ PostGIS server found already on port 5432 (see the 2026-07-29 tracker rows for
the six script bugs that first real run exposed).

**Stage 1 is in progress, not done.** Follow `BUILD_BRIEF_2026-08-09.md` for
the current task order (T1 → T9), not the list below — it's kept here only as
a one-paragraph orientation.

- ☑ **1.8–1.14 done, 9–10 Aug 2026.** `schema_consensus_addendum.sql`,
  `schema_auth_addendum.sql`, `schema_boundary_pending_addendum.sql` and
  (2026-08-11) `schema_session_addendum.sql` are all applied to the live
  database, each with a passing negative-test suite
  (`backend/db/consensus_test_native.ps1`, `auth_test_native.ps1`,
  `boundary_pending_test_native.ps1`, `session_test_native.ps1`), each proven
  a second time from a cold build against a disposable scratch database. All
  four are also registered in `apply_native.ps1` (now 9 steps, not 8 —
  sessions are step 7/9, run after auth since its revocation trigger needs
  `app_user`, and before the boundary-pending addendum and the spatial load)
  — applying by hand and registering in the build script are two different
  jobs; both are done for all four. See the "Hard-won facts" bullets above
  and `PROGRESS_TRACKER.md` §3 (T1, T1b, T1c and T2b rows).
- ☐ **1.1–1.7 remain, not started.** Add `community_rating`, `audit_log`,
  `nap_sector`, `sector_nap_map`, `spatial_layer.coverage_geom`,
  `sl_apportion_2()`; fix `iv_for_year()` determinism; re-seed periods
  non-overlapping (to 2025 / from 2026, P-7). Each as its own addendum, per
  rule 4. Exit: every §8.3 constraint has a passing negative test — the same
  bar 1.12–1.14 were just held to.
- ☑ **Stage 2.0 (T2) and Stage 9.6 (T2b) done, 2026-08-11.** `backend/app/`
  is real: asyncpg + raw SQL (no ORM, no Alembic — decision recorded in the
  T2 tracker row), `GET /api/health`, and now `/api/auth/*` +
  `/api/admin/registrations*` — argon2id passwords, server-side sessions
  (`app_session`, opaque cookie), admin approval queue. Angular has a landing
  page (`/`), `/map` (still reachable with no account), `/login`, `/register`,
  `/admin/registrations` (guarded), and a data-officer/expert province lock
  on `/entry`. **Stage 2.1–2.4** (catalogue reads, profile read/readiness,
  weight save, AHP — `BUILD_BRIEF` **T3**) is next; every write from here on
  authorises against the user and province T2b now makes real.
  · **Stage 3** import pipeline · **Stage 4** the engine.

Stage 5 can start before Stage 4 — coverage states are testable with no scores
at all. It already has, out of order: `frontend-angular/` exists, UI-only,
every screen real and typed against §9, every API call failing until Stage 2
exists. **Stage 4 is no longer gated**: O-9 was answered 9 Aug 2026 and P-5 is
confirmed.

## Waiting on Milinda

- ~~**O-9**~~ **and** ~~**O-8**~~ **— both closed 9 Aug 2026.** Component hazard
  values *will* be supplied via gradual workbook updates, so **P-5 is confirmed**,
  there is one hazard construct, the 558 hazard blanks close by collection rather
  than decision, and **Stage 4 is no longer gated**. Provinces still holding only
  the composite index show as **pending** — no score, not zero. O-8 is closed by
  the provincial-bounds change above: no ceilings needed.
- ~~**O-2**~~ **— answered 10 Aug 2026: the missing division is the Kalmunai
  split.** `EAS-008 Kalmunai` becomes **Kalmunai Muslim** and **Kalmunai
  Tamil**; Ampara goes 19 → 20 and the register 330 → **331**. Three rules go
  with it. **`EAS-008` is retired and never reused** — two new codes are
  issued, so a stale reference fails loudly instead of resolving to half the
  original area. **Both rows are registered before their polygons exist**,
  carrying an explicit *boundary-pending* state; nobody invents a boundary, and
  nothing may silently drop a division that has none. **Both start with no
  values** — copying the parent's would double-count every count and extent
  variable across the pair. Note this moves Eastern *further* from
  completeness, not closer, and that is correct: 330 was not complete, it was
  incomplete and silent. **Implemented 10 Aug 2026 (T1c, Stage 1.14) — this is
  now the live state, not just the decision.** `schema_boundary_pending_addendum.sql`
  applied and negative-tested; `ds_division.geom` is nullable with a generated
  `boundary_status`; register, seed, all 243 workbooks and the live database
  all reflect 331. The naming is still provisional pending an official source.
- ~~**O-12**~~ **closed 14 Aug 2026** — the owner supplied `DS_Boundary.shp`
  and the register is complete at 340. **The nine additions are splits of
  existing divisions, not new land**, so each starts with no values (copying the
  parent double-counts every count and extent variable) and the two parents that
  vanished entirely, Ambagamuwa and Kothmale, are retired. The six parents that
  survived — Hikkaduwa, Baddegama, Hanguranketa, Walapane, Nuwara Eliya,
  Balangoda — now cover **less area than before**, so any extent or count value
  collected against the old boundary is wrong for them, not merely stale. The
  owner confirms the 2020–2025 collection is tabulated against the 340
  boundaries, so no remapping is needed.
- ~~O-1~~ largely dissolved 9 Aug — unweighted memberships are **excluded, not
  weighted** (P-6 superseded). 97 of 243 profiles compute at once; **30 exposure
  groups** whose weights miss 100 are all that remain — and those close as real
  workbooks arrive (owner, 14 Aug), so they are not a development-stage blocker.
- ~~O-10~~ and ~~O-11~~ **both closed 14 Aug 2026** — see the measurement-model
  bullet above. Fixed even-fifth bands on the rescaled 0-1 index; the rescale
  stays. Neither is to be reopened from theory.
- ~~O-3~~ closed 9 Aug: some sectors genuinely exist in some provinces only, so
  Vegetables & OFC and Inland Fishery stay Central-only. **No extra workbooks;
  243 stands.**
- Older confirmations with defaults applied: `PROGRESS_TRACKER.md §1a`,
  `FINAL_VARIABLES.xlsx → Issues_to_confirm`, 14 period-rule exceptions in
  `PERIOD_RULES_REVIEW.xlsx`.
