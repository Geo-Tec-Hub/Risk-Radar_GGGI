"""National index (engine/national.py, NOTED-14).

1. A scope with ONE province: the national index must equal the provincial one
   exactly -- the same arithmetic, only the set of divisions differs.
2. A scope where a province cannot compute is refused, naming the province,
   rather than publishing a national scale over part of the country.

Requires a database with Central loaded (see test_engine_refusal). Rolled back.
"""
from __future__ import annotations

import os

import asyncpg
import pytest

from app.engine.national import NationalRefusal, compute_national, national_scopes
from app.engine.vulnerability import Refusal, compute_profile, store

DSN = os.environ.get("DATABASE_URL")
pytestmark = pytest.mark.skipif(not DSN, reason="DATABASE_URL is not set")


class _Rollback(Exception):
    pass


async def _n_profiles(conn, sc):
    return await conn.fetchval(
        """SELECT count(*) FROM vulnerability_profile WHERE is_active AND sector_id = $1
              AND subsector_id IS NOT DISTINCT FROM $2 AND hazard_type_id = $3""",
        sc["sector_id"], sc["subsector_id"], sc["hazard_type_id"])


@pytest.mark.asyncio
async def test_one_province_national_equals_provincial():
    conn = await asyncpg.connect(DSN)
    try:
        with pytest.raises(_Rollback):
            async with conn.transaction():
                checked = 0
                for sc in await national_scopes(conn):
                    if await _n_profiles(conn, sc) != 1:
                        continue
                    # Fresh provincial results from the current engine first, so
                    # the comparison is not against rows from an older version.
                    prof = await conn.fetchrow(
                        """SELECT * FROM vulnerability_profile WHERE is_active AND sector_id = $1
                              AND subsector_id IS NOT DISTINCT FROM $2 AND hazard_type_id = $3""",
                        sc["sector_id"], sc["subsector_id"], sc["hazard_type_id"])
                    comp = await compute_profile(conn, prof["id"], 2021, 2025)
                    if isinstance(comp, Refusal):
                        continue
                    await store(conn, prof, comp)
                    r = await compute_national(conn, sc, 2021, 2025)
                    if isinstance(r, NationalRefusal):
                        continue
                    diff = await conn.fetchval(
                        """SELECT max(abs(n.vulnerability_index - p.vulnerability_index))
                             FROM vulnerability_result n
                             JOIN vulnerability_result p
                            USING (ds_division_id, profile_id, source, year_start, year_end)
                            WHERE n.index_scope = 'national' AND p.index_scope = 'provincial'
                              AND n.source = 'data' AND n.sector_id = $1
                              AND n.subsector_id IS NOT DISTINCT FROM $2
                              AND n.hazard_type_id = $3""",
                        sc["sector_id"], sc["subsector_id"], sc["hazard_type_id"])
                    assert diff is not None and diff < 1e-9, (sc, diff)
                    checked += 1
                if not checked:
                    pytest.skip("no single-province scope is computed")
                raise _Rollback
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_a_province_without_data_refuses_the_scope():
    conn = await asyncpg.connect(DSN)
    try:
        for sc in await national_scopes(conn):
            if await _n_profiles(conn, sc) < 2:
                continue
            r = await compute_national(conn, sc, 1900, 1900)   # no data that early
            assert isinstance(r, NationalRefusal) and r.provinces, r
            return
        pytest.skip("no multi-province scope")
    finally:
        await conn.close()
