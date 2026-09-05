# Running Risk Radar on Windows

Verified end to end in a sandbox replica on 3 September 2026: schema, seed,
boundaries, Central's data, the Stage 4 engine, the API and a type-checked
frontend. The steps below are the same ones, in the order they have to happen.

## 0. Check what you already have — do this first

```powershell
cd backend
.\db\check_prereqs.ps1
```

It changes nothing and tells you exactly what is installed. **It also finds
PostgreSQL when it is installed but not on PATH**, which the scripts then handle
themselves — so "psql is not recognized" is not a reason to install anything.

You need PostgreSQL with PostGIS, Python 3.11+ and Node 20+. GDAL (`ogr2ogr`)
is needed only for step 2, the boundary load; OSGeo4W or QGIS both provide it.

**Docker is optional and probably not what you want.** `docker-compose.yml`
exists as an alternative for a machine with no PostgreSQL, but this project has
always been built against a native Windows install — that is what the
`*_native.ps1` scripts are for, and what the encoding fixes below were written
against. If `docker` is not recognized, use the native path and ignore Docker
entirely.

## 1. Database

Apply the schema **in this order** — later files depend on earlier ones:

```powershell
.\db\apply_native.ps1
```

If you apply by hand, the order is `schema.sql`,
`schema_weights_addendum.sql`, `spatial-model.sql`,
`..\design\ingestion\seed_all.sql`, `schema_consensus_addendum.sql`,
`schema_auth_addendum.sql`, `schema_session_addendum.sql`,
`schema_boundary_pending_addendum.sql`, `schema_official_dscode_addendum.sql`,
`schema_profile_consensus_save_addendum.sql`, then the new
`schema_signed_values_addendum.sql`.

**Two encoding traps, both already fixed in the scripts and both invisible if
you work around them by hand.** Set `PGCLIENTENCODING=UTF8` before any psql
call — a WIN1252 console rejects the register's Sinhala names at line 5. And
never write SQL with `Set-Content -Encoding UTF8` on Windows PowerShell 5.1: it
writes a BOM that psql reads as part of the first statement.

## 2. Boundaries

```powershell
.\db\load_spatial.ps1
```

Loads **full-resolution** geometry from `design\spatial\DS_Boundary.shp`,
reprojected 5234 -> 4326. Do **not** load
`frontend-angular\public\data\ds_divisions.simplified.geojson` into the
database — it is a display asset simplified at 0.004 degrees, which creates
~819 overlapping pairs and fails the smoke test for a problem that does not
exist in the real data.

Check it:

```powershell
psql -f .\db\smoke_test.sql
```

A correct database reports **340 divisions, 340 surveyed, 0 boundary-pending,
66,037 km2, 2 known overlaps (largest 2.110 km2), ALL SMOKE TESTS PASSED**.

## 3. Central Province: weights, then data, then scores

Order matters — the data will not load until the profiles carry the panel's
variables, and nothing computes until the data is in.

```powershell
psql -f ..\design\ingestion\panel_central.sql
python seed_central.py "..\Data sets\CP\CP\Central_want to edit year ranges"
python compute_all.py --province Central --period 2021-2025
```

Expect: 33 workbooks loaded / 0 rejected / 14,020 raw values, then
33 computed / 0 refused / 1,323 result rows.

## 4. API

```powershell
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`http://localhost:8000/api/health` should report `database: ok`. The API takes
no password: asyncpg resolves it the same way psql does, via `PGPASSWORD` or
`%APPDATA%\postgresql\pgpass.conf`.

## 5. Frontend

```powershell
cd ..\frontend-angular
npm ci
npm start
```

`proxy.conf.json` already forwards `/api` to port 8000. Open
`http://localhost:4200/map`.

The map opens on Central. Pick a sector, subsector and hazard; the filter
options and the period list come from the API, so they cannot drift from the
database the way the hardcoded lists had.

## 6. The import tab

`http://localhost:4200/import` needs a signed-in account — the map is public,
writing indicator values is not. Create one with:

```powershell
cd ..\backend
.\db\bootstrap_admin.ps1
```

then register at `/register` and approve yourself at `/admin/registrations`.

Pick province, sector, subsector and hazard, choose a workbook, and use
**Check only** first. Check runs the identical server code path as Import and
stops before writing, so what it reports is what will happen — a validator
written separately from the loader eventually disagrees with it, and that shows
up as "it passed the check and then failed to load".

The pickers are a **cross-check, not routing**: the workbook's hidden `_META`
says which profile it is for, and a disagreement is refused. Try importing a
Paddy file under Livestock — it should refuse and name both scopes.

After importing, re-run the engine so the map reflects the new values:

```powershell
python compute_all.py --province Central --period 2021-2025
```

## What you should see, and what is honest about it

- **The bottom band holds most divisions.** The index is a product of two
  numbers in [0,1], so it is right-skewed. This is expected and documented in
  `band.model.ts`; do not re-cut the thresholds.
- **Hatched divisions are unassessed**, not low. Cattle Drought has three
  (NU5, NU6, NU7 — no livestock returns).
- **Inland Fishery shows 19 divisions at the floor.** They have no fishery at
  all, so exposure is 0. The API flags these as `zeroIsStructural`; whether
  they should render as a band at all is an open decision.
- **Divisions where the sector is not present are flat and unselectable**, with
  their own legend entry — not the lowest band. Inland Fishery has 19 of
  Central's 41.
- **Weights marked contested are derived**, not panel decisions — see
  `Expert Review\PANEL_QUESTIONS_CENTRAL_2026-09-03.md`.
