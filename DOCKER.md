# Running Risk Radar in Docker

Three containers: `db` (PostgreSQL + PostGIS), `api` (FastAPI), `web`
(the website, served by nginx, which passes `/api` to the API).

## First time

1. Open **Docker Desktop** and wait until it says it is running.
2. In Terminal, from the project folder:

   ```
   cd ~/Projects/Risk-Radar_GGGI
   docker compose up -d --build
   ```

   The first build takes several minutes (it downloads images and builds
   the website). Later starts take seconds.

3. Copy your existing data into the Docker database (once). This exports the
   database you already use on this Mac and loads it into Docker:

   ```
   /opt/homebrew/opt/postgresql@17/bin/pg_dump -Fc riskradar > ~/riskradar-local.dump
   docker compose exec -T db pg_restore -U riskradar -d riskradar --no-owner --no-acl < ~/riskradar-local.dump
   docker compose restart api
   ```

   A few "already exists" messages about extensions are normal.
   Use the PostgreSQL 17 `pg_dump` (path above): the plain `pg_dump` on PATH
   is version 15 and refuses to dump the version-17 server.

4. Open **http://localhost:8080** and sign in with your usual Risk Radar account.

## Every day

```
docker compose up -d      # start
docker compose down       # stop (your data is kept)
```

After code changes: `docker compose up -d --build`.

## Useful

- API log: `docker compose logs -f api`
- Database from your Mac: host `localhost`, port **5433**, user `riskradar`,
  password `riskradar_dev_only`, database `riskradar`
  (e.g. `psql -h localhost -p 5433 -U riskradar riskradar`).
- New database addition (an `*_addendum.sql` file):
  `docker compose exec -T db psql -U riskradar -d riskradar < design/database/<file>.sql`
- Start completely fresh: `docker compose down -v` (deletes the Docker database).

Your Homebrew PostgreSQL on port 5432 is untouched; both can run side by side.

## The live server (riskradar.geoinfobox.com)

Runs the same containers on `geoinfobox.ddns.net` (Ubuntu, shared with the LMS
sites), under user `riskradar` in `/srv/riskradar`:

- `app/` -- a git checkout of `master`. **Deploy-only; never edit it there.**
- `riskradar.env` -- the database password (not in git).
- `backups/` -- a database dump taken before every update (newest 30 kept).
- `docker-compose.prod.yml` adds the server differences: no database port,
  website on `127.0.0.1:8180` only, secure cookie. Host nginx
  (`server/nginx-riskradar.conf`) does HTTPS and forwards to it.

**Updating it: push to `master`.** GitHub Actions (`.github/workflows/deploy.yml`)
logs in and runs `server/deploy.sh`, which backs up the database, pulls,
rebuilds, waits for `/api/health`, and rolls back by itself if the new version
does not come up healthy. Watch it under the repository's **Actions** tab.

**Database changes are not applied automatically.** If a push changes
`design/database/*.sql` or `backend/db/*.sql`, the deploy stops *before
changing anything* and the Actions run fails, listing the files. Then:

```
ssh admin@geoinfobox.ddns.net
sudo -iu riskradar
app/server/deploy.sh sql design/database/<the_addendum>.sql
```

and on GitHub: Actions -> Deploy to server -> Run workflow, tick
"schema applied".

Other commands (as `riskradar` on the server): `app/server/deploy.sh status`,
`app/server/deploy.sh backup`.
