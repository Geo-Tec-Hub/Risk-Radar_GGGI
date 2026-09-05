<#
.SYNOPSIS
    Build the Risk Radar database against a LOCALLY INSTALLED PostgreSQL.
    No Docker required.

.EXAMPLE
    .\db\apply_native.ps1
    .\db\apply_native.ps1 -CreateDb          # create the database and role first
    .\db\apply_native.ps1 -Reset             # drop and recreate schema public
    .\db\apply_native.ps1 -Port 5433 -Database riskradar

.NOTES
    Prerequisites
      1. PostgreSQL 16 (EDB installer) with psql on PATH
      2. PostGIS  - install via Stack Builder: Spatial Extensions > PostGIS
      3. pgvector - OPTIONAL, only needed for the Phase 3 agent layer. If it is
         missing this script skips schema_agent_pgvector.sql and says so.

    You will be prompted for the password unless PGPASSWORD is set.
#>
[CmdletBinding()]
param(
    [string]$PgHost = 'localhost',
    [int]   $Port   = 5432,
    [string]$Database = 'riskradar',
    [string]$User     = 'postgres',
    [switch]$CreateDb,
    [switch]$Reset
)

$ErrorActionPreference = 'Stop'

# Force UTF-8 on the wire regardless of the console code page - the seed and
# register files carry Sinhala. See the longer note in load_spatial.ps1.
$env:PGCLIENTENCODING = 'UTF8'


function Say($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m)  { Write-Host "    ok  $m"  -ForegroundColor Green }
function Warn($m){ Write-Host "    $m"      -ForegroundColor Yellow }
function Bad($m) { Write-Host "    $m"      -ForegroundColor Red }

# --- locate psql ------------------------------------------------------------
# Postgres on Windows usually is NOT on PATH; the EDB installer does not add it.
# Look in the standard install locations and use it for this session.
function Find-Psql {
    $cmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $roots = @()
    if ($env:PGBIN) { $roots += $env:PGBIN }
    $roots += @(
        'C:\Program Files\PostgreSQL\*\bin',
        'C:\Program Files (x86)\PostgreSQL\*\bin',
        "$env:LOCALAPPDATA\Programs\PostgreSQL\*\bin"
    )
    # NOTE: deliberately not `-Filter psql.exe`. Combining a wildcarded -Path
    # (the '*' version segment) with -Filter silently returns zero results on
    # some PowerShell versions, though the same -Path works alone. This branch
    # only runs when psql is NOT already on PATH -- i.e. exactly when it is
    # needed -- so the failure stays invisible until it matters. Found 2026-08-09.
    $found = foreach ($r in $roots) {
        Get-ChildItem -Path $r -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $candidate = Join-Path $_.FullName 'psql.exe'
            if (Test-Path $candidate) { Get-Item $candidate }
        }
    }
    if (-not $found) { return $null }

    # highest version wins, e.g. ...\PostgreSQL\17\bin before ...\16\bin
    $best = $found | Sort-Object {
        if ($_.FullName -match '\\PostgreSQL\\(\d+)\\') { [int]$Matches[1] } else { 0 }
    } -Descending | Select-Object -First 1

    $env:Path = "$($best.DirectoryName);$env:Path"
    return $best.FullName
}

$PsqlPath = Find-Psql
if (-not $PsqlPath) {
    Bad 'Could not find psql.exe anywhere.'
    Warn 'Looked in: C:\Program Files\PostgreSQL\*\bin  and  $env:PGBIN'
    Warn ''
    Warn 'If PostgreSQL is not installed yet, get it here:'
    Warn '  https://www.postgresql.org/download/windows/  (EDB installer)'
    Warn 'During install, also tick Stack Builder and add: Spatial Extensions > PostGIS'
    Warn ''
    Warn 'If it IS installed somewhere unusual, point at it and re-run:'
    Write-Host '  $env:PGBIN = "D:\your\path\PostgreSQL\16\bin"' -ForegroundColor DarkGray
    exit 1
}
Ok "psql: $PsqlPath"

# design/ lives one level up from backend/
$Design = (Resolve-Path (Join-Path $PSScriptRoot '..\..\design')).Path
$DbDir  = $PSScriptRoot
if (-not (Test-Path (Join-Path $Design 'database\schema.sql'))) {
    Bad "Cannot find design\database\schema.sql (looked in $Design)"; exit 1
}

$Common = @('-v','ON_ERROR_STOP=1','-h',$PgHost,'-p',"$Port",'-U',$User,'-q')

function Invoke-Sql {
    param([string]$Database, [string]$File, [string]$Command)
    if ($File)  { & psql @Common -d $Database -f $File }
    else        { & psql @Common -d $Database -c $Command }
}

# --- optionally create the database ----------------------------------------
if ($CreateDb) {
    Say "Creating database '$Database'"
    $exists = & psql @Common -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$Database'"
    if ($exists -eq '1') { Ok "'$Database' already exists" }
    else {
        Invoke-Sql -Database 'postgres' -Command "CREATE DATABASE $Database"
        if ($LASTEXITCODE -ne 0) { Bad 'could not create the database'; exit 1 }
        Ok "created '$Database'"
    }
}

