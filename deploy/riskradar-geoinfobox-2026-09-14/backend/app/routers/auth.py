"""
POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me (T2b).

Registration type -> role code (BUILD_BRIEF T2b: "agency / expert / public"):
    agency -> data_officer   (needs a province)
    expert -> expert         (needs a province)
    public -> community      (national; no province)

This only records what was REQUESTED (app_user.requested_role_id,
app_user.requested_scope). Nothing can write until an administrator approves it
(POST /admin/registrations/{id}/approve) -- that is what actually grants
user_role, which is what the T1b provincial-scope trigger checks, and
user_write_scope, which is what may_write_profile() checks. See
schema_auth_addendum.sql and schema_write_scope_addendum.sql.

INTEREST AREAS (added 5 Sep 2026). A province is not a narrow enough scope for
someone who writes data. Every workbook is specific to a sector and subsector,
and since 3 Sep the official track is latest-import-supersedes -- so a
wrong-sector upload OVERWRITES rather than duplicating. An agency officer and an
expert therefore name the sectors they work in when they register, and an
administrator grants them (or a narrower set) at approval. The request lands in
app_user.requested_scope and NOWHERE ELSE: putting it in user_write_scope would
make an unapproved wish indistinguishable from an approved permission, and
user_write_scope is what every check reads.
"""

from __future__ import annotations

import json
import logging
from datetime import timedelta
from typing import Literal, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field

from app.config import get_settings
from app.deps import CurrentUser, db, get_current_user
from app.scope import InterestArea, ScopeError, as_requested_scope, resolve_areas
from app.security import hash_password, hash_session_token, new_session_token, verify_password

log = logging.getLogger(__name__)

router = APIRouter()

_ROLE_FOR_TYPE = {"agency": "data_officer", "expert": "expert", "public": "community"}


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=200)
    full_name: str = Field(min_length=1, max_length=200)
    organization: Optional[str] = Field(default=None, max_length=200)
    type: Literal["agency", "expert", "public"]
    province_id: Optional[int] = None
    interest_areas: list[InterestArea] = Field(
        default_factory=list, max_length=64,
        description="the sectors this applicant works in. Required for agency "
                    "and expert; must be empty for public.")
    hazard_domain: bool = Field(
        default=False,
        description="asks to write the shared climate variables. Reviewed "
                    "separately -- they belong to the Met Department / DMC and "
                    "are relied on by every sector.")


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    organization: Optional[str]
    status: str
    province: Optional[str]
    roles: list[str]


def _user_out(user: CurrentUser) -> UserOut:
    return UserOut(
        id=user.id, email=user.email, full_name=user.full_name,
        organization=user.organization, status=user.status,
        province=user.province, roles=user.roles,
    )


def _set_session_cookie(response: Response, raw_token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.session_cookie_name,
        value=raw_token,
        max_age=settings.session_lifetime_hours * 3600,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
    )


