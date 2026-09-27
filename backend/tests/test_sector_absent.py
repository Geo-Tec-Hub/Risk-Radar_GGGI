""""Sector not present" is decided from RAW exposure values, never from an index.

Static QA, 26 Sep 2026, confirmed against the database the same day: the API
inferred `not_applicable` from `exposure_index == 0 OR hazard_index == 0`. A
normalised 0 only means "provincial minimum on every variable" -- Bulathkohipitiya
(KE2, Sabaragamuwa) has 1 buffalo farmer and 11 buffaloes, scored E = 0, and was
shown as having no buffalo farming at all. The engine now records `sector_absent`
per result row, from the raw values, and the routers only read it.

Two guarantees, on the Paddy/Flood profile of Central:

1. A division whose exposure raw values are ALL zero is `sector_absent` -- and
   its result row says so (`method->>'sector_absent' = 'true'`).
2. A division that is the provincial minimum on every exposure variable but
   with a NON-zero raw value somewhere is NOT `sector_absent`, even though its
   exposure index is exactly 0.

Both cases are manufactured inside a transaction that is rolled back.

    DATABASE_URL=postgresql://... pytest tests/test_sector_absent.py
"""

from __future__ import annotations

import os

import asyncpg
import pytest

from app.engine.vulnerability import Refusal, compute_profile, store
from app.routers.vulnerability import _sector_absent, _state

DSN = os.environ.get("DATABASE_URL")
pytestmark = pytest.mark.skipif(not DSN, reason="DATABASE_URL is not set")
SCOPE = ("Central", "Agriculture Sector", "Paddy", "Flood")
PERIOD = (2021, 2025)


class _Rollback(Exception):
    pass


async def _profile(conn):
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
    return prof


async def _exposure_indicators(conn, profile_id):
    return [r["indicator_id"] for r in await conn.fetch(
        """SELECT indicator_id FROM profile_indicator
            WHERE profile_id = $1 AND domain = 'exposure'
              AND consensus IN ('agreed', 'contested')""", profile_id)]


async def _a_scored_division(conn, profile_id):
    """A division that currently scores with E > 0 -- the one we will zero."""
    d = await conn.fetchval(
        """SELECT vr.ds_division_id FROM vulnerability_result vr
            WHERE vr.profile_id = $1 AND vr.source = 'data' AND vr.year_start = $2
              AND vr.exposure_index > 0
            ORDER BY vr.exposure_index DESC LIMIT 1""", profile_id, PERIOD[0])
    if d is None:
        pytest.skip("Central is not computed")
    return d


async def _set_exposure(conn, indicator_ids, div_id, value_for):
    """Overwrite this division's latest official value for each exposure
    variable. value_for(i) -> float. Rolled back by the caller."""
    for i, ind in enumerate(indicator_ids):
        await conn.execute(
            """UPDATE indicator_value SET raw_value = $3
                WHERE id = (SELECT id FROM indicator_value
                             WHERE indicator_id = $1 AND ds_division_id = $2
                               AND source = 'data' AND scenario_id IS NULL
                               AND year_start <= $4
                             ORDER BY year_start DESC, id DESC LIMIT 1)""",
            ind, div_id, value_for(i), PERIOD[0])


