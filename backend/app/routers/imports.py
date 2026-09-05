"""
Workbook import -- Stage 3.2 / 3.4 / 3.7, SRS section 9 `/imports`.

    POST /api/import/check    upload, validate, WRITE NOTHING
    POST /api/import/load     upload, validate, load atomically
    GET  /api/import/batches  what has been imported, most recent first

TWO STEPS BECAUSE A REPORT YOU CANNOT ACT ON IS NOT A REPORT.
`check` runs the identical code path as `load` up to the last statement and then
returns instead of writing. That matters more than it sounds: a validator that
is a separate implementation from the loader will eventually disagree with it,
and the disagreement surfaces as "it passed the check and then failed to load",
which destroys trust in both. Same function, one flag.

NOTHING LOADS PARTIALLY (FR-2.3). A file either loads completely or not at all,
and every error is reported together rather than stopping at the first, so one
upload gives the whole list to fix.

THE FILE IS AUTHORITATIVE ABOUT WHAT IT IS; THE UPLOADER IS ASKED ANYWAY.
`_META` names the profile, so the sector and hazard chosen in the UI are not how
the file is routed -- they are a cross-check. A mismatch is refused. Uploading
the right workbook under the wrong sector is an easy slip and an expensive one:
the values would key to real divisions under a real profile and look entirely
plausible afterwards.

REVIEW COPIES ARE DETECTED, NOT DECLARED. A workbook stamped
`protection = unlocked-review` was issued open for a panel to restructure, so
its own `_META` no longer describes its columns and the contract comes from the
profile instead. The person uploading should not have to know which kind they
were sent.

AUTHENTICATED, ALWAYS (NFR-4 default deny). The map is public; writing indicator
values is not. Every row records who imported it.
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.deps import CurrentUser, db, get_current_user
from app.importer.load_template import load_workbook_values

log = logging.getLogger(__name__)

router = APIRouter(prefix="/import", tags=["import"])

MAX_BYTES = 20 * 1024 * 1024


class ImportReport(BaseModel):
    filename: str
    profileCode: Optional[str]
    dryRun: bool
    ok: bool
    valuesRead: int
    valuesLoaded: int
    divisions: int
    batchId: Optional[int]
    errors: list[str]
    warnings: list[str]


class BatchRow(BaseModel):
    id: int
    filename: str
    profileCode: Optional[str]
    status: str
    rowsTotal: Optional[int]
    rowsLoaded: Optional[int]
    errorCount: int
    uploadedAt: str
    uploadedBy: Optional[str]


async def _run(pool: asyncpg.Pool, file: UploadFile, user: CurrentUser,
               scope: Optional[tuple[str, str, Optional[str], str]],
               dry_run: bool) -> ImportReport:
    if not (file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(400, "expected an .xlsx upload template")
    body = await file.read()
    if len(body) > MAX_BYTES:
        raise HTTPException(413, "file is larger than 20 MB")

    tmp = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
    try:
        tmp.write(body)
        tmp.close()

        async with pool.acquire() as conn:
            async with conn.transaction():
                batch_id = await conn.fetchval(
                    """INSERT INTO import_batch (filename, status, uploaded_by)
                       VALUES ($1, 'uploaded', $2) RETURNING id""",
                    file.filename, user.id)
                result = await load_workbook_values(
                    conn, tmp.name, batch_id=batch_id, user_id=user.id,
                    expect_scope=scope, dry_run=dry_run)
                await conn.execute(
                    """UPDATE import_batch
                          SET profile_code = $2, status = $3, rows_total = $4,
                              rows_loaded = $5, error_count = $6, error_detail = $7
                        WHERE id = $1""",
                    batch_id, result.profile_code,
                    # import_status enum: uploaded | validated | loaded |
                    # rejected | rolled_back. A dry run that passes is
                    # 'validated' -- there is no 'staged' state, and inventing
                    # one in Python would have failed only at the enum cast.
                    ('validated' if dry_run else 'loaded') if result.ok else 'rejected',
                    result.values_read, 0 if dry_run else result.values_loaded,
                    len(result.errors),
                    json.dumps(result.errors) if result.errors else None)
                if dry_run or not result.ok:
                    # A check never keeps its values, and a failed load never
                    # keeps anything at all -- including its own batch row, so a
                    # rejected upload cannot be mistaken for a partial one.
                    raise _Done(result, batch_id if not dry_run else None)
        return ImportReport(
            # The reader names the file it was handed, which is a temp path.
            # Report the name the person actually uploaded.
            filename=file.filename or result.filename,
            profileCode=result.profile_code,
            dryRun=dry_run, ok=True, valuesRead=result.values_read,
            valuesLoaded=result.values_loaded, divisions=result.divisions,
            batchId=batch_id, errors=[], warnings=result.warnings)
    except _Done as done:
        r = done.result
        return ImportReport(
            filename=file.filename or r.filename, profileCode=r.profile_code,
            dryRun=dry_run,
            ok=r.ok, valuesRead=r.values_read,
            valuesLoaded=0, divisions=r.divisions, batchId=None,
            errors=r.errors, warnings=r.warnings)
    finally:
        os.unlink(tmp.name)


class _Done(Exception):
    def __init__(self, result, batch_id):
        super().__init__("rollback")
        self.result = result
        self.batch_id = batch_id


def _scope(province: Optional[str], sector: Optional[str],
           subsector: Optional[str], hazard: Optional[str]):
    if not (province and sector and hazard):
        return None
    return (province, sector, subsector or None, hazard)


@router.post("/check", response_model=ImportReport)
async def check(
    file: UploadFile = File(...),
    province: Optional[str] = Form(None),
    sector: Optional[str] = Form(None),
    subsector: Optional[str] = Form(None),
    hazard: Optional[str] = Form(None),
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> ImportReport:
    return await _run(pool, file, user,
                      _scope(province, sector, subsector, hazard), dry_run=True)


@router.post("/load", response_model=ImportReport)
async def load(
    file: UploadFile = File(...),
    province: Optional[str] = Form(None),
    sector: Optional[str] = Form(None),
    subsector: Optional[str] = Form(None),
    hazard: Optional[str] = Form(None),
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> ImportReport:
    return await _run(pool, file, user,
                      _scope(province, sector, subsector, hazard), dry_run=False)


@router.get("/batches", response_model=list[BatchRow])
async def batches(
    limit: int = 25,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> list[BatchRow]:
    rows = await pool.fetch(
        """
        SELECT b.id, b.filename, b.profile_code, b.status, b.rows_total,
               b.rows_loaded, b.error_count, b.uploaded_at, u.full_name
          FROM import_batch b
          LEFT JOIN app_user u ON u.id = b.uploaded_by
         ORDER BY b.uploaded_at DESC, b.id DESC
         LIMIT $1
        """, min(limit, 200))
    return [BatchRow(
        id=r["id"], filename=r["filename"], profileCode=r["profile_code"],
        status=r["status"], rowsTotal=r["rows_total"], rowsLoaded=r["rows_loaded"],
        errorCount=r["error_count"], uploadedAt=r["uploaded_at"].isoformat(),
        uploadedBy=r["full_name"]) for r in rows]
