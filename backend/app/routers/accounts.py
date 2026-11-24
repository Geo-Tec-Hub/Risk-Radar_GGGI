"""
Accounts created by administrators (client NOTED-17, item 9).

    GET  /api/admin/accounts         the accounts an administrator manages
    POST /api/admin/accounts         create an account, active at once

WHO CREATES WHOM
    super administrator (admin)   provincial administrators, data sharing
                                  administrators, and any other account
    provincial administrator      experts and official data-entry users of
                                  their OWN province

The list says who approved or created each account (app_user.approved_by), so
the super administrator can see who each provincial administrator has created.
Self-registration and its approval queue (routers/admin.py) are unchanged.
"""

from __future__ import annotations

from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.deps import CurrentUser, db, require_account_admin
from app.scope import InterestArea, ScopeError, replace_scope, resolve_areas
from app.security import hash_password

router = APIRouter()

PROVINCE_BOUND = ("province_admin", "data_officer", "expert")
NATIONAL = ("admin", "data_sharing_admin", "community")


class AccountOut(BaseModel):
    id: int
    email: str
    full_name: str
    organization: Optional[str]
    status: str
    roles: list[str]
    province: Optional[str]
    provinces: list[str]
    created_by: Optional[str]
    created_by_id: Optional[int]
    created_at: Optional[str]


class AccountIn(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    full_name: str = Field(min_length=1, max_length=200)
    organization: Optional[str] = Field(default=None, max_length=200)
    password: str = Field(min_length=8, max_length=200,
                          description="a first password; the person can be asked to change it")
    role: str
    # First = home province. Several only for an expert.
    province_ids: list[int] = Field(default_factory=list, max_length=9)
    # Sectors this account may write. Empty = every sector (the usual case for
    # an account created by its own provincial administrator).
    sectors: list[InterestArea] = Field(default_factory=list, max_length=64)
    may_write_hazard_domain: bool = True


@router.get("/admin/accounts", response_model=list[AccountOut])
async def list_accounts(
    admin: CurrentUser = Depends(require_account_admin),
    pool: asyncpg.Pool = Depends(db),
) -> list[AccountOut]:
    only = None if admin.is_super_admin() else admin.province_id
    rows = await pool.fetch(
        """
        SELECT u.id, u.email, u.full_name, u.organization, u.status::text AS status,
               p.name AS province, u.approved_by, a.full_name AS approver,
               COALESCE(u.approved_at, u.registered_at) AS at,
               COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
               COALESCE(array_agg(DISTINCT up_p.name) FILTER (WHERE up_p.name IS NOT NULL), '{}') AS provinces
          FROM app_user u
          LEFT JOIN province p ON p.id = u.province_id
          LEFT JOIN app_user a ON a.id = u.approved_by
          LEFT JOIN user_role ur ON ur.user_id = u.id
          LEFT JOIN role r ON r.id = ur.role_id
          LEFT JOIN user_province up ON up.user_id = u.id
          LEFT JOIN province up_p ON up_p.id = up.province_id
         WHERE $1::smallint IS NULL
            OR u.province_id = $1
            OR EXISTS (SELECT 1 FROM user_province x WHERE x.user_id = u.id AND x.province_id = $1)
         GROUP BY u.id, p.name, a.full_name
         ORDER BY a.full_name NULLS FIRST, u.full_name
        """, only)
    return [AccountOut(
        id=r["id"], email=r["email"], full_name=r["full_name"], organization=r["organization"],
        status=r["status"], roles=list(r["roles"]), province=r["province"],
        provinces=list(r["provinces"]), created_by=r["approver"], created_by_id=r["approved_by"],
        created_at=r["at"].isoformat() if r["at"] else None) for r in rows]


@router.post("/admin/accounts", response_model=AccountOut, status_code=201)
async def create_account(
    body: AccountIn,
    admin: CurrentUser = Depends(require_account_admin),
    pool: asyncpg.Pool = Depends(db),
) -> AccountOut:
    role = body.role
    if role not in PROVINCE_BOUND + NATIONAL:
        raise HTTPException(422, "unknown role %r" % role)
    provinces = list(dict.fromkeys(body.province_ids))
    if not admin.is_super_admin():
        if role not in ("expert", "data_officer"):
            raise HTTPException(403, "a provincial administrator creates experts and "
                                     "data-entry users only")
        provinces = [admin.province_id]          # always their own province
    if role in PROVINCE_BOUND and not provinces:
        raise HTTPException(422, "a %s needs a province" % role)
    if role in NATIONAL and provinces:
        raise HTTPException(422, "a %s is national and takes no province" % role)
    if role != "expert" and len(provinces) > 1:
        raise HTTPException(422, "only an expert may work in several provinces")

    async with pool.acquire() as conn:
        async with conn.transaction():
            role_id = await conn.fetchval("SELECT id FROM role WHERE code = $1", role)
            if role_id is None:
                raise HTTPException(500, "role %s is not configured -- apply "
                                         "schema_noted17_roles_addendum.sql" % role)
            if provinces and await conn.fetchval(
                    "SELECT count(*) FROM province WHERE id = ANY($1::smallint[])",
                    provinces) != len(provinces):
                raise HTTPException(422, "unknown province")
            try:
                uid = await conn.fetchval(
                    """INSERT INTO app_user (email, password_hash, full_name, organization,
                                             requested_role_id, province_id, status,
                                             approved_by, approved_at)
                       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, now())
                       RETURNING id""",
                    body.email.strip().lower(), hash_password(body.password), body.full_name,
                    body.organization, role_id, provinces[0] if provinces else None, admin.id)
            except asyncpg.UniqueViolationError:
                raise HTTPException(409, "an account with this email already exists") from None
            await conn.execute("INSERT INTO user_role (user_id, role_id) VALUES ($1, $2)",
                               uid, role_id)
            for p in provinces:
                await conn.execute("INSERT INTO user_province (user_id, province_id) "
                                   "VALUES ($1, $2) ON CONFLICT DO NOTHING", uid, p)
            if role in ("expert", "data_officer"):
                areas = body.sectors or [InterestArea(sector=r["code"]) for r in
                                         await conn.fetch("SELECT code FROM sector ORDER BY code")]
                try:
                    resolved = await resolve_areas(conn, areas)
                except ScopeError as exc:
                    raise HTTPException(422, str(exc)) from exc
                await replace_scope(conn, uid, resolved, body.may_write_hazard_domain, admin.id,
                                    "created by %s" % (admin.full_name or admin.email))
    rows = await list_accounts(admin, pool)
    return next(r for r in rows if r.id == uid)
