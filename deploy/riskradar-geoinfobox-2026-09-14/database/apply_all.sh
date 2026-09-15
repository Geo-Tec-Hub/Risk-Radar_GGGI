#!/usr/bin/env bash
# Build the Risk Radar schema from scratch, in dependency order.
#
# ONLY NEEDED IF THERE IS NO DUMP. If dump/riskradar.dump is present, restore
# that instead (see DEPLOY.md) -- it already contains this schema plus the data.
# Running both is wrong: the restore recreates everything these scripts create.
#
#   ./apply_all.sh riskradar
set -euo pipefail
DB="${1:-riskradar}"

psql -v ON_ERROR_STOP=1 -d "$DB" -c "CREATE EXTENSION IF NOT EXISTS postgis;"

for f in sql/[0-9][0-9]_*.sql; do
    case "$f" in
        # Needs pgvector, and nothing before Phase 3 uses it. Skipped by
        # default so a server without the extension still builds cleanly.
        *_schema_agent_pgvector.sql)
            echo "SKIP  $f  (optional, needs pgvector -- see DEPLOY.md)"; continue ;;
    esac
    echo "APPLY $f"
    psql -v ON_ERROR_STOP=1 -d "$DB" -f "$f"
done
echo "Schema built. The database is EMPTY of reference data -- no provinces,"
echo "sectors, hazards or DS divisions. Restore the dump instead if you want data."
