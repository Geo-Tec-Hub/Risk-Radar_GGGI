#!/usr/bin/env bash
# Load the official boundary shapefiles into Postgres.
#
# Runs INSIDE the db container (design/ is mounted at /design):
#   docker compose exec -T db bash /db/load_spatial.sh
#
# Needs GDAL. If ogr2ogr is missing:
#   docker compose exec -u root db bash -c "apt-get update && apt-get install -y gdal-bin"
#
# What it does
#   1. ds_division <- every dsd_register.csv row LEFT JOINed to DS_Boundary.shp's
#      polygons (ADM3) BY OFFICIAL CODE (new_ds_cod), not by name -- nine
#      divisions were renamed in the 2025 revision and a name join would load
#      them boundary-pending with a perfectly good polygon sitting unused.
#      A register row with no matching polygon still loads (geom/area_km2
#      NULL, reading as boundary_pending), it is not silently dropped.
#      Geometry stored in EPSG:4326 (source is EPSG:5234, Kandawala / Sri
#      Lanka Grid -- stated explicitly, since DS_Boundary.shp's .prj carries
#      no EPSG authority code). area_km2 computed in EPSG:5235 (SLD99) so it
#      comes out in km2, not degrees.
#   2. spatial_layer features for the province and district layers, so the map
#      has admin outlines to draw and the toolbox has something to test against.
#
# Ported from load_spatial.ps1 (the native-Windows route) -- see that file for
# the fuller narrative on why the join is by code and why the source SRS must
# be explicit. Unlike the bundled Windows ogr2ogr, the one in this image links
# against libpq, so this loads straight into Postgres (-f PostgreSQL) rather
# than via a PGDUMP intermediate file.
set -euo pipefail

DB=${DB:-riskradar}
USER=${USER_DB:-riskradar}
PG="PG:dbname=$DB user=$USER"
SHP=/design/spatial
REG=/design/ingestion/dsd_register.csv
PSQL="psql -v ON_ERROR_STOP=1 -U $USER -d $DB -q"

for f in DS_Boundary.shp SL_PD.shp SL_DSD.shp; do
  if [[ ! -f "$SHP/$f" ]]; then
    echo "missing $SHP/$f" >&2
    exit 1
  fi
done

echo "  loading DS_Boundary polygons into staging (EPSG:5234 -> 4326)..."
ogr2ogr -f PostgreSQL "$PG" "$SHP/DS_Boundary.shp" \
        -nln stg_dsd -overwrite -lco GEOMETRY_NAME=geom \
        -s_srs EPSG:5234 -t_srs EPSG:4326 -nlt MULTIPOLYGON

echo "  loading the DS-division register (340 rows, district + province)..."
$PSQL <<'SQL'
DROP TABLE IF EXISTS stg_register;
CREATE TABLE stg_register (
    province TEXT, district TEXT, ds_code TEXT,
    ds_division TEXT, ds_division_si TEXT,
    ds_code_official_num TEXT, ds_code_legacy TEXT, split_from TEXT,
    lon DOUBLE PRECISION, lat DOUBLE PRECISION,
    level TEXT, source TEXT);
SQL
$PSQL -c "\copy stg_register FROM '$REG' WITH (FORMAT csv, HEADER true)"

echo "  merging geometry + register -> ds_division..."
# LEFT JOIN, not JOIN: a register row with no matching polygon (a division
# registered before its boundary is surveyed) must still be INSERTed, with
# geom/area_km2 NULL, so it reads as boundary_pending. An inner join would
# silently drop it instead.
$PSQL <<'SQL'
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

-- On the current DS_Boundary.shp (340 divisions) both of these should be
-- ZERO -- the register and the shapefile are the same 340 objects joined on
-- a stable code. If either is non-zero, the register and the shapefile have
-- diverged: do NOT relax this check to make it pass.
SELECT 'register rows with no polygon' AS check, count(*) AS n
  FROM stg_register r LEFT JOIN stg_dsd s ON s.new_ds_cod = r.ds_code
 WHERE s.new_ds_cod IS NULL
UNION ALL
SELECT 'polygons with no register row', count(*)
  FROM stg_dsd s LEFT JOIN stg_register r ON r.ds_code = s.new_ds_cod
 WHERE r.ds_code IS NULL;
SQL

echo "  loading province + district outlines as spatial layers..."
ogr2ogr -f PostgreSQL "$PG" "$SHP/SL_PD.shp"  -nln stg_prov -overwrite \
        -lco GEOMETRY_NAME=geom -t_srs EPSG:4326 -nlt MULTIPOLYGON
ogr2ogr -f PostgreSQL "$PG" "$SHP/SL_DSD.shp" -nln stg_dist -overwrite \
        -lco GEOMETRY_NAME=geom -t_srs EPSG:4326 -nlt MULTIPOLYGON

$PSQL <<'SQL'
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
SQL

$PSQL -c "SELECT count(*) AS ds_divisions, round(sum(area_km2)::numeric,1) AS total_km2 FROM ds_division;"
echo "  done."
