# Data entry workflow — map-first

**Date** 30 July 2026 · **Status** For Milinda's review, before the SRS is updated

This supersedes the entry flow drawn in the prototype, which put the workbook
upload first and never used the map for entry at all.

---

## The principle

**Context first, then the map becomes the worklist.**

You choose sector → subsector → hazard → province → period. That resolves to
exactly **one profile** — one known list of parameters, and one known set of DS
divisions. Only then does the map appear, and from that point the map is not an
output. It is the thing you work on: every division is coloured by *how far its
data entry has got*, and clicking one opens its values.

The three roles share that first step and diverge after it.

---

## Step 1 — Context (every role)

| Control | Notes |
|---|---|
| **Sector** | 8. Required first — it determines whether a subsector control appears at all. |
| **Subsector** | Shown only for the 4 sectors that have them: Agriculture (4), Livestock (5), Water (2), Inland Fishery (1). Hidden entirely for Human Settlements, Industry, Tourism, Transportation. |
| **Hazard** | Drought, Flood, Landslide. |
| **Province** | Pre-set to the officer's own province and locked; selectable for experts and administrators. |
| **Period** | 2020–2025 or 2025–2030. |

The screen then states plainly what has been resolved, before anything is
entered:

> **Agriculture · Paddy × Drought · Central Province · 2020–2025**
> 18 parameters — 4 hazard, 14 exposure · 3 have no weight yet
> 15 DS divisions · 0 with data

That line is the whole point of the step. The officer knows what they are about
to fill in and how big it is.

---

## Step 2 — Parameters and weights

This comes **before** the file upload, because the weights define the profile
and the profile defines what the file must contain.

The screen lists the profile's parameters in **two separate blocks** — hazard
and exposure — each with its own running total. Each row shows the parameter
name, its unit, its direction (`+` raises vulnerability, `−` lowers it) and its
weight.

- Weights arrive **pre-filled** from the current profile version. For most
  profiles that is the weighting carried over from the legacy provincial
  workbooks.
- Parameters with **no weight yet** are highlighted. There are 1,783 of these
  across all profiles — variables the expert refresh added that the old
  workbooks never carried.
- Each block must total exactly **100**. The running total is live and shows red
  until it does.
- Saving writes a **new profile version**, with the previous one kept. An
  optional note records the expert-panel sign-off.

**Weights are per profile, not per division.** Set once for Central Province ×
Paddy × Drought, and they apply to all 15 of its divisions. Clicking a division
later never asks about weights again.

### If the workbook disagrees

The generated workbooks carry a reference-only WEIGHTS tab. When the file is
uploaded at step 3, the system compares it against what was just confirmed. If
they differ it shows a diff and asks which wins — it does not silently overwrite
either. **The screen is authoritative; the file is advisory.**

---

## Step 3 — Get the values in

Two ways in, and they are not alternatives — most provinces will use both.

### 3a · Import a workbook

Download the template for this exact profile (divisions pre-filled and locked),
or upload one already completed. On upload:

- structure is validated against the workbook's hidden metadata sheet — added,
  removed or reordered columns are rejected outright
- errors are reported **per cell**, naming the division, the parameter and what
  was wrong
- **nothing partially loads.** Either the file goes in or it does not
- every value is tagged with the import batch, so the whole file can be reversed
  as a unit

### 3b · Enter on the map

Click a division. A panel opens on the right with that division's parameters —
the same list from step 2, now with value fields, in native units.

```
Kandy  ·  Agriculture / Paddy × Drought  ·  2020–2025

HAZARD                                          weight
  Rainfall deficit (mm)              [ 142  ]     35
  Consecutive dry days (count)       [  21  ]     25
  ...                                          ── 100

EXPOSURE
  Paddy extent (ha)                  [ 4,180 ]    18
  Irrigated share (%)                [   62  ]    12
  ...                                          ── 100

Source  [ Dept. of Agriculture, 2024 return    ]
                                    [ Save ]  [ Save and go to next unfilled ]
```

Points that matter:

- **The form is generated from the profile.** Nothing is hand-built per sector.
- **Save and go to next unfilled** is the important button. An officer working
  through 15 divisions should never have to hunt for which one is left.
