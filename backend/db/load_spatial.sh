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
#   1. ds_division  <- SL_RDSD.shp (ADM3, 330 polygons), joined to the register
#      for district + province + official code. Geometry stored in EPSG:4326;
#      area_km2 computed in EPSG:5235 (SLD99) so it comes out in metres, not degrees.
#   2. spatial_layer features for the province and district layers, so the map
#      has admin outlines to draw and the toolbox has something to test against.
set -euo pipefail

DB=${DB:-riskradar}
USER=${USER_DB:-riskradar}
PG="PG:dbname=$DB user=$USER"
SHP=/design/spatial
PSQL="psql -v ON_ERROR_STOP=1 -U $USER -d $DB -q"

echo "  loading SL_RDSD (DS divisions) into staging..."
ogr2ogr -f PostgreSQL "$PG" "$SHP/SL_RDSD.shp" \
        -nln stg_dsd -overwrite -lco GEOMETRY_NAME=geom \
        -t_srs EPSG:4326 -nlt MULTIPOLYGON

echo "  loading the DS-division register (330 rows, district + province)..."
$PSQL <<'SQL'
DROP TABLE IF EXISTS stg_register;
CREATE TABLE stg_register (
    province TEXT, district TEXT, ds_code TEXT,
    ds_division TEXT, ds_division_si TEXT, level TEXT, source TEXT);
SQL
$PSQL -c "\copy stg_register FROM '/design/ingestion/dsd_register.csv' WITH (FORMAT csv, HEADER true)"

echo "  merging geometry + register -> ds_division..."
$PSQL <<'SQL'
INSERT INTO ds_division (code, name, district_name, province_id, geom, area_km2)
SELECT r.ds_code,
       r.ds_division,
       r.district,
       p.id,
       ST_Multi(ST_MakeValid(s.geom)),
       ST_Area(ST_Transform(s.geom, 5235)) / 1000000.0   -- SLD99, so km2 not deg2
  FROM stg_register r
  JOIN province p  ON p.name = r.province
  JOIN stg_dsd  s  ON s."ADM3_EN" = r.ds_division
ON CONFLICT (code) DO UPDATE
   SET name = EXCLUDED.name, district_name = EXCLUDED.district_name,
       province_id = EXCLUDED.province_id, geom = EXCLUDED.geom,
       area_km2 = EXCLUDED.area_km2;

-- anything in the register that found no polygon, or vice versa
SELECT 'register rows with no matching polygon' AS check, count(*) AS n
  FROM stg_register r LEFT JOIN stg_dsd s ON s."ADM3_EN" = r.ds_division
 WHERE s."ADM3_EN" IS NULL
UNION ALL
SELECT 'polygons with no register row', count(*)
  FROM stg_dsd s LEFT JOIN stg_register r ON r.ds_division = s."ADM3_EN"
 WHERE r.ds_division IS NULL;
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
       s."ADM1_EN", ST_MakeValid(s.geom), jsonb_build_object('name', s."ADM1_EN")
  FROM stg_prov s
ON CONFLICT (layer_id, feature_code) DO NOTHING;

INSERT INTO spatial_feature (layer_id, feature_code, geom, attributes)
SELECT (SELECT id FROM spatial_layer WHERE code = 'ADMIN_DISTRICT'),
       s."ADM2_EN", ST_MakeValid(s.geom), jsonb_build_object('name', s."ADM2_EN")
  FROM stg_dist s
ON CONFLICT (layer_id, feature_code) DO NOTHING;

DROP TABLE IF EXISTS stg_dsd, stg_prov, stg_dist, stg_register;
SQL

$PSQL -c "SELECT count(*) AS ds_divisions, round(sum(area_km2)::numeric,1) AS total_km2 FROM ds_division;"
echo "  done."
