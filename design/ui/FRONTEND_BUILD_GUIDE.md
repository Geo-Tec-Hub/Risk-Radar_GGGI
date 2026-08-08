# Risk Radar — Frontend Build Guide

**Angular + TypeScript + OpenLayers · SRS §10 Stage 5 · written 2026-08-08**

This file is the working brief for building the Risk Radar client. It is written
to be handed to a coding session in this repository and followed without reading
anything else first. Where it makes a claim about the system it cites the
requirement, so you can check it.

**Authoritative spec:** `design/srs/SRS_v2.2.md`. If this guide and the SRS
disagree, the SRS wins and this file is wrong — fix it.

---

## 0. Read this first

Three facts change how you build almost everything here.

**1. There are no scores yet, and there will not be for a while.** The database
holds 330 DS divisions, 174 variables and 243 profiles, but **zero indicator
values**. `v_profile_readiness` reports 0 of 243 profiles computable. Data
arrives gradually, imported through this UI, province by province.

So the empty map is not an edge case to handle later. **It is the normal state,
and it is what you build first.** A client that only looks right once data
exists will be wrong for months and nobody will notice until it isn't.

**2. A missing value is not a zero.** This is the single most consequential
requirement in the project (NFR-10, FR-5.14, FR-5.16). The system this replaces
renders `0.0%` for divisions that were never assessed, in the same grey as every
other uncoloured area. A planner reading that map concludes those districts are
safe. For a tool that steers adaptation finance, that is not a cosmetic bug.

**3. Scores are relative to their province.** The published index is the raw
product `H × E` renormalised within each province (§2.1, P-14). Consequences you
must build around are in §7 below.

---

## 1. What exists, what does not

| Thing | State |
|---|---|
| PostgreSQL 15 + PostGIS, 28 tables, negative tests passing | Built, on Milinda's Windows machine, port 5432 |
| 330 DS divisions, topology validated, province + district assigned | Loaded |
| 174 variables · 243 profiles · 3,664 memberships · 9 provinces · 25 districts | Seeded |
| Indicator values | **None** |
| FastAPI application | **Does not exist** |
| Angular application | **Does not exist — this guide** |
| `FrontEnd/` (React + Vite + OpenLayers 10) | **Retired.** Reference only. Do not extend, do not copy code from it |

The React app is retired but not useless: it arrived at the right *interaction*
for data entry (§8), and its code review lists real defects worth not repeating
(§11). Read `design/ui/FRONTEND_CODE_REVIEW.md` for both.

---

## 2. Six rules that must not be broken

These are not style preferences. Each maps to a requirement and each has an
automated test in the definition of done (§12).

**R1 — An absent value is `null`, never `0`.** Type it as `number | null`. Never
write `value || 0`, `value ?? 0`, `Number(value)` on a possibly-absent value, or
`parseFloat(x) || 0`. If a division has no score, the score is `null` and its
state is `pending` or `unassessed`. *(NFR-10)*

**R2 — Three coverage states, everywhere, always distinct.** Every division in
every view is exactly one of `assessed`, `pending`, `unassessed`. Pending and
unassessed must never render in a colour reserved for a band. *(FR-5.14)*

**R3 — Never convey absence by colour alone.** Pending and unassessed carry a
pattern or texture as well as a fill, are named in the legend, and are stated in
text in the coverage statement. *(FR-5.16, NFR-13)*

**R4 — The frontend computes nothing.** No normalisation, no weighting, no
banding, no score arithmetic. Bands arrive from the API or from configuration
the API serves. If you find yourself writing a formula, you are in the wrong
tier. *(SRS §4.2)*

**R5 — One styling module.** Exactly one function maps a division's state and
score to a fill, and every layer, legend, chart and table calls it. The retired
app wrote this logic three times and one copy disagreed with the other two.

**R6 — Never present a stale or empty view as data.** Every async view has an
explicit loading state, an explicit error state and a timeout. A failed request
shows an error, not an empty map. Session state reflects the server: the UI must
not appear signed in while the API returns 401. *(FR-5.20, FR-5.21, FR-5.22)*

---

## 3. Stack and setup

```
Angular (latest stable) + TypeScript, strict mode
OpenLayers 10 (`ol`)
FastAPI backend at http://localhost:8000
```

