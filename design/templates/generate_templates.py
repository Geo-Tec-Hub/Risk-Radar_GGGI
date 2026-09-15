#!/usr/bin/env python3
"""
D6 - Excel upload-template generator (FINAL catalog).

Generates one data-collection workbook per (province x vulnerability profile),
driven by the expert-refined catalog in design/ingestion/FINAL_VARIABLES.xlsx
(174 canonical variables, 33 national profiles) and the province coverage of
design/ingestion/variables_inventory.csv -> 243 workbooks.

Supersedes the 2026-07-18 prototype, which used provisional slug codes derived
from raw sheet labels. Codes are now the official catalog codes.

Each workbook contains:
  Period tabs - one Data tab per year range (expert input 2026-07-18: data
            arrive as ranges). One row per DS division (pre-filled), one column
            per profile variable (official catalog code). NOTHING IS SHEET-
            PROTECTED (14 Sep 2026) -- the pre-filled columns are a convention
            the importer enforces, not a lock Excel enforces; see the note on
            UNLOCKED below. YEAR_START/YEAR_END are pre-filled for reference,
            but the TAB NAME is what decides the period.
  WEIGHTS - per-variable weight sheet. Legacy weights carried forward from the
            9-province workbooks where the variable still exists; blank where
            the variable is new. Live SUM check per domain (must reach 100).
  README  - instructions + variable dictionary.
  _META   - hidden: profile_code, version, expected column list. The import
            endpoint (B2) reads this to know which profile to validate against.

Raw values only - normalization is server-side (design principle #1).

DS DIVISIONS: read from design/ingestion/dsd_register.csv - 330 official DS
divisions (level=DS_DIVISION), built 2026-07-26 from design/spatial/SL_RDSD.shp
(ADM3), with district and province assigned by max-area spatial overlap against
SL_DSD.shp (ADM2) and SL_PD.shp (ADM1). Rows are ordered by district within each
province so collectors work district by district. Replacing that one CSV and
re-running is the only step needed to change the row set.

Usage:
    python generate_templates.py              # all 243 workbooks
    python generate_templates.py --limit 3    # first 3 only (smoke test)
    python generate_templates.py --unlocked    # review copies (structure open for mark-up)
"""
import argparse
import csv
import datetime
import json
import os
import re
import sys
from collections import defaultdict

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Protection, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

HERE = os.path.dirname(os.path.abspath(__file__))
ING = os.path.join(HERE, "..", "ingestion")
CATALOG = os.path.join(ING, "FINAL_VARIABLES.xlsx")
DSD_REGISTER = os.path.join(ING, "dsd_register.csv")
INVENTORY = os.path.join(ING, "variables_inventory.csv")
ADDENDUM = os.path.join(ING, "catalog_addendum.csv")
OVERRIDES = os.path.join(ING, "province_variable_overrides.csv")
OUTDIR = os.path.join(HERE, "generated")

# Period ranges. Changed 2026-09-03 on the Central panel's request: the old
# (2020,2025)+(2025,2030) pair overlapped on 2025 and needed a "later period
# wins" tie-break. 2021-2025 / 2026-2030 are contiguous, so no tie-break rule
# is needed and no year can be counted twice.
PERIODS = [(2021, 2025), (2026, 2030)]

# NO TEMPLATE IS SHEET-PROTECTED ANY MORE (owner, 14 Sep 2026). Every tab of
# every issue is editable, including the pre-filled DS_CODE / DS_DIVISION /
# DISTRICT / YEAR columns and the WEIGHTS tab.
#
# The lock used to sit on the collection set, on the reasoning that it stops a
# collector nudging a DS_CODE out of line. It also stopped the legitimate
# corrections, and that cost more than it saved: the returned Central files
# carry YEAR_START/YEAR_END of 2020/2025 on tabs the panel had renamed to
# 2021-2025, purely because those cells were locked at the moment of the
# rename. A guard rail that leaves wrong data in the file is not a guard rail.
#
# Nothing is lost, because the lock was never the check. `_META` states the
# column contract and the importer refuses a renamed, reordered, added or
# deleted column by name; a DS_CODE that is not a division of the province is
# refused per row; the tab name, not the YEAR cells, decides the period; and
# nothing loads partially. A structural mistake is now caught and explained
# instead of prevented.
#
# So UNLOCKED no longer controls protection. What it still controls is the
# REVIEW-COPY CONTRACT: it stamps `_META protection = unlocked-review`, which
# tells the importer this file's own `_META` no longer describes its columns
# and to validate against the profile instead (load_template.py), and it
# rewrites the README to invite structural mark-up. That distinction is the
# whole point of the flag and is unaffected by the lock going away.
UNLOCKED = False

