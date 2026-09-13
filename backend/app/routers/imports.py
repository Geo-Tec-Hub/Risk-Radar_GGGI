"""
Workbook import -- Stage 3.2 / 3.4 / 3.7, SRS section 9 `/imports`.

    POST /api/import/check          upload, validate, WRITE NOTHING
    POST /api/import/load           upload, validate, load atomically
    GET  /api/import/batches        what has been imported, most recent first
    GET  /api/import/batches/{id}   the values one import actually wrote
    PUT  /api/import/batches/{id}/values   correct some of them

A BATCH LIST IS SCOPED TO THE READER'S PROVINCE. An officer who writes in one
province has no business browsing another's uploads, and a list of every
province's imports is also unusable for the person who has to find their own.
Administrators still see everything, and pass ?province= to narrow it.

A LOADED BATCH CAN BE CORRECTED IN PLACE, UNDER THE SAME AUTHORITY AS THE
IMPORT. The pre-load preview already lets a reviewer fix a cell before it is
written; the same mistake found a day later had no answer but re-uploading the
whole workbook. An edit here may only change a value the batch itself wrote --
it cannot introduce a new fact, so the file stays the statement of what was
imported and the edit is a recorded correction to it. `may_write_profile` and
`may_write_hazard` are asked exactly as the loader asks them, so a correction
can never reach further than the upload could. Results are NOT recomputed
automatically: the map reads `vulnerability_result`, which only the engine
writes, so the response says a recompute is owed and the caller runs it.

TWO STEPS BECAUSE A REPORT YOU CANNOT ACT ON IS NOT A REPORT.
`check` runs the identical code path as `load` up to the last statement and then
returns instead of writing. That matters more than it sounds: a validator that
is a separate implementation from the loader will eventually disagree with it,
and the disagreement surfaces as "it passed the check and then failed to load",
which destroys trust in both. Same function, one flag.

NOTHING LOADS PARTIALLY (FR-2.3). A file either loads completely or not at all,
and every error is reported together rather than stopping at the first, so one
upload gives the whole list to fix.

TWO KINDS OF WORKBOOK, ONE ENDPOINT. `_META.kind` says whether a file is a
sector workbook or a province-wide CLIMATE workbook, and the loader branches on
it. The UI sends no sector or hazard for a climate file -- there is none to send
-- so `_scope` narrows the cross-check to the province rather than skipping it.

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


class PreviewRowOut(BaseModel):
    period: str
    dsCode: str
    dsName: str
    variableCode: str
    value: float
    current: Optional[float]
    edited: bool


class EditIn(BaseModel):
    """One correction the reviewer made in the preview table. It replaces the
    workbook's value for a cell the workbook already has -- an edit cannot
    introduce a value the file did not carry, so the file stays the statement of
    what was imported and the edit is a recorded correction to it."""
    period: str
    dsCode: str
    variableCode: str
    value: float


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
    # Populated on a dry run only: every value the file would write, with what
    # is in the database today beside it.
    rows: list[PreviewRowOut] = []
    editsApplied: int = 0


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
    province: Optional[str] = None


class ValueRow(BaseModel):
    """One value an import wrote, as it stands now -- not as the file had it.
    `id` is the stored value's own id, which is what a correction names: a
    correction changes a fact this batch wrote and can never introduce a new
    one."""
    id: int
    dsCode: str
    dsName: str
    variableCode: str
    domain: str
    value: float
    period: str


class BatchDetail(BaseModel):
    id: int
    filename: str
    profileCode: Optional[str]
    status: str
    province: Optional[str]
    uploadedAt: str
    uploadedBy: Optional[str]
    # Whether THIS reader may correct it, answered by the same grant that
    # governs uploading. The UI uses it to decide whether to offer editing at
    # all -- the server checks again on the way in regardless.
    editable: bool
    values: list[ValueRow]


class CorrectionIn(BaseModel):
    id: int
    value: float


class CorrectionBody(BaseModel):
    edits: list[CorrectionIn]


class CorrectionReport(BaseModel):
    updated: int
    province: Optional[str]
    recomputeNeeded: bool


def _parse_edits(raw: Optional[str]) -> dict[tuple[str, str, str], float]:
    if not raw:
        return {}
    try:
        items = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(400, "corrections could not be read: %s" % exc) from exc
    if not isinstance(items, list):
        raise HTTPException(400, "corrections must be a list")
    out: dict[tuple[str, str, str], float] = {}
    for item in items:
        e = EditIn(**item)
        out[(e.period, e.dsCode, e.variableCode)] = e.value
    return out


async def _run(pool: asyncpg.Pool, file: UploadFile, user: CurrentUser,
               scope: Optional[tuple[str, str, Optional[str], str]],
               dry_run: bool,
               edits: Optional[dict[tuple[str, str, str], float]] = None) -> ImportReport:
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
                    expect_scope=scope, dry_run=dry_run, edits=edits)
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
                if not dry_run and result.ok:
                    # Stamp the province from the rows just written, so the
                    # batch list can be scoped without re-deriving it every
                    # time. Taken from the values rather than from the form:
                    # the form is a cross-check, the values are where the
                    # import actually landed.
                    await conn.execute(
                        """
                        UPDATE import_batch b
                           SET province_id = COALESCE(b.province_id, (
                                   SELECT d.province_id
                                     FROM indicator_value v
                                     JOIN ds_division d ON d.id = v.ds_division_id
                                    WHERE v.import_batch_id = b.id
                                    LIMIT 1))
                         WHERE b.id = $1
                        """, batch_id)
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
            batchId=batch_id, errors=[], warnings=result.warnings,
            rows=_rows_out(result.rows), editsApplied=result.edits_applied)
    except _Done as done:
        r = done.result
        return ImportReport(
            filename=file.filename or r.filename, profileCode=r.profile_code,
            dryRun=dry_run,
            ok=r.ok, valuesRead=r.values_read,
            valuesLoaded=0, divisions=r.divisions, batchId=None,
            errors=r.errors, warnings=r.warnings,
            rows=_rows_out(r.rows), editsApplied=r.edits_applied)
    finally:
        os.unlink(tmp.name)


def _rows_out(rows) -> list[PreviewRowOut]:
    return [PreviewRowOut(period=r.period, dsCode=r.ds_code, dsName=r.ds_name,
                          variableCode=r.variable_code, value=r.value,
                          current=r.current, edited=r.edited)
            for r in rows]


class _Done(Exception):
    def __init__(self, result, batch_id):
        super().__init__("rollback")
        self.result = result
        self.batch_id = batch_id


def _scope(province: Optional[str], sector: Optional[str],
           subsector: Optional[str], hazard: Optional[str]):
    if not province:
        return None
    if not (sector and hazard):
        # A climate workbook is province-wide, so the UI sends the province
        # alone. Returning None here instead would drop the cross-check
        # entirely -- including the province -- and Central's rainfall written
        # onto Uva's divisions is exactly the plausible-looking mistake the
        # cross-check exists to catch. A SECTOR file uploaded with these fields
        # missing still fails, because the loader compares the whole tuple and
        # the file's own _META names a sector.
        return (province, None, None, None)
    return (province, sector, subsector or None, hazard)


@router.post("/check", response_model=ImportReport)
async def check(
    file: UploadFile = File(...),
    province: Optional[str] = Form(None),
    sector: Optional[str] = Form(None),
    subsector: Optional[str] = Form(None),
    hazard: Optional[str] = Form(None),
    edits: Optional[str] = Form(None),
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> ImportReport:
    return await _run(pool, file, user,
                      _scope(province, sector, subsector, hazard), dry_run=True,
                      edits=_parse_edits(edits))


@router.post("/load", response_model=ImportReport)
async def load(
    file: UploadFile = File(...),
    province: Optional[str] = Form(None),
    sector: Optional[str] = Form(None),
    subsector: Optional[str] = Form(None),
    hazard: Optional[str] = Form(None),
    edits: Optional[str] = Form(None),
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> ImportReport:
    return await _run(pool, file, user,
                      _scope(province, sector, subsector, hazard), dry_run=False,
                      edits=_parse_edits(edits))


# The province a batch belongs to. `import_batch.province_id` is filled in from
# the loader's context on every import, but batches loaded before that was done
# carry NULL, so it is COALESCEd with the province of the divisions the batch
# actually wrote to. Derived rather than backfilled: the values are the evidence
# of where an import landed, and they cannot disagree with themselves.
_BATCH_PROVINCE = """
    LEFT JOIN LATERAL (
        SELECT d.province_id
          FROM indicator_value v
          JOIN ds_division d ON d.id = v.ds_division_id
         WHERE v.import_batch_id = b.id
         LIMIT 1) pv ON TRUE
    LEFT JOIN province p ON p.id = COALESCE(b.province_id, pv.province_id)
