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

from typing import Optional

LAYERS = ("vulnerability", "hazard", "exposure")

RAMPS = {
    "vulnerability": ("#eb827b", "#d36963", "#bc504c", "#8d1a1e"),
    "hazard":        ("#e78a45", "#cd732b", "#b45c03", "#773a00"),
    "exposure":      ("#67aaed", "#5092d3", "#397bbb", "#024f8a"),
}
BAND_LABELS = ("Very low", "Low", "Moderate", "High")
BAND_EDGES = (0.25, 0.5, 0.75)

TITLES = {
    "vulnerability": "Vulnerability",
    "hazard": "Hazard",
    "exposure": "Exposure",
}
LEGEND_TEXT = {
    "vulnerability": "Vulnerability index: hazard x exposure, rescaled 0-1 within the province.",
    "hazard": "Hazard index: this sector profile's weighted, province-normalised hazard variables (0-1).",
    "exposure": "Exposure index: this sector's weighted, province-normalised exposure variables (0-1).",
}


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
