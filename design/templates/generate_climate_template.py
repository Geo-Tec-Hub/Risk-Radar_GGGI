#!/usr/bin/env python3
"""
Climate (hazard-domain) upload template - DRAFT for panel review.

WHY THIS EXISTS
---------------
The twelve hazard/climate variables are not sector data. `indicator_value`
stores them against a DS division and a period only -- there is no sector
column -- so Kandy's drought-event count is ONE number shared by coconut,
paddy, tea, livestock and every other sector.

Today every sector workbook carries a copy of those columns, and the importer's
rule is "the newest import supersedes" (load_template.py deletes then inserts
regardless of who uploaded). So the last sector officer to import silently
overwrites everyone else's climate numbers. Twelve variables are being entered
~13x each and only one copy survives.

This template collects them ONCE per province. Sector templates then drop their
climate columns, which also removes the may_write_hazard_domain refusal that a
sector officer hits today.

Evidence that this is safe: across all 3,664 profile_indicator rows in
seed_all.sql, every hazard variable is 'higher_is_worse' in every one of the
113 profiles across 15 sectors. Direction never varies. Only the WEIGHTS vary,
and weights are already stored per profile, untouched by this change.

Usage:
    python generate_climate_template.py                 # all 9 provinces
    python generate_climate_template.py --province Central
"""
import argparse, csv, datetime, os, re, sys
from collections import OrderedDict
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side, Protection
from openpyxl.utils import get_column_letter

HERE = os.path.dirname(os.path.abspath(__file__))
ING  = os.path.join(HERE, "..", "ingestion")
OUT  = os.path.join(HERE, "generated", "_climate")

PERIODS = [(2021, 2025), (2026, 2030)]
PROV_CODE = {"Central":"CEN","Eastern":"EAS","North Central":"NCE","Northern":"NOR",
             "Northwestern":"NWE","Sabaragamuwa":"SAB","Southern":"SOU","Uva":"UVA",
             "Western":"WES"}

# Which hazards each province actually has profiles for (from seed_all.sql).
# Eastern, North Central and Northern have NO landslide profiles -- flat, dry
# provinces -- so their climate file must not ask for landslide columns.
PROV_HAZARDS = {
    "Central":       {"drought", "flood", "landslide"},
    "Eastern":       {"drought", "flood"},
    "North Central": {"drought", "flood"},
    "Northern":      {"drought", "flood"},
    "Northwestern":  {"drought", "flood", "landslide"},
    "Sabaragamuwa":  {"drought", "flood", "landslide"},
    "Southern":      {"drought", "flood", "landslide"},
    "Uva":           {"drought", "flood", "landslide"},
    "Western":       {"drought", "flood", "landslide"},
}

# The climate variable set, grouped by the hazard that uses it. VERY_WET_DAYS is
# deliberately listed once though flood and landslide both use it -- that is the
# whole point of this file.
CLIMATE = OrderedDict([
 ("DROUGHT_EVENTS_1974_TO_2004", ("drought","No. of Drought events - 1974 to 2004 (25%)","average")),
 ("DROUGHT_EVENTS_2005_TO_2022", ("drought","No. of Drought events - 2005-2022 (75%)","average")),
 ("OCCURRENCE_WARM_DAYS",        ("drought","Occurrence of warm days (TX90p)","fixed_window")),
 ("STANDARD_PRECIPITATION_INDEX",("drought","SPI (Intensity)","fixed_window")),
 ("DROUGHT_HAZARD_INDEX",        ("drought","Drought Hazard Index  [composite - only if used instead of the parts]","fixed_window")),
 ("FLOOD_EVENTS_1974_TO_2023",   ("flood","No. of Flood events - 1974 to 2023 (1974-2004 25%, 2005-2023 75%)","fixed_window")),
 ("VERY_WET_DAYS",               ("flood + landslide","Very wet days (95th pct) + 3-day cumulative rainfall (40% / 60%)","average")),
 ("LIGHTNING_INCIDENTS_1974_TO_2023",("flood","No. of lightning incidents - 1974 to 2023","fixed_window")),
 ("STRONG_WIND_EVENTS_1978_TO_2023",("flood","Strong wind events - 1978 to 2023","fixed_window")),
 ("FLOOD_HAZARD_INDEX",          ("flood","Flood Hazard Index  [composite - only if used instead of the parts]","fixed_window")),
 ("LANDSLIDE_EVENTS_1974_TO_2023",("landslide","Landslide events (1974 - 2023)","fixed_window")),
 ("CUTTING_FAILURES_EARTH_SLIPS_2000_TO_2023",("landslide","Cutting failures & Earth slips (2000 - 2023)","fixed_window")),
 ("LANDSLIDE_HAZARD_INDEX",      ("landslide","Landslide Hazard Index  [composite - only if used instead of the parts]","fixed_window")),
])
FIXED = ["DS_CODE","DS_DIVISION","DISTRICT","YEAR_START","YEAR_END"]
TAIL  = ["DATA_SOURCE","NOTES"]

