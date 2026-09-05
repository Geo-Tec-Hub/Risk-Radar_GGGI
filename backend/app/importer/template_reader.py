"""Strict reader for the GENERATED upload templates (design/templates).

WHY THIS IS A SECOND READER.  `reader.py` parses the legacy nine-province
workbooks: multi-block sheets, zone label rows, a numeric DS_Code and free-text
variable labels that have to be reconciled against the catalogue. Those files
are human artefacts and the reader's job is to survive them.

These are different files. The system generated them, so their shape is known
exactly and a surprise is a defect rather than something to accommodate. That is
the dual-path ingestion settled in D3 rev 5: a STRICT path for templates and a
reconciliation wizard for legacy sheets. Trying to serve both from one reader
would mean the strict path inherits the lenient path's guesses.

THE CONTRACT IS `_META`, NOT THE COLUMN HEADINGS.  The hidden `_META` sheet
carries `profile_code`, `expected_columns` and `periods`. Validating against it
means a renamed, reordered or inserted column is caught as a structural error
naming the file, instead of being silently skipped.

PERIOD COMES FROM THE TAB NAME.  Not from the YEAR_START/YEAR_END cells. In the
returned Central files those cells still read 2020/2025 because they were locked
when the panel renamed the tabs to 2021-2025 / 2026-2030 (their NOTED.xlsx says
so). Milinda's call, 3 Sep 2026: the tab is authoritative, the cells are
disregarded. The reader records the disagreement as a warning so it is visible,
and refuses only if the tab name itself is unreadable.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

import openpyxl
from openpyxl.worksheet.worksheet import Worksheet

FIXED_COLUMNS = ["DS_CODE", "DS_DIVISION", "DISTRICT", "YEAR_START", "YEAR_END"]
TRAILING_COLUMNS = ["DATA_SOURCE", "NOTES"]
HEADER_ROW = 2
EXAMPLE_ROW = 4          # the grey specimen row; never a data row
FIRST_DATA_ROW = 5
TAB_RE = re.compile(r"^(\d{4})-(\d{4})$")


@dataclass(frozen=True)
class TemplateValue:
    excel_row: int
    ds_code: str
    variable_code: str
    raw_value: float
    data_source: Optional[str]
    notes: Optional[str]


@dataclass
class TemplateSheet:
    tab: str
    year_start: int
    year_end: int
    values: list[TemplateValue] = field(default_factory=list)
    rows_scanned: int = 0
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


@dataclass
class TemplateWorkbook:
    filename: str
    profile_code: Optional[str] = None
    province: Optional[str] = None
    main_sector: Optional[str] = None
    subsector: Optional[str] = None
    hazard: Optional[str] = None
    protection: Optional[str] = None
    expected_columns: list[str] = field(default_factory=list)
    sheets: list[TemplateSheet] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def would_load(self) -> bool:
        return not self.errors and not any(s.errors for s in self.sheets)

    @property
    def value_count(self) -> int:
        return sum(len(s.values) for s in self.sheets)


def read_meta(wb: openpyxl.Workbook) -> dict[str, str]:
    if "_META" not in wb.sheetnames:
        return {}
    ws = wb["_META"]
    out: dict[str, str] = {}
    for r in range(1, ws.max_row + 1):
        k = ws.cell(r, 1).value
        if k:
            out[str(k).strip()] = ws.cell(r, 2).value
    return out


def _header(ws: Worksheet) -> list[str]:
    return [(ws.cell(HEADER_ROW, c).value or "") and str(ws.cell(HEADER_ROW, c).value).strip()
            for c in range(1, ws.max_column + 1)]


def read_sheet(ws: Worksheet, expected: list[str],
               aliases: Optional[dict[str, str]] = None,
               ordered: bool = True,
               signed: Optional[set[str]] = None) -> TemplateSheet:
    m = TAB_RE.match(ws.title)
    if not m:
        s = TemplateSheet(tab=ws.title, year_start=0, year_end=0)
        s.errors.append("tab name %r is not a YYYY-YYYY period" % ws.title)
        return s
    y0, y1 = int(m.group(1)), int(m.group(2))
    sheet = TemplateSheet(tab=ws.title, year_start=y0, year_end=y1)

    header = [(aliases or {}).get(h, h) for h in _header(ws)]
    if expected and header != expected:
        missing = [c for c in expected if c not in header]
        extra = [c for c in header if c and c not in expected]
        dupes = sorted({c for c in header if c and header.count(c) > 1})
        # A column the contract has and the file does not carries no data, so in
        # review-copy mode it is reported and skipped rather than failing the
        # file -- the panel was invited to drop columns. An UNKNOWN column is
        # always an error: it means a value nothing can be keyed to.
        if missing:
            (sheet.errors if ordered else sheet.warnings).append(
                "columns absent from the file: " + ", ".join(missing))
        if extra:
            sheet.errors.append("columns not in the contract: " + ", ".join(extra))
        if dupes:
            sheet.errors.append(
                "two columns resolve to the same variable: " + ", ".join(dupes))
        if ordered and not missing and not extra:
            sheet.errors.append("columns are in a different order than _META states")
    if sheet.errors:
        return sheet

    idx = {name: i + 1 for i, name in enumerate(header) if name}
    var_cols = [(name, col) for name, col in idx.items()
                if name not in FIXED_COLUMNS and name not in TRAILING_COLUMNS]

    mismatched_years = 0
    for r in range(FIRST_DATA_ROW, ws.max_row + 1):
        ds_code = ws.cell(r, idx["DS_CODE"]).value
        if ds_code in (None, ""):
            continue
        sheet.rows_scanned += 1
        cell_y0 = ws.cell(r, idx["YEAR_START"]).value
        cell_y1 = ws.cell(r, idx["YEAR_END"]).value
        if (cell_y0, cell_y1) != (y0, y1):
            mismatched_years += 1
        src = ws.cell(r, idx["DATA_SOURCE"]).value if "DATA_SOURCE" in idx else None
        note = ws.cell(r, idx["NOTES"]).value if "NOTES" in idx else None
        for name, col in var_cols:
            v = ws.cell(r, col).value
            if v in (None, ""):
                continue          # blank means not collected - never a zero
            if isinstance(v, str):
                sheet.errors.append(
                    "row %d, column %s: %r is text, not a number" % (r, name, v[:40]))
                continue
            if float(v) < 0 and name not in (signed or set()):
                # Per-variable, never global: a variable declared 'signed' in
                # indicator_catalog expresses a change or trend, where negative
                # is meaningful. Everything else is a quantity and a negative
                # one is a data error worth stopping the file for.
                sheet.errors.append(
                    "row %d, column %s: %s is negative, and %s is not declared "
                    "as a signed variable" % (r, name, v, name))
                continue
            sheet.values.append(TemplateValue(
                excel_row=r, ds_code=str(ds_code).strip(), variable_code=name,
                raw_value=float(v),
                data_source=str(src).strip() if src else None,
                notes=str(note).strip() if note else None))

    if mismatched_years:
        # Not an error: the tab is authoritative (3 Sep 2026). Reported so a
        # stale year cell is never silently absorbed.
        sheet.warnings.append(
            "%d of %d rows carry YEAR_START/YEAR_END %s-%s, disagreeing with the "
            "tab; the tab name wins and %d-%d was used"
            % (mismatched_years, sheet.rows_scanned, cell_y0, cell_y1, y0, y1))
    return sheet


def read_workbook(path: str, expected: Optional[list[str]] = None,
                  aliases: Optional[dict[str, str]] = None,
                  signed: Optional[set[str]] = None) -> TemplateWorkbook:
    """Read one generated upload template.

    `expected` overrides the `_META` column contract. Pass it ONLY for a review
    copy the panel was invited to restructure: their `_META` still describes the
    build they were sent, so validating against it would reject the very changes
    that were asked for. For a locked issue leave it None, so `_META` governs
    and a changed structure is an error.

    `aliases` maps a column heading to the catalogue code it means - the
    `indicator_alias` case, e.g. a panel's hand-typed `3DAY_CUMULATIVE_RAINFALL`
    for `THREE_DAY_CUMULATIVE_RAINFALL`.
    """
    out = TemplateWorkbook(filename=path.replace("\\", "/").split("/")[-1])
    try:
        wb = openpyxl.load_workbook(path, data_only=True)
    except Exception as exc:
        # A .xlsx is a zip. Anything that is not one - a CSV renamed to .xlsx,
        # a truncated download, an .xls saved under the wrong extension -
        # raises out of openpyxl, and before 4 Sep 2026 that propagated all the
        # way to a 500. An upload the system cannot read is a REFUSAL with a
        # reason, not a server error: a 500 tells the person nothing about what
        # they did wrong and reads as "the site is broken".
        out.errors.append(
            "this file could not be opened as an .xlsx workbook (%s: %s). "
            "A file renamed to .xlsx is still not one - export it from Excel "
            "as .xlsx, or re-download it."
            % (type(exc).__name__, str(exc)[:120]))
        return out
    meta = read_meta(wb)
    if not meta:
        out.errors.append("no _META sheet - this is not a generated upload template")
        return out

    out.profile_code = meta.get("profile_code")
    out.province = meta.get("province")
    out.main_sector = meta.get("main_sector")
    out.subsector = meta.get("subsector") or None
    out.hazard = meta.get("hazard")
    out.protection = meta.get("protection")
    out.expected_columns = [c for c in str(meta.get("expected_columns") or "").split("|") if c]
    contract = expected if expected is not None else out.expected_columns
    if expected is not None:
        out.warnings.append(
            "columns validated against the CURRENT profile, not this file's _META "
            "- review-copy mode")

    if out.protection == "unlocked-review":
        out.warnings.append(
            "this is an unlocked REVIEW copy - its structure was open for editing, "
            "so the _META contract is a weaker guarantee than on a locked issue")

    for name in wb.sheetnames:
        if TAB_RE.match(name):
            out.sheets.append(read_sheet(wb[name], contract, aliases,
                                         ordered=expected is None,
                                         signed=signed))
    if not out.sheets:
        out.errors.append("no period tabs found")
    return out
