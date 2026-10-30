"""The three map layers of one sector profile (owner request, 27 Sep 2026).

Every stored result row already carries the three numbers a profile produces
for a division -- `hazard_index`, `exposure_index` and the published
`vulnerability_index` -- so a hazard or exposure map is a different COLUMN of
the same row, not a new computation. They are per-sector: the climate figures
are shared, but each profile chooses its own hazard variables and weights, and
exposure is the sector's own. The layer therefore always follows the selected
sector / subsector / hazard, exactly like the vulnerability map.

THE RULES PER LAYER (kept identical to frontend core/models/map-layer.model.ts)

    vulnerability  the map as it has always been
    hazard         a division with a result shows its hazard index -- INCLUDING
                   one where the sector is not present, because the hazard there
                   is real even when nothing is exposed to it
    exposure       a division with a result shows its exposure index; where the
                   sector is not present it stays "sector not present", never a
                   low score

Unscored divisions (pending / unassessed) keep their state on every layer.

WHAT THE NUMBERS ARE. Hazard and exposure are the weighted sums of the
province-normalised variables, already on [0, 1]. They are NOT rescaled a
second time the way vulnerability is, so the same fixed quarters (0.25 / 0.5 /
0.75) apply without re-cutting anything, and a legend says so.

COLOURS. Vulnerability keeps its validated red ramp (band.model.ts). Hazard and
exposure get their own single-hue ramps -- orange and blue -- built at the SAME
four OKLab lightness steps as the red one (0.72 / 0.645 / 0.57 / 0.42, hue
spread < 1 degree), so severity still reads by lightness and in greyscale, and
a printed hazard page can never be mistaken for a vulnerability page.
"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Optional

LAYERS = ("vulnerability", "hazard", "exposure")

RAMPS = {
    "vulnerability": ("#ffffb0", "#f7c348", "#c46d1b", "#6b0601"),
    "hazard":        ("#ffebcc", "#ffc187", "#fc9d49", "#f07605"),  # client colours, NOTED-10
    "exposure":      ("#ffffb0", "#f7c348", "#c46d1b", "#6b0601"),
}
BAND_LABELS = ("Very low", "Low", "Moderate", "High")
BAND_EDGES = (0.25, 0.5, 0.75)

TITLES = {
    "vulnerability": "Present exposure",
    "hazard": "Hazard",
    "exposure": "Sector index",
}
LEGEND_TEXT = {
    "vulnerability": "Present exposure index: hazard x sector index, rescaled 0-1 within the province.",
    "hazard": "Hazard rank of each DS division for this hazard, 1 (lowest) to 4 (highest), from the province's hazard maps. The same for every sector.",
    "exposure": "Sector index: this sector's weighted, province-normalised exposure variables (0-1).",
}


RANK_KEY = {"drought": "dr", "flood": "fl", "landslide": "ls"}


@lru_cache(maxsize=1)
def _hazard_ranks() -> dict:
    """{ds_code: {p, dr, fl, ls}} -- the client's hazard maps, the same file the
    web map reads (built by design/spatial/build_geo_assets.py)."""
    path = os.path.join(os.path.dirname(__file__), "hazard_ranks.json")
    try:
        with open(path) as fh:
            return json.load(fh)
    except FileNotFoundError:
        return {}


def hazard_rank_states(codes, hazard: str) -> dict[str, tuple[str, Optional[float]]]:
    """(state, value) per division for the HAZARD layer (NOTED-10): the overall
    hazard rank 1-4 from the province's hazard map, identical to the screen and
    the same for every sector. Rank 0 = no hazard of that kind (drawn like
    'not applicable'); a division with no row is unassessed. The value is the
    middle of the rank's band so band_of() returns the rank itself."""
    key = RANK_KEY.get(hazard)
    ranks = _hazard_ranks()
    out = {}
    for code in codes:
        row = ranks.get(code)
        if row is None or key is None:
            out[code] = ("unassessed", None)
            continue
        r = int(row.get(key) or 0)
        out[code] = ("assessed", (r - 0.5) / 4.0) if 1 <= r <= 4 else ("not_applicable", None)
    return out


def band_of(value: Optional[float]) -> Optional[int]:
    if value is None:
        return None
    for i, edge in enumerate(BAND_EDGES):
        if value < edge:
            return i + 1
    return 4


def layer_value(state: str, value: Optional[float], hazard_index: Optional[float],
                exposure_index: Optional[float], layer: str) -> tuple[str, Optional[float]]:
    """(state, value) of one division on `layer`, from its vulnerability unit."""
    if layer == "vulnerability":
        return state, value
    if layer == "hazard":
        if state in ("assessed", "not_applicable") and hazard_index is not None:
            return "assessed", hazard_index
        return state, None
    if layer == "exposure":
        if state == "assessed" and exposure_index is not None:
            return "assessed", exposure_index
        return state, None
    raise ValueError("unknown layer %r" % layer)
