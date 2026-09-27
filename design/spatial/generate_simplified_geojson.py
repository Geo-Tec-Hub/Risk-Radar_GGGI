#!/usr/bin/env python3
"""
Generate the DS-division GeoJSON the map serves as a static asset.

Stopgap for FR-5.2 (no /tiles endpoint yet, PROGRESS_TRACKER.md 2026-08-08):
the browser map does not read ds_division.geom from Postgres at all -- it
fetches this file directly (BoundaryService), so a Postgres/shapefile update
is invisible on the map until this script is re-run and its output redeployed.
Replace at Stage 5.2.

**Topology-preserving simplification (2026-09-20).**

The history matters, because two earlier versions of this file were both wrong
in opposite directions:

  * Until 2026-09-18, shapely's SimplifyPreserveTopology was run PER FEATURE.
    "Preserve topology" there means preserve *that one polygon's* topology --
    it knows nothing about the neighbour sharing the border, so each side of a
    shared edge was thinned independently and the two no longer coincided.
    That is what opened the visible white cracks between divisions
    (measured: 0.53% of total area lost to gaps).

  * On 2026-09-18 simplification was removed altogether to close those cracks.
    It worked -- but the output went from 278 KB to 28 MB, which the browser
    downloads on every cache miss before the map draws anything.

The fix is to simplify the SHARED ARCS ONCE rather than each polygon
separately. mapshaper builds a topology from the shapefile, so a border
between two divisions is a single arc belonging to both; simplifying it moves
both sides by exactly the same amount and the two stay welded together.

Measured on the 2026-09-17 DS_Boundary.shp (340 divisions):

    raw shapefile          21.9 MB shp    gap area 0.00187% of total
    per-feature simplify      278 KB      gap area 0.53000%   <- the cracks
    no simplification        28.0 MB      gap area 0.00187%
    mapshaper 5% (this)      1.78 MB      gap area 0.00183%   <- 602 KB gzipped

i.e. topology-aware simplification adds NO gaps beyond what the source
shapefile already has, at 1/16th the size. (The residual 0.0018% is in the
source data itself -- 756 hairline seams under 100 m2 each, plus one genuine
~2,600 ha water body in the Batticaloa/Polonnaruwa area.)

Coordinate rounding to 6 dp (~0.11 m here) is applied after simplification and
cannot desync a shared vertex: both sides of a border round the same input
value to the same output value.

Requires mapshaper (Node):   npm install -g mapshaper
If it is missing this script stops rather than silently falling back to a
per-feature simplify, which is the bug this file exists to prevent.

Reads:  DS_Boundary.shp (this directory) + dsd_register.csv (names, joined on
        New_DS_Cod = ds_code -- never on name, same rule as load_spatial.sh)
Writes: ds_divisions.simplified.geojson (this directory) -- then copy to
        frontend-angular/public/data/, the path the app actually serves from.

Usage:  python generate_simplified_geojson.py [--percent 5]
"""
import argparse
import csv
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SHP = os.path.join(HERE, "DS_Boundary.shp")
REG = os.path.join(HERE, "..", "ingestion", "dsd_register.csv")
OUT = os.path.join(HERE, "ds_divisions.simplified.geojson")

DP = 6  # decimal places (~0.11 m at Sri Lanka's latitude)


def round_coords(coords):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], DP), round(coords[1], DP)]
    return [round_coords(c) for c in coords]


def simplify_with_mapshaper(shp, percent, workdir):
    """Topology-aware simplify. Returns the path to an intermediate GeoJSON."""
    exe = shutil.which("mapshaper")
    if exe is None:
        sys.exit(
            "mapshaper not found. Install it with:  npm install -g mapshaper\n"
            "Do NOT substitute a per-feature simplify -- that is what put the "
            "gaps between divisions in the first place (see this file's docstring)."
        )
    tmp = os.path.join(workdir, "simplified.geojson")
    subprocess.run(
        [
            exe, shp,
            # keep-shapes: never let a small division collapse to nothing
            "-simplify", f"{percent}%", "keep-shapes",
            "-o", tmp, "format=geojson", "precision=0.000001",
        ],
        check=True,
    )
    return tmp


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--percent", type=float, default=5,
        help="share of vertices mapshaper keeps (default 5; lower = smaller file). "
             "2%% is still visually faithful at island scale; 10%% is the "
             "conservative choice if a division looks angular when zoomed in.",
    )
    args = ap.parse_args()

    register = {}
    with open(REG) as f:
        for row in csv.DictReader(f):
            register[row["ds_code"]] = row

    with tempfile.TemporaryDirectory() as workdir:
        simplified = simplify_with_mapshaper(SHP, args.percent, workdir)
        with open(simplified) as f:
            src = json.load(f)

    features = []
    missing_register = []

    for feat in src["features"]:
        code = (feat.get("properties") or {}).get("New_DS_Cod")
        r = register.get(code)
        if r is None:
            missing_register.append(code)
            continue
        geom = feat.get("geometry")
        if not geom or not geom.get("coordinates"):
            missing_register.append(f"{code} (empty source geometry)")
            continue

        gj = dict(geom)
        gj["coordinates"] = round_coords(gj["coordinates"])

        features.append(
            {
                "type": "Feature",
                "properties": {
                    "ds_code": r["ds_code"],
                    "ds_division": r["ds_division"],
                    "district": r["district"],
                    "province": r["province"],
                },
                "geometry": gj,
            }
        )

    fc = {"type": "FeatureCollection", "features": features}
    with open(OUT, "w") as f:
        json.dump(fc, f, separators=(",", ":"))

    print(f"features written: {len(features)}  (expected 340)")
    print(f"skipped (should be empty): {missing_register}")
    print(f"output size MB: {round(os.path.getsize(OUT) / 1048576, 2)}")
    print()
    print("Now copy it to where the app serves it from:")
    print("  cp ds_divisions.simplified.geojson "
          "../../frontend-angular/public/data/ds_divisions.simplified.geojson")


if __name__ == "__main__":
    main()
