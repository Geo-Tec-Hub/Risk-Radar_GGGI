<#
.SYNOPSIS
    Build the Risk Radar database from the design artefacts. (Windows PowerShell)

.EXAMPLE
    .\db\apply.ps1
    .\db\apply.ps1 -Reset      # drop and recreate the schema first

.NOTES
    Run from the backend\ folder, after: docker compose up -d
    Stops at the FIRST error and says which file failed. psql wraps each file in
    a transaction, so a failure leaves nothing half-applied.
#>
[CmdletBinding()]
param(
    [switch]$Reset,
    [string]$Database = 'riskradar',
    [string]$User     = 'riskradar'
)

$ErrorActionPreference = 'Stop'

function Say($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "    ok  $msg"  -ForegroundColor Green }
function Bad($msg) { Write-Host "    $msg"      -ForegroundColor Red }

# --- is the container up? ---------------------------------------------------
$running = docker compose ps --status running --services 2>$null
if ($LASTEXITCODE -ne 0 -or $running -notcontains 'db') {
    Bad "The 'db' container is not running."
    Write-Host "    Start it first:  docker compose up -d" -ForegroundColor Yellow
    exit 1
}

# wait for Postgres to accept connections (first boot takes a few seconds)
Say 'Waiting for Postgres'
for ($i = 1; $i -le 30; $i++) {
    docker compose exec -T db pg_isready -U $User -d $Database *>$null
    if ($LASTEXITCODE -eq 0) { Ok 'accepting connections'; break }
    if ($i -eq 30) { Bad 'Postgres did not come up in 60s.'; exit 1 }
    Start-Sleep -Seconds 2
}

function Invoke-Psql {
    param([string]$File, [string]$Command)
    if ($File) {
        docker compose exec -T db psql -v ON_ERROR_STOP=1 -U $User -d $Database -q -f $File
    } else {
        docker compose exec -T db psql -v ON_ERROR_STOP=1 -U $User -d $Database -q -c $Command
    }
}

function Apply-File {
    param([string]$Label, [string]$Path)
    Say $Label
    Invoke-Psql -File $Path
    if ($LASTEXITCODE -ne 0) {
        Write-Host ''
        Bad "FAILED: $Label  ($Path)"
        Write-Host "    Nothing from this file was applied. Fix it and re-run." -ForegroundColor Yellow
        exit 1
    }
    Ok $Path
}

if ($Reset) {
    Say 'Dropping and recreating schema public'
    Invoke-Psql -Command 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
    if ($LASTEXITCODE -ne 0) { Bad 'reset failed'; exit 1 }
    Ok 'schema reset'
}

Apply-File '0/5  Extensions (postgis, vector, pg_trgm)'      '/db/00_extensions.sql'
Apply-File '1/5  Base schema'                                '/design/database/schema.sql'
Apply-File '2/5  Addendum: imports, weights, period rules'   '/design/database/schema_weights_addendum.sql'
Apply-File '3/5  D8: spatial layers + analysis toolbox'      '/design/database/spatial-model.sql'
Apply-File '4/5  Seed: reference data, catalog, 243 profiles' '/design/ingestion/seed_all.sql'

Say '5/5  DS divisions + spatial layers'
docker compose exec -T db bash -c 'command -v ogr2ogr' *>$null
if ($LASTEXITCODE -eq 0) {
    docker compose exec -T db bash /db/load_spatial.sh
    if ($LASTEXITCODE -ne 0) { Bad 'spatial load failed (see above)'; exit 1 }
    Ok 'DS divisions loaded'
} else {
    Write-Host '    skipped  GDAL is not in the image.' -ForegroundColor Yellow
    Write-Host '    Install once, then re-run this script:' -ForegroundColor Yellow
    Write-Host '      docker compose exec -u root db bash -c "apt-get update && apt-get install -y gdal-bin"' -ForegroundColor DarkGray
}

Say 'Summary'
Invoke-Psql -Command @"
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
Write-Host "Next:  .\db\smoke_test.ps1"