Pin the versions you actually install back into this file once created.

**Standalone components, no NgModules.** Signals for local state. Angular's
`HttpClient` for the API. No state-management library until something genuinely
needs one — this app's state is mostly URL state (FR-5.8).

**Do not add a UI kit yet.** The retired app pulled in Ant Design and ended up
fighting it for map layout. Start with plain CSS or Tailwind and add a component
library only when a real need appears.

### Where the app lives

```
Risk Radar/
  frontend/          ← the Angular app (new)
  FrontEnd/          ← retired React app, reference only
  backend/           ← FastAPI app + db scripts
```

**`node_modules` in a OneDrive-synced folder is a real problem** — tens of
thousands of small files, constant sync churn, and installs that fail on locked
files. Before the first `npm install`, either exclude `frontend/node_modules`
from OneDrive sync, or put the app outside the synced tree. Decide this first;
retrofitting it is annoying.

### Setup

```bash
npm install -g @angular/cli
ng new frontend --style=css --routing --strict
cd frontend
npm install ol
```

`tsconfig.json` must keep `strict: true` and add `strictNullChecks` if not
already implied — R1 depends on the compiler enforcing it.

### The development loop

The database runs on Milinda's Windows machine. A coding session in a sandbox
cannot reach it. Code is written here; migrations, the API and the app are run
locally in PowerShell. Assume that split and do not write anything that only
works if the tooling can see the database.

---

## 4. Project structure

```
frontend/src/app/
  core/
    api/              typed HTTP clients, one file per resource
    models/           domain types (§5) — no logic
    coverage/         coverage-state + band styling. THE only copy (R5)
    config/           environment, API base URL, band thresholds from API
  features/
    map/              the map page: OpenLayers, layers, controls, legend
    composition/      score composition panel (FR-5.9, FR-5.26)
    coverage/         coverage screen (FR-5.17)
    import/           workbook upload, weight confirmation, import summary
    weights/          profile weights editor + version history
    entry/            map-select → side-panel value entry (§8)
  shared/             loading / error / empty state components
```

`core/coverage/` is the most important directory in the app. If two files ever
decide what colour a division is, R5 is broken.

---

## 5. Domain types

Write these first, in `core/models/`. They encode the rules, so the compiler
enforces them.

```ts
/** A division is exactly one of these. Never infer state from a score. */
export type CoverageState = 'assessed' | 'pending' | 'unassessed';

export type Band = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

/**
 * Discriminated union: the compiler makes it impossible to read a score
 * off a division that does not have one.
 */
export type DivisionResult =
  | {
      state: 'assessed';
      dsCode: string;
      name: string;
      provinceCode: string;
      /** renormalised within province, 0..1 */
      score: number;
      /** raw H x E before renormalisation (FR-5.26) */
      rawScore: number;
      /** provincial bounds that produced `score` (FR-5.26) */
      provincialMin: number;
      provincialMax: number;
      band: Band;
      profileVersion: number;
      period: Period;
      track: Track;
    }
  | {
      state: 'pending';
      dsCode: string;
      name: string;
      provinceCode: string;
      /** why it is pending — e.g. variables lacking a weight */
      reason: string;
    }
  | {
      state: 'unassessed';
      dsCode: string;
      name: string;
      provinceCode: string;
    };

export type Track = 'data' | 'expert' | 'community';

export interface Period {
  yearStart: number;
  yearEnd: number;
}

export interface Coverage {
  assessed: number;
  pending: number;
  unassessed: number;
  total: number;
}
```

Note what this makes impossible: `result.score` does not compile unless you have
narrowed `state` to `'assessed'`. That is the point. R1 stops being discipline
and becomes a type error.

---

## 6. API contract

From SRS §9. Endpoints do not exist yet — build against them in this order and
they will be built to match. **Three response rules apply to every endpoint:**

1. An absent value is `null`, never `0`. Every unit in a collection carries an
   explicit `state`.
2. Every value carries its period and its track.
3. Every computed figure names the profile version behind it.

Endpoints the client needs, roughly in the order you will want them:

