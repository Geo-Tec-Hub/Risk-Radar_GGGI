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
   pg_dump -Fc riskradar > ~/riskradar-local.dump
   docker compose exec -T db pg_restore -U riskradar -d riskradar --no-owner --no-acl < ~/riskradar-local.dump
   docker compose restart api
   ```

   A few "already exists" messages about extensions are normal.

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
