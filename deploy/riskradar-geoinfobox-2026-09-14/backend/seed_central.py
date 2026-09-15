#!/usr/bin/env python3
"""Seed the Central Province raw data the expert panel returned.

Runs the SAME code path the upload endpoint will use
(app.importer.load_template.load_workbook_values), in review-copy mode: the
panel's `_META` describes the 15 August build they were sent, so the column
contract comes from the profile as it now stands in the database instead.

    python seed_central.py "<folder of returned workbooks>" [--dsn ...]
"""
from __future__ import annotations

import argparse
import asyncio
import glob
import os
import sys

import asyncpg

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.importer.load_template import load_workbook_values  # noqa: E402

SERVICE_ACCOUNT = "panel-import@riskradar.local"


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--dsn", default=os.environ.get("DATABASE_URL"))
    ap.add_argument("--locked", action="store_true",
                    help="treat the files as locked issues: validate columns "
                         "against each file's own _META instead of the profile")
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(args.folder, "*.xlsx")))
    if not files:
        print("no .xlsx found in %s" % args.folder)
        return 1

    conn = await asyncpg.connect(args.dsn)
    try:
        user_id = await conn.fetchval(
            "SELECT id FROM app_user WHERE email = $1", SERVICE_ACCOUNT)
        if user_id is None:
            print("the %s service account is missing - apply panel_central.sql first"
                  % SERVICE_ACCOUNT)
            return 1

        loaded = rejected = values = 0
        for path in files:
            try:
                async with conn.transaction():
                    batch_id = await conn.fetchval(
                        """INSERT INTO import_batch (filename, status, uploaded_by)
                           VALUES ($1, 'uploaded', $2) RETURNING id""",
                        os.path.basename(path), user_id)
                    r = await load_workbook_values(
                        conn, path, review_copy=False if args.locked else None,
                        batch_id=batch_id, user_id=user_id,
                        # The seed runs as the panel-import service account,
                        # which has no province and no sector grant by design.
                        # Scope governs people acting through the API.
                        enforce_scope=False)
                    await conn.execute(
                        """UPDATE import_batch
                              SET profile_code = $2, status = $3, rows_total = $4,
                                  rows_loaded = $5, error_count = $6, error_detail = $7
                            WHERE id = $1""",
                        batch_id, r.profile_code,
                        'loaded' if r.ok else 'rejected',
                        r.values_read, r.values_loaded, len(r.errors),
                        __import__("json").dumps(r.errors) if r.errors else None)
                    if not r.ok:
                        # Nothing partial: a file either loads or it does not.
                        raise _Rollback(r)
            except _Rollback as exc:
                rejected += 1
                print("  FAIL %-46s %s" % (os.path.basename(path)[:46], exc))
                continue
            loaded += 1
            values += r.values_loaded
            for w in r.warnings:
                print("       note: %s" % w[:110])
            print("  ok   %-46s %5d values, %2d divisions"
                  % (r.filename[:46], r.values_loaded, r.divisions))
        print("\n%d workbooks loaded, %d rejected, %d raw values"
              % (loaded, rejected, values))
        return 0
    finally:
        await conn.close()


class _Rollback(Exception):
    def __init__(self, result):
        super().__init__("; ".join(result.errors[:3]))
        self.result = result


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
