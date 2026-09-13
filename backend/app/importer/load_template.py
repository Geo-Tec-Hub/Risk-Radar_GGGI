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

TWO KINDS OF WORKBOOK
  * A PROFILE workbook is one sector x hazard x province. Its columns are the
    variables of that profile, and `may_write_profile()` decides who may load it.
  * A CLIMATE workbook is one province, no sector. It carries hazard-domain
    variables only -- the ~12 climate facts that `indicator_value` keys to a
    division and a period with no sector column, and that every profile shares.
    `may_write_hazard()` decides who may load it.

  The two paths differ only in where the column contract comes from and which
  authority is asked. Everything after that -- division lookup, blank handling,
  delete-then-insert -- is the same code, deliberately: a climate value and a
  sector value are the same kind of row and must not be written two ways.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.importer.template_reader import TemplateWorkbook, read_workbook


@dataclass
class PreviewRow:
    """One value the file would write, with what is already there.

    Returned on a dry run only. `current` is what the database holds for the
    same (indicator, division, period) today: None means this is a new fact,
    a different number means the import CHANGES a published one. Counting rows
    told an officer how much would be written but never what -- and "451 values
    loaded" reads identically whether the file is correct or a column is
    shifted by one."""
    period: str
    ds_code: str
    ds_name: str
    variable_code: str
    value: float
    current: float | None
    edited: bool = False


@dataclass
class LoadResult:
    filename: str
    profile_code: str | None
    values_read: int
    values_loaded: int
    divisions: int
    errors: list[str]
    warnings: list[str]
    rows: list[PreviewRow] = field(default_factory=list)
    edits_applied: int = 0

    @property
    def ok(self) -> bool:
        return not self.errors


async def _catalogue_maps(conn) -> tuple[dict[str, str], set[str]]:
    """Header aliases and the signed-value codes. Shared by both contexts so a
    workbook is read the same way whichever path it came in on."""
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
    return aliases, signed


async def climate_context(conn, province: str) -> dict | None:
    """Context for a CLIMATE workbook, which has no profile to look up.

    The column contract cannot come from a profile here, so it comes from the
    catalogue: every variable column must be an ACTIVE hazard-domain variable.
    That is the check that keeps a coconut column out of a climate file -- and
    it is stricter than the profile path, not looser, because a climate file
    that carried an exposure column would write a sector's data under nobody's
    ownership.
    """
    row = await conn.fetchrow("SELECT id FROM province WHERE name = $1", province)
    if row is None:
        return None
    codes = [r["code"] for r in await conn.fetch(
        """
        SELECT code FROM indicator_catalog
         WHERE domain = 'hazard' AND status = 'active'
         ORDER BY code
        """)]
    aliases, signed = await _catalogue_maps(conn)
    return dict(profile_id=None, profile_code=None, province_id=row["id"],
                sector_id=None, subsector_id=None, codes=codes,
                aliases=aliases, signed=signed, hazard_codes=set(codes))


