"""Stage 4 refusal rules — the engine must decline, and say which variable.

These are the cases that matter most, because the failure mode they guard
against is silent: a profile that quietly drops an unweighted variable, or
rescales a short domain up to 100, still produces a full-looking map. Nothing
looks wrong. Only a test that asserts the refusal catches it.

Requires a database with Central loaded and computed:

    DATABASE_URL=postgresql://... pytest tests/test_engine_refusal.py

Every case runs inside a transaction that is rolled back, so the weights are
never actually changed.
"""

from __future__ import annotations

import os

import asyncpg
import pytest

from app.engine.vulnerability import Refusal, compute_profile

DSN = os.environ.get("DATABASE_URL")

# Keyed on the SCOPE, never on a profile code.
#
# This suite used to name PADDY_DROUGHT_CEN_V5. A profile code carries its
# version, and save_profile_weights() mints a new one on every save -- so the
# code is a pointer to a version that any colleague's save has already retired.
# `_V5` existed only on the machine it was written on, where panel_central.sql
# had been re-run five times; on a freshly seeded database only _V1 exists, the
# lookup returned nothing, and all four tests SKIPPED. A skipped test reports
# green. Found by the 4 Sep QA pass. routers/profiles.py's docstring makes
# exactly this argument about URLs; it applies to tests too.
SCOPE = ("Central", "Agriculture Sector", "Paddy", "Drought")

pytestmark = pytest.mark.skipif(not DSN, reason="DATABASE_URL is not set")


class _Rollback(Exception):
    pass


async def _profile_id(conn) -> int:
    province, sector, subsector, hazard = SCOPE
    pid = await conn.fetchval(
        """
        SELECT vp.id
          FROM vulnerability_profile vp
          JOIN province p     ON p.id = vp.province_id
          JOIN sector   s     ON s.id = vp.sector_id
          LEFT JOIN subsector ss ON ss.id = vp.subsector_id
          JOIN hazard_type h  ON h.id = vp.hazard_type_id
         WHERE vp.is_active AND p.name = $1 AND s.name = $2
           AND COALESCE(ss.name, '') = COALESCE($3, '') AND h.name = $4
        """, province, sector, subsector, hazard)
    if pid is None:
        pytest.skip("no active profile for %s - is Central loaded?"
                    % " / ".join(x or "-" for x in SCOPE))
    return pid


@pytest.mark.asyncio
async def test_computes_before_anything_is_broken():
    """Positive control. Without it, a refusal test can pass for the wrong
    reason - a profile that never computed refuses every time."""
    conn = await asyncpg.connect(DSN)
    try:
        result = await compute_profile(conn, await _profile_id(conn), 2021, 2025)
        assert not isinstance(result, Refusal), str(result)
        assert result.scored > 0
        # 4.5's signature: the provincial rescale puts the top division at 1.
        assert max(s.vulnerability_index for s in result.scores) == 1.0
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_refuses_and_names_an_unweighted_variable():
    """FR-4.7. The variable must be NAMED: 'this profile is incomplete' sends
    someone hunting through 20 rows to find which one."""
    conn = await asyncpg.connect(DSN)
    try:
        pid = await _profile_id(conn)
        with pytest.raises(_Rollback):
            async with conn.transaction():
                await conn.execute(
                    """UPDATE profile_indicator SET weight_pct = NULL
                        WHERE profile_id = $1 AND indicator_id =
                              (SELECT id FROM indicator_catalog
                                WHERE code = 'PADDY_FARMERS')""", pid)
                result = await compute_profile(conn, pid, 2021, 2025)
                assert isinstance(result, Refusal)
                assert "PADDY_FARMERS" in result.variables
                assert "FR-4.7" in result.reason
                raise _Rollback
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_refuses_a_domain_that_does_not_total_100():
    """FR-4.9. Never rescale a short domain up - that silently redistributes an
    expert's weighting across the variables they did not touch."""
    conn = await asyncpg.connect(DSN)
    try:
        pid = await _profile_id(conn)
        with pytest.raises(_Rollback):
            async with conn.transaction():
                await conn.execute(
                    """UPDATE profile_indicator SET weight_pct = weight_pct - 5
                        WHERE profile_id = $1 AND domain = 'exposure'
                          AND indicator_id = (SELECT id FROM indicator_catalog
                                               WHERE code = 'PADDY_FARMERS')""", pid)
                result = await compute_profile(conn, pid, 2021, 2025)
                assert isinstance(result, Refusal)
                assert "95" in result.reason and "not 100" in result.reason
                raise _Rollback
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_a_division_without_data_is_absent_not_zero():
    """NFR-10. An unassessed division must carry NO score. A zero is a real
    score meaning 'least vulnerable in this province' - the defect the retired
    React client shipped was rendering absent as the lowest band."""
    conn = await asyncpg.connect(DSN)
    try:
        pid = await _profile_id(conn)
        with pytest.raises(_Rollback):
            async with conn.transaction():
                div = await conn.fetchval(
                    """DELETE FROM indicator_value iv
                        USING ds_division d, vulnerability_profile vp
                        WHERE iv.ds_division_id = d.id AND vp.id = $1
                          AND d.province_id = vp.province_id
                          AND iv.year_start = 2021
                          AND d.code = (SELECT MIN(code) FROM ds_division
                                         WHERE province_id = vp.province_id)
                        RETURNING d.code""", pid)
                result = await compute_profile(conn, pid, 2021, 2025)
                assert not isinstance(result, Refusal), str(result)
                assert div in result.unassessed
                assert all(s.ds_code != div for s in result.scores)
                raise _Rollback
    finally:
        await conn.close()
