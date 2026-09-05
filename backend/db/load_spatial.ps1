<#
.SYNOPSIS
    Load the official boundary shapefiles into a LOCAL PostgreSQL. No Docker.

.DESCRIPTION
    1. ds_division <- every dsd_register.csv row LEFT JOINed to DS_Boundary.shp's
       polygons (ADM3) BY OFFICIAL CODE. A register row with no matching polygon
       still loads -- geom/area_km2 NULL, reading as boundary_pending -- it is not
       silently dropped. Geometry stored in EPSG:4326; area_km2 computed in
       EPSG:5235 (SLD99) so it comes out in km2, not degrees.

       Joined on `new_ds_cod`, NOT on name. The previous version joined by ADM3
       name, which breaks the moment a division is renamed -- and nine were:
       "Koralai Pattu North" became "KORALAI PATTU NORTH (VAHARAI)" and would have
       loaded as boundary_pending with a perfectly good polygon sitting unused in
       staging. No error, no map. The official code is stable across renames.

       Source: DS_Boundary.shp (Survey Department, 2025-10-09), 340 divisions, in
       Kandawala / Sri Lanka Grid. -s_srs is stated EXPLICITLY below because that
       .prj carries no EPSG authority code, and a misread source CRS puts every
       polygon in the wrong place without raising an error.
    2. Province and district outlines loaded as spatial_layer features, so the map
       has admin boundaries and the D8 toolbox has something real to run against.

    Needs ogr2ogr (GDAL). Easiest source on Windows is OSGeo4W or QGIS; both put
    ogr2ogr on PATH. Called automatically by apply_native.ps1.
#>
[CmdletBinding()]
param(
    [string]$PgHost = 'localhost',
    [int]   $Port   = 5432,
    [string]$Database = 'riskradar',
    [string]$User     = 'postgres'
)

$ErrorActionPreference = 'Stop'

# psql on Windows takes client_encoding from the console code page, which is
# WIN1252 on a default install. dsd_register.csv is UTF-8 and carries Sinhala
# names, so \copy hands those bytes to the server labelled WIN1252 and the load
# dies on the first one that has no WIN1252 equivalent:
#   character with byte sequence 0x9d in encoding "WIN1252" has no equivalent...
# 0x9d is simply the third byte of a Sinhala code point, not corrupt data - the
# file is valid UTF-8 either way.
#
# This was always latent: the pre-2026-08-14 register had the same byte profile
# (0x81, 0x8d, 0x8f, 0x90 and 0x9d all present), so any earlier successful load
# ran in a console that happened to be on a UTF-8 code page. Do not rely on that.
$env:PGCLIENTENCODING = 'UTF8'

function Ok($m)  { Write-Host "    ok  $m" -ForegroundColor Green }
function Bad($m) { Write-Host "    $m"     -ForegroundColor Red }

$Design = (Resolve-Path (Join-Path $PSScriptRoot '..\..\design')).Path
$Shp    = Join-Path $Design 'spatial'
$Reg    = (Join-Path $Design 'ingestion\dsd_register.csv') -replace '\\','/'

foreach ($f in @('DS_Boundary.shp','SL_PD.shp','SL_DSD.shp')) {
    if (-not (Test-Path (Join-Path $Shp $f))) { Bad "missing $Shp\$f"; exit 1 }
}

$Common = @('-v','ON_ERROR_STOP=1','-h',$PgHost,'-p',"$Port",'-U',$User,'-d',$Database,'-q')

# Write to a temp file and use -f rather than -c: PowerShell mangles embedded
# double-quotes (e.g. JSON literals, quoted identifiers) when they pass through
# native-argument encoding on the way to psql.
function Sql([string]$c) {
    $tmp = Join-Path $env:TEMP "riskradar_stmt_$([guid]::NewGuid().ToString('N')).sql"
    # NOT Set-Content -Encoding UTF8: on Windows PowerShell 5.1 that writes a
    # BOM, and psql reads the BOM as part of the first token -- the failure is
    # `syntax error at or near "<U+FEFF>DROP"`, which points at a line that is
    # perfectly valid. PowerShell 7 writes UTF-8 without a BOM for the same
    # flag, so this breaks on one machine and not another. Be explicit instead.
    [System.IO.File]::WriteAllText($tmp, $c, (New-Object System.Text.UTF8Encoding $false))
    & psql @Common -f $tmp
    $rc = $LASTEXITCODE
    Remove-Item $tmp -ErrorAction SilentlyContinue
    if ($rc -ne 0) { Bad 'SQL failed (see above)'; exit 1 }
}

# The bundled ogr2ogr here has no live "PostgreSQL" (PG) driver, only PGDUMP -
# it wasn't linked against libpq. Dump to SQL and load with psql instead;
# same data, no extra install. Note PGDUMP (like the PG driver) LAUNDERs field
# names to lowercase, so ADM3_EN etc. become adm3_en - queries below use that.
function Load-Shapefile([string]$Shapefile, [string]$Table, [string]$SourceSrs = '') {
    $dump = Join-Path $env:TEMP "$Table.sql"
    $srsArgs = @()
    if ($SourceSrs) { $srsArgs = @('-s_srs', $SourceSrs) }
    & ogr2ogr -f PGDUMP $dump $Shapefile `
              -nln $Table -lco GEOMETRY_NAME=geom -lco DROP_TABLE=IF_EXISTS `
              @srsArgs -t_srs EPSG:4326 -nlt MULTIPOLYGON
    if ($LASTEXITCODE -ne 0) { Bad "ogr2ogr failed on $Shapefile"; exit 1 }
    & psql @Common -f $dump
    if ($LASTEXITCODE -ne 0) { Bad "loading $Table failed (see above)"; exit 1 }
    Remove-Item $dump -ErrorAction SilentlyContinue
}

