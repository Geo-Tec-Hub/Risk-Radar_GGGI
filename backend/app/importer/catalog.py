"""Resolves workbook headers and DS_Codes against the indicator catalogue and
the DS division register (TASK_BRIEF_IMPORTER.md "Reading the files").

Division resolution always reads `design/ingestion/dsd_register.csv`: the
numeric `DS_Code` the workbooks carry is `ds_code_official_num`, a column that
exists only in that CSV -- `ds_division` in the live schema carries the
official *alpha* code (KA1, AM8, ...) and never the numeric one (CLAUDE.md,
"Join the shapefile to the register on new_ds_cod, never on name" /
"Hard-won facts"). The CSV is the authority for the register regardless of
whether the database is reachable.

Indicator/alias resolution prefers the live database (indicator_catalog,
indicator_alias) -- consensus, status and newly recorded aliases can move
between the last seed and now. It falls back to the generated seed snapshot
(`design/ingestion/seed_all.sql`) only when the database is unreachable, and
`Catalog.source` says which one was actually used so a report never claims
liveness it doesn't have.
"""

from __future__ import annotations

import csv
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

log = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[3]
DSD_REGISTER_CSV = REPO_ROOT / "design" / "ingestion" / "dsd_register.csv"
SEED_ALL_SQL = REPO_ROOT / "design" / "ingestion" / "seed_all.sql"


def normalize_header(text: object) -> str:
    """Strip non-alphanumerics and lowercase -- the brief's column-matching rule."""
    if text is None:
        return ""
    return re.sub(r"[^a-z0-9]", "", str(text).lower())


# Province names are matched the same tolerant way: workbook PROVINCE_N cells
# arrive as 'WESTERN', the register as 'Western', and NWE-style workbooks
# sometimes even split "North Western" -- normalizing away case and spacing
# handles all of it without a per-province alias table.
normalize_province = normalize_header


@dataclass(frozen=True)
class Division:
    ds_code_num: int  # numeric DS_Code the workbooks carry
    code: str  # official alpha code (KA1, AM8, ...) -- dsd_register.ds_code
    name: str
    province: str  # as written in dsd_register.csv, e.g. "Western"
    district: str


@dataclass(frozen=True)
class CatalogEntry:
    code: str
    name: str
    status: str  # active | pending | retired
    domain: Optional[str] = None


@dataclass
class Catalog:
    source: str  # human-readable provenance, always shown in the report
    divisions_by_num: dict[int, Division] = field(default_factory=dict)
    divisions_by_province: dict[str, list[Division]] = field(default_factory=dict)
    indicator_by_norm_code: dict[str, CatalogEntry] = field(default_factory=dict)
    alias_by_norm: dict[str, CatalogEntry] = field(default_factory=dict)

    def resolve_indicator(self, normalized_header: str) -> Optional[CatalogEntry]:
        entry = self.indicator_by_norm_code.get(normalized_header)
        if entry is not None:
            return entry
        return self.alias_by_norm.get(normalized_header)

    def division(self, ds_code_num: int) -> Optional[Division]:
        return self.divisions_by_num.get(ds_code_num)

    def province_divisions(self, province_name: str) -> list[Division]:
        return self.divisions_by_province.get(normalize_province(province_name), [])


def _load_divisions(path: Path = DSD_REGISTER_CSV) -> tuple[dict[int, Division], dict[str, list[Division]]]:
    by_num: dict[int, Division] = {}
    by_province: dict[str, list[Division]] = {}
    with path.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            num_raw = row.get("ds_code_official_num", "").strip()
            if not num_raw:
                continue
            div = Division(
                ds_code_num=int(num_raw),
                code=row["ds_code"],
                name=row["ds_division"],
                province=row["province"],
                district=row["district"],
            )
            by_num[div.ds_code_num] = div
            by_province.setdefault(normalize_province(div.province), []).append(div)
    return by_num, by_province


# indicator_catalog rows: ('CODE', 'Name text', 'domain', 'status', 'period_agg'),
_CATALOG_ROW = re.compile(
    r"\(\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,"
    r"\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*\)"
)
# indicator_alias rows: ((SELECT id FROM indicator_catalog WHERE code = 'CODE'), 'alias text'),
_ALIAS_ROW = re.compile(
    r"\(\(SELECT id FROM indicator_catalog WHERE code = '((?:[^']|'')*)'\)\s*,\s*'((?:[^']|'')*)'\)"
)


