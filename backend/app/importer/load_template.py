"""Load a generated upload template into `indicator_value`.

ONE code path, two callers: the Central seed script and (next) the upload
endpoint both come through `load_workbook_values`. They must not diverge - a
seed that loads data the endpoint would reject is worse than no seed, because
the map then shows something the product cannot reproduce.

WHAT IS AND IS NOT LOADED
  * Only variables that are actually in the profile as it now stands. A column
    for a variable the profile does not carry is a structural error, not a row
    to skip.
  * Blank stays blank. A division with no value for a variable is absent, and
    absent is not zero - it must reach the map as "unassessed" (NFR-10).
  * Raw values only. Normalisation is server-side, always.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.importer.template_reader import TemplateWorkbook, read_workbook


@dataclass
class LoadResult:
    filename: str
    profile_code: str | None
    values_read: int
    values_loaded: int
    divisions: int
    errors: list[str]
    warnings: list[str]

    @property
    def ok(self) -> bool:
        return not self.errors


async def profile_context(conn, province: str, main_sector: str,
                          subsector: str | None, hazard: str) -> dict | None:
    """The active profile for a scope, with the column list it expects and the
    header aliases that resolve to its variables."""
    row = await conn.fetchrow(
        """
        SELECT vp.id, vp.code, vp.province_id
          FROM vulnerability_profile vp
          JOIN province p       ON p.id  = vp.province_id
          JOIN sector   s       ON s.id  = vp.sector_id
          LEFT JOIN subsector ss ON ss.id = vp.subsector_id
          JOIN hazard_type h    ON h.id  = vp.hazard_type_id
         WHERE vp.is_active AND p.name = $1 AND s.name = $2
           AND COALESCE(ss.name, '') = COALESCE($3, '') AND h.name = $4
        """, province, main_sector, subsector, hazard)
    if row is None:
        return None

    # Every variable the profile carries, whatever its consensus: a rejected
    # membership still has a column in the workbook the panel filled in.
    codes = [r["code"] for r in await conn.fetch(
        """
        SELECT ic.code
          FROM profile_indicator pi
          JOIN indicator_catalog ic ON ic.id = pi.indicator_id
         WHERE pi.profile_id = $1
         ORDER BY (ic.domain <> 'hazard'), ic.code
        """, row["id"])]
    # An alias NEVER overrides a real code. Several legacy aliases point at a
    # code that has since become a catalogue variable in its own right -
    # 'VERY_WET_DAYS_95TH_PERCENTILE' was an alias for VERY_WET_DAYS before the
    # Central panel made it a variable - and applying those would silently fold
    # the panel's new column back into the one it replaced.
    aliases = {r["alias"]: r["code"] for r in await conn.fetch(
        """
        SELECT ia.alias, ic.code
          FROM indicator_alias ia
          JOIN indicator_catalog ic ON ic.id = ia.indicator_id
         WHERE NOT EXISTS (SELECT 1 FROM indicator_catalog self
                            WHERE self.code = ia.alias)
        """)}
    signed = {r["code"] for r in await conn.fetch(
        "SELECT code FROM indicator_catalog WHERE value_kind = 'signed'")}
    return dict(profile_id=row["id"], profile_code=row["code"],
                province_id=row["province_id"], codes=codes, aliases=aliases,
                signed=signed)


async def load_workbook_values(conn, path: str, *, batch_id: int, user_id: int,
                               review_copy: bool | None = None,
                               expect_scope: tuple[str, str, str | None, str] | None = None,
                               dry_run: bool = False) -> LoadResult:
    """`review_copy=None` decides from the file itself: a workbook stamped
    `protection = unlocked-review` in `_META` was issued open for the panel to
    restructure, so its own `_META` no longer describes its columns and the
    contract must come from the profile instead. Passing the flag by hand is for
    the seed script and tests; a person uploading a file should not have to know
    which kind they were sent.

    `expect_scope` is the (province, sector, subsector, hazard) the UPLOADER
    said they were importing. The file's `_META` is authoritative, so a
    disagreement is refused rather than silently trusted either way: uploading
    the right file into the wrong sector is an easy mistake and an expensive one,
    because the values would key to real divisions under a real profile and look
    entirely plausible."""
    probe: TemplateWorkbook = read_workbook(path)
    if probe.errors:
        return LoadResult(probe.filename, probe.profile_code, 0, 0, 0,
                          probe.errors, probe.warnings)

    if expect_scope is not None:
        want = tuple(x or None for x in expect_scope)
        got = (probe.province, probe.main_sector, probe.subsector or None, probe.hazard)
        if want != got:
            return LoadResult(
                probe.filename, probe.profile_code, 0, 0, 0,
                ["this workbook is for %s / %s / %s / %s, but the import was "
                 "started for %s / %s / %s / %s. Nothing was loaded."
                 % (got + want)], probe.warnings)

    if review_copy is None:
        review_copy = probe.protection == "unlocked-review"

    ctx = await profile_context(conn, probe.province, probe.main_sector,
                                probe.subsector, probe.hazard)
    if ctx is None:
        return LoadResult(probe.filename, probe.profile_code, 0, 0, 0,
                          ["no active profile for %s / %s / %s / %s"
                           % (probe.province, probe.main_sector,
                              probe.subsector, probe.hazard)], probe.warnings)

    expected = None
    if review_copy:
        from app.importer.template_reader import FIXED_COLUMNS, TRAILING_COLUMNS
        expected = FIXED_COLUMNS + ctx["codes"] + TRAILING_COLUMNS

    wb = read_workbook(path, expected=expected, aliases=ctx["aliases"],
                       signed=ctx["signed"])
    errors = list(wb.errors)
    for s in wb.sheets:
        errors.extend("%s: %s" % (s.tab, e) for e in s.errors)
    warnings = list(wb.warnings)
    for s in wb.sheets:
        warnings.extend("%s: %s" % (s.tab, w) for w in s.warnings)
    if errors:
        return LoadResult(wb.filename, wb.profile_code, wb.value_count, 0, 0,
                          errors, warnings)

    ind = {r["code"]: r["id"] for r in await conn.fetch(
        "SELECT id, code FROM indicator_catalog WHERE code = ANY($1::text[])",
        ctx["codes"])}
    div = {r["code"]: r["id"] for r in await conn.fetch(
        "SELECT id, code FROM ds_division WHERE province_id = $1", ctx["province_id"])}

    rows, seen = [], set()
    for s in wb.sheets:
        for v in s.values:
            if v.ds_code not in div:
                errors.append("%s row %d: DS_CODE %s is not a division of %s"
                              % (s.tab, v.excel_row, v.ds_code, wb.province))
                continue
            if v.variable_code not in ind:
                errors.append("%s row %d: %s is not a variable of this profile"
                              % (s.tab, v.excel_row, v.variable_code))
                continue
            rows.append((ind[v.variable_code], div[v.ds_code], s.year_start,
                         s.year_end, v.raw_value, v.data_source, v.notes))
            seen.add(v.ds_code)
    if errors:
        return LoadResult(wb.filename, wb.profile_code, wb.value_count, 0,
                          len(seen), errors, warnings)

    if dry_run:
        # Everything above ran: the file parsed, every column resolved to a
        # variable of this profile and every DS_CODE to a division. Reporting
        # that without writing is the whole point of the check.
        return LoadResult(wb.filename, wb.profile_code, wb.value_count,
                          len(rows), len(seen), [], warnings)

    # An OFFICIAL value belongs to the division, not to whoever uploaded it.
    #
    # `indicator_value_uniq` includes `user_id`, which is right for the expert
    # and community tracks where each contributor's figure is its own record.
    # On the `data` track it is not: the same official figure imported by two
    # people produced TWO rows for one fact (found 3 Sep 2026 -- 328 of them,
    # identical values, two users). The engine reads
    # `DISTINCT ON (ds_division_id) ... ORDER BY year_start DESC`, which has no
    # tiebreak between them, so which one it used was arbitrary -- and that
    # silently breaks the guarantee that recomputation is bit-identical.
    #
    # So on this track the latest import supersedes, whoever ran it. Same
    # transaction as the insert, so a failed load leaves neither.
    await conn.executemany(
        """
        DELETE FROM indicator_value
         WHERE indicator_id = $1 AND ds_division_id = $2 AND source = 'data'
           AND scenario_id IS NULL
           AND year_start IS NOT DISTINCT FROM $3
           AND year_end   IS NOT DISTINCT FROM $4
        """,
        [(r[0], r[1], r[2], r[3]) for r in rows])

    await conn.executemany(
        """
        INSERT INTO indicator_value
            (indicator_id, ds_division_id, source, user_id, year_start, year_end,
             raw_value, derivation, data_source, notes, import_batch_id)
        VALUES ($1, $2, 'data', $8, $3, $4, $5, 'raw_upload', $6, $7, $9)
        ON CONFLICT (indicator_id, ds_division_id, source, user_id, scenario_id,
                     year_start, year_end)
        DO UPDATE SET raw_value = EXCLUDED.raw_value,
                      data_source = EXCLUDED.data_source,
                      notes = EXCLUDED.notes,
                      import_batch_id = EXCLUDED.import_batch_id,
                      updated_at = now()
        """,
        [(r[0], r[1], r[2], r[3], r[4], r[5], r[6], user_id, batch_id) for r in rows])

    return LoadResult(wb.filename, wb.profile_code, wb.value_count, len(rows),
                      len(seen), [], warnings)
