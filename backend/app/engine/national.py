"""The national index (SRS v2.3 section 2.2, FR-4.3b, FR-4.3c) -- client request
NOTED-14, Nov 2026, once data entry was complete.

A division carries TWO indexes. The provincial one (engine/vulnerability.py) is
the headline and is never touched here. The national one is computed the same
way with one difference -- every min-max is taken across ALL the divisions of
the scope, nationally, instead of within one province:

    1. each variable is min-max scaled across every division, in every province
       whose profile carries it, that holds a value for it (national bounds);
    2. H and E are the weighted sums with EACH PROVINCE'S OWN weights (profiles
       are per province; nothing is re-weighted);
    3. the product H x E is min-max rescaled across every scored division of
       the scope in the country.

So a national 0.8 means "high for Sri Lanka" and is comparable across provinces;
a provincial 0.8 means "high for this province". They are stored side by side
(vulnerability_result.index_scope) and never mixed.

ALL PROVINCES AT ONCE, NEVER PROVINCE BY PROVINCE (FR-4.3b). A scope (sector /
subsector / hazard) gets a national index only when EVERY province that has an
active profile for it can compute. Otherwise the scope is refused and the
refusal names the provinces holding it, rather than publishing a "national"
scale that silently covers part of the country. A division with no value for a
weighted variable is unassessed, as on the provincial map -- absent is not zero.

Official (data) track only. The expert and community tracks are scored one
division at a time against the official ranges; they have no national form.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Optional

from app.engine.vulnerability import (_rescale, check_computable, load_memberships,
                                      product_bounds)


@dataclass
class NationalRefusal:
    scope: str
    reason: str
    provinces: list[str] = field(default_factory=list)

    def __str__(self) -> str:
        p = (": " + ", ".join(self.provinces)) if self.provinces else ""
        return "%s national index not computed - %s%s" % (self.scope, self.reason, p)


@dataclass
class NationalResult:
    scope: str
    rows: int
    provinces: int
    unassessed: int
    bound_min: float
    bound_max: float


async def national_scopes(conn) -> list[dict]:
    """Every (sector, subsector, hazard) that has an active profile anywhere."""
    rows = await conn.fetch(
        """
        SELECT DISTINCT vp.sector_id, vp.subsector_id, vp.hazard_type_id,
               s.code AS sector, ss.code AS subsector, h.code AS hazard
          FROM vulnerability_profile vp
          JOIN sector s ON s.id = vp.sector_id
          LEFT JOIN subsector ss ON ss.id = vp.subsector_id
          JOIN hazard_type h ON h.id = vp.hazard_type_id
         WHERE vp.is_active
         ORDER BY s.code, ss.code NULLS FIRST, h.code
        """)
    return [dict(r) for r in rows]


def _scope_name(sc: dict) -> str:
    return "%s%s / %s" % (sc["sector"], ("/" + sc["subsector"]) if sc["subsector"] else "",
                          sc["hazard"])


async def compute_national(conn, sc: dict, year_start: int, year_end: int
                           ) -> NationalResult | NationalRefusal:
    name = _scope_name(sc)
    profiles = await conn.fetch(
        """
        SELECT vp.id, vp.code, vp.province_id, p.name AS province, vp.sector_id,
               vp.subsector_id, vp.hazard_type_id
          FROM vulnerability_profile vp JOIN province p ON p.id = vp.province_id
         WHERE vp.is_active AND vp.sector_id = $1
           AND vp.subsector_id IS NOT DISTINCT FROM $2 AND vp.hazard_type_id = $3
         ORDER BY p.name
        """, sc["sector_id"], sc["subsector_id"], sc["hazard_type_id"])
    if not profiles:
        return NationalRefusal(name, "no active profile")

    # ---- every province's profile must be computable ----------------------
    blocked: list[str] = []
    members: dict[int, list[dict]] = {}
    for p in profiles:
        ms = await load_memberships(conn, p["id"])
        if check_computable(p["code"], ms) is not None:
            blocked.append(p["province"])
        members[p["id"]] = [m for m in ms if m["consensus"] in ("agreed", "contested")]
    if blocked:
        return NationalRefusal(name, "the weights of these provinces' profiles are "
                                     "incomplete, and a national scale must cover "
                                     "every province at once", blocked)

    # ---- raw values per province profile (official track, same rule as the
    # provincial engine: latest at or before the period start) --------------
    divs: dict[int, list] = {}
    raw: dict[tuple[int, int], dict[int, float]] = {}   # (profile, indicator) -> {div: v}
    for p in profiles:
        divs[p["id"]] = await conn.fetch(
            "SELECT id, code FROM ds_division WHERE province_id = $1 ORDER BY code",
            p["province_id"])
        ids = [d["id"] for d in divs[p["id"]]]
        for m in members[p["id"]]:
            rows = await conn.fetch(
                """
                SELECT DISTINCT ON (iv.ds_division_id) iv.ds_division_id, iv.raw_value
                  FROM indicator_value iv
                 WHERE iv.indicator_id = $1 AND iv.ds_division_id = ANY($2::bigint[])
                   AND iv.year_start <= $3
                   AND iv.source = 'data' AND iv.scenario_id IS NULL
                 ORDER BY iv.ds_division_id, iv.year_start DESC, iv.id DESC
                """, m["indicator_id"], ids, year_start)
            raw[(p["id"], m["indicator_id"])] = {r["ds_division_id"]: float(r["raw_value"])
                                                 for r in rows}

    # A province with no value at all for its profile is not "complete".
    empty = [p["province"] for p in profiles
             if not any(raw[(p["id"], m["indicator_id"])] for m in members[p["id"]])]
    if empty:
        return NationalRefusal(name, "no official data yet for", empty)

    # ---- national bounds per variable --------------------------------------
    bounds: dict[int, tuple[float, float]] = {}
    for (pid, iid), vals in raw.items():
        for v in vals.values():
            lo, hi = bounds.get(iid, (v, v))
            bounds[iid] = (min(lo, v), max(hi, v))

    # ---- H, E with each province's own weights -----------------------------
    scored: list[tuple] = []     # (profile row, div id, code, h, e, product, absent)
    unassessed = 0
    for p in profiles:
        ms = members[p["id"]]
        exposure_ms = [m for m in ms if m["domain"] == "exposure"]
        for d in divs[p["id"]]:
            if any(d["id"] not in raw[(p["id"], m["indicator_id"])] for m in ms):
                unassessed += 1
                continue
            h = e = 0.0
            for m in ms:
                lo, hi = bounds[m["indicator_id"]]
                n = _rescale(raw[(p["id"], m["indicator_id"])][d["id"]], lo, hi)
                if m["relationship"] == "higher_is_better":
                    n = 1.0 - n
                if m["domain"] == "hazard":
                    h += m["weight_pct"] * n / 100.0
                else:
                    e += m["weight_pct"] * n / 100.0
            h, e = min(1.0, max(0.0, h)), min(1.0, max(0.0, e))
            absent = bool(exposure_ms) and all(
                raw[(p["id"], m["indicator_id"])][d["id"]] == 0.0 for m in exposure_ms)
            scored.append((p, d["id"], d["code"], h, e, h * e, absent))
    if not scored:
        return NationalRefusal(name, "no division in the country has a value for "
                                     "every weighted variable")

    # ---- national rescale of the product -----------------------------------
    keys = list(range(len(scored)))
    lo, hi = product_bounds({k: scored[k][5] for k in keys},
                            {k: scored[k][6] for k in keys})

    var_codes = {m["indicator_id"]: m["code"] for ms in members.values() for m in ms}
    method_base = {
        "model": "V_raw = H x E; variables and product min-max scaled across every "
                 "division of the scope nationally; each province's own weights",
        "scope": "national",
        "period": "%d-%d" % (year_start, year_end),
        "variable_bounds": {var_codes[i]: list(b) for i, b in bounds.items()},
        "provinces": [p["province"] for p in profiles],
    }
    rows = [(div_id, p["id"], p["hazard_type_id"], p["sector_id"], p["subsector_id"],
             year_start, year_end, e, h,
             min(1.0, max(0.0, _rescale(prod, lo, hi))),
             json.dumps({**method_base, "sector_absent": absent}), lo, hi)
            for (p, div_id, _code, h, e, prod, absent) in scored]

    async with conn.transaction():
        await conn.execute(
            """DELETE FROM vulnerability_result
                WHERE profile_id = ANY($1::bigint[]) AND index_scope = 'national'
                  AND source = 'data'
                  AND year_start IS NOT DISTINCT FROM $2 AND year_end IS NOT DISTINCT FROM $3""",
            [p["id"] for p in profiles], year_start, year_end)
        await conn.executemany(
            """
            INSERT INTO vulnerability_result
                (ds_division_id, profile_id, hazard_type_id, sector_id, subsector_id,
                 source, year_start, year_end, exposure_index, hazard_index,
                 vulnerability_index, method, index_scope, bound_min, bound_max)
            VALUES ($1, $2, $3, $4, $5, 'data', $6, $7, $8, $9, $10, $11::jsonb,
                    'national', $12, $13)
            """, rows)
    return NationalResult(name, len(rows), len(profiles), unassessed, lo, hi)


async def clear_national(conn, sc: dict, year_start: int, year_end: int) -> None:
    """A refused scope must not keep a stale national map from an earlier run."""
    await conn.execute(
        """DELETE FROM vulnerability_result vr
             USING vulnerability_profile vp
            WHERE vp.id = vr.profile_id AND vr.index_scope = 'national'
              AND vp.sector_id = $1 AND vp.subsector_id IS NOT DISTINCT FROM $2
              AND vp.hazard_type_id = $3
              AND vr.year_start IS NOT DISTINCT FROM $4
              AND vr.year_end IS NOT DISTINCT FROM $5""",
        sc["sector_id"], sc["subsector_id"], sc["hazard_type_id"], year_start, year_end)
