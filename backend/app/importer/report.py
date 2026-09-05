"""Renders a SheetReport as the human-readable dry-run report
(TASK_BRIEF_IMPORTER.md: "report what it found and what it would reject").
"""

from __future__ import annotations

from app.importer.reader import ColumnKind
from app.importer.validate import SheetReport

_KIND_LABEL = {
    ColumnKind.DS_CODE: "identity: DS_Code",
    ColumnKind.PROVINCE: "identity: province",
    ColumnKind.DISTRICT: "identity: district",
    ColumnKind.DIVISION_NAME: "identity: division name",
    ColumnKind.IGNORED_COMPUTED: "ignored (Excel-computed)",
    ColumnKind.INDICATOR: "indicator",
    ColumnKind.UNRESOLVED: "UNRESOLVED",
}

_FINDINGS_PREVIEW_LIMIT = 25


def render_sheet_report(report: SheetReport) -> str:
    lines: list[str] = []
    w = lines.append

    w(f"=== Sheet '{report.sheet_name}' ===")
    w(f"catalogue/register source: {report.catalog_source}")

    if report.header_row is None:
        w("header row: NOT FOUND in the first 10 rows")
        for f in report.sheet_findings:
            w(f"  REJECT  [{f.code}] {f.message}")
        w("verdict: WOULD REJECT (nothing further parsed)")
        return "\n".join(lines)

    w(f"header row: {report.header_row}")
    if report.expected_province:
        w(f"expected province (from sheet/filename): {report.expected_province}")

    w("")
    w(f"columns ({len(report.columns)} with a header):")
    for col in report.columns:
        label = _KIND_LABEL[col.kind]
        if col.kind == ColumnKind.INDICATOR and col.indicator is not None:
            status_flag = "" if col.indicator.status == "active" else f", status={col.indicator.status}"
            w(f"  {col.letter:<3} '{col.raw_header}'  ->  {label}: {col.indicator.code}{status_flag}")
        elif col.kind == ColumnKind.UNRESOLVED:
            w(f"  {col.letter:<3} '{col.raw_header}'  ->  {label} (not in catalogue, no alias)")
        elif col.kind == ColumnKind.IGNORED_COMPUTED and col.note:
            w(f"  {col.letter:<3} '{col.raw_header}'  ->  {label} ({col.note})")
        else:
            w(f"  {col.letter:<3} '{col.raw_header}'  ->  {label}")

    w("")
    w("counts:")
    w(f"  data rows scanned:         {report.rows_scanned}")
    w(f"  rows with a resolved DS_Code: {report.rows_resolved}")
    w(f"  accepted raw values:      {len(report.accepted_values)}")
    w(f"  cells treated as absent (Excel error): {report.excel_error_cells}")
    w(f"  outstanding divisions:    {len(report.outstanding_divisions)}")

    if report.sheet_findings:
        w("")
        w(f"sheet-level findings ({len(report.sheet_findings)}) -- each one alone rejects the whole sheet:")
        for f in report.sheet_findings[:_FINDINGS_PREVIEW_LIMIT]:
            w(f"  REJECT  [{f.code}] {f.message}")
        if len(report.sheet_findings) > _FINDINGS_PREVIEW_LIMIT:
            w(f"  ... and {len(report.sheet_findings) - _FINDINGS_PREVIEW_LIMIT} more")

    if report.row_findings:
        w("")
        w(f"row findings ({len(report.row_findings)}):")
        for f in report.row_findings[:_FINDINGS_PREVIEW_LIMIT]:
            w(f"  REJECT  [{f.code}] {f.message}")
        if len(report.row_findings) > _FINDINGS_PREVIEW_LIMIT:
            w(f"  ... and {len(report.row_findings) - _FINDINGS_PREVIEW_LIMIT} more")

    if report.cell_findings:
        w("")
        w(f"cell findings ({len(report.cell_findings)}):")
        for f in report.cell_findings[:_FINDINGS_PREVIEW_LIMIT]:
            w(f"  REJECT  [{f.code}] {f.message}")
        if len(report.cell_findings) > _FINDINGS_PREVIEW_LIMIT:
            w(f"  ... and {len(report.cell_findings) - _FINDINGS_PREVIEW_LIMIT} more")

    if report.outstanding_divisions:
        w("")
        names = ", ".join(f"{d.code} {d.name}" for d in report.outstanding_divisions[:_FINDINGS_PREVIEW_LIMIT])
        w(f"outstanding (registered, not in this sheet): {names}")
        if len(report.outstanding_divisions) > _FINDINGS_PREVIEW_LIMIT:
            w(f"  ... and {len(report.outstanding_divisions) - _FINDINGS_PREVIEW_LIMIT} more")

    w("")
    if report.would_load:
        w(f"verdict: WOULD LOAD -- {len(report.accepted_values)} raw values across {report.rows_resolved} divisions, batch pending")
    else:
        total = len(report.sheet_findings) + len(report.row_findings) + len(report.cell_findings)
        w(f"verdict: WOULD REJECT -- {total} finding(s), nothing partial lands (FR-2.3)")

    return "\n".join(lines)
