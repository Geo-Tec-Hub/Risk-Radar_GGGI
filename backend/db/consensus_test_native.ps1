<#
.SYNOPSIS
    Negative tests for schema_consensus_addendum.sql (Stage 1.12) against a
    LOCAL PostgreSQL. No Docker. Every test proves an attempt that should
    fail actually fails, for the stated reason (BUILD_BRIEF_2026-08-09.md T1).

.EXAMPLE
    .\db\consensus_test_native.ps1
    .\db\consensus_test_native.ps1 -Port 5433
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
    # NOTE: deliberately not `-Filter psql.exe` here. Combining a wildcarded
    # -Path (the '*' version segment) with -Filter silently returns zero
    # results in this PowerShell version, even though the same -Path works
    # alone and the same -Filter works against a literal resolved path. Same
    # latent bug also existed in apply_native.ps1, smoke_test_native.ps1 and
    # check_prereqs.ps1; all three were fixed the same day (see
    # PROGRESS_TRACKER.md §3, 2026-08-09 "Find-Psql" rows).
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
    Warn 'If it IS installed somewhere unusual, point at it and re-run:'
    Write-Host '  $env:PGBIN = "D:\your\path\PostgreSQL\16\bin"' -ForegroundColor DarkGray
    exit 1
}
Ok "psql: $PsqlPath"

$File = Join-Path $PSScriptRoot 'consensus_test.sql'
Write-Host "`n==> Consensus-addendum negative tests (Stage 1.12)" -ForegroundColor Cyan
& psql -v ON_ERROR_STOP=1 -h $PgHost -p $Port -U $User -d $Database -f $File

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nPASS  every constraint fails for the stated reason; the schema behaves as designed." -ForegroundColor Green
} else {
    Write-Host "`nFAIL  see the error above. The whole file runs in one transaction and rolls back either way," -ForegroundColor Red
    Write-Host "      so a failure here never leaves partial test data in place." -ForegroundColor Red
    exit 1
}
