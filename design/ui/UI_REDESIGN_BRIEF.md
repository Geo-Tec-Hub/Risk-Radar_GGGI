# UI redesign brief — grounded in the live system

**Reference:** `riskradar.geoinfobox.com`, inspected 30 July 2026
**Purpose:** design the new interface from what exists and what users already
know, rather than from an imagined blank slate.

---

## What I could reach

| Screen | Reachable | Notes |
|---|---|---|
| Home / map | **Yes, fully** | Public. Drove sector, hazard, province and all four layers |
| About | **Yes** | Static text |
| Add Data | No | Requires a working session |
| My Data | No | Requires a working session |
| Login | Not attempted | I do not enter passwords into forms |

The session in the browser was **stale** — the header showed *Logout* while
`/api/users/me/` returned 401. After a reload it correctly showed *Login*. To
capture the two data-entry screens, sign in and I will walk them.

---

## Screen inventory as built

**One page, one map, one panel.** The whole application is a map with a
floating control panel, plus two form pages and an About page.

**Control panel — "All Island" mode**

```
Select Sector    ▾  (15 options)
Select Hazard    ▾  (20 options)
Select Layer     [Province] [District] [DSD]
```

**"More" mode** adds a **Province** filter and a fourth layer, **GND**.

**Results** appear on the right as a bar chart (average value per unit) and a
table of unit → value %. A **Hide Details** toggle collapses them. Bottom-left
is a three-band legend: 1–39% green, 40–69% yellow, 70–100% red. There is a
print button and a hamburger menu.

That is the entire analytical surface: **pick a sector, pick a hazard, pick a
level, read a percentage.**

---

## What works and should be kept

Not everything needs replacing. These are good decisions:

1. **The map is the application.** No dashboard-first indirection. Correct for
   this audience.
2. **The three-control model** — sector, hazard, level — is the right mental
   model and users know it. Keep the shape.
3. **Four administrative levels** with a province filter. Province → District →
   DSD → GND is genuinely useful for drilling down.
4. **Map, chart and table together.** Seeing the ranking beside the map is more
   useful than the map alone.
5. **Print.** Unglamorous and clearly used in practice.
6. **Public read access.** The map opens without login. Keep that.

---

## What is wrong

### 1. Missing data is displayed as zero — the critical flaw

At DSD level, most divisions render **0.0%** and are left uncoloured. The
basemap shows through, so the map looks moth-eaten.

**A division that has never been assessed is visually identical to a division
assessed as very low risk.** Both are uncoloured; both read "0.0%" in the
table. At district level, Colombo, Galle, Kalutara, Badulla, Kilinochchi, Mannar
and Mullaitivu all show 0.0% — which cannot be a genuine assessment result.

For a tool meant to steer adaptation funding, this is the most serious problem
in the system. A planner reading it would conclude those districts are safe.

**Fix:** three distinct states, never conflated —

| State | Rendering |
|---|---|
| Assessed, has a score | Choropleth colour |
| **Not yet assessed** | Explicit hatch or grey, labelled *No data* |
| **Assessed but incomplete** (weights missing) | Outlined, labelled *Pending* |

and a coverage indicator on every view: *"212 of N divisions assessed"* — where
both numbers come from the API. The denominator is the **registered** division
count and it changes (§O-2, O-12); a hardcoded one silently misreports coverage.

### 2. A percentage with no explanation

The map gives one number per unit and no way to ask *why*. There is no
breakdown into hazard and exposure, no list of contributing variables, no
weights, no indication of who supplied the data or when.

**Fix:** clicking a division opens a panel showing the hazard index, the
exposure index, the variables behind each with their weights, the profile
version used, and the contributor and date. This is the single biggest
capability the new data model unlocks — it stores the evidence, not just the
conclusion.

### 3. No time dimension anywhere

No year, no period, no trend. The map shows "now" with no way to know when
"now" is or to compare against an earlier assessment.

**Fix:** a period selector (2020–2025 / 2025–2030), and on the detail panel a
small trend line where more than one period exists.

### 4. Slow at the levels that matter

District renders in a few seconds. **DSD took about 20 seconds**, and an earlier
attempt froze the browser long enough to time out a 30-second screenshot. GND
would be 14,019 polygons.

The geometry is being sent to the browser as raw GeoJSON.

**Fix:** vector tiles (`ST_AsMVT`) or server-side simplification per zoom.
PostGIS is already installed, so this is available today. Below a zoom
threshold, GND should not render at national extent at all.

### 5. Terminology and polish

- The legend says **"Risk Levels"**; the model computes **vulnerability**. These
  are different concepts and the label should match the method.
- **"Avarage Value"** in the chart legend.
- Reference data typos that will become codes if migrated as-is: *"Changers in
  Rainfall Pattern"*, *"Lightening"*, *"High Intencity Rainfall"*,
  *"Deforestration"*.
- No empty state, no loading state, no error state anywhere.
- The three-band colour scale is coarse and has no defined bin for 0.

### 6. Nothing explains what a user is looking at

No methodology note, no data-source citation, no "last updated". A public
audience is given a number with no provenance.

---

## The redesign

Same shape, more honest. Three screens rather than one, plus the entry forms.

### Screen 1 — Explore (public, default)

Keeps the current layout. Changes:

```
┌─ Controls ──────────────┐   ┌─ Map ────────────────────┐  ┌─ Detail ────────┐
│ Sector      ▾           │   │  choropleth              │  │ Division name   │
│ Subsector   ▾  ← new    │   │  no-data hatched         │  │ Vulnerability   │
│ Hazard      ▾           │   │  pending outlined        │  │  = f(H, E)      │
│ Period      ▾  ← new    │   │                          │  │ Hazard    0.62  │
│ Track       ▾  ← new    │   │                          │  │ Exposure  0.44  │
│ Level  P/D/DSD/GND      │   │                          │  │ ─────────────── │
│                         │   │                          │  │ Variables +     │
│ Coverage: 212/N   ←new  │   │                          │  │  weights        │
└─────────────────────────┘   └──────────────────────────┘  │ Profile v3      │
                                                            │ Source · date   │
                                                            └─────────────────┘
```

New: **subsector** (the catalogue has 12), **period**, **track** (measured /
expert / community / compare), a **coverage counter**, and a detail panel that
decomposes the score.

### Screen 2 — Compare

The three tracks side by side, which the current system cannot do at all. Where
measured data and community perception diverge sharply, that is a finding worth
surfacing — either the data is wrong or the perception is, and both are worth
knowing.

### Screen 3 — Analysis toolbox

Absent entirely today. Choose a layer and an operation, run it, review the
result on the map, then commit it as an indicator. This is what makes it a
web-GIS rather than a map viewer.

### Entry screens

Rebuilt around the import-then-confirm-weights flow already prototyped, with
the workbook upload first and the weights confirmed on screen.

---

## What this changes in the plan

The new schema and catalogue already support everything above — that is what
243 versioned profiles, 174 catalogued variables and `v_profile_readiness` are
for. Two things need adding to the plan:

1. **Vector tiles / geometry simplification** in B6. Not optional — DSD is
   already too slow at the full DSD polygon set, and GND is ~42× that.
2. **The no-data state** must be carried through the API, not just the UI. The
   map endpoint has to distinguish *assessed*, *not assessed*, and *pending*,
   which means B3 returning readiness alongside results.

And two open questions from the review still gate migration: whether the extra
7 sectors and 17 hazards stay, and whether real GND data exists.

---

## Next step

Sign in and I will walk **Add Data** and **My Data**, which are the screens I
could not reach. Those two determine how much of the current data-entry
workflow can be preserved — worth knowing before we commit to replacing it.
