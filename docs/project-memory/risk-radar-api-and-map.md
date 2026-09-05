---
name: risk-radar-api-and-map
description: The results and taxonomy endpoints, how the map is wired to them, and the client-side constants that had silently drifted from the database
type: project
---

Built 3 September 2026. Central renders end to end.

## Endpoints

- `GET /api/vulnerability?province=CEN&sector=AGRICULTURE&subsector=PADDY&hazard=flood&period=2021-2025`
  — a **filtered list** per SRS section 9, NOT a scope in the path: that would
  collide with `/vulnerability/{unit}`. Matches `VulnerabilityUnit` field for
  field **including camelCase**, so the typed client needs no translation.
- `GET /api/vulnerability/periods` — only periods that hold results.
- `GET /api/reference/taxonomy` — provinces, sectors with subsectors, hazards,
  periods, register counts.
- `POST /api/import/check` · `/load`, `GET /api/import/batches` — see
  [[risk-radar-import-tab]].
- `GET|PUT /api/profiles/{scope}/weights` — scope is
  `province:sector:subsector:hazard`, **four segments, no period**.

Every division of the province comes back, scored or not. Returning only scored
rows would make the client infer what a missing division means — and inferring
it wrongly is the defect the retired React client shipped.

`indexScope=national` returns **409 with the reason**, not an empty list.

## camelCase everywhere — settled 4 Sep 2026

`routers/profiles.py` emitted snake_case while the models declared camelCase, so
the weights editor read `undefined` for every field. profiles.py moved, because
the frontend models, SRS §9 and the newer routers already agreed with each
other. The database function's own payload keys stay snake_case; that one
translation happens explicitly inside profiles.py.

## Four client constants that had drifted from the database

Discovered only when a real API existed to disagree with them:

1. **Subsectors were display names** ('Cattle', 'Pig & Sheep') where the API
   keys on codes (`CATTLE_FARMING`, `PIG_AND_SHEEP_FARMING`) — every livestock
   filter would have 404ed.
2. **Provinces had no code** — 'Central' sent where `CEN` was expected.
3. **PERIODS still read 2020-2025 / 2025-2030**, superseded that morning.
4. **`ProfileScope` carried `period`**, making the encoded scope five segments
   where the API takes four — every weights request 400ed.

Each surfaces to a user as *missing data*, not *stale client*. The taxonomy is
now served by `TaxonomyService` from the API with **no hardcoded fallback** —
populated controls that all fail read as broken data.

But narrow **fail-open**: if the API supplies no hazard list for a selection
(an older process, not yet restarted), offer all of them. Narrowing against a
missing list produced an EMPTY dropdown, so no query was ever sent and the map
stayed blank with nothing saying why.

## Three other things worth not re-breaking

- **The band ramp lives in `band.model.ts` only.** `coverage-style.ts` had its
  own green-yellow-red multi-hue scale; the validated single-hue set (lightness
  carries severity, for colour-vision deficiency and greyscale print) was being
  ignored by the thing actually painting the map.
- **Coverage counts from the results, not from polygons on screen.** The
  denominator used to be however many boundaries the national GeoJSON rendered
  (340), so a fully covered 41-division Central reported 12% coverage.
- **`tsc --noEmit` does not check Angular templates.** Two build breaks shipped
  past it. Run `npm run check:templates` before claiming a frontend change
  compiles.

Related: [[risk-radar-stage4-engine]], [[risk-radar-vulnerability-formula]],
[[risk-radar-central-data-loaded]], [[risk-radar-frontend-openlayers]].
