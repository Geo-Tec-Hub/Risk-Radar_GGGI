"""Render map pages to PDF (A4 landscape), one page per profile x layer.

Drawn from the DATABASE -- division boundaries from `ds_division.geom`, values
from the same results the map reads -- rather than captured from the screen,
so an export does not depend on what a browser happened to show, prints the
same today and next month, and needs no basemap tiles (which the export
deliberately leaves out: no tile outages, no third-party attribution on a
government document). Vector output, so it zooms cleanly.

Every page carries what a map needs to stand on its own once printed: a title
naming layer, sector and hazard; province, period, track and the exact profile
version; the legend with its fixed band ranges; the coverage counts; a north
arrow and a scale bar; and the note that the index is relative to the province.
"""

from __future__ import annotations

import datetime
import io
import json
import math
from dataclasses import dataclass, field
from typing import Optional

from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas as rl_canvas

from app.maps.layers import (BAND_EDGES, BAND_LABELS, LEGEND_TEXT, RAMPS, TITLES,
                             band_of)

PAGE_W, PAGE_H = landscape(A4)
MARGIN = 28
MAP_BOX = (MARGIN, 54, 560, PAGE_H - 54 - 84)     # x, y, w, h -- clear of the 3 header lines
LEGEND_X = MARGIN + 560 + 22

INK = HexColor("#212529")
MUTED = HexColor("#6c757d")
EDGE = HexColor("#495057")
UNASSESSED = HexColor("#e4e3df")
PENDING = HexColor("#c9c8c2")
NOT_PRESENT = HexColor("#f2f1ee")
FILL_ALPHA = 0.65   # same wash as the on-screen map, flattened onto white

TRACK_LABEL = {"data": "Official", "expert": "Expert", "community": "Community"}


def _flatten(hex_colour: str, alpha: float = FILL_ALPHA) -> Color:
    """The colour a 65% fill makes over white paper -- what the screen shows."""
    c = HexColor(hex_colour)
    return Color(c.red * alpha + (1 - alpha), c.green * alpha + (1 - alpha),
                 c.blue * alpha + (1 - alpha))


@dataclass
class Division:
    code: str
    name: str
    rings: list[list[list[tuple[float, float]]]]   # polygons -> rings -> points
    label_at: Optional[tuple[float, float]]


@dataclass
class PageSpec:
    layer: str
    title: str
    subtitle: str
    profile_line: str
    province: str
    states: dict[str, tuple[str, Optional[float]]] = field(default_factory=dict)


async def load_divisions(conn, province_id: int) -> list[Division]:
    rows = await conn.fetch(
        """
        SELECT code, name,
               ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.0004), 6) AS g,
               ST_X(ST_PointOnSurface(geom)) AS lx, ST_Y(ST_PointOnSurface(geom)) AS ly
          FROM ds_division
         WHERE province_id = $1 AND geom IS NOT NULL
         ORDER BY code
        """, province_id)
    out = []
    for r in rows:
        g = json.loads(r["g"])
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        out.append(Division(r["code"], r["name"],
                            [[[(p[0], p[1]) for p in ring] for ring in poly] for poly in polys],
                            (r["lx"], r["ly"]) if r["lx"] is not None else None))
    return out


class _Projector:
    """Equirectangular with cos(latitude) scaling -- adequate at province
    scale for a printed thematic map, and exact enough for a scale bar."""

    def __init__(self, divisions: list[Division]):
        xs = [p[0] for d in divisions for poly in d.rings for ring in poly for p in ring]
        ys = [p[1] for d in divisions for poly in d.rings for ring in poly for p in ring]
        self.x0, self.x1, self.y0, self.y1 = min(xs), max(xs), min(ys), max(ys)
        self.k = math.cos(math.radians((self.y0 + self.y1) / 2))
        bx, by, bw, bh = MAP_BOX
        pad = 10
        w = (self.x1 - self.x0) * self.k or 1e-9
        h = (self.y1 - self.y0) or 1e-9
        self.s = min((bw - 2 * pad) / w, (bh - 2 * pad) / h)
        self.ox = bx + (bw - w * self.s) / 2
        self.oy = by + (bh - h * self.s) / 2

    def __call__(self, lon: float, lat: float) -> tuple[float, float]:
        return (self.ox + (lon - self.x0) * self.k * self.s,
                self.oy + (lat - self.y0) * self.s)

    def points_per_km(self) -> float:
        # one degree of latitude ~ 110.95 km in Sri Lanka
        return self.s / 110.95