@pytest.mark.asyncio
async def test_all_zero_exposure_is_sector_absent_and_stored():
    conn = await asyncpg.connect(DSN)
    try:
        prof = await _profile(conn)
        inds = await _exposure_indicators(conn, prof["id"])
        div = await _a_scored_division(conn, prof["id"])
        with pytest.raises(_Rollback):
            async with conn.transaction():
                await _set_exposure(conn, inds, div, lambda i: 0.0)
                result = await compute_profile(conn, prof["id"], *PERIOD)
                assert not isinstance(result, Refusal), str(result)
                mine = next(s for s in result.scores if s.ds_division_id == div)
                assert mine.exposure_index == 0.0
                assert mine.sector_absent is True
                assert mine.ds_code in result.method["sector_absent_divisions"]

                await store(conn, prof, result)
                method = await conn.fetchval(
                    """SELECT method FROM vulnerability_result
                        WHERE profile_id = $1 AND ds_division_id = $2
                          AND source = 'data' AND year_start = $3""",
                    prof["id"], div, PERIOD[0])
                assert _sector_absent(method) is True
                assert _state(True, True, False, 0.0) == ("not_applicable", None)
                raise _Rollback
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_provincial_minimum_with_a_real_value_is_scored_not_hidden():
    """The KE2 case. Exposure index 0, sector present: a score, not 'absent'."""
    conn = await asyncpg.connect(DSN)
    try:
        prof = await _profile(conn)
        inds = await _exposure_indicators(conn, prof["id"])
        div = await _a_scored_division(conn, prof["id"])
        with pytest.raises(_Rollback):
            async with conn.transaction():
                # Zero everything except the first variable, which is set to a
                # tiny positive value BELOW the current provincial minimum so
                # the division is the minimum on every variable (index 0)
                # while still holding a real figure. Variables that are
                # `higher_is_better` would need a maximum instead; Paddy's
                # exposure variables are all higher_is_worse (checked below).
                rels = await conn.fetch(
                    """SELECT relationship::text AS r FROM profile_indicator
                        WHERE profile_id = $1 AND domain = 'exposure'
                          AND consensus IN ('agreed', 'contested')""", prof["id"])
                if any(r["r"] != "higher_is_worse" for r in rels):
                    pytest.skip("test assumes higher_is_worse exposure variables")
                # A variable whose provincial minimum is POSITIVE: set the
                # division to exactly that minimum (so it ties for the bottom,
                # normalised 0) while holding a real, non-zero figure -- KE2's
                # situation. Every other exposure variable is zeroed, which is
                # the minimum too. Then E == 0 exactly and the sector is present.
                mins = [(ind, await conn.fetchval(
                    """SELECT min(iv.raw_value) FROM indicator_value iv
                         JOIN ds_division d ON d.id = iv.ds_division_id
                        WHERE iv.indicator_id = $1 AND d.province_id = $2
                          AND iv.source = 'data' AND iv.scenario_id IS NULL""",
                    ind, prof["province_id"])) for ind in inds]
                positive = [(ind, float(lo)) for ind, lo in mins if lo is not None and lo > 0]
                if not positive:
                    pytest.skip("no exposure variable with a positive provincial minimum")
                keep_ind, keep_val = positive[0]
                await _set_exposure(conn, inds, div,
                                    lambda i: keep_val if inds[i] == keep_ind else 0.0)
                result = await compute_profile(conn, prof["id"], *PERIOD)
                assert not isinstance(result, Refusal), str(result)
                mine = next(s for s in result.scores if s.ds_division_id == div)
                # It IS the provincial minimum on every variable...
                assert mine.exposure_index == 0.0
                # ...and it is NOT "sector not present".
                assert mine.sector_absent is False
                assert mine.ds_code not in result.method["sector_absent_divisions"]
                assert _state(True, False, False, mine.vulnerability_index) == \
                    ("assessed", mine.vulnerability_index)
                raise _Rollback
    finally:
        await conn.close()


def test_state_table():
    """The four states, exhaustively -- this is the whole of the rule."""
    assert _state(False, False, False, None) == ("unassessed", None)
    assert _state(False, False, True, None) == ("pending", None)
    assert _state(True, True, True, 0.0) == ("not_applicable", None)
    assert _state(True, False, True, 0.0) == ("assessed", 0.0)   # a real 0, kept
    assert _state(True, False, True, 1.0) == ("assessed", 1.0)
    # Rows written before 26 Sep 2026 carry no key: never absent by default.
    assert _sector_absent(None) is False
    assert _sector_absent('{"model": "x"}') is False
    assert _sector_absent({"sector_absent": True}) is True