# --- connectivity -----------------------------------------------------------
Say "Connecting to $PgHost`:$Port/$Database as $User"
$ver = & psql @Common -d $Database -tAc 'SHOW server_version'
if ($LASTEXITCODE -ne 0) {
    Bad 'Could not connect.'
    Warn "If the database does not exist yet, re-run with -CreateDb"
    exit 1
}
Ok "PostgreSQL $($ver.Trim())"

if ($Reset) {
    Say 'Dropping and recreating schema public'
    Invoke-Sql -Database $Database -Command 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
    if ($LASTEXITCODE -ne 0) { Bad 'reset failed'; exit 1 }
    Ok 'schema reset'
}

# --- extensions -------------------------------------------------------------
Say 'Extensions'
Invoke-Sql -Database $Database -Command 'CREATE EXTENSION IF NOT EXISTS postgis;'
if ($LASTEXITCODE -ne 0) {
    Bad 'PostGIS is not available - it is required.'
    Warn 'Install it with Stack Builder: Spatial Extensions > PostGIS bundle.'
    exit 1
}
Ok 'postgis'

Invoke-Sql -Database $Database -Command 'CREATE EXTENSION IF NOT EXISTS pg_trgm;' | Out-Null
Ok 'pg_trgm'

try { & psql @Common -d $Database -c 'CREATE EXTENSION IF NOT EXISTS vector;' *>$null } catch {}
$HasVector = ($LASTEXITCODE -eq 0)
if ($HasVector) { Ok 'vector (pgvector)' }
else { Warn 'pgvector not available - the agent layer (Phase 3) will be skipped. Nothing else needs it.' }

# --- apply ------------------------------------------------------------------
function Apply-File {
    param([string]$Label, [string]$Path)
    Say $Label
    if (-not (Test-Path $Path)) { Bad "missing file: $Path"; exit 1 }
    Invoke-Sql -Database $Database -File $Path
    if ($LASTEXITCODE -ne 0) {
        Write-Host ''
        Bad "FAILED: $Label"
        Warn "File: $Path"
        Warn 'Nothing from this file was applied. Fix it and re-run.'
        exit 1
    }
    Ok (Split-Path $Path -Leaf)
}

Apply-File '1/9  Base schema (18 tables)'                    (Join-Path $Design 'database\schema.sql')
Apply-File '2/9  Addendum: imports, weights, period rules'   (Join-Path $Design 'database\schema_weights_addendum.sql')
Apply-File '3/9  D8: spatial layers + analysis toolbox'      (Join-Path $Design 'database\spatial-model.sql')

if ($HasVector) {
    Apply-File '3b   Agent RAG layer (pgvector)'             (Join-Path $Design 'database\schema_agent_pgvector.sql')
} else {
    Say '3b   Agent RAG layer'
    Warn 'skipped (no pgvector). Run it later: psql -d riskradar -f design\database\schema_agent_pgvector.sql'
}

Apply-File '4/9  Seed: reference data, catalog, 243 profiles' (Join-Path $Design 'ingestion\seed_all.sql')

# Must run AFTER the seed, which creates the catalogue rows it marks. It adds
# indicator_catalog.value_kind ('absolute' | 'signed') and marks the variables
# that legitimately carry negative values -- a change or trend rather than a
# quantity. Without it, seed_central.py fails on the first Central workbook with
# `column "value_kind" does not exist`, which is how its absence was found: it
# was written on 3 Sep, named in RUN_LOCALLY.md's manual order, and never
# registered here. Nothing else in design\database is unregistered -- checked.
Apply-File '4b   Addendum: signed (change/trend) indicator values' (Join-Path $Design 'database\schema_signed_values_addendum.sql')

# The 2026-08-09/10/11 addenda run AFTER the seed on purpose. The consensus
# addendum opens with a pre-flight check that no two active profile versions
# share a scope; run before the seed it would pass trivially against an empty
# table, which is the opposite of the point. All four are no-ops on the
# seeded data (schema only -- no rows are added, changed or removed).
Apply-File '5/9  Addendum: consensus, publication, index scope' (Join-Path $Design 'database\schema_consensus_addendum.sql')
# Must run AFTER the consensus addendum (which creates membership_consensus and
# the profile_indicator columns) and BEFORE anyone saves weights. It replaces
# save_profile_weights() with a version that carries consensus through; the
# original silently reset every membership to 'agreed', discarding exclusions.
# Nothing to repair on an existing database as long as this lands first: a
# profile still at version 1 came from the seed and has never been saved.
Apply-File '5b   Addendum: save_profile_weights carries consensus' (Join-Path $Design 'database\schema_profile_consensus_save_addendum.sql')

