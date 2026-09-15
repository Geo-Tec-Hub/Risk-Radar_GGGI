#!/usr/bin/env python3
"""Compute vulnerability for every active profile of a province.

    python compute_all.py --province Central --period 2021-2025

Prints one line per profile and a summary. A profile that refuses says why and
names the variables - a refusal is a result, not an error to be worked around.
"""
from __future__ import annotations

import argparse
import asyncio
import os
import sys

import asyncpg

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.engine.vulnerability import Refusal, compute_profile, store  # noqa: E402


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--province", required=True)
    ap.add_argument("--period", required=True, help="YYYY-YYYY")
    ap.add_argument("--dsn", default=os.environ.get("DATABASE_URL"))
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    y0, y1 = (int(x) for x in args.period.split("-"))

    conn = await asyncpg.connect(args.dsn)
    try:
        profiles = await conn.fetch(
            """
            SELECT vp.id, vp.code, vp.hazard_type_id, vp.sector_id, vp.subsector_id
              FROM vulnerability_profile vp
              JOIN province p ON p.id = vp.province_id
             WHERE p.name = $1 AND vp.is_active
             ORDER BY vp.code
            """, args.province)

        computed = refused = rows = 0
        for prof in profiles:
            result = await compute_profile(conn, prof["id"], y0, y1)
            if isinstance(result, Refusal):
                refused += 1
                print("  REFUSED  %s" % result)
                continue
            if not args.dry_run:
                async with conn.transaction():
                    rows += await store(conn, prof, result)
            computed += 1
            note = ""
            if result.unassessed:
                note = "  (%d unassessed: %s)" % (
                    len(result.unassessed), ", ".join(result.unassessed[:4]))
            print("  ok       %-34s %2d scored%s" % (result.profile_code[:34],
                                                     result.scored, note))
        print("\n%d computed, %d refused, %d result rows%s"
              % (computed, refused, rows, " (dry run)" if args.dry_run else ""))
        return 0
    finally:
        await conn.close()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
