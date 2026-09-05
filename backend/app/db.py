"""
asyncpg pool lifecycle. No ORM, no Alembic (PROGRESS_TRACKER.md §3, the T2
database-layer decision) -- the schema *is* the source of truth. Views,
triggers and functions already built into it (`v_profile_readiness`,
`save_profile_weights()`, `sl_area_km2()`, ...) are called as plain SQL from
here on; nothing in `app/` re-models a table, a rule or a computation that
the database already owns. A future router calls
`await conn.fetchrow("SELECT * FROM v_profile_readiness WHERE profile_id = $1", pid)`
or `await conn.fetchval("SELECT save_profile_weights($1, $2, ...)", ...)`
directly -- never a Python reimplementation of what those already do.

**The pool is acquired lazily, and its absence is not fatal.** An earlier
version created it in the lifespan handler and let a failure propagate, which
meant that with PostgreSQL down at startup the app did not start at all: the
documented "503 when the database is unreachable" contract was unreachable in
precisely the situation it exists for (the service not yet started), because
the only reachable path was connection-refused from a process that never
booted. `/api/health` must be able to answer "the API is up, the database is
not" -- that is the whole point of it. So a failure here is reported, not
raised, and a later call retries: start the API first and PostgreSQL second
and the app recovers on its own rather than needing a restart.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Optional

import asyncpg
from fastapi import Request

from app.config import get_settings

log = logging.getLogger(__name__)

# Serialises concurrent first-callers so a burst of requests against a
# not-yet-connected database opens one pool, not one per request.
_lock = asyncio.Lock()

# Retrying on *every* request means each one pays a full TCP connect timeout
# while the database is down -- fine for /api/health alone, but from T3 onward
# every router shares this dependency, and a dead database would make the whole
# API hang rather than fail fast. Retry at most this often; in between, report
# unavailable immediately.
RETRY_COOLDOWN_SECONDS = 5.0
_last_attempt: float = 0.0


async def create_pool() -> asyncpg.Pool:
    """Open the pool. Raises if the database is unreachable -- callers decide what that means."""
    settings = get_settings()
    # No password= argument: asyncpg resolves it itself (PGPASSWORD env var,
    # then the pgpass file -- on Windows %APPDATA%\postgresql\pgpass.conf, via
    # compat.get_pg_home_directory(), verified against the installed source).
    # Passing one here would be the thing CLAUDE.md says not to do.
    return await asyncpg.create_pool(
        host=settings.pg_host,
        port=settings.pg_port,
        database=settings.pg_database,
        user=settings.pg_user,
        min_size=1,
        max_size=5,
    )


async def open_pool_or_none(app=None) -> Optional[asyncpg.Pool]:
    """Try to open the pool. Report failure; never prevent the app from booting."""
    global _last_attempt
    _last_attempt = time.monotonic()
    try:
        pool = await create_pool()
    except Exception:
        # Full detail to the server log, where it belongs. It must not reach
        # the client: connection errors carry host, port, user and database
        # name, and auth failures quote the user back verbatim.
        log.exception("database pool unavailable at startup; /api/health will report degraded")
        return None
    log.info("database pool opened")
    return pool


async def get_pool(request: Request) -> Optional[asyncpg.Pool]:
    """
    FastAPI dependency. Yields the pool, opening it on demand if startup could
    not. Returns None while the database is unreachable -- callers must handle
    that rather than assume a live pool.
    """
    app = request.app
    pool = getattr(app.state, "pool", None)
    if pool is not None:
        return pool

    # Fail fast rather than pay a connect timeout on every request.
    if time.monotonic() - _last_attempt < RETRY_COOLDOWN_SECONDS:
        return None

    async with _lock:
        # Re-check both: another request may have opened it, or just tried and
        # failed, while we waited for the lock.
        pool = getattr(app.state, "pool", None)
        if pool is not None:
            return pool
        if time.monotonic() - _last_attempt < RETRY_COOLDOWN_SECONDS:
            return None
        pool = await open_pool_or_none(app)
        app.state.pool = pool
    return pool
