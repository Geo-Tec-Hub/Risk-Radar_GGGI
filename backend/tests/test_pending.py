"""The `pending` state: values present, no score for the active profile version.

Static QA 26 Sep 2026: after a weights save the active profile version changes
(save_profile_weights retires the old row and mints a new one), results are
joined on the NEW id, so the whole province rendered hatched "unassessed" until
a recompute. Unassessed means MISSING DATA; these divisions had every value --
they were merely not yet scored. The API now emits `pending` for them.

This test proves the distinction the API depends on, without minting profile
versions: a division that holds a value for every agreed/contested variable
remains "complete" even when its result row is deleted, so it would come back
as pending rather than unassessed. Runs in a transaction that is rolled back.

    DATABASE_URL=postgresql://... pytest tests/test_pending.py
"""

from __future__ import annotations

import os

import asyncpg
import pytest

from app.routers.vulnerability import _complete_divisions, _state

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
        SELECT vp.id, vp.province_id
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


@pytest.mark.asyncio
async def test_a_division_with_all_values_is_pending_not_unassessed_when_unscored():
    conn = await asyncpg.connect(DSN)
    try:
        prof = await _profile(conn)
        # A division that currently has a result (scored).
        scored = await conn.fetchval(
            """SELECT vr.ds_division_id FROM vulnerability_result vr
                WHERE vr.profile_id = $1 AND vr.source = 'data' AND vr.year_start = $2
                ORDER BY vr.ds_division_id LIMIT 1""", prof["id"], PERIOD[0])
        if scored is None:
            pytest.skip("Central is not computed")

        # It holds every value...
        assert scored in await _complete_divisions(
            conn, prof["id"], prof["province_id"], PERIOD[0])

        with pytest.raises(_Rollback):
            async with conn.transaction():
                # ...and its result row is gone (the "not yet computed" state).
                await conn.execute(
                    """DELETE FROM vulnerability_result
                        WHERE profile_id = $1 AND ds_division_id = $2
                          AND source = 'data' AND year_start = $3""",
                    prof["id"], scored, PERIOD[0])
                assert scored in await _complete_divisions(
                    conn, prof["id"], prof["province_id"], PERIOD[0])
                # The API would therefore emit pending, not unassessed.
                assert _state(False, False, True, None) == ("pending", None)
                assert _state(False, False, False, None) == ("unassessed", None)
                raise _Rollback

        # Rolled back: the result row is still there.
        still = await conn.fetchval(
            """SELECT 1 FROM vulnerability_result
                WHERE profile_id = $1 AND ds_division_id = $2
                  AND source = 'data' AND year_start = $3""",
            prof["id"], scored, PERIOD[0])
        assert still == 1
    finally:
        await conn.close()
