# Review of the existing frontend

**Source** `FrontEnd/` (React 18 + Vite + Tailwind + antd) · **Date** 30 July 2026
**Scope** 45 source files, ~8,400 lines. Read-only review; nothing changed.

This closes the gap left by the live-system review, which could only see the
application from outside. The code answers the questions the browser could not.

---

## The headline: the map already does what you asked for

`FindByName_DSD.jsx` → `DataInput_SidePanel_v4.jsx` is **already a map-select →
side-panel entry flow**, and it already supports **multi-select**:

```jsx
const DataInput_dsd = ({ dsd_list, gnd_id_list }) => { … }
```

It takes a *list* of selected divisions and POSTs one record per GND. So the
workflow I described yesterday is not a new idea to this codebase — it is a
half-built one. That materially changes the plan: this is closer to *finishing*
something than starting over.

What it is missing is everything below the selection: no parameters, no weights,
no period, no track.

---

## What is actually being entered

This is the most important finding in the review, and it is not visible from the
running site.

```jsx
<option value={0} disabled>Select a value...</option>
{[...Array(10)].map((_, i) => (
  <option key={i} value={i + 1}>{i + 1}</option>
))}
```

**Vulnerability is entered as a single ordinal 1–10 picked from a dropdown.** Not
measured indicators, not a computed composite — a judgement on a ten-point scale.
Everything downstream multiplies by 10 and appends a percent sign:

| Location | Code |
|---|---|
| `MapComponent.jsx:153` | `` `${name}\n${(avgRisk * 10).toFixed(2)}%` `` |
| `DataAnalyse_Tabel.js:78` | `{((average / 10) * 100).toFixed(2)}%` |
| `DataAnalyse_Map.js:110` | `Avg Risk: ${(avg / 10) * 100}%` |
| `ChartComponent.jsx:11` | `value: (data[key] * 10).toFixed(1)` |

So the **"66.0%" on the live map is an average of 1–10 opinion ratings, presented
as a percentage.** It carries a precision it does not have. That single fact
justifies the whole indicator-and-weights model — and it should be said plainly
to GGGI rather than discovered by them.

It also explains the legend mismatch: the legend reads `1%–39% / 40–69% /
70–100%` while the code bins on the raw 1–10 value at `1–4 / 4–7 / 7–10`. The
thresholds are not equivalent (4/10 is 40%, but 39% and 40% straddle the same
bin), and the two were clearly written at different times.

### Where the 0% problem lives

```jsx
const fillColor =
  avg_risk >= 1 && avg_risk < 4 ? color1 :
  avg_risk >= 4 && avg_risk < 7 ? color2 :
  avg_risk >= 7 && avg_risk < 10 ? color3 : "transparent";
```

`avg_risk` of `0`, `null` or `undefined` all fail every test and fall through to
`transparent`. **Missing data and a genuine zero are the same branch.** This is
the line behind the moth-eaten DSD map — now identified precisely rather than
inferred.

Two further defects in the same expression:

- **A rating of exactly 10 renders transparent.** `avg_risk < 10` excludes the
  top of the scale, so the most vulnerable divisions vanish from
  `DataAnalyse_Map.js` and `DataAnalyse_MapPrint.js`. `MapComponent.jsx:127`
  uses `<= 10` and is correct — the same rule is implemented three times and
  disagrees with itself once.
- The outline test `avg_risk >= 1 && avg_risk < 10` has the same off-by-one.

---

## Defects worth fixing regardless of what happens next

**1. Every successful save runs a redundant check-and-update.**

```jsx
const response = await API.post(submitAPI, dataToSend);
if (response.ok) { … } else { /* check, then PUT */ }
```

`response.ok` is a `fetch` property. Axios responses do not have it, so it is
always `undefined`, so the success branch is dead and **every POST is followed by
a GET and a PUT**. Three requests per division where one would do, and the
"already exists" path runs on records that were just created. On a 15-division
save that is 45 requests. `DataInput_SidePanel_v4.jsx:117`.

**2. The token lives in `localStorage`.** Readable by any script on the page, so
any XSS is a full account takeover. Compounded by the backend sending
`SameSite=None` cookies without `Secure` (live review, S-5). A httpOnly cookie is
the standard fix.

**3. `ProtectedRoute` checks only that a token string exists.** It never
validates it. An expired token renders the protected page, which then fails every
API call — this is the "shows Logout while the API returns 401" symptom (live
review, F-1), and this is its cause.

**4. Mixed content will block the basemap.** `DataAnalyse_Map.js:57` and
`DataAnalyse_MapPrint.js:28,197` load tiles over plain `http://` from
`sgx.geodatenzentrum.de`. On an HTTPS page browsers refuse these outright, so the
analysis map is very likely rendering with no basemap at all.

**5. `window.alert()` as the success notification**, in four separate panels —
while `utils/NotificationHandler.jsx` exists and is unused.

