<#
.SYNOPSIS
    Create the first administrator account (T2b). No one can use
    POST /admin/registrations/{id}/approve to grant the admin role before an
    admin exists to call it -- this script is the one-time way out of that
    loop, done directly against the database, exactly as the negative tests
    do it (self-referencing approved_by, since the id is not known until
    after the row is inserted).

    Every subsequent admin is created the normal way: they self-register,
    and an existing admin approves them with role=admin (no province).

.EXAMPLE
    .\db\bootstrap_admin.ps1 -Email admin@riskradar.lk -Password 'change-me-now' -FullName "Risk Radar Admin"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Email,
    [Parameter(Mandatory)][string]$Password,
    [Parameter(Mandatory)][string]$FullName,
    [string]$PgHost = 'localhost',
    [int]   $Port   = 5432,
    [string]$Database = 'riskradar',
    [string]$User     = 'postgres'
)

$ErrorActionPreference = 'Stop'

# Force UTF-8 on the wire regardless of the console code page (see load_spatial.ps1).
$env:PGCLIENTENCODING = 'UTF8'

function Ok($m)  { Write-Host "    ok  $m" -ForegroundColor Green }
function Bad($m) { Write-Host "    $m"     -ForegroundColor Red }

function Find-Psql {
    $cmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $roots = @()
    if ($env:PGBIN) { $roots += $env:PGBIN }
    $roots += @('C:\Program Files\PostgreSQL\*\bin', 'C:\Program Files (x86)\PostgreSQL\*\bin',
                "$env:LOCALAPPDATA\Programs\PostgreSQL\*\bin")
    $found = foreach ($r in $roots) {
        Get-ChildItem -Path $r -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $candidate = Join-Path $_.FullName 'psql.exe'
            if (Test-Path $candidate) { Get-Item $candidate }
        }
    }
    if (-not $found) { return $null }
    $best = $found | Sort-Object { if ($_.FullName -match '\\PostgreSQL\\(\d+)\\') { [int]$Matches[1] } else { 0 } } -Descending | Select-Object -First 1
    $env:Path = "$($best.DirectoryName);$env:Path"
    return $best.FullName
}

$PsqlPath = Find-Psql
if (-not $PsqlPath) { Bad 'Could not find psql.exe.'; exit 1 }

$BackendDir = Split-Path $PSScriptRoot -Parent
$PythonExe  = Join-Path $BackendDir 'venv\Scripts\python.exe'
if (-not (Test-Path $PythonExe)) { Bad "Could not find $PythonExe -- run this from a checkout with backend\venv set up."; exit 1 }

# The password never touches a SQL string -- it goes to Python only, via an
# environment variable rather than a command-line argument or f-string, so a
# quote or backslash in it cannot break out of anything.
Push-Location $BackendDir
try {
    $env:BOOTSTRAP_ADMIN_PASSWORD = $Password
    $Hash = & $PythonExe -c "import os; from app.security import hash_password; print(hash_password(os.environ['BOOTSTRAP_ADMIN_PASSWORD']))"
} finally {
    Remove-Item Env:\BOOTSTRAP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Pop-Location
}
if ($LASTEXITCODE -ne 0 -or -not $Hash) { Bad 'Failed to hash the password.'; exit 1 }
Ok 'password hashed (argon2id)'

# Basic SQL-literal escaping (double any single quote) for the three values
# substituted into the SQL text below -- Hash is base64/argon2 alphabet only
# (no quotes possible) but Email/FullName are operator input.
#
# The SQL is built from a SINGLE-quoted (non-interpolating) here-string with
# {{TOKEN}} placeholders, not a double-quoted one: PowerShell would otherwise
# try to expand the literal `$$` (PL/pgSQL's dollar-quoting delimiter) as its
# own `$$` automatic variable, which is a different failure from -- and much
# more confusing than -- ordinary string interpolation.
function Escape-SqlLiteral($s) { $s -replace "'", "''" }
$EmailSql    = Escape-SqlLiteral $Email
$FullNameSql = Escape-SqlLiteral $FullName
$HashSql     = Escape-SqlLiteral $Hash

$SqlTemplate = @'
DO $$
DECLARE
    v_id BIGINT;
    v_admin_role SMALLINT;
BEGIN
    SELECT id INTO v_admin_role FROM role WHERE code = 'admin';
    IF v_admin_role IS NULL THEN
        RAISE EXCEPTION 'role.code admin not found -- is schema_auth_addendum.sql applied?';
    END IF;

    INSERT INTO app_user (email, password_hash, full_name)
    VALUES ('{{EMAIL}}', '{{HASH}}', '{{FULLNAME}}')
    RETURNING id INTO v_id;

    -- approved_by is self-referencing: the id is not known until after INSERT,
    -- so status/approved_by/approved_at are set together in a second
    -- statement, same as the app_user_approval_recorded tests do it.
    UPDATE app_user SET status = 'active', approved_at = now(), approved_by = v_id
     WHERE id = v_id;

    -- admin is national in scope (user_role_province_scope) -- no province_id.
    INSERT INTO user_role (user_id, role_id) VALUES (v_id, v_admin_role);

    RAISE NOTICE 'created admin app_user.id=%', v_id;
END $$;
'@

$Sql = $SqlTemplate.Replace('{{EMAIL}}', $EmailSql).Replace('{{HASH}}', $HashSql).Replace('{{FULLNAME}}', $FullNameSql)

$TmpFile = [System.IO.Path]::GetTempFileName()
# NOT Set-Content -Encoding utf8: on Windows PowerShell 5.1 that writes a BOM,
# and psql reads the BOM as part of the first token -- the failure is
# `syntax error at or near "<U+FEFF>DO"`, pointing at a line that is perfectly
# valid. PowerShell 7 writes UTF-8 without a BOM for the same flag, so this
# breaks on one machine and not another. Same fix as load_spatial.ps1.
[System.IO.File]::WriteAllText($TmpFile, $Sql, (New-Object System.Text.UTF8Encoding $false))
try {
    & psql -v ON_ERROR_STOP=1 -h $PgHost -p $Port -U $User -d $Database -f $TmpFile
    if ($LASTEXITCODE -ne 0) { Bad 'Bootstrap failed (see above -- often "already exists" on a re-run).'; exit 1 }
} finally {
    Remove-Item $TmpFile -ErrorAction SilentlyContinue
}

Ok "administrator '$Email' created and active"
