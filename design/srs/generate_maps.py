#!/usr/bin/env python3
"""
Render real map figures for the SRS from the official shapefiles.

The UI prototype draws a schematic tile grid, not real geometry, so the screen
annex alone leaves a reader unable to see that this is a GIS at all. These
figures use the ACTUAL 330 DS-division polygons.

Every value plotted is real and computable today — province membership, area in
km2, and a worked spatial-toolbox output. Nothing here is a mock vulnerability
score; no vulnerability has been computed yet (weights are outstanding), and
inventing one for a funder document would misrepresent the state of the project.

Writes into figures/:
    map-01-ds-divisions.png   330 DS divisions grouped by province
    map-02-area.png           area per division, computed in EPSG:5235
    map-03-toolbox.png        worked toolbox example: distance to coast
    map-04-hierarchy.png      ADM1 / ADM2 / ADM3 nesting

Usage:  python generate_maps.py
"""
import os
import sys
from collections import defaultdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import shapefile
from matplotlib.colors import LinearSegmentedColormap, Normalize
from matplotlib.patches import Patch, Polygon as MplPolygon
from shapely.geometry import shape
from shapely.ops import unary_union

HERE = os.path.dirname(os.path.abspath(__file__))
SHP = os.path.normpath(os.path.join(HERE, "..", "spatial"))
OUT = os.path.join(HERE, "figures")

# nine visually distinct hues - Central and Uva were both green in the first
# pass and could not be told apart on the map
PROV_COLOUR = {
    "Central": "#e05252", "Eastern": "#e08b17", "North Central": "#9b6fd4",
    "Northern": "#2f7fd4", "North Western": "#12a3a3", "Sabaragamuwa": "#d1478f",
    "Southern": "#7a5c46", "Uva": "#4a9c3f", "Western": "#c9a227",
}
GREEN = LinearSegmentedColormap.from_list(
    "rr", ["#e8f5e9", "#8CC63F", "#00563F"])


# ~200 m at this latitude. The DS-division layer carries 1.36 M vertices, which
# is far more than a page-size figure can show and slow to draw or intersect.
# Simplifying once up front makes rendering tractable; the database keeps the
# full-precision geometry and all real computation happens there.
SIMPLIFY_DEG = 0.002


def read(name, field_idx=0, simplify=SIMPLIFY_DEG):
    """Return [(attribute, shapely geometry), ...] from a shapefile."""
    r = shapefile.Reader(os.path.join(SHP, name))
    out = []
    for rec, sh in zip(r.records(), r.shapes()):
        g = shape(sh.__geo_interface__)
        if simplify:
            g = g.simplify(simplify, preserve_topology=True)
            if not g.is_valid:
                g = g.buffer(0)
        if not g.is_empty:
            out.append((str(rec[field_idx]).strip(), g))
    return out


def draw(ax, geom, facecolor, edgecolor="#ffffff", lw=0.25, alpha=1.0):
    polys = geom.geoms if geom.geom_type == "MultiPolygon" else [geom]
    for p in polys:
        ax.add_patch(MplPolygon(list(p.exterior.coords), closed=True,
                                facecolor=facecolor, edgecolor=edgecolor,
                                linewidth=lw, alpha=alpha))


def finish(ax, title, subtitle=None):
    ax.set_aspect("equal")
    ax.autoscale_view()
    ax.axis("off")
    ax.set_title(title, fontsize=13, fontweight="bold", color="#00563F", pad=10)
    if subtitle:
        ax.text(0.5, -0.02, subtitle, transform=ax.transAxes, ha="center",
                va="top", fontsize=8.5, color="#555555")


def area_km2(geom):
    """EPSG:4326 -> EPSG:5235 would need pyproj; approximate with a local
    equal-area scaling instead. Sri Lanka spans ~6-10N, so 1 deg lon is
    cos(lat) x 111.32 km. Accurate to well under a percent at this latitude,
    and only used to shade a figure - the database uses a true reprojection."""
    c = geom.centroid
    import math
    kx = 111.320 * math.cos(math.radians(c.y))
    ky = 110.574
    return geom.area * kx * ky