async def profile_context(conn, province: str, main_sector: str,
                          subsector: str | None, hazard: str) -> dict | None:
    """The active profile for a scope, with the column list it expects and the
    header aliases that resolve to its variables."""
    row = await conn.fetchrow(
        """
        SELECT vp.id, vp.code, vp.province_id, vp.sector_id, vp.subsector_id
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
    aliases, signed = await _catalogue_maps(conn)
    # Which of this profile's variables are hazard-domain. Held separately
    # because the hazard grant is separate: those twelve climate variables are
    # shared across ~13.5 profiles each and belong to the Met Department, not to
    # whichever sector's workbook happens to carry them.
    hazard_codes = {r["code"] for r in await conn.fetch(
        """
        SELECT ic.code
          FROM profile_indicator pi
          JOIN indicator_catalog ic ON ic.id = pi.indicator_id
         WHERE pi.profile_id = $1 AND ic.domain = 'hazard'
        """, row["id"])}
    return dict(profile_id=row["id"], profile_code=row["code"],
                province_id=row["province_id"], sector_id=row["sector_id"],
                subsector_id=row["subsector_id"], codes=codes, aliases=aliases,
                signed=signed, hazard_codes=hazard_codes)


async def load_workbook_values(conn, path: str, *, batch_id: int, user_id: int,
                               review_copy: bool | None = None,
                               expect_scope: tuple[str, str, str | None, str] | None = None,
                               dry_run: bool = False,
                               enforce_scope: bool = True,
                               edits: dict[tuple[str, str, str], float] | None = None) -> LoadResult:
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
    entirely plausible.

    `edits` are corrections the reviewer made in the preview table, keyed
    (period, ds_code, variable_code). They REPLACE the workbook's value for that
    cell. An edit is only ever applied to a cell the workbook already has -- it
    cannot introduce a value the file did not carry, so the file remains the
    statement of what is being imported and the edit is a visible correction to
    it, recorded in the row's notes and counted in `edits_applied`."""
    probe: TemplateWorkbook = read_workbook(path)
    if probe.errors:
        return LoadResult(probe.filename, probe.profile_code, 0, 0, 0,
                          probe.errors, probe.warnings)

    is_climate = probe.kind == "climate"

    if expect_scope is not None:
        if is_climate:
            # A climate workbook belongs to a province, not to a sector, so
            # there is no sector or hazard for the uploader to have got wrong --
            # only the province, and that one still matters: Central's rainfall
            # written onto Uva's divisions would be entirely plausible numbers
            # in entirely the wrong place.
            want_province = expect_scope[0] or None
            if want_province and want_province != probe.province:
                return LoadResult(
                    probe.filename, probe.profile_code, 0, 0, 0,
                    ["this is the climate workbook for %s Province, but the "
                     "import was started for %s. Nothing was loaded."
                     % (probe.province, want_province)], probe.warnings)
        else:
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

    if is_climate:
        ctx = await climate_context(conn, probe.province)
        if ctx is None:
            return LoadResult(probe.filename, probe.profile_code, 0, 0, 0,
                              ["_META names province %r, which is not a province "
                               "in the register" % probe.province], probe.warnings)
    else:
        ctx = await profile_context(conn, probe.province, probe.main_sector,
                                    probe.subsector, probe.hazard)
        if ctx is None:
            return LoadResult(probe.filename, probe.profile_code, 0, 0, 0,
                              ["no active profile for %s / %s / %s / %s"
                               % (probe.province, probe.main_sector,
                                  probe.subsector, probe.hazard)], probe.warnings)

    expected = None
    # Review-copy mode rebuilds the contract from the PROFILE's current variable
    # list, which a climate file has none of. Its `_META` is the only statement
    # of its columns, so that is what governs -- and every column it names is
    # checked against the catalogue below regardless.
    if review_copy and not is_climate:
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

    # ---- may this person write here? ---------------------------------------
    #
    # Asked of the database (`may_write_profile`), not reimplemented here, so
    # the rule cannot drift between an endpoint and the schema. `enforce_scope`
    # is False only for the seed script, which runs as a service account with
    # no province and is not a person acting through the API.
    if enforce_scope:
        # Both authorities live in the schema (schema_write_scope_addendum.sql,
        # schema_climate_scope_addendum.sql) rather than here, so the rule cannot
        # drift between an endpoint and the database.
        if is_climate:
            if not await conn.fetchval(
                    "SELECT may_write_hazard($1, $2)", user_id, ctx["province_id"]):
                return LoadResult(
                    wb.filename, wb.profile_code, wb.value_count, 0, 0,
                    ["you are not authorised to write climate data for %s "
                     "Province. These variables are shared by every sector and "
                     "are held centrally, so they need the hazard-data grant "
                     "rather than a sector one. Ask an administrator if this is "
                     "your responsibility. Nothing was loaded." % wb.province],
                    warnings)
        else:
            allowed = await conn.fetchval(
                "SELECT may_write_profile($1, $2, $3, $4)",
                user_id, ctx["province_id"], ctx["sector_id"], ctx["subsector_id"])
            if not allowed:
                return LoadResult(
                    wb.filename, wb.profile_code, wb.value_count, 0, 0,
                    ["you are not authorised to write %s data for %s Province. A "
                     "data officer is granted specific sectors; ask an administrator "
                     "to widen your scope if this is your responsibility. Nothing "
                     "was loaded."
                     % (wb.main_sector + (" / " + wb.subsector if wb.subsector else ""),
                        wb.province)], warnings)

            # Same question, same authority as the climate path above -- asked
            # only about the climate columns this sector file happens to carry.
            # Once sector templates drop those columns this branch stops firing
            # on its own; until then it is what stops the last sector officer to
            # import from overwriting the province's weather.
            if not await conn.fetchval(
                    "SELECT may_write_hazard($1, $2)", user_id, ctx["province_id"]):
                present = sorted(ctx["hazard_codes"].intersection(
                    {v.variable_code for s in wb.sheets for v in s.values}))
                if present:
                    return LoadResult(
                        wb.filename, wb.profile_code, wb.value_count, 0, 0,
                        ["this workbook carries hazard (climate) values you are not "
                         "authorised to write: %s. Those variables are shared across "
                         "most sectors and are held centrally, so a sector grant does "
                         "not include them. Either clear those columns, import them "
                         "through the province's climate workbook, or ask an "
                         "administrator for the hazard-data grant. Nothing was loaded."
                         % ", ".join(present[:6])
                         + ("" if len(present) <= 6 else " (and %d more)" % (len(present) - 6))],
                        warnings)

    ind = {r["code"]: r["id"] for r in await conn.fetch(
        "SELECT id, code FROM indicator_catalog WHERE code = ANY($1::text[])",
        ctx["codes"])}
    div = {r["code"]: r["id"] for r in await conn.fetch(
        "SELECT id, code FROM ds_division WHERE province_id = $1", ctx["province_id"])}

    # Division names for the preview: an officer checks a row by the name they
    # know, not by KA1.
    div_name = {r["code"]: r["name"] for r in await conn.fetch(
        "SELECT code, name FROM ds_division WHERE province_id = $1", ctx["province_id"])}

    edits = edits or {}
    unmatched_edits = set(edits)
    rows, seen = [], set()
    for s in wb.sheets:
        for v in s.values:
            if v.ds_code not in div:
                errors.append("%s row %d: DS_CODE %s is not a division of %s"
                              % (s.tab, v.excel_row, v.ds_code, wb.province))
                continue
            if v.variable_code not in ind:
                errors.append(
                    ("%s row %d: %s is not an active hazard (climate) variable. "
                     "A climate workbook carries hazard-domain variables only -- "
                     "a sector's own variables belong in that sector's workbook."
                     if is_climate else
                     "%s row %d: %s is not a variable of this profile")
                    % (s.tab, v.excel_row, v.variable_code))
                continue
            key = (s.tab, v.ds_code, v.variable_code)
            raw_value, notes = v.raw_value, v.notes
            was_edited = key in edits
            if was_edited:
                unmatched_edits.discard(key)
                raw_value = edits[key]
                # Provenance, not decoration. A number that did not come out of
                # the workbook must say so, or the workbook stops being an
                # audit trail for what is in the database.
                notes = ("%s; " % notes if notes else "") + (
                    "corrected during import review from %s" % v.raw_value)
            rows.append((ind[v.variable_code], div[v.ds_code], s.year_start,
                         s.year_end, raw_value, v.data_source, notes))
            seen.add(v.ds_code)
    for period, ds_code, code in sorted(unmatched_edits):
        # Silently dropping it would load the file's original number while the
        # reviewer believed they had corrected it.
        errors.append("the correction to %s / %s / %s does not match any cell "
                      "in this workbook" % (period, ds_code, code))

    if errors:
        return LoadResult(wb.filename, wb.profile_code, wb.value_count, 0,
                          len(seen), errors, warnings)

    if dry_run:
        # Everything above ran: the file parsed, every column resolved to a
        # variable of this profile and every DS_CODE to a division. Reporting
        # that without writing is the whole point of the check.
        #
        # What is already there, so the preview can say "new" or "changes 3.0 ->
        # 4.0". Read on the same key the write uses, in one query rather than
        # one per row.
        code_of = {v: k for k, v in ind.items()}
        name_of = {v: k for k, v in div.items()}
        existing = {(r["indicator_id"], r["ds_division_id"], r["year_start"], r["year_end"]):
                    float(r["raw_value"])
                    for r in await conn.fetch(
                        """
                        SELECT indicator_id, ds_division_id, year_start, year_end, raw_value
                          FROM indicator_value
                         WHERE source = 'data' AND scenario_id IS NULL
                           AND ds_division_id = ANY($1::bigint[])
                           AND indicator_id   = ANY($2::bigint[])
                        """,
                        sorted({r[1] for r in rows}), sorted({r[0] for r in rows}))}
        preview = []
        for r in rows:
            ds_code = name_of[r[1]]
            preview.append(PreviewRow(
                period="%d-%d" % (r[2], r[3]),
                ds_code=ds_code,
                ds_name=div_name.get(ds_code, ds_code),
                variable_code=code_of[r[0]],
                value=float(r[4]),
                current=existing.get((r[0], r[1], r[2], r[3])),
                edited=bool(r[6] and "corrected during import review" in str(r[6])),
            ))
        return LoadResult(wb.filename, wb.profile_code, wb.value_count,
                          len(rows), len(seen), [], warnings,
                          rows=preview, edits_applied=len(edits))

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
                      len(seen), [], warnings, edits_applied=len(edits))
