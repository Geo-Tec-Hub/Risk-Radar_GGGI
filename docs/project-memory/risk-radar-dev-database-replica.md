---
name: risk-radar-dev-database-replica
description: How to stand up a working Risk Radar database in a sandbox, so backend work is run and tested rather than reasoned about
type: project
---

**Build a replica before writing backend code.** Three build failures on
14–15 Aug 2026 (a UTF-8 BOM, WIN1252 client encoding, a wrong column name) all
reached Milinda because SQL and PowerShell were reasoned about rather than run.
None was visible by reading. A replica costs a few minutes and removes the class.

## Recipe (Linux sandbox)

```
apt-get install -y postgresql postgresql-16-postgis-3     # apt-get update first
initdb -D /tmp/pgdata -U postgres
pg_ctl -D /tmp/pgdata -o '-k /tmp/pgrun -p 5433 -c listen_addresses=' start
createdb riskradar; CREATE EXTENSION postgis; CREATE EXTENSION pg_trgm;
```

Apply in this order (matches `apply_native.ps1`):

1. `design/database/schema.sql`
2. `design/database/schema_weights_addendum.sql`
3. `design/database/spatial-model.sql`
4. `design/ingestion/seed_all.sql`
5. `schema_signed_values_addendum.sql`   ← added 4 Sep; must follow the seed
6. `schema_consensus_addendum.sql`
7. `schema_profile_consensus_save_addendum.sql`
8. `schema_auth_addendum.sql`
9. `schema_session_addendum.sql`
10. `schema_boundary_pending_addendum.sql`
11. `schema_official_dscode_addendum.sql`

Then load the divisions. **Use FULL-RESOLUTION geometry from `DS_Boundary.shp`,
reprojected 5234 → 4326** — generate one INSERT per division with
`ST_GeomFromGeoJSON`. Roughly 54 MB of SQL; loads in seconds.

**Do NOT load `ds_divisions.simplified.geojson` into the replica.** It is a
display asset simplified at 0.004°, and that simplification creates ~819
overlapping pairs, so the smoke test fails for a reason that does not exist in
the real database. Verified: full resolution gives 2 known overlaps, simplified
gives 819.

## What a correct replica reports

```
340 divisions · 340 surveyed · 0 boundary-pending
243 profiles · 3,664 memberships (1,783 awaiting a weight)
national area 66,037 km2
2 known overlaps, largest 2.110 km2
ALL SMOKE TESTS PASSED
```

The 2.110 km² is a useful cross-check: an independent shapely measurement on
EPSG:5234 and PostGIS `ST_Transform(...,5235)` agree to three decimals, so both
the reprojection and the area maths are confirmed by two code paths.

## Notes

- No PostGIS in a bare `postgresql` install — `postgresql-16-postgis-3` is a
  separate package, and `apt-get update` is needed first.
- `pg_ctl`/`initdb`/`psql` are not on PATH; use `/usr/lib/postgresql/*/bin`.
- Backgrounded processes do not survive a shell call in some sandboxes, and
  each call may be time-capped — chunk long jobs.
- The sandbox cannot reach the user's own PostgreSQL on localhost. The replica
  is the only way to execute anything against a real Risk Radar database there.

Related: [[risk-radar-331st-division]], [[risk-radar-srs-v21]].
