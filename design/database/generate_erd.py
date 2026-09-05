#!/usr/bin/env python3
"""
Generate the ERD directly from the DDL.

The previous erd.dot was hand-written, which is why it silently fell out of date
when D8 added five tables. This parses the schema files instead, so the diagram
cannot disagree with the database.

Reads (in order):
    schema.sql                    - base schema
    schema_weights_addendum.sql   - import batches, weight versioning, period rules
    spatial-model.sql             - D8 spatial layers + analysis toolbox

Writes: erd.dot, erd.svg, erd.png

Usage:  python generate_erd.py
"""
import os
import re
import subprocess
import sys
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
FILES = ["schema.sql", "schema_weights_addendum.sql", "spatial-model.sql",
         # consensus marker on profile_indicator + publication state on
         # vulnerability_profile (2026-08-09). Adds no tables, only columns.
         "schema_consensus_addendum.sql",
         # registration, approval and provincial scope on app_user (2026-08-09)
         "schema_auth_addendum.sql",
         # nullable geom + boundary_status on ds_division, the Kalmunai split
         # (O-2, Stage 1.14, 2026-08-10). Adds no tables, only columns.
         "schema_boundary_pending_addendum.sql",
         # server-side sessions, one new table (T2b, Stage 9.6, 2026-08-11)
         "schema_session_addendum.sql",
         # optional (needs pgvector) but always drawn - the diagram documents the
         # full design even when a given install skips this file
         "schema_agent_pgvector.sql"]

# module -> (colour, tables). Anything unlisted lands in "other".
MODULES = OrderedDict([
    ("Auth & users",        ("#7c5cbf", ["role", "app_user", "user_role", "app_session"])),
    ("Geography",           ("#2e7d32", ["province", "ds_division"])),
    ("Catalog",             ("#c77400", ["hazard_type", "sector", "subsector",
                                         "indicator_catalog", "indicator_alias"])),
    ("Vulnerability",       ("#1565c0", ["vulnerability_profile", "profile_indicator",
                                         "indicator_value", "vulnerability_result"])),
    ("Scenarios & impact",  ("#ad1457", ["ssp_scenario", "scenario_parameter",
                                         "impact_projection"])),
    ("Monitoring",          ("#00695c", ["monitoring_observation"])),
    ("Import",              ("#455a64", ["import_batch"])),
    ("Spatial toolbox (D8)", ("#00838f", ["spatial_layer", "spatial_feature",
                                          "spatial_operation", "computation_job",
                                          "computation_result"])),
    ("AI agent",            ("#5d4037", ["agent_document", "agent_embedding",
                                         "agent_answer", "agent_answer_review"])),
])
OTHER_COLOUR = "#616161"

# columns worth showing beyond keys - keeps the diagram readable without hiding
# the fields people actually ask about
ALWAYS_SHOW = {
    "code", "name", "domain", "status", "version", "is_active", "source",
    "raw_value", "normalized_value", "weight_pct", "relationship", "geom",
    "year_start", "year_end", "derivation", "period_aggregation",
    "vulnerability_index", "exposure_index", "hazard_index", "attributes",
    "attribute_schema", "geometry_type", "kind", "value", "embedding",
    "panel_note", "filename", "params", "area_km2", "norm_scope",
    # decision-bearing, so shown even though neither is a key: `consensus` is
    # whether a variable belongs in a profile at all (distinct from weight_pct,
    # which is how much it counts), and `publication` separates the official
    # profile version from a user's exploratory one.
    "consensus", "publication", "status", "organization",
    # which bounds produced the index — provincial (the headline) or national.
    # Part of the unique key since 2026-08-09, so a division holds both.
    "index_scope",
    # derived from geom IS NULL, but shown anyway: it is the whole point of
    # the Kalmunai split addendum — a division can be registered before it is
    # surveyed, and the diagram should say so, not just imply it via a
    # now-nullable geometry column.
    "boundary_status",
    # T2b: the whole point of app_session is that a row can be revoked —
    # sign-out and admin deactivation both act on this field, not on deleting
    # the row. token_hash is deliberately NOT shown (it is a digest, not
    # something anyone reads to understand the model, unlike revoked_at).
    "revoked_at", "expires_at",
}
TYPE_HINT = {
    "geom": "geometry 4326", "embedding": "vector(1024)",
    "attributes": "JSONB", "attribute_schema": "JSONB", "params": "JSONB",
    "error_detail": "JSONB", "citations": "JSONB",
}


