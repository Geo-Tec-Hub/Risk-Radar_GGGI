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
class ColumnInfo:
    """One variable column, described the way the WORKBOOK describes it.

    The grid used to label columns with the bare catalogue code, which is what
    the file's header row says but not what the file actually shows a person:
    the template puts a sub-header under every code carrying the domain, the
    human name and the entry rule ("hazard: SPI (Intensity) >> fixed window -
    same value on both period tabs"). Reading a screen of codes and a screen of
    that are different experiences, and only one of them tells an officer what
    to type. So the same three facts are assembled here, from the catalogue
    that generated them.

    `order` is the profile's own column order -- hazard variables first, then
    exposure, matching `expected_columns` in the file's _META. The grid sorted
    alphabetically before, which silently reordered every workbook."""
    code: str
    name: str
    domain: str | None
    unit: str | None
    aggregation: str | None
    hint: str | None
    order: int


@dataclass
class DivisionInfo:
    """A DS division of the province. EVERY division, not only the ones the
    file carried a value for -- a division whose row is entirely blank has no
    values and so had no row in the grid at all, which is precisely the
    division someone needs to see and fill in."""
    code: str
    name: str


@dataclass
class WeightRead:
    """One WEIGHTS-tab row, set beside what the profile holds today.

    ADVISORY. Nothing in this module writes a weight: `save_profile_weights()`
    is the single audited path and the confirmation screen is where a proposal
    becomes a saved weight. What this carries is the diff a person needs in
    order to confirm -- proposed against current, per variable, with the
    variable's standing in the profile stated rather than implied.

    `status`:
      same      -- proposed equals what is saved; nothing to do
      changed   -- proposed differs from a saved weight
      new       -- proposed a weight where the profile has none yet
      blank     -- the tab lists the variable but proposes nothing
      unknown   -- the tab names a variable this profile does not carry
    """
    variable_code: str
    variable_name: str | None
    domain: str | None
    legacy_pct: float | None
    proposed_pct: float | None
    current_pct: float | None
    in_profile: bool
    status: str


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
    # Values typed into cells the workbook left blank. Counted apart from
    # `edits_applied` because they are a different act: one corrects what was
    # submitted, the other adds to it.
    values_added: int = 0
    weights: list[WeightRead] = field(default_factory=list)
    weights_tab_present: bool = False
    # Every period tab the reader SAW, including one that carried no values.
    # Reported separately from the values because "this period is empty" and
    # "this period is not in the file" are different facts and the review screen
    # has to be able to tell them apart -- deriving the tab list from the values
    # alone makes an empty 2026-2030 tab vanish, which reads as "it came
    # through and was fine".
    periods: list[str] = field(default_factory=list)
    columns: list[ColumnInfo] = field(default_factory=list)
    divisions_all: list[DivisionInfo] = field(default_factory=list)

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


async def _weights_read(conn, wb: TemplateWorkbook, ctx: dict) -> list[WeightRead]:
    """Set the workbook's proposed weights beside what the profile holds today.

    A climate workbook has no profile, so there is nothing to compare against
    and nothing to confirm -- its variables are weighted inside each sector
    profile that reads them, not centrally. It returns empty rather than
    inventing a comparison."""
    if not wb.weights or ctx.get("profile_id") is None:
        return []
    current = {r["code"]: (float(r["weight_pct"]) if r["weight_pct"] is not None else None)
               for r in await conn.fetch(
                   """
                   SELECT ic.code, pi.weight_pct
                     FROM profile_indicator pi
                     JOIN indicator_catalog ic ON ic.id = pi.indicator_id
                    WHERE pi.profile_id = $1
                   """, ctx["profile_id"])}
    out: list[WeightRead] = []
    for w in wb.weights:
        in_profile = w.variable_code in current
        cur = current.get(w.variable_code)
        if not in_profile:
            status = "unknown"
        elif w.proposed_pct is None:
            status = "blank"
        elif cur is None:
            status = "new"
        elif abs(cur - w.proposed_pct) < 1e-9:
            status = "same"
        else:
            status = "changed"
        out.append(WeightRead(
            variable_code=w.variable_code, variable_name=w.variable_name,
            domain=w.domain, legacy_pct=w.legacy_pct,
            proposed_pct=w.proposed_pct, current_pct=cur,
            in_profile=in_profile, status=status))
    return out


# The wording the templates print under each column heading. Kept identical to
# design/templates/generate_templates.py AGG_HINT so the screen and the
# spreadsheet say the same thing in the same words -- an officer reading
# ">> enter a TYPICAL YEAR (not a total)" in Excel must not meet a paraphrase
# of it in the browser and wonder whether they are different rules.
AGG_HINT = {
    "average": "enter a TYPICAL YEAR (not a total)",
    "total": "enter the TOTAL for the whole period",
    "max": "enter the MAXIMUM (already a fixed-window figure)",
    "end_of_period": "enter the value AT THE END of the period",
    "fixed_window": "fixed window - same value on both period tabs",
}


