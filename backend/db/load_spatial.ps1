<#
.SYNOPSIS
    Load the official boundary shapefiles into a LOCAL PostgreSQL. No Docker.

.DESCRIPTION
    1. ds_division <- SL_RDSD.shp (ADM3, 330 polygons), joined to dsd_register.csv
       for the official code, district and province. Geometry stored in EPSG:4326;
       area_km2 computed in EPSG:5235 (SLD99) so it comes out in km2, not degrees.
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
function Ok($m)  { Write-Host "    ok  $m" -ForegroundColor Green }
function Bad($m) { Write-Host "    $m"     -ForegroundColor Red }

$Design = (Resolve-Path (Join-Path $PSScriptRoot '..\..\design')).Path
$Shp    = Join-Path $Design 'spatial'
$Reg    = (Join-Path $Design 'ingestion\dsd_register.csv') -replace '\\','/'

foreach ($f in @('SL_RDSD.shp','SL_PD.shp','SL_DSD.shp')) {
    if (-not (Test-Path (Join-Path $Shp $f))) { Bad "missing $Shp\$f"; exit 1 }
}

$Common = @('-v','ON_ERROR_STOP=1','-h',$PgHost,'-p',"$Port",'-U',$User,'-d',$Database,'-q')

# Write to a temp file and use -f rather than -c: PowerShell mangles embedded
# double-quotes (e.g. JSON literals, quoted identifiers) when they pass through
# native-argument encoding on the way to psql.
function Sql([string]$c) {
    $tmp = Join-Path $env:TEMP "riskradar_stmt_$([guid]::NewGuid().ToString('N')).sql"
    Set-Content -Path $tmp -Value $c -Encoding UTF8
    & psql @Common -f $tmp
    $rc = $LASTEXITCODE
    Remove-Item $tmp -ErrorAction SilentlyContinue
    if ($rc -ne 0) { Bad 'SQL failed (see above)'; exit 1 }
}

# The bundled ogr2ogr here has no live "PostgreSQL" (PG) driver, only PGDUMP -
# it wasn't linked against libpq. Dump to SQL and load with psql instead;
# same data, no extra install. Note PGDUMP (like the PG driver) LAUNDERs field
# names to lowercase, so ADM3_EN etc. become adm3_en - queries below use that.
function Load-Shapefile([string]$Shapefile, [string]$Table) {
    $dump = Join-Path $env:TEMP "$Table.sql"
    & ogr2ogr -f PGDUMP $dump $Shapefile `
              -nln $Table -lco GEOMETRY_NAME=geom -lco DROP_TABLE=IF_EXISTS `
              -t_srs EPSG:4326 -nlt MULTIPOLYGON
    if ($LASTEXITCODE -ne 0) { Bad "ogr2ogr failed on $Shapefile"; exit 1 }
    & psql @Common -f $dump
    if ($LASTEXITCODE -ne 0) { Bad "loading $Table failed (see above)"; exit 1 }
    Remove-Item $dump -ErrorAction SilentlyContinue
}

Write-Host '    loading SL_RDSD (330 DS divisions) into staging...'
Load-Shapefile (Join-Path $Shp 'SL_RDSD.shp') 'stg_dsd'

Write-Host '    loading the DS-division register...'
Sql @"
DROP TABLE IF EXISTS stg_register;
CREATE TABLE stg_register (
    province TEXT, district TEXT, ds_code TEXT,
    ds_division TEXT, ds_division_si TEXT, level TEXT, source TEXT);
"@
& psql @Common -c "\copy stg_register FROM '$Reg' WITH (FORMAT csv, HEADER true)"
if ($LASTEXITCODE -ne 0) { Bad 'could not copy dsd_register.csv'; exit 1 }

Write-Host '    merging geometry + register -> ds_division...'
Sql @"
INSERT INTO ds_division (code, name, district_name, province_id, geom, area_km2)
SELECT r.ds_code, r.ds_division, r.district, p.id,
       ST_Multi(ST_MakeValid(s.geom)),
       ST_Area(ST_Transform(s.geom, 5235)) / 1000000.0
  FROM stg_register r
  JOIN province p ON p.name = r.province
  JOIN stg_dsd  s ON s.adm3_en = r.ds_division
ON CONFLICT (code) DO UPDATE
   SET name = EXCLUDED.name, district_name = EXCLUDED.district_name,
       province_id = EXCLUDED.province_id, geom = EXCLUDED.geom,
       area_km2 = EXCLUDED.area_km2;
"@

Sql @"
SELECT 'register rows with no polygon' AS check, count(*) AS n
  FROM stg_register r LEFT JOIN stg_dsd s ON s.adm3_en = r.ds_division
 WHERE s.adm3_en IS NULL
UNION ALL
SELECT 'polygons with no register row', count(*)
  FROM stg_dsd s LEFT JOIN stg_register r ON r.ds_division = s.adm3_en
 WHERE r.ds_division IS NULL;
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
