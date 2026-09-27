"""Build an upload workbook for the profile AS IT STANDS NOW.

WHY (QA 26 Sep 2026). The only workbooks in circulation were the 243 generated
on 15 Aug 2026, every one stamped `_V1`. Since then the provincial panels have
added, renamed and retired variables and each weights save has minted a new
version -- Central's Paddy / Drought is V4. An officer re-importing a V1 file
got the values into the right profile (the loader routes by scope), but the
batch was recorded against the V1 code, and a variable the panel added since V1
simply had no column in the file to type it into.

So the import tab now offers the current contract as a download: one tab per
collection period, the active profile's variables in the loader's own column
order, and the official values already in the database pre-filled, so updating
a division means changing a cell rather than re-typing the province. `_META`
carries the ACTIVE profile code and version, which is what the batch list then
shows.

The layout is the one `template_reader.py` reads (header row 2, entry-rule row
3, a specimen row 4, data from row 5) and the one
design/templates/generate_templates.py writes, so a downloaded file and a
generated file go through exactly the same checks.
"""

from __future__ import annotations

import datetime
import io

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

from app.importer.load_template import AGG_HINT
from app.importer.template_reader import FIXED_COLUMNS, TRAILING_COLUMNS

F_TITLE = Font(bold=True, size=12)
F_HDR = Font(bold=True)
F_SUB = Font(italic=True, size=9, color="555555")
F_EX = Font(italic=True, color="999999")
FILL_HAZ = PatternFill("solid", fgColor="FDE2E1")
FILL_EXP = PatternFill("solid", fgColor="E1ECFD")
FILL_EX = PatternFill("solid", fgColor="EEEEEE")