def _path(c, proj: _Projector, d: Division):
    p = c.beginPath()
    for poly in d.rings:
        for ring in poly:
            for i, (lon, lat) in enumerate(ring):
                x, y = proj(lon, lat)
                (p.moveTo if i == 0 else p.lineTo)(x, y)
            p.close()
    return p


def _pattern(c, path, kind: str, bbox: tuple[float, float, float, float]):
    """Hatch (unassessed) or dots (sector not present) clipped to the division,
    so no state is carried by colour alone -- the same marks as the map."""
    c.saveState()
    c.clipPath(path, stroke=0, fill=0)
    # Only over the division's own bounding box: drawing the marks across the
    # whole map frame for every division made the all-maps atlas ~60 MB.
    bx, by, bw, bh = bbox
    c.setStrokeColor(HexColor("#b8b8b2"))
    c.setFillColor(HexColor("#a3a39d"))
    c.setLineWidth(0.4)
    if kind == "hatch":
        step = 5
        k = -bh
        while k < bw + bh:
            c.line(bx + k, by, bx + k + bh, by + bh)
            k += step
    else:
        step = 5
        y = by
        while y < by + bh:
            x = bx
            while x < bx + bw:
                c.circle(x, y, 0.55, stroke=0, fill=1)
                x += step
            y += step
    c.restoreState()


def _draw_map(c, proj: _Projector, divisions: list[Division], spec: PageSpec):
    ramp = [_flatten(h) for h in RAMPS[spec.layer]]
    for d in divisions:
        state, value = spec.states.get(d.code, ("unassessed", None))
        path = _path(c, proj, d)
        dash = None
        if state == "assessed" and value is not None:
            c.setFillColor(ramp[band_of(value) - 1])
            fill_kind = None
        elif state == "not_applicable":
            c.setFillColor(NOT_PRESENT)
            fill_kind = "dots"
        elif state == "pending":
            c.setFillColor(_flatten("#c9c8c2"))
            fill_kind = None
            dash = (3, 2)
        else:
            c.setFillColor(_flatten("#e4e3df"))
            fill_kind = "hatch"
        c.setStrokeColor(EDGE)
        c.setLineWidth(0.45)
        c.setDash(*(dash or ()))
        c.drawPath(path, stroke=0, fill=1)
        if fill_kind:
            pts = [proj(lon, lat) for poly in d.rings for ring in poly for lon, lat in ring]
            x0, y0 = min(p[0] for p in pts), min(p[1] for p in pts)
            x1, y1 = max(p[0] for p in pts), max(p[1] for p in pts)
            _pattern(c, _path(c, proj, d), fill_kind, (x0, y0, x1 - x0, y1 - y0))
        c.drawPath(_path(c, proj, d), stroke=1, fill=0)
        c.setDash()
    # Division names, small, on the point-on-surface so each sits inside its own shape.
    c.setFont("Helvetica", 4.6)
    c.setFillColor(INK)
    for d in divisions:
        if d.label_at:
            x, y = proj(*d.label_at)
            c.drawCentredString(x, y - 1.5, d.name[:22])


def _north_arrow(c):
    bx, by, bw, bh = MAP_BOX
    x, y = bx + bw - 22, by + bh - 40
    c.setFillColor(INK)
    p = c.beginPath()
    p.moveTo(x, y + 26)
    p.lineTo(x - 7, y)
    p.lineTo(x, y + 6)
    p.lineTo(x + 7, y)
    p.close()
    c.drawPath(p, stroke=0, fill=1)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(x, y + 30, "N")


