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
"""

from __future__ import annotations

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.deps import CurrentUser, db, require_admin

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


class ApproveRequest(BaseModel):
    role: str = Field(description="role code to grant, e.g. data_officer, expert, community, admin")
    province_id: int | None = None


class RejectRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


@router.get("/admin/registrations")
async def list_pending(
    _admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> list[PendingRegistrationOut]:
    rows = await pool.fetch("SELECT * FROM v_pending_registration")
    return [
        PendingRegistrationOut(
            id=r["id"], email=r["email"], full_name=r["full_name"],
            organization=r["organization"], registered_at=r["registered_at"].isoformat(),
            requested_role=r["requested_role"], requested_role_name=r["requested_role_name"],
            requested_province=r["requested_province"],
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

    return {"id": user_id, "status": "active", "role": body.role}


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