- A division can be **part-filled and saved**. It is then neither empty nor
  complete, and the map says so.
- The source note is per division, because in practice different divisions come
  from different returns.

---

## The map during entry

This is the part the current prototype missed entirely. During data entry the
map is **not** coloured by vulnerability — nothing has been computed yet. It is
coloured by entry state:

| State | Appearance | Meaning |
|---|---|---|
| Empty | grey | no values yet |
| Part-filled | grey with a progress ring or count badge | some parameters in |
| Complete | solid fill | every parameter has a value |
| Error | red outline | failed validation on import |

Alongside it, a running count: *"9 of 15 divisions complete · 4 part-filled ·
2 empty."*

Once values are complete **and** weights total 100, the same map switches to
vulnerability colouring — and that is when grey stops meaning "not entered" and
starts meaning "not assessed", which is the distinction the live system loses.

---

## Expert path

Experts start from the same context selector, then:

1. **Adjust weights.** Same screen as step 2. An expert may also add a parameter
   from their own expertise — this creates a `pending` catalogue entry that an
   administrator approves before it can be used elsewhere.
2. **Edit values.** The form opens **pre-loaded with whatever the data track
   already imported**, so the expert is correcting rather than starting from a
   blank sheet. Where the data track has nothing, the fields are empty.
3. **Or apply an average across several divisions.** Where an expert only has a
   district- or province-level figure, they select several divisions on the map
   and enter the value once. Those values are stored **flagged as apportioned**,
   not measured, so they never masquerade as a division-level observation.

**The expert never overwrites the data track.** Expert edits are stored as
`source = expert`. Both exist side by side, and the difference between them is
visible on the compare view — which is the point of having three tracks.

---

## General user path

Deliberately short. Long forms get abandoned, and community input is only worth
anything in volume.

1. Sector (+ subsector if any) and hazard.
2. Click their division on the map — or let the browser locate them.
3. **One question:** how severe is this here? 1–5.
4. Optional comment, optional photo.
5. Submit.

No weights. No parameters. No units. Community averages are published only once
a division has **at least 10 ratings**, and the count is always shown beside the
average.

---

## Rules that hold across all three paths

1. **Raw values only.** The system never accepts a pre-normalised or
   pre-computed number from any role. Normalisation happens server-side so all
   provinces are comparable by construction.
2. **Tracks never overwrite each other.** One schema, separated by `source`.
3. **No score without complete weights.** If any parameter in the profile lacks
   a weight, nothing computes and nothing is published — not even a partial.
4. **Empty is not zero.** A division with no values is grey and labelled *no
   data*. It is never rendered, exported or tabulated as 0%.
5. **Every value knows where it came from** — track, user, date, source note,
   and import batch where applicable.

---

## Two things worth deciding now

**Normalisation while a province is half-entered.** Min–max normalisation
depends on which divisions have values. If 9 of 15 are in, the minimum and
maximum are drawn from those 9, and every score shifts when the last 6 arrive.
Options: normalise against fixed national bounds, hold computation until the
province is complete, or recompute and version each time. My inclination is to
**hold until the province is complete for that profile** — it matches the
existing rule that nothing partial is published, and it avoids scores that move
for reasons unrelated to the data.

**Whether part-filled divisions should compute at all.** A division missing 3 of
18 parameters could be scored on the 15 present, but the score would not be
comparable with its neighbours. I would treat it as *pending* — visible in the
entry view, absent from the published map.

---

## What changes from the current design

| Was | Now |
|---|---|
| Upload the workbook first, weights read from it | Context → weights → then upload |
| Weights confirmed once per import | Weights are a profile-level screen, reachable any time, independent of imports |
| Map only shows results | Map is the entry surface and the worklist |
| Entry is workbook-only | Workbook **and** click-a-division, both writing to the same place |
| Prototype drew a schematic tile grid | Real DS-division polygons, from the shapefiles already loaded |
| Expert entry was a separate form | Expert edits open on top of imported values, on the same map |

---

## Next

Once this is right, it flows into: SRS §6.2 and §6.3 rewritten, Annex A screens
redrawn against real geometry, and the frontend build order (the map component
becomes B/F1, not a late-stage view).