| Method | Path | For |
|---|---|---|
| GET | `/tiles/{level}/{z}/{x}/{y}.mvt` | Geometry as vector tiles |
| GET | `/coverage` | Assessed / pending / unassessed counts for the selection |
| GET | `/catalogue/indicators` | Indicator catalogue |
| GET | `/profiles/{scope}/weights` | Current weighting |
| PUT | `/profiles/{scope}/weights` | Save weighting — new version, recomputes |
| GET | `/profiles/{scope}/weights/history` | Version history |
| GET | `/profiles/readiness` | Which profiles are computable |
| GET | `/vulnerability` | Results for a selection, each with its `state` |
| GET | `/vulnerability/{unit}` | Full composition of one score |
| POST | `/imports` | Upload a workbook; returns weights read and variables lacking one |
| GET | `/imports/{id}` | Batch status and per-cell errors |
| GET | `/imports/{id}/summary` | Province import summary |
| POST | `/imports/{id}/rollback` | Reverse a loaded batch |
| GET | `/provinces/{code}/status` | Standing province summary, independent of a batch |
| POST | `/ratings` | Community severity rating |
| GET | `/exports/{format}` | CSV / GeoJSON / Excel of the selection |

**Do not mock these loosely.** A mock that always returns a number is how
"absent" silently becomes "zero". If you mock, mock the empty and partial cases
first: a province with no data, a province with values but unweighted variables,
a province half-imported.

---

## 7. Province-relative scores — what the UI must do

The published index is `H × E` rescaled by min–max **within each province**
(§2.1, P-14). Four consequences, each with a requirement:

- **State it on the map.** Scores are relative to the province; there is no
  single national scale. Where divisions from more than one province are shown
  together, say so. *(FR-5.24)*
- **No national ranking.** Rankings are scoped to a province. Do not build a
  national league table. *(FR-5.25)*
- **Show both numbers.** The composition panel shows the raw index *and* the
  renormalised index, with the provincial min and max that produced it.
  *(FR-5.26)*
- **Every province has exactly one 1.000 and one 0.000** per profile, by
  construction. That is not a data error — it is the signature that
  renormalisation ran. Do not "fix" it, and do not let the legend imply the
  1.000 division is nationally worst.

**The consequence nobody has resolved yet:** because bounds are provincial, a
division's published score **moves when its neighbours' data arrives**. Import
one more division and previously published scores change, without anything about
those divisions changing. The SRS records this as open. Until it is settled, the
UI must show coverage prominently enough that nobody reads a half-collected
province as final — see §9.

---

## 8. The map

The map is the application (§6.5). No dashboard in front of it. Three controls —
sector, hazard, administrative level — plus a province filter, with the ranking
and value table beside the map.

### Geometry

Vector tiles, not GeoJSON (FR-5.2, §4.3). The retired system shipped raw GeoJSON
for 330 divisions and took ~20 seconds to draw; at GND level with 14,019 units it
is not viable at all.

```ts
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';

const divisions = new VectorTileLayer({
  source: new VectorTileSource({
    format: new MVT(),
    url: `${apiBase}/tiles/dsd/{z}/{x}/{y}.mvt`,
  }),
  style: (feature) => styleForDivision(feature.getProperties()),
});
```

Levels: province, district, DS division. GND is **display only, where data
exists**, and must not render at national extent below a defined zoom threshold
(FR-5.3, P-13). Assessment and community rating stay at DS-division level.

### Styling — the one function

This is `core/coverage/`, and it is the only place these decisions are made
(R5). Write it before the map.

```ts
export interface DivisionStyle {
  fill: string;
  pattern: 'solid' | 'hatch' | 'none';
  label: string;      // for legend + screen readers (R3, NFR-13)
}

export function styleForDivision(r: DivisionResult): DivisionStyle {
  switch (r.state) {
    case 'assessed':
      return { fill: BAND_COLOURS[r.band], pattern: 'solid', label: BAND_LABELS[r.band] };
    case 'pending':
      // never a band colour; texture carries the meaning, not the hue
      return { fill: PENDING_FILL, pattern: 'hatch', label: 'Pending — awaiting weights' };
    case 'unassessed':
      return { fill: UNASSESSED_FILL, pattern: 'none', label: 'Not yet assessed' };
  }
}
```

The `switch` on a discriminated union with no `default` means the compiler
errors if a state is ever added and not handled. Keep it that way.

