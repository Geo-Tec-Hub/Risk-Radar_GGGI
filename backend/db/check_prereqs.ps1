<#
.SYNOPSIS
    Check what is installed before trying to build the database.

.EXAMPLE
    .\db\check_prereqs.ps1

.NOTES
    Reports on PostgreSQL, PostGIS, pgvector and GDAL, and says which are
    required versus optional. Changes nothing.
#>
[CmdletBinding()]
param(
    [string]$PgHost   = 'localhost',
    [int]   $Port     = 5432,
    [string]$User     = 'postgres',
    [string]$Database = 'postgres'
)

function Head($m) { Write-Host "`n$m" -ForegroundColor Cyan }
function Yes($m)  { Write-Host "  [ok]      $m" -ForegroundColor Green }
function No($m)   { Write-Host "  [MISSING] $m" -ForegroundColor Red }
function Opt($m)  { Write-Host "  [absent]  $m" -ForegroundColor Yellow }
function Note($m) { Write-Host "            $m" -ForegroundColor DarkGray }

Head 'PostgreSQL'

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    $roots = @('C:\Program Files\PostgreSQL\*\bin',
               'C:\Program Files (x86)\PostgreSQL\*\bin',
               "$env:LOCALAPPDATA\Programs\PostgreSQL\*\bin")
    if ($env:PGBIN) { $roots = @($env:PGBIN) + $roots }
    # See the note in apply_native.ps1: a wildcarded -Path plus -Filter can
    # return nothing. This is the worst place for that bug -- it would report
    # "PostgreSQL is not installed" on a machine that has it, and send someone
    # off to install a second copy. Found 2026-08-09.
    $hits = foreach ($r in $roots) {
        Get-ChildItem -Path $r -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $candidate = Join-Path $_.FullName 'psql.exe'
            if (Test-Path $candidate) { Get-Item $candidate }
        }
    }
    if ($hits) {
        $best = $hits | Sort-Object { if ($_.FullName -match '\\PostgreSQL\\(\d+)\\') { [int]$Matches[1] } else { 0 } } -Descending | Select-Object -First 1
        Yes "installed but not on PATH: $($best.FullName)"
        Note 'The scripts add it automatically, so no action needed.'
        $env:Path = "$($best.DirectoryName);$env:Path"
        $psql = Get-Command psql -ErrorAction SilentlyContinue
    } else {
        No 'PostgreSQL is not installed (no psql.exe found).'
        Note 'Download: https://www.postgresql.org/download/windows/'
        Note 'Tick Stack Builder during install so you can add PostGIS.'
    }
} else {
    Yes "psql on PATH: $($psql.Source)"
}

if ($psql) {
    Head 'Server'
    $svc = Get-Service -Name 'postgresql*' -ErrorAction SilentlyContinue
    if ($svc) {
        foreach ($s in $svc) {
            if ($s.Status -eq 'Running') { Yes "service $($s.Name) is running" }
            else {
                No "service $($s.Name) is $($s.Status)"
                Note "Start it:  Start-Service $($s.Name)"
            }
        }
    } else { Opt 'no postgresql* Windows service found (may be a portable install)' }

    $ver = & psql -h $PgHost -p $Port -U $User -d $Database -tAc 'SHOW server_version' 2>$null
    if ($LASTEXITCODE -eq 0) {
        Yes "connected to $PgHost`:$Port - PostgreSQL $($ver.Trim())"

        Head 'Extensions available on this server'
        $avail = & psql -h $PgHost -p $Port -U $User -d $Database -tAc `
            "SELECT name FROM pg_available_extensions WHERE name IN ('postgis','vector','pg_trgm')" 2>$null
        foreach ($e in @('postgis','pg_trgm','vector')) {
            if ($avail -contains $e) { Yes $e }
            elseif ($e -eq 'postgis') {
                No 'postgis - REQUIRED'
                Note 'Install via Stack Builder: Spatial Extensions > PostGIS bundle'
            }
            elseif ($e -eq 'vector') {
                Opt 'vector (pgvector) - optional, only for the Phase 3 agent layer'
                Note 'The build skips those 4 tables automatically.'
            }
            else { Opt "$e - optional" }
        }
    } else {
        No "could not connect to $PgHost`:$Port as '$User'"
        Note 'Wrong password? Set it for this session:  $env:PGPASSWORD = "yourpassword"'
        Note "Different port? Pass it:  .\db\check_prereqs.ps1 -Port 5433"
    }
}

Head 'GDAL (optional - only for loading the DS-division polygons)'
if (Get-Command ogr2ogr -ErrorAction SilentlyContinue) {
    Yes "ogr2ogr: $((Get-Command ogr2ogr).Source)"
} else {
    Opt 'ogr2ogr not found - the boundary load will be skipped'
    Note 'Comes with QGIS or OSGeo4W. Everything else builds without it.'
}

Head 'Design-tooling (optional - only for regenerating the ERD and checking DDL)'
# Both were missing on the first machine that tried to run them (2026-08-09) and
# had to be installed mid-task. Checked here so the next person finds out before
# a schema change rather than after one.
if (Get-Command dot -ErrorAction SilentlyContinue) {
    Yes "Graphviz dot: $((Get-Command dot).Source)"
} else {
    Opt 'Graphviz not found - design\database\generate_erd.py cannot draw the ERD'
    Note 'Install: winget install Graphviz.Graphviz  (then reopen the terminal)'
}

$py = Get-Command python -ErrorAction SilentlyContinue
if ($py) {
    $hasPglast = & $py.Source -c "import pglast" 2>$null; $ok = ($LASTEXITCODE -eq 0)
    if ($ok) { Yes 'pglast installed (design\database\check_ddl.py can run)' }
    else {
        Opt 'pglast not installed - check_ddl.py cannot verify a schema addendum'
        Note 'Install: pip install pglast'
    }
} else {
    Opt 'python not on PATH - check_ddl.py and the generators cannot run'
}

Head 'Verdict'
$okPg  = [bool]$psql
Write-Host ''
if ($okPg) {
    Write-Host '  Run:  .\db\apply_native.ps1 -CreateDb' -ForegroundColor Green
} else {
    Write-Host '  Install PostgreSQL first, then re-run this check.' -ForegroundColor Yellow
}
Write-Host ''
