"""Expert and community tracks -- one division at a time.

WHY A SECOND, SMALLER ENGINE. The data track scores a whole province at once:
every variable is min-max scaled across the province's divisions and the
product is rescaled again across them. An external expert (or a community
member) does not supply a province. They pick ONE division on the map, one
sector and one hazard, and give their own figures for that profile's hazard and
exposure variables. The score has to come back at once, for that division.

HOW THE ONE DIVISION IS PLACED ON THE PROVINCE'S SCALE. Normalisation stays
provincial (SRS section 2.2) -- the contributed figure is scaled against the
province's own OFFICIAL range for that variable, widened to include the
contributed figure if it falls outside it:

    lo, hi  = min / max of the data-track values in the province, and the
              track value
    norm    = (value - lo) / (hi - lo)          (inverted where higher is better)
    H, E    = weighted sums, weights from the active profile, /100
    V_raw   = H x E
    V       = V_raw rescaled with the data track's published product bounds for
              the same profile and period (again widened to include V_raw)

So an expert score is directly comparable with the published data-track score
of the same division: same weights, same variable ranges, same product bounds.

WHEN THERE IS NO OFFICIAL BASELINE. A province with no loaded data has no range
to scale against. The range then comes from the track's own contributions
across the province; a variable with a single contribution cannot be scaled
(0.5, the engine's neutral rule) and V is left as the raw product rather than
rescaled against nothing. Both cases are written into `method.baseline` so the
panel can say so -- an unmarked fallback would read as a real provincial score.

SEVERAL CONTRIBUTORS. Each person's figures are kept as their own rows
(`indicator_value_uniq` includes user_id, which is exactly right here). The
track's value for a variable is the MEAN of the contributors' latest figures,
and the result row records how many people it rests on.

DIRECT INDEX ENTRY (2 Oct 2026). A contributor may instead give just a
Hazard index and a Potential Exposure index (0-1), stored in
`track_index_entry`. Each person uses one way per division/scope/period. The
track's H and E are then the mean over ALL contributors: the parameter group
counts as its number of contributors at the H and E computed from their mean
figures, and each index contributor counts once at their own H and E. The raw
product and the rescale are computed exactly as for parameters -- nobody types
them. `method.entry` records 'parameters', 'index' or 'mixed'.

NEVER MIXED WITH THE DATA TRACK. Every query below names its source. The data
engine was also changed to read `source = 'data'` only -- before that, the first
expert entry would have been folded silently into the official score.
"""

from __future__ import annotations

import json
from typing import Optional

from app.engine.vulnerability import check_computable, load_memberships

TRACKS = ("expert", "community")


def _scale(v: float, lo: float, hi: float) -> float:
    if hi == lo:
        return 0.5
    return min(1.0, max(0.0, (v - lo) / (hi - lo)))


async def track_values(conn, profile_id: int, division_id: int, track: str,
                       year_start: int) -> dict[int, dict]:
    """indicator_id -> {mean, n} of the contributors' latest figures."""
    rows = await conn.fetch(
        """
        SELECT indicator_id, avg(raw_value)::float8 AS mean, count(*) AS n
          FROM (
            SELECT DISTINCT ON (iv.indicator_id, iv.user_id)
                   iv.indicator_id, iv.raw_value
              FROM indicator_value iv
              JOIN profile_indicator pi
                ON pi.indicator_id = iv.indicator_id AND pi.profile_id = $1
             WHERE iv.ds_division_id = $2 AND iv.source = $3::source_type
               AND iv.scenario_id IS NULL AND iv.year_start <= $4
             ORDER BY iv.indicator_id, iv.user_id, iv.year_start DESC, iv.id DESC
          ) latest
         GROUP BY indicator_id
        """, profile_id, division_id, track, year_start)
    return {r["indicator_id"]: {"mean": r["mean"], "n": r["n"]} for r in rows}


async def contributors(conn, profile_id: int, division_id: int, track: str,
                       year_start: int) -> int:
    return int(await conn.fetchval(
        """
        SELECT count(DISTINCT iv.user_id)
          FROM indicator_value iv
          JOIN profile_indicator pi
            ON pi.indicator_id = iv.indicator_id AND pi.profile_id = $1
         WHERE iv.ds_division_id = $2 AND iv.source = $3::source_type
           AND iv.year_start <= $4
        """, profile_id, division_id, track, year_start) or 0)


async def _official_range(conn, indicator_id: int, province_id: int,
                          year_start: int) -> Optional[tuple[float, float]]:
    row = await conn.fetchrow(
        """
        SELECT min(raw_value)::float8 AS lo, max(raw_value)::float8 AS hi
          FROM (
            SELECT DISTINCT ON (iv.ds_division_id) iv.raw_value
              FROM indicator_value iv
              JOIN ds_division d ON d.id = iv.ds_division_id
             WHERE iv.indicator_id = $1 AND d.province_id = $2
               AND iv.source = 'data' AND iv.scenario_id IS NULL
               AND iv.year_start <= $3
             ORDER BY iv.ds_division_id, iv.year_start DESC, iv.id DESC
          ) x
        """, indicator_id, province_id, year_start)
    if row is None or row["lo"] is None:
        return None
    return row["lo"], row["hi"]


