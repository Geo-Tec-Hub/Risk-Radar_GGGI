#!/usr/bin/env python3
"""
D7 prep — catalog deduplication draft.

Clusters the ~300 raw variable descriptions in variables_inventory.csv into
canonical catalog variables (fuzzy matching catches spelling/spacing variants
like 'Asweddumized' vs 'Aswedumized'), proposes a globally unique code per
cluster, and writes:

  catalog_dedup_review.xlsx — for human review:
      'Canonical variables' sheet: one row per proposed variable, with
          status AUTO (variants identical after normalization) or
          CHECK (fuzzy merge — confirm it is really one variable),
          usage stats, and an empty DECISION column (approve / rename / split).
      'Variant mapping' sheet: every raw description → its cluster.

  variant_mapping.csv — machine-readable, feeds the seed-SQL generator after
      the review decisions are applied.

Clustering: token-level union-find. Two descriptions merge only if every
meaningful token in each fuzzy-matches (>= 0.85) a token in the other —
catches typos (popultry/poultry, aswedumized) while refusing semantic
differences (cattle vs buffalo, daily vs monthly, '%' vs 'no of', 1974 vs
2005). Weak filler words (no/of/total/...) may dangle unmatched.
"""
import csv, os, re
from difflib import SequenceMatcher
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
INV = os.path.join(HERE, "variables_inventory.csv")

STOP = {"of", "the", "from", "total", "for", "in", "a", "no", "and", "to"}
WEAK = STOP | {"nos", "number"}          # may dangle unmatched between variants
TOKFUZZ = 0.85

def norm(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9% ]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def slug(desc, used):
    words = re.sub(r"[^A-Za-z0-9 %]", " ", desc).split()
    words = [w for w in words if w.lower() not in STOP][:5]
    s = "_".join(w.upper() for w in words).replace("%", "PCT") or "VAR"
    s = re.sub(r"_+", "_", s)[:44]
    base, i = s, 2
    while s in used:
        s = f"{base}_{i}"; i += 1
    used.add(s)
    return s

rows = list(csv.DictReader(open(INV, encoding="utf-8-sig")))
for r in rows:
    r["norm"] = norm(r["description"])

# distinct normalized descriptions
variants = sorted({r["norm"] for r in rows})
print("raw distinct descriptions:", len({r["description"] for r in rows}))
print("after normalization:", len(variants))

# union-find fuzzy clustering
parent = list(range(len(variants)))
def find(i):
    while parent[i] != i:
        parent[i] = parent[parent[i]]; i = parent[i]
    return i
def union(i, j):
    parent[find(j)] = find(i)

def toks(s):
    return [t for t in s.split() if t not in WEAK]

def tok_match(a, b):
    """True if tokens correspond 1:1 allowing typos; numbers must be exact."""
    ta, tb = toks(a), toks(b)
    if not ta or not tb:
        return False
    def covered(src, dst):
        for t in src:
            best = 0.0
            for u in dst:
                if t == u:
                    best = 1.0; break
                if t.isdigit() or u.isdigit():
                    continue                       # numbers: exact only
                r = SequenceMatcher(None, t, u).ratio()
                best = max(best, r)
            if best < TOKFUZZ:
                return False
        return True
    return covered(ta, tb) and covered(tb, ta)

for i in range(len(variants)):
    for j in range(i + 1, len(variants)):
        if tok_match(variants[i], variants[j]):
            union(i, j)

clusters = defaultdict(list)
for i, v in enumerate(variants):
    clusters[find(i)].append(v)
print("clusters (canonical variables):", len(clusters))

# aggregate usage per cluster
by_norm = defaultdict(list)
for r in rows:
    by_norm[r["norm"]].append(r)