PROV_CODE = {"Central": "CEN", "Eastern": "EAS", "North Central": "NCE",
             "Northern": "NOR", "Northwestern": "NWE", "Sabaragamuwa": "SAB",
             "Southern": "SOU", "Uva": "UVA", "Western": "WES"}

# legacy province spelling -> official
PROV_FIX = {"Northen": "Northern"}

# legacy (sector_dir, subsector) -> official (main_sector, subsector)
LEGACY2NEW = {
    ("Coconut", ""): ("Agriculture Sector", "Coconut"),
    ("Paddy", ""): ("Agriculture Sector", "Paddy"),
    ("Tea", ""): ("Agriculture Sector", "Tea"),
    ("Vegetables & Other Field Crops", ""):
        ("Agriculture Sector", "Vegetable & Other Field Crops"),
    ("Human Settlement", ""): ("Human Settlements Sector", ""),
    ("Human Settlements", ""): ("Human Settlements Sector", ""),
    ("Industry", ""): ("Industry Sector", ""),
    ("Inland Fishery", ""): ("Inland Fishery Sector", "Inland Fishery"),
    ("Irrigation Water", ""): ("Water Sector", "Irrigation Water"),
    ("Potable Water", ""): ("Water Sector", "Potable Water"),
    ("Tourism", ""): ("Tourism Sector", ""),
    ("Transport", ""): ("Transportation Sector", ""),
    ("Livestock", "Buffalo"): ("Livestock Sector", "Buffalo Farming"),
    ("Livestock", "Buffaloa"): ("Livestock Sector", "Buffalo Farming"),
    ("Livestock", "Cattle"): ("Livestock Sector", "Cattle Farming"),
    ("Livestock", "Goat"): ("Livestock Sector", "Goat Farming"),
    ("Livestock", "Pig"): ("Livestock Sector", "Pig and Sheep Farming"),
    ("Livestock", "Pig Sheep"): ("Livestock Sector", "Pig and Sheep Farming"),
    ("Livestock", "Poultry"): ("Livestock Sector", "Poultry Farming"),
}

# --- styles -----------------------------------------------------------------
F_TITLE = Font(name="Arial", bold=True, size=13)
F_H2 = Font(name="Arial", bold=True, size=11)
F_HDR = Font(name="Arial", bold=True, size=10, color="FFFFFF")
F_SUB = Font(name="Arial", size=8, italic=True, color="404040")
F_BODY = Font(name="Arial", size=10)
F_EX = Font(name="Arial", size=10, italic=True, color="808080")
F_WARN = Font(name="Arial", size=10, bold=True, color="B00020")
FILL_HDR = PatternFill("solid", fgColor="1F4E79")
FILL_HAZ = PatternFill("solid", fgColor="C55A11")
FILL_EXP = PatternFill("solid", fgColor="2E7D32")
FILL_EDIT = PatternFill("solid", fgColor="FFF9C4")
FILL_EX = PatternFill("solid", fgColor="F2F2F2")
FILL_NEW = PatternFill("solid", fgColor="E3F2FD")
THIN = Border(*[Side(style="thin", color="BFBFBF")] * 4)
WRAP = Alignment(wrap_text=True, vertical="top")