async def _track_range(conn, indicator_id: int, province_id: int, track: str,
                       year_start: int) -> Optional[tuple[float, float]]:
    row = await conn.fetchrow(
        """
        SELECT min(v)::float8 AS lo, max(v)::float8 AS hi FROM (
            SELECT avg(raw_value) AS v FROM (
                SELECT DISTINCT ON (iv.ds_division_id, iv.user_id)
                       iv.ds_division_id, iv.raw_value
                  FROM indicator_value iv
                  JOIN ds_division d ON d.id = iv.ds_division_id
                 WHERE iv.indicator_id = $1 AND d.province_id = $2
                   AND iv.source = $3::source_type AND iv.year_start <= $4
                 ORDER BY iv.ds_division_id, iv.user_id, iv.year_start DESC, iv.id DESC
            ) l GROUP BY ds_division_id
        ) x
        """, indicator_id, province_id, track, year_start)
    if row is None or row["lo"] is None:
        return None
    return row["lo"], row["hi"]


async def index_entries(conn, prof, division_id: int, track: str,
                        year_start: int) -> list[dict]:
    """Each contributor's latest index entry (H, E) for this profile's scope."""
    rows = await conn.fetch(
        """
        SELECT DISTINCT ON (user_id) user_id, hazard_index, exposure_index
          FROM track_index_entry
         WHERE ds_division_id = $1 AND sector_id = $2
           AND subsector_id IS NOT DISTINCT FROM $3 AND hazard_type_id = $4
           AND source = $5::source_type AND year_start <= $6
         ORDER BY user_id, year_start DESC, id DESC
        """, division_id, prof["sector_id"], prof["subsector_id"],
        prof["hazard_type_id"], track, year_start)
    return [dict(r) for r in rows]