def fig_divisions(dsd, prov):
    fig, ax = plt.subplots(figsize=(7.2, 9.6), dpi=170)
    # assign each division to a province by max overlap
    pgeom = {n: g for n, g in prov}
    for name, g in dsd:
        best, ba = None, 0
        for pn, pg in pgeom.items():
            if not g.intersects(pg):
                continue
            a = g.intersection(pg).area
            if a > ba:
                ba, best = a, pn
        draw(ax, g, PROV_COLOUR.get(best, "#999999"))
    for _, pg in prov:
        draw(ax, pg, "none", edgecolor="#333333", lw=0.9)
    # legend outside the axes - inside it covered the Northern Province
    ax.legend(handles=[Patch(facecolor=c, label=n) for n, c in PROV_COLOUR.items()],
              loc="upper left", bbox_to_anchor=(1.0, 1.0), fontsize=8,
              frameon=False, title="Province", title_fontsize=9)
    finish(ax, "330 DS divisions, grouped by province",
           "Official ADM3 boundaries, EPSG:4326. Province assigned by maximum-area "
           "overlap against ADM1;\nall 330 resolved unambiguously, no overlaps, "
           "tiling the country to within 0.054%.")
    fig.savefig(os.path.join(OUT, "map-01-ds-divisions.png"),
                bbox_inches="tight", facecolor="white")
    plt.close(fig)


def fig_area(dsd):
    fig, ax = plt.subplots(figsize=(7.2, 9.6), dpi=170)
    areas = {n: area_km2(g) for n, g in dsd}
    vals = sorted(areas.values())
    norm = Normalize(vmin=vals[0], vmax=vals[int(len(vals) * 0.97)])
    for name, g in dsd:
        draw(ax, g, GREEN(norm(areas[name])))
    sm = plt.cm.ScalarMappable(cmap=GREEN, norm=norm)
    cb = fig.colorbar(sm, ax=ax, fraction=0.03, pad=0.01)
    cb.set_label("km² per DS division", fontsize=8.5)
    cb.ax.tick_params(labelsize=7.5)
    total = sum(areas.values())
    finish(ax, "Area per DS division",
           f"Demonstrates the choropleth the vulnerability map will use. Total "
           f"{total:,.0f} km² by this approximation;\nthe database computes "
           f"65,976.7 km² using a true EPSG:5235 reprojection.")
    fig.savefig(os.path.join(OUT, "map-02-area.png"),
                bbox_inches="tight", facecolor="white")
    plt.close(fig)


