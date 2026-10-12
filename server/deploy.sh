#!/usr/bin/env bash
# Risk Radar -- server-side deploy (riskradar.geoinfobox.com, Docker).
#
# Runs on the server as user `riskradar`. Called by GitHub Actions over SSH on
# every push to master (.github/workflows/deploy.yml), or by hand:
#
#   server/deploy.sh                    update to origin/master (default)
#   server/deploy.sh deploy --schema-applied
#                                       same, after you applied the new SQL
#   server/deploy.sh backup             dump the database now
#   server/deploy.sh sql <file.sql>     apply one SQL file (stops at first error)
#   server/deploy.sh status             containers + health
#
# Layout on the server:
#   /srv/riskradar/app            git checkout of master -- deploy-only, never edit
#   /srv/riskradar/riskradar.env  RR_DB_PASSWORD=...  (not in git)
#   /srv/riskradar/backups/       pg_dump -Fc files, newest 30 kept
#   /srv/riskradar/deploy.log     one line per run
#
# SCHEMA CHANGES ARE NOT APPLIED AUTOMATICALLY (CLAUDE.md rule 4: every
# schema change is an addendum, negative-tested before it goes live). If the
# incoming commits touch design/database/*.sql or backend/db/*.sql the deploy
# stops BEFORE changing anything and lists the files; apply them with
# `deploy.sh sql <file>`, then re-run with --schema-applied (or re-run the
# GitHub workflow with "schema applied" ticked).
set -euo pipefail

ROOT=/srv/riskradar
APP=$ROOT/app
ENV_FILE=$ROOT/riskradar.env
BACKUPS=$ROOT/backups
LOG=$ROOT/deploy.log
BRANCH=master
HEALTH_URL="http://127.0.0.1:8180/api/health"

# Over SSH with a forced command, the requested command arrives in
# SSH_ORIGINAL_COMMAND. Only the deploy forms are accepted from there.
if [[ -n "${SSH_ORIGINAL_COMMAND:-}" ]]; then
  case "$SSH_ORIGINAL_COMMAND" in
    deploy|"deploy --schema-applied"|status) set -- $SSH_ORIGINAL_COMMAND ;;
    *) echo "refused: '$SSH_ORIGINAL_COMMAND'" >&2; exit 2 ;;
  esac
fi

dc() { docker compose -p riskradar -f "$APP/docker-compose.yml" -f "$APP/docker-compose.prod.yml" --env-file "$ENV_FILE" "$@"; }
log() { echo "$(date -u +%FT%TZ) $*" | tee -a "$LOG"; }

healthy() {
  for _ in $(seq 1 30); do
    if curl -fsS -m 5 "$HEALTH_URL" 2>/dev/null | grep -q '"database":"ok"'; then return 0; fi
    sleep 2
  done
  return 1
}

backup() {
  mkdir -p "$BACKUPS"
  local f="$BACKUPS/riskradar-$(date -u +%Y%m%d-%H%M%S).dump"
  dc exec -T db pg_dump -U riskradar -Fc riskradar > "$f.part" && mv "$f.part" "$f"
  ls -1t "$BACKUPS"/riskradar-*.dump | tail -n +31 | xargs -r rm -f
  echo "$f"
}

cmd_deploy() {
  local schema_applied=0
  [[ "${1:-}" == "--schema-applied" ]] && schema_applied=1

  cd "$APP"
  git fetch -q origin "$BRANCH"
  local old new
  old=$(git rev-parse HEAD)
  new=$(git rev-parse "origin/$BRANCH")

  if [[ "$old" == "$new" ]] && healthy; then
    log "deploy: already at ${new:0:7}, healthy -- nothing to do"
    return 0
  fi

  local sql
  sql=$(git diff --name-only "$old" "$new" -- 'design/database/*.sql' 'backend/db/*.sql' || true)
  if [[ -n "$sql" && $schema_applied -eq 0 ]]; then
    log "deploy: STOPPED at ${old:0:7} -- ${new:0:7} changes database SQL; apply it first"
    echo "Changed SQL files (apply each with: server/deploy.sh sql <file>):"
    echo "$sql" | sed 's/^/  /'
    echo "Then re-run: server/deploy.sh deploy --schema-applied"
    return 3
  fi

  log "deploy: ${old:0:7} -> ${new:0:7} (backup: $(backup))"
  git reset -q --hard "$new"

  if dc up -d --build --remove-orphans && healthy; then
    docker image prune -f >/dev/null
    log "deploy: OK at ${new:0:7}"
    return 0
  fi

  log "deploy: FAILED at ${new:0:7} -- rolling back to ${old:0:7}"
  dc logs --tail 60 api || true
  git reset -q --hard "$old"
  dc up -d --build --remove-orphans
  healthy && log "deploy: rolled back, healthy at ${old:0:7}" || log "deploy: ROLLBACK UNHEALTHY at ${old:0:7}"
  return 1
}

cmd_sql() {
  local f="${1:?usage: deploy.sh sql <file.sql>}"
  [[ "$f" = /* ]] || f="$APP/$f"
  log "sql: applying $f (backup: $(backup))"
  dc exec -T db psql -U riskradar -d riskradar -v ON_ERROR_STOP=1 -q < "$f"
  log "sql: OK $f"
}

cmd_status() {
  cd "$APP"
  echo "commit: $(git log -1 --format='%h %s (%cr)')"
  dc ps --format 'table {{.Service}}\t{{.Status}}'
  curl -fsS -m 5 "$HEALTH_URL" && echo || echo "health: UNREACHABLE"
}

# One run at a time (two quick pushes must not build on top of each other).
exec 9>"$ROOT/.deploy.lock"
flock -w 900 9 || { echo "another deploy is still running" >&2; exit 4; }

case "${1:-deploy}" in
  deploy) shift || true; cmd_deploy "$@" ;;
  backup) backup ;;
  sql)    shift; cmd_sql "$@" ;;
  status) cmd_status ;;
  *) echo "usage: deploy.sh [deploy [--schema-applied] | backup | sql <file> | status]" >&2; exit 2 ;;
esac
