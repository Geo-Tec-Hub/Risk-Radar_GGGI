#!/usr/bin/env python3
"""
Generate the DS-division GeoJSON the map serves as a static asset.

Stopgap for FR-5.2 (no /tiles endpoint yet, PROGRESS_TRACKER.md 2026-08-08):
the browser map does not read ds_division.geom from Postgres at all -- it
fetches this file directly (BoundaryService), so a Postgres/shapefile update
is invisible on the map until this script is re-run and its output redeployed.
Replace at Stage 5.2.

Previously a one-off pyshp+shapely script whose source was never checked in
-- this is that script, written to the repo so "how was this built" has an
answer next time (Working rule 1: generated files are generated).

**No geometry simplification (2026-09-18).** SimplifyPreserveTopology run
per-feature moves each polygon's shared border independently, so neighbouring
divisions' edges no longer coincide -- it was reintroducing exactly the gaps
the 2026-09-17 gap-free DS_Boundary.shp was supplied to remove (measured:
0.004% area discrepancy in the raw shapefile vs. 0.53% -- over 100x worse --
in the previously-simplified output). The client requirement is no visible
gaps, so geometry is exported at full source resolution; only coordinate
rounding is applied, which cannot desync a shared vertex since both sides of
a border round the same input value to the same output value.

Reads:  DS_Boundary.shp (this directory) + dsd_register.csv (names, joined on
        New_DS_Cod = ds_code -- never on name, same rule as load_spatial.ps1)
Writes: ds_divisions.simplified.geojson (this directory) -- also copy to
        frontend-angular/public/data/ds_divisions.simplified.geojson, the
        path the app actually serves from. (Filename kept as ".simplified"
        so BoundaryService's fetch path doesn't need to change; content is
        no longer simplified.)

Usage:  python generate_simplified_geojson.py
"""
import csv
import json
import os

from osgeo import ogr

ogr.UseExceptions()

HERE = os.path.dirname(os.path.abspath(__file__))
SHP = os.path.join(HERE, "DS_Boundary.shp")
REG = os.path.join(HERE, "..", "ingestion", "dsd_register.csv")
OUT = os.path.join(HERE, "ds_divisions.simplified.geojson")

DP = 6  # decimal places (~0.11m at Sri Lanka's latitude) -- generous since
        # nothing is being simplified away anymore


def round_coords(coords):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], DP), round(coords[1], DP)]
    return [round_coords(c) for c in coords]


def main():
    register = {}
    with open(REG) as f:
        for row in csv.DictReader(f):
            register[row["ds_code"]] = row

    ds = ogr.Open(SHP)
    layer = ds.GetLayer()

    features = []
    missing_register = []
    repaired = 0

    for feat in layer:
        code = feat.GetField("New_DS_Cod")
        r = register.get(code)
        if r is None:
            missing_register.append(code)
            continue

        geom = feat.GetGeometryRef()
        if geom is None or geom.IsEmpty():
            missing_register.append(f"{code} (empty source geometry)")
            continue

        gj = json.loads(geom.ExportToJson())
        gj["coordinates"] = round_coords(gj["coordinates"])

        # Rounding can, in rare cases, collapse a ring below the minimum
        # point count on tiny slivers/islands, leaving an invalid geometry.
        # Repair rather than ship a polygon OpenLayers may refuse to draw.
        rounded_geom = ogr.CreateGeometryFromJson(json.dumps(gj))
        if rounded_geom is None or not rounded_geom.IsValid():
            fixed = rounded_geom.MakeValid() if rounded_geom is not None else None
            if fixed is None or fixed.IsEmpty():
                missing_register.append(f"{code} (invalid after round, unrepairable)")
                continue
            repaired += 1
            gj = json.loads(fixed.ExportToJson())

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

    print(f"features written: {len(features)}")
    print(f"skipped (should be empty): {missing_register}")
    print(f"repaired via MakeValid: {repaired}")
    print(f"output size KB: {round(os.path.getsize(OUT) / 1024, 1)}")


if __name__ == "__main__":
    main()
