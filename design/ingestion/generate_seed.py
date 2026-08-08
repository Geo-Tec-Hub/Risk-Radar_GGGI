#!/usr/bin/env python3
"""
Generate seed_all.sql from the design artefacts.

Replaces the hand-written seed_indicator_catalog_final.sql, which was written
against assumed column names and turned out not to match schema.sql at all
(it used sector/subsector/hazard TEXT columns and indicator_code FKs that do
not exist). Generating it from the same files the templates use means the seed
and the workbooks can never disagree.

Reads:
    FINAL_VARIABLES.xlsx        variables + profile membership
    dsd_register.csv            9 provinces, 25 districts, 330 DS divisions
    period_aggregation.json     per-variable year-range rule
    legacy_weight_map.json      legacy description -> official code (aliases)
    variables_inventory.csv     legacy weights per province-profile
    catalog_dedup_review.xlsx   old proposed codes -> aliases

Writes: seed_all.sql   (reference data -> catalog -> aliases -> profiles -> membership)

Usage:  python generate_seed.py
"""
import csv
import json
import os
import re
import sys
from collections import OrderedDict, defaultdict

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "seed_all.sql")

PROV_CODE = OrderedDict([
    ("Central", "CEN"), ("Eastern", "EAS"), ("North Central", "NCE"),
    ("Northern", "NOR"), ("Northwestern", "NWE"), ("Sabaragamuwa", "SAB"),
    ("Southern", "SOU"), ("Uva", "UVA"), ("Western", "WES"),
])
HAZARD_CODE = {"Drought": "drought", "Flood": "flood", "Landslide": "landslide"}

