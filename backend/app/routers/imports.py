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
import re
import logging
import os
import tempfile
from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from pydantic import BaseModel

from app.deps import CurrentUser, db, get_current_user
from app.importer.load_template import AGG_HINT, load_workbook_values
from app.importer.template_writer import build_climate_workbook, build_profile_workbook
from app.routers.reference import COLLECTION_PERIODS

log = logging.getLogger(__name__)

router = APIRouter(prefix="/import", tags=["import"])

MAX_BYTES = 20 * 1024 * 1024

IMPORT_ROLES = ("admin", "data_officer")


def require_import_role(user: CurrentUser) -> None:
    """The import tab writes the OFFICIAL data track. QA 26 Sep 2026: an
    external expert account was loading sector workbooks here, straight into
    the published figures, because `may_write_profile` answers "which sector
    and province" and never "which role". Experts and community members give
    their own figures on the map instead (routers/assessments.py), which writes
    their own track and never the official one."""
    if not any(user.has_role(r) for r in IMPORT_ROLES):
        raise HTTPException(
            403, "workbook import loads the official data and is for data "
                 "officers. As an expert or community member, add your own "
                 "assessment on the map: select a DS division, choose the "
                 "sector, hazard and your track, and enter the values there.")


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


class ColumnOut(BaseModel):
    """A variable column described as the workbook describes it -- domain,
    human name and entry rule, not just the catalogue code. `order` is the
    profile's column order; the grid must render in it rather than sorting."""
    code: str
    name: str
    domain: Optional[str]
    unit: Optional[str]
    hint: Optional[str]
    order: int


class DivisionOut(BaseModel):
    code: str
    name: str


class WeightRowOut(BaseModel):
    """One WEIGHTS-tab row, proposed against saved. ADVISORY -- see
    `load_template.WeightRead`. No endpoint in this module writes a weight."""
    variableCode: str
    variableName: Optional[str]
    domain: Optional[str]
    legacyPct: Optional[float]
    proposedPct: Optional[float]
    currentPct: Optional[float]
    inProfile: bool
    status: str


class WeightDomainTotalOut(BaseModel):
    """Totals per domain, so the confirmation screen never has to add up the
    rows itself and reach a different number than the panel's sheet did."""
    domain: str
    proposedTotal: float
    currentTotal: float
    proposedCount: int


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
    valuesAdded: int = 0
    # The WEIGHTS tab, read and returned for confirmation. `weightsTabPresent`
    # is False for a workbook generated before that tab existed, which is not
    # the same as a tab that was present and empty.
    weightsTabPresent: bool = False
    weights: list[WeightRowOut] = []
    weightTotals: list[WeightDomainTotalOut] = []
    # Every period tab the file carried, empty ones included. The review grid
    # builds its tab strip from THIS, not from the values: a period tab that
    # came through empty must still appear, saying it is empty, rather than
    # silently not being offered.
    periods: list[str] = []
    # The column contract as a person reads it, and EVERY division of the
    # province -- including one whose row in the file is entirely blank, which
    # is exactly the row someone needs to see in order to fill it in.
    columns: list[ColumnOut] = []
    divisionsAll: list[DivisionOut] = []


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
    # False when a later import carrying the same variable has since written
    # this cell -- the value shown is still the one in the database.
    fromThisImport: bool = True
    lastImportedBy: Optional[str] = None


