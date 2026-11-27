"""
Expert and community assessments -- the map entry form (QA 26 Sep 2026).

    GET  /api/assessments/form?province=CEN&sector=AGRICULTURE&subsector=PADDY
                              &hazard=flood&period=2021-2025&track=expert&ds=KA8
    POST /api/assessments       save my figures for one division, score it
    POST /api/assessments/remove  remove a division's assessment from the track
                                  (or, admin, the whole sector/hazard dataset)

WHY NOT THE WORKBOOK. The import tab is for the official data track: a data
officer loads a whole province from the Survey/Department workbooks. An external
expert or a community member works the other way round -- they select ONE DS
division on the map, choose a sector and hazard, and give their own figures for
that profile's hazard and exposure variables. The vulnerability is computed at
once (app/engine/track.py) and shown on the map under the chosen track.

WHO MAY WRITE WHICH TRACK.
    expert     an active account with the `expert` role, in its own province
               (SRS 3.2 binds an expert to one province, as it does an officer)
    community  an active account with the `community` role, any province
    admin      either track, for testing and support
Nobody writes the `data` track here -- that stays with the import tab.

TWO WAYS TO ASSESS (2 Oct 2026). `mode = "parameters"` sends a raw figure for
every weighted variable (as before). `mode = "index"` sends only a Hazard index
and a Potential Exposure index, each 0-1 (track_index_entry). Saving one clears
that person's entry of the other kind for the same division, scope and period,
so one person never mixes the two. The raw index and the normalised score are
computed by the engine in both cases.

EACH PERSON'S FIGURES ARE THEIR OWN. Rows are keyed by user (indicator_value_uniq
includes user_id), a new save replaces only that person's previous figures for
the division and period, and the track's score is the mean over contributors.
"""

from __future__ import annotations

import json
from typing import Literal, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.deps import CurrentUser, db, get_current_user, get_optional_user
from app.engine.track import (compute_track_division, contributors, index_entries,
                               rescale_track_profile)
from app.engine.track import is_withdrawn
from app.approval_store import pending_for, submit_change
from app.importer.load_template import AGG_HINT

router = APIRouter(prefix="/assessments", tags=["assessments"])

Track = Literal["expert", "community"]


class FormVariable(BaseModel):
    code: str
    name: str
    domain: str
    unit: Optional[str]
    weightPct: Optional[float]
    direction: Literal["+", "-"]
    hint: Optional[str]
    signed: bool
    officialValue: Optional[float]
    myValue: Optional[float]
    trackMean: Optional[float]


class AssessmentForm(BaseModel):
    profileCode: str
    profileVersion: int
    province: str
    dsCode: str
    dsDivision: str
    period: str
    track: Track
    canSubmit: bool
    reason: Optional[str]
    weightsComplete: bool
    contributors: int
    hazardVariables: list[FormVariable]
    exposureVariables: list[FormVariable]
    # Direct index entry: this user's last entry, if any, and which way they
    # last assessed this division ('parameters' | 'index' | None).
    myMode: Optional[str] = None
    myHazardIndex: Optional[float] = None
    myExposureIndex: Optional[float] = None
    # The scale this person used last time (1 or 4) and their figures exactly
    # as typed on it, so the form reopens the way they left it.
    myIndexScale: Optional[int] = None
    myHazardEntered: Optional[float] = None
    myExposureEntered: Optional[float] = None
    # NOTED-17: a change waiting for the provincial administrator, and whether
    # Undo has anything to do (withdraw that change, or restore a version).
    pendingId: Optional[int] = None
    pendingKind: Optional[str] = None
    pendingAt: Optional[str] = None
    pendingMine: bool = False
    canUndo: bool = False
    needsApproval: bool = False


class ValueIn(BaseModel):
    code: str
    value: float


class AssessmentIn(BaseModel):
    province: str
    sector: str
    subsector: Optional[str] = None
    hazard: str
    period: str = Field(pattern=r"^\d{4}-\d{4}$")
    track: Track
    dsCode: str
    mode: Literal["parameters", "index"] = "parameters"
    values: list[ValueIn] = Field(default_factory=list, max_length=200)
    # On the scale named by `indexScale`: 0-1 (indexScale=1) or 0-4
    # (indexScale=4, the experts' rating scale; converted as value / 4).
    hazardIndex: Optional[float] = Field(default=None, ge=0, le=4)
    exposureIndex: Optional[float] = Field(default=None, ge=0, le=4)
    indexScale: Literal[1, 4] = 1
    note: Optional[str] = Field(default=None, max_length=1000)


class AssessmentOut(BaseModel):
    ok: bool
    saved: int
    reason: Optional[str] = None
    missing: list[str] = []
    hazardIndex: Optional[float] = None
    exposureIndex: Optional[float] = None
    rawIndex: Optional[float] = None
    vulnerabilityIndex: Optional[float] = None
    baseline: Optional[str] = None
    contributors: int = 0
    entry: Optional[str] = None
    # NOTED-17: an expert's change waits for the provincial administrator.
    pending: bool = False
    pendingId: Optional[int] = None


