"""The national index -- FROM THE FINAL OUTPUT since client NOTED-19 (Nov 2026).

See compute_national() for the method. The earlier variable-level national
scaling (NOTED-14) is replaced, because most expert assessments carry H and E
rather than raw figures. What follows is the original NOTED-14 note, kept for
history.

The national index (SRS v2.3 section 2.2, FR-4.3b, FR-4.3c) -- client request
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

from app.engine.vulnerability import _rescale, product_bounds


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
    """National index from the FINAL output (client NOTED-19, item 5).

    For each province with a profile for the scope, the FINAL provincial map is
    used -- the expert track where it has scores, otherwise the official track
    (the same rule as the map and the exports). Each division's H and E are
    taken from it as they are, and H x E is min-max rescaled across every scored
    division in the country. Variables are NOT re-scaled nationally: experts
    largely entered H and E directly, so there are no figures to rescale; H and
    E therefore stay as each province scaled them, and only the final product
    is put on one national scale. method.track_by_province records the source.
    """
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

    rows: list[tuple] = []          # (profile, division id, h, e, product, absent)
    used: dict[str, str] = {}
    missing: list[str] = []
    for p in profiles:
        got = None
        for track in ("expert", "data"):
            got = await conn.fetch(
                """SELECT ds_division_id, hazard_index, exposure_index, method
                     FROM vulnerability_result
                    WHERE profile_id = $1 AND source = $2::source_type
                      AND index_scope = 'provincial'
                      AND year_start = $3 AND year_end = $4""",
                p["id"], track, year_start, year_end)
            if got:
                used[p["province"]] = "Expert" if track == "expert" else "Official"
                break
        if not got:
            missing.append(p["province"])
            continue
        for r in got:
            m = r["method"]
            m = json.loads(m) if isinstance(m, str) else (m or {})
            h, e = float(r["hazard_index"]), float(r["exposure_index"])
            rows.append((p, r["ds_division_id"], h, e, h * e, bool(m.get("sector_absent"))))
    if missing:
        return NationalRefusal(name, "no final (expert or official) map yet for", missing)

    keys = list(range(len(rows)))
    lo, hi = product_bounds({k: rows[k][4] for k in keys}, {k: rows[k][5] for k in keys})
    method_base = {
        "model": "final provincial H and E (expert where available, else official); "
                 "H x E min-max rescaled across every scored division nationally",
        "scope": "national",
        "period": "%d-%d" % (year_start, year_end),
        "track_by_province": used,
    }
    out = [(d, p["id"], p["hazard_type_id"], p["sector_id"], p["subsector_id"],
            year_start, year_end, e, h, min(1.0, max(0.0, _rescale(prod, lo, hi))),
            json.dumps({**method_base, "sector_absent": absent}), lo, hi)
           for (p, d, h, e, prod, absent) in rows]
    async with conn.transaction():
        await conn.execute(
            """DELETE FROM vulnerability_result
                WHERE profile_id = ANY($1::bigint[]) AND index_scope = 'national'
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
            """, out)
    return NationalResult(name, len(out), len(profiles), 0, lo, hi)


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