**6. No error states anywhere.** `Data.jsx` returns `<div>Loading...</div>` when
`userData` is null, with no failure branch — so a 401 or 500 is an infinite
spinner. That is exactly the "My Data" symptom.

**7. Percentage arithmetic bug.** `DataView_SidePanel.jsx:295` computes
`(value / calculateSum()) * 10` and labels it `%`. A share of a total needs
`* 100`; the pie tooltip is showing a tenth of the real share.

**8. `map.setTarget(null)` is the only cleanup.** OpenLayers interactions and
sources are not disposed, and the `useEffect` has an empty dependency array while
closing over layer variables built outside it. Fine today because the page never
re-renders with new props; it will leak the moment the map becomes reactive to a
sector or hazard selection — which is precisely what the new design requires.

---

## Structural condition

**Version-numbered files instead of version control.** There are four side
panels (`DataInput_SidePanel`, `_v2`, `_v3`, `_v4`), two data views
(`DataView_SidePanel`, `_v2`), and a file literally named
`DataAnalyse_Map old.js`. Three of them are live: `_v3` serves GND,
`_v4` serves DSD and district, `_v2` is imported into `DataViewerMap` and
rendered behind a flag that is never set. This is where the "value 10 renders
transparent in two files but not the third" class of bug comes from — the same
logic is maintained in parallel and drifts.

**Mixed mapping libraries.** OpenLayers (`ol`, `ol-ext`) in `MapComponent` and
`DataViewerMap`; Leaflet (`L.tileLayer`, `L.geoJSON`) in `DataAnalyse_Map` and
`DataAnalyse_MapPrint`. Leaflet is not even in `package.json`, so it must be
arriving as a transitive dependency — a build that works by accident.

**Two charting libraries**: Chart.js (`react-chartjs-2`) and Recharts.

**`dist/` is committed** — 1.9 MB of built output tracked alongside source.
`.gitignore` covers `node_modules` but not `dist`.

**The API base URL is hardcoded** to `https://riskradarback.geoinfobox.com/api/`
in `ApiServices.js`, with no `.env`. There is no way to point the app at a local
or staging backend without editing source.

**No tests.** No test runner in `package.json`.

Credit where due: `ApiServices.js` is a clean axios instance with an interceptor
and centralised token handling, `FetchData.jsx` sensibly collects every endpoint
in one place, and the zoom-driven layer switching in `DataViewerMap` (province →
district → DS division as you zoom in) is a nice touch worth keeping.

---

## What this means for the plan

**Reuse, don't rewrite.** Roughly a third of this codebase is worth carrying
forward:

| Keep | Why |
|---|---|
| Map-select → side-panel entry, with multi-select | The interaction you asked for, already working |
| Zoom-driven layer switching | Good behaviour, correctly implemented |
| `ApiServices` + `FetchData` structure | Clean; only the endpoints change |
| `FindByName_*` search-and-locate | Genuinely useful, no equivalent in my design |
| Basemap toggle, print/export | Modest but used |

| Replace | Why |
|---|---|
| The 1–10 value dropdown | Becomes the parameter form driven by the profile |
| All colour-binning logic | Three copies, two of them wrong; and no `no data` state |
| The four side-panel versions | Consolidate to one, driven by props |
| Leaflet maps | Standardise on one library |

**The stack decision needs revisiting.** The SRS specifies React + TypeScript +
MapLibre GL. This is React + JavaScript + OpenLayers. OpenLayers is a capable GIS
library — arguably better suited to analysis work than MapLibre — and it is
already integrated and working here. My inclination now is to **keep OpenLayers
and drop Leaflet**, rather than migrate to MapLibre and discard working map code
over a preference stated before I had seen it. Worth your call.

> **Settled 2026-08-08 — partly the other way.** OpenLayers stays and MapLibre is
> dropped, as recommended. **React does not:** the frontend is rebuilt in
> **Angular + TypeScript**, because that is what the maintaining team writes
> (SRS v2.3 §4.1). This document therefore describes a **retired** codebase. It
> stays useful for two things — the entry workflow it arrived at, which the
> rebuild keeps, and the defect list below, which the rebuild must not repeat.
> Read the rest of this file as findings, not as a work plan.

**Adding TypeScript is still worth it**, incrementally. `response.ok` on an axios
response is exactly the class of bug a type checker catches for free, and it has
been silently tripling the write load for who knows how long.

---

## Suggested order

1. Fix the POST/PUT triple-request bug and the `< 10` boundary — small, and both
   affect live data today.
2. Consolidate the four side panels into one before adding anything to them.
3. Introduce the `assessed / pending / unassessed` states in the colour function,
   in one place, used by every map.
4. Point the app at the new API behind an env variable, running both backends in
   parallel during migration.
5. Replace the 1–10 dropdown with the profile-driven parameter form.

Steps 1–3 are worth doing to the deployed system regardless of the rebuild.