def _sql_unescape(s: str) -> str:
    return s.replace("''", "'")


def _extract_statement(text: str, marker: str) -> str:
    start = text.index(marker)
    end = text.index(";", start)
    return text[start:end]


def _load_catalog_and_aliases_from_seed(
    path: Path = SEED_ALL_SQL,
) -> tuple[dict[str, CatalogEntry], dict[str, CatalogEntry]]:
    text = path.read_text(encoding="utf-8")

    catalog_block = _extract_statement(text, "INSERT INTO indicator_catalog")
    entries_by_code: dict[str, CatalogEntry] = {}
    by_norm_code: dict[str, CatalogEntry] = {}
    for m in _CATALOG_ROW.finditer(catalog_block):
        code, name, domain, status, _period_agg = (_sql_unescape(g) for g in m.groups())
        entry = CatalogEntry(code=code, name=name, status=status, domain=domain)
        entries_by_code[code] = entry
        by_norm_code[normalize_header(code)] = entry

    alias_block = _extract_statement(text, "INSERT INTO indicator_alias")
    by_norm_alias: dict[str, CatalogEntry] = {}
    for m in _ALIAS_ROW.finditer(alias_block):
        code, alias = (_sql_unescape(g) for g in m.groups())
        entry = entries_by_code.get(code)
        if entry is None:
            continue  # would mean seed_all.sql references a code it never defines -- report, don't crash
        by_norm_alias[normalize_header(alias)] = entry

    return by_norm_code, by_norm_alias


def load_static_snapshot() -> Catalog:
    """Build a Catalog from the committed generated sources, no database needed."""
    by_num, by_province = _load_divisions()
    by_norm_code, by_norm_alias = _load_catalog_and_aliases_from_seed()
    return Catalog(
        source=f"static snapshot ({DSD_REGISTER_CSV.relative_to(REPO_ROOT)} + {SEED_ALL_SQL.relative_to(REPO_ROOT)})",
        divisions_by_num=by_num,
        divisions_by_province=by_province,
        indicator_by_norm_code=by_norm_code,
        alias_by_norm=by_norm_alias,
    )


async def load_catalog_from_db(pool) -> Catalog:
    """Division register still comes from the CSV (see module docstring); only
    the indicator catalogue and its aliases are read live."""
    by_num, by_province = _load_divisions()

    by_norm_code: dict[str, CatalogEntry] = {}
    entries_by_code: dict[str, CatalogEntry] = {}
    async with pool.acquire() as conn:
        cat_rows = await conn.fetch(
            "SELECT code, name, status::text AS status, domain::text AS domain FROM indicator_catalog"
        )
        for r in cat_rows:
            entry = CatalogEntry(code=r["code"], name=r["name"], status=r["status"], domain=r["domain"])
            entries_by_code[entry.code] = entry
            by_norm_code[normalize_header(entry.code)] = entry

        alias_rows = await conn.fetch(
            "SELECT ic.code AS indicator_code, a.alias AS alias "
            "FROM indicator_alias a JOIN indicator_catalog ic ON ic.id = a.indicator_id"
        )
        by_norm_alias: dict[str, CatalogEntry] = {}
        for r in alias_rows:
            entry = entries_by_code.get(r["indicator_code"])
            if entry is None:
                continue
            by_norm_alias[normalize_header(r["alias"])] = entry

    return Catalog(
        source=f"live database ({len(entries_by_code)} catalogue rows, {len(by_norm_alias)} aliases)",
        divisions_by_num=by_num,
        divisions_by_province=by_province,
        indicator_by_norm_code=by_norm_code,
        alias_by_norm=by_norm_alias,
    )


async def load_catalog(pool=None) -> Catalog:
    """Try the live database; fall back to the static snapshot. Never raises
    for a reachability failure -- that's reported, not fatal, matching
    app/db.py's own "absence is not fatal" rule."""
    if pool is not None:
        try:
            return await load_catalog_from_db(pool)
        except Exception:
            log.exception("live catalogue read failed; falling back to the static snapshot")
    return load_static_snapshot()