"""


def _province_filter(user: CurrentUser, asked: Optional[str]) -> tuple[Optional[int], Optional[str]]:
    """(province_id, province_name) to filter a batch list by.

    An administrator has no province of their own and sees every province unless
    they ask for one. Anyone else sees theirs and only theirs -- passing
    ?province= for somebody else's province is not an error to argue about, it
    is simply ignored in favour of their own."""
    if user.has_role("admin"):
        return None, asked
    return user.province_id, None


@router.get("/batches", response_model=list[BatchRow])
async def batches(
    limit: int = 25,
    province: Optional[str] = None,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> list[BatchRow]:
    prov_id, prov_name = _province_filter(user, province)
    rows = await pool.fetch(
        """
        SELECT b.id, b.filename, b.profile_code, b.status, b.rows_total,
               b.rows_loaded, b.error_count, b.uploaded_at, u.full_name,
               p.name AS province
          FROM import_batch b
          LEFT JOIN app_user u ON u.id = b.uploaded_by
        """ + _BATCH_PROVINCE + """
         WHERE ($2::smallint IS NULL
                OR COALESCE(b.province_id, pv.province_id) = $2)
           AND ($3::text IS NULL OR p.name = $3)
         ORDER BY b.uploaded_at DESC, b.id DESC
         LIMIT $1
        """, min(limit, 200), prov_id, prov_name)
    return [BatchRow(
        id=r["id"], filename=r["filename"], profileCode=r["profile_code"],
        status=r["status"], rowsTotal=r["rows_total"], rowsLoaded=r["rows_loaded"],
        errorCount=r["error_count"], uploadedAt=r["uploaded_at"].isoformat(),
        uploadedBy=r["full_name"], province=r["province"]) for r in rows]


async def _batch_scope(conn, batch_id: int) -> asyncpg.Record:
    """The batch, the province it wrote into, and the profile scope that governs
    who may change it. A climate batch has no sector -- `sector_id` is NULL and
    the hazard grant is the only authority that applies."""
    row = await conn.fetchrow(
        """
        SELECT b.id, b.filename, b.profile_code, b.status,
               b.uploaded_at, u.full_name,
               COALESCE(b.province_id, pv.province_id) AS province_id,
               p.name AS province,
               vp.sector_id, vp.subsector_id
          FROM import_batch b
          LEFT JOIN app_user u ON u.id = b.uploaded_by
        """ + _BATCH_PROVINCE + """
          LEFT JOIN vulnerability_profile vp ON vp.code = b.profile_code
         WHERE b.id = $1
        """, batch_id)
    if row is None:
        raise HTTPException(404, "no such import")
    return row


def _readable(user: CurrentUser, row: asyncpg.Record) -> None:
    if user.has_role("admin"):
        return
    if user.province_id is not None and row["province_id"] == user.province_id:
        return
    # Deliberately the same 404 a missing batch gets: whether an import exists in
    # another province is itself not this account's business.
    raise HTTPException(404, "no such import")


@router.get("/batches/{batch_id}", response_model=BatchDetail)
async def batch_detail(
    batch_id: int,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> BatchDetail:
    async with pool.acquire() as conn:
        b = await _batch_scope(conn, batch_id)
        _readable(user, b)
        rows = await conn.fetch(
            """
            SELECT v.id, d.code AS ds_code, d.name AS ds_name,
                   ic.code AS variable_code, ic.domain, v.raw_value,
                   v.year_start, v.year_end
              FROM indicator_value v
              JOIN ds_division d       ON d.id = v.ds_division_id
              JOIN indicator_catalog ic ON ic.id = v.indicator_id
             WHERE v.import_batch_id = $1
             ORDER BY v.year_start, d.code, ic.code
            """, batch_id)
        editable = await _may_edit(conn, user, b)
    return BatchDetail(
        id=b["id"], filename=b["filename"], profileCode=b["profile_code"],
        status=b["status"], province=b["province"],
        uploadedAt=b["uploaded_at"].isoformat(), uploadedBy=b["full_name"],
        editable=editable,
        values=[ValueRow(
            id=r["id"], dsCode=r["ds_code"], dsName=r["ds_name"],
            variableCode=r["variable_code"], domain=r["domain"],
            value=r["raw_value"],
            period="%s-%s" % (r["year_start"], r["year_end"])
                   if r["year_start"] else "") for r in rows])


async def _may_edit(conn, user: CurrentUser, b: asyncpg.Record) -> bool:
    """Asked of the database, exactly as the loader asks it. An administrator
    bypasses inside `may_write_profile` itself, so there is no second rule
    here."""
    if b["status"] != "loaded":
        return False
    if b["province_id"] is None:
        return False
    if b["sector_id"] is None:          # climate batch: hazard grant only
        return bool(await conn.fetchval(
            "SELECT may_write_hazard($1, $2)", user.id, b["province_id"]))
    return bool(await conn.fetchval(
        "SELECT may_write_profile($1, $2, $3, $4)",
        user.id, b["province_id"], b["sector_id"], b["subsector_id"]))


@router.put("/batches/{batch_id}/values", response_model=CorrectionReport)
async def correct_values(
    batch_id: int,
    body: CorrectionBody,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> CorrectionReport:
    if not body.edits:
        raise HTTPException(400, "no corrections were sent")
    async with pool.acquire() as conn:
        b = await _batch_scope(conn, batch_id)
        _readable(user, b)
        if b["status"] != "loaded":
            raise HTTPException(
                409, "only a loaded import can be corrected; this one is %s"
                     % b["status"])
        if not await _may_edit(conn, user, b):
            raise HTTPException(
                403, "you are not authorised to change values in this import. "
                     "The same grant that would let you upload this workbook is "
                     "what allows correcting it.")
        # Hazard columns are governed separately even inside a sector import --
        # the same split the loader enforces, for the same reason: those
        # variables are shared across most sectors and held centrally.
        if b["sector_id"] is not None:
            touches_hazard = await conn.fetchval(
                """
                SELECT EXISTS (
                    SELECT 1 FROM indicator_value v
                      JOIN indicator_catalog ic ON ic.id = v.indicator_id
                     WHERE v.import_batch_id = $1 AND v.id = ANY($2::bigint[])
                       AND ic.domain = 'hazard')
                """, batch_id, [e.id for e in body.edits])
            if touches_hazard and not await conn.fetchval(
                    "SELECT may_write_hazard($1, $2)", user.id, b["province_id"]):
                raise HTTPException(
                    403, "those are hazard (climate) values, which are shared "
                         "across most sectors and need the hazard-data grant "
                         "rather than a sector one. Nothing was changed.")

        async with conn.transaction():
            # ALL OR NOTHING, like the import itself. An id that is not this
            # batch's is refused rather than skipped: a silently-dropped
            # correction looks exactly like one that was applied.
            updated = 0
            for e in body.edits:
                row = await conn.fetchrow(
                    """
                    UPDATE indicator_value
                       SET raw_value = $3,
                           normalized_value = NULL,
                           updated_at = now(),
                           notes = trim(both E'\n' from
                                   COALESCE(notes, '') || E'\n' ||
                                   'corrected ' || to_char(now(), 'YYYY-MM-DD') ||
                                   ' by ' || $4)
                     WHERE id = $1 AND import_batch_id = $2
                     RETURNING id
                    """, e.id, batch_id, e.value,
                    user.full_name or user.email)
                if row is None:
                    raise HTTPException(
                        400, "value %d does not belong to this import" % e.id)
                updated += 1
    return CorrectionReport(
        updated=updated, province=b["province"],
        # The map shows yesterday's answer until the engine runs, and nothing on
        # screen would say so. Telling the caller is the whole point.
        recomputeNeeded=True)
