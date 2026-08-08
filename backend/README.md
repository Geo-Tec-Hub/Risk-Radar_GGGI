# B1 — Database setup

Builds the Risk Radar database from the Phase 0 design artefacts. Nothing here
invents data: every table comes from `design/database/*.sql` and every row from
`design/ingestion/`.

Two ways to run it. **If you already have PostgreSQL installed, use the native
route** — it's fewer moving parts.

---

# Option A — native PostgreSQL (no Docker)

**Prerequisites**

1. **PostgreSQL 16** — the EDB Windows installer
2. **PostGIS** — install through *Stack Builder* (bundled with that installer):
   Spatial Extensions → PostGIS. Required.
3. **pgvector** — *optional*, not needed until Phase 3. Skipped automatically if absent.
4. **GDAL** — optional, only for loading the 330 DS-division polygons. Comes with
   QGIS or OSGeo4W.

**Run** from PowerShell in `backend\`:

```powershell
.\db\check_prereqs.ps1              # what's installed? (changes nothing)
.\db\apply_native.ps1 -CreateDb     # creates the database, then builds everything
.\db\smoke_test_native.ps1          # prove it works
```

**You do not need to fix PATH.** The EDB installer doesn't add `psql` to PATH,
so the scripts search `C:\Program Files\PostgreSQL\*\bin` themselves and use the
newest version they find. If yours lives somewhere unusual, point at it first:

```powershell
$env:PGBIN = "D:\path\to\PostgreSQL\16\bin"
```

You'll be prompted for the `postgres` password. To avoid repeated prompts in one
session: `$env:PGPASSWORD = 'yourpassword'`

Useful switches: `-Reset` (drop and rebuild the schema), `-Port 5433`,
`-Database riskradar`, `-User postgres`.

**About pgvector.** It has no official Windows binary and needs Visual Studio
build tools, so requiring it would block you for no benefit. The four agent
tables that use it now live in `design/database/schema_agent_pgvector.sql`,
split out on 2026-07-26. `apply_native.ps1` detects whether pgvector is present
and skips that one file if not — everything else builds. Run it later when the
agent layer starts:

```powershell
psql -d riskradar -f ..\design\database\schema_agent_pgvector.sql
```

---

# Option B — Docker

You need **Docker Desktop**. Open PowerShell in this folder (`backend\`):

```powershell
docker compose up -d          # start Postgres (first run pulls ~600 MB)
.\db\apply.ps1                # build schema + load seed
.\db\smoke_test.ps1           # prove it works
```

To start over from nothing:

```powershell
docker compose down -v
docker compose up -d
.\db\apply.ps1
```

Or just reset the schema without re-pulling: `.\db\apply.ps1 -Reset`

**If PowerShell refuses to run the scripts** ("running scripts is disabled on
this system"), allow local scripts for your user — this is a one-off:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**Docker file sharing:** the project sits under OneDrive. Docker Desktop must be
allowed to mount it — Settings → Resources → File sharing. If `apply.ps1` fails
saying `/design` is empty, that's the cause.

> `apply.sh` / `smoke_test.sh` are the same thing for macOS, Linux, Git Bash or
> WSL. Use whichever matches your shell; they do identical work.

## What gets built

| Step | File | What it does |
|---|---|---|
| 0 | `db/00_extensions.sql` | postgis, vector, pg_trgm |
| 1 | `design/database/schema.sql` | 18 base tables |
| 2 | `design/database/schema_weights_addendum.sql` | import batches, weight versioning, period rules |
| 3 | `design/database/spatial-model.sql` | D8 spatial layers + analysis toolbox |
| 3b | `design/database/schema_agent_pgvector.sql` | 4 agent RAG tables — **only if pgvector is present** |
| 4 | `design/ingestion/seed_all.sql` | 9 provinces · 3 hazards · 8 sectors · 12 subsectors · **174 variables** · 269 aliases · **243 profiles** · **3,664 memberships** |
| 5 | `db/load_spatial.ps1` / `.sh` | **330 DS divisions** with geometry, plus province and district outlines |

Expected after a clean run: 28 tables (24 without pgvector), 330 DS divisions, 243 profiles, and
1,783 memberships with `weight_pct IS NULL` — those are the variables the expert
refresh added, which get their weights in the app at import.

## Two things you may hit

**pgvector is not in the PostGIS image.** If step 0 fails on `CREATE EXTENSION vector`:

```powershell
docker compose exec -u root db bash -c "apt-get update && apt-get install -y postgresql-16-pgvector"
docker compose restart db
.\db\apply.ps1
```

**GDAL is not either**, so step 5 (the 330 DS divisions) is skipped unless you install it:

```powershell
docker compose exec -u root db bash -c "apt-get update && apt-get install -y gdal-bin"
.\db\apply.ps1
```

Both installs are one-off — they persist until you `docker compose down -v`.

Everything except the geometry works without GDAL, and the smoke tests skip the
geometry section cleanly if DS divisions are not loaded.

## What the smoke tests actually check

Not "does the SQL parse" — that was already verified. These check the design
behaves as documented, and each one raises an exception on failure:

- Row counts match the design (9 / 3 / 174 / 243 / 3,664)
- Period rules survived the seed: 11 `fixed_window`, 3 `max`, 160 `average`
- `save_profile_weights()` **rejects** a weight set totalling 50%
- A `derivation='computed'` value is **rejected** without a `computation_job_id`
- A polygon is **rejected** on the LINESTRING-only ROAD layer
- A LULC feature is **rejected** without its required `class` attribute
- 330 divisions, all geometry valid, no overlapping pairs
- Total area lands near 65,600 km² — the check that proves areas were computed
  in EPSG:5235 and not in degrees

It finishes by printing `v_profile_readiness`: how many of the 243 profiles can
be computed today versus how many are still waiting on weights.

## Regenerating the inputs

Both are derived, not hand-written — re-run after any change upstream:

```powershell
python ..\design\ingestion\generate_seed.py   # seed_all.sql
python ..\design\database\generate_erd.py     # erd.dot/.svg/.png
```

(`generate_erd.py` also needs Graphviz on PATH: `winget install graphviz`)

## Note on the old seed file

`design/ingestion/seed_indicator_catalog_final.sql` is **superseded and should
not be run.** It was written against assumed column names and does not match
`schema.sql` — it referenced `vulnerability_profile.sector` (text) and
`profile_indicator.indicator_code`, neither of which exist. `seed_all.sql`
replaces it and is generated from the same files the templates use.
