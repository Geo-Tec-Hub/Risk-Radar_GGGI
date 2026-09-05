"""save_profile_weights() must refuse a payload it cannot trust — 5 Sep 2026.

WHAT HAPPENED.  This went in and came back 200:

    {"items":[{"indicatorCode":"X","domain":"hazard","weightPct":100}]}

It retired TEA_FLOOD_CEN_V5, a good version with eleven memberships, and
installed an active V6 with **zero**. The profile stopped being computable and
an expert panel's entire weighting disappeared from the active version, with no
error raised anywhere and no trace but the version number going up.

Three holes, each sufficient on its own:

  1. An unknown code was silently dropped — the INSERT ended
     `JOIN indicator_catalog ic ON ic.code = x.code`, so a typo or a stale
     client contributed no row and the save still reported success.
  2. A domain absent from the payload was never checked — the 100 rule groups
     over the items SUPPLIED, so "no exposure rows" made no exposure group and
     nothing was compared to 100.
  3. Omitting a variable the profile carries dropped it. Exclusion in this
     project is a recorded decision, never an inference (SRS 2.4, FR-4.9): a
     variable is removed by sending it `rejected`, not by leaving it out.

WHY THE TEST IS WORTH MORE THAN THE FIX.  Every one of these fails silently and
upward — the save reports success, the version number advances, and the map
just goes blank later for reasons that point nowhere near the save. This is the
SECOND defect of exactly this shape in this one function (15 Aug: consensus
reset to 'agreed', discarding exclusions). The pattern is that the function
validates what it was SENT and never what it was sent AGAINST. Assert that
here, not only in the addendum, so the next rewrite of the function has to keep
it.

Every case runs in a transaction that is rolled back, so no version is retired.

    DATABASE_URL=postgresql://... pytest tests/test_weights_save_completeness.py
"""

from __future__ import annotations

import json
import os

import asyncpg
import pytest

DSN = os.environ.get("DATABASE_URL")

# Keyed on the scope, never on a profile code — see the note in
# test_engine_refusal.py about `_V5` skipping four tests into a green report.
SCOPE = ("Central", "Agriculture Sector", "Tea", "Flood")

pytestmark = pytest.mark.skipif(not DSN, reason="DATABASE_URL is not set")


class _Rollback(Exception):
    pass


async def _ids(conn) -> dict:
    province, sector, subsector, hazard = SCOPE
    row = await conn.fetchrow(
        """
        SELECT vp.id, vp.province_id, vp.sector_id, vp.subsector_id,
               vp.hazard_type_id
          FROM vulnerability_profile vp
          JOIN province p     ON p.id = vp.province_id
          JOIN sector   s     ON s.id = vp.sector_id
          LEFT JOIN subsector ss ON ss.id = vp.subsector_id
          JOIN hazard_type h  ON h.id = vp.hazard_type_id
         WHERE vp.is_active AND p.name = $1 AND s.name = $2
           AND COALESCE(ss.name, '') = COALESCE($3, '') AND h.name = $4
        """, province, sector, subsector, hazard)
    if row is None:
        pytest.skip("no active profile for %s — is Central loaded?"
                    % " / ".join(x or "-" for x in SCOPE))
    return dict(row)


async def _items(conn, profile_id: int) -> list[dict]:
    """The profile's CURRENT membership, in the shape the save expects. A
    round-trip of this must always be accepted; if it is not, the checks are
    too strict and a panel cannot re-save its own weights."""
    rows = await conn.fetch(
        """SELECT ic.code, pi.domain::text AS domain, pi.weight_pct,
                  pi.consensus::text AS consensus, pi.consensus_note,
                  pi.relationship::text AS relationship
             FROM profile_indicator pi
             JOIN indicator_catalog ic ON ic.id = pi.indicator_id
            WHERE pi.profile_id = $1
            ORDER BY pi.domain, ic.code""", profile_id)
    return [{k: (float(v) if k == "weight_pct" and v is not None else v)
             for k, v in dict(r).items()} for r in rows]


async def _save(conn, ids: dict, items: list[dict]):
    return await conn.fetchval(
        "SELECT save_profile_weights($1,$2,$3,$4,$5::jsonb,$6,$7,$8)",
        ids["province_id"], ids["sector_id"], ids["subsector_id"],
        ids["hazard_type_id"], json.dumps(items), 1, None, "regression test")