async def _profile(conn, province: str, sector: str, subsector: Optional[str],
                   hazard: str):
    prof = await conn.fetchrow(
        """
        SELECT vp.id, vp.code, vp.version, vp.province_id, p.name AS province_name,
               vp.sector_id, vp.subsector_id, vp.hazard_type_id
          FROM vulnerability_profile vp
          JOIN province p     ON p.id = vp.province_id
          JOIN sector   s     ON s.id = vp.sector_id
          LEFT JOIN subsector ss ON ss.id = vp.subsector_id
          JOIN hazard_type h  ON h.id = vp.hazard_type_id
         WHERE vp.is_active AND p.code = $1 AND s.code = $2
           AND COALESCE(ss.code, '-') = COALESCE($3, '-') AND h.code = $4
        """, province.upper(), sector.upper(),
        subsector.upper() if subsector else None, hazard.lower())
    if prof is None:
        raise HTTPException(404, "no active profile for %s / %s / %s / %s"
                            % (province, sector, subsector or "-", hazard))
    return prof


async def _division(conn, province_id: int, ds_code: str):
    d = await conn.fetchrow(
        "SELECT id, code, name FROM ds_division WHERE province_id = $1 AND code = $2",
        province_id, ds_code.upper())
    if d is None:
        raise HTTPException(404, "%s is not a division of this province" % ds_code)
    return d


def may_write_track(user: Optional[CurrentUser], track: str,
                    province_id: int) -> tuple[bool, Optional[str]]:
    """(allowed, reason-if-not). One place, so the form and the save agree."""
    if user is None:
        return False, "sign in to add your own assessment"
    if user.status != "active":
        return False, "your account is not active yet"
    if user.has_role("admin") or user.is_province_admin(province_id):
        return True, None
    if track == "expert":
        if not user.has_role("expert"):
            return False, "the expert track is for accounts with the expert role"
        # An expert may hold several provinces (user_province, NOTED-17).
        if province_id not in user.provinces:
            return False, ("an expert assesses divisions of their own province(s) "
                           "(%s)" % (user.province or "none set"))
        return True, None
    if not user.has_role("community"):
        return False, "the community track is for accounts with the community role"
    return True, None


def _years(period: str) -> tuple[int, int]:
    y0, y1 = (int(x) for x in period.split("-"))
    if y1 < y0:
        raise HTTPException(400, "period %s ends before it starts" % period)
    return y0, y1