def _scale_bar(c, proj: _Projector):
    bx, by, _, _ = MAP_BOX
    ppk = proj.points_per_km()
    km = next((k for k in (5, 10, 20, 25, 50, 100) if k * ppk >= 60), 100)
    length = km * ppk
    x, y = bx + 12, by + 14
    c.setStrokeColor(INK)
    c.setFillColor(INK)
    c.setLineWidth(0.8)
    half = length / 2
    c.rect(x, y, half, 4, stroke=1, fill=1)
    c.setFillColor(white)
    c.rect(x + half, y, half, 4, stroke=1, fill=1)
    c.setFillColor(INK)
    c.setFont("Helvetica", 7)
    c.drawString(x - 1, y + 7, "0")
    c.drawCentredString(x + half, y + 7, str(km // 2) if km % 2 == 0 else "%.1f" % (km / 2))
    c.drawCentredString(x + length, y + 7, "%d km" % km)


def _wrap(text: str, width_chars: int) -> list[str]:
    words, lines, line = text.split(), [], ""
    for w in words:
        if len(line) + len(w) + 1 > width_chars:
            lines.append(line)
            line = w
        else:
            line = (line + " " + w).strip()
    if line:
        lines.append(line)
    return lines


def _legend(c, spec: PageSpec):
    x = LEGEND_X
    y = PAGE_H - 110
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x, y, "%s level" % TITLES[spec.layer])
    y -= 16
    edges = (0.0,) + BAND_EDGES + (1.0,)
    ramp = RAMPS[spec.layer]
    counts = [0, 0, 0, 0]
    for state, value in spec.states.values():
        if state == "assessed" and value is not None:
            counts[band_of(value) - 1] += 1
    for i in range(3, -1, -1):
        c.setFillColor(_flatten(ramp[i]))
        c.setStrokeColor(EDGE)
        c.setLineWidth(0.4)
        c.rect(x, y - 2, 18, 11, stroke=1, fill=1)
        c.setFillColor(INK)
        c.setFont("Helvetica", 8.5)
        c.drawString(x + 24, y + 1, BAND_LABELS[i])
        c.setFillColor(MUTED)
        c.drawString(x + 82, y + 1, "%.2f-%.2f" % (edges[i], edges[i + 1]))
        c.drawRightString(x + 196, y + 1, "%d" % counts[i])
        y -= 16
    c.setFont("Helvetica", 7)
    c.setFillColor(MUTED)
    for line in _wrap(LEGEND_TEXT[spec.layer] + " Band thresholds are fixed, not derived "
                      "from the data.", 50):
        c.drawString(x, y, line)
        y -= 9

    y -= 10
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x, y, "Data coverage")
    y -= 16
    tally = {"assessed": 0, "pending": 0, "unassessed": 0, "not_applicable": 0}
    for state, _ in spec.states.values():
        tally[state] = tally.get(state, 0) + 1
    rows = [("pending", "Pending - awaiting recomputation"),
            ("unassessed", "Unassessed - a value is missing"),
            ("not_applicable", "Sector not present")]
    for key, label in rows:
        if not tally.get(key):
            continue
        c.setStrokeColor(EDGE)
        c.setLineWidth(0.4)
        if key == "pending":
            c.setFillColor(_flatten("#c9c8c2"))
            c.setDash(3, 2)
            c.rect(x, y - 2, 18, 11, stroke=1, fill=1)
            c.setDash()
        else:
            c.setFillColor(_flatten("#e4e3df") if key == "unassessed" else NOT_PRESENT)
            c.rect(x, y - 2, 18, 11, stroke=1, fill=1)
            c.saveState()
            p = c.beginPath()
            p.rect(x, y - 2, 18, 11)
            c.clipPath(p, stroke=0, fill=0)
            c.setStrokeColor(HexColor("#a3a39d"))
            c.setFillColor(HexColor("#a3a39d"))
            if key == "unassessed":
                for k in range(-12, 20, 4):
                    c.line(x + k, y - 2, x + k + 11, y + 9)
            else:
                for dx in range(2, 18, 4):
                    for dy in range(1, 11, 4):
                        c.circle(x + dx, y - 2 + dy, 0.6, stroke=0, fill=1)
            c.restoreState()
        c.setFillColor(INK)
        c.setFont("Helvetica", 8.5)
        c.drawString(x + 24, y + 1, label)
        c.setFillColor(MUTED)
        c.drawRightString(x + 196, y + 1, "%d" % tally.get(key, 0))
        y -= 16

    total = len(spec.states)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(INK)
    y -= 4
    for line in _wrap("%d of %d DS divisions shown with a value." % (tally["assessed"], total), 50):
        c.drawString(x, y, line)
        y -= 10

    y -= 8
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    for line in _wrap("Provincial index: every value is normalised within %s Province "
                      "and must not be compared across provinces. 0.00 is the lowest "
                      "in this province, not an absence of %s." % (spec.province,
                                                                  TITLES[spec.layer].lower()), 50):
        c.drawString(x, y, line)
        y -= 9


