-- Extensions must exist before schema.sql runs (it uses geometry and vector types).
--
-- postgis/postgis:16-3.4 ships PostGIS but NOT pgvector. If the vector line
-- fails with "extension \"vector\" is not available", install it into the
-- running container once:
--
--   docker compose exec -u root db bash -c \
--     "apt-get update && apt-get install -y postgresql-16-pgvector"
--   docker compose restart db
--
-- then re-run ./db/apply.sh.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- fuzzy matching for the ingestion reconciliation wizard (D3 rev 5)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT extname, extversion FROM pg_extension
 WHERE extname IN ('postgis', 'vector', 'pg_trgm')
 ORDER BY extname;