@router.post("/auth/register", status_code=201)
async def register(body: RegisterRequest, pool: asyncpg.Pool = Depends(db)) -> dict:
    role_code = _ROLE_FOR_TYPE[body.type]
    needs_province = role_code in ("data_officer", "expert")

    if needs_province and body.province_id is None:
        raise HTTPException(
            status_code=422,
            detail=f'registering as "{body.type}" requires province_id (SRS §3.2)',
        )
    if not needs_province and body.province_id is not None:
        raise HTTPException(
            status_code=422,
            detail=f'"{body.type}" registrations are national in scope; province_id must not be set',
        )

    # Interest areas follow the same rule as the province, and for the same
    # reason: they describe where this person may WRITE, and a community
    # account never writes.
    if needs_province and not body.interest_areas:
        raise HTTPException(
            status_code=422,
            detail=f'registering as "{body.type}" requires at least one '
                   f'interest area. Every dataset belongs to a sector and '
                   f'subsector, and an account granted none of them cannot '
                   f'import anything -- an approval with nothing to grant '
                   f'produces an account that looks active and silently '
                   f'refuses every upload.',
        )
    if not needs_province and (body.interest_areas or body.hazard_domain):
        raise HTTPException(
            status_code=422,
            detail=f'"{body.type}" registrations do not write data, so they '
                   f'carry no interest areas',
        )

    role_row = await pool.fetchrow("SELECT id FROM role WHERE code = $1", role_code)
    if role_row is None:
        # Would mean the role seed is missing entirely -- a deployment defect,
        # not a user error, hence 500 rather than 422.
        raise HTTPException(status_code=500, detail="registration role is not configured")

    if needs_province:
        province_row = await pool.fetchrow("SELECT id FROM province WHERE id = $1", body.province_id)
        if province_row is None:
            raise HTTPException(status_code=422, detail="unknown province_id")

    # Resolved here rather than at approval, so an applicant who mistypes a
    # sector code fixes it while the form is in front of them. The resolved
    # ids are then thrown away: requested_scope stores CODES, which stay
    # readable years later when an id may point at a renamed or retired row.
    try:
        async with pool.acquire() as conn:
            await resolve_areas(conn, body.interest_areas)
    except ScopeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    password_hash = hash_password(body.password)
    try:
        new_id = await pool.fetchval(
            """
            INSERT INTO app_user (email, password_hash, full_name, organization,
                                   requested_role_id, province_id, requested_scope)
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
            RETURNING id
            """,
            body.email.strip().lower(), password_hash, body.full_name, body.organization,
            role_row["id"], body.province_id,
            json.dumps(as_requested_scope(body.interest_areas, body.hazard_domain)),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=409, detail="an account with this email already exists")
    except asyncpg.PostgresError as exc:
        # Anything else here is a deployment defect (e.g. a schema addendum
        # not yet applied -- requested_scope/may_write_hazard_domain come from
        # schema_write_scope_addendum.sql) rather than bad input, which is why
        # the client gets a generic message. Logged with the full error so it
        # doesn't have to be reproduced blind from a bare 500.
        log.exception("registration insert failed: %s", exc)
        raise HTTPException(status_code=500, detail="registration failed") from exc

    return {"id": new_id, "status": "pending"}


@router.post("/auth/login")
async def login(body: LoginRequest, response: Response, pool: asyncpg.Pool = Depends(db)) -> UserOut:
    row = await pool.fetchrow(
        "SELECT id, password_hash, status, rejected_reason FROM app_user WHERE email = $1",
        body.email.strip().lower(),
    )
    # Same message whether the email is unknown or the password is wrong --
    # confirming an email exists to someone who does not hold its password
    # is exactly the enumeration this avoids.
    if row is None or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="invalid email or password")

    if row["status"] == "pending":
        raise HTTPException(status_code=403, detail="registration is awaiting administrator approval")
    if row["status"] == "rejected":
        raise HTTPException(status_code=403, detail=f'registration was rejected: {row["rejected_reason"]}')
    if row["status"] == "suspended":
        raise HTTPException(status_code=403, detail="account is suspended")

    raw_token, token_hash = new_session_token()
    expires_at = timedelta(hours=get_settings().session_lifetime_hours)
    await pool.execute(
        "INSERT INTO app_session (token_hash, user_id, expires_at) VALUES ($1, $2, now() + $3)",
        token_hash, row["id"], expires_at,
    )
    _set_session_cookie(response, raw_token)

    user_row = await pool.fetchrow(
        """
        SELECT u.id, u.email, u.full_name, u.organization, u.status,
               u.province_id, p.name AS province
          FROM app_user u LEFT JOIN province p ON p.id = u.province_id
         WHERE u.id = $1
        """,
        row["id"],
    )
    role_rows = await pool.fetch(
        "SELECT r.code FROM user_role ur JOIN role r ON r.id = ur.role_id WHERE ur.user_id = $1",
        row["id"],
    )
    return _user_out(CurrentUser(user_row, [r["code"] for r in role_rows]))


@router.post("/auth/logout", status_code=204)
async def logout(request: Request, response: Response, pool: asyncpg.Pool = Depends(db)) -> None:
    settings = get_settings()
    raw_token = request.cookies.get(settings.session_cookie_name)
    if raw_token:
        await pool.execute(
            "UPDATE app_session SET revoked_at = now(), revoked_reason = 'signed out' "
            "WHERE token_hash = $1 AND revoked_at IS NULL",
            hash_session_token(raw_token),
        )
    # Cleared regardless of whether a live session was found -- a stale or
    # already-revoked cookie must not keep being sent back to the client.
    response.delete_cookie(key=settings.session_cookie_name, path="/")


@router.get("/auth/me")
async def me(user: CurrentUser = Depends(get_current_user)) -> UserOut:
    return _user_out(user)
