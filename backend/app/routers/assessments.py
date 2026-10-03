"""
Expert and community assessments -- the map entry form (QA 26 Sep 2026).

    GET  /api/assessments/form?province=CEN&sector=AGRICULTURE&subsector=PADDY
                              &hazard=flood&period=2021-2025&track=expert&ds=KA8
    POST /api/assessments       save my figures for one division, score it

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

from typing import Literal, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.deps import CurrentUser, db, get_current_user, get_optional_user
from app.engine.track import compute_track_division, contributors, index_entries
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
    hazardIndex: Optional[float] = Field(default=None, ge=0, le=1)
    exposureIndex: Optional[float] = Field(default=None, ge=0, le=1)
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
    if user.has_role("admin"):
        return True, None
    if track == "expert":
        if not user.has_role("expert"):
            return False, "the expert track is for accounts with the expert role"
        if user.province_id != province_id:
            return False, ("an expert assesses divisions of their own province "
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
        my_mode = "index" if my_idx else ("parameters" if mine else None)

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
        myExposureIndex=my_idx["exposure_index"] if my_idx else None)


@router.post("", response_model=AssessmentOut)
async def save(
    body: AssessmentIn,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> AssessmentOut:
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
            if body.hazardIndex is None or body.exposureIndex is None:
                raise HTTPException(400, "index entry needs both a Hazard index and a "
                                         "Potential Exposure index, each between 0 and 1")
            async with conn.transaction():
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
                         user_id, year_start, year_end, hazard_index, exposure_index, note)
                    VALUES ($1, $2, $3, $4, $5::source_type, $6, $7, $8, $9, $10, $11)
                    """, div["id"], prof["sector_id"], prof["subsector_id"],
                    prof["hazard_type_id"], body.track, user.id, y0, y1,
                    body.hazardIndex, body.exposureIndex, note)
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
            result = await compute_track_division(conn, prof["id"], div["id"],
                                                  body.track, y0, y1)
    return AssessmentOut(saved=len(body.values), **{
        k: result.get(k) for k in ("ok", "reason", "hazardIndex", "exposureIndex",
                                   "rawIndex", "vulnerabilityIndex", "baseline",
                                   "entry")},
        missing=result.get("missing", []), contributors=result.get("contributors", 0))
