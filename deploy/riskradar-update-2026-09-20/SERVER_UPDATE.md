# Risk Radar — server update instructions (20 September 2026)

For the hosting admin of **riskradar.geoinfobox.com**.

This is an **update** to the deployment made on 14 September 2026, not a fresh
install. The server is already running: nginx + systemd + uvicorn + PostgreSQL
with PostGIS, as set up by `DEPLOY.md` in the original package.

---

## What is changing, and what is not

| Part | Change |
|---|---|
| **DS-division boundaries** | Replaced. The old file had visible gaps between neighbouring divisions. |
| **Map GeoJSON (frontend)** | Replaced. This is the file the map actually draws — not PostGIS. |
| **Frontend bundle** | Rebuilt (map and import screens changed). |
| **Backend** | 5 Python files changed. |
| **Database schema** | **No change.** Do not re-run the SQL scripts in `database/sql/`. |
| **Database contents** | **Do not restore a dump.** The live database holds real user accounts and imported data. Only the boundary geometry is refreshed, in place. |

> **Important:** do not load a new `riskradar_full.sql`. That would wipe the
> accounts and every workbook imported since 14 September. The boundary update
> is done with a script that only updates geometry.

---

## 0. Before you start

```bash
# take a database backup first — this is the safety net
sudo -u postgres pg_dump -Fc riskradar > ~/riskradar-before-update-$(date +%F).dump

# keep a copy of the current frontend
sudo cp -a /var/www/riskradar/frontend /var/www/riskradar/frontend.bak-$(date +%F)
```

GDAL is needed for the boundary load:

```bash
sudo apt-get update && sudo apt-get install -y gdal-bin
ogr2ogr --version        # should print a version, not "command not found"
```

---

## 1. Database — reload the DS boundaries

Put the supplied `boundary/` folder somewhere readable, e.g. `/opt/riskradar/boundary`.
It contains the shapefiles and the DS-division register CSV.

```bash
cd /opt/riskradar
chmod +x load_boundary_server.sh

SHP=/opt/riskradar/boundary \
REG=/opt/riskradar/boundary/dsd_register.csv \
DB=riskradar DBUSER=riskradar_app \
./load_boundary_server.sh
```

The script backs up the existing geometry into `ds_division_geom_backup`
before writing anything.

**Check the output.** It prints two counts:

```
register rows with no polygon  | 0
polygons with no register row  | 0
```

**Both must be 0.** If either is not 0, stop and report it — do not adjust the
script to make it pass. It means the register and the shapefile disagree, and
loading anyway would leave divisions without boundaries.

Then it prints a summary. Expect **340 divisions, 340 with geometry**.

Rollback, if ever needed:

```sql
UPDATE ds_division d SET geom = b.geom, area_km2 = b.area_km2
  FROM ds_division_geom_backup b WHERE b.code = d.code;
```

---

## 2. Backend — update the code

Only five files changed. Copy them over the existing ones:

```
backend/app/routers/imports.py
backend/app/routers/reference.py
backend/app/routers/vulnerability.py
backend/app/importer/load_template.py
backend/app/importer/template_reader.py
```

```bash
# adjust the destination to wherever the app lives
sudo -u riskradar cp -v backend/app/routers/*.py     /opt/riskradar/app/app/routers/
sudo -u riskradar cp -v backend/app/importer/*.py    /opt/riskradar/app/app/importer/

sudo systemctl restart riskradar-api
sudo systemctl status  riskradar-api --no-pager
curl -s https://riskradar.geoinfobox.com/api/health
```

No new Python packages, so `requirements.txt` does not need re-installing.
No `.env` change.

---

## 3. Frontend — replace the static files

```bash
sudo rm -rf /var/www/riskradar/frontend/*
sudo cp -a frontend/. /var/www/riskradar/frontend/
sudo chown -R www-data:www-data /var/www/riskradar/frontend
```

Make sure the data folder came across — this is the file the map reads:

```bash
ls -lh /var/www/riskradar/frontend/data/ds_divisions.simplified.geojson
```

No nginx config change is needed. No nginx restart is needed (static files are
read per request), but a reload does no harm:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. The map file size — nothing to do, but worth knowing

The boundary GeoJSON is **1.8 MB** (about 600 KB over the wire once nginx
gzips it). That is roughly what the previous deployment shipped, so nothing
about performance changes.

Worth one check after deploying, since this is the biggest asset on the site:

```bash
curl -s -I -H "Accept-Encoding: gzip" \
  https://riskradar.geoinfobox.com/data/ds_divisions.simplified.geojson \
  | grep -i "content-encoding"
```

Expect `content-encoding: gzip`. If it is missing, check that `gzip_types`
includes `application/json` in the active site config — the supplied config
already has it.

---

## 5. Verify

1. Open `https://riskradar.geoinfobox.com/map` — divisions draw with no white
   cracks between them.
2. Refresh directly on `/map` — must not 404 (SPA fallback).
3. Log in; open a division panel; scores still show.
4. Upload one workbook on `/import` — the import still validates and loads.
5. `curl -s https://riskradar.geoinfobox.com/api/health` returns healthy.

---

## If something goes wrong

```bash
# frontend
sudo rm -rf /var/www/riskradar/frontend
sudo mv /var/www/riskradar/frontend.bak-<date> /var/www/riskradar/frontend

# database (full restore, last resort)
sudo -u postgres pg_restore -d riskradar -c ~/riskradar-before-update-<date>.dump
```

Report the exact output rather than working around a failed check.
