"""Workbook reading: find the header row, classify columns, extract rows.

Layout varies between workbooks (TASK_BRIEF_IMPORTER.md "Reading the files"),
so this finds things rather than assuming them:

- the header row is wherever a cell normalises to 'dscode', scanned in the
  first ~10 rows;
- columns are matched by stripping non-alphanumerics and lowercasing, so
  'DS_Code', 'DS Code' and 'ds code' are the same column;
- any column whose header cell is blank is skipped entirely, never read and
  never reported as unresolved -- that's where sheets carry stray free text
  ('No Paddy', a neighbouring division's name and count) with no real header
  of its own.

**Hazard-block detection**, added after seeing the real files
(`design/ingestion/samples/Paddy_Drought (1).xlsx`,
`Paddy_Flood.xlsx`) rather than guessing at the brief's diagram alone:

- The brief's 'Original Data | Normalization | % Calculation | WEB' group
  labels aren't one row above the header, or one label per raw column --
  they're merged cells split across the *two* rows above the header ('Original
  Data' / '% Calculation' on one, 'Normalization' / 'WEB' on the other, in the
  observed files), each spanning several raw columns' worth of Excel-computed
  duplicates. `_zone_labels_by_column` forward-fills both lookback rows
  independently and takes whichever has a label at each column.
- Every column under a 'Normalization' or '% Calculation' zone is
  Excel-computed and skipped outright, regardless of what its own header
  text says (it's sometimes a plain re-typed copy of the raw label, sometimes
  a misspelled one -- e.g. 'lightening' for 'lightning' -- that would
  otherwise slip through catalogue/alias matching and get imported as if it
  were a second raw source).
- 'WEB' is genuinely ambiguous in the real files: sometimes it marks the
  frozen, Excel-combined output of a period-pair or weighted-component
  variable (the column the brief's "single most important rule" says never to
  import), and sometimes -- for a hazard component that isn't period-combined
  at all (observed: STRONG_WIND_EVENTS, LIGHTNING_INCIDENTS) -- it's simply
  mislabelled over what is, in fact, the sheet's only raw column for that
  variable. The two are told apart by what immediately precedes them: a
  frozen composite is always preceded by an explicitly `NN%`-weighted column
  (`'... (25%)'`, `'... - 60%'`); a genuine raw value isn't. See
  `_TRAILING_PERCENT`.
- A column whose normalised header exactly repeats an earlier column's in the
  same row is a duplicate block copy (observed with no zone label covering it
  at all in one sheet) and is skipped the same way, whatever kind the first
  occurrence resolved to.

This is a heuristic, not a guarantee -- it's verified against the two real
hazard workbooks available, not proven for every layout that might arrive
later. Every skip is reported with its reason (`ParsedColumn.note`) so a
human can sanity-check it against a report, per FR-2.11.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Optional

from openpyxl.worksheet.worksheet import Worksheet

from app.importer.catalog import Catalog, CatalogEntry, normalize_header

HEADER_SCAN_ROWS = 10

# Structural columns every sheet carries alongside its indicator values.
# Multiple spellings observed across the workbooks (brief: 'DS_Code' / 'DS
# Code', 'DSD_N' / 'Ds Division', 'DISTRICT_N' / 'District').
IDENTITY_DS_CODE = {"dscode"}
IDENTITY_PROVINCE = {"provincen", "province"}
IDENTITY_DISTRICT = {"districtn", "district"}
IDENTITY_DIVISION_NAME = {"dsdn", "dsdivision", "dsdname", "divisionname", "dsname"}

# The Excel-computed part of a hazard block (§ "The single most important
# rule") -- never imported, since it's frozen against a register that has
# since moved. Matched both against a column's own header (simple sheets)
# and against the forward-filled zone label above the header (real hazard
# sheets -- see module docstring). 'web' is deliberately excluded: it's
# ambiguous and handled separately by _TRAILING_PERCENT.
IGNORED_COMPUTED_HEADERS = {
    "normalization",
    "normalisation",
    "normalized",
    "normalised",
    "calculation",
    "pctcalculation",
    "percentagecalculation",
}

# How many rows above the header row carry block-group labels ('Original
# Data' / 'Normalization' / '% Calculation' / 'WEB'). Observed split across
# 2 distinct rows in the real files; a 3rd row above that is metadata
# ('+' / weight numbers), never a zone label.
_ZONE_LOOKBACK_ROWS = 2

# A frozen WEB composite is always preceded by an explicitly weighted raw
# column ('... (25%)', '... - 60%'); a genuine single-source raw value isn't.
_TRAILING_PERCENT = re.compile(r"\(?\s*\d{1,3}\s*%\s*\)?\s*$")

# openpyxl(data_only=True) returns a cached Excel error as a bare string --
# '#DIV/0!' etc. Treat as absent, never as a value (brief: "treat any Excel
# error value as absent, never as zero").
_EXCEL_ERROR = re.compile(r"^#[A-Z0-9/!?]+$")


def is_excel_error(value: object) -> bool:
    return isinstance(value, str) and bool(_EXCEL_ERROR.match(value.strip()))


def is_blank(value: object) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


class ColumnKind(str, Enum):
    DS_CODE = "ds_code"
    PROVINCE = "province"
    DISTRICT = "district"
    DIVISION_NAME = "division_name"
    IGNORED_COMPUTED = "ignored_computed"
    INDICATOR = "indicator"
    UNRESOLVED = "unresolved"


@dataclass(frozen=True)
class ParsedColumn:
    excel_col: int  # 1-based
    letter: str
    raw_header: str
    kind: ColumnKind
    indicator: Optional[CatalogEntry] = None
    note: Optional[str] = None  # why an IGNORED_COMPUTED column was skipped


@dataclass
class DataRow:
    excel_row: int
    values: dict[int, object]  # excel_col -> raw cell value


@dataclass
class ParsedSheet:
    sheet_name: str
    header_row: Optional[int]
    columns: list[ParsedColumn]
    rows: list[DataRow]


def find_header_row(ws: Worksheet, max_scan: int = HEADER_SCAN_ROWS) -> Optional[int]:
    max_row = min(ws.max_row, max_scan)
    for r in range(1, max_row + 1):
        for c in range(1, ws.max_column + 1):
            if normalize_header(ws.cell(row=r, column=c).value) in IDENTITY_DS_CODE:
                return r
    return None


def _zone_labels_by_column(ws: Worksheet, header_row: int) -> list[str]:
    """Normalised block-group label in effect at each column (1-indexed list,
    empty string if none) -- forward-filled independently across each of the
    `_ZONE_LOOKBACK_ROWS` rows above the header row, nearer row wins. See the
    module docstring for why more than one row needs scanning."""
    lookback_rows = [r for r in range(header_row - 1, header_row - 1 - _ZONE_LOOKBACK_ROWS, -1) if r >= 1]
    per_row: dict[int, list[str]] = {}
    for r in lookback_rows:
        current = ""
        filled: list[str] = []
        for c in range(1, ws.max_column + 1):
            val = ws.cell(row=r, column=c).value
            if not is_blank(val):
                current = normalize_header(val)
            filled.append(current)
        per_row[r] = filled

    zones: list[str] = []
    for i in range(ws.max_column):
        zone = ""
        for r in lookback_rows:  # nearer rows first
            if per_row[r][i]:
                zone = per_row[r][i]
                break
        zones.append(zone)
    return zones


def classify_columns(ws: Worksheet, header_row: int, catalog: Catalog) -> list[ParsedColumn]:
    columns: list[ParsedColumn] = []
    seen_headers: dict[str, int] = {}  # normalized header text -> excel_col of first occurrence
    zones = _zone_labels_by_column(ws, header_row) if header_row > 1 else [""] * ws.max_column

    for c in range(1, ws.max_column + 1):
        header_cell = ws.cell(row=header_row, column=c)
        if is_blank(header_cell.value):
            continue  # never read, never reported -- see module docstring
        raw_header = str(header_cell.value).strip()
        norm = normalize_header(raw_header)
        zone = zones[c - 1]
        note: Optional[str] = None
        indicator: Optional[CatalogEntry] = None

        if norm in IDENTITY_DS_CODE:
            kind = ColumnKind.DS_CODE
        elif norm in IDENTITY_PROVINCE:
            kind = ColumnKind.PROVINCE
        elif norm in IDENTITY_DISTRICT:
            kind = ColumnKind.DISTRICT
        elif norm in IDENTITY_DIVISION_NAME:
            kind = ColumnKind.DIVISION_NAME
        elif zone in IGNORED_COMPUTED_HEADERS:
            kind = ColumnKind.IGNORED_COMPUTED
            note = f"under the '{ws.cell(row=header_row - 1, column=c).value or zone}' block above the header -- Excel-computed, not raw"
        elif zone == "web" and columns and _TRAILING_PERCENT.search(columns[-1].raw_header):
            kind = ColumnKind.IGNORED_COMPUTED
            note = f"frozen composite (WEB), follows the %-weighted column '{columns[-1].raw_header}' -- see brief's 25%/75% section"
        elif norm in seen_headers:
            prev_letter = ws.cell(row=header_row, column=seen_headers[norm]).column_letter
            kind = ColumnKind.IGNORED_COMPUTED
            note = f"duplicate of column {prev_letter} in this sheet"
        elif norm in IGNORED_COMPUTED_HEADERS:
            kind = ColumnKind.IGNORED_COMPUTED
        else:
            entry = catalog.resolve_indicator(norm)
            if entry is not None:
                kind, indicator = ColumnKind.INDICATOR, entry
            else:
                kind = ColumnKind.UNRESOLVED

        seen_headers.setdefault(norm, c)
        columns.append(
            ParsedColumn(
                excel_col=c,
                letter=header_cell.column_letter,
                raw_header=raw_header,
                kind=kind,
                indicator=indicator,
                note=note,
            )
        )
    return columns


def extract_rows(ws: Worksheet, header_row: int, columns: list[ParsedColumn]) -> list[DataRow]:
    tracked_cols = [col.excel_col for col in columns]
    rows: list[DataRow] = []
    for r in range(header_row + 1, ws.max_row + 1):
        values = {c: ws.cell(row=r, column=c).value for c in tracked_cols}
        if all(is_blank(v) for v in values.values()):
            continue  # a genuinely blank row (trailing rows, spacer rows) -- not data
        rows.append(DataRow(excel_row=r, values=values))
    return rows


def parse_sheet(ws: Worksheet, catalog: Catalog) -> ParsedSheet:
    header_row = find_header_row(ws)
    if header_row is None:
        return ParsedSheet(sheet_name=ws.title, header_row=None, columns=[], rows=[])
    columns = classify_columns(ws, header_row, catalog)
    rows = extract_rows(ws, header_row, columns)
    return ParsedSheet(sheet_name=ws.title, header_row=header_row, columns=columns, rows=rows)