**Forbidden**, and all three are bugs found in the retired app:

```ts
if (value < 10) { ... }          // a value of exactly 10 renders invisible
return value ? colour : 'transparent';   // 0, null and undefined collapse together
const pct = (rating * 10) + '%';         // an ordinal is not a percentage
```

### Bands

Five bands, half-open intervals, thresholds at 0.2 / 0.4 / 0.6 / 0.8 (§2.7,
P-4). **These are a placeholder** and will be re-derived from real data once the
first province is loaded — by quantile or natural breaks, the panel decides.

So read thresholds from configuration served by the API (FR-4.13). Do not
hardcode 0.2 / 0.4 / 0.6 / 0.8 in the client. When they change, no code changes.

### Legend and coverage statement

The legend names the quantity displayed. **A vulnerability map is never labelled
*risk*** (FR-5.13) — risk is a different, deferred computation (§6.9, P-12).

Every view carries a coverage statement for the current selection: how many
divisions are assessed, pending and unassessed, as counts *and* proportions
(FR-5.15). This is not a footnote. Given §0's first fact, it is often the most
informative thing on screen.

### Selection and URL state

Encode the full selection — indicator, sector, subsector, hazard, period, track,
administrative level, extent, active layers — in a shareable URL (FR-5.8). Do
this early; retrofitting URL state through a built app is miserable.

### Data entry interaction

For the entry screens (Stage 7.1): **select divisions on the map, enter values
for the selection in a side panel, multi-select supported.** The retired app got
this right and it is the workflow in §6.2 and
`design/ui/DATA_ENTRY_WORKFLOW.md`. During entry the map is a **worklist** —
coloured by entry state (empty / part-filled / complete / error), not by
vulnerability, because nothing is computed yet.

Context resolves to one profile first: sector → subsector → hazard → weights →
import. Weights are confirmed **before** upload; the workbook's WEIGHTS tab is
advisory and the screen is authoritative. On upload, show a diff and let the
officer choose.

---

## 9. Building for data that arrives gradually

You are importing province by province over months. Design for that.

**The empty state is the first state you build.** A map of 330 divisions, all
`unassessed`, with a coverage statement reading `0 assessed · 0 pending · 330
unassessed`. If that screen is honest and readable, the hard part is done.

**Partial provinces must look partial.** When a province is half-imported, the
coverage statement, the legend and the composition panel all have to make that
plain — because provincial renormalisation means its scores will move (§7).
Consider a visible marker on any province below full coverage. This is the
practical guard against a half-collected province being read as final.

**Pending is not a lesser assessed.** A division with values but unweighted
variables has *no score*. It gets the hatch, not a pale band colour. The
temptation to render it as "roughly low" is exactly the failure NFR-10 exists to
prevent.

**The import summary is a first-class screen, not a toast.** FR-2.12 to FR-2.16
require, after every import: what was loaded, what became computable as a
result, and what remains outstanding for that province — including which
profiles are still missing, how many variables still lack a weight, and the
assessed / pending / unassessed counts. Exportable as PDF and CSV (FR-2.16) so
it can be circulated to people without logins.

**Nothing loads partially.** A file with any error loads nothing, and the report
lists every failure at once, each naming row, column and offending value
(FR-2.3). The UI shows all errors together — not the first one.

**Rollback is a normal operation.** An import batch can be reversed (FR-2.10).
Put it in the UI where someone who has just made a mistake will find it.

---

## 10. Build order

Each step states what must be true to start it and what "done" means. Steps 1
and 2 need no backend beyond a tile endpoint.

**F0 — Scaffold.** *(Stage 5.1)*
Angular app, routing, OpenLayers map component, typed API client, environment
config. **No hardcoded API host** — the retired app hardcoded it.
*Done:* app runs, base map renders, API base URL comes from environment.

**F1 — Geometry.** *(Stage 5.2; needs the MVT endpoint)*
330 divisions from vector tiles, three admin levels, pan/zoom.
*Done:* national extent interactive within 3 s on a cold cache; a tile returns
in under 500 ms (NFR-3).

