<#
.SYNOPSIS
    Run the smoke tests against a LOCAL PostgreSQL. No Docker.

.EXAMPLE
    .\db\smoke_test_native.ps1
    .\db\smoke_test_native.ps1 -Port 5433
#>
[CmdletBinding()]
param(
    [string]$PgHost = 'localhost',
    [int]   $Port   = 5432,
    [string]$Database = 'riskradar',
    [string]$User     = 'postgres'
)

$ErrorActionPreference = 'Stop'

function Ok($m)  { Write-Host "    ok  $m" -ForegroundColor Green }
function Warn($m){ Write-Host "    $m"     -ForegroundColor Yellow }
function Bad($m) { Write-Host "    $m"     -ForegroundColor Red }

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

$File = Join-Path $PSScriptRoot 'smoke_test.sql'
Write-Host "`n==> Smoke tests" -ForegroundColor Cyan
& psql -v ON_ERROR_STOP=1 -h $PgHost -p $Port -U $User -d $Database -f $File

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nPASS  the schema behaves as designed." -ForegroundColor Green
} else {
    Write-Host "`nFAIL  see the error above." -ForegroundColor Red
    exit 1
}
