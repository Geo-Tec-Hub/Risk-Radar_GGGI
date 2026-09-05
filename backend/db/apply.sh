#!/usr/bin/env bash
# Build the Risk Radar database from the design artefacts.
#
#   ./db/apply.sh              apply everything
#   ./db/apply.sh --reset      drop and recreate the schema first
#
# Stops at the FIRST error and tells you which file and line. Every file is
# wrapped in a transaction by psql, so a failure leaves nothing half-applied.
set -euo pipefail

CONTAINER=${CONTAINER:-riskradar-db}
DB=${DB:-riskradar}
USER=${USER_DB:-riskradar}

# Prefer the compose service; fall back to the container name if compose isn't
# being run from this directory. -v ON_ERROR_STOP=1 makes psql abort on the
# first error instead of ploughing on and half-applying a file.
if docker compose ps --services >/dev/null 2>&1; then
  PSQL=(docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$USER" -d "$DB" -q)
  EXEC=(docker compose exec -T db)
else
  PSQL=(docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U "$USER" -d "$DB" -q)
  EXEC=(docker exec -i "$CONTAINER")
fi

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()  { printf '    \033[0;32mok\033[0m  %s\n' "$*"; }

if [[ "${1:-}" == "--reset" ]]; then
  say "Dropping and recreating schema public"
  "${PSQL[@]}" -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
  ok "schema reset"
fi

apply() {
  local label="$1" path="$2"
  say "$label"
  if ! "${PSQL[@]}" -f "$path"; then
    printf '\n\033[0;31mFAILED: %s (%s)\033[0m\n' "$label" "$path" >&2
    printf 'Nothing from this file was applied. Fix it and re-run.\n' >&2
    exit 1
  fi
  ok "$path"
}

apply "0/13  Extensions (postgis, vector, pg_trgm)"           /db/00_extensions.sql
apply "1/13  Base schema"                                     /design/database/schema.sql
apply "2/13  Addendum: imports, weights, period rules"        /design/database/schema_weights_addendum.sql
apply "3/13  D8: spatial layers + analysis toolbox"           /design/database/spatial-model.sql
apply "3b    Agent RAG layer (pgvector)"                      /design/database/schema_agent_pgvector.sql
apply "4/13  Seed: reference data, catalog, 243 profiles"     /design/ingestion/seed_all.sql

# Must run AFTER the seed, which creates the catalogue rows it marks -- see
# the matching note in apply_native.ps1.
apply "4b    Addendum: signed (change/trend) indicator values" /design/database/schema_signed_values_addendum.sql

# The 2026-08-09/10/11 addenda run AFTER the seed on purpose: the consensus
# addendum's pre-flight check (no two active profile versions share a scope)
# is a no-op against an empty table, which is the opposite of the point.
apply "5/13  Addendum: consensus, publication, index scope"    /design/database/schema_consensus_addendum.sql
apply "5b    Addendum: save_profile_weights carries consensus" /design/database/schema_profile_consensus_save_addendum.sql
apply "5c    Addendum: save_profile_weights completeness pre-flight" /design/database/schema_weights_save_completeness_addendum.sql

apply "6/13  Addendum: registration, approval, province scope" /design/database/schema_auth_addendum.sql

# Depends on app_user (6/13): the revocation trigger fires on app_user.status
# transitions, so auth must exist first.
apply "7/13  Addendum: server-side sessions (T2b, Stage 9.6)"  /design/database/schema_session_addendum.sql

# Must run BEFORE the DS-division load below: it drops ds_division.geom's NOT
# NULL constraint, which the Kalmunai split's boundary-pending rows require.
apply "8/13  Addendum: boundary-pending divisions (the Kalmunai split)" /design/database/schema_boundary_pending_addendum.sql

# Depends on app_user (6/13) and on sector/subsector from the seed (4/13).
apply "8b    Addendum: per-sector write scope"                 /design/database/schema_write_scope_addendum.sql

# Must run BEFORE the DS-division load below, because it adds
# ds_division.legacy_code.
apply "8c    Addendum: official DS codes + the 2025 boundary revision" /design/database/schema_official_dscode_addendum.sql

say "9/13  DS divisions + spatial layers"
if "${EXEC[@]}" bash -c 'command -v ogr2ogr >/dev/null'; then
  "${EXEC[@]}" bash /db/load_spatial.sh
else
  printf '    \033[0;33mskipped\033[0m  GDAL not in the image.\n'
  printf '    Install once:  docker compose exec -u root db bash -c "apt-get update && apt-get install -y gdal-bin"\n'
  printf '    then:          docker compose exec -T db bash /db/load_spatial.sh\n'
fi

say "Summary"
"${PSQL[@]}" -c "
SELECT 'provinces'   AS entity, count(*) FROM province
UNION ALL SELECT 'hazard types',        count(*) FROM hazard_type
UNION ALL SELECT 'sectors',             count(*) FROM sector
UNION ALL SELECT 'subsectors',          count(*) FROM subsector
UNION ALL SELECT 'ds divisions',        count(*) FROM ds_division
UNION ALL SELECT 'indicator catalog',   count(*) FROM indicator_catalog
UNION ALL SELECT 'aliases',             count(*) FROM indicator_alias
UNION ALL SELECT 'profiles',            count(*) FROM vulnerability_profile
UNION ALL SELECT 'profile membership',  count(*) FROM profile_indicator
UNION ALL SELECT '  ... with a weight', count(*) FROM profile_indicator WHERE weight_pct IS NOT NULL
UNION ALL SELECT '  ... awaiting one',  count(*) FROM profile_indicator WHERE weight_pct IS NULL
UNION ALL SELECT 'spatial layers',      count(*) FROM spatial_layer
UNION ALL SELECT 'toolbox operations',  count(*) FROM spatial_operation;"

printf '\n\033[1;32mDatabase built.\033[0m  Next: ./db/smoke_test.sh\n'