@router.get("/form", response_model=AssessmentForm)
async def form(
    province: str, sector: str, hazard: str,
    period: str = Query(..., pattern=r"^\d{4}-\d{4}$"),
    track: Track = "expert",
    ds: str = Query(..., description="DS division code, e.g. KA8"),
    subsector: Optional[str] = None,
    pool: asyncpg.Pool = Depends(db),
    user: Optional[CurrentUser] = Depends(get_optional_user),
) -> AssessmentForm:
    y0, y1 = _years(period)
    async with pool.acquire() as conn:
        prof = await _profile(conn, province, sector, subsector, hazard)
        div = await _division(conn, prof["province_id"], ds)
        members = await conn.fetch(
            """
            SELECT ic.id, ic.code, ic.name, ic.unit, ic.period_aggregation,
                   ic.value_kind::text AS value_kind,
                   pi.domain::text AS domain, pi.weight_pct::float8 AS weight_pct,
                   pi.relationship::text AS relationship
              FROM profile_indicator pi
              JOIN indicator_catalog ic ON ic.id = pi.indicator_id
             WHERE pi.profile_id = $1 AND pi.consensus IN ('agreed', 'contested')
             ORDER BY pi.domain, ic.code
            """, prof["id"])
        ids = [m["id"] for m in members]
        official = {r["indicator_id"]: r["raw_value"] for r in await conn.fetch(
            """
            SELECT DISTINCT ON (indicator_id) indicator_id, raw_value
              FROM indicator_value
             WHERE ds_division_id = $1 AND indicator_id = ANY($2::bigint[])
               AND source = 'data' AND scenario_id IS NULL AND year_start <= $3
             ORDER BY indicator_id, year_start DESC, id DESC
            """, div["id"], ids, y0)}
        mine = {}
        if user is not None:
            mine = {r["indicator_id"]: r["raw_value"] for r in await conn.fetch(
                """
                SELECT DISTINCT ON (indicator_id) indicator_id, raw_value
                  FROM indicator_value
                 WHERE ds_division_id = $1 AND indicator_id = ANY($2::bigint[])
                   AND source = $3::source_type AND user_id = $4
                   AND year_start <= $5
                 ORDER BY indicator_id, year_start DESC, id DESC
                """, div["id"], ids, track, user.id, y0)}
        means = {r["indicator_id"]: r["mean"] for r in await conn.fetch(
            """
            SELECT indicator_id, avg(raw_value)::float8 AS mean FROM (
                SELECT DISTINCT ON (indicator_id, user_id) indicator_id, raw_value
                  FROM indicator_value
                 WHERE ds_division_id = $1 AND indicator_id = ANY($2::bigint[])
                   AND source = $3::source_type AND year_start <= $4
                 ORDER BY indicator_id, user_id, year_start DESC, id DESC) l
             GROUP BY indicator_id
            """, div["id"], ids, track, y0)}
        n_people = await contributors(conn, prof["id"], div["id"], track, y0)
        idx = await index_entries(conn, prof, div["id"], track, y0)
        n_people += len(idx)
        my_idx = next((r for r in idx if user is not None and r["user_id"] == user.id), None)
        my_entered = None
        if my_idx is not None:
            my_entered = await conn.fetchrow(
                """SELECT entered_scale, hazard_entered, exposure_entered
                     FROM track_index_entry
                    WHERE ds_division_id = $1 AND sector_id = $2
                      AND subsector_id IS NOT DISTINCT FROM $3 AND hazard_type_id = $4
                      AND source = $5::source_type AND user_id = $6 AND year_start <= $7
                    ORDER BY year_start DESC, id DESC LIMIT 1""",
                div["id"], prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"],
                track, user.id, y0)
        my_mode = "index" if my_idx else ("parameters" if mine else None)
        waiting = await pending_for(conn, prof, div["id"], track)
        has_history = bool(await conn.fetchval(
            """SELECT 1 FROM assessment_history
                WHERE ds_division_id = $1 AND sector_id = $2
                  AND subsector_id IS NOT DISTINCT FROM $3 AND hazard_type_id = $4
                  AND source = $5::source_type AND year_start = $6 AND year_end = $7
                  AND restored_at IS NULL AND reason <> 'before an undo' LIMIT 1""",
            div["id"], prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"],
            track, y0, y1))

    weights_complete = bool(members) and all(m["weight_pct"] is not None for m in members)
    allowed, reason = may_write_track(user, track, prof["province_id"])
    # Unfinished weights block entry BY PARAMETERS only; an index entry needs
    # no weights, so the form stays open and the client offers index mode.

    def _v(m) -> FormVariable:
        return FormVariable(
            code=m["code"], name=m["name"] or m["code"], domain=m["domain"],
            unit=m["unit"], weightPct=m["weight_pct"],
            direction="-" if m["relationship"] == "higher_is_better" else "+",
            hint=AGG_HINT.get(m["period_aggregation"]),
            signed=m["value_kind"] == "signed",
            officialValue=official.get(m["id"]), myValue=mine.get(m["id"]),
            trackMean=means.get(m["id"]))

    return AssessmentForm(
        profileCode=prof["code"], profileVersion=prof["version"],
        province=prof["province_name"], dsCode=div["code"], dsDivision=div["name"],
        period=period, track=track, canSubmit=allowed, reason=reason,
        weightsComplete=weights_complete, contributors=n_people,
        hazardVariables=[_v(m) for m in members if m["domain"] == "hazard"],
        exposureVariables=[_v(m) for m in members if m["domain"] == "exposure"],
        myMode=my_mode,
        myHazardIndex=my_idx["hazard_index"] if my_idx else None,
        myExposureIndex=my_idx["exposure_index"] if my_idx else None,
        myIndexScale=my_entered["entered_scale"] if my_entered else None,
        myHazardEntered=(my_entered["hazard_entered"] if my_entered and my_entered["hazard_entered"] is not None
                         else (my_idx["hazard_index"] if my_idx else None)),
        myExposureEntered=(my_entered["exposure_entered"] if my_entered and my_entered["exposure_entered"] is not None
                           else (my_idx["exposure_index"] if my_idx else None)),
        pendingId=waiting["id"] if waiting else None,
        pendingKind=waiting["kind"] if waiting else None,
        pendingAt=waiting["submitted_at"].isoformat() if waiting else None,
        pendingMine=bool(waiting and user is not None and waiting["submitted_by"] == user.id),
        canUndo=allowed and (bool(waiting) or has_history),
        needsApproval=bool(user is not None and not user.approves_own_changes(prof["province_id"])))


