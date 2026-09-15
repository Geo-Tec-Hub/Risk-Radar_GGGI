"""
Coverage -- FR-5.17, "where is data missing, by province and profile".

    GET /api/coverage?province=Sabaragamuwa&period=2021-2025

WHY THIS SCREEN EXISTS. A province that is not on the map is silent about why.
The reasons are different and the remedies are different: the weights are not
finished, or the weights are fine and the values have not arrived, or both are
fine and nobody has pressed recompute. Until now telling those apart meant
reading `v_profile_readiness` by hand and then guessing at the values.

IT ASKS THE SAME QUESTIONS THE ENGINE ASKS, IN THE SAME ORDER.
  1. Are the weights complete?  `v_profile_readiness.is_computable` -- the same
     view `save_profile_weights()` and the engine are held to, not a second
     definition that would drift from it.
  2. Does every division have every weighted variable?  A division missing one
     is UNASSESSED, never zero (NFR-10), and that is what stops a profile part
     way rather than producing a partial map.
  3. Have the results been computed since?  A profile can be entirely ready and
     still show nothing, because the map reads `vulnerability_result` and only
     the engine writes it.
A screen that answered any of these differently from the engine would send
somebody to fix the wrong thing.

VALUES ARE COUNTED THE WAY THE ENGINE READS THEM. The engine takes the latest
value at or before the period's start, so a 2021-2025 figure still counts for
2026-2030 (year ranges, P-7, `iv_for_year`). Counting only values stamped with
the exact period would report gaps the engine does not have.

PUBLIC, LIKE THE MAP. This reports counts and variable names, never a value. An
officer who cannot see which divisions are missing cannot chase them, and FR-12.7
already makes the scores themselves public.
"""

from __future__ import annotations

from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.deps import db

router = APIRouter(prefix="/coverage", tags=["coverage"])


class Gap(BaseModel):
    variableCode: str
    domain: str
    missing: int


class ProfileCoverage(BaseModel):
    profileCode: str
    sector: str
    subsector: Optional[str]
    hazard: str
    # --- weights
    weightsOk: bool
    variables: int
    missingWeights: int
    hazardTotal: Optional[float]
    exposureTotal: Optional[float]
    # --- values
    divisionsComplete: int
    divisionsPartial: int
    divisionsEmpty: int
    # --- results
    scored: int
    status: str
    note: str
    gaps: list[Gap]


class CoverageReport(BaseModel):
    province: str
    period: str
    divisions: int
    profiles: list[ProfileCoverage]


def _status(r, scored: int, divisions: int) -> tuple[str, str]:
    """One sentence naming the next thing to do, in the order the engine would
    hit them. Ordering matters: a profile with unfinished weights AND missing
    values is reported as a weights problem, because fixing the values first
    changes nothing anyone can see."""
    if not r["is_computable"]:
        if r["n_missing_weights"]:
            return ("weights", "%d variable(s) carry no weight yet"
                    % r["n_missing_weights"])
        parts = []
        for domain, total in (("hazard", r["hazard_total"]),
                              ("exposure", r["exposure_total"])):
            if total is None or float(total) != 100:
                parts.append("%s is %s%%" % (domain, "0" if total is None else total))
        return ("weights", "weights do not total 100 (" + ", ".join(parts) + ")")
    if r["complete"] == 0:
        return ("no data", "no division has a full set of values yet")
    if r["complete"] < divisions:
        return ("partial", "%d of %d divisions are short of at least one value"
                % (divisions - r["complete"], divisions))
    if scored == 0:
        return ("not computed", "ready, but the scores have never been computed")
    if scored < r["complete"]:
        return ("not computed", "%d division(s) ready but not yet scored"
                % (r["complete"] - scored))
    return ("scored", "complete and scored")