# Must run IMMEDIATELY AFTER 5b, because it SPLICES a PERFORM into the
# save_profile_weights() body it finds in pg_proc; run it before 5b and there is
# nothing to splice, run 5b again afterwards and the splice is overwritten.
# It closes the 5 September defect: the save validated only what it was SENT and
# never what it was sent AGAINST, so an unknown code was silently dropped, an
# absent domain was never compared to 100, and an omitted variable disappeared —
# each of them retiring a good version and reporting 200.
Apply-File '5c   Addendum: save_profile_weights completeness pre-flight' (Join-Path $Design 'database\schema_weights_save_completeness_addendum.sql')

Apply-File '6/9  Addendum: registration, approval, province scope' (Join-Path $Design 'database\schema_auth_addendum.sql')

# Depends on app_user (schema_auth_addendum.sql, step 6/9): the revocation
# trigger fires on app_user.status transitions, so auth must exist first.
Apply-File '7/9  Addendum: server-side sessions (T2b, Stage 9.6)' (Join-Path $Design 'database\schema_session_addendum.sql')

# Must run BEFORE the DS-division load below: it drops ds_division.geom's
# NOT NULL constraint, which the Kalmunai split's two boundary-pending rows
# (Stage 1.14, O-2) require in order to INSERT at all.
Apply-File '8/9  Addendum: boundary-pending divisions (the Kalmunai split)' (Join-Path $Design 'database\schema_boundary_pending_addendum.sql')

# Depends on app_user (6/9) and on sector/subsector from the seed (4/9).
# Scopes WRITES to the sectors a user was granted, and holds the hazard-domain
# grant separately because those twelve climate variables are shared across
# ~13.5 profiles each and belong to no single sector.
Apply-File '7b   Addendum: per-sector write scope' (Join-Path $Design 'database\schema_write_scope_addendum.sql')

# Must run BEFORE the DS-division load below, because it adds ds_division.legacy_code.
#
# On a COLD build this is a near no-op and that is correct: load_spatial inserts
# straight from the register, which already carries the official codes, so there
# is no CEN-001 row to rename and legacy_code stays NULL. There is no legacy on a
# fresh database. It earns its place on an EXISTING one, where it re-keys the 329
# divisions that carry forward, retires Ambagamuwa and Kothmale, and adds the
# eleven divisions the 2025 boundary revision created.
Apply-File '8b   Addendum: official DS codes + the 2025 boundary revision' (Join-Path $Design 'database\schema_official_dscode_addendum.sql')

# --- DS divisions -----------------------------------------------------------
Say '9/9  DS divisions (register + surveyed polygons; counts reported by smoke_test) + spatial layers'
if (Get-Command ogr2ogr -ErrorAction SilentlyContinue) {
    & (Join-Path $DbDir 'load_spatial.ps1') -PgHost $PgHost -Port $Port -Database $Database -User $User
    if ($LASTEXITCODE -ne 0) { Bad 'spatial load failed (see above)'; exit 1 }
} else {
    Warn 'ogr2ogr (GDAL) not on PATH - skipped.'
    Warn 'PostGIS ships shp2pgsql, which works too. Easiest: install GDAL via OSGeo4W'
    Warn 'or QGIS, then re-run this script. Everything else is already loaded.'
}

# --- summary ----------------------------------------------------------------
Say 'Summary'
Invoke-Sql -Database $Database -Command @"
SELECT 'provinces'   AS entity, count(*) FROM province
UNION ALL SELECT 'hazard types',        count(*) FROM hazard_type
UNION ALL SELECT 'sectors',             count(*) FROM sector
UNION ALL SELECT 'subsectors',          count(*) FROM subsector
UNION ALL SELECT 'ds divisions',        count(*) FROM ds_division
UNION ALL SELECT '  ... surveyed',      count(*) FROM ds_division WHERE boundary_status = 'surveyed'
UNION ALL SELECT '  ... boundary pending', count(*) FROM ds_division WHERE boundary_status = 'boundary_pending'
UNION ALL SELECT 'indicator catalog',   count(*) FROM indicator_catalog
UNION ALL SELECT 'aliases',             count(*) FROM indicator_alias
UNION ALL SELECT 'profiles',            count(*) FROM vulnerability_profile
UNION ALL SELECT 'profile membership',  count(*) FROM profile_indicator
UNION ALL SELECT '  ... with a weight', count(*) FROM profile_indicator WHERE weight_pct IS NOT NULL
UNION ALL SELECT '  ... awaiting one',  count(*) FROM profile_indicator WHERE weight_pct IS NULL
UNION ALL SELECT 'spatial layers',      count(*) FROM spatial_layer
UNION ALL SELECT 'toolbox operations',  count(*) FROM spatial_operation;
"@

Write-Host "`nDatabase built." -ForegroundColor Green
Write-Host "Next:  .\db\smoke_test_native.ps1"
Write-Host "       .\db\consensus_test_native.ps1        (Stage 1.12)"
Write-Host "       .\db\auth_test_native.ps1             (Stage 1.13)"
Write-Host "       .\db\boundary_pending_test_native.ps1 (Stage 1.14)"
Write-Host "       .\db\session_test_native.ps1          (Stage 9.6)"