PROV_FIX = {"Northen": "Northern"}
LEGACY2NEW = {
    ("Coconut", ""): ("Agriculture Sector", "Coconut"),
    ("Paddy", ""): ("Agriculture Sector", "Paddy"),
    ("Tea", ""): ("Agriculture Sector", "Tea"),
    ("Vegetables & Other Field Crops", ""): ("Agriculture Sector",
                                             "Vegetable & Other Field Crops"),
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


def q(s):
    """SQL string literal, or NULL."""
    if s is None or s == "":
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def slug(s):
    return re.sub(r"[^A-Z0-9]+", "_", str(s).upper()).strip("_")


def sector_code(name):
    return slug(name.replace(" Sector", ""))


def main():
    # ---------- read ----------
    wb = openpyxl.load_workbook(os.path.join(HERE, "FINAL_VARIABLES.xlsx"),
                                data_only=True)
    ws = wb["Variables"]
    variables = OrderedDict()
    for r in range(2, ws.max_row + 1):
        code = ws.cell(r, 1).value
        if not code:
            continue
        variables[code] = dict(name=ws.cell(r, 2).value,
                               domain=ws.cell(r, 3).value,
                               variants=ws.cell(r, 7).value or "",
                               old=ws.cell(r, 8).value or "")

    pv = wb["Profile_Variables"]
    membership = defaultdict(list)
    for r in range(2, pv.max_row + 1):
        m, s, h, c = (pv.cell(r, i).value for i in (1, 2, 3, 4))
        if c:
            membership[(m, s or "", h)].append(c)

    agg = {}
    p = os.path.join(HERE, "period_aggregation.json")
    if os.path.exists(p):
        agg = json.load(open(p, encoding="utf-8"))

    # province coverage + legacy weights, from the 9-province inventory
    coverage, weights = defaultdict(set), defaultdict(dict)
    wmap = {}
    p = os.path.join(HERE, "legacy_weight_map.json")
    if os.path.exists(p):
        wmap = json.load(open(p, encoding="utf-8"))
    with open(os.path.join(HERE, "variables_inventory.csv"),
              encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            key = (row["sector_dir"], row["subsector"].strip())
            if key not in LEGACY2NEW:
                continue
            main_s, sub = LEGACY2NEW[key]
            prov = PROV_FIX.get(row["province"], row["province"])
            coverage[(main_s, sub, row["hazard"])].add(prov)
            code = wmap.get(row["description"])
            if not code:
                continue
            try:
                w = float(row["weight_pct"])
            except (TypeError, ValueError):
                w = None
            rel = (row["relationship"] or "+").strip()
            weights[(prov, main_s, sub, row["hazard"])][code] = (w, rel)

    # sectors / subsectors actually used
    sectors, subsectors = OrderedDict(), OrderedDict()
    for (m, s, h) in membership:
        sectors.setdefault(m, sector_code(m))
        if s:
            subsectors.setdefault((m, s), slug(s))

    # ---------- write ----------
    L = []
    add = L.append
    add("-- ============================================================================")
    add("-- Risk Radar - seed data (GENERATED by generate_seed.py, do not edit by hand)")
    add("-- Run after: schema.sql, schema_weights_addendum.sql, spatial-model.sql")
    add("--")
    add("-- Supersedes seed_indicator_catalog_final.sql, which was written against")
    add("-- assumed column names and did not match schema.sql.")
    add("--")
    add("-- Foreign keys are resolved by CODE in subqueries, so this file is")
    add("-- order-independent and safe to re-run (every INSERT is ON CONFLICT-guarded).")
    add("-- ============================================================================")
    add("BEGIN;\n")

    # provinces
    add("-- 1. Provinces -------------------------------------------------------------")
    add("INSERT INTO province (code, name) VALUES")
    add(",\n".join(f"  ({q(c)}, {q(n)})" for n, c in PROV_CODE.items())
        + "\nON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;\n")

    # hazard types
    add("-- 2. Hazard types ----------------------------------------------------------")
    add("INSERT INTO hazard_type (code, name) VALUES")
    add(",\n".join(f"  ({q(c)}, {q(n)})" for n, c in HAZARD_CODE.items())
        + "\nON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;\n")

    # sectors
    add("-- 3. Sectors ---------------------------------------------------------------")
    add("INSERT INTO sector (code, name) VALUES")
    add(",\n".join(f"  ({q(c)}, {q(n)})" for n, c in sectors.items())
        + "\nON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;\n")

    # subsectors
    add("-- 4. Subsectors ------------------------------------------------------------")
    add("INSERT INTO subsector (sector_id, code, name) VALUES")
    rows = [f"  ((SELECT id FROM sector WHERE code = {q(sectors[m])}), {q(c)}, {q(s)})"
            for (m, s), c in subsectors.items()]
    add(",\n".join(rows) + "\nON CONFLICT (sector_id, code) DO UPDATE SET name = EXCLUDED.name;\n")

    # indicator catalog
    add("-- 5. Indicator catalog (174 canonical variables) ---------------------------")
    add("INSERT INTO indicator_catalog (code, name, domain, status, period_aggregation) VALUES")
    rows = [f"  ({q(c)}, {q(v['name'])}, {q(v['domain'])}, 'active', "
            f"{q(agg.get(c, 'average'))})" for c, v in variables.items()]
    add(",\n".join(rows) + """
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, domain = EXCLUDED.domain,
    status = 'active', period_aggregation = EXCLUDED.period_aggregation;\n""")

    # aliases: legacy codes and every name variant seen in the source sheets
    add("-- 6. Aliases (legacy codes + sheet-label variants) -------------------------")
    seen = set()
    rows = []
    for c, v in variables.items():
        cands = [x.strip() for x in str(v["variants"]).split("||") if x.strip()]
        cands += [x.strip() for x in str(v["old"]).split(",")
                  if x.strip() and x.strip() != "(new)" and x.strip() != c]
        cands.append(v["name"])
        for a in cands:
            k = (c, a.lower())
            if k in seen:
                continue
            seen.add(k)
            rows.append(f"  ((SELECT id FROM indicator_catalog WHERE code = {q(c)}), {q(a)})")
    add("INSERT INTO indicator_alias (indicator_id, alias) VALUES")
    add(",\n".join(rows) + "\nON CONFLICT DO NOTHING;\n")

    # profiles
    add("-- 7. Vulnerability profiles (province x sector x hazard) -------------------")
    prof_rows, mem_rows = [], []
    n_prof = 0
    for (m, s, h), codes in sorted(membership.items()):
        provs = sorted(coverage.get((m, s, h), set())) or list(PROV_CODE)
        for prov in provs:
            n_prof += 1
            pcode = f"{slug(s or m.replace(' Sector',''))}_{h.upper()}_{PROV_CODE[prov]}_V1"
            sub_sql = ("NULL" if not s else
                       f"(SELECT id FROM subsector WHERE code = {q(subsectors[(m, s)])} "
                       f"AND sector_id = (SELECT id FROM sector WHERE code = {q(sectors[m])}))")
            prof_rows.append(
                f"  ({q(pcode)}, {q(pcode)}, "
                f"(SELECT id FROM province WHERE code = {q(PROV_CODE[prov])}), "
                f"(SELECT id FROM sector WHERE code = {q(sectors[m])}), "
                f"{sub_sql}, "
                f"(SELECT id FROM hazard_type WHERE code = {q(HAZARD_CODE[h])}), 1, TRUE)")
            got = weights.get((prov, m, s, h), {})
            for c in sorted(set(codes),
                            key=lambda x: (variables[x]["domain"] != "hazard", x)):
                w, rel = got.get(c, (None, "+"))
                direction = "higher_is_better" if rel in ("-", "−") else "higher_is_worse"
                mem_rows.append(
                    f"  ((SELECT id FROM vulnerability_profile WHERE code = {q(pcode)}), "
                    f"(SELECT id FROM indicator_catalog WHERE code = {q(c)}), "
                    f"{q(variables[c]['domain'])}, "
                    f"{'NULL' if w is None else w}, {q(direction)})")

    add("INSERT INTO vulnerability_profile\n"
        "    (code, name, province_id, sector_id, subsector_id, hazard_type_id, version, is_active)\nVALUES")
    add(",\n".join(prof_rows) + "\nON CONFLICT (code) DO NOTHING;\n")

    add("-- 8. Profile membership ----------------------------------------------------")
    add("--    weight_pct NULL = variable belongs to the profile but has no weight yet;")
    add("--    it is set in the app at import. See addendum rev 4.")
    add("INSERT INTO profile_indicator (profile_id, indicator_id, domain, weight_pct, relationship)\nVALUES")
    add(",\n".join(mem_rows) + "\nON CONFLICT (profile_id, domain, indicator_id) DO NOTHING;\n")

    add("COMMIT;")

    open(OUT, "w", encoding="utf-8").write("\n".join(L))
    n_w = sum(1 for r in mem_rows if "NULL, " not in r)
    print(f"wrote {os.path.relpath(OUT, HERE)}")
    print(f"  provinces {len(PROV_CODE)} | hazards {len(HAZARD_CODE)} | "
          f"sectors {len(sectors)} | subsectors {len(subsectors)}")
    print(f"  variables {len(variables)} | aliases {len(rows) if rows else 0}")
    print(f"  profiles {n_prof} | memberships {len(mem_rows)} "
          f"({n_w} with a weight, {len(mem_rows) - n_w} NULL)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