@router.get("", response_model=CoverageReport)
async def coverage(
    province: str,
    period: str,
    pool: asyncpg.Pool = Depends(db),
) -> CoverageReport:
    try:
        y0, y1 = (int(x) for x in period.split("-"))
    except ValueError:
        raise HTTPException(400, "period must look like 2021-2025") from None
    if y1 < y0:
        raise HTTPException(400, "period %s ends before it starts" % period)

    async with pool.acquire() as conn:
        prov = await conn.fetchrow(
            "SELECT id, name FROM province WHERE name = $1", province)
        if prov is None:
            raise HTTPException(404, "no province named %r" % province)
        pid = prov["id"]

        divisions = await conn.fetchval(
            "SELECT count(*) FROM ds_division WHERE province_id = $1", pid)

        rows = await conn.fetch(_SUMMARY_SQL, pid, y0)
        gaps = await conn.fetch(_GAPS_SQL, pid, y0)
        scored = {r["profile_id"]: r["n"] for r in await conn.fetch(
            """
            SELECT vr.profile_id, count(DISTINCT vr.ds_division_id) AS n
              FROM vulnerability_result vr
              JOIN vulnerability_profile vp ON vp.id = vr.profile_id
             WHERE vp.province_id = $1 AND vp.is_active AND vr.year_start = $2
             GROUP BY vr.profile_id
            """, pid, y0)}

    by_profile: dict[int, list[Gap]] = {}
    for g in gaps:
        by_profile.setdefault(g["profile_id"], []).append(
            Gap(variableCode=g["code"], domain=g["domain"], missing=g["missing"]))

    out = []
    for r in rows:
        n_scored = scored.get(r["profile_id"], 0)
        status, note = _status(r, n_scored, divisions)
        out.append(ProfileCoverage(
            profileCode=r["code"], sector=r["sector"], subsector=r["subsector"],
            hazard=r["hazard"], weightsOk=r["is_computable"],
            variables=r["n_variables"], missingWeights=r["n_missing_weights"],
            hazardTotal=float(r["hazard_total"]) if r["hazard_total"] is not None else None,
            exposureTotal=float(r["exposure_total"]) if r["exposure_total"] is not None else None,
            divisionsComplete=r["complete"], divisionsPartial=r["partial"],
            divisionsEmpty=r["empty"], scored=n_scored, status=status, note=note,
            gaps=by_profile.get(r["profile_id"], [])[:8]))
    return CoverageReport(province=prov["name"], period=period,
                          divisions=divisions, profiles=out)


# Every (profile, division, weighted variable) triple, marked present or not,
# then folded to one row per profile. A division is COMPLETE when it has every
# weighted variable, EMPTY when it has none of them, and PARTIAL in between --
# the three are reported separately because they mean different things to
# whoever has to chase the data: partial is a workbook with holes, empty is a
# workbook that never arrived.
_CELLS = """
    WITH prof AS (
        SELECT vp.id, vp.code, s.name AS sector, ss.name AS subsector,
               h.name AS hazard
          FROM vulnerability_profile vp
          JOIN sector s        ON s.id  = vp.sector_id
          LEFT JOIN subsector ss ON ss.id = vp.subsector_id
          JOIN hazard_type h   ON h.id  = vp.hazard_type_id
         WHERE vp.is_active AND vp.province_id = $1
    ),
    mem AS (
        SELECT pi.profile_id, pi.indicator_id, ic.code, ic.domain
          FROM profile_indicator pi
          JOIN indicator_catalog ic ON ic.id = pi.indicator_id
         WHERE pi.consensus IN ('agreed', 'contested')
           AND pi.profile_id IN (SELECT id FROM prof)
    ),
    div AS (SELECT id FROM ds_division WHERE province_id = $1),
    present AS (
        SELECT DISTINCT iv.indicator_id, iv.ds_division_id
          FROM indicator_value iv
          JOIN div d ON d.id = iv.ds_division_id
         WHERE iv.year_start <= $2
    ),
    cell AS (
        SELECT m.profile_id, d.id AS div_id, m.code, m.domain,
               (p.indicator_id IS NOT NULL) AS has
          FROM mem m
          CROSS JOIN div d
          LEFT JOIN present p
                 ON p.indicator_id = m.indicator_id AND p.ds_division_id = d.id
    )
"""

_SUMMARY_SQL = _CELLS + """
    , per_div AS (
        SELECT profile_id, div_id, count(*) AS n,
               count(*) FILTER (WHERE has) AS got
          FROM cell GROUP BY profile_id, div_id
    )
    SELECT p.id AS profile_id, p.code, p.sector, p.subsector, p.hazard,
           r.is_computable, r.n_variables, r.n_missing_weights,
           r.hazard_total, r.exposure_total,
           COALESCE(count(*) FILTER (WHERE pd.got = pd.n), 0) AS complete,
           COALESCE(count(*) FILTER (WHERE pd.got > 0 AND pd.got < pd.n), 0) AS partial,
           COALESCE(count(*) FILTER (WHERE pd.got = 0), 0) AS empty
      FROM prof p
      JOIN v_profile_readiness r ON r.profile_id = p.id
      LEFT JOIN per_div pd ON pd.profile_id = p.id
     GROUP BY p.id, p.code, p.sector, p.subsector, p.hazard, r.is_computable,
              r.n_variables, r.n_missing_weights, r.hazard_total, r.exposure_total
     ORDER BY p.sector, p.subsector NULLS FIRST, p.hazard
"""

# Which variables are actually holding a profile up, most-missing first. This is
# the part that turns "Paddy/Flood is not on the map" into a request somebody
# can act on.
_GAPS_SQL = _CELLS + """
    SELECT profile_id, code, domain, count(*) FILTER (WHERE NOT has) AS missing
      FROM cell
     GROUP BY profile_id, code, domain
    HAVING count(*) FILTER (WHERE NOT has) > 0
     ORDER BY missing DESC, code
"""