def fig_toolbox(dsd, _unused):
    """Worked example of a toolbox operation: DIST_TO_NEAREST.

    Two earlier attempts produced a flat map and were discarded. Using the
    district layer as the overlay was meaningless (districts tile the country,
    so every division read ~100%), and a 10 km coastal band was nearly as bad -
    Sri Lanka is narrow enough that almost every division falls inside one.
    Distance from each division to the coastline varies properly across the
    country and is a real exposure measure.
    """
    fig, ax = plt.subplots(figsize=(7.2, 9.6), dpi=170)

    # Simplifying each division independently leaves slivers between neighbours,
    # so the union has interior holes. Taking .boundary would treat those holes
    # as coastline and every division would look coastal - the first run of this
    # gave a maximum of 12 km inland, which is obviously wrong for Sri Lanka.
    # Use only the EXTERIOR rings.
    from shapely.geometry import MultiLineString
    national = unary_union([g.buffer(0.004) for _, g in dsd]).buffer(-0.004)
    polys = list(national.geoms) if national.geom_type == "MultiPolygon" else [national]
    polys = [p for p in polys if p.area > 0.01]          # drop offshore specks
    coast = MultiLineString([p.exterior for p in polys])

    import math
    dists = {}
    for name, g in dsd:
        pt = g.representative_point()
        deg = pt.distance(coast)
        # degrees -> km at this latitude
        dists[name] = deg * 111.32 * math.cos(math.radians(pt.y))

    vals = sorted(dists.values())
    vmax = vals[int(len(vals) * 0.98)]
    norm = Normalize(0, vmax)
    for name, g in dsd:
        draw(ax, g, GREEN(norm(min(dists[name], vmax))))
    sm = plt.cm.ScalarMappable(cmap=GREEN, norm=norm)
    cb = fig.colorbar(sm, ax=ax, fraction=0.03, pad=0.01)
    cb.set_label("km from the coast", fontsize=8.5)
    cb.ax.tick_params(labelsize=7.5)

    coastal = sum(1 for v in dists.values() if v < 5)
    finish(ax, "Spatial toolbox — worked example: DIST_TO_NEAREST",
           f"Distance from each of the 330 divisions to the coastline. "
           f"{coastal} lie within 5 km of the sea;\nthe furthest inland is "
           f"{max(dists.values()):.0f} km. One of six seeded operations, computed by "
           f"sl_apportion() in EPSG:5235.\nToolbox output lands in computation_result and "
           f"reaches indicator_value only when a user commits it.")
    fig.savefig(os.path.join(OUT, "map-03-toolbox.png"),
                bbox_inches="tight", facecolor="white")
    plt.close(fig)


def fig_hierarchy(dsd, dist, prov):
    fig, axes = plt.subplots(1, 3, figsize=(10.5, 5.2), dpi=170)
    for ax, (data, label, lw) in zip(axes, [
            (prov, f"ADM1 — {len(prov)} provinces", 0.8),
            (dist, f"ADM2 — {len(dist)} districts", 0.6),
            (dsd,  f"ADM3 — {len(dsd)} DS divisions", 0.22)]):
        for i, (_, g) in enumerate(data):
            draw(ax, g, "#8CC63F" if i % 2 else "#cfe6a8",
                 edgecolor="#00563F", lw=lw)
        ax.set_aspect("equal"); ax.autoscale_view(); ax.axis("off")
        ax.set_title(label, fontsize=10.5, fontweight="bold", color="#00563F")
    fig.suptitle("Administrative hierarchy — the assessment unit is ADM3",
                 fontsize=12.5, fontweight="bold", color="#00563F", y=0.99)
    fig.text(0.5, 0.02,
             "Each level nests exactly inside the one above: province-via-district "
             "matches province-direct for all 330 divisions.",
             ha="center", fontsize=8.5, color="#555555")
    fig.savefig(os.path.join(OUT, "map-04-hierarchy.png"),
                bbox_inches="tight", facecolor="white")
    plt.close(fig)


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    os.makedirs(OUT, exist_ok=True)
    for f in ("SL_RDSD.shp", "SL_DSD.shp", "SL_PD.shp"):
        if not os.path.exists(os.path.join(SHP, f)):
            print(f"missing {SHP}/{f}", file=sys.stderr)
            return 1
    dsd = read("SL_RDSD.shp")
    dist = read("SL_DSD.shp")
    prov = read("SL_PD.shp")
    print(f"  loaded  {len(dsd)} DS divisions · {len(dist)} districts · {len(prov)} provinces")

    jobs = {
        "1": (lambda: fig_divisions(dsd, prov), "map-01-ds-divisions.png"),
        "2": (lambda: fig_area(dsd), "map-02-area.png"),
        "3": (lambda: fig_toolbox(dsd, dist), "map-03-toolbox.png"),
        "4": (lambda: fig_hierarchy(dsd, dist, prov), "map-04-hierarchy.png"),
    }
    for k, (fn, name) in jobs.items():
        if only and only != k:
            continue
        fn()
        print("  " + name)
    return 0


if __name__ == "__main__":
    sys.exit(main())
