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
    $found = foreach ($r in $roots) {
        Get-ChildItem -Path $r -Filter psql.exe -ErrorAction SilentlyContinue
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

Apply-File '1/5  Base schema (18 tables)'                    (Join-Path $Design 'database\schema.sql')
Apply-File '2/5  Addendum: imports, weights, period rules'   (Join-Path $Design 'database\schema_weights_addendum.sql')
Apply-File '3/5  D8: spatial layers + analysis toolbox'      (Join-Path $Design 'database\spatial-model.sql')

if ($HasVector) {
    Apply-File '3b   Agent RAG layer (pgvector)'             (Join-Path $Design 'database\schema_agent_pgvector.sql')
} else {
    Say '3b   Agent RAG layer'
    Warn 'skipped (no pgvector). Run it later: psql -d riskradar -f design\database\schema_agent_pgvector.sql'
}

Apply-File '4/5  Seed: reference data, catalog, 243 profiles' (Join-Path $Design 'ingestion\seed_all.sql')

# --- DS divisions -----------------------------------------------------------
Say '5/5  DS divisions (330) + spatial layers'
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
