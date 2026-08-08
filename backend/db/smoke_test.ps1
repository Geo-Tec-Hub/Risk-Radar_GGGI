<#
.SYNOPSIS
    Run the smoke tests against the running database. (Windows PowerShell)

.EXAMPLE
    .\db\smoke_test.ps1

.NOTES
    Checks that the schema BEHAVES as designed - bad weights rejected, computed
    values without a job rejected, geometry rules enforced, areas in km2 not
    degrees. Any failure raises and this script exits non-zero.
#>
[CmdletBinding()]
param(
    [string]$Database = 'riskradar',
    [string]$User     = 'riskradar'
)

$ErrorActionPreference = 'Stop'

$running = docker compose ps --status running --services 2>$null
if ($LASTEXITCODE -ne 0 -or $running -notcontains 'db') {
    Write-Host "The 'db' container is not running.  docker compose up -d" -ForegroundColor Red
    exit 1
}

Write-Host "`n==> Smoke tests" -ForegroundColor Cyan
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U $User -d $Database -f /db/smoke_test.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nPASS  the schema behaves as designed." -ForegroundColor Green
} else {
    Write-Host "`nFAIL  see the error above." -ForegroundColor Red
    exit 1
}