def parse():
    tables, fks = OrderedDict(), []
    for fname in FILES:
        path = os.path.join(HERE, fname)
        if not os.path.exists(path):
            print(f"  ! missing {fname}, skipping", file=sys.stderr)
            continue
        sql = open(path, encoding="utf-8").read()

        for m in re.finditer(r"CREATE TABLE (\w+)\s*\((.*?)\n\);", sql, re.S):
            name, body = m.group(1), m.group(2)
            cols = OrderedDict()
            for line in body.split("\n"):
                cm = re.match(r"\s{4}(\w+)\s+(.+?)(?:,\s*(?:--.*)?)?$", line)
                if not cm:
                    continue
                col, rest = cm.group(1), cm.group(2)
                if col.upper() in ("CONSTRAINT", "UNIQUE", "PRIMARY",
                                   "FOREIGN", "CHECK", "EXCLUDE"):
                    continue
                tags = []
                if "PRIMARY KEY" in rest:
                    tags.append("PK")
                ref = re.search(r"REFERENCES (\w+)\s*\((\w+)\)", rest)
                if ref:
                    tags.append("FK")
                    fks.append((ref.group(1), name, col))
                cols[col] = tags
            tables[name] = cols

        # columns added later by ALTER
        for m in re.finditer(r"ALTER TABLE (\w+)\s+(.*?);", sql, re.S):
            tbl, body = m.group(1), m.group(2)
            if tbl not in tables:
                continue
            for am in re.finditer(r"ADD COLUMN (\w+)\s+([^,]+)", body):
                col, rest = am.group(1), am.group(2)
                tags = []
                ref = re.search(r"REFERENCES (\w+)\s*\((\w+)\)", rest)
                if ref:
                    tags.append("FK")
                    fks.append((ref.group(1), tbl, col))
                tables[tbl][col] = tags

    # inline "REFERENCES tbl(col)" written without parens in some places
    return tables, fks


def module_of(table):
    for mod, (colour, members) in MODULES.items():
        if table in members:
            return mod, colour
    return "Other", OTHER_COLOUR


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def node(table, cols):
    _, colour = module_of(table)
    shown = [(c, t) for c, t in cols.items()
             if t or c in ALWAYS_SHOW]
    hidden = len(cols) - len(shown)
    rows = [f'<TR><TD COLSPAN="2" BGCOLOR="{colour}">'
            f'<FONT COLOR="white"><B>{esc(table)}</B></FONT></TD></TR>']
    for c, tags in shown:
        label = esc(c) + (f"  {TYPE_HINT[c]}" if c in TYPE_HINT else "")
        tag = " ".join(tags) or "&nbsp;"
        rows.append(
            f'<TR><TD ALIGN="LEFT"><FONT POINT-SIZE="10">{label}</FONT></TD>'
            f'<TD ALIGN="RIGHT"><FONT POINT-SIZE="9" COLOR="#666666">{tag}</FONT></TD></TR>')
    if hidden:
        rows.append(f'<TR><TD COLSPAN="2" ALIGN="LEFT">'
                    f'<FONT POINT-SIZE="8" COLOR="#999999">+ {hidden} more</FONT></TD></TR>')
    body = "".join(rows)
    return (f' {table} [label=<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" '
            f'CELLPADDING="3">{body}</TABLE>>];')


def build_dot(tables, fks, title):
    # top-to-bottom keeps the clustered layout close to landscape (~1.5:1).
    # rankdir=LR produced a 1:2.5 strip that was unusable on a page.
    out = ["digraph ERD {",
           " rankdir=TB; splines=ortho; nodesep=0.40; ranksep=1.05; concentrate=true;",
           f' graph [fontname="Helvetica", label="{title}", labelloc=t, fontsize=16];',
           ' node [shape=plaintext, fontname="Helvetica"];',
           ' edge [color="#555555", arrowsize=0.7, arrowhead=crow, dir=back];']

    placed = set()
    for i, (mod, (colour, members)) in enumerate(MODULES.items()):
        present = [t for t in members if t in tables]
        if not present:
            continue
        out.append(f' subgraph cluster_{i} {{')
        out.append(f'  label="{mod}"; fontsize=12; fontcolor="{colour}"; '
                   f'color="{colour}"; style=rounded; penwidth=1.4;')
        for t in present:
            out.append("  " + node(t, tables[t]))
            placed.add(t)
        out.append(" }")

    leftovers = [t for t in tables if t not in placed]
    if leftovers:
        out.append(' subgraph cluster_other {')
        out.append('  label="Other"; fontsize=12; color="#616161"; style=rounded;')
        for t in leftovers:
            out.append("  " + node(t, tables[t]))
        out.append(" }")

    seen = set()
    for parent, child, col in fks:
        if parent not in tables or child not in tables:
            continue
        key = (parent, child)
        if key in seen or parent == child:
            continue
        seen.add(key)
        out.append(f" {parent} -> {child};")
    out.append("}")
    return "\n".join(out), len(seen), len(leftovers)


def main():
    tables, fks = parse()
    title = (f"Climate Vulnerability Web-GIS - ERD  |  {len(tables)} tables  "
             f"|  schema.sql + weights, spatial (D8), consensus, auth, "
             f"boundary-pending and session addenda\\n"
             f"PostgreSQL 16 + PostGIS + pgvector  |  generated from DDL by "
             f"generate_erd.py  |  2026-08-11")
    dot, n_edges, n_other = build_dot(tables, fks, title)

    dot_path = os.path.join(HERE, "erd.dot")
    open(dot_path, "w", encoding="utf-8").write(dot)
    print(f"tables: {len(tables)} | relationships drawn: {n_edges} | unclassified: {n_other}")

    for fmt in ("svg", "png"):
        out = os.path.join(HERE, f"erd.{fmt}")
        r = subprocess.run(["dot", f"-T{fmt}", dot_path, "-o", out],
                           capture_output=True, text=True)
        if r.returncode:
            print(f"  ! graphviz failed for {fmt}: {r.stderr[:300]}", file=sys.stderr)
        else:
            print(f"  wrote erd.{fmt} ({os.path.getsize(out):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