# --------------------------------------------------------------------------
# inputs
# --------------------------------------------------------------------------
def load_catalog():
    """Return (variables_by_code, membership) from FINAL_VARIABLES.xlsx."""
    wb = load_workbook(CATALOG, data_only=True)
    ws = wb["Variables"]
    variables = {}
    for r in range(2, ws.max_row + 1):
        code = ws.cell(r, 1).value
        if not code:
            continue
        variables[code] = dict(code=code, name=ws.cell(r, 2).value,
                               domain=ws.cell(r, 3).value)
    # Variables a provincial panel added that are not yet in the experts'
    # FINAL_VARIABLES.xlsx. Kept in a sidecar so the national catalogue stays
    # the experts' own file and provincial additions stay separable from it.
    if os.path.exists(ADDENDUM):
        with open(ADDENDUM, encoding="utf-8-sig") as fh:
            for r in csv.DictReader(fh):
                code = (r.get("variable_code") or "").strip()
                if code and code not in variables:
                    variables[code] = dict(code=code,
                                           name=r["variable_name"].strip(),
                                           domain=r["domain"].strip(),
                                           addendum=True)

    ws = wb["Profile_Variables"]
    membership = defaultdict(list)
    for r in range(2, ws.max_row + 1):
        m, s, h, c = (ws.cell(r, i).value for i in (1, 2, 3, 4))
        if c:
            membership[(m, s or "", h)].append(c)
    # hazard variables first, then alphabetical - stable column order
    for k, v in membership.items():
        membership[k] = sorted(set(v),
                               key=lambda c: (variables[c]["domain"] != "hazard", c))
    return variables, dict(membership)


def load_province_overrides():
    """(province, main, sub, hazard) -> {'add': [...], 'retire': set(), 'weight': {}}

    Layered on top of the national profile membership so a province can diverge
    without editing the national catalogue. Produced by
    design/ingestion/build_province_overrides.py from a returned expert review.
    """
    out = defaultdict(lambda: dict(add=[], retire=set(), weight={}, basis={}))
    if not os.path.exists(OVERRIDES):
        return dict(out)
    with open(OVERRIDES, encoding="utf-8-sig") as fh:
        for r in csv.DictReader(fh):
            key = (r["province"], r["main_sector"], r["subsector"] or "",
                   r["hazard"])
            code = r["variable_code"].strip()
            action = r["action"].strip()
            if action == "retire":
                out[key]["retire"].add(code)
                continue
            if action == "add" and code not in out[key]["add"]:
                out[key]["add"].append(code)
            w = (r.get("weight_pct") or "").strip()
            if w:
                out[key]["weight"][code] = float(w)
                out[key]["basis"][code] = (r.get("basis") or "").strip()
    return dict(out)