class BatchDetail(BaseModel):
    """One import batch, opened from the list.

    `columns` is here for the same reason it is on ImportReport: the grid shows
    a variable as the workbook shows it -- domain, name, entry rule -- and
    without this it fell back to labelling every column with the bare code
    twice over. Taken from the values the batch actually wrote, since a batch
    is not necessarily tied to one profile."""
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
    columns: list[ColumnOut] = []
    periods: list[str] = []
    # Every division of the batch's province. Without it a period the batch
    # wrote nothing for renders as a header and no rows at all, which looks
    # like a broken screen rather than an empty period.
    divisionsAll: list[DivisionOut] = []
    # The active profile this batch's values feed (its own code may be a V1
    # issue stamp), and how many of the cells shown this batch itself wrote.
    currentProfileCode: Optional[str] = None
    fromThisImport: int = 0


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
    require_import_role(user)
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
        await _note_previous(pool, result, batch_id)
        return ImportReport(
            # The reader names the file it was handed, which is a temp path.
            # Report the name the person actually uploaded.
            filename=file.filename or result.filename,
            profileCode=result.profile_code,
            dryRun=dry_run, ok=True, valuesRead=result.values_read,
            valuesLoaded=result.values_loaded, divisions=result.divisions,
            batchId=batch_id, errors=[], warnings=result.warnings,
            rows=_rows_out(result.rows), editsApplied=result.edits_applied,
            valuesAdded=result.values_added,
            weightsTabPresent=result.weights_tab_present,
            weights=_weights_out(result.weights),
            weightTotals=_weight_totals(result.weights),
            periods=result.periods, columns=_columns_out(result.columns),
            divisionsAll=_divisions_out(result.divisions_all))
    except _Done as done:
        r = done.result
        if r.ok:
            await _note_previous(pool, r, None)
        return ImportReport(
            filename=file.filename or r.filename, profileCode=r.profile_code,
            dryRun=dry_run,
            ok=r.ok, valuesRead=r.values_read,
            valuesLoaded=0, divisions=r.divisions, batchId=None,
            errors=r.errors, warnings=r.warnings,
            rows=_rows_out(r.rows), editsApplied=r.edits_applied,
            valuesAdded=r.values_added,
            weightsTabPresent=r.weights_tab_present,
            weights=_weights_out(r.weights),
            weightTotals=_weight_totals(r.weights),
            periods=r.periods, columns=_columns_out(r.columns),
            divisionsAll=_divisions_out(r.divisions_all))
    finally:
        os.unlink(tmp.name)


async def _note_previous(pool: asyncpg.Pool, result, batch_id: Optional[int]) -> None:
    """Say so when this profile has been imported before (QA 26 Sep 2026: the
    same Paddy / Drought workbook was loaded eight times in one afternoon with
    nothing on screen to show it had already gone in). Not a refusal -- the
    latest import is meant to supersede -- but it should never be a surprise."""
    if not result.profile_code:
        return
    prev = await pool.fetchrow(
        """SELECT b.uploaded_at, u.full_name, count(*) OVER () AS n
             FROM import_batch b LEFT JOIN app_user u ON u.id = b.uploaded_by
            WHERE b.profile_code = $1 AND b.status = 'loaded'
              AND ($2::bigint IS NULL OR b.id <> $2)
            ORDER BY b.uploaded_at DESC LIMIT 1""", result.profile_code, batch_id)
    if prev is None:
        return
    result.warnings.insert(0,
        "%s has been imported %d time(s) before, most recently on %s by %s. "
        "Importing again replaces the official values this file carries."
        % (result.profile_code, prev["n"], prev["uploaded_at"].strftime("%d %b %Y %H:%M"),
           prev["full_name"] or "unknown"))


class ProfileInfo(BaseModel):
    profileCode: str
    version: int
    variables: int


async def _active_profile(conn, province: str, sector: str,
                          subsector: Optional[str], hazard: str):
    row = await conn.fetchrow(
        """
        SELECT vp.id, vp.code, vp.version,
               (SELECT count(*) FROM profile_indicator pi WHERE pi.profile_id = vp.id) AS n
          FROM vulnerability_profile vp
          JOIN province p ON p.id = vp.province_id
          JOIN sector s ON s.id = vp.sector_id
          LEFT JOIN subsector ss ON ss.id = vp.subsector_id
          JOIN hazard_type h ON h.id = vp.hazard_type_id
         WHERE vp.is_active AND p.name = $1 AND s.name = $2
           AND COALESCE(ss.name, '') = COALESCE($3, '') AND h.name = $4
        """, province, sector, subsector or None, hazard)
    if row is None:
        raise HTTPException(404, "no active profile for %s / %s / %s / %s"
                            % (province, sector, subsector or "-", hazard))
    return row