@router.post("", response_model=AssessmentOut)
async def save(
    body: AssessmentIn,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> AssessmentOut:
    """Save my figures. An expert's (or community member's) save is sent to the
    provincial administrator for approval and applied only then (NOTED-17);
    the map keeps the approved values meanwhile. Administrators' saves apply
    at once."""
    _years(body.period)
    async with pool.acquire() as conn:
        prof = await _profile(conn, body.province, body.sector, body.subsector, body.hazard)
        allowed, reason = may_write_track(user, body.track, prof["province_id"])
        if not allowed:
            raise HTTPException(403, reason)
        div = await _division(conn, prof["province_id"], body.dsCode)
        if not user.approves_own_changes(prof["province_id"]):
            if not (body.note or "").strip():
                raise HTTPException(422, "give a reason for this change -- the provincial "
                                         "administrator sees it with the old and new values")
            y0, y1 = _years(body.period)
            payload = body.model_dump()
            payload["preview"] = await preview_change(
                conn, prof, div["id"], body.track, y0, y1,
                lambda one: apply_save(one, body, user))
            pid = await submit_change(
                conn, kind="assessment_save", province_id=prof["province_id"], user=user,
                summary="%s assessment of %s -- %s%s / %s (%s)" % (
                    body.track.capitalize(), div["name"], body.sector,
                    "/" + body.subsector if body.subsector else "", body.hazard,
                    "by index" if body.mode == "index" else "by parameters"),
                payload=payload, division_id=div["id"], prof=prof, source=body.track)
            return AssessmentOut(ok=False, saved=0, pending=True, pendingId=pid,
                                 reason="sent to the provincial administrator for approval")
    return await apply_save(pool, body, user)


async def apply_save(pool, body: AssessmentIn, user: CurrentUser) -> AssessmentOut:
    """The save itself -- called directly for administrators, and on approval
    for everyone else (routers/approvals.py), as the person who submitted it."""
    y0, y1 = _years(body.period)
    async with pool.acquire() as conn:
        prof = await _profile(conn, body.province, body.sector, body.subsector, body.hazard)
        allowed, reason = may_write_track(user, body.track, prof["province_id"])
        if not allowed:
            raise HTTPException(403, reason)
        div = await _division(conn, prof["province_id"], body.dsCode)
        members = {r["code"]: r for r in await conn.fetch(
            """
            SELECT ic.id, ic.code, ic.value_kind::text AS value_kind
              FROM profile_indicator pi
              JOIN indicator_catalog ic ON ic.id = pi.indicator_id
             WHERE pi.profile_id = $1 AND pi.consensus IN ('agreed', 'contested')
            """, prof["id"])}
        # Every variable the profile carries, so switching to index mode clears
        # all of this person's parameter figures for the scope, not only the
        # weighted ones.
        all_member_ids = [r["indicator_id"] for r in await conn.fetch(
            "SELECT indicator_id FROM profile_indicator WHERE profile_id = $1", prof["id"])]
        note = ("entered on the map" + (": " + body.note.strip() if body.note else ""))

        if body.mode == "index":
            top = body.indexScale
            if body.hazardIndex is None or body.exposureIndex is None:
                raise HTTPException(400, "index entry needs both a Hazard index and a "
                                         "Present Exposure index, each between 0 and %d" % top)
            if body.hazardIndex > top or body.exposureIndex > top:
                raise HTTPException(400, "on the 0-%d scale an index cannot be above %d"
                                    % (top, top))
            # Linear conversion to the model's 0-1 scale (2.5 on 0-4 -> 0.625).
            h01 = body.hazardIndex / top
            e01 = body.exposureIndex / top
            async with conn.transaction():
                await snapshot(conn, prof, div["id"], body.track, y0, y1, user, "before a save")
                await conn.execute(
                    """
                    DELETE FROM indicator_value
                     WHERE ds_division_id = $1 AND source = $2::source_type AND user_id = $3
                       AND indicator_id = ANY($4::bigint[])
                       AND year_start = $5 AND year_end = $6 AND scenario_id IS NULL
                    """, div["id"], body.track, user.id, all_member_ids, y0, y1)
                await conn.execute(
                    """
                    DELETE FROM track_index_entry
                     WHERE ds_division_id = $1 AND sector_id = $2
                       AND subsector_id IS NOT DISTINCT FROM $3 AND hazard_type_id = $4
                       AND source = $5::source_type AND user_id = $6
                       AND year_start = $7 AND year_end = $8
                    """, div["id"], prof["sector_id"], prof["subsector_id"],
                    prof["hazard_type_id"], body.track, user.id, y0, y1)
                await conn.execute(
                    """
                    INSERT INTO track_index_entry
                        (ds_division_id, sector_id, subsector_id, hazard_type_id, source,
                         user_id, year_start, year_end, hazard_index, exposure_index, note,
                         entered_scale, hazard_entered, exposure_entered)
                    VALUES ($1, $2, $3, $4, $5::source_type, $6, $7, $8, $9, $10, $11,
                            $12, $13, $14)
                    """, div["id"], prof["sector_id"], prof["subsector_id"],
                    prof["hazard_type_id"], body.track, user.id, y0, y1,
                    h01, e01, note, top, body.hazardIndex, body.exposureIndex)
                await _unwithdraw(conn, prof, div["id"], body.track, y0, y1)
                result = await compute_track_division(conn, prof["id"], div["id"],
                                                      body.track, y0, y1)
            return AssessmentOut(saved=2, **{
                k: result.get(k) for k in ("ok", "reason", "hazardIndex", "exposureIndex",
                                           "rawIndex", "vulnerabilityIndex", "baseline",
                                           "entry")},
                missing=result.get("missing", []), contributors=result.get("contributors", 0))

        if not members or any(
                w is None for w in [r["weight_pct"] for r in await conn.fetch(
                    """SELECT weight_pct FROM profile_indicator
                        WHERE profile_id = $1 AND consensus IN ('agreed', 'contested')""",
                    prof["id"])]):
            raise HTTPException(400, "this profile's weights are not finished yet, so it "
                                     "cannot be assessed by parameters. Enter the "
                                     "Hazard and Exposure indexes directly instead.")
        if not body.values:
            raise HTTPException(400, "no figures were sent")

        problems: list[str] = []
        seen: set[str] = set()
        for v in body.values:
            if v.code not in members:
                problems.append("%s is not a variable of %s" % (v.code, prof["code"]))
            elif v.code in seen:
                problems.append("%s was sent twice" % v.code)
            elif v.value < 0 and members[v.code]["value_kind"] != "signed":
                problems.append("%s cannot be negative" % v.code)
            elif v.value != v.value or v.value in (float("inf"), float("-inf")):
                problems.append("%s is not a number" % v.code)
            seen.add(v.code)
        missing = sorted(set(members) - seen)
        if missing:
            problems.append("a value is needed for every variable -- missing: %s"
                            % ", ".join(missing))
        if problems:
            raise HTTPException(400, "; ".join(problems))

        async with conn.transaction():
            await snapshot(conn, prof, div["id"], body.track, y0, y1, user, "before a save")
            # One way per person: a parameter save clears their index entry.
            await conn.execute(
                """
                DELETE FROM track_index_entry
                 WHERE ds_division_id = $1 AND sector_id = $2
                   AND subsector_id IS NOT DISTINCT FROM $3 AND hazard_type_id = $4
                   AND source = $5::source_type AND user_id = $6
                   AND year_start = $7 AND year_end = $8
                """, div["id"], prof["sector_id"], prof["subsector_id"],
                prof["hazard_type_id"], body.track, user.id, y0, y1)
            await conn.execute(
                """
                DELETE FROM indicator_value
                 WHERE ds_division_id = $1 AND source = $2::source_type AND user_id = $3
                   AND indicator_id = ANY($4::bigint[])
                   AND year_start = $5 AND year_end = $6 AND scenario_id IS NULL
                """, div["id"], body.track, user.id,
                [m["id"] for m in members.values()], y0, y1)
            await conn.executemany(
                """
                INSERT INTO indicator_value
                    (indicator_id, ds_division_id, source, user_id, year_start,
                     year_end, raw_value, derivation, data_source, notes)
                VALUES ($1, $2, $3::source_type, $4, $5, $6, $7, 'manual', $8, $9)
                """,
                [(members[v.code]["id"], div["id"], body.track, user.id, y0, y1,
                  v.value, user.full_name or user.email, note) for v in body.values])
            await _unwithdraw(conn, prof, div["id"], body.track, y0, y1)
            result = await compute_track_division(conn, prof["id"], div["id"],
                                                  body.track, y0, y1)
    return AssessmentOut(saved=len(body.values), **{
        k: result.get(k) for k in ("ok", "reason", "hazardIndex", "exposureIndex",
                                   "rawIndex", "vulnerabilityIndex", "baseline",
                                   "entry")},
        missing=result.get("missing", []), contributors=result.get("contributors", 0))


# ---- removing an assessment (client NOTED-14) ------------------------------

async def _unwithdraw(conn, prof, division_id: int, track: str, y0: int, y1: int) -> None:
    """A new save for a withdrawn scope puts it back on the map."""
    await conn.execute(
        """DELETE FROM track_withdrawal
            WHERE ds_division_id = $1 AND sector_id = $2
              AND subsector_id IS NOT DISTINCT FROM $3 AND hazard_type_id = $4
              AND source = $5::source_type AND year_start = $6 AND year_end = $7""",
        division_id, prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"],
        track, y0, y1)


class RemoveIn(BaseModel):
    province: str
    sector: str
    subsector: Optional[str] = None
    hazard: str
    period: str = Field(pattern=r"^\d{4}-\d{4}$")
    track: Track
    # One division; omitted = every division of the province (admin only).
    dsCode: Optional[str] = None
    note: Optional[str] = Field(default=None, max_length=1000)


class RemoveOut(BaseModel):
    removed: int          # divisions withdrawn
    figuresDeleted: int   # parameter figures that belonged to this profile only
    indexEntriesDeleted: int
    sharedKept: list[str] # variables kept because other profiles use them
    pending: bool = False
    pendingId: Optional[int] = None


@router.post("/remove", response_model=RemoveOut)
async def remove(
    body: RemoveIn,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> RemoveOut:
    """Take an expert/community assessment off the map.

    WHAT IS DELETED. Index entries (they belong to this sector/hazard alone) and
    parameter figures for variables NO other active profile of the province
    uses. Shared figures -- a drought variable, a cattle exposure variable used
    by cattle-drought and cattle-flood -- are KEPT for the profiles still using
    them, and a track_withdrawal row stops this scope being re-scored from them.
    The remaining divisions of the track are then rescaled, since the lowest or
    highest may just have been removed.

    WHO. One division: anyone who may write that track there (the expert of the
    province, or an admin). A whole dataset (no dsCode): admin only."""
    _years(body.period)
    async with pool.acquire() as conn:
        prof = await _profile(conn, body.province, body.sector, body.subsector, body.hazard)
        allowed, reason = may_write_track(user, body.track, prof["province_id"])
        if not allowed:
            raise HTTPException(403, reason)
        if body.dsCode and not user.approves_own_changes(prof["province_id"]):
            div = await _division(conn, prof["province_id"], body.dsCode)
            y0, y1 = _years(body.period)
            payload = body.model_dump()
            payload["preview"] = {"before": await track_row(conn, prof, div["id"], body.track, y0, y1),
                                  "after": None}
            pid = await submit_change(
                conn, kind="assessment_remove", province_id=prof["province_id"], user=user,
                summary="Remove the %s assessment of %s -- %s%s / %s" % (
                    body.track, div["name"], body.sector,
                    "/" + body.subsector if body.subsector else "", body.hazard),
                payload=payload, division_id=div["id"], prof=prof, source=body.track)
            return RemoveOut(removed=0, figuresDeleted=0, indexEntriesDeleted=0, sharedKept=[],
                             pending=True, pendingId=pid)
    return await apply_remove(pool, body, user)


async def apply_remove(pool, body: "RemoveIn", user: CurrentUser) -> "RemoveOut":
    y0, y1 = _years(body.period)
    async with pool.acquire() as conn:
        prof = await _profile(conn, body.province, body.sector, body.subsector, body.hazard)
        if body.dsCode:
            div_ids = [(await _division(conn, prof["province_id"], body.dsCode))["id"]]
        else:
            if not user.has_role("admin"):
                raise HTTPException(403, "only an administrator may remove a whole dataset; "
                                         "remove divisions one at a time instead")
            div_ids = [r["id"] for r in await conn.fetch(
                "SELECT id FROM ds_division WHERE province_id = $1", prof["province_id"])]

        members = await conn.fetch(
            """SELECT pi.indicator_id, ic.code,
                      EXISTS (SELECT 1 FROM profile_indicator o
                                JOIN vulnerability_profile ov ON ov.id = o.profile_id
                               WHERE o.indicator_id = pi.indicator_id AND ov.is_active
                                 AND ov.province_id = $2
                                 AND NOT (ov.sector_id = $3
                                          AND ov.subsector_id IS NOT DISTINCT FROM $4
                                          AND ov.hazard_type_id = $5)) AS shared
                 FROM profile_indicator pi
                 JOIN indicator_catalog ic ON ic.id = pi.indicator_id
                WHERE pi.profile_id = $1""",
            prof["id"], prof["province_id"], prof["sector_id"], prof["subsector_id"],
            prof["hazard_type_id"])
        own = [m["indicator_id"] for m in members if not m["shared"]]
        shared = sorted(m["code"] for m in members if m["shared"])
        note = "removed by %s%s" % (user.full_name or user.email,
                                    (": " + body.note.strip()) if body.note else "")

        async with conn.transaction():
            # Only divisions that actually hold something on this track are
            # withdrawn, so "remove dataset" leaves no rows for empty divisions.
            had = {r["ds_division_id"] for r in await conn.fetch(
                """SELECT ds_division_id FROM vulnerability_result
                    WHERE profile_id = $1 AND source = $2::source_type
                      AND ds_division_id = ANY($3::bigint[])
                      AND year_start = $4 AND year_end = $5
                   UNION
                   SELECT ds_division_id FROM track_index_entry
                    WHERE sector_id = $6 AND subsector_id IS NOT DISTINCT FROM $7
                      AND hazard_type_id = $8 AND source = $2::source_type
                      AND ds_division_id = ANY($3::bigint[])
                      AND year_start = $4 AND year_end = $5""",
                prof["id"], body.track, div_ids, y0, y1,
                prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"])}
            if body.dsCode:
                had |= set(div_ids)
            targets = sorted(had)
            for d in targets:
                await snapshot(conn, prof, d, body.track, y0, y1, user, "before a removal")
            if targets:
                await conn.executemany(
                    """INSERT INTO track_withdrawal
                           (ds_division_id, sector_id, subsector_id, hazard_type_id, source,
                            year_start, year_end, withdrawn_by, note)
                       VALUES ($1, $2, $3, $4, $5::source_type, $6, $7, $8, $9)
                       ON CONFLICT DO NOTHING""",
                    [(d, prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"],
                      body.track, y0, y1, user.id, note) for d in targets])
            n_idx = int((await conn.execute(
                """DELETE FROM track_index_entry
                    WHERE ds_division_id = ANY($1::bigint[]) AND sector_id = $2
                      AND subsector_id IS NOT DISTINCT FROM $3 AND hazard_type_id = $4
                      AND source = $5::source_type AND year_start = $6 AND year_end = $7""",
                targets, prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"],
                body.track, y0, y1)).split()[-1])
            n_fig = 0
            if own:
                n_fig = int((await conn.execute(
                    """DELETE FROM indicator_value
                        WHERE ds_division_id = ANY($1::bigint[]) AND source = $2::source_type
                          AND indicator_id = ANY($3::bigint[])
                          AND year_start = $4 AND year_end = $5""",
                    targets, body.track, own, y0, y1)).split()[-1])
            for d in targets:
                await compute_track_division(conn, prof["id"], d, body.track, y0, y1)
            await rescale_track_profile(conn, prof["id"], body.track, y0, y1)

    return RemoveOut(removed=len(targets), figuresDeleted=n_fig,
                     indexEntriesDeleted=n_idx, sharedKept=shared)


# ---- undo (client NOTED-17) -------------------------------------------------
#
# Before every applied save or removal, the expert-track figures of that
# division and profile scope are copied into assessment_history: every
# person's figures for the profile's variables, the index entries, and whether
# the scope was withdrawn. Undo puts the latest copy back. If the person's last
# change is still waiting for approval, Undo simply withdraws it instead.

async def snapshot(conn, prof, division_id: int, track: str, y0: int, y1: int,
                   user, reason: str) -> None:
    ids = [r["indicator_id"] for r in await conn.fetch(
        "SELECT indicator_id FROM profile_indicator WHERE profile_id = $1", prof["id"])]
    figures = [dict(r) for r in await conn.fetch(
        """SELECT indicator_id, user_id, raw_value, derivation::text AS derivation,
                  data_source, notes
             FROM indicator_value
            WHERE ds_division_id = $1 AND source = $2::source_type
              AND indicator_id = ANY($3::bigint[]) AND scenario_id IS NULL
              AND year_start = $4 AND year_end = $5""",
        division_id, track, ids, y0, y1)]
    entries = [dict(r) for r in await conn.fetch(
        """SELECT user_id, hazard_index, exposure_index, note, entered_scale,
                  hazard_entered, exposure_entered
             FROM track_index_entry
            WHERE ds_division_id = $1 AND sector_id = $2
              AND subsector_id IS NOT DISTINCT FROM $3 AND hazard_type_id = $4
              AND source = $5::source_type AND year_start = $6 AND year_end = $7""",
        division_id, prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"],
        track, y0, y1)]
    withdrawn = await is_withdrawn(conn, prof, division_id, track, y0, y1)
    await conn.execute(
        """INSERT INTO assessment_history
               (ds_division_id, sector_id, subsector_id, hazard_type_id, source,
                year_start, year_end, snapshot, reason, created_by)
           VALUES ($1, $2, $3, $4, $5::source_type, $6, $7, $8::jsonb, $9, $10)""",
        division_id, prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"],
        track, y0, y1,
        json.dumps({"indicators": ids, "figures": figures, "entries": entries,
                    "withdrawn": withdrawn}, default=str),
        reason, user.id if user else None)


async def apply_restore(pool, history_id: int, user) -> dict:
    """Put a division's expert-track figures back as they were in one snapshot,
    then re-score every profile of the province that uses them."""
    async with pool.acquire() as conn:
        h = await conn.fetchrow("SELECT * FROM assessment_history WHERE id = $1", history_id)
        if h is None:
            raise HTTPException(404, "nothing to restore")
        if h["restored_at"] is not None:
            raise HTTPException(409, "that version has already been restored")
        snap = h["snapshot"]
        snap = json.loads(snap) if isinstance(snap, str) else snap
        prof = await conn.fetchrow(
            """SELECT id, code, province_id, sector_id, subsector_id, hazard_type_id
                 FROM vulnerability_profile
                WHERE is_active AND sector_id = $1 AND subsector_id IS NOT DISTINCT FROM $2
                  AND hazard_type_id = $3
                  AND province_id = (SELECT province_id FROM ds_division WHERE id = $4)""",
            h["sector_id"], h["subsector_id"], h["hazard_type_id"], h["ds_division_id"])
        if prof is None:
            raise HTTPException(404, "the profile of that version is no longer active")
        d, src, y0, y1 = h["ds_division_id"], h["source"], h["year_start"], h["year_end"]
        async with conn.transaction():
            await snapshot(conn, prof, d, src, y0, y1, user, "before an undo")
            await conn.execute(
                """DELETE FROM indicator_value
                    WHERE ds_division_id = $1 AND source = $2::source_type
                      AND indicator_id = ANY($3::bigint[]) AND scenario_id IS NULL
                      AND year_start = $4 AND year_end = $5""",
                d, src, snap["indicators"], y0, y1)
            for f in snap["figures"]:
                await conn.execute(
                    """INSERT INTO indicator_value
                           (indicator_id, ds_division_id, source, user_id, year_start, year_end,
                            raw_value, derivation, data_source, notes)
                       VALUES ($1, $2, $3::source_type, $4, $5, $6, $7, $8::derivation_type, $9, $10)""",
                    f["indicator_id"], d, src, f["user_id"], y0, y1, f["raw_value"],
                    f["derivation"], f["data_source"], f["notes"])
            await conn.execute(
                """DELETE FROM track_index_entry
                    WHERE ds_division_id = $1 AND sector_id = $2
                      AND subsector_id IS NOT DISTINCT FROM $3 AND hazard_type_id = $4
                      AND source = $5::source_type AND year_start = $6 AND year_end = $7""",
                d, prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"], src, y0, y1)
            for e in snap["entries"]:
                await conn.execute(
                    """INSERT INTO track_index_entry
                           (ds_division_id, sector_id, subsector_id, hazard_type_id, source,
                            user_id, year_start, year_end, hazard_index, exposure_index, note,
                            entered_scale, hazard_entered, exposure_entered)
                       VALUES ($1, $2, $3, $4, $5::source_type, $6, $7, $8, $9, $10, $11,
                               $12, $13, $14)""",
                    d, prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"], src,
                    e["user_id"], y0, y1, e["hazard_index"], e["exposure_index"], e["note"],
                    e["entered_scale"], e["hazard_entered"], e["exposure_entered"])
            await _unwithdraw(conn, prof, d, src, y0, y1)
            if snap["withdrawn"]:
                await conn.execute(
                    """INSERT INTO track_withdrawal
                           (ds_division_id, sector_id, subsector_id, hazard_type_id, source,
                            year_start, year_end, withdrawn_by, note)
                       VALUES ($1, $2, $3, $4, $5::source_type, $6, $7, $8, 'restored by undo')
                       ON CONFLICT DO NOTHING""",
                    d, prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"], src,
                    y0, y1, user.id if user else None)
            await conn.execute("UPDATE assessment_history SET restored_at = now() WHERE id = $1",
                               history_id)
            # Every active profile of the province that uses these variables
            # is re-scored for this division, then rescaled.
            others = await conn.fetch(
                """SELECT DISTINCT vp.id FROM vulnerability_profile vp
                     JOIN profile_indicator pi ON pi.profile_id = vp.id
                    WHERE vp.is_active AND vp.province_id = $1
                      AND pi.indicator_id = ANY($2::bigint[])""",
                prof["province_id"], snap["indicators"])
            for o in {prof["id"], *[r["id"] for r in others]}:
                await compute_track_division(conn, o, d, src, y0, y1)
                await rescale_track_profile(conn, o, src, y0, y1)
    return {"restored": True}


class UndoIn(BaseModel):
    province: str
    sector: str
    subsector: Optional[str] = None
    hazard: str
    period: str = Field(pattern=r"^\d{4}-\d{4}$")
    track: Track
    dsCode: str


class UndoOut(BaseModel):
    action: Literal["cancelled", "restored", "pending"]
    message: str
    pendingId: Optional[int] = None


@router.post("/undo", response_model=UndoOut)
async def undo(
    body: UndoIn,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> UndoOut:
    """Undo the last change to this division's assessment (NOTED-17)."""
    y0, y1 = _years(body.period)
    async with pool.acquire() as conn:
        prof = await _profile(conn, body.province, body.sector, body.subsector, body.hazard)
        allowed, reason = may_write_track(user, body.track, prof["province_id"])
        if not allowed:
            raise HTTPException(403, reason)
        div = await _division(conn, prof["province_id"], body.dsCode)
        waiting = await pending_for(conn, prof, div["id"], body.track)
        if waiting and (waiting["submitted_by"] == user.id
                        or user.approves_own_changes(prof["province_id"])):
            await conn.execute(
                """UPDATE pending_change SET status = 'cancelled', decided_by = $2,
                          decided_at = now(), decision_note = 'withdrawn with Undo'
                    WHERE id = $1 AND status = 'pending'""", waiting["id"], user.id)
            return UndoOut(action="cancelled",
                           message="Your change was waiting for approval and has been withdrawn.")
        h = await conn.fetchrow(
            """SELECT id FROM assessment_history
                WHERE ds_division_id = $1 AND sector_id = $2
                  AND subsector_id IS NOT DISTINCT FROM $3 AND hazard_type_id = $4
                  AND source = $5::source_type AND year_start = $6 AND year_end = $7
                  AND restored_at IS NULL AND reason <> 'before an undo'
                ORDER BY id DESC LIMIT 1""",
            div["id"], prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"],
            body.track, y0, y1)
        if h is None:
            raise HTTPException(404, "there is no earlier version of this assessment to go back to")
        if not user.approves_own_changes(prof["province_id"]):
            pid = await submit_change(
                conn, kind="assessment_restore", province_id=prof["province_id"], user=user,
                summary="Undo: restore the previous %s assessment of %s -- %s%s / %s" % (
                    body.track, div["name"], body.sector,
                    "/" + body.subsector if body.subsector else "", body.hazard),
                payload={"history_id": h["id"], "preview": await preview_change(
                    conn, prof, div["id"], body.track, y0, y1,
                    lambda one: apply_restore(one, h["id"], user))},
                division_id=div["id"], prof=prof, source=body.track)
            return UndoOut(action="pending", pendingId=pid,
                           message="Undo sent to the provincial administrator for approval.")
    await apply_restore(pool, h["id"], user)
    return UndoOut(action="restored", message="The previous version has been restored.")



# ---- before / after for the approver (NOTED-19, item 3) ----------------------

def _band(v):
    if v is None:
        return None
    return "Very low" if v < 0.25 else "Low" if v < 0.5 else "Moderate" if v < 0.75 else "High"


async def track_row(conn, prof, division_id: int, track: str, y0: int, y1: int):
    r = await conn.fetchrow(
        """SELECT hazard_index, exposure_index, vulnerability_index, method
             FROM vulnerability_result
            WHERE profile_id = $1 AND ds_division_id = $2 AND source = $3::source_type
              AND index_scope = 'provincial' AND year_start = $4 AND year_end = $5""",
        prof["id"], division_id, track, y0, y1)
    if r is None:
        return None
    m = r["method"]
    m = json.loads(m) if isinstance(m, str) else (m or {})
    absent = bool(m.get("sector_absent"))
    v = None if absent else r["vulnerability_index"]
    return {"hazard": r["hazard_index"], "exposure": r["exposure_index"],
            "raw": r["hazard_index"] * r["exposure_index"], "score": v,
            "category": "sector not present" if absent else _band(v)}


class _OneConn:
    """A pool stand-in that hands out one connection, so a change can be
    applied inside a transaction that is then rolled back."""
    def __init__(self, conn):
        self.conn = conn

    def acquire(self):
        conn = self.conn

        class _Ctx:
            async def __aenter__(self):
                return conn

            async def __aexit__(self, *exc):
                return False
        return _Ctx()


async def preview_change(conn, prof, division_id: int, track: str, y0: int, y1: int, apply):
    """Old and new values of the division, the new ones computed by actually
    applying the change and rolling it back -- so the approver sees exactly
    what approving will publish, rescaling included."""
    before = await track_row(conn, prof, division_id, track, y0, y1)
    after = None
    tr = conn.transaction()
    await tr.start()
    try:
        await apply(_OneConn(conn))
        after = await track_row(conn, prof, division_id, track, y0, y1)
    except HTTPException:
        after = None
    finally:
        await tr.rollback()
    return {"before": before, "after": after}
