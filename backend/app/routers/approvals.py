"""
Approval of expert and official data changes (client NOTED-17, item 9).

    GET  /api/approvals                  the changes waiting (and recently decided)
    POST /api/approvals/{id}/approve     apply it, as the person who submitted it
    POST /api/approvals/{id}/reject      discard it, with a reason
    POST /api/approvals/{id}/cancel      the submitter withdraws it

A provincial administrator sees and decides the changes of their own province;
the super administrator sees all. Approving runs the SAME code the change would
have run if no approval were needed (assessments.apply_save / apply_remove /
apply_restore, imports.run_bytes / apply_correction), as the submitter, so an
approved change is exactly what the person entered.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.deps import CurrentUser, db, get_current_user, load_user, require_account_admin

log = logging.getLogger(__name__)

router = APIRouter(prefix="/approvals", tags=["approvals"])


class ChangeOut(BaseModel):
    id: int
    kind: str
    province: str
    summary: str
    submittedBy: str
    submittedAt: str
    status: str
    decidedBy: Optional[str] = None
    decidedAt: Optional[str] = None
    decisionNote: Optional[str] = None


class DecisionIn(BaseModel):
    note: Optional[str] = Field(default=None, max_length=1000)


@router.get("", response_model=list[ChangeOut])
async def list_changes(
    status: str = "pending",
    admin: CurrentUser = Depends(require_account_admin),
    pool: asyncpg.Pool = Depends(db),
) -> list[ChangeOut]:
    only = None if admin.is_super_admin() else admin.province_id
    rows = await pool.fetch(
        """SELECT c.*, p.name AS province, u.full_name AS submitter, d.full_name AS decider
             FROM pending_change c
             JOIN province p ON p.id = c.province_id
             JOIN app_user u ON u.id = c.submitted_by
             LEFT JOIN app_user d ON d.id = c.decided_by
            WHERE ($1::smallint IS NULL OR c.province_id = $1)
              AND ($2 = 'all' OR c.status = $2)
            ORDER BY c.submitted_at DESC
            LIMIT 200""", only, status)
    return [ChangeOut(
        id=r["id"], kind=r["kind"], province=r["province"], summary=r["summary"],
        submittedBy=r["submitter"], submittedAt=r["submitted_at"].isoformat(),
        status=r["status"], decidedBy=r["decider"],
        decidedAt=r["decided_at"].isoformat() if r["decided_at"] else None,
        decisionNote=r["decision_note"]) for r in rows]


async def _get(conn, change_id: int, admin: Optional[CurrentUser]):
    c = await conn.fetchrow("SELECT * FROM pending_change WHERE id = $1", change_id)
    if c is None:
        raise HTTPException(404, "no such change")
    if admin is not None and not admin.approves_own_changes(c["province_id"]):
        raise HTTPException(403, "only the provincial administrator of that province, or "
                                 "the super administrator, may decide this change")
    if c["status"] != "pending":
        raise HTTPException(409, "this change is already %s" % c["status"])
    return c


async def _apply(pool, c, submitter: CurrentUser) -> str:
    payload = c["payload"]
    payload = json.loads(payload) if isinstance(payload, str) else payload
    kind = c["kind"]
    if kind == "assessment_save":
        from app.routers.assessments import AssessmentIn, apply_save
        r = await apply_save(pool, AssessmentIn(**payload), submitter)
        return "saved" if r.ok else "saved, not scored: %s" % (r.reason or "")
    if kind == "assessment_remove":
        from app.routers.assessments import RemoveIn, apply_remove
        r = await apply_remove(pool, RemoveIn(**payload), submitter)
        return "removed from %d division(s)" % r.removed
    if kind == "assessment_restore":
        from app.routers.assessments import apply_restore
        await apply_restore(pool, int(payload["history_id"]), submitter)
        return "previous version restored"
    if kind == "import_load":
        from app.routers.imports import _parse_edits, run_bytes
        scope = tuple(payload["scope"]) if payload.get("scope") else None
        r = await run_bytes(pool, c["file_name"] or "upload.xlsx", bytes(c["file_body"]),
                            submitter, scope, dry_run=False,
                            edits=_parse_edits(payload.get("edits")))
        if not r.ok:
            raise HTTPException(409, "the import no longer loads: " + "; ".join(r.errors[:5]))
        return "%d values loaded -- recompute the province to publish them" % r.valuesLoaded
    if kind == "batch_values":
        from app.routers.imports import CorrectionBody, apply_correction
        r = await apply_correction(pool, int(payload["batch_id"]),
                                   CorrectionBody(edits=payload["edits"]), submitter)
        return "%d value(s) corrected -- recompute the province to publish them" % r.updated
    raise HTTPException(500, "unknown change kind %s" % kind)


@router.post("/{change_id}/approve", response_model=ChangeOut)
async def approve(
    change_id: int,
    body: DecisionIn,
    admin: CurrentUser = Depends(require_account_admin),
    pool: asyncpg.Pool = Depends(db),
) -> ChangeOut:
    async with pool.acquire() as conn:
        c = await _get(conn, change_id, admin)
        submitter = await load_user(conn, c["submitted_by"])
    if submitter is None:
        raise HTTPException(409, "the person who submitted this change no longer exists")
    try:
        outcome = await _apply(pool, c, submitter)
    except HTTPException as exc:
        await pool.execute(
            """UPDATE pending_change SET status = 'failed', decided_by = $2, decided_at = now(),
                      decision_note = $3 WHERE id = $1""",
            change_id, admin.id, "could not be applied: %s" % exc.detail)
        raise HTTPException(409, "the change could not be applied: %s" % exc.detail) from exc
    note = (body.note.strip() + " -- " if body.note else "") + outcome
    await pool.execute(
        """UPDATE pending_change SET status = 'approved', decided_by = $2, decided_at = now(),
                  decision_note = $3, file_body = NULL WHERE id = $1""",
        change_id, admin.id, note)
    log.info("change %s approved by %s: %s", change_id, admin.id, outcome)
    return next(x for x in await list_changes("all", admin, pool) if x.id == change_id)


@router.post("/{change_id}/reject", response_model=ChangeOut)
async def reject(
    change_id: int,
    body: DecisionIn,
    admin: CurrentUser = Depends(require_account_admin),
    pool: asyncpg.Pool = Depends(db),
) -> ChangeOut:
    if not body.note or not body.note.strip():
        raise HTTPException(422, "say why the change is rejected -- the person who "
                                 "submitted it is entitled to the reason")
    async with pool.acquire() as conn:
        await _get(conn, change_id, admin)
        await conn.execute(
            """UPDATE pending_change SET status = 'rejected', decided_by = $2, decided_at = now(),
                      decision_note = $3, file_body = NULL WHERE id = $1""",
            change_id, admin.id, body.note.strip())
    return next(x for x in await list_changes("all", admin, pool) if x.id == change_id)


class MineOut(BaseModel):
    changes: list[ChangeOut]


@router.get("/mine", response_model=list[ChangeOut])
async def mine(
    user: CurrentUser = Depends(get_current_user),
    pool: asyncpg.Pool = Depends(db),
) -> list[ChangeOut]:
    """What I have submitted, and what became of it."""
    rows = await pool.fetch(
        """SELECT c.*, p.name AS province, u.full_name AS submitter, d.full_name AS decider
             FROM pending_change c
             JOIN province p ON p.id = c.province_id
             JOIN app_user u ON u.id = c.submitted_by
             LEFT JOIN app_user d ON d.id = c.decided_by
            WHERE c.submitted_by = $1
            ORDER BY c.submitted_at DESC LIMIT 100""", user.id)
    return [ChangeOut(
        id=r["id"], kind=r["kind"], province=r["province"], summary=r["summary"],
        submittedBy=r["submitter"], submittedAt=r["submitted_at"].isoformat(),
        status=r["status"], decidedBy=r["decider"],
        decidedAt=r["decided_at"].isoformat() if r["decided_at"] else None,
        decisionNote=r["decision_note"]) for r in rows]


@router.post("/{change_id}/cancel")
async def cancel(
    change_id: int,
    user: CurrentUser = Depends(get_current_user),
    pool: asyncpg.Pool = Depends(db),
) -> dict:
    async with pool.acquire() as conn:
        c = await _get(conn, change_id, None)
        if c["submitted_by"] != user.id:
            raise HTTPException(403, "only the person who submitted a change may withdraw it")
        await conn.execute(
            """UPDATE pending_change SET status = 'cancelled', decided_by = $2, decided_at = now(),
                      decision_note = 'withdrawn by the submitter', file_body = NULL
                WHERE id = $1""", change_id, user.id)
    return {"id": change_id, "status": "cancelled"}