@router.get("/profile", response_model=ProfileInfo)
async def active_profile(
    province: str, sector: str, hazard: str, subsector: Optional[str] = None,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> ProfileInfo:
    """Which profile version an import with these pickers lands in."""
    async with pool.acquire() as conn:
        row = await _active_profile(conn, province, sector, subsector, hazard)
    return ProfileInfo(profileCode=row["code"], version=row["version"], variables=row["n"])


@router.get("/template")
async def template(
    province: str, sector: str, hazard: str, subsector: Optional[str] = None,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> Response:
    """The upload workbook for the ACTIVE profile, current values pre-filled.
    See app/importer/template_writer.py for why this exists."""
    require_import_role(user)
    async with pool.acquire() as conn:
        row = await _active_profile(conn, province, sector, subsector, hazard)
        pid = await conn.fetchval("SELECT id FROM province WHERE name = $1", province)
        may_hazard = bool(await conn.fetchval("SELECT may_write_hazard($1, $2)", user.id, pid))
        name, body = await build_profile_workbook(conn, row["id"], list(COLLECTION_PERIODS),
                                                  include_hazard=may_hazard)
    return Response(
        content=body,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="%s"' % name})


@router.get("/climate-template")
async def climate_template(
    province: str,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> Response:
    """The province's CLIMATE upload workbook, columns read from that
    province's own active profiles (not a national list), values pre-filled.
    See build_climate_workbook()."""
    require_import_role(user)
    async with pool.acquire() as conn:
        try:
            name, body = await build_climate_workbook(conn, province, list(COLLECTION_PERIODS))
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
    return Response(
        content=body,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="%s"' % name})


def _rows_out(rows) -> list[PreviewRowOut]:
    return [PreviewRowOut(period=r.period, dsCode=r.ds_code, dsName=r.ds_name,
                          variableCode=r.variable_code, value=r.value,
                          current=r.current, edited=r.edited)
            for r in rows]


def _columns_out(cols) -> list[ColumnOut]:
    return [ColumnOut(code=c.code, name=c.name, domain=c.domain, unit=c.unit,
                      hint=c.hint, order=c.order) for c in cols]


def _divisions_out(divs) -> list[DivisionOut]:
    return [DivisionOut(code=d.code, name=d.name) for d in divs]


def _weights_out(weights) -> list[WeightRowOut]:
    return [WeightRowOut(
        variableCode=w.variable_code, variableName=w.variable_name,
        domain=w.domain, legacyPct=w.legacy_pct, proposedPct=w.proposed_pct,
        currentPct=w.current_pct, inProfile=w.in_profile, status=w.status)
        for w in weights]


def _weight_totals(weights) -> list[WeightDomainTotalOut]:
    """Summed over what each column actually states. A variable with no
    proposal contributes nothing to the proposed total and a variable with no
    saved weight nothing to the current one -- blank is 'not decided', and
    counting it as zero would make an unfinished sheet look like it totals
    correctly, or a finished one look short."""
    acc: dict[str, dict[str, float]] = {}
    for w in weights:
        if not w.domain or not w.in_profile:
            continue
        d = acc.setdefault(w.domain, {"p": 0.0, "c": 0.0, "n": 0.0})
        if w.proposed_pct is not None:
            d["p"] += w.proposed_pct
            d["n"] += 1
        if w.current_pct is not None:
            d["c"] += w.current_pct
    return [WeightDomainTotalOut(domain=k, proposedTotal=round(v["p"], 4),
                                 currentTotal=round(v["c"], 4),
                                 proposedCount=int(v["n"]))
            for k, v in sorted(acc.items())]


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


def _issue_stamp(sector: str, subsector: Optional[str], hazard: str, prov_code: str) -> str:
    """The code design/templates/generate_templates.py printed into `_META` for
    this scope, minus the version -- e.g. Livestock / Poultry Farming / Flood /
    CEN -> POULTRY_FLOOD_CEN. Kept identical to its `profile_code()`."""
    base = (subsector or sector).upper().replace(" SECTOR", "").replace(" FARMING", "")
    base = re.sub(r"[^A-Z0-9]+", "_", base).strip("_")
    return "%s_%s_%s" % (base, hazard.upper(), prov_code)


async def _resolve_profile(conn, profile_code: Optional[str]) -> Optional[asyncpg.Record]:
    """The ACTIVE profile a batch belongs to, from whatever code it recorded.

    Three spellings exist in import_batch.profile_code: the active code (imports
    since 26 Sep), a code the weights editor has since retired (V2 after a save
    made V3), and the generator's `_V1` issue stamp, which uses different names
    (POULTRY_FLOOD_CEN_V1 for POULTRY_FARMING_FLOOD_CEN_V2). The old join on
    `vp.code = b.profile_code` matched only the first, so every other sector
    batch was treated as a CLIMATE batch -- no sector, hazard grant required to
    correct it -- and its view could not list the profile's columns."""
    if not profile_code:
        return None
    q = """
        SELECT a.id, a.code, a.province_id, a.sector_id, a.subsector_id
          FROM vulnerability_profile a
         WHERE a.is_active AND (a.province_id, a.sector_id,
                                COALESCE(a.subsector_id, 0), a.hazard_type_id) = (
               SELECT o.province_id, o.sector_id, COALESCE(o.subsector_id, 0),
                      o.hazard_type_id
                 FROM vulnerability_profile o WHERE o.code = $1 LIMIT 1)
    """
    row = await conn.fetchrow(q, profile_code)
    if row is not None:
        return row
    stem = re.sub(r"_V\d+$", "", profile_code.upper())
    for r in await conn.fetch(
            """
            SELECT vp.id, vp.code, vp.province_id, vp.sector_id, vp.subsector_id,
                   s.name AS sector, ss.name AS subsector, h.name AS hazard,
                   p.code AS prov_code
              FROM vulnerability_profile vp
              JOIN sector s ON s.id = vp.sector_id
              LEFT JOIN subsector ss ON ss.id = vp.subsector_id
              JOIN hazard_type h ON h.id = vp.hazard_type_id
              JOIN province p ON p.id = vp.province_id
             WHERE vp.is_active AND p.code = split_part($1, '_', -1)
            """, stem):
        if _issue_stamp(r["sector"], r["subsector"], r["hazard"], r["prov_code"]) == stem:
            return r
    return None


async def _batch_scope(conn, batch_id: int) -> dict:
    """The batch, the province it wrote into, and the profile scope that governs
    who may change it. A climate batch has no profile -- `sector_id` is None and
    the hazard grant is the only authority that applies."""
    row = await conn.fetchrow(
        """
        SELECT b.id, b.filename, b.profile_code, b.status,
               b.uploaded_at, u.full_name,
               COALESCE(b.province_id, pv.province_id) AS province_id
          FROM import_batch b
          LEFT JOIN app_user u ON u.id = b.uploaded_by
        """ + _BATCH_PROVINCE + """
         WHERE b.id = $1
        """, batch_id)
    if row is None:
        raise HTTPException(404, "no such import")
    out = dict(row)
    prof = await _resolve_profile(conn, row["profile_code"])
    out["profile_id"] = prof["id"] if prof else None
    out["active_code"] = prof["code"] if prof else None
    out["sector_id"] = prof["sector_id"] if prof else None
    out["subsector_id"] = prof["subsector_id"] if prof else None
    if out["province_id"] is None and prof is not None:
        # Seed batches were never stamped with a province, and once a later
        # import has taken over their values there is nothing left to derive
        # it from -- the profile still knows.
        out["province_id"] = prof["province_id"]
    out["province"] = await conn.fetchval(
        "SELECT name FROM province WHERE id = $1", out["province_id"]) \
        if out["province_id"] else None
    return out


def _readable(user: CurrentUser, row) -> None:
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
        # WHAT IS IN THE DATABASE NOW FOR THIS WORKBOOK'S COLUMNS, not only the
        # rows whose import_batch_id is still this batch (QA 26 Sep 2026).
        #
        # An official value belongs to the division, so the latest import that
        # carries a variable takes the row over (load_template, "the latest
        # import supersedes"). The twelve climate variables sit in most sector
        # workbooks and the poultry exposure variables sit in both poultry
        # workbooks, so Central's POULTRY_DROUGHT batch ended up owning ZERO
        # rows -- "This import wrote no values" -- and others showed a few
        # columns out of the whole workbook. The values were all there and the
        # map was right; the view was not. So a sector batch now shows its
        # profile's full column set with the current value of every cell, and
        # says which cells a later import last wrote.
        if b["profile_id"] is not None:
            rows = await conn.fetch(
                """
                SELECT v.id, d.code AS ds_code, d.name AS ds_name,
                       ic.code AS variable_code, ic.domain, v.raw_value,
                       v.year_start, v.year_end, v.import_batch_id,
                       ob.profile_code AS owner_code
                  FROM indicator_value v
                  JOIN ds_division d        ON d.id = v.ds_division_id
                  JOIN indicator_catalog ic ON ic.id = v.indicator_id
                  JOIN profile_indicator pi ON pi.indicator_id = v.indicator_id
                                           AND pi.profile_id = $1
                  LEFT JOIN import_batch ob ON ob.id = v.import_batch_id
                 WHERE d.province_id = $2 AND v.source = 'data'
                   AND v.scenario_id IS NULL
                 ORDER BY v.year_start, d.code, ic.code
                """, b["profile_id"], b["province_id"])
        else:
            rows = await conn.fetch(
                """
                SELECT v.id, d.code AS ds_code, d.name AS ds_name,
                       ic.code AS variable_code, ic.domain, v.raw_value,
                       v.year_start, v.year_end, v.import_batch_id,
                       NULL::text AS owner_code
                  FROM indicator_value v
                  JOIN ds_division d       ON d.id = v.ds_division_id
                  JOIN indicator_catalog ic ON ic.id = v.indicator_id
                 WHERE v.import_batch_id = $1
                 ORDER BY v.year_start, d.code, ic.code
                """, batch_id)
        editable = await _may_edit(conn, user, b)
        # The column contract for exactly the variables this batch wrote, in
        # the same shape the review grid gets -- hazard first, then code, which
        # is the workbook's own order.
        divs = await conn.fetch(
            """
            SELECT code, name FROM ds_division
             WHERE province_id = $1 ORDER BY name
            """, b["province_id"]) if b["province_id"] else []
        if b["profile_id"] is not None:
            # Every column of the profile, including one with no value anywhere
            # -- that empty column is exactly what someone needs to see.
            codes = [r["code"] for r in await conn.fetch(
                """SELECT ic.code FROM profile_indicator pi
                     JOIN indicator_catalog ic ON ic.id = pi.indicator_id
                    WHERE pi.profile_id = $1""", b["profile_id"])]
        else:
            codes = sorted({r["variable_code"] for r in rows})
        cols = await conn.fetch(
            """
            SELECT code, name, domain, unit, period_aggregation
              FROM indicator_catalog
             WHERE code = ANY($1::text[])
             ORDER BY (domain <> 'hazard'), code
            """, codes) if codes else []
    divisions_all = [DivisionOut(code=d["code"], name=d["name"]) for d in divs]
    columns = [ColumnOut(code=c["code"], name=c["name"] or c["code"],
                         domain=c["domain"], unit=c["unit"],
                         hint=AGG_HINT.get(c["period_aggregation"]), order=i)
               for i, c in enumerate(cols)]
    return BatchDetail(
        id=b["id"], filename=b["filename"], profileCode=b["profile_code"],
        status=b["status"], province=b["province"],
        uploadedAt=b["uploaded_at"].isoformat(), uploadedBy=b["full_name"],
        editable=editable, columns=columns,
        periods=list(COLLECTION_PERIODS), divisionsAll=divisions_all,
        currentProfileCode=b["active_code"],
        fromThisImport=sum(1 for r in rows if r["import_batch_id"] == batch_id),
        values=[ValueRow(
            id=r["id"], dsCode=r["ds_code"], dsName=r["ds_name"],
            variableCode=r["variable_code"], domain=r["domain"],
            value=r["raw_value"],
            period="%s-%s" % (r["year_start"], r["year_end"])
                   if r["year_start"] else "",
            fromThisImport=r["import_batch_id"] == batch_id,
            lastImportedBy=None if r["import_batch_id"] == batch_id else r["owner_code"])
            for r in rows])


async def _may_edit(conn, user: CurrentUser, b) -> bool:
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
    require_import_role(user)
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
                     WHERE v.id = ANY($2::bigint[])
                       AND ic.domain = 'hazard' AND $1::bigint IS NOT NULL)
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
                     WHERE id = $1 AND source = 'data'
                       AND (import_batch_id = $2
                            -- a cell of this workbook that a later import
                            -- carrying the same variable last wrote: shown in
                            -- this view, so correctable from it, under the same
                            -- grant (checked above) and the same profile.
                            OR ($5::bigint IS NOT NULL AND EXISTS (
                                SELECT 1 FROM profile_indicator pi
                                  JOIN ds_division d ON d.id = indicator_value.ds_division_id
                                 WHERE pi.profile_id = $5
                                   AND pi.indicator_id = indicator_value.indicator_id
                                   AND d.province_id = $6)))
                     RETURNING id
                    """, e.id, batch_id, e.value,
                    user.full_name or user.email, b["profile_id"], b["province_id"])
                if row is None:
                    raise HTTPException(
                        400, "value %d does not belong to this import" % e.id)
                updated += 1
    return CorrectionReport(
        updated=updated, province=b["province"],
        # The map shows yesterday's answer until the engine runs, and nothing on
        # screen would say so. Telling the caller is the whole point.
        recomputeNeeded=True)