Write-Host '    loading DS_Boundary polygons into staging (EPSG:5234 -> 4326)...'
Load-Shapefile (Join-Path $Shp 'DS_Boundary.shp') 'stg_dsd' 'EPSG:5234'

Write-Host '    loading the DS-division register...'
Sql @"
DROP TABLE IF EXISTS stg_register;
CREATE TABLE stg_register (
    province TEXT, district TEXT, ds_code TEXT,
    ds_division TEXT, ds_division_si TEXT,
    ds_code_official_num TEXT, ds_code_legacy TEXT, split_from TEXT,
    lon DOUBLE PRECISION, lat DOUBLE PRECISION,
    level TEXT, source TEXT);
"@
& psql @Common -c "\copy stg_register FROM '$Reg' WITH (FORMAT csv, HEADER true)"
if ($LASTEXITCODE -ne 0) { Bad 'could not copy dsd_register.csv'; exit 1 }

Write-Host '    merging geometry + register -> ds_division...'
# LEFT JOIN, not JOIN: a register row with no matching polygon (e.g. a
# division registered before its boundary is surveyed -- the Kalmunai split,
# O-2, Stage 1.14) must still be INSERTed, with geom/area_km2 NULL, so it
# reads as boundary_pending. An inner join would silently drop it instead --
# exactly the "register row without geometry breaks the map" trap the design
# already warns about, just approached from the other direction: the failure
# mode of a plain JOIN here is silent omission, not a fabricated boundary.
Sql @"
INSERT INTO ds_division (code, name, district_name, province_id, geom, area_km2)
SELECT r.ds_code, r.ds_division, r.district, p.id,
       CASE WHEN s.geom IS NOT NULL THEN ST_Multi(ST_MakeValid(s.geom)) END,
       CASE WHEN s.geom IS NOT NULL THEN ST_Area(ST_Transform(s.geom, 5235)) / 1000000.0 END
  FROM stg_register r
  JOIN province p ON p.name = r.province
  LEFT JOIN stg_dsd s ON s.new_ds_cod = r.ds_code
ON CONFLICT (code) DO UPDATE
   SET name = EXCLUDED.name, district_name = EXCLUDED.district_name,
       province_id = EXCLUDED.province_id, geom = EXCLUDED.geom,
       area_km2 = EXCLUDED.area_km2;
"@

# BOTH SHOULD NOW BE ZERO -- and that is a change from what this script used to
# say. Between 10 and 14 Aug 2026 they were expected to be non-zero: the register
# carried two Kalmunai rows with no polygon, and the shapefile carried one
# retired polygon with no register row. DS_Boundary.shp (2025-10-09) supplies
# every division including both Kalmunai divisions, so the register and the
# polygon set are now the same 340 objects joined on a stable code.
#
# If either number is non-zero after a load, do NOT relax the check to make it
# pass: it means the register and the shapefile have diverged, and the failure
# mode is a division that publishes with no map, or a polygon that renders with
# no data behind it.
Sql @"
SELECT 'register rows with no polygon' AS check, count(*) AS n
  FROM stg_register r LEFT JOIN stg_dsd s ON s.new_ds_cod = r.ds_code
 WHERE s.new_ds_cod IS NULL
UNION ALL
SELECT 'polygons with no register row', count(*)
  FROM stg_dsd s LEFT JOIN stg_register r ON r.ds_code = s.new_ds_cod
 WHERE r.ds_code IS NULL;
"@

Write-Host '    loading province + district outlines as spatial layers...'
Load-Shapefile (Join-Path $Shp 'SL_PD.shp')  'stg_prov'
Load-Shapefile (Join-Path $Shp 'SL_DSD.shp') 'stg_dist'

Sql @"
INSERT INTO spatial_layer (code, name, geometry_type, attribute_schema)
VALUES ('ADMIN_PROVINCE', 'Province boundaries (ADM1)', 'POLYGON',
        '{"name":{"type":"string","required":true}}'),
       ('ADMIN_DISTRICT', 'District boundaries (ADM2)', 'POLYGON',
        '{"name":{"type":"string","required":true}}')
ON CONFLICT (code) DO NOTHING;

INSERT INTO spatial_feature (layer_id, feature_code, geom, attributes)
SELECT (SELECT id FROM spatial_layer WHERE code = 'ADMIN_PROVINCE'),
       s.adm1_en, ST_MakeValid(s.geom), jsonb_build_object('name', s.adm1_en)
  FROM stg_prov s
ON CONFLICT (layer_id, feature_code) DO NOTHING;

INSERT INTO spatial_feature (layer_id, feature_code, geom, attributes)
SELECT (SELECT id FROM spatial_layer WHERE code = 'ADMIN_DISTRICT'),
       s.adm2_en, ST_MakeValid(s.geom), jsonb_build_object('name', s.adm2_en)
  FROM stg_dist s
ON CONFLICT (layer_id, feature_code) DO NOTHING;

DROP TABLE IF EXISTS stg_dsd, stg_prov, stg_dist, stg_register;
"@

& psql @Common -c 'SELECT count(*) AS ds_divisions, round(sum(area_km2)::numeric,1) AS total_km2 FROM ds_division;'
Ok 'spatial data loaded'
