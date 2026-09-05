"""
Shared FastAPI dependencies for T2b: a database-or-503 guard, and the
current-user chain built on top of it (v_active_session).

NFR-4 (default deny): every dependency here fails closed. No pool -> 503,
not a silent None passed on. No session cookie, or a revoked/expired one ->
401, never treated as "anonymous, carry on" by a caller that forgot to check.
FR-5.21 (the client must not appear signed in while the API rejects its
requests) is why get_current_user raises rather than returning an Optional
that a router might not check.
"""

from __future__ import annotations

from typing import Optional

import asyncpg
from fastapi import Depends, HTTPException, Request

from app.config import get_settings
from app.db import get_pool
from app.security import hash_session_token


class CurrentUser:
    __slots__ = ("id", "email", "full_name", "organization", "status", "province_id", "province", "roles")

    def __init__(self, row: asyncpg.Record, roles: list[str]):
        self.id = row["id"]
        self.email = row["email"]
        self.full_name = row["full_name"]
        self.organization = row["organization"]
        self.status = row["status"]
        self.province_id = row["province_id"]
        self.province = row["province"]
        self.roles = roles

    def has_role(self, code: str) -> bool:
        return code in self.roles


async def db(pool: Optional[asyncpg.Pool] = Depends(get_pool)) -> asyncpg.Pool:
    """Every auth/admin route needs a live database to mean anything -- there
    is no degraded answer for 'log this person in' the way there is for
    /api/health. Fail with 503, not a crash or a silently-skipped check."""
    if pool is None:
        raise HTTPException(status_code=503, detail="database unavailable")
    return pool


async def get_optional_user(
    request: Request,
    pool: asyncpg.Pool = Depends(db),
) -> Optional[CurrentUser]:
    settings = get_settings()
    raw_token = request.cookies.get(settings.session_cookie_name)
    if not raw_token:
        return None

    token_hash = hash_session_token(raw_token)
    row = await pool.fetchrow(
        """
        SELECT u.id, u.email, u.full_name, u.organization, u.status,
               u.province_id, p.name AS province
          FROM v_active_session s
          JOIN app_user u ON u.id = s.user_id
          LEFT JOIN province p ON p.id = u.province_id
         WHERE s.token_hash = $1
        """,
        token_hash,
    )
    if row is None:
        return None

    role_rows = await pool.fetch(
        "SELECT r.code FROM user_role ur JOIN role r ON r.id = ur.role_id WHERE ur.user_id = $1",
        row["id"],
    )
    return CurrentUser(row, [r["code"] for r in role_rows])


async def get_current_user(user: Optional[CurrentUser] = Depends(get_optional_user)) -> CurrentUser:
    if user is None:
        raise HTTPException(status_code=401, detail="not signed in")
    return user


async def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if not user.has_role("admin"):
        raise HTTPException(status_code=403, detail="administrator role required")
    return user
