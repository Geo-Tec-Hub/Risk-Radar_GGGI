#!/usr/bin/env bash
# Risk Radar — reload DS-division boundaries on the Linux server.
#
# Use this INSTEAD of restoring a new database dump. The server's database
# holds live user accounts and imported data; this script only refreshes the
# boundary geometry and the province/district outline layers. It writes with
# INSERT ... ON CONFLICT DO UPDATE, so nothing is deleted.
#
# Adapted from backend/db/load_spatial.sh (written for a docker db container)
# for a native PostgreSQL install as set up by DEPLOY.md.
#
# Requirements on the server:
#   gdal-bin  (provides ogr2ogr)   ->  sudo apt-get install -y gdal-bin
#   postgis extension already installed in the database
#
# Usage:
#   chmod +x load_boundary_server.sh
#   SHP=/opt/riskradar/boundary REG=/opt/riskradar/boundary/dsd_register.csv \
#     DB=riskradar DBUSER=riskradar_app ./load_boundary_server.sh
#
set -euo pipefail

DB=${DB:-riskradar}
DBUSER=${DBUSER:-riskradar_app}
DBHOST=${DBHOST:-localhost}
SHP=${SHP:-./boundary}
REG=${REG:-./boundary/dsd_register.csv}

PG="PG:dbname=$DB user=$DBUSER host=$DBHOST"
PSQL="psql -v ON_ERROR_STOP=1 -h $DBHOST -U $DBUSER -d $DB -q"

for f in DS_Boundary.shp SL_PD.shp SL_DSD.shp; do
  [[ -f "$SHP/$f" ]] || { echo "missing $SHP/$f" >&2; exit 1; }
done
[[ -f "$REG" ]] || { echo "missing register CSV: $REG" >&2; exit 1; }

echo "==> backing up current geometry (ds_division_geom_backup)"
$PSQL <<'SQL'
DROP TABLE IF EXISTS ds_division_geom_backup;
CREATE TABLE ds_division_geom_backup AS
  SELECT code, geom, area_km2 FROM ds_division;
SQL

echo "==> loading DS_Boundary polygons into staging (EPSG:4326)"
ogr2ogr -f PostgreSQL "$PG" "$SHP/DS_Boundary.shp" \
        -nln stg_dsd -overwrite -lco GEOMETRY_NAME=geom \
        -s_srs EPSG:4326 -t_srs EPSG:4326 -nlt MULTIPOLYGON

echo "==> loading the DS-division register (340 rows)"
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

echo "==> merging geometry + register into ds_division"
# Joined on the official code (new_ds_cod), never on name: nine divisions were
# renamed in the 2025 revision and a name join would leave them without a
# polygon. LEFT JOIN so a register row with no polygon still loads, as
# boundary_pending, rather than being silently dropped.
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
SQL

echo "==> CHECK — both numbers below must be 0"
$PSQL -c "
SELECT 'register rows with no polygon' AS check, count(*) AS n
  FROM stg_register r LEFT JOIN stg_dsd s ON s.new_ds_cod = r.ds_code
 WHERE s.new_ds_cod IS NULL
UNION ALL
SELECT 'polygons with no register row', count(*)
  FROM stg_dsd s LEFT JOIN stg_register r ON r.ds_code = s.new_ds_cod
 WHERE r.ds_code IS NULL;"

echo "==> refreshing province + district outline layers"
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

$PSQL -c "SELECT count(*) AS ds_divisions,
                 count(geom) AS with_geometry,
                 round(sum(area_km2)::numeric,1) AS total_km2
            FROM ds_division;"

echo "==> done."
echo "    Expected: 340 divisions, 340 with geometry, total ~65,600 km2."
echo "    Rollback if needed:"
echo "      UPDATE ds_division d SET geom = b.geom, area_km2 = b.area_km2"
echo "        FROM ds_division_geom_backup b WHERE b.code = d.code;"