def load_dsd():
    reg = defaultdict(list)
    with open(DSD_REGISTER, encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            reg[row["province"]].append(row)
    return dict(reg)


def load_legacy():
    """Province coverage + carried-forward weights from the 9-province workbooks."""
    coverage = defaultdict(set)
    weights = defaultdict(dict)
    with open(INVENTORY, encoding="utf-8-sig") as fh:
        for r in csv.DictReader(fh):
            key = (r["sector_dir"], r["subsector"].strip())
            if key not in LEGACY2NEW:
                continue
            main, sub = LEGACY2NEW[key]
            prov = PROV_FIX.get(r["province"], r["province"])
            coverage[(main, sub, r["hazard"])].add(prov)
            try:
                w = float(r["weight_pct"])
            except (TypeError, ValueError):
                w = None
            weights[(prov, main, sub, r["hazard"])][r["description"]] = dict(
                weight=w, rel=(r["relationship"] or "").strip() or None)
    return dict(coverage), dict(weights)


def load_weight_map():
    """legacy description -> official code, precomputed by the crosswalk step."""
    path = os.path.join(ING, "legacy_weight_map.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    return {}


# How a value covering a year range is read. Decided 2026-07-26: default is a
# TYPICAL YEAR, not a multi-year total. Per-variable overrides live in
# design/ingestion/period_aggregation.json (expert review pending).
AGG_HINT = {
    "average":      "enter a TYPICAL YEAR (not a total)",
    "total":        "enter the TOTAL for the whole period",
    "max":          "enter the MAXIMUM (already a fixed-window figure)",
    "end_of_period": "enter the value AT THE END of the period",
    "fixed_window": "fixed window - same value on both period tabs",
}


def load_period_aggregation():
    path = os.path.join(ING, "period_aggregation.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    return {}


# --------------------------------------------------------------------------
# sheets
# --------------------------------------------------------------------------
def profile_code(main, sub, hazard, province):
    base = (sub or main).upper()
    base = base.replace(" SECTOR", "").replace(" FARMING", "")
    base = re.sub(r"[^A-Z0-9]+", "_", base).strip("_")
    return f"{base}_{hazard.upper()}_{PROV_CODE[province]}_V1"


def fill_data_sheet(ws, period, ctx, params, heads, dsd_rows):
    y0, y1 = period
    ncols = len(heads)
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ncols)
    ws["A1"] = (f"RAW DATA {y0}-{y1} - {ctx['label']} - {ctx['province']} Province"
                f"   [profile {ctx['pcode']}]"
                "   |   Enter RAW values only - the system normalizes.")
    ws["A1"].font = F_TITLE

    subs = ["do not edit"] * 5 + \
           [f"{p['domain']}: {p['name']}\n>> {AGG_HINT.get(p['agg'], AGG_HINT['average'])}"
            for p in params] + \
           ["origin of the numbers", "optional"]
    for ci, (h, sb) in enumerate(zip(heads, subs), 1):
        c = ws.cell(row=2, column=ci, value=h)
        c.font = F_HDR
        c.border = THIN
        c.fill = FILL_HDR
        if 5 < ci <= 5 + len(params):
            c.fill = FILL_HAZ if params[ci - 6]["domain"] == "hazard" else FILL_EXP
        d = ws.cell(row=3, column=ci, value=sb)
        d.font = F_SUB
        d.alignment = WRAP
        d.border = THIN
    ws.row_dimensions[3].height = 46
    ws.freeze_panes = "F4"

    ex = ["EXAMPLE", "- sample formatting, do not edit -", "-", y0, y1] + \
         [round(100 + 37.5 * i, 1) for i in range(len(params))] + \
         [f"Dept. report {y0}-{y1}", "example row"]
    for ci, v in enumerate(ex, 1):
        c = ws.cell(row=4, column=ci, value=v)
        c.font = F_EX
        c.fill = FILL_EX
        c.border = THIN

    dv = DataValidation(type="decimal", operator="greaterThanOrEqual",
                        formula1="0", allow_blank=True,
                        errorTitle="Invalid value",
                        error="Raw values must be numbers >= 0.")
    ws.add_data_validation(dv)

    for ri, row in enumerate(dsd_rows, 5):
        ws.cell(row=ri, column=1, value=row["ds_code"]).font = F_BODY
        ws.cell(row=ri, column=2, value=row["ds_division"]).font = F_BODY
        ws.cell(row=ri, column=3, value=row["district"]).font = F_BODY
        ws.cell(row=ri, column=4, value=y0).font = F_BODY
        ws.cell(row=ri, column=5, value=y1).font = F_BODY
        for ci in range(1, ncols + 1):
            c = ws.cell(row=ri, column=ci)
            c.border = THIN
            if ci >= 6:
                c.protection = Protection(locked=False)
                c.fill = FILL_EDIT
        for ci in range(6, 6 + len(params)):
            dv.add(ws.cell(row=ri, column=ci))

    for col, w in zip("ABCDE", (14, 34, 16, 11, 11)):
        ws.column_dimensions[col].width = w
    for ci in range(6, ncols + 1):
        ws.column_dimensions[get_column_letter(ci)].width = 16
    # NOT PROTECTED (owner, 14 Sep 2026). See the note on UNLOCKED above: the
    # sheet lock is gone from the default issue as well, so this line no longer
    # depends on the flag.
    ws.protection.sheet = False


def fill_weights_sheet(ws, ctx, params):
    ws["A1"] = f"WEIGHTS - {ctx['label']} - {ctx['province']} Province"
    ws["A1"].font = F_TITLE
    ws["A2"] = (
        "REFERENCE ONLY - the web application is the master record for weights. "
        "Fill the yellow PROPOSED column here if it suits your workflow: on upload the "
        "importer READS this tab and pre-fills the confirmation screen, where the weights "
        "are confirmed or adjusted and saved. Nothing entered here takes effect until it "
        "is confirmed in the app, and it can be edited there again at any time. "
        "Weights must total 100 WITHIN each domain (hazard, exposure). "
        "'legacy weight' is carried from the previous provincial workbook where the variable "
        "still exists; blank means the variable is NEW in the refined catalogue.")
    ws["A2"].font = F_SUB
    ws["A2"].alignment = WRAP
    ws.merge_cells("A2:G2")
    ws.row_dimensions[2].height = 62

    hdr = ["variable_code", "variable name", "domain", "relationship (+/-)",
           "legacy weight %", "PROPOSED WEIGHT % (read at import)",
           "basis of the proposal"]
    for ci, h in enumerate(hdr, 1):
        c = ws.cell(row=3, column=ci, value=h)
        c.font = F_HDR
        c.fill = FILL_HDR
        c.border = THIN
        c.alignment = WRAP

    dv = DataValidation(type="decimal", operator="between", formula1="0",
                        formula2="100", allow_blank=True,
                        errorTitle="Invalid weight",
                        error="Weight must be between 0 and 100.")
    ws.add_data_validation(dv)

    r = 4
    rows_by_domain = defaultdict(list)
    for p in params:
        proposed = p["legacy_weight"]
        if p.get("panel_weight") is not None:
            proposed = p["panel_weight"]
        for ci, v in enumerate([p["code"], p["name"], p["domain"], p["rel"],
                                p["legacy_weight"], proposed,
                                p.get("basis") or ""], 1):
            c = ws.cell(row=r, column=ci, value=v)
            c.font = F_BODY
            c.border = THIN
            c.alignment = WRAP
        if p["legacy_weight"] is None:
            for ci in range(1, 8):
                ws.cell(row=r, column=ci).fill = FILL_NEW
        ws.cell(row=r, column=6).fill = FILL_EDIT
        ws.cell(row=r, column=6).protection = Protection(locked=False)
        dv.add(ws.cell(row=r, column=6))
        rows_by_domain[p["domain"]].append(r)
        r += 1

    r += 1
    for dom in ("hazard", "exposure"):
        rr = rows_by_domain.get(dom)
        if not rr:
            continue
        ws.cell(row=r, column=1, value=f"SUM - {dom} (must equal 100)").font = F_H2
        parts = "+".join(f"F{i}" for i in rr)
        ws.cell(row=r, column=6, value=f"={parts}").font = F_H2
        ws.cell(row=r, column=6).border = THIN
        r += 1

    for col, w in zip("ABCDEFG", (50, 56, 12, 16, 14, 20, 46)):
        ws.column_dimensions[col].width = w
    # Unprotected like the data tabs. This one had the weakest case for a lock
    # anyway: the whole tab is a proposal for a person to confirm in the app,
    # and nothing typed here is written by the importer.
    ws.protection.sheet = False


def fill_readme(ws, ctx, params, heads):
    lines = [
        ("How to fill this template", F_TITLE),
        (f"Profile: {ctx['pcode']}   |   generated {datetime.date.today().isoformat()} "
         f"from FINAL_VARIABLES.xlsx (expert-refined catalog)", F_SUB),
        ("", None),
        ("1. One tab per data period ("
         + ", ".join(f"{a}-{b}" for a, b in PERIODS)
         + "). Fill the tab matching your dataset's period; skip tabs with no data.", F_BODY),
        ("2. A value on a period tab describes that WHOLE range. Unless the column says "
         "otherwise, enter a TYPICAL YEAR - not a six-year total. Each column's sub-header "
         "states its rule. (Decided 2026-07-26: a typical year is the only reading that works "
         "for both stocks like population and flows like production.)", F_BODY),
        ("2b. The two periods are contiguous and do not overlap (changed 2026-09-03 at the "
         "Central panel's request - the old 2020-2025 / 2025-2030 pair shared the year 2025 "
         "and needed a tie-break). Every year belongs to exactly one tab.", F_BODY),
        ("3. The yellow cells are where data belongs. Division codes, names, district and "
         "the period columns are pre-filled - change one only to correct a genuine error. "
         "Nothing in this file is protected, so please treat that as the instruction it "
         "is; the importer checks those columns and will refuse what it cannot match.",
         F_BODY)
        if not UNLOCKED else
        ("3. REVIEW COPY - structure is open for mark-up. The yellow cells are still where "
         "data belongs, but this issue invites changes to columns, headers and tabs as "
         "well as values. Return the marked-up file; the finalised version is re-issued "
         "for collection.", F_WARN),
        ("4. Enter RAW values in the variable's natural unit - do NOT normalize, index or "
         "rank. The system does that.", F_BODY),
        ("5. Do not add, remove, rename or reorder columns or tabs. Excel will now let "
         "you - the sheet is not protected - but the importer will not: the hidden _META "
         "tab states this file's column contract and a file whose structure has changed "
         "is refused, naming what changed. Nothing loads partially, so a rejected file "
         "loads nothing at all.", F_BODY)
        if not UNLOCKED else
        ("5. Structural changes ARE invited in this review copy - add, rename or reorder "
         "columns and note what you changed. A review copy is validated against the "
         "profile's current variable list rather than against its own _META, so the "
         "changes that were asked for are not held against it.", F_BODY),
        ("6. The grey row on each tab is an example of expected formatting; the importer "
         "ignores it.", F_BODY),
        ("7. Leave a value blank if genuinely unavailable and say why in NOTES.", F_BODY),
        ("8. The WEIGHTS tab is REFERENCE ONLY. The web application is the master record for "
         "weights: on upload the importer reads that tab and pre-fills a confirmation screen, "
         "where the weights are confirmed and saved. Filling it here is optional but saves "
         "typing. Variables shaded blue are new and have no weight yet. Expert-panel sign-off "
         "happens outside the system - record it in the panel-note field when saving.",
         F_BODY),
        ("", None),
        ("ROWS ARE DISTRICT-LEVEL PLACEHOLDERS pending the official DS-division register. "
         "Do not begin bulk data entry until the register is confirmed.", F_WARN),
        ("", None),
        ("Variable dictionary", F_TITLE),
    ]
    r = 1
    for txt, f in lines:
        if txt:
            c = ws.cell(row=r, column=1, value=txt)
            c.font = f
        r += 1
    hdr = ["column code", "variable name", "domain", "relationship", "legacy weight %",
           "period rule"]
    for ci, h in enumerate(hdr, 1):
        c = ws.cell(row=r, column=ci, value=h)
        c.font = F_HDR
        c.fill = FILL_HDR
        c.border = THIN
    for p in params:
        r += 1
        for ci, v in enumerate([p["code"], p["name"], p["domain"], p["rel"],
                                p["legacy_weight"],
                                AGG_HINT.get(p["agg"], AGG_HINT["average"])], 1):
            c = ws.cell(row=r, column=ci, value=v)
            c.font = F_BODY
            c.border = THIN
            c.alignment = WRAP
    for col, w in zip("ABCDEF", (50, 60, 12, 14, 14, 40)):
        ws.column_dimensions[col].width = w


# --------------------------------------------------------------------------
def build(province, main, sub, hazard, variables, codes, dsd_rows,
          legacy_weights, weight_map, period_agg, override=None):
    pcode = profile_code(main, sub, hazard, province)
    label = f"{main}" + (f" / {sub}" if sub else "") + f" - {hazard}"
    ctx = dict(pcode=pcode, province=province, label=label,
               main=main, sub=sub, hazard=hazard)

    lw = legacy_weights.get((province, main, sub, hazard), {})
    by_code = {}
    for desc, meta in lw.items():
        code = weight_map.get(desc)
        if code:
            by_code[code] = meta

    override = override or dict(add=[], retire=set(), weight={}, basis={})
    params = []
    for c in codes:
        v = variables[c]
        meta = by_code.get(c, {})
        params.append(dict(code=c, name=v["name"], domain=v["domain"],
                           rel=meta.get("rel"), legacy_weight=meta.get("weight"),
                           panel_weight=override["weight"].get(c),
                           basis=override["basis"].get(c, ""),
                           agg=period_agg.get(c, "average")))

    heads = ["DS_CODE", "DS_DIVISION", "DISTRICT", "YEAR_START", "YEAR_END"] + \
            [p["code"] for p in params] + ["DATA_SOURCE", "NOTES"]

    wb = Workbook()
    wb.remove(wb.active)
    for period in PERIODS:
        ws = wb.create_sheet(f"{period[0]}-{period[1]}")
        fill_data_sheet(ws, period, ctx, params, heads, dsd_rows)
    fill_weights_sheet(wb.create_sheet("WEIGHTS"), ctx, params)
    fill_readme(wb.create_sheet("README"), ctx, params, heads)

    mt = wb.create_sheet("_META")
    meta = [("profile_code", pcode), ("version", 1), ("province", province),
            ("main_sector", main), ("subsector", sub or ""), ("hazard", hazard),
            ("catalog", "FINAL_VARIABLES.xlsx"),
            ("protection", "unlocked-review" if UNLOCKED else "locked"),
            ("panel_overrides", "%d add, %d retire" % (len(override["add"]),
                                                       len(override["retire"]))),
            ("generated", datetime.date.today().isoformat()),
            ("dsd_level", dsd_rows[0]["level"] if dsd_rows else ""),
            ("periods", "|".join(f"{a}-{b}" for a, b in PERIODS)),
            ("n_variables", len(params)),
            ("period_rule_default", "average (typical year); periods are contiguous, no overlap"),
            ("period_aggregation", "|".join(f"{p['code']}={p['agg']}" for p in params)),
            ("expected_columns", "|".join(heads))]
    for ri, (k, v) in enumerate(meta, 1):
        mt.cell(row=ri, column=1, value=k).font = F_BODY
        mt.cell(row=ri, column=2, value=v).font = F_BODY
    mt.sheet_state = "hidden"

    outdir = os.path.join(OUTDIR, province.replace(" ", "_"))
    os.makedirs(outdir, exist_ok=True)
    out = os.path.join(outdir, f"{pcode}_upload_template.xlsx")
    wb.save(out)
    return out, params


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--resume", action="store_true",
                    help="skip jobs whose workbook already exists")
    ap.add_argument("--unlocked", action="store_true",
                    help="emit REVIEW copies: stamps _META protection="
                         "unlocked-review, so the importer validates columns "
                         "against the profile rather than against the file's own "
                         "_META, and rewrites the README to invite structural "
                         "mark-up. No longer about sheet protection -- no issue "
                         "is sheet-protected any more. Use while the expert panel "
                         "is revising the templates; re-run without the flag for "
                         "the collection set.")
    args = ap.parse_args()

    global UNLOCKED
    UNLOCKED = args.unlocked

    variables, membership = load_catalog()
    dsd = load_dsd()
    coverage, legacy_weights = load_legacy()
    weight_map = load_weight_map()
    period_agg = load_period_aggregation()
    overrides = load_province_overrides()

    jobs = []
    for (main, sub, hazard), codes in sorted(membership.items()):
        provs = sorted(coverage.get((main, sub, hazard), set())) or sorted(PROV_CODE)
        for p in provs:
            ov = overrides.get((p, main, sub, hazard))
            pcodes = codes
            if ov:
                pcodes = [c for c in codes if c not in ov["retire"]]
                for c in ov["add"]:
                    if c not in pcodes:
                        pcodes.append(c)
                pcodes = sorted(set(pcodes),
                                key=lambda c: (variables[c]["domain"] != "hazard", c))
                unknown = [c for c in pcodes if c not in variables]
                if unknown:
                    raise SystemExit(
                        "override names variables missing from the catalogue and "
                        "its addendum: %s (%s / %s / %s / %s)"
                        % (", ".join(unknown), p, main, sub, hazard))
            jobs.append((p, main, sub, hazard, pcodes, ov))
    jobs = jobs[args.start:]
    if args.limit:
        jobs = jobs[:args.limit]
    if args.resume:
        jobs = [j for j in jobs if not os.path.exists(os.path.join(
            OUTDIR, j[0].replace(" ", "_"),
            f"{profile_code(j[1], j[2], j[3], j[0])}_upload_template.xlsx"))]

    manifest = []
    for province, main, sub, hazard, codes, ov in jobs:
        out, params = build(province, main, sub, hazard, variables, codes,
                            dsd.get(province, []), legacy_weights, weight_map,
                            period_agg, ov)
        nw = sum(1 for p in params
                 if p["legacy_weight"] is not None or p.get("panel_weight") is not None)
        manifest.append(dict(
            file=os.path.relpath(out, HERE), province=province, main_sector=main,
            subsector=sub, hazard=hazard, n_variables=len(params),
            n_with_legacy_weight=nw, n_new_variables=len(params) - nw,
            n_rows=len(dsd.get(province, [])),
            panel_overrides=(len(ov["add"]) + len(ov["retire"])) if ov else 0))

    if manifest:
        mpath = os.path.join(OUTDIR, "MANIFEST.csv")
        exists = os.path.exists(mpath)
        with open(mpath, "a" if (exists and args.resume) else "w", newline="",
                  encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=list(manifest[0].keys()))
            if not (exists and args.resume):
                w.writeheader()
            w.writerows(manifest)

    print(f"generated {len(manifest)} workbooks into {OUTDIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
