# Risk Radar — deployment package for riskradar.geoinfobox.com

DS-Division Climate Vulnerability Assessment platform for Sri Lanka.
Built 14 September 2026.

Angular frontend (pre-built) · FastAPI backend · PostgreSQL + PostGIS.

---

## What is in this folder

```
frontend/   the built Angular app — static files, serve as-is, do not rebuild
backend/    FastAPI source + requirements.txt + .env (ready to use) + env.example
database/   the full database as SQL, plus schema scripts in apply order
server/     nginx site config and the systemd unit
```

## Requirements on the server

- **Python 3.12 or newer** (developed on 3.14)
- **PostgreSQL 15 or newer, with PostGIS** — PostGIS is required, not optional.
  The database was exported from PostgreSQL 17.11, but as **plain SQL**, which
  is far more forgiving about version than a binary dump. 17.x is the safest
  match; 15 and 16 should load it without trouble.
- **nginx**, and a TLS certificate for `riskradar.geoinfobox.com`
- pgvector is **not** required (the one feature needing it is not in this release)

## One thing to understand before starting

The frontend calls the API at the **relative** path `/api`. No API hostname is
compiled into the bundle. So the app and the API must be served from **the same
origin** — `https://riskradar.geoinfobox.com` for both, with nginx routing
`/api/` to the backend and everything else to the static files. The supplied
nginx config does exactly this.

Putting the API on a different host or port means rebuilding the frontend, and
means the session cookie stops being same-origin. Don't.

---

## 1. Database

Create the role and database:

```bash
sudo -u postgres createuser --pwprompt riskradar_app
sudo -u postgres createdb -O riskradar_app riskradar
sudo -u postgres psql -d riskradar -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

Load the database from the supplied SQL file:

```bash
psql -v ON_ERROR_STOP=1 -h localhost -U postgres -d riskradar \
     -f database/dump/riskradar_full.sql
```

This is a **plain SQL** dump, so it goes in with `psql` — not `pg_restore`,
which only reads the binary formats and will reject this file.

It is about 75 MB and takes a few minutes. `ON_ERROR_STOP=1` matters: without
it psql keeps going after a failure and you end up with a half-loaded database
that looks like it worked.

The file was exported with `--no-owner --no-privileges`, so everything lands
owned by whoever runs the restore. Grant the application role afterwards:

```bash
psql -h localhost -U postgres -d riskradar -c \
  "GRANT ALL ON ALL TABLES IN SCHEMA public TO riskradar_app;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO riskradar_app;
   GRANT USAGE ON SCHEMA public TO riskradar_app;"
```

`database/sql/` holds the same schema as 15 numbered scripts, with
`apply_all.sh` to run them in order. **You do not need them** — the SQL file
above already contains the whole schema, and running both would only produce
"already exists" errors. They are there as reference, and as the way to build
an empty database if one is ever wanted. An empty one means an empty site: no
provinces, sectors, hazards or DS divisions, and nothing importable until
reference data is loaded.

## 2. Backend

```bash
sudo useradd -r -m -d /opt/riskradar -s /usr/sbin/nologin riskradar
sudo mkdir -p /opt/riskradar/backend
sudo cp -R backend/. /opt/riskradar/backend/
sudo python3 -m venv /opt/riskradar/venv
sudo /opt/riskradar/venv/bin/pip install -r /opt/riskradar/backend/requirements.txt
sudo chown -R riskradar:riskradar /opt/riskradar
```

**`backend/.env` is included and ready** — it already carries the production
host, database, user, `CORS_ORIGIN` and session settings. Copy it to
`/opt/riskradar/backend/.env` and it works as-is.

**The database password is NOT in it, and putting it there will not work.**
This is not caution, it is how the app reads the file: pydantic-settings parses
`.env` directly and does not export into the process environment, and
`app/config.py` has no password field at all. A `PGPASSWORD` line in `.env` is
read by nobody — asyncpg never sees it, and the result is an authentication
failure with nothing in the logs to explain it.

Put it in a pgpass file, which psql and asyncpg both read on their own:

```bash
sudo -u riskradar sh -c 'echo "localhost:5432:riskradar:riskradar_app:THEPASSWORD" > /opt/riskradar/.pgpass'
sudo chmod 600 /opt/riskradar/.pgpass
```

That keeps it out of the unit file, the environment and `ps` output. Everything
else the app needs is already set in the systemd unit.

The supplied systemd unit sets the same values as `Environment=` lines, so the
service runs correctly whether or not you use the `.env` file. Where both are
present they agree. `backend/env.example` is the annotated reference copy.

The two values that MUST differ from development, and already do:

```
CORS_ORIGIN=https://riskradar.geoinfobox.com
SESSION_COOKIE_SECURE=true
```

`SESSION_COOKIE_SECURE=false` on a public HTTPS site would send the session
cookie over plain HTTP too.

## 3. The service

```bash
sudo cp server/systemd/riskradar-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now riskradar-api
sudo systemctl status riskradar-api
```

It binds `127.0.0.1:8000` only — nginx is the sole way in.

## 4. Frontend and nginx

```bash
sudo mkdir -p /var/www/riskradar/frontend
sudo cp -R frontend/. /var/www/riskradar/frontend/
sudo chown -R www-data:www-data /var/www/riskradar

sudo cp server/nginx/riskradar.geoinfobox.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/riskradar.geoinfobox.com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Certificate, if there isn't one yet:

```bash
sudo certbot --nginx -d riskradar.geoinfobox.com
```

## 5. Check it

```bash
curl -s https://riskradar.geoinfobox.com/api/health
```

Expect `{"status":"ok","database":"ok",...}`. `"database":"ok"` is the part that
proves the pgpass file and the role are right.

Then open `https://riskradar.geoinfobox.com/` — the map should load. Sign-in is
needed for the import and weights screens; the map is public.

---

## Notes the admin will want

**Map tiles come from OpenStreetMap** (`tile.openstreetmap.org`), fetched by the
visitor's browser, not the server. No outbound access is needed from the server
for this, but the site will look blank-grey to anyone whose network blocks OSM.

**Uploads.** `client_max_body_size 25m` in the nginx config is deliberate: the
API itself refuses anything over 20 MB and explains why, whereas nginx's 1 MB
default would reject a normal workbook with a bare 413. Import timeouts are
raised to 300s for the same reason — a province-wide import parses every sheet.

**Caching.** Filenames are content-hashed, so JS/CSS are cached for a year and
`index.html` is never cached. If you ever deploy by overwriting files, that
combination is what makes the new build actually reach people.

**Logs.** `journalctl -u riskradar-api -f` for the API;
`/var/log/nginx/riskradar.{access,error}.log` for the web tier.

**Updating later.** Frontend: replace `/var/www/riskradar/frontend`. Backend:
replace `/opt/riskradar/backend`, then `systemctl restart riskradar-api`. New
schema changes arrive as further numbered files for `database/sql/`.
