"""Semantic check for the newest DDL addendum (the last entry in ORDER).

Working rule 2: parsing is not verification. pglast will happily accept a
statement that references a column which does not exist. So this does two
passes: parse every DDL file, then resolve the addendum's dependencies
(tables, columns, enum types, enum labels) against the symbol table built
from the files that come before it.
"""
import sys
from pathlib import Path

import pglast
from pglast import parse_sql
from pglast.stream import RawStream  # noqa: F401

BASE = Path(__file__).resolve().parent

ORDER = [
    "schema.sql",
    "schema_weights_addendum.sql",
    "spatial-model.sql",
    "schema_consensus_addendum.sql",
    "schema_auth_addendum.sql",
    "schema_boundary_pending_addendum.sql",
    "schema_session_addendum.sql",
]
# The file under test is the last one: everything before it is the symbol table
# it must resolve against. Add new addenda to the end of ORDER.
TARGET = ORDER[-1]

tables: dict[str, set[str]] = {}
types: set[str] = set()
enum_labels: dict[str, set[str]] = {}
views: set[str] = set()
funcs: set[str] = set()
errors: list[str] = []

def collect(raw, fname):
    """Very small DDL interpreter: enough to know what exists."""
    node = raw.stmt
    kind = node.__class__.__name__

    if kind == "CreateStmt":
        t = node.relation.relname
        cols = set()
        for el in (node.tableElts or ()):
            if el.__class__.__name__ == "ColumnDef":
                cols.add(el.colname)
        tables[t] = cols

    elif kind == "CreateEnumStmt":
        t = node.typeName[-1].sval
        types.add(t)
        enum_labels[t] = {v.sval for v in (node.vals or ())}

    elif kind == "AlterTableStmt":
        t = node.relation.relname
        for c in (node.cmds or ()):
            # c.subtype is an AlterTableType enum member. str() of it used to
            # give "AlterTableType.AT_AddColumn"; on this Python/pglast combo
            # it gives "0" instead (Python 3.11+ changed IntEnum.__str__ to
            # int.__str__), so every ADD/DROP COLUMN here silently matched
            # nothing and multi-column ALTER TABLE statements (e.g.
            # schema_auth_addendum.sql's 7-column ADD COLUMN) were never
            # entering the symbol table at all -- latent since whichever
            # addendum first introduced one, only surfaced now that a DEPS
            # entry actually depends on such a column. Use .name, which is
            # stable regardless of __str__.
            sub = c.subtype.name
            if sub == "AT_AddColumn":
                tables.setdefault(t, set()).add(c.def_.colname)
            elif sub == "AT_DropColumn":
                tables.setdefault(t, set()).discard(c.name)

    elif kind == "ViewStmt":
        views.add(node.view.relname)

    elif kind == "CreateFunctionStmt":
        funcs.add(node.funcname[-1].sval)

# ---------------------------------------------------------------- pass 1: parse
for fname in ORDER:
    path = BASE / fname
    text = path.read_text(encoding="utf-8")
    try:
        tree = parse_sql(text)
    except pglast.parser.ParseError as exc:  # noqa: PERF203
        errors.append(f"PARSE FAIL {fname}: {exc}")
        continue
    print(f"parsed  {fname:<34} {len(tree):>4} statements")
    if fname != TARGET:
        for stmt in tree:
            collect(stmt, fname)

if errors:
    print("\n".join(errors))
    sys.exit(1)

print(f"\nsymbol table: {len(tables)} tables, {len(types)} enum types, "
      f"{len(views)} views\n")

# ------------------------------------------- pass 2: resolve addendum's deps
# Every (table, column) the addendum reads or constrains. Enumerated by hand
# from the file, because that is the point: an automatic extractor would make
# the same assumptions the DDL already makes.
#
# TARGET is now schema_session_addendum.sql (T2b, Stage 9.6, server-side
# sessions). Replaced, not appended to the boundary-pending/auth lists — per
# the comment below, that is the whole point of TARGET = ORDER[-1].
DEPS = [
    ("app_user", "id"),
    ("app_user", "status"),
]

for t, c in DEPS:
    if t not in tables:
        errors.append(f"MISSING TABLE   {t}  (needed for {t}.{c})")
    elif c not in tables[t]:
        errors.append(f"MISSING COLUMN  {t}.{c}")

# Columns TARGET adds to an EXISTING table. These must NOT already exist, or
# its ADD COLUMN fails. schema_session_addendum.sql only creates a new table
# (app_session) -- it adds no columns to a table from an earlier file, so
# this list is empty for this target. Replace, not append, when the next
# addendum becomes TARGET.
NEW_COLS: list[tuple[str, str]] = []
for t, c in NEW_COLS:
    if c in tables.get(t, set()):
        errors.append(f"COLUMN ALREADY EXISTS  {t}.{c} — ADD COLUMN will fail")

# New enum types must not already exist. schema_session_addendum.sql defines
# no enum (revocation is a nullable timestamp + reason, not a state enum).
for ty in ():
    if ty in types:
        errors.append(f"TYPE ALREADY EXISTS  {ty}")

# The trigger function TARGET defines must not collide with one already
# defined earlier.
for fn in ("revoke_sessions_on_deactivation",):
    if fn in funcs:
        errors.append(f"FUNCTION ALREADY EXISTS  {fn}()")

# The table TARGET creates must not already exist.
for t in ("app_session",):
    if t in tables:
        errors.append(f"TABLE ALREADY EXISTS  {t} — CREATE TABLE will fail")

print("\n".join(errors) if errors else "OK — every dependency resolves.")
sys.exit(1 if errors else 0)
