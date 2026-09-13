"""
Recompute published scores -- the web equivalent of `compute_all.py`.

    POST /api/compute/run       re-derive one province's results
    GET  /api/compute/status    are the published results older than the data?

WHY A BUTTON AT ALL.  Importing values changes nothing a person can see. The
map reads `vulnerability_result`, which only the engine writes, so until the
engine runs the map shows yesterday's answer with today's data sitting behind
it -- and nothing on screen says so. The gap was bridged by remembering to run a
command line, which is a documentation fix for a product problem.

SAME ENGINE, NOT A SECOND ONE.  This calls `compute_profile()` and `store()`,
the identical functions `compute_all.py` calls. A recompute triggered from the
browser and one run from the terminal must be bit-identical, and the only way to
be sure of that is to have one implementation.

IDEMPOTENT, SO SAFE TO PRESS TWICE.  Recompute derives results from values and
weights that are already stored. It writes no new facts and re-running it gives
the same answer, which is why `may_recompute_province()` grants it to anyone
already trusted to write in that province rather than to admins alone.
"""

from __future__ import annotations

import logging
from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.deps import CurrentUser, db, get_current_user
from app.engine.vulnerability import Refusal, compute_profile, store

log = logging.getLogger(__name__)

router = APIRouter(prefix="/compute", tags=["compute"])


class ProfileOutcome(BaseModel):
    profileCode: str
    ok: bool
    scored: int = 0
    unassessed: list[str] = []
    refusal: Optional[str] = None


class RecomputeReport(BaseModel):
    province: str
    period: str
    computed: int
    refused: int
    resultRows: int
    profiles: list[ProfileOutcome]


class StalenessReport(BaseModel):
    province: str
    lastValueChange: Optional[str]
    lastComputed: Optional[str]
    stale: bool
    reason: str


class RecomputeRequest(BaseModel):
    province: str
    period: str = Field(pattern=r"^\d{4}-\d{4}$")


async def _province_id(pool: asyncpg.Pool, name: str) -> int:
    pid = await pool.fetchval("SELECT id FROM province WHERE name = $1", name)
    if pid is None:
        raise HTTPException(404, "no province named %r" % name)
    return pid


@router.get("/status", response_model=StalenessReport)
async def status(
    province: str,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> StalenessReport:
    """Whether the published scores are older than the values behind them.

    Compared on `updated_at`, not on a flag someone has to remember to set: a
    flag would be wrong precisely when it mattered, which is after a change made
    outside the app.
    """
    pid = await _province_id(pool, province)
    row = await pool.fetchrow(
        """
        SELECT (SELECT max(iv.updated_at)
                  FROM indicator_value iv
                  JOIN ds_division d ON d.id = iv.ds_division_id
                 WHERE d.province_id = $1)                      AS last_value,
               (SELECT max(vr.computed_at)
                  FROM vulnerability_result vr
                  JOIN ds_division d ON d.id = vr.ds_division_id
                 WHERE d.province_id = $1)                      AS last_computed
        """, pid)
    last_value, last_computed = row["last_value"], row["last_computed"]
    if last_value is None:
        stale, reason = False, "no data loaded for this province yet"
    elif last_computed is None:
        stale, reason = True, "data has been loaded but never scored"
    elif last_value > last_computed:
        stale, reason = True, "data has changed since the scores were last computed"
    else:
        stale, reason = False, "scores are up to date with the data"
    return StalenessReport(
        province=province,
        lastValueChange=last_value.isoformat() if last_value else None,
        lastComputed=last_computed.isoformat() if last_computed else None,
        stale=stale, reason=reason)


@router.post("/run", response_model=RecomputeReport)
async def run(
    body: RecomputeRequest,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> RecomputeReport:
    pid = await _province_id(pool, body.province)
    if not await pool.fetchval("SELECT may_recompute_province($1, $2)", user.id, pid):
        raise HTTPException(
            403,
            "you are not authorised to recompute %s. Recomputing republishes "
            "that province's scores, so it is open to anyone granted a sector "
            "there -- ask an administrator if this is your responsibility."
            % body.province)

    y0, y1 = (int(x) for x in body.period.split("-"))
    if y1 < y0:
        raise HTTPException(400, "period %s ends before it starts" % body.period)

    outcomes: list[ProfileOutcome] = []
    computed = refused = rows = 0

    async with pool.acquire() as conn:
        profiles = await conn.fetch(
            """
            SELECT vp.id, vp.code, vp.hazard_type_id, vp.sector_id, vp.subsector_id
              FROM vulnerability_profile vp
             WHERE vp.province_id = $1 AND vp.is_active
             ORDER BY vp.code
            """, pid)
        if not profiles:
            raise HTTPException(404, "no active profiles for %s" % body.province)

        for prof in profiles:
            result = await compute_profile(conn, prof["id"], y0, y1)
            if isinstance(result, Refusal):
                # A refusal is a profile that CANNOT be scored -- missing
                # weights, no values. It is reported per profile rather than
                # failing the whole run, because one unscoreable profile must
                # not hold back the fifteen that are fine.
                refused += 1
                outcomes.append(ProfileOutcome(
                    profileCode=prof["code"], ok=False, refusal=str(result)))
                continue
            # Per profile, so a failure late in the run does not discard the
            # profiles already scored -- same granularity as compute_all.py.
            async with conn.transaction():
                rows += await store(conn, prof, result)
            computed += 1
            outcomes.append(ProfileOutcome(
                profileCode=result.profile_code, ok=True, scored=result.scored,
                unassessed=list(result.unassessed)))

    log.info("recompute %s %s by user %s: %d computed, %d refused, %d rows",
             body.province, body.period, user.id, computed, refused, rows)
    return RecomputeReport(province=body.province, period=body.period,
                           computed=computed, refused=refused, resultRows=rows,
                           profiles=outcomes)