used_codes = set()
canon = []
for members in sorted(clusters.values(), key=lambda m: -sum(len(by_norm[x]) for x in m)):
    uses = [r for v in members for r in by_norm[v]]
    # canonical name = most frequent original spelling
    spell = defaultdict(int)
    for r in uses:
        spell[r["description"].strip()] += 1
    name = max(spell, key=spell.get)
    raw_variants = sorted(spell)
    status = "AUTO" if len(members) == 1 and len(raw_variants) == 1 else "CHECK"
    canon.append({
        "status": status,
        "code": slug(name, used_codes),
        "name": name,
        "n_variants": len(raw_variants),
        "n_uses": len(uses),
        "domains": "/".join(sorted({r["domain"] for r in uses})),
        "sectors": ", ".join(sorted({r["sector_dir"] + (f":{r['subsector'].strip()}" if r["subsector"].strip() else "") for r in uses})),
        "hazards": "/".join(sorted({r["hazard"] for r in uses})),
        "provinces": ", ".join(sorted({r["province"] for r in uses})),
        "variants": " || ".join(raw_variants),
        "members": members,
    })

print("AUTO:", sum(1 for c in canon if c["status"] == "AUTO"),
      "| CHECK:", sum(1 for c in canon if c["status"] == "CHECK"))

# machine-readable mapping
with open(os.path.join(HERE, "variant_mapping.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh)
    w.writerow(["proposed_code", "canonical_name", "raw_description_normalized"])
    for c in canon:
        for m in c["members"]:
            w.writerow([c["code"], c["name"], m])

# review workbook
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
F_T = Font(name="Arial", bold=True, size=13)
F_H = Font(name="Arial", bold=True, size=10, color="FFFFFF")
F_B = Font(name="Arial", size=10)
FILL_H = PatternFill("solid", fgColor="1F4E79")
FILL_CHECK = PatternFill("solid", fgColor="FFE599")
FILL_DEC = PatternFill("solid", fgColor="FFF9C4")
THIN = Border(*[Side(style="thin", color="BFBFBF")] * 4)
WRAP = Alignment(wrap_text=True, vertical="top")

wb = Workbook()
ws = wb.active
ws.title = "Canonical variables"
ws["A1"] = ("Catalog dedup review — approve each proposed variable. "
            "Fill DECISION: ok / rename:<new name> / split (if a CHECK row wrongly merged two variables). "
            "Yellow rows are fuzzy merges — please verify.")
ws["A1"].font = F_T
hdr = ["status", "proposed_code", "canonical_name", "DECISION", "n_variants",
       "n_uses", "domains", "sectors (:subsector)", "hazards", "provinces", "all variants seen"]
for ci, h in enumerate(hdr, 1):
    c = ws.cell(row=2, column=ci, value=h); c.font = F_H; c.fill = FILL_H; c.border = THIN
for ri, c0 in enumerate(canon, 3):
    vals = [c0["status"], c0["code"], c0["name"], "", c0["n_variants"], c0["n_uses"],
            c0["domains"], c0["sectors"], c0["hazards"], c0["provinces"], c0["variants"]]
    for ci, v in enumerate(vals, 1):
        c = ws.cell(row=ri, column=ci, value=v)
        c.font = F_B; c.border = THIN; c.alignment = WRAP
        if c0["status"] == "CHECK":
            c.fill = FILL_CHECK
        if ci == 4:
            c.fill = FILL_DEC
for col, w in zip("ABCDEFGHIJK", (8, 34, 44, 14, 9, 8, 16, 34, 14, 30, 70)):
    ws.column_dimensions[col].width = w
ws.freeze_panes = "A3"

ws2 = wb.create_sheet("Variant mapping")
for ci, h in enumerate(["proposed_code", "canonical_name", "normalized variant"], 1):
    c = ws2.cell(row=1, column=ci, value=h); c.font = F_H; c.fill = FILL_H; c.border = THIN
r = 2
for c0 in canon:
    for m in c0["members"]:
        for ci, v in enumerate([c0["code"], c0["name"], m], 1):
            ws2.cell(row=r, column=ci, value=v).font = F_B
        r += 1
for col, w in zip("ABC", (34, 44, 60)):
    ws2.column_dimensions[col].width = w

out = os.path.join(HERE, "catalog_dedup_review.xlsx")
wb.save(out)
print("wrote", out)