@pytest.mark.asyncio
async def test_an_unchanged_round_trip_is_accepted():
    """Positive control. Without it every refusal below could pass because the
    save refuses everything, which would be its own defect."""
    conn = await asyncpg.connect(DSN)
    try:
        ids = await _ids(conn)
        with pytest.raises(_Rollback):
            async with conn.transaction():
                new_id = await _save(conn, ids, await _items(conn, ids["id"]))
                assert new_id is not None
                n = await conn.fetchval(
                    "SELECT count(*) FROM profile_indicator WHERE profile_id=$1",
                    new_id)
                assert n == len(await _items(conn, ids["id"])) or n > 0
                raise _Rollback
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_refuses_an_unknown_variable_code():
    """The exact payload that caused the 5 Sep loss."""
    conn = await asyncpg.connect(DSN)
    try:
        ids = await _ids(conn)
        with pytest.raises(asyncpg.exceptions.RaiseError) as exc:
            async with conn.transaction():
                await _save(conn, ids, [{"code": "X", "domain": "hazard",
                                         "weight_pct": 100,
                                         "consensus": "agreed"}])
        assert "X" in str(exc.value), "the refusal must NAME the bad code"
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_refuses_a_payload_with_a_whole_domain_missing():
    """An absent domain is not an empty one. Hazard-only items are internally
    consistent and total 100 — that is exactly why this slipped through."""
    conn = await asyncpg.connect(DSN)
    try:
        ids = await _ids(conn)
        items = [i for i in await _items(conn, ids["id"])
                 if i["domain"] == "hazard"]
        with pytest.raises(asyncpg.exceptions.RaiseError) as exc:
            async with conn.transaction():
                await _save(conn, ids, items)
        assert "exposure" in str(exc.value)
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_refuses_an_omitted_variable_and_names_it():
    """Dropping a variable by leaving it out. The payload is otherwise valid
    and both domains still total 100, so nothing else would catch it."""
    conn = await asyncpg.connect(DSN)
    try:
        ids = await _ids(conn)
        items = await _items(conn, ids["id"])
        victim = next(i for i in items
                      if i["domain"] == "exposure" and i["weight_pct"])
        kept = [i for i in items if i["code"] != victim["code"]]
        for i in kept:  # re-balance so the 100 rule cannot be what refuses
            if i["domain"] == "exposure" and i["weight_pct"]:
                i["weight_pct"] += victim["weight_pct"]
                break
        with pytest.raises(asyncpg.exceptions.RaiseError) as exc:
            async with conn.transaction():
                await _save(conn, ids, kept)
        assert victim["code"] in str(exc.value)
        assert "rejected" in str(exc.value), \
            "the message must say how to remove a variable properly"
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_removal_by_rejection_is_still_allowed():
    """The counterpart to the test above, and the one that matters for real
    work: a panel CAN drop a variable — by recording the decision. If this
    ever fails, the checks have made a legitimate edit impossible."""
    conn = await asyncpg.connect(DSN)
    try:
        ids = await _ids(conn)
        items = await _items(conn, ids["id"])
        victim = next(i for i in items
                      if i["domain"] == "exposure" and i["weight_pct"])
        # Read the weight BEFORE the loop clears it: `victim` is the same dict
        # object that lives in `items`, so mutating it in place also empties
        # what we are trying to redistribute.
        freed, code = victim["weight_pct"], victim["code"]
        moved = False
        for i in items:
            if i["code"] == code:
                i.update(consensus="rejected", weight_pct=None,
                         consensus_note="panel dropped it")
            elif not moved and i["domain"] == "exposure" and i["weight_pct"]:
                i["weight_pct"] += freed
                moved = True
        assert moved, "the scope needs a second weighted exposure variable"
        with pytest.raises(_Rollback):
            async with conn.transaction():
                assert await _save(conn, ids, items) is not None
                raise _Rollback
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_a_refused_save_leaves_the_active_version_intact():
    """The whole point of validating before retiring. The 5 Sep defect's real
    damage was not the refusal that never came — it was that a good version had
    already been retired by the time anything went wrong."""
    conn = await asyncpg.connect(DSN)
    try:
        ids = await _ids(conn)
        before = await conn.fetchrow(
            """SELECT vp.id, vp.version,
                      (SELECT count(*) FROM profile_indicator pi
                        WHERE pi.profile_id = vp.id) AS n
                 FROM vulnerability_profile vp WHERE vp.id = $1""", ids["id"])
        with pytest.raises(asyncpg.exceptions.RaiseError):
            async with conn.transaction():
                await _save(conn, ids, [{"code": "X", "domain": "hazard",
                                         "weight_pct": 100,
                                         "consensus": "agreed"}])
        after = await conn.fetchrow(
            """SELECT vp.id, vp.version, vp.is_active,
                      (SELECT count(*) FROM profile_indicator pi
                        WHERE pi.profile_id = vp.id) AS n
                 FROM vulnerability_profile vp WHERE vp.id = $1""", ids["id"])
        assert after["is_active"] is True
        assert (after["version"], after["n"]) == (before["version"], before["n"])
    finally:
        await conn.close()