async def compute_track_division(conn, profile_id: int, division_id: int,
                                 track: str, year_start: int, year_end: int) -> dict:
    """Score one division on the expert or community track and store it.

    Returns {'ok': bool, 'reason'?: str, ...}. A division with neither complete
    parameter figures nor an index entry is NOT scored (absent is not zero) and
    any earlier result for it is removed, so the map never shows a stale score."""
    if track not in TRACKS:
        raise ValueError("track must be expert or community")
    prof = await conn.fetchrow(
        """SELECT id, code, province_id, sector_id, subsector_id, hazard_type_id
             FROM vulnerability_profile WHERE id = $1 AND is_active""", profile_id)
    if prof is None:
        return {"ok": False, "reason": "no such active profile"}

    async def _clear():
        await conn.execute(
            """DELETE FROM vulnerability_result
                WHERE ds_division_id = $1 AND profile_id = $2 AND source = $3::source_type
                  AND index_scope = 'provincial'
                  AND year_start IS NOT DISTINCT FROM $4
                  AND year_end IS NOT DISTINCT FROM $5""",
            division_id, profile_id, track, year_start, year_end)

    idx = await index_entries(conn, prof, division_id, track, year_start)

    # ---- the parameter group -------------------------------------------
    members = await load_memberships(conn, profile_id)
    refusal = check_computable(prof["code"], members)
    counted = [m for m in members if m["consensus"] in ("agreed", "contested")]
    vals = await track_values(conn, profile_id, division_id, track, year_start)
    n_param = await contributors(conn, profile_id, division_id, track, year_start)
    missing = [m["code"] for m in counted if m["indicator_id"] not in vals]

    param_ok = bool(vals) and not refusal and not missing
    if not param_ok and not idx:
        await _clear()
        if refusal and vals:
            return {"ok": False, "reason": str(refusal)}
        return {"ok": False, "reason": "a value is still needed for every weighted "
                "variable", "missing": sorted(missing)}

    bounds: dict[str, list[float]] = {}
    official_vars = 0
    sector_absent = False
    h_p = e_p = 0.0
    if param_ok:
        for m in counted:
            v = vals[m["indicator_id"]]["mean"]
            rng = await _official_range(conn, m["indicator_id"], prof["province_id"], year_start)
            if rng is not None:
                official_vars += 1
            else:
                rng = await _track_range(conn, m["indicator_id"], prof["province_id"],
                                         track, year_start) or (v, v)
            lo, hi = min(rng[0], v), max(rng[1], v)
            bounds[m["code"]] = [lo, hi]
            n = _scale(v, lo, hi)
            if m["relationship"] == "higher_is_better":
                n = 1.0 - n
            if m["domain"] == "hazard":
                h_p += m["weight_pct"] * n / 100.0
            else:
                e_p += m["weight_pct"] * n / 100.0
        h_p, e_p = min(1.0, max(0.0, h_p)), min(1.0, max(0.0, e_p))
        # Same rule as the data engine: the sector is absent only when EVERY
        # exposure figure the contributors gave is exactly zero.
        exposure_members = [m for m in counted if m["domain"] == "exposure"]
        sector_absent = bool(exposure_members) and not idx and all(
            vals[m["indicator_id"]]["mean"] == 0.0 for m in exposure_members)
    else:
        n_param = 0

    # ---- combine: every contributor counts once --------------------------
    n_idx = len(idx)
    total = n_param + n_idx
    h = (n_param * h_p + sum(r["hazard_index"] for r in idx)) / total
    e = (n_param * e_p + sum(r["exposure_index"] for r in idx)) / total
    h, e = min(1.0, max(0.0, h)), min(1.0, max(0.0, e))
    p = h * e
    entry = "mixed" if n_param and n_idx else ("index" if n_idx else "parameters")

    base = await conn.fetchrow(
        """SELECT min(bound_min) AS lo, max(bound_max) AS hi
             FROM vulnerability_result
            WHERE profile_id = $1 AND source = 'data' AND index_scope = 'provincial'
              AND year_start = $2 AND year_end = $3""",
        profile_id, year_start, year_end)
    if base is not None and base["lo"] is not None:
        plo, phi = min(base["lo"], p), max(base["hi"], p)
        v_index = _scale(p, plo, phi)
        if entry == "index":
            baseline = "official"
        else:
            baseline = "official" if official_vars == len(counted) else "partial"
    else:
        plo = phi = None
        v_index = p
        baseline = "none"

    method = {
        "model": "one division on the %s track, scaled against the province's "
                 "official ranges and product bounds" % track,
        "scope": "provincial",
        "track": track,
        "period": "%d-%d" % (year_start, year_end),
        "entry": entry,
        "variables": len(counted) if param_ok else 0,
        "variable_bounds": bounds,
        "baseline": baseline,
        "official_variables": official_vars,
        "contributors": total,
        "parameter_contributors": n_param,
        "index_contributors": n_idx,
        "sector_absent": sector_absent,
    }
    if missing and idx and vals:
        method["note"] = ("parameter figures are incomplete for the current profile, "
                          "so only the index entries were used")
    await _clear()
    await conn.execute(
        """
        INSERT INTO vulnerability_result
            (ds_division_id, profile_id, hazard_type_id, sector_id, subsector_id,
             source, year_start, year_end, exposure_index, hazard_index,
             vulnerability_index, method, index_scope, bound_min, bound_max)
        VALUES ($1, $2, $3, $4, $5, $6::source_type, $7, $8, $9, $10, $11,
                $12::jsonb, 'provincial', $13, $14)
        """, division_id, profile_id, prof["hazard_type_id"], prof["sector_id"],
        prof["subsector_id"], track, year_start, year_end, e, h, v_index,
        json.dumps(method), plo, phi)
    return {"ok": True, "hazardIndex": h, "exposureIndex": e, "rawIndex": p,
            "vulnerabilityIndex": v_index, "baseline": baseline,
            "contributors": total, "entry": entry}


async def recompute_track_province(conn, profile_id: int, province_id: int,
                                   year_start: int, year_end: int) -> int:
    """Re-score every division that has contributions on either track -- used
    after the official data are recomputed, because the ranges an expert score
    is scaled against have just moved."""
    n = 0
    for track in TRACKS:
        divs = await conn.fetch(
            """SELECT DISTINCT iv.ds_division_id
                 FROM indicator_value iv
                 JOIN ds_division d ON d.id = iv.ds_division_id
                 JOIN profile_indicator pi ON pi.indicator_id = iv.indicator_id
                                          AND pi.profile_id = $1
                WHERE d.province_id = $2 AND iv.source = $3::source_type""",
            profile_id, province_id, track)
        # ... and divisions assessed by index only.
        divs = list(divs) + list(await conn.fetch(
            """SELECT DISTINCT t.ds_division_id
                 FROM track_index_entry t
                 JOIN ds_division d ON d.id = t.ds_division_id
                 JOIN vulnerability_profile vp ON vp.id = $1
                WHERE d.province_id = $2 AND t.source = $3::source_type
                  AND t.sector_id = vp.sector_id AND t.hazard_type_id = vp.hazard_type_id
                  AND t.subsector_id IS NOT DISTINCT FROM vp.subsector_id""",
            profile_id, province_id, track))
        seen_divs: set[int] = set()
        for d in divs:
            if d["ds_division_id"] in seen_divs:
                continue
            seen_divs.add(d["ds_division_id"])
            r = await compute_track_division(conn, profile_id, d["ds_division_id"],
                                             track, year_start, year_end)
            n += 1 if r.get("ok") else 0
    return n