async def build_profile_workbook(conn, profile_id: int, periods: list[str],
                                 include_hazard: bool = True) -> tuple[str, bytes]:
    """`include_hazard=False` leaves the shared climate columns out -- for an
    officer without the hazard-data grant, who could not load them anyway
    (they come in through the province's climate workbook)."""
    prof = await conn.fetchrow(
        """
        SELECT vp.id, vp.code, vp.version, vp.province_id, p.name AS province,
               s.name AS sector, ss.name AS subsector, h.name AS hazard
          FROM vulnerability_profile vp
          JOIN province p ON p.id = vp.province_id
          JOIN sector s ON s.id = vp.sector_id
          LEFT JOIN subsector ss ON ss.id = vp.subsector_id
          JOIN hazard_type h ON h.id = vp.hazard_type_id
         WHERE vp.id = $1
        """, profile_id)
    # Same list and order as load_template.profile_context -> the contract the
    # loader will check this file against.
    members = await conn.fetch(
        """
        SELECT ic.id, ic.code, ic.name, ic.domain::text AS domain,
               ic.period_aggregation, ic.value_kind::text AS value_kind
          FROM profile_indicator pi
          JOIN indicator_catalog ic ON ic.id = pi.indicator_id
         WHERE pi.profile_id = $1 AND ($2 OR ic.domain <> 'hazard')
         ORDER BY (ic.domain <> 'hazard'), ic.code
        """, profile_id, include_hazard)
    divisions = await conn.fetch(
        """SELECT id, code, name, COALESCE(district_name, '') AS district
             FROM ds_division WHERE province_id = $1 ORDER BY district_name, name""",
        prof["province_id"])
    values = {(r["indicator_id"], r["ds_division_id"], r["year_start"], r["year_end"]): r["raw_value"]
              for r in await conn.fetch(
                  """
                  SELECT indicator_id, ds_division_id, year_start, year_end, raw_value
                    FROM indicator_value
                   WHERE source = 'data' AND scenario_id IS NULL
                     AND indicator_id = ANY($1::bigint[])
                     AND ds_division_id = ANY($2::bigint[])
                  """, [m["id"] for m in members], [d["id"] for d in divisions])}

    codes = [m["code"] for m in members]
    heads = FIXED_COLUMNS + codes + TRAILING_COLUMNS
    label = prof["sector"] + (" / " + prof["subsector"] if prof["subsector"] else "") \
        + " - " + prof["hazard"]

    wb = Workbook()
    wb.remove(wb.active)
    for period in periods:
        y0, y1 = (int(x) for x in period.split("-"))
        ws = wb.create_sheet(period)
        ws["A1"] = ("RAW DATA %s - %s - %s Province   [profile %s]   |   Enter RAW "
                    "values only - the system normalizes. Blank = not collected."
                    % (period, label, prof["province"], prof["code"]))
        ws["A1"].font = F_TITLE
        subs = ["do not edit"] * 5 + [
            "%s: %s\n>> %s" % (m["domain"], m["name"] or m["code"],
                               AGG_HINT.get(m["period_aggregation"], AGG_HINT["average"]))
            for m in members] + ["origin of the numbers", "optional"]
        for ci, (h, sb) in enumerate(zip(heads, subs), 1):
            c = ws.cell(row=2, column=ci, value=h)
            c.font = F_HDR
            if 5 < ci <= 5 + len(members):
                c.fill = FILL_HAZ if members[ci - 6]["domain"] == "hazard" else FILL_EXP
            ws.cell(row=3, column=ci, value=sb).font = F_SUB
        ws.row_dimensions[3].height = 46
        ex = ["EXAMPLE", "- sample formatting, do not edit -", "-", y0, y1] + \
             [round(100 + 37.5 * i, 1) for i in range(len(members))] + ["Dept. report", "example row"]
        for ci, v in enumerate(ex, 1):
            c = ws.cell(row=4, column=ci, value=v)
            c.font = F_EX
            c.fill = FILL_EX
        dv = DataValidation(type="decimal", operator="greaterThanOrEqual", formula1="0",
                            allow_blank=True, errorTitle="Invalid value",
                            error="Raw values must be numbers >= 0.")
        ws.add_data_validation(dv)
        for ri, d in enumerate(divisions, 5):
            ws.cell(ri, 1, d["code"])
            ws.cell(ri, 2, d["name"])
            ws.cell(ri, 3, d["district"])
            ws.cell(ri, 4, y0)
            ws.cell(ri, 5, y1)
            for mi, m in enumerate(members):
                col = 6 + mi
                v = values.get((m["id"], d["id"], y0, y1))
                if v is not None:
                    ws.cell(ri, col, v)
                if m["value_kind"] != "signed":
                    dv.add(ws.cell(ri, col))
        ws.freeze_panes = "F5"
        ws.column_dimensions["B"].width = 30

    rd = wb.create_sheet("README")
    for i, line in enumerate([
            "Risk Radar upload workbook - %s, %s Province" % (label, prof["province"]),
            "Profile %s (version %d), downloaded %s."
            % (prof["code"], prof["version"], datetime.date.today().isoformat()),
            "Official values already in Risk Radar are pre-filled. Change a cell to "
            "correct it, fill a blank to add it; a blank cell is 'not collected', never 0.",
            "Do not add, remove, rename or reorder columns - the importer checks them.",
            "Import it on the Import tab: Check first, then Import."], 1):
        rd.cell(i, 1, line)

    mt = wb.create_sheet("_META")
    meta = [("profile_code", prof["code"]), ("version", prof["version"]),
            ("kind", "profile"),
            ("province", prof["province"]), ("main_sector", prof["sector"]),
            ("subsector", prof["subsector"] or ""), ("hazard", prof["hazard"]),
            ("protection", "locked"),
            ("generated", datetime.date.today().isoformat()),
            ("source", "downloaded from the Risk Radar import tab"),
            ("periods", "|".join(periods)),
            ("n_variables", len(members)),
            ("expected_columns", "|".join(heads))]
    for ri, (k, v) in enumerate(meta, 1):
        mt.cell(ri, 1, k)
        mt.cell(ri, 2, v)
    mt.sheet_state = "hidden"

    buf = io.BytesIO()
    wb.save(buf)
    return "%s_upload_template.xlsx" % prof["code"], buf.getvalue()
