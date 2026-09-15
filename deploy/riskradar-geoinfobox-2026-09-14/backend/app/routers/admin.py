"""
GET /admin/registrations, POST /admin/registrations/{id}/approve,
POST /admin/registrations/{id}/reject (T2b). Every route here requires the
admin role (require_admin) -- NFR-4 default deny, nothing here is a public
read.

Reject is also the revocation path (T2b: "an account can be deactivated or
rejected after approval"). It is not restricted to status='pending': moving
ANY account to 'rejected' is exactly what the schema_session_addendum.sql
trigger (app_user_revoke_sessions_on_deactivation) watches for, so rejecting
an already-active account is how an administrator forces a sign-out here --
no separate "deactivate" endpoint exists, because this one already does it.

WRITE SCOPE (added 5 Sep 2026). Approving an agency or expert registration also
decides which sectors that person may write to. `scopes` is REQUIRED on those
approvals and is never defaulted from what the applicant requested: defaulting
would turn "approve" into "grant everything asked for" for an administrator who
clicked through the queue, and the request is the one thing in this exchange
that the applicant wrote themselves. GET /admin/registrations shows the request
so the decision is informed, and PUT /admin/users/{id}/scope amends it later
when someone changes teams.
"""

from __future__ import annotations

import json

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.deps import CurrentUser, db, require_admin
from app.scope import (InterestArea, ScopeError, ScopeOut, read_scope,
                       replace_scope, resolve_areas)

router = APIRouter()


class PendingRegistrationOut(BaseModel):
    id: int
    email: str
    full_name: str
    organization: str | None
    registered_at: str
    requested_role: str | None
    requested_role_name: str | None
    requested_province: str | None
    # What the applicant asked to write, verbatim, so the approval screen can
    # show it. A wish, not a permission -- see app/scope.py.
    requested_areas: list[InterestArea] = []
    requested_hazard_domain: bool = False


class ApproveRequest(BaseModel):
    role: str = Field(description="role code to grant, e.g. data_officer, expert, community, admin")
    province_id: int | None = None
    scopes: list[InterestArea] | None = Field(
        default=None,
        description="the sectors to grant. REQUIRED for data_officer and "
                    "expert; must be omitted or empty for community. Never "
                    "defaulted from the request -- see this module's header.")
    may_write_hazard_domain: bool = Field(
        default=False,
        description="grant the shared climate variables (Met Dept / DMC). "
                    "Decided separately from the sectors: ~13.5 profiles "
                    "depend on each of those twelve variables.")
    scope_note: str | None = Field(default=None, max_length=1000)


# The roles that write data, and therefore need a sector scope. community
# reads only (FR-12.7); admin is not sector-bound (may_write_profile).
_SCOPED_ROLES = ("data_officer", "expert")


class ScopeAmendRequest(BaseModel):
    scopes: list[InterestArea] = Field(default_factory=list, max_length=64)
    may_write_hazard_domain: bool = False
    note: str | None = Field(default=None, max_length=1000)


class RejectRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


def _scope_json(raw) -> dict:
    """app_user.requested_scope comes back as text from asyncpg unless a codec
    is registered. Tolerate both, and tolerate NULL: accounts created before
    5 Sep 2026 have no request at all, which is not the same as an empty one
    and must not crash the queue that lists them."""
    if raw is None:
        return {}
    if isinstance(raw, (str, bytes)):
        try:
            return json.loads(raw)
        except ValueError:
            return {}
    return raw if isinstance(raw, dict) else {}


def _requested_areas(raw) -> list[InterestArea]:
    out = []
    for item in _scope_json(raw).get("sectors") or []:
        if isinstance(item, dict) and item.get("sector"):
            out.append(InterestArea(sector=item["sector"],
                                    subsector=item.get("subsector")))
    return out


def _requested_hazard(raw) -> bool:
    return bool(_scope_json(raw).get("hazardDomain"))


