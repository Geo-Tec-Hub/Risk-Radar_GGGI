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
    __slots__ = ("id", "email", "full_name", "organization", "status", "province_id", "province",
                 "roles", "provinces")

    def __init__(self, row: asyncpg.Record, roles: list[str], provinces: Optional[list[int]] = None):
        self.id = row["id"]
        self.email = row["email"]
        self.full_name = row["full_name"]
        self.organization = row["organization"]
        self.status = row["status"]
        self.province_id = row["province_id"]
        self.province = row["province"]
        self.roles = roles
        # Every province this account works in (user_province, NOTED-17): an
        # expert may hold several; everyone else has their one province.
        self.provinces = sorted(set(provinces or []) | ({row["province_id"]} if row["province_id"] else set()))

    def has_role(self, code: str) -> bool:
        return code in self.roles

    def is_super_admin(self) -> bool:
        return "admin" in self.roles

    def is_province_admin(self, province_id: Optional[int]) -> bool:
        """Provincial administrator OF THAT province (NOTED-17)."""
        return "province_admin" in self.roles and province_id is not None \
            and self.province_id == province_id

    def approves_own_changes(self, province_id: Optional[int]) -> bool:
        """Changes by the super administrator or the province's own
        administrator apply at once; everyone else's wait for approval."""
        return self.is_super_admin() or self.is_province_admin(province_id)


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

    return await load_user_roles(pool, row)


async def load_user_roles(conn, row) -> CurrentUser:
    role_rows = await conn.fetch(
        "SELECT r.code FROM user_role ur JOIN role r ON r.id = ur.role_id WHERE ur.user_id = $1",
        row["id"],
    )
    try:
        provs = [r["province_id"] for r in await conn.fetch(
            "SELECT province_id FROM user_province WHERE user_id = $1", row["id"])]
    except asyncpg.UndefinedTableError:
        provs = []          # before schema_noted17_roles_addendum.sql
    return CurrentUser(row, [r["code"] for r in role_rows], provs)


async def load_user(conn, user_id: int) -> Optional[CurrentUser]:
    """The account by id, as get_current_user would build it -- used to replay
    an approved change as the person who submitted it."""
    row = await conn.fetchrow(
        """SELECT u.id, u.email, u.full_name, u.organization, u.status,
                  u.province_id, p.name AS province
             FROM app_user u LEFT JOIN province p ON p.id = u.province_id
            WHERE u.id = $1""", user_id)
    return None if row is None else await load_user_roles(conn, row)


async def get_current_user(user: Optional[CurrentUser] = Depends(get_optional_user)) -> CurrentUser:
    if user is None:
        raise HTTPException(status_code=401, detail="not signed in")
    return user


async def require_account_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Super administrator or a provincial administrator (NOTED-17)."""
    if not (user.has_role("admin") or user.has_role("province_admin")):
        raise HTTPException(status_code=403, detail="administrator role required")
    return user


async def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if not user.has_role("admin"):
        raise HTTPException(status_code=403, detail="administrator role required")
    return user
