#!/usr/bin/env bash
# Risk Radar — server update, 7 October 2026.
#
# Run from inside this unpacked folder on the server:
#     chmod +x update.sh
#     ./update.sh check     # looks around, changes nothing
#     ./update.sh apply     # backs up, then updates
#
# Defaults can be overridden, e.g.:
#     APP_ROOT=/var/www/sites/geoinfobox.com/riskradar_ai SERVICE=riskradar-api ./update.sh apply
#
# What it does in `apply`:
#   1. backs up the database, the backend code and the frontend files
#   2. adds three new tables/columns (safe to re-run; nothing is deleted)
#   3. replaces the backend `app/` folder and restarts the API service
#   4. replaces the frontend static files
#   5. checks /api/health
set -euo pipefail

MODE=${1:-check}
HERE=$(cd "$(dirname "$0")" && pwd)
APP_ROOT=${APP_ROOT:-/var/www/sites/geoinfobox.com/riskradar_ai}
DB=${DB:-riskradar}
DBUSER=${DBUSER:-riskradar_app}
STAMP=$(date +%F-%H%M)

say() { printf '\n==> %s\n' "$*"; }

# ---- find the backend (the folder that holds app/main.py) -------------------
BACKEND_DIR=${BACKEND_DIR:-$(dirname "$(dirname "$(sudo find "$APP_ROOT" /opt/riskradar -maxdepth 4 -path '*/app/main.py' 2>/dev/null | grep -v '/venv/' | head -1)")" 2>/dev/null || true)}
# ---- find the frontend (the folder that holds index.html + data/) -----------
FRONT_DIR=${FRONT_DIR:-$(dirname "$(sudo find "$APP_ROOT" /var/www/riskradar -maxdepth 4 -name index.html -path '*' 2>/dev/null | while read -r f; do [ -d "$(dirname "$f")/data" ] && echo "$f"; done | head -1)" 2>/dev/null || true)}
# ---- find the API service -----------------------------------------------------
SERVICE=${SERVICE:-$(systemctl list-units --type=service --all --no-legend 2>/dev/null | awk '{print $1}' | grep -i -m1 'riskradar' || true)}

say "What I found"
echo "  APP_ROOT    = $APP_ROOT"
echo "  BACKEND_DIR = ${BACKEND_DIR:-NOT FOUND}   (must contain app/main.py)"
echo "  FRONT_DIR   = ${FRONT_DIR:-NOT FOUND}   (must contain index.html and data/)"
echo "  SERVICE     = ${SERVICE:-NOT FOUND}"
echo "  DATABASE    = $DB (app user $DBUSER)"

if [[ -z "${BACKEND_DIR:-}" || ! -f "$BACKEND_DIR/app/main.py" ]]; then
  echo "!! backend not found. Re-run with BACKEND_DIR=/path/to/folder/containing/app"; exit 1; fi
if [[ -z "${FRONT_DIR:-}" || ! -f "$FRONT_DIR/index.html" ]]; then
  echo "!! frontend not found. Re-run with FRONT_DIR=/path/to/folder/containing/index.html"; exit 1; fi
if [[ -z "${SERVICE:-}" ]]; then
  echo "!! API service not found. Re-run with SERVICE=<name>  (see: systemctl list-units | grep -i api)"; exit 1; fi
sudo -u postgres psql -d "$DB" -Atc "select 'database ok: ' || count(*) || ' divisions' from ds_division" \
  || { echo "!! cannot reach database $DB as postgres. Re-run with DB=<name>"; exit 1; }

if [[ "$MODE" != "apply" ]]; then
  echo; echo "Check only — nothing changed. If the paths above are right, run:  ./update.sh apply"
  exit 0
fi

say "1/5  Backups (in ~/riskradar-backup-$STAMP)"
B=~/riskradar-backup-$STAMP; mkdir -p "$B"
sudo -u postgres pg_dump -Fc "$DB" > "$B/database.dump"
sudo cp -a "$BACKEND_DIR/app" "$B/backend-app"
sudo cp -a "$FRONT_DIR" "$B/frontend"
ls -lh "$B"

say "2/5  Database: three additions (safe to re-run)"
for f in schema_unit_history_addendum.sql schema_track_index_entry_addendum.sql schema_param_source_addendum.sql; do
  echo "  - $f"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$HERE/database/$f"
done
# The API connects as $DBUSER, so it must be able to use the new tables.
sudo -u postgres psql -v ON_ERROR_STOP=1 -q -d "$DB" <<SQL
GRANT SELECT, INSERT, UPDATE, DELETE ON indicator_unit_change, track_index_entry,
      indicator_province_source, indicator_meta_change TO $DBUSER;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $DBUSER;
SQL

say "3/5  Backend code"
OWNER=$(stat -c '%U:%G' "$BACKEND_DIR/app")
sudo rm -rf "$BACKEND_DIR/app"
sudo cp -a "$HERE/backend/app" "$BACKEND_DIR/app"
sudo chown -R "$OWNER" "$BACKEND_DIR/app"
sudo systemctl restart "$SERVICE"
sleep 3
sudo systemctl --no-pager --lines=5 status "$SERVICE" || true

say "4/5  Frontend files"
FOWNER=$(stat -c '%U:%G' "$FRONT_DIR")
sudo find "$FRONT_DIR" -mindepth 1 -delete
sudo cp -a "$HERE/frontend/." "$FRONT_DIR/"
sudo chown -R "$FOWNER" "$FRONT_DIR"
ls -lh "$FRONT_DIR/data/ds_divisions.simplified.geojson"

say "5/5  Health check"
curl -s https://riskradar.geoinfobox.com/api/health || true
echo
echo "Done. Backups are in $B"
echo "To roll back:  sudo rm -rf $BACKEND_DIR/app && sudo cp -a $B/backend-app $BACKEND_DIR/app && sudo systemctl restart $SERVICE"
echo "               sudo find $FRONT_DIR -mindepth 1 -delete && sudo cp -a $B/frontend/. $FRONT_DIR/"