**F2 — Coverage states.** *(Stage 5.3 — the important one)*
`core/coverage/` styling, all three states, legend, coverage statement.
*Done:* with an empty database the map renders 330 unassessed divisions,
correctly labelled, and **an automated test asserts no view renders an absent
value as zero.**

**F3 — Controls and URL state.** *(Stage 5.4, 5.8)*
Sector, subsector, hazard, province, track, period. Full selection in the URL.
*Done:* a pasted URL reproduces the exact view.

**F4 — Weights and profiles.** *(needs Stage 2 API)*
Profile list with readiness, weights editor with live per-domain sum, version
history. Save blocked until each domain totals exactly 100 with no blanks — weights are
exact decimals to three places and **no tolerance is applied** (FR-3.3). The UI
helps the user reach 100 by showing the shortfall or excess and offering to
distribute it (FR-3.4), rather than the rule being loosened. Four derivation
methods exist — direct, equal, AHP, entropy (FR-3.9); a consistency ratio above
0.10 requires a typed justification, not a checkbox (FR-3.11).
*Done:* a weighting saves, is rejected at 99.999, versions, and its history
reads back.

**F5 — Import.** *(needs Stage 3 API)*
Upload, all-errors-at-once report, weight confirmation with diff, province
import summary, rollback.
*Done:* a fixture workbook per validation code shows its stated error and loads
nothing.

**F6 — Composition and entry.** *(needs Stage 4 for scores)*
Score composition panel with both indices and every contributing variable
(FR-5.9, FR-5.26), coverage screen, map-select → side-panel entry, three-track
comparison.
*Done:* a division's score can be fully explained from the panel, naming the
profile version behind it.

---

## 11. Do not repeat these

From `design/ui/FRONTEND_CODE_REVIEW.md`, all found in the retired app:

- `0`, `null` and `undefined` collapsing to `transparent` in one expression — a
  division with no data and a division scoring zero looked identical.
- A rating of exactly 10 rendering invisible, from `< 10` where `<= 10` was
  meant.
- The same colour-binning rule written three times, one copy disagreeing.
- `response.ok` tested on an axios response — always `undefined`, so every POST
  was followed by a redundant GET and PUT. 45 requests to save 15 divisions.
- Four numbered copies of the side panel, three of them live.
- Two mapping libraries, one not declared in `package.json`.
- `dist/` committed to the repository.
- A hardcoded API URL.
- No tests.

The first four are logic errors that would port straight into Angular if
translated rather than rewritten. Rewrite.

---

## 12. Definition of done

Before any of this is called finished:

- [ ] An automated test asserts **no view renders an absent value as zero**
      (NFR-10). This is the one test that must exist.
- [ ] Coverage states are asserted by test, not by looking at the map.
- [ ] `strict: true`, and no `any` on an API boundary.
- [ ] Exactly one module decides colour (R5) — grep proves it.
- [ ] Band thresholds come from configuration, not from source.
- [ ] NFR-3 timings met: tile < 500 ms, national extent < 3 s cold, province
      query < 2 s.
- [ ] Keyboard navigable, screen-reader compatible, contrast checked, and
      **severity and absence never conveyed by colour alone** (NFR-13).
- [ ] Usable from 360 px to 1920 px, map primary below tablet width (NFR-14).
- [ ] Loading, error and timeout states on every async view (FR-5.20 to 5.22).
- [ ] No hardcoded API host anywhere.

---

## 13. Open items that affect the frontend

| # | Item | Effect on this build |
|---|---|---|
| O-10 | Band thresholds are placeholders | Read from config; expect them to change after the first province loads |
| O-6 | No Tamil names for any reference data | NFR-12 needs English, Sinhala **and** Tamil. Build i18n in from the start; the strings can arrive later |
| O-9 | Hazard construct — components vs composite | Decides whether the composition panel shows hazard components or one index. **Ask before building F6** |
| O-2 | 330 divisions in the shapefile, 331 usually quoted | Do not hardcode either number; read the count |
| — | Province-relative scores move as data arrives (§7) | Unresolved. Until settled, over-communicate coverage |

---

## 14. Keep this file honest

If you change an approach here, update this file in the same session, and add a
row to `PROGRESS_TRACKER.md` §3 saying what broke and why the fix is what it is.
That log is the project's memory and there is currently no git history behind
it.
