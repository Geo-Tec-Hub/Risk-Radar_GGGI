"""Validation against SRS Annex A -- reject, do not guess.

FR-2.3: "No file shall load partially. A file containing any error loads
nothing." The brief's finer-grained language ("reject the row", "reject the
cell") is the *reporting* granularity -- every failure names the row, the
column and the offending value -- but the load decision stays binary per
sheet: `SheetReport.would_load` is true only when there are zero findings at
any level. This module never writes anything; it only decides what a real
import would accept or refuse.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

from app.importer.catalog import Catalog, CatalogEntry, Division, normalize_province
from app.importer.reader import ColumnKind, ParsedColumn, ParsedSheet, is_blank, is_excel_error


@dataclass(frozen=True)
class SheetFinding:
    code: str
    message: str


@dataclass(frozen=True)
class RowFinding:
    excel_row: int
    code: str
    message: str


@dataclass(frozen=True)
class CellFinding:
    excel_row: int
    column: str
    code: str
    message: str


@dataclass(frozen=True)
class AcceptedValue:
    excel_row: int
    ds_code_num: int
    division: Division
    indicator: CatalogEntry
    raw_value: float


@dataclass
class SheetReport:
    sheet_name: str
    header_row: Optional[int]
    catalog_source: str
    columns: list[ParsedColumn] = field(default_factory=list)
    expected_province: Optional[str] = None
    sheet_findings: list[SheetFinding] = field(default_factory=list)
    row_findings: list[RowFinding] = field(default_factory=list)
    cell_findings: list[CellFinding] = field(default_factory=list)
    accepted_values: list[AcceptedValue] = field(default_factory=list)
    excel_error_cells: int = 0
    outstanding_divisions: list[Division] = field(default_factory=list)
    rows_scanned: int = 0
    rows_resolved: int = 0  # rows whose DS_Code matched a division in the register

    @property
    def would_load(self) -> bool:
        return not (self.sheet_findings or self.row_findings or self.cell_findings)


def _to_int(raw: object) -> Optional[int]:
    if isinstance(raw, bool):
        return None
    if isinstance(raw, int):
        return raw
    if isinstance(raw, float) and raw.is_integer():
        return int(raw)
    if isinstance(raw, str):
        s = raw.strip()
        if re.fullmatch(r"-?\d+", s):
            return int(s)
        try:
            f = float(s)
        except ValueError:
            return None
        return int(f) if f.is_integer() else None
    return None


def _to_float(raw: object) -> Optional[float]:
    if isinstance(raw, bool):
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    if isinstance(raw, str):
        s = raw.strip().replace(",", "")
        try:
            return float(s)
        except ValueError:
            return None
    return None


def _find_column(columns: list[ParsedColumn], kind: ColumnKind) -> Optional[ParsedColumn]:
    return next((c for c in columns if c.kind == kind), None)


def validate_sheet(
    parsed: ParsedSheet,
    catalog: Catalog,
    expected_province: Optional[str] = None,
) -> SheetReport:
    report = SheetReport(
        sheet_name=parsed.sheet_name,
        header_row=parsed.header_row,
        catalog_source=catalog.source,
        columns=parsed.columns,
        expected_province=expected_province,
    )

    if parsed.header_row is None:
        report.sheet_findings.append(
            SheetFinding("NO_HEADER", "No header row found in the first 10 rows (no cell normalises to 'DS_Code')")
        )
        return report

    for col in parsed.columns:
        if col.kind == ColumnKind.UNRESOLVED:
            report.sheet_findings.append(
                SheetFinding("V011", f"Column '{col.raw_header}' is not in the catalogue and has no alias")
            )

    ds_code_col = _find_column(parsed.columns, ColumnKind.DS_CODE)
    province_col = _find_column(parsed.columns, ColumnKind.PROVINCE)
    indicator_cols = [c for c in parsed.columns if c.kind == ColumnKind.INDICATOR]

    if ds_code_col is None:
        # find_header_row() only returns a row that had a DS_Code-normalising
        # cell, so this would mean that exact cell was later judged blank --
        # not reachable in practice, but fail loudly rather than silently
        # skipping every row below.
        report.sheet_findings.append(SheetFinding("NO_DS_CODE_COLUMN", "Header row located but no DS_Code column survived classification"))
        return report

    observed_provinces: dict[str, list[int]] = {}
    seen_ds_codes: dict[int, int] = {}  # ds_code_num -> first excel_row
    report.rows_scanned = len(parsed.rows)

    for row in parsed.rows:
        ds_raw = row.values.get(ds_code_col.excel_col)
        if is_blank(ds_raw) or is_excel_error(ds_raw):
            report.row_findings.append(RowFinding(row.excel_row, "V001", f"Row {row.excel_row}: DS_Code cannot be empty"))
            continue

        ds_code_num = _to_int(ds_raw)
        if ds_code_num is None:
            report.row_findings.append(
                RowFinding(row.excel_row, "V008", f"Row {row.excel_row}: DS_Code must be a number, found '{ds_raw}'")
            )
            continue

        division = catalog.division(ds_code_num)
        if division is None:
            report.row_findings.append(
                RowFinding(row.excel_row, "V003", f"Row {row.excel_row}: DS_Code '{ds_code_num}' is not a DS division in the register")
            )
            continue

        if ds_code_num in seen_ds_codes:
            report.sheet_findings.append(
                SheetFinding(
                    "V002",
                    f"Row {row.excel_row}: division '{division.code}' ({ds_code_num}) already appears at row {seen_ds_codes[ds_code_num]}",
                )
            )
        else:
            seen_ds_codes[ds_code_num] = row.excel_row

        if province_col is not None:
            prov_raw = row.values.get(province_col.excel_col)
            if not is_blank(prov_raw):
                observed_provinces.setdefault(normalize_province(prov_raw), []).append(row.excel_row)

        for col in indicator_cols:
            raw = row.values.get(col.excel_col)
            if is_blank(raw):
                continue  # absent -- never stored as 0 (NFR-10), not an error
            if is_excel_error(raw):
                report.excel_error_cells += 1
                continue  # "#DIV/0!" etc. -- treated as absent, never as zero
            value = _to_float(raw)
            if value is None:
                report.cell_findings.append(
                    CellFinding(row.excel_row, col.raw_header, "V008", f"Row {row.excel_row}: {col.raw_header} must be a number, found '{raw}'")
                )
                continue
            report.accepted_values.append(
                AcceptedValue(
                    excel_row=row.excel_row,
                    ds_code_num=ds_code_num,
                    division=division,
                    indicator=col.indicator,  # type: ignore[arg-type]
                    raw_value=value,
                )
            )

    report.rows_resolved = len(seen_ds_codes)

    # Province cross-check (brief: "reject the sheet if they disagree").
    province_for_outstanding: Optional[str] = None
    if expected_province is not None:
        norm_expected = normalize_province(expected_province)
        mismatched = sorted(p for p in observed_provinces if p != norm_expected)
        if mismatched:
            report.sheet_findings.append(
                SheetFinding(
                    "PROVINCE_MISMATCH",
                    f"sheet/filename says '{expected_province}' but rows report: {', '.join(mismatched)}",
                )
            )
        province_for_outstanding = expected_province
    elif len(observed_provinces) == 1:
        province_for_outstanding = next(iter(observed_provinces))
    elif len(observed_provinces) > 1:
        report.sheet_findings.append(
            SheetFinding("PROVINCE_MISMATCH", f"rows report more than one province: {', '.join(sorted(observed_provinces))}")
        )

    if province_for_outstanding is not None:
        registered = catalog.province_divisions(province_for_outstanding)
        report.outstanding_divisions = sorted(
            (d for d in registered if d.ds_code_num not in seen_ds_codes),
            key=lambda d: d.ds_code_num,
        )

    return report