@router.get("/admin/registrations")
async def list_pending(
    _admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> list[PendingRegistrationOut]:
    rows = await pool.fetch(
        """SELECT v.*, u.requested_scope
             FROM v_pending_registration v
             JOIN app_user u ON u.id = v.id
            ORDER BY v.registered_at""")
    return [
        PendingRegistrationOut(
            id=r["id"], email=r["email"], full_name=r["full_name"],
            organization=r["organization"], registered_at=r["registered_at"].isoformat(),
            requested_role=r["requested_role"], requested_role_name=r["requested_role_name"],
            requested_province=r["requested_province"],
            requested_areas=_requested_areas(r["requested_scope"]),
            requested_hazard_domain=_requested_hazard(r["requested_scope"]),
        )
        for r in rows
    ]


@router.post("/admin/registrations/{user_id}/approve")
async def approve(
    user_id: int,
    body: ApproveRequest,
    admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> dict:
    role_row = await pool.fetchrow("SELECT id FROM role WHERE code = $1", body.role)
    if role_row is None:
        raise HTTPException(status_code=422, detail=f'unknown role code "{body.role}"')

    needs_scope = body.role in _SCOPED_ROLES

    # Deliberately NOT defaulted to the requested set. See the module header:
    # an approval that silently grants whatever was asked is not a decision.
    if needs_scope and not body.scopes:
        requested = await pool.fetchval(
            "SELECT requested_scope FROM app_user WHERE id = $1", user_id)
        asked = _requested_areas(requested)
        raise HTTPException(
            status_code=422,
            detail='approving a "%s" requires "scopes": the sectors this '
                   'account may write to. It is not defaulted from the '
                   'request, because granting whatever was asked for is not a '
                   'decision. This applicant asked for: %s%s'
                   % (body.role,
                      ", ".join(_label(a) for a in asked) or "nothing",
                      " (and the hazard domain)" if _requested_hazard(requested) else ""))
    if not needs_scope and (body.scopes or body.may_write_hazard_domain):
        raise HTTPException(
            status_code=422,
            detail='the "%s" role does not write data, so it takes no write '
                   'scope' % body.role)

    async with pool.acquire() as conn:
        async with conn.transaction():
            target = await conn.fetchrow("SELECT status FROM app_user WHERE id = $1 FOR UPDATE", user_id)
            if target is None:
                raise HTTPException(status_code=404, detail="no such registration")
            if target["status"] != "pending":
                raise HTTPException(
                    status_code=409,
                    detail=f'registration is already {target["status"]}, not pending',
                )

            # Province first, in the SAME transaction: the province-scope
            # trigger on user_role reads app_user.province_id at grant time,
            # so it must already reflect what this approval sets before the
            # INSERT below runs.
            if body.province_id is not None:
                await conn.execute(
                    "UPDATE app_user SET province_id = $1 WHERE id = $2", body.province_id, user_id,
                )

            await conn.execute(
                """
                UPDATE app_user
                   SET status = 'active', approved_by = $1, approved_at = now()
                 WHERE id = $2
                """,
                admin.id, user_id,
            )

            try:
                await conn.execute(
                    "INSERT INTO user_role (user_id, role_id) VALUES ($1, $2) "
                    "ON CONFLICT (user_id, role_id) DO NOTHING",
                    user_id, role_row["id"],
                )
            except asyncpg.CheckViolationError as exc:
                # user_role_province_scope (SRS §3.2): province missing/present
                # where the role forbids/requires it. Surface the trigger's own
                # message -- it already explains exactly what is wrong.
                raise HTTPException(status_code=422, detail=str(exc)) from exc

            # Last, and in the same transaction: if the scope cannot be
            # granted, the account must not come out of this call active with
            # no way to write. Either the whole approval lands or none of it.
            granted = []
            if needs_scope:
                try:
                    granted = await resolve_areas(conn, body.scopes or [])
                except ScopeError as exc:
                    raise HTTPException(status_code=422, detail=str(exc)) from exc
                await replace_scope(conn, user_id, granted,
                                    body.may_write_hazard_domain, admin.id,
                                    body.scope_note)

    return {
        "id": user_id, "status": "active", "role": body.role,
        "scopes": [_label(a) for a in granted],
        "may_write_hazard_domain": body.may_write_hazard_domain,
    }


@router.get("/admin/users/{user_id}/scope")
async def get_user_scope(
    user_id: int,
    _admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> ScopeOut:
    async with pool.acquire() as conn:
        if not await conn.fetchval("SELECT 1 FROM app_user WHERE id = $1", user_id):
            raise HTTPException(status_code=404, detail="no such user")
        return await read_scope(conn, user_id)


@router.put("/admin/users/{user_id}/scope")
async def set_user_scope(
    user_id: int,
    body: ScopeAmendRequest,
    admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> ScopeOut:
    """Amend an approved account's write scope -- someone changes teams, or an
    approval was too wide.

    The body REPLACES the whole scope rather than adding to it, so what an
    administrator sees on the screen is what the account ends up with. An
    additive endpoint would mean the granted set could only ever grow, and
    revocation would need a second endpoint nobody remembers to call.

    Sending an empty list is a valid decision and revokes everything. It is not
    the same as leaving the field out, which Pydantic would also read as empty
    -- so `scopes` has no default that could be reached by omission alone in a
    request that meant to change only the hazard flag.
    """
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """SELECT u.status,
                          EXISTS (SELECT 1 FROM user_role ur JOIN role r
                                    ON r.id = ur.role_id
                                   WHERE ur.user_id = u.id
                                     AND r.code = ANY($2::text[])) AS writes
                     FROM app_user u WHERE u.id = $1 FOR UPDATE""",
                user_id, list(_SCOPED_ROLES))
            if row is None:
                raise HTTPException(status_code=404, detail="no such user")
            if not row["writes"] and (body.scopes or body.may_write_hazard_domain):
                raise HTTPException(
                    status_code=409,
                    detail="this account holds no role that writes data, so a "
                           "write scope would grant nothing. Approve it as a "
                           "data officer or expert first.")
            try:
                resolved = await resolve_areas(conn, body.scopes)
            except ScopeError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
            await replace_scope(conn, user_id, resolved,
                                body.may_write_hazard_domain, admin.id, body.note)
            return await read_scope(conn, user_id)


def _label(a) -> str:
    sub = getattr(a, "subsector", None)
    return f"{a.sector} / {sub}" if sub else f"{a.sector} (all subsectors)"


@router.post("/admin/registrations/{user_id}/reject")
async def reject(
    user_id: int,
    body: RejectRequest,
    _admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> dict:
    row = await pool.fetchrow("SELECT status FROM app_user WHERE id = $1", user_id)
    if row is None:
        raise HTTPException(status_code=404, detail="no such user")
    if row["status"] == "rejected":
        raise HTTPException(status_code=409, detail="already rejected")

    # Revokes any open session for this user via
    # app_user_revoke_sessions_on_deactivation -- true whether this call is
    # rejecting a pending registration or deactivating an already-active one.
    try:
        await pool.execute(
            "UPDATE app_user SET status = 'rejected', rejected_reason = $1 WHERE id = $2",
            body.reason, user_id,
        )
    except asyncpg.CheckViolationError as exc:
        # app_user_rejection_explained: whitespace-only reason. Pydantic's
        # min_length=1 lets " " through; the database's btrim check does not.
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"id": user_id, "status": "rejected"}
