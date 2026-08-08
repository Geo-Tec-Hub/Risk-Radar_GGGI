#!/usr/bin/env bash
# Run the smoke tests against the running database.
#   ./db/smoke_test.sh
set -euo pipefail

DB=${DB:-riskradar}
USER=${USER_DB:-riskradar}

if docker compose ps --services >/dev/null 2>&1; then
  PSQL=(docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$USER" -d "$DB")
else
  PSQL=(docker exec -i riskradar-db psql -v ON_ERROR_STOP=1 -U "$USER" -d "$DB")
fi

printf '\n\033[1;36m==> Smoke tests\033[0m\n'
if "${PSQL[@]}" -f /db/smoke_test.sql; then
  printf '\n\033[1;32mPASS\033[0m  the schema behaves as designed.\n'
else
  printf '\n\033[0;31mFAIL\033[0m  see the error above.\n' >&2
  exit 1
fi
