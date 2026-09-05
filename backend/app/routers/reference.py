"""
Reference taxonomy -- SRS section 9 `/catalogue`, Stage 2.1.

    GET /api/reference/taxonomy

WHY THIS EXISTS RATHER THAN CONSTANTS IN THE CLIENT.
`core/models/reference-data.model.ts` carried the taxonomy as literals, and by
3 September 2026 three of them had drifted from the database:

  * subsectors were DISPLAY NAMES ('Cattle', 'Pig & Sheep', 'Poultry farming')
    where the API keys on CODES (CATTLE_FARMING, PIG_AND_SHEEP_FARMING,
    POULTRY_FARMING) - every livestock filter would have 404ed;
  * provinces were display names with no code, so 'Central' was sent where CEN
    was expected;
  * PERIODS still read 2020-2025 / 2025-2030, superseded on 3 Sep by the
    Central panel's 2021-2025 / 2026-2030.

HAZARDS ARE SCOPED PER SUBSECTOR, NOT OFFERED FLAT.
The first version of this endpoint scoped sector -> subsector to profiles that
exist and then returned one flat hazard list applied to everything, which left
**15 of 48 combinations 404ing straight from the map's own dropdowns** (Coconut
+ Landslide, every Livestock subsector + Landslide, Transportation + Drought,
and so on) -- the exact failure this endpoint was built to prevent, half
solved. Found by the 4 Sep QA pass. Hazards now come per sector and per
subsector, from the same DISTINCT over active profiles.

Each is the same failure: a list that must agree with the database, maintained
by hand somewhere it cannot be checked. The periods in particular are not a
taxonomy at all - they are whatever the results table holds, which is why they
are read from it.

This endpoint is public and unauthenticated, like the map it feeds (FR-12.7).
"""

from __future__ import annotations

from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.deps import db

router = APIRouter(prefix="/reference", tags=["reference"])


class CodeName(BaseModel):
    code: str
    name: str


class SubsectorOption(CodeName):
    """The hazards a profile actually exists for under this subsector.

    A sector with no subsectors carries one entry with code `null`, so the
    client has exactly one place to look up hazards regardless of shape."""
    hazards: list[str]


class SectorOption(CodeName):
    subsectors: list[SubsectorOption]
    """Hazards available for the sector as a whole (no subsector selected)."""
    hazards: list[str]


class DivisionCoverage(BaseModel):
    """Counts for the coverage statement. Never a constant on the client: the
    register moved 330 -> 331 -> 340 inside three weeks."""
    registered: int
    withGeometry: int
    boundaryPending: int


class Taxonomy(BaseModel):
    provinces: list[CodeName]
    sectors: list[SectorOption]
    hazards: list[CodeName]
    periods: list[str]
    divisionCoverage: DivisionCoverage


@router.get("/taxonomy", response_model=Taxonomy)
async def taxonomy(pool: asyncpg.Pool = Depends(db)) -> Taxonomy:
    async with pool.acquire() as conn:
        provinces = await conn.fetch("SELECT code, name FROM province ORDER BY name")
        hazards = await conn.fetch("SELECT code, name FROM hazard_type ORDER BY name")

        # Only pairs that a profile actually exists for. Offering a sector /
        # subsector combination with no profile behind it produces a 404 the
        # user cannot act on.
        rows = await conn.fetch(
            """
            SELECT DISTINCT s.code AS sector_code, s.name AS sector_name,
                   ss.code AS subsector_code, ss.name AS subsector_name,
                   h.code  AS hazard_code
              FROM vulnerability_profile vp
              JOIN sector s      ON s.id = vp.sector_id
              LEFT JOIN subsector ss ON ss.id = vp.subsector_id
              JOIN hazard_type h ON h.id = vp.hazard_type_id
             WHERE vp.is_active
             ORDER BY s.name, ss.name, h.code
            """)
        periods = await conn.fetch(
            """
            SELECT DISTINCT year_start, year_end FROM vulnerability_result
             WHERE year_start IS NOT NULL ORDER BY year_start DESC
            """)
        cov = await conn.fetchrow(
            """
            SELECT count(*) AS registered,
                   count(geom) AS with_geometry,
                   count(*) - count(geom) AS boundary_pending
              FROM ds_division
            """)

    sectors: dict[str, SectorOption] = {}
    for r in rows:
        opt = sectors.setdefault(
            r["sector_code"],
            SectorOption(code=r["sector_code"], name=r["sector_name"],
                         subsectors=[], hazards=[]))
        if r["hazard_code"] not in opt.hazards:
            opt.hazards.append(r["hazard_code"])
        if not r["subsector_code"]:
            continue
        sub = next((x for x in opt.subsectors if x.code == r["subsector_code"]), None)
        if sub is None:
            sub = SubsectorOption(code=r["subsector_code"],
                                  name=r["subsector_name"], hazards=[])
            opt.subsectors.append(sub)
        if r["hazard_code"] not in sub.hazards:
            sub.hazards.append(r["hazard_code"])

    return Taxonomy(
        provinces=[CodeName(code=p["code"], name=p["name"]) for p in provinces],
        sectors=list(sectors.values()),
        hazards=[CodeName(code=h["code"], name=h["name"]) for h in hazards],
        periods=["%d-%d" % (p["year_start"], p["year_end"]) for p in periods],
        divisionCoverage=DivisionCoverage(
            registered=cov["registered"], withGeometry=cov["with_geometry"],
            boundaryPending=cov["boundary_pending"]))
