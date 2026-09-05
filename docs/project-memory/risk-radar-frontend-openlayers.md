---
name: risk-radar-frontend-openlayers
description: "Risk Radar's map library is OpenLayers (and Angular, since 8 Aug). Swept 14 Aug 2026 — only historical prompt quotes still name MapLibre"
type: project
---

Milinda confirmed on 1 August 2026 that the frontend uses **OpenLayers**, not
MapLibre GL. The stack reversed to **Angular + TypeScript + OpenLayers** on
8 August (SRS v2.2 §4.1); `FrontEnd/` is a retired React app, reference only.

**Status: swept and closed, 14 August 2026.** Fixed that day:

- `design/database/spatial-model.sql` — the "what MapLibre wants" comment
- `PROJECT_GUIDE.md` — "Real MapLibre map still pending" in the progress table

Everything else that still contains the word is **correctly historical** and
should be left alone: `PROGRESS_TRACKER.md`'s decision log, `PROJECT_GUIDE.md`'s
two archived prompt quotes (covered by the disclaimer at its line 13), and
`FRONTEND_CODE_REVIEW.md`'s account of how the decision was settled.

Nothing technical was ever blocked — OpenLayers reads Mapbox Vector Tiles, so
the tile endpoint and the NFR-3 performance targets are unaffected.

**Still outstanding from the same conversation:** the UI prototype's **A.2
public map** screen needs real boundaries instead of the schematic tile grid,
plus the coverage statement, period selector and distinct unassessed/pending
rendering. Simplifying `SL_RDSD.shp` at 0.004° with 4-decimal rounding fits the
whole division set in ~238 KB inline, keeping the prototype a single file. Note
the boundary set is not fixed — see [[risk-radar-331st-division]].

Related: [[risk-radar-srs-v21]].
