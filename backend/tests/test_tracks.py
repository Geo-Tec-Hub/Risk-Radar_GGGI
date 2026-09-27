"""Expert / community tracks (QA 26 Sep 2026).

Three guarantees, each of which failed silently before:

1. An expert who enters the OFFICIAL figures for a division gets exactly the
   official score back -- the one-division engine and the province engine agree.
2. Expert figures never reach the official score, and a data recompute never
   deletes expert results.
3. A division is not scored on a track until every weighted variable has a
   figure (absent is not zero).

Requires a database with Central loaded and computed (see test_engine_refusal).
Everything runs in a transaction that is rolled back.
"""

from __future__ import annotations

import os

import asyncpg
import pytest

from app.engine.track import compute_track_division
from app.engine.vulnerability import compute_profile, store

DSN = os.environ.get("DATABASE_URL")
pytestmark = pytest.mark.skipif(not DSN, reason="DATABASE_URL is not set")
SCOPE = ("Central", "Agriculture Sector", "Paddy", "Flood")
PERIOD = (2021, 2025)


class _Rollback(Exception):
    pass


async def _setup(conn):
    province, sector, subsector, hazard = SCOPE
    prof = await conn.fetchrow(
        """
        SELECT vp.id, vp.code, vp.province_id, vp.hazard_type_id, vp.sector_id,
               vp.subsector_id
          FROM vulnerability_profile vp
          JOIN province p ON p.id = vp.province_id
          JOIN sector s ON s.id = vp.sector_id
          LEFT JOIN subsector ss ON ss.id = vp.subsector_id
          JOIN hazard_type h ON h.id = vp.hazard_type_id
         WHERE vp.is_active AND p.name = $1 AND s.name = $2
           AND COALESCE(ss.name, '') = COALESCE($3, '') AND h.name = $4
        """, province, sector, subsector, hazard)
    if prof is None:
        pytest.skip("no active %s profile - is Central loaded?" % (SCOPE,))
    div = await conn.fetchrow(
        """SELECT vr.ds_division_id AS id, vr.vulnerability_index AS v
             FROM vulnerability_result vr
            WHERE vr.profile_id = $1 AND vr.source = 'data' AND vr.year_start = $2
              AND vr.hazard_index > 0 AND vr.exposure_index > 0
            ORDER BY vr.ds_division_id LIMIT 1""", prof["id"], PERIOD[0])
    if div is None:
        pytest.skip("Central is not computed")
    user = await conn.fetchval("SELECT id FROM app_user ORDER BY id LIMIT 1")
    members = await conn.fetch(
        """SELECT pi.indicator_id FROM profile_indicator pi
            WHERE pi.profile_id = $1 AND pi.consensus IN ('agreed','contested')""",
        prof["id"])
    return prof, div, user, [m["indicator_id"] for m in members]


async def _enter(conn, ind_ids, div_id, user, factor=1.0, skip=0):
    for iid in ind_ids[skip:]:
        raw = await conn.fetchval(
            """SELECT raw_value FROM indicator_value
                WHERE indicator_id = $1 AND ds_division_id = $2 AND source = 'data'
                  AND year_start <= $3 ORDER BY year_start DESC, id DESC LIMIT 1""",
            iid, div_id, PERIOD[0])
        await conn.execute(
            """INSERT INTO indicator_value (indicator_id, ds_division_id, source,
                   user_id, year_start, year_end, raw_value, derivation)
               VALUES ($1, $2, 'expert', $3, $4, $5, $6, 'manual')""",
            iid, div_id, user, PERIOD[0], PERIOD[1], raw * factor)


@pytest.mark.asyncio
async def test_official_figures_reproduce_the_official_score():
    conn = await asyncpg.connect(DSN)
    try:
        with pytest.raises(_Rollback):
            async with conn.transaction():
                prof, div, user, ids = await _setup(conn)
                await _enter(conn, ids, div["id"], user)
                r = await compute_track_division(conn, prof["id"], div["id"],
                                                 "expert", *PERIOD)
                assert r["ok"], r
                assert r["baseline"] == "official"
                assert abs(r["vulnerabilityIndex"] - div["v"]) < 1e-9
                raise _Rollback
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_expert_values_stay_out_of_the_official_score_and_survive_recompute():
    conn = await asyncpg.connect(DSN)
    try:
        with pytest.raises(_Rollback):
            async with conn.transaction():
                prof, div, user, ids = await _setup(conn)
                await _enter(conn, ids, div["id"], user, factor=7.0)
                r = await compute_track_division(conn, prof["id"], div["id"],
                                                 "expert", *PERIOD)
                assert r["ok"], r
                comp = await compute_profile(conn, prof["id"], *PERIOD)
                await store(conn, prof, comp)
                v = await conn.fetchval(
                    """SELECT vulnerability_index FROM vulnerability_result
                        WHERE profile_id = $1 AND ds_division_id = $2
                          AND source = 'data' AND year_start = $3""",
                    prof["id"], div["id"], PERIOD[0])
                assert abs(v - div["v"]) < 1e-9, "expert figures leaked into data"
                n = await conn.fetchval(
                    """SELECT count(*) FROM vulnerability_result
                        WHERE profile_id = $1 AND ds_division_id = $2
                          AND source = 'expert'""", prof["id"], div["id"])
                assert n == 1, "data recompute deleted the expert result"
                raise _Rollback
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_incomplete_contribution_is_not_scored():
    conn = await asyncpg.connect(DSN)
    try:
        with pytest.raises(_Rollback):
            async with conn.transaction():
                prof, div, user, ids = await _setup(conn)
                await _enter(conn, ids, div["id"], user, skip=1)
                r = await compute_track_division(conn, prof["id"], div["id"],
                                                 "expert", *PERIOD)
                assert not r["ok"] and r["missing"]
                n = await conn.fetchval(
                    """SELECT count(*) FROM vulnerability_result
                        WHERE profile_id = $1 AND ds_division_id = $2
                          AND source = 'expert'""", prof["id"], div["id"])
                assert n == 0
                raise _Rollback
    finally:
        await conn.close()