HDR_FILL   = PatternFill("solid", fgColor="1F4E5F")
SUB_FILL   = PatternFill("solid", fgColor="EAF1F4")
LOCK_FILL  = PatternFill("solid", fgColor="F2F2F2")
ENTRY_FILL = PatternFill("solid", fgColor="FFF9E0")
EG_FILL    = PatternFill("solid", fgColor="E8E8E8")
THIN = Border(*[Side(style="thin", color="B0B0B0")]*4)


def divisions(province):
    with open(os.path.join(ING, "dsd_register.csv"), encoding="utf-8") as fh:
        return [r for r in csv.DictReader(fh)
                if r["province"] == province and r["level"] == "DS_DIVISION"]


def build(province):
    pc = PROV_CODE[province]
    code = "CLIMATE_%s_V1" % pc
    rows = divisions(province)
    have = PROV_HAZARDS[province]
    # A column is kept if ANY hazard that uses it exists in this province.
    # VERY_WET_DAYS is grouped "flood + landslide", so it survives on flood alone.
    climate = OrderedDict((k, v) for k, v in CLIMATE.items()
                          if have & set(v[0].replace(" + ", " ").split()))
    cols = FIXED + list(climate) + TAIL
    wb = Workbook(); wb.remove(wb.active)

    for y0, y1 in PERIODS:
        ws = wb.create_sheet("%d-%d" % (y0, y1))
        ws["A1"] = ("CLIMATE / HAZARD DATA %d-%d - %s Province   [%s]   |   "
                    "Enter RAW values only - the system normalizes.   |   "
                    "These values are shared by EVERY sector." % (y0, y1, province, code))
        ws["A1"].font = Font(bold=True, size=12, color="1F4E5F")
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(cols))

        for j, c in enumerate(cols, 1):
            h = ws.cell(row=2, column=j, value=c)
            h.font = Font(bold=True, color="FFFFFF", size=9)
            h.fill = HDR_FILL
            h.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
            if c in climate:
                grp, name, rule = climate[c]
                note = (">> fixed window - SAME value on both period tabs"
                        if rule == "fixed_window" else
                        ">> enter a TYPICAL YEAR (not a period total)")
                sub = "%s: %s\n%s" % (grp, name, note)
            elif c in FIXED:
                # No longer enforced by a sheet lock, so it has to say WHY, and
                # say what happens if it is edited anyway. "do not edit" on an
                # editable cell is an instruction people reasonably ignore.
                sub = ("pre-filled - change only to correct an error; "
                       "the importer checks it")
            else:
                sub = "origin of the numbers" if c == "DATA_SOURCE" else "optional"
            s = ws.cell(row=3, column=j, value=sub)
            s.font = Font(size=8, italic=True); s.fill = SUB_FILL
            s.alignment = Alignment(wrap_text=True, vertical="top")

        ex = ["EXAMPLE", "- sample formatting, do not edit -", "-", y0, y1]
        ex += [round(1 + i * 1.5, 1) for i in range(len(climate))]
        ex += ["Dept. of Meteorology / NBRO", "example row"]
        for j, v in enumerate(ex, 1):
            c = ws.cell(row=4, column=j, value=v); c.fill = EG_FILL; c.font = Font(size=9, italic=True)

        for i, d in enumerate(rows):
            r = 5 + i
            for j, key in enumerate(["ds_code", "ds_division", "district"], 1):
                c = ws.cell(row=r, column=j, value=d[key]); c.fill = LOCK_FILL; c.border = THIN
            ws.cell(row=r, column=4, value=y0).fill = LOCK_FILL
            ws.cell(row=r, column=5, value=y1).fill = LOCK_FILL
            for j in range(6, len(cols) + 1):
                c = ws.cell(row=r, column=j); c.border = THIN
                c.protection = Protection(locked=False)   # the only editable cells
                if cols[j-1] not in TAIL:
                    c.fill = ENTRY_FILL

        # NOT PROTECTED (owner, 14 Sep 2026). The sheet lock used to be on here,
        # with only the value cells unlocked, on the reasoning that it stops a
        # collector nudging a DS_CODE out of line. In practice it stopped the
        # legitimate edits too, and the cost of that turned out to be higher
        # than the mistake it prevented: the returned Central files carry
        # YEAR_START/YEAR_END of 2020/2025 on tabs the panel had renamed to
        # 2021-2025, purely because those cells were locked when the rename
        # happened and nobody could correct them. A guard rail that produces
        # wrong data in the file is not a guard rail.
        #
        # Nothing is lost by removing it, because the lock was never the check.
        # The real check is at import and it is stricter: `_META` states the
        # column contract and a renamed, reordered or inserted column is a
        # structural error naming the file; a DS_CODE that is not a division of
        # this province is refused per row; and the tab name -- not these cells
        # -- is what decides the period. So a structural mistake is now CAUGHT
        # and explained rather than prevented, and a correction that ought to
        # be possible is possible.
        #
        # `_META protection` stays "locked-issue": it describes the ISSUE (a
        # collection file whose contract governs), not whether Excel has a
        # password on it. "unlocked-review" means something different and would
        # put the importer into review-copy mode.
        ws.protection.sheet = False
        ws.freeze_panes = "F5"
        ws.column_dimensions["A"].width = 9
        ws.column_dimensions["B"].width = 24
        ws.column_dimensions["C"].width = 14
        for j in range(4, len(cols) + 1):
            ws.column_dimensions[get_column_letter(j)].width = 15
        ws.row_dimensions[3].height = 58

    rd = wb.create_sheet("README")
    lines = [
     ("How to fill the climate template", True),
     ("Province: %s   |   %s   |   draft generated %s" % (province, code, datetime.date.today()), False),
     ("", False),
     ("WHAT THIS FILE IS", True),
     ("These are the climate / hazard variables. They describe the WEATHER of a DS division,", False),
     ("not any one crop or sector. The same drought-event count is used by coconut, paddy, tea,", False),
     ("livestock and every other sector, so it is collected ONCE here instead of being repeated", False),
     ("inside each sector workbook.", False),
     ("", False),
     ("Sector workbooks no longer carry these columns. If you are filling a coconut or paddy file,", False),
     ("enter only the coconut or paddy numbers - the climate comes from here.", False),
     ("", False),
     ("HOW TO FILL IT", True),
     ("1. One tab per period. Fill the tab that matches your dataset; skip a tab with no data.", False),
     ("2. Columns marked 'fixed window' cover a year range fixed by the variable itself", False),
     ("   (e.g. 1974-2023). Put the SAME value on both period tabs.", False),
     ("3. Columns marked 'typical year' want a typical single year, not a five-year total.", False),
     ("4. Enter RAW values in the natural unit. Do not normalize, index or rank - the system does that.", False),
     ("5. Leave a cell blank if the number genuinely does not exist, and say why in NOTES.", False),
     ("6. The three Hazard Index columns are composites. Fill them ONLY if your panel scores the", False),
     ("   hazard as a single index instead of from its parts. If you fill the parts, leave these blank.", False),
     ("7. The grey row is a formatting example; the importer ignores it.", False),
     ("", False),
     ("THIS FILE IS NOT PROTECTED", True),
     ("Every cell is editable, including DS_CODE, DS_DIVISION, DISTRICT and the YEAR columns.", False),
     ("That is deliberate - an earlier locked issue left wrong YEAR values in returned files", False),
     ("because nobody could correct them. Please still treat the first five columns as", False),
     ("pre-filled and change them only to fix a genuine error.", False),
     ("", False),
     ("The checks that matter run at import, not in Excel:", False),
     ("  - the column set and its order are checked against this file's hidden _META;", False),
     ("    a renamed, reordered, added or deleted column is refused and named.", False),
     ("  - every DS_CODE must be a division of this province, or that row is refused.", False),
     ("  - the PERIOD comes from the TAB NAME, not from the YEAR_START/YEAR_END cells.", False),
     ("    If the two disagree the tab wins and the importer reports the disagreement.", False),
     ("  - nothing loads partially: any error means the file loaded nothing.", False),
     ("", False),
     ("WHO CAN IMPORT THIS", True),
     ("Importing this file needs the hazard-data grant (app_user.may_write_hazard_domain).", False),
     ("That is deliberate: one climate officer owns these numbers for the whole province, so a", False),
     ("sector officer cannot overwrite them by accident.", False),
     ("", False),
     ("OPEN QUESTIONS FOR THE PANEL", True),
     ("a. DROUGHT_EVENTS_1974_TO_2004 and _2005_TO_2022 are marked 'typical year' here because", False),
     ("   that is how the current Central templates treat them. Every other event-count variable", False),
     ("   is 'fixed window'. The two split variables may have inherited the wrong rule when the", False),
     ("   Central panel split DROUGHT_EVENTS_1974_TO_2022 on 2026-09-03. Please confirm which.", False),
     ("b. Landslide columns appear ONLY in provinces that have landslide profiles", False),
     ("   (Central, Northwestern, Sabaragamuwa, Southern, Uva, Western). Eastern, North Central", False),
     ("   and Northern get a drought + flood file only. Confirm that matches the panel's view.", False),
    ]
    for i, (t, bold) in enumerate(lines, 1):
        c = rd.cell(row=i, column=1, value=t)
        if bold: c.font = Font(bold=True, size=11, color="1F4E5F")
    rd.column_dimensions["A"].width = 110

    mt = wb.create_sheet("_META")
    meta = [("profile_code", code), ("kind", "climate"), ("version", 1),
            ("province", province), ("main_sector", ""), ("subsector", ""), ("hazard", ""),
            ("catalog", "FINAL_VARIABLES.xlsx + panel_central.sql"),
            ("protection", "locked-issue"),
            ("generated", str(datetime.date.today())),
            ("dsd_level", "DS_DIVISION"),
            ("n_divisions", len(rows)),
            ("periods", "|".join("%d-%d" % p for p in PERIODS)),
            ("n_variables", len(climate)),
            ("hazards", "|".join(sorted(have))),
            ("period_aggregation", "|".join("%s=%s" % (k, v[2]) for k, v in climate.items())),
            ("expected_columns", "|".join(cols))]
    for i, (k, v) in enumerate(meta, 1):
        mt.cell(row=i, column=1, value=k); mt.cell(row=i, column=2, value=v)
    mt.sheet_state = "hidden"

    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "%s_upload_template.xlsx" % code)
    wb.save(path)
    return path, len(rows), len(climate), sorted(have)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--province", default=None)
    a = ap.parse_args()
    provs = [a.province] if a.province else list(PROV_CODE)
    for p in provs:
        path, n, v, hz = build(p)
        print("%-14s %3d divisions x %2d variables  [%s]  -> %s"
              % (p, n, v, ", ".join(hz), os.path.basename(path)))
