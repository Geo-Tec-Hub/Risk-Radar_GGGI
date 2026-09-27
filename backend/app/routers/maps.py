"""
Map export -- PDF (owner request, 27 Sep 2026).

    GET /api/maps/pdf?province=CEN&period=2021-2025&track=data
                     &layers=vulnerability,hazard,exposure
                     [&sector=LIVESTOCK&subsector=POULTRY_FARMING&hazard=flood]

With sector + hazard: the maps of THAT profile (one page per layer asked for) --
the map page's "Export this map". Without: every active profile of the province
that has scores for the period, one page per profile x layer, behind a cover
page with contents -- "Export all maps". Profiles with no scores for the period
are listed on the cover as not included rather than printed as empty maps.

Public, like the map itself: it prints nothing the map does not already show.
The division states come from the SAME function the map calls
(routers/vulnerability.results), so a printed page and the screen cannot
disagree about which divisions are scored, pending or set aside.
"""

from __future__ import annotations

from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.deps import db
from app.maps.layers import LAYERS, TITLES, layer_value
from app.routers.vulnerability import results as vulnerability_results

router = APIRouter(prefix="/maps", tags=["maps"])


def _label(sector: str, subsector: Optional[str]) -> str:
    return sector + (" / " + subsector if subsector else "")


@router.get("/pdf")
async def maps_pdf(
    province: str = Query(..., description="province code, e.g. CEN"),
    period: str = Query(..., pattern=r"^\d{4}-\d{4}$"),
    track: str = Query("data", pattern="^(data|expert|community)$"),
    layers: str = Query("vulnerability,hazard,exposure"),
    sector: Optional[str] = None,
    subsector: Optional[str] = None,
    hazard: Optional[str] = None,
    pool: asyncpg.Pool = Depends(db),
) -> Response:
    try:
        # Imported here, not at module level: reportlab is a new dependency, and
        # an API started without it must still serve everything else.
        from app.maps.pdf import PageSpec, load_divisions, render, TRACK_LABEL
    except ImportError:
        raise HTTPException(503, "PDF export needs the reportlab package on the "
                                 "server: pip install -r requirements.txt") from None
    wanted = [x.strip().lower() for x in layers.split(",") if x.strip()]
    bad = [x for x in wanted if x not in LAYERS]
    if bad or not wanted:
        raise HTTPException(400, "layers must be a comma list of: %s" % ", ".join(LAYERS))
    single = bool(sector and hazard)

    async with pool.acquire() as conn:
        prov = await conn.fetchrow("SELECT id, code, name FROM province WHERE code = $1",
                                   province.upper())
        if prov is None:
            raise HTTPException(404, "no province with code %r" % province)
        profiles = await conn.fetch(
            """
            SELECT vp.id, vp.code, vp.version, s.code AS sector_code, s.name AS sector,
                   ss.code AS subsector_code, ss.name AS subsector,
                   h.code AS hazard_code, h.name AS hazard
              FROM vulnerability_profile vp
              JOIN sector s ON s.id = vp.sector_id
              LEFT JOIN subsector ss ON ss.id = vp.subsector_id
              JOIN hazard_type h ON h.id = vp.hazard_type_id
             WHERE vp.is_active AND vp.province_id = $1
               AND ($2::text IS NULL OR s.code = $2)
               AND ($2::text IS NULL OR COALESCE(ss.code, '-') = COALESCE($3, '-'))
               AND ($4::text IS NULL OR h.code = $4)
             ORDER BY s.name, ss.name NULLS FIRST, h.name
            """, prov["id"], sector.upper() if single else None,
            subsector.upper() if single and subsector else None,
            hazard.lower() if single else None)
        if not profiles:
            raise HTTPException(404, "no active profile for that selection")
        divisions = await load_divisions(conn, prov["id"])

    pages: list[PageSpec] = []
    contents: list[tuple[str, int]] = []
    excluded: list[str] = []
    next_page = 2
    for p in profiles:
        units = await vulnerability_results(
            province=prov["code"], sector=p["sector_code"], hazard=p["hazard_code"],
            period=period, subsector=p["subsector_code"], indexScope="provincial",
            track=track, pool=pool)
        if not single and not any(u.state in ("assessed", "not_applicable") for u in units):
            excluded.append(p["code"])
            continue
        what = _label(p["sector"], p["subsector"])
        # One contents line per PROFILE, naming the page of each layer -- one
        # line per page ran 99 lines for Central and overflowed the cover.
        contents.append(("%s - %s" % (what, p["hazard"]),
                         "  ".join("%s %d" % (TITLES[l][0], next_page + i)
                                   for i, l in enumerate(wanted))))
        for layer in wanted:
            spec = PageSpec(
                layer=layer,
                title="%s - %s - %s" % (TITLES[layer], what, p["hazard"]),
                subtitle="%s Province  |  %s  |  %s track"
                         % (prov["name"], period, TRACK_LABEL.get(track, track)),
                profile_line="Profile %s (version %d)  |  %s index of each DS division"
                             % (p["code"], p["version"], TITLES[layer].lower()),
                province=prov["name"])
            for u in units:
                spec.states[u.dsCode] = layer_value(u.state, u.value, u.hazardIndex,
                                                    u.exposureIndex, layer)
            pages.append(spec)
            next_page += 1

    if not pages:
        raise HTTPException(404, "no profile of %s has scores for %s yet - recompute "
                                 "the province first" % (prov["name"], period))

    cover = None
    if not single:
        cover = dict(
            title="Risk Radar map atlas - %s Province" % prov["name"],
            lines=["Period %s  |  %s track  |  layers: %s"
                   % (period, TRACK_LABEL.get(track, track),
                      ", ".join(TITLES[x] for x in wanted)),
                   "%d profile(s), %d map page(s). Each page is one sector profile "
                   "and one layer." % (len(pages) // len(wanted), len(pages)),
                   "Scores are provincial indexes: relative to %s Province, not "
                   "comparable across provinces." % prov["name"],
                   "Contents give the page of each layer: V = vulnerability, "
                   "H = hazard, E = exposure."],
            contents=contents, excluded=excluded)
    body = render(pages, divisions, cover=cover)

    if single:
        p = profiles[0]
        name = "RiskRadar_%s_%s_%s.pdf" % (p["code"], "-".join(wanted), period)
    else:
        name = "RiskRadar_%s_all-maps_%s_%s.pdf" % (prov["name"].replace(" ", ""), track, period)
    return Response(content=body, media_type="application/pdf",
                    headers={"Content-Disposition": 'attachment; filename="%s"' % name})