def _header_footer(c, spec: Optional[PageSpec], page_no: int, generated: str):
    if spec is not None:
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(MARGIN, PAGE_H - 40, spec.title)
        c.setFont("Helvetica", 9.5)
        c.setFillColor(MUTED)
        c.drawString(MARGIN, PAGE_H - 56, spec.subtitle)
        c.drawString(MARGIN, PAGE_H - 69, spec.profile_line)
    c.setStrokeColor(HexColor("#dee2e6"))
    c.setLineWidth(0.6)
    c.line(MARGIN, 44, PAGE_W - MARGIN, 44)
    c.setFont("Helvetica", 7)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, 32, "Risk Radar - DS-Division Climate Vulnerability Assessment, Sri Lanka"
                 "  |  Generated %s  |  Boundaries: Survey Department DS divisions" % generated)
    c.drawRightString(PAGE_W - MARGIN, 32, "Page %d" % page_no)


def render(pages: list[PageSpec], divisions: list[Division], *,
           cover: Optional[dict] = None) -> bytes:
    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(PAGE_W, PAGE_H))
    c.setTitle(cover["title"] if cover else (pages[0].title if pages else "Risk Radar map"))
    c.setAuthor("Risk Radar")
    generated = datetime.datetime.now().strftime("%d %b %Y %H:%M")
    page_no = 1
    if cover:
        _cover(c, cover, generated)
        page_no += 1
        c.showPage()
    proj = _Projector(divisions) if divisions else None
    for spec in pages:
        _header_footer(c, spec, page_no, generated)
        c.setStrokeColor(HexColor("#dee2e6"))
        c.setLineWidth(0.6)
        c.rect(*MAP_BOX, stroke=1, fill=0)
        if proj:
            _draw_map(c, proj, divisions, spec)
            _north_arrow(c)
            _scale_bar(c, proj)
        _legend(c, spec)
        c.showPage()
        page_no += 1
    c.save()
    return buf.getvalue()


def _cover(c, cover: dict, generated: str):
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MARGIN + 10, PAGE_H - 90, cover["title"])
    c.setFont("Helvetica", 11)
    c.setFillColor(MUTED)
    y = PAGE_H - 114
    for line in cover["lines"]:
        c.drawString(MARGIN + 10, y, line)
        y -= 16
    y -= 10
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN + 10, y, "Contents")
    y -= 16
    c.setFont("Helvetica", 8.5)
    col_x = [MARGIN + 10, MARGIN + 400]
    col, start_y = 0, y
    for entry, page in cover["contents"]:
        if y < 70:
            col += 1
            y = start_y
            if col >= len(col_x):
                break
        c.drawString(col_x[col], y, entry[:62])
        c.drawRightString(col_x[col] + 370, y, str(page))
        y -= 11.5
    if cover.get("excluded"):
        y = min(y, start_y) - 14 if col == 0 else 80
        c.setFillColor(MUTED)
        for line in _wrap("Not included - no scores yet for this period: "
                          + ", ".join(cover["excluded"]), 150):
            if y < 50:
                break
            c.drawString(MARGIN + 10, y, line)
            y -= 10
    _header_footer(c, None, 1, generated)