async def _columns(conn, ctx: dict) -> list[ColumnInfo]:
    """The profile's variable columns, in the profile's own order.

    `ctx["codes"]` is already ordered hazard-then-code, which is the order
    `expected_columns` was built from and therefore the order the columns sit
    in the workbook. Preserved here rather than re-sorted, so the grid reads
    left-to-right the way the file does.
    """
    if not ctx["codes"]:
        return []
    rows = {r["code"]: r for r in await conn.fetch(
        """
        SELECT code, name, domain, unit, period_aggregation
          FROM indicator_catalog
         WHERE code = ANY($1::text[])
        """, ctx["codes"])}
    out: list[ColumnInfo] = []
    for i, code in enumerate(ctx["codes"]):
        r = rows.get(code)
        if r is None:
            # In the profile but not in the catalogue: shouldn't happen, and if
            # it does the column still has to appear, or the grid would quietly
            # drop a column the file carries.
            out.append(ColumnInfo(code, code, None, None, None, None, i))
            continue
        agg = r["period_aggregation"]
        out.append(ColumnInfo(
            code=code, name=r["name"] or code, domain=r["domain"],
            unit=r["unit"], aggregation=agg, hint=AGG_HINT.get(agg), order=i))
    return out


def _period_years(period: str) -> tuple[int, int] | None:
    try:
        a, b = period.split("-")
        return int(a), int(b)
    except (ValueError, AttributeError):
        return None


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

    # Read alongside the values, returned with them, and written by nobody.
    weights_read = await _weights_read(conn, wb, ctx)
    columns = await _columns(conn, ctx)
    divisions_all = sorted((DivisionInfo(code=c, name=n) for c, n in div_name.items()),
                           key=lambda d: d.name)

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
    # AN EDIT TO A CELL THE WORKBOOK LEFT BLANK IS AN ADDITION, NOT AN ERROR.
    #
    # This used to be refused outright, on the reasoning that the workbook
    # should stay the complete statement of what was imported. In practice it
    # meant an officer looking at a gap they could see, knew the number for, and
    # had the grant to write, had to go back to Excel, edit the file and
    # re-upload it -- and a period tab that arrived empty could not be filled at
    # all from the screen that was showing them it was empty.
    #
    # So an addition is allowed, and the audit trail is kept honest a different
    # way: it is stamped in `notes` as having come from the review screen rather
    # than from the file, so "which of these numbers were not in the workbook"
    # stays an answerable question. The checks that matter are unchanged and are
    # applied below exactly as they are to a value the file carried -- the
    # period must be a tab of this file, the DS_CODE a division of this
    # province, the variable one this profile carries -- and the same
    # may_write_profile / may_write_hazard grants have already been asked. An
    # addition can therefore never reach anywhere the file itself could not.
    added = 0
    for period, ds_code, code in sorted(unmatched_edits):
        years = _period_years(period)
        if years is None or period not in {sh.tab for sh in wb.sheets}:
            errors.append("the value added for %s / %s / %s names a period that "
                          "is not a tab of this workbook" % (period, ds_code, code))
            continue
        if ds_code not in div:
            errors.append("the value added for %s / %s / %s: DS_CODE %s is not a "
                          "division of %s" % (period, ds_code, code, ds_code, wb.province))
            continue
        if code not in ind:
            errors.append("the value added for %s / %s / %s: %s is not a variable "
                          "of this profile" % (period, ds_code, code, code))
            continue
        y0, y1 = years
        rows.append((ind[code], div[ds_code], y0, y1, edits[(period, ds_code, code)],
                     None, "added during import review - not in the workbook"))
        seen.add(ds_code)
        added += 1

    if errors:
        # The weights still travel with a refused file: the tab is often the
        # thing the panel most wants to see confirmed, and a DS_CODE typo in a
        # period tab says nothing about it.
        return LoadResult(wb.filename, wb.profile_code, wb.value_count, 0,
                          len(seen), errors, warnings, weights=weights_read,
                          weights_tab_present=wb.weights_tab_present,
                          periods=[sh.tab for sh in wb.sheets],
                      columns=columns, divisions_all=divisions_all)

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
                edited=bool(r[6] and "import review" in str(r[6])),
            ))
        return LoadResult(wb.filename, wb.profile_code, wb.value_count,
                          len(rows), len(seen), [], warnings,
                          rows=preview, edits_applied=len(edits) - added,
                          values_added=added,
                          weights=weights_read,
                          weights_tab_present=wb.weights_tab_present,
                          periods=[sh.tab for sh in wb.sheets],
                          columns=columns, divisions_all=divisions_all)

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
                      len(seen), [], warnings, edits_applied=len(edits) - added,
                      values_added=added,
                      weights=weights_read,
                      weights_tab_present=wb.weights_tab_present,
                      periods=[sh.tab for sh in wb.sheets],
                          columns=columns, divisions_all=divisions_all)
