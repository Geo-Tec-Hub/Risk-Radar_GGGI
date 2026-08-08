# Risk Radar — Software Requirements Specification

## DS-Division Climate Vulnerability Assessment Platform, Sri Lanka

**Version 2.0**  ·  **6 August 2026**  ·  **Status: for implementation**

Owner NMPM Piyasena  ·  Prepared for the development team

---

This document is complete and self-contained. It is written to be built from
without reference to any earlier specification, design note or review. Where a
decision is still awaiting expert-panel confirmation it is stated as a definite
rule so the work is not blocked, and marked **[P-n]**; every such marker is
listed in Annex C with what would change if the panel decides otherwise.

Read §1 to §5 once, in order. §6 to §9 are reference material to work against.
§10 tells you what to build first.

---

# 1. Introduction

## 1.1 Purpose

Risk Radar assesses climate vulnerability for every one of Sri Lanka's 330
Divisional Secretariat (DS) divisions, for each combination of economic sector
and climate hazard, and publishes the result as a public map.

The platform answers one question in a defensible, repeatable way:

> Which parts of Sri Lanka are most vulnerable to which hazard, for which
> sector, and what is that judgement based on?

The second half of that sentence is the harder half and it drives most of this
specification. A vulnerability score here is never a bare number. It is stored
with the exact weighting that produced it, the period it describes, the
provenance of every input, and whether it exists at all — so that any published
figure can be opened up and explained months later.

## 1.2 What the system does

1. Holds a catalogue of 174 measurable variables, each classified as expressing
   **hazard** or **exposure**.
2. Collects values for those variables per DS division, through generated Excel
   workbooks, manual entry, or computation from map geometry.
3. Normalises every value server-side onto a common 0–1 scale.
4. Combines them into a hazard index and an exposure index using expert weights
   held per province × sector × hazard, then into a single vulnerability score.
5. Publishes the result as a choropleth map with the score's full composition
   available beneath it.
6. Repeats the whole assessment across three parallel evidence tracks —
   measured data, expert judgement and community perception — shown side by side.

## 1.3 Scope

**In scope for version 1.**

- Collection of hazard and exposure indicators at DS-division level
- Server-side normalisation against national bounds
- Weighted vulnerability computation per province × sector × subsector × hazard
- Three evidence tracks: data, expert, community
- A public map requiring no login, with score decomposition, coverage reporting
  and a period selector
- A spatial analysis toolbox that derives indicators from map layers
- SSP scenario projection
- An AI assistant over project documents
- Predicted-versus-actual monitoring
- An audit log
- OGC-compliant interoperability
- Migration of any existing assessment data into this model

**Out of scope for version 1.**

- Real-time hazard forecasting or early warning
- Parcel-level or household-level assessment
- Automated ingestion from third-party APIs
- Any in-system approval workflow — expert review happens offline and is
  recorded as a note (§3.4)
- The risk layer combining hazard, asset exposure and vulnerability, which is
  specified in §6.9 but deferred to phase 2 **[P-12]**
- Raster ingestion in the spatial toolbox; climate surfaces must arrive as
  pre-computed per-division values

## 1.4 Definitions

| Term | Meaning |
|---|---|
| DS division | Divisional Secretariat division, administrative level 3 (ADM3). The unit of assessment. 330 nationally. |
| GND | Grama Niladhari division (ADM4), a finer unit. 14,019 nationally. Display only, where data exists. |
| Variable / indicator | A measurable quantity, e.g. *No. of flood events 1974–2023*. |
| Domain | Whether a variable expresses **hazard** or **exposure**. |
| Profile | The set of variables and weights defining vulnerability for one province × sector × subsector × hazard. |
| Membership | One variable's place in one profile, carrying a weight and a direction. |
| Track | The provenance of a value: `data`, `expert` or `community`. |
| Period | A year range a value describes, e.g. 2020–2025. |
| Assessed | A division for which a vulnerability score has been computed from a complete, weighted profile. |
| Pending | A division whose profile has values but at least one unweighted variable, so no score may be computed. |
| Unassessed | A division for which no value has been entered. **Distinct from a score of zero.** |
| Coverage | The count and proportion of divisions that are assessed within the current map selection. |
| Hazard index | The weighted composite of a profile's hazard-domain variables, in [0, 1]. |
| Exposure index | The weighted composite of a profile's exposure-domain variables, in [0, 1]. |
| Asset exposure | People and assets physically within a hazard footprint. A different concept from the exposure domain — see §2.9. |
| SSP | Shared Socioeconomic Pathway (SSP1–SSP5), the IPCC scenario framework. |

## 1.5 Acronyms

| | | | |
|---|---|---|---|
| ADM1/2/3/4 | Administrative level 1–4 | AHP | Analytic Hierarchy Process |
| API | Application Programming Interface | CR | Consistency Ratio (AHP) |
| CRS | Coordinate Reference System | CSRF | Cross-Site Request Forgery |
| DDL | Data Definition Language | DS | Divisional Secretariat |
| EPSG | European Petroleum Survey Group (CRS registry) | ERD | Entity-Relationship Diagram |
| GND | Grama Niladhari Division | HSTS | HTTP Strict Transport Security |
| IPCC | Intergovernmental Panel on Climate Change | JWT | JSON Web Token |
| LLM | Large Language Model | MVT | Mapbox Vector Tile |
| NAP | National Adaptation Plan | OGC | Open Geospatial Consortium |
| pgvector | PostgreSQL extension for vector similarity | PostGIS | Spatial extension for PostgreSQL |
| RBAC | Role-Based Access Control | SLD99 | Sri Lanka Datum 1999 (EPSG:5235) |
| SPI | Standardised Precipitation Index | SSP | Shared Socioeconomic Pathway |
| WCAG | Web Content Accessibility Guidelines | WFS/WMS/WMTS | OGC Web Feature / Map / Map Tile Service |

## 1.6 Four properties that must not be traded away

Everything in this document is negotiable except these. They are stated here
because each one is easy to lose under delivery pressure, and each one is the
reason a later reader will trust a published number.

**Every published number can be explained.** A vulnerability score is stored
alongside the exact version of the weighting that produced it. Changing a weight
never rewrites history; it creates a new version.

**A gap is never drawn as a zero.** Unassessed, pending and assessed are three
distinct states and must remain distinct in the database, the API and the map.
A division nobody has measured must never be rendered as a division that scored
low. This is a correctness requirement, not a presentation preference.

**Normalisation happens in the system, never in the spreadsheet.** All provinces
are comparable by construction rather than by convention.

**Three tracks, one schema.** Measured data, expert judgement and community
perception share one structure and are separated by a `source` column.
Divergence between them is a finding, not a defect.

---

# 2. The assessment model

## 2.1 The formula

For each DS division *d*, sector *s* (and optional subsector) and hazard *h*:

```
Vulnerability(d, s, h)  =  √( Hazard(d, h) × Exposure(d, s, h) )        [P-1]
```

Both terms are weighted composites of normalised indicators:

```
Hazard index(d, h)      = Σ (wᵢ / 100) × normalised(vᵢ, d)     over hazard-domain variables
Exposure index(d, s, h) = Σ (wⱼ / 100) × normalised(vⱼ, d)     over exposure-domain variables

with   Σ wᵢ = 100   and   Σ wⱼ = 100     (each domain totals 100 independently)
```

Note the explicit division by 100. Weights are stored as percentages; normalised
values lie in [0, 1]; the weighted sum must therefore be divided by 100 to return
an index in [0, 1]. Every index in this system lies in **[0, 1]**.

Note also that the hazard index carries no sector argument. Flood hazard in a
division is the same physical fact whether the question concerns paddy or
tourism. The exposure index carries sector because what stands to be harmed is
sector-specific.

### Why the geometric mean **[P-1]**

The combination is multiplicative, not additive: a division facing no hazard is
not vulnerable however exposed it is, and a division with nothing exposed is not
vulnerable however hazardous its setting. Neither term may compensate for the
other.

The raw product `H × E` expresses that correctly but compresses results toward
zero — with five equal bands it places roughly half of all divisions in the
lowest band and two per cent in the highest, which makes the map nearly
uninformative. The square root is a monotonic transform, so it preserves the
ordering of divisions exactly while returning a value on the same [0, 1] scale
as its inputs. Divisions then spread approximately 17 / 28 / 28 / 20 / 7 across
the five bands.

An alternative — computing `H × E` and renormalising the result across divisions
— reaches a similar spread but makes the score **relative**: the worst division
becomes 1.0 by construction in every profile, scores are not comparable between
profiles, and a division's score moves when other divisions' data arrives. The
square root achieves the spread as a fixed transform, so the score stays
absolute. That is why it is preferred.

## 2.2 Normalisation

Raw values arrive in incompatible units — millimetres, hectares, headcounts,
percentages. Normalisation puts every variable on a common 0–1 scale so a weight
means the same thing regardless of which variable carries it.

The default method is min-max:

```
normalised(v, d) = ( value(v, d) − min(v) ) / ( max(v) − min(v) )
```

Three properties are configured per variable in the catalogue.

**Method** — `minmax` (default), `zscore`, or `none`.

**Geographic scope of the bounds.** Minimum and maximum are computed across
**all 330 DS divisions nationally**, never within the province of the profile
being computed **[P-2]**. Without this rule a score of 0.7 in one province and
0.7 in another are not the same statement, and no national map or ranking is
meaningful. Provincial variation belongs in the weights (§2.4), where it is
stored, versioned and explainable — not in the measurement scale, where it is
invisible.

**Temporal scope** — `pooled` across periods (default), `per_year`, or
`fixed_bounds` using configured minimum and maximum values.

### Bounds must never move under partial entry

If bounds are re-derived from whichever divisions happen to have been entered so
far, every published score shifts when the last division arrives. Two behaviours
are permitted and no others:

1. **Fixed bounds** — the variable declares `norm_min` and `norm_max` and
   normalises against them regardless of what has been entered. Preferred **[P-3]**.
2. **Hold** — no score is computed for any division until every one of the 330
   has a value for that variable.

Fixed bounds should be used wherever bounds can be stated, because holding means
nothing publishes until national collection completes. Of the 174 variables, 36
are percentages with natural bounds of 0 and 100, and 4 are composite indices
already on a fixed scale; those 40 need no judgement. The remaining 134 counts,
extents and lengths need a stated ceiling or must hold.

## 2.3 Directionality

Not every indicator raises vulnerability. Forest cover and piped-water coverage
reduce it. Each membership therefore carries a direction:

- `higher_is_worse` — a higher value raises vulnerability; the normalised value
  is used as computed.
- `higher_is_better` — a higher value lowers vulnerability; the normalised value
  is inverted as `1 − x`.

**Direction is a property of the variable within a profile, not of the variable
globally**, because the same variable can behave differently in different
contexts. After inversion, 1 always means *worse* in every domain.

## 2.4 Weights and profiles

A **profile** is the set of variables and weights defining vulnerability for one
province × sector × subsector × hazard. There are 243 of them.

Weights are held per province because the same sector × hazard is legitimately
weighted differently in different places — drought matters differently to paddy
in the Dry Zone than in the Wet Zone. This variation is deliberate and is
retained.

Four rules govern weights, all enforced by the database rather than by
convention:

1. Weights total **exactly 100 within each domain separately**. A hazard set and
   an exposure set, never pooled.
2. Weights are stored as exact decimals to three places, so 33.333 + 33.333 +
   33.334 = 100.000 exactly. No tolerance is applied; a total of 99.999 is a
   rejection, not a rounding matter.
3. A weight of `NULL` means *this variable belongs to the profile but has not yet
   been weighted*. It does not mean zero and must never be treated as zero.
4. Saving a weight set takes effect immediately and creates a **new profile
   version**. Published results pin the version that produced them, so history
   stays explainable.

No profile containing an unweighted variable may be computed.

## 2.5 Periods and time

Data is collected for **periods**, not individual years.

**Rule 1 — a period value is a typical year, not a multi-year total.** This is
the only reading valid for both stock variables (population, extent,
percentages) and flow variables (production, event counts). Summing a stock
across six years would inflate it sixfold.

**Rule 2 — the two periods do not overlap.** Period 1 runs to 31 December 2025;
period 2 runs from 1 January 2026 to 31 December 2030 **[P-7]**. Every year
therefore belongs to exactly one period and no resolution rule is required.

Per-variable exceptions are held in the catalogue as `period_aggregation`:

| Value | Meaning | Variables |
|---|---|---|
| `average` | A typical year within the period. Default. | 160 |
| `fixed_window` | The variable defines its own year window; the same value applies to every period. | 11 |
| `max` | Already a maximum over a fixed historical window. | 3 |
| `total` | A genuine sum across the period. | 0 |
| `end_of_period` | The level at the period's end. | 0 |

The eleven `fixed_window` variables are the six long-run event counts (flood,
drought, landslide, lightning, strong wind, cutting failures), the three hazard
indices, SPI and warm days. The three `max` variables are the maximum flood-,
drought- and landslide-affected people over their historical windows.

### Granularity must be consistent within a variable

A single year is stored as a period whose start and end are equal. Nothing in
the storage prevents one variable from holding a single observed year for some
divisions and a period value for others — but normalisation would then pool an
actual year against a typical year on one scale, and a division measured in a
single severe year would normalise toward the top of the national range for
reasons of collection rather than reality.

**A variable must therefore use one granularity across all divisions of a
profile. Mixed input is rejected at import.**

## 2.6 The three tracks

| Track | Source | Purpose |
|---|---|---|
| `data` | Measured values via workbook import or manual entry | The authoritative assessment |
| `expert` | Domain specialists supplying values from knowledge | Coverage where measurement is absent; a check on the data |
| `community` | General users rating severity 1–5 | Lived experience; surfaces perception gaps |

All three share one schema and are separated by the `source` column, so they are
directly comparable. Community averages are published only where n ≥ 10, and
carry a low-confidence marker where 10 ≤ n < 30.

## 2.7 Bands

Scores are classified into five bands with configurable thresholds. The same
banding applies to vulnerability and, when built, to risk, so the two share a
legend.

```
Very low  [0, 0.2)    Low  [0.2, 0.4)    Moderate  [0.4, 0.6)
High  [0.6, 0.8)      Very high  [0.8, 1]
```

Intervals are half-open so every value falls in exactly one band **[P-4]**.

## 2.8 The hazard construct

Hazard is expressed as its **components** — event counts, SPI, warm days, and
similar measured quantities — and not as a single pre-computed composite hazard
index **[P-5]**.

The reason is the first property in §1.6. A composite index cannot be
decomposed: asked *what is this score made of*, the platform could only answer
"a hazard index of 0.7", which is the exact failure this system exists to
correct. Components can be decomposed all the way down to a measured value with
a source and a date.

Where a composite hazard index exists it is retained in the catalogue as a
reference variable and may be displayed, but it carries no weight in a profile.

> **Dependency.** This resolution assumes component values exist for all nine
> provinces. Some provinces historically supplied the composite index only. If
> component values are genuinely absent for a province rather than merely
> unweighted, that province cannot be computed under this rule and the decision
> must be revisited — see Annex C, **[P-5]**.

## 2.9 Two kinds of exposure, named apart

The word *exposure* carries two distinct meanings and they are named apart
throughout this document:

| Name | Meaning | Where used |
|---|---|---|
| **Exposure domain** | What stands to be harmed — paddy extent, farming households, housing units. A weighted set of indicators inside the vulnerability model. | §2.1, everywhere |
| **Asset exposure** | People and assets physically inside a hazard footprint, in native units. Derived from geometry. | §6.9 risk layer only |

Both readings are current in the literature. What would be wrong is letting a
reader believe a division scoring high on one necessarily scores high on the
other: a sparsely populated district may be highly exposed in the domain sense
and carry very few assets.

The database enumerates the vulnerability domains as `hazard` and `exposure` and
that token does not change. Interface text should read *exposure (what is at
stake)* where confusion is possible.
---

# 3. Actors and roles

| Role | May do | Scope |
|---|---|---|
| **Public** | View the map, score composition, coverage, exports and OGC services. No login. | National |
| **Community contributor** | Everything public, plus submit a 1–5 severity rating. Requires an account. | National |
| **Data officer** | Import workbooks, enter values manually, set weights, run and commit toolbox jobs. | Assigned province only |
| **Expert** | Everything a data officer may do, plus submit expert-track values and review AI answers. | Assigned province, or national |
| **Administrator** | All of the above, plus user and role management, catalogue governance, spatial layer registration, migration. | National |

## 3.1 Public access

Public read access without authentication is a deliberate transparency
requirement. **Authentication exists to control contribution, not viewing.**

This is a narrow, explicit grant and not an absence of enforcement. The API
framework's default permission is *deny*, so an endpoint that specifies nothing
is closed. Public read is granted endpoint by endpoint and is read-only.

## 3.2 Provincial scoping

A data officer or expert is bound to one province. They may read national data
and must not write outside their province. Scope is enforced server-side on
every write, never only in the interface.

## 3.3 Community contribution

Rating requires an account, because the one-rating-per-contributor rule (§6.7)
cannot be enforced without identity. This is the single exception to the
open-access principle and applies only to writing.

## 3.4 Approval

**There is no in-system approval workflow.** Data is validated against a local
expert panel offline; once that panel has signed off, the data officer or
administrator saves directly. The sign-off is recorded as a free-text
`panel_note` against the saved weighting, not as a status a record must pass
through.

Saving takes effect immediately and creates a new version. Nothing is ever
altered in place, so an unreviewed change is visible and reversible rather than
blocked.

---

# 4. System architecture

## 4.1 Stack

| Tier | Technology |
|---|---|
| Frontend | React + TypeScript, **OpenLayers** for the map |
| Backend | FastAPI (Python), REST |
| Store | PostgreSQL with **PostGIS** for geometry and **pgvector** for the AI retrieval index |
| Tiles | Server-generated Mapbox Vector Tiles (MVT) |
| Documents | Object storage for uploaded workbooks and source files; checksums in the database |

One database, not three systems. The AI assistant is an additional retrieval
layer over the same store, not a separate service with its own copy of the data.

## 4.2 Component responsibilities

**Frontend.** Renders the map from vector tiles, holds no business rules. It
must never compute a score, normalise a value, or decide a band — all of that is
server-side so that the API, the exports and the map cannot disagree.

**Backend.** Owns normalisation, weighting, computation, validation and access
control. Exposes REST endpoints (§9) and OGC services.

**Database.** Owns integrity. Domain rules — weights totalling 100, values in
range, valid geometry, computed values requiring a job — are enforced by
constraints and functions, not solely by application code. A second client
connecting directly to the database must not be able to violate them.

**Job runner.** Spatial toolbox computations and scenario projections run as
queued background jobs, not inside a request.

## 4.3 Geometry delivery

Geometry is served as **vector tiles**, not as a GeoJSON payload. Sending raw
GeoJSON for 330 divisions makes the map take tens of seconds to draw and blocks
the browser's main thread; at GND level with 14,019 units it is not viable at
all. Tiles are generated server-side with per-zoom simplification and joined to
results at request time.

## 4.4 Deployment posture

- A production ASGI server behind a reverse proxy. Never a development server.
- Debug mode off in every deployed environment; errors to a log, never to the
  response body.
- Real hostnames in the allowed-hosts configuration.
- Cross-origin requests restricted to the declared frontend origin. Wildcard
  origins are never combined with credentialed requests.
- Session, authentication and CSRF cookies marked `Secure` and `HttpOnly`.
  HTTPS enforced.
- The whole system must run on a single server with no proprietary dependency.

---

# 5. Data foundation

This section describes what already exists and has been verified. The
credibility of every downstream number rests on it, so it is stated in detail.

## 5.1 Geography

Boundaries come from official ADM1/ADM2/ADM3 shapefiles: 9 provinces, 25
districts, **330 DS divisions**.

The source files carried no parent columns, so each division's district and
province were derived by maximum-area spatial overlap and the result was
topology-validated.

### Coordinate reference systems

| Purpose | CRS | Note |
|---|---|---|
| Storage and delivery | **EPSG:4326** | All geometry columns |
| Area, length and distance | **EPSG:5235** (SLD99) | Never measure in 4326 |

Computing area in a geographic CRS yields square degrees, not square metres.
This is a silent error — the number looks plausible — so two helper functions
exist and all measurement goes through them:

```sql
sl_area_km2(geometry)    -- ST_Area(ST_Transform(g, 5235)) / 1e6
sl_length_km(geometry)   -- ST_Length(ST_Transform(g, 5235)) / 1e3
```

The computed national total lands within 0.6% of the commonly quoted figure of
about 65,600 km², which is the check to re-run after any geometry change.

> **Known discrepancy.** The source register quotes 331 DS divisions; the
> supplied shapefile contains 330. One division remains to be reconciled. All
> counts in this document are against the 330 that exist.

## 5.2 Variable catalogue

**174 canonical variables**, consolidated from 311 raw variable descriptions
found across legacy provincial workbooks, with 269 aliases retained so historic
column headers still resolve.

Each catalogue entry carries: a stable code, name, description, unit, domain
hint, normalisation method, normalisation scope, fixed bounds where applicable,
default direction, period aggregation, and a governance status of `pending`,
`active` or `retired`.

Only `active` variables may join a profile. Variables proposed during import
reconciliation land as `pending`, and their values are held until an
administrator approves or merges them.

## 5.3 Sectors, subsectors and hazards

**8 sectors, 12 subsectors, 3 hazards.**

| Sector | Subsectors |
|---|---|
| Agriculture | Coconut, Paddy, Tea, Vegetable & Other Field Crops |
| Human Settlements | — |
| Industry | — |
| Inland Fishery | Inland Fishery |
| Livestock | Buffalo, Cattle, Goat, Pig & Sheep, Poultry farming |
| Tourism | — |
| Transportation | — |
| Water | Irrigation Water, Potable Water |

Hazards: **drought, flood, landslide**.

Sectors and hazards are rows in catalogues, not tables. Adding one is data
entry, not a schema change.

### Relationship to the National Adaptation Plan

The NAP names 13 sectors. The two taxonomies do not nest — Agriculture divides
across two NAP sectors while Industry and Transportation combine into one — so
the relationship is recorded as a **crosswalk**, not by restructuring the sector
table **[P-8]**. NAP sectors are held as separate reference data with a
many-to-many mapping to sectors and subsectors. No live profile changes.

| NAP sector | Covered by | Profiles |
|---|---|---|
| Food Security | Paddy, Veg & OFC, Livestock ×5, Inland Fishery | 110 |
| Water Resources | Irrigation, Potable | 40 |
| Coastal & Marine | — | 0 |
| Health | — | 0 |
| Human Settlements & Infrastructure | Human Settlements | 24 |
| Ecosystems & Biodiversity | — | 0 |
| Tourism and Recreation | Tourism | 18 |
| Export Agriculture | Tea, Coconut | 18 |
| Industry, Energy & Transportation | Industry, Transportation | 33 |
| Cultural & Heritage Assets | — | 0 |
| Disaster Risk Management | — | 0 *(not assessable)* |
| Human Mobility & Migration | — | 0 *(not assessable)* |
| Cross-Cutting Governance | — | 0 *(not assessable)* |

Four NAP entries describe response capacity or institutional arrangements rather
than something with exposure indicators at DS-division level. They are
registered in the crosswalk and flagged as not assessable, so they appear in
reporting against the NAP without ever being reported as missing data **[P-9]**.

Filling the gaps inside the six covered sectors — rubber, energy, marine
fisheries, watershed, estate infrastructure — is a **phase 2 collection
programme**, not version 1 work **[P-10]**.

## 5.4 Profiles and weights

| | Count |
|---|---|
| Province-profiles | **243** |
| Distinct sector × hazard combinations | 33 |
| Variable-to-profile memberships | **3,664** |
| Memberships carrying a weight | 1,881 |
| Memberships with `weight_pct IS NULL` | **1,783** |

The unweighted memberships are variables an expert refresh added to profiles
after the legacy weights were set. They are tracked explicitly rather than
hidden, and the engine refuses to compute any profile that contains one.

Two facts about the shape of this backlog matter for planning:

- **Every one of the 243 profiles contains at least one unweighted variable.**
  None is complete.
- **401 of the 486 profile-domain groups already total exactly 100 while also
  containing an unweighted variable.** There is therefore no blank to fill:
  giving any weight to a new variable forces the existing weights in that domain
  down. The task is a re-weighting, not a completion.

The two domains differ:

| Domain | Unweighted | Character |
|---|---|---|
| Hazard | 558 | Entirely explained by the hazard-construct split (§2.8). Resolving **[P-5]** closes all of them. |
| Exposure | 1,225 | Diffuse across 108 variables; the twelve largest contributors account for 27%. Genuine profile-by-profile work. |

For the exposure domain, equal weight is applied as an interim so computation is
unblocked, and replaced by direct expert entry profile by profile as the panel
works through them **[P-6]**. Because every save creates a new version, interim
results stay explainable and are superseded rather than overwritten.

## 5.5 Collection instruments

**243 workbooks** — one per province × sector × hazard — covering 17,826 data
rows. Each contains:

- Two period tabs with all DS divisions of that province pre-filled and locked
- A variable dictionary
- A **WEIGHTS tab** carrying the weight and direction for each variable
- A locked metadata sheet identifying the profile the workbook belongs to

Workbooks are **generated from the catalogue, never hand-authored**, so the
collection instrument and the database cannot drift apart. The generator is part
of the system, not a one-off script.

## 5.6 The three coverage states

Combining §5.4 with data entry gives exactly three states a division can be in,
and they must remain distinct everywhere:

| State | Meaning | Rendering |
|---|---|---|
| **Assessed** | Complete weighted profile, score computed | Coloured by band |
| **Pending** | Values present, at least one unweighted variable | Distinct hatch or texture, never a band colour |
| **Unassessed** | No values entered | Distinct neutral fill, never a band colour |

A division that is pending or unassessed has **no score**, not a score of zero.
---

# 6. Functional requirements

**Priority.** Every requirement is **Must** unless tagged. *(Should)* means
important but not release-blocking. *(Could)* means desirable, first to be cut.

**Identifiers.** A requirement ID is a stable name, not a position. IDs are
assigned when a requirement is written and are never reused or renumbered, so a
defect report or test case that names one still resolves years later.

**Verification.** Each group states how its requirements are verified — by
**test** (automated), **demonstration** (exercised against the running system),
**inspection** (code or configuration reviewed) or **analysis** (reasoned from
design).

## 6.1 Catalogue and profiles

*Verification: test, automated against the seeded catalogue.*

| ID | Requirement |
|---|---|
| FR-1.1 | The system shall hold a catalogue of indicators, each with a stable code, name, unit, domain hint, normalisation method and scope, fixed bounds where configured, default direction, period aggregation and status. |
| FR-1.2 | The system shall hold sectors, subsectors and hazard types as catalogue rows, addable without schema change. |
| FR-1.3 | The system shall hold a profile per province × sector × subsector × hazard, listing its variables with a domain, weight and direction for each. |
| FR-1.4 | A profile composer screen shall allow an administrator to add or remove variables from a profile and set the domain and direction of each. |
| FR-1.5 | Only indicators with status `active` shall be addable to a profile. Indicators proposed at import shall land as `pending` and their values shall be held until approved or merged. |
| FR-1.6 | The system shall record and display, for every profile, the history of changes to its variable set and weights: version, author, date, source file and sign-off note. |
| FR-1.7 | Indicator aliases shall be held and matched case-insensitively, so a legacy column header maps to its catalogue variable automatically once mapped. |
| FR-1.8 | The system shall hold NAP sectors as reference data and a many-to-many crosswalk from sectors and subsectors to NAP sectors, with a flag marking NAP entries that are not assessable at DS-division level. |

## 6.2 Data collection and import

*Verification: test, using fixture workbooks — one per validation code in Annex A.*

| ID | Requirement |
|---|---|
| FR-2.1 | The system shall generate a collection workbook for any profile, pre-filled with that province's DS divisions, locked against structural change, and carrying a metadata sheet identifying the profile. |
| FR-2.2 | The system shall accept an uploaded workbook, validate it in full, and stage its values before loading. |
| FR-2.3 | **No file shall load partially.** A file containing any error loads nothing. The report shall list every failure at once, each naming the row, the column and the offending value. |
| FR-2.4 | On upload the system shall read the WEIGHTS tab and report which weights it found and which variables lack one. |
| FR-2.5 | The system shall accept manual value entry for the data and expert tracks, in native units, with period and source recorded per value. |
| FR-2.6 | An unrecognised column header shall be presented to the officer for mapping to a catalogue variable; the mapping shall be stored as an alias and applied automatically thereafter. |
| FR-2.7 | The system shall reject an import in which a variable would hold both single-year and multi-period values across the divisions of a profile (§2.5). |
| FR-2.8 | Every stored value shall record its track, contributing user, source file, period and the import batch it arrived in. |
| FR-2.9 | The system shall reject a workbook whose structure has been altered from the generated template, naming what was added, removed or reordered. |
| FR-2.10 | An import batch shall be reversible: rolling it back shall remove exactly the values it created and no others. |
| FR-2.11 | The system shall report import progress and per-cell errors against a batch identifier while the batch is being processed. |

## 6.3 Weighting

*Verification: test, including negative tests — a domain totalling 99.999 is rejected.*

| ID | Requirement |
|---|---|
| FR-3.1 | Weights shall be entered in the application, not carried by the data file. The WEIGHTS tab pre-fills the screen; it does not write to the database directly. |
| FR-3.2 | On every import the officer shall be shown the profile's weights pre-filled and editable, with variables lacking a weight visually distinguished. |
| FR-3.3 | The system shall refuse to save a weighting unless **each domain totals exactly 100** and no weight is blank. Weights are exact decimals to three places; no tolerance is applied. |
| FR-3.4 | Where a domain does not total 100 the screen shall show the shortfall or excess and offer to distribute it across the unweighted or least-recently-edited indicators. |
| FR-3.5 | Saving shall take effect immediately and create a new profile version. No approval step shall block it. |
| FR-3.6 | An optional expert-panel sign-off note shall be recorded with each saved weighting. |
| FR-3.7 | Weights shall be editable at any time from a dedicated screen, independently of an import, showing full change history. |
| FR-3.8 | The system shall expose which profiles are computable and which are awaiting weights. |
| FR-3.9 | The system shall support four weight-derivation methods — direct entry (default), equal weight, AHP and entropy. Whichever is used, the stored result is the same per-domain percentage set. |
| FR-3.10 | For AHP the system shall present a pairwise comparison matrix on Saaty's 1–9 scale, derive the priority vector and compute the consistency ratio. Where CR > 0.10 it shall warn that the comparisons are internally contradictory. |
| FR-3.11 | Acknowledging a consistency ratio above 0.10 shall require a free-text justification, stored with the weighting version and written to the audit log. A checkbox is not sufficient. |
| FR-3.12 | For entropy the system shall derive weights from the dispersion of the values themselves and shall state plainly that the result reflects the data rather than expert judgement. *(Should)* |
| FR-3.13 | The derivation method and its inputs shall be stored with the weighting version. |
| FR-3.14 | The system shall support applying one province's weight set to another as a starting point, recording that it was copied. *(Should)* |

## 6.4 Normalisation and computation

*Verification: test. Recomputation must be bit-identical.*

| ID | Requirement |
|---|---|
| FR-4.1 | Normalisation shall be performed server-side for all three tracks identically, per the method and scope configured on each variable. |
| FR-4.2 | Normalised values shall lie in [0, 1]. |
| FR-4.3 | **Normalisation bounds shall be computed across all 330 DS divisions nationally**, never within the province of the profile being computed, so scores from different provinces lie on one scale. |
| FR-4.4 | Temporal normalisation scope shall be configurable per variable as pooled across periods, per period, or fixed bounds. |
| FR-4.5 | Normalisation bounds shall not shift under partial entry. The system shall either use fixed configured bounds or hold computation until all 330 divisions have a value. It shall never re-derive bounds from whichever divisions happen to have been entered. |
| FR-4.6 | A variable whose direction is `higher_is_better` shall have its normalised value inverted as `1 − x`. |
| FR-4.7 | The engine shall apply each variable's period-aggregation rule. |
| FR-4.8 | The engine shall compute a hazard index and an exposure index per DS division, each as the weighted sum of its domain's normalised values divided by 100, and combine them as `√(H × E)`. |
| FR-4.9 | The engine shall refuse to compute any profile containing an unweighted variable, and shall report which are missing. |
| FR-4.10 | Each stored result shall reference the exact profile version used and the period it describes. |
| FR-4.11 | Where a value is missing for a period the most recent prior value shall be carried forward. The carried value shall retain its original track, contributor and source, shall record the period it came from, and shall be marked as carried at the point of storage — not inferred later. |
| FR-4.12 | A carried-forward value shall be visible as such: annotated in the detail panel, counted separately in the coverage statement, and excluded from any claim that a division was assessed for the period displayed. |
| FR-4.13 | The system shall classify scores into five bands with configurable half-open thresholds, defaulting to 0.2 / 0.4 / 0.6 / 0.8. |
| FR-4.14 | Recomputation against the same data and profile version shall produce an identical result. |

## 6.5 Map and visualisation

*Verification: demonstration, plus automated tests for coverage and absence rules.*

The map is the application. There is no dashboard standing between the user and
the geography. Three controls — sector, hazard, administrative level — with a
province filter, and the ranking and value table beside the map.

### Core map

| ID | Requirement |
|---|---|
| FR-5.1 | The system shall publish a choropleth of the real administrative boundaries, rendered with OpenLayers, accessible without login. |
| FR-5.2 | Geometry shall be delivered as server-generated vector tiles with per-zoom simplification. The map shall remain interactive at national extent at every administrative level. |
| FR-5.3 | The system shall offer province, district and DS-division layers. A GND layer shall be offered **for display only, where GND data exists**, and shall not render at national extent below a defined zoom threshold. Assessment and community rating remain at DS-division level **[P-13]**. |
| FR-5.4 | Users shall filter by province, sector, subsector and hazard. Subsector shall be a first-class filter, not folded into sector. |
| FR-5.5 | Users shall switch between the three tracks and view them side by side. |
| FR-5.6 | Context layers — land use, water, roads, buildings — shall be toggleable with adjustable opacity. |
| FR-5.7 | The map shall provide print output. |
| FR-5.8 | The system shall encode the full map selection — indicator, sector, subsector, hazard, period, track, administrative level, extent and active layers — in a shareable URL. |

### Explaining the score

| ID | Requirement |
|---|---|
| FR-5.9 | Selecting a division shall show the full composition of its score: hazard index, exposure index, every contributing variable with its weight, direction, raw value, normalised value and unit. |
| FR-5.10 | The composition shall name the profile version, track, period and contributing user for every value shown. |
| FR-5.11 | The system shall show the same division compared across hazards and across tracks. |
| FR-5.12 | Every published figure shall carry its source citation and the date it was last updated. |
| FR-5.13 | The legend shall name the quantity displayed. A vulnerability map shall not be labelled *risk*. |

### Coverage and honest absence

| ID | Requirement |
|---|---|
| FR-5.14 | Assessed, pending and unassessed shall be rendered as three visually distinct states, none of them a band colour reserved for a score. |
| FR-5.15 | The map shall display a coverage statement for the current selection: how many divisions are assessed, pending and unassessed, as counts and proportions. |
| FR-5.16 | Absence shall never be conveyed by colour alone. |
| FR-5.17 | A coverage screen shall show where data is missing, by province and profile. |

### Time

| ID | Requirement |
|---|---|
| FR-5.18 | The map shall carry a period selector, and every displayed figure shall state the period it describes. |
| FR-5.19 | The system shall show a division's values across periods, marking carried-forward values and marking fixed-window variables as period-independent. |

### Interface states

| ID | Requirement |
|---|---|
| FR-5.20 | The interface shall show an explicit error state when an API call fails. It shall never present a stale or empty view as if it were data. |
| FR-5.21 | Session state in the interface shall reflect the server's view of authentication. The interface shall not appear signed in while the API rejects its requests. |
| FR-5.22 | Every asynchronous view shall have a defined loading state and a defined timeout. |
| FR-5.23 | The map shall carry a summary panel for the current selection: highest- and lowest-scoring divisions, distribution across the five bands, and coverage. *(Should)* |

## 6.6 Spatial analysis toolbox

*Verification: test against the real 330 divisions.*

Many indicators are not collected as numbers — they are derived from geometry.
*% forest cover*, *% water surface area*, *flood-affected road length* and
*buildings in landslide-prone areas* are all questions about the intersection of
a map layer with a DS division. The toolbox computes them in the database,
against the same 330 polygons the map draws.

| ID | Requirement |
|---|---|
| FR-6.1 | Spatial layers shall be registered in a catalogue with a declared geometry type and an attribute contract, validated on import. No layer shall load without one. |
| FR-6.2 | Each layer shall declare the geographic extent it covers. |
| FR-6.3 | The toolbox shall provide area, length, count, share, density and distance operations per DS division. |
| FR-6.4 | Each operation shall accept an optional attribute filter, so one land-cover layer can answer *% forest*, *% paddy* and *% built-up* without three imports. |
| FR-6.5 | The toolbox shall provide a two-layer intersection operation, computing an asset layer clipped to a hazard-extent layer and then to each DS division. |
| FR-6.6 | Area, length and distance shall be computed in EPSG:5235. |
| FR-6.7 | Vector layers shall be importable from shapefile, GeoJSON or GeoPackage, and reprojected to EPSG:4326 on import. |
| FR-6.8 | Remote OGC layers shall be registrable as reference layers for display, without being copied into the database. |
| FR-6.9 | **A result of zero shall be returned only where the division lies inside the layer's declared extent.** A division outside that extent shall be reported as unassessed for that variable, never as zero. |
| FR-6.10 | Toolbox output shall be written as a result awaiting review, never directly as an indicator value. |
| FR-6.11 | A user shall explicitly commit a result before it becomes an indicator value, and the committed value shall retain a link to the job that produced it. |
| FR-6.12 | The user shall be able to review results on the map before committing, and to discard them. |
| FR-6.13 | A committed value shall be impossible to create without an originating job. This shall be enforced by a database constraint. |
| FR-6.14 | Toolbox output shall be written with a period label consistent with the variable's other divisions, so FR-2.7 is not violated by a commit. |
| FR-6.15 | Distance shall be measured from the DS-division centroid. Where a distance figure is published, the interface shall state that it is centroid-based. |
| FR-6.16 | Raster ingestion is deferred to phase 2. All version 1 operations produce vector-derived scalar results. |

> **Note on the fourteen intersection variables.** Fourteen catalogue variables
> name an asset intersected with a hazard zone — flood-affected road length,
> buildings in landslide-prone areas, flood-affected schools and similar.
> FR-6.5 exists for them. Until authoritative hazard-extent geometry is loaded
> they continue to be collected as measured values through the workbooks
> **[P-11]**.

## 6.7 Community track

*Verification: test, including abuse cases.*

| ID | Requirement |
|---|---|
| FR-7.1 | An authenticated contributor shall be able to submit a 1–5 severity rating for a division, sector, subsector, hazard and period, with an optional comment and photograph. |
| FR-7.2 | Community averages shall be shown only where n ≥ 10, always with n displayed. |
| FR-7.3 | Where 10 ≤ n < 30 the average shall carry a low-confidence marker, so a threshold crossed by one rating does not read with the same authority as one crossed by fifty. |
| FR-7.4 | A contributor may hold **one rating per division per sector × hazard × period**, replaceable but not additive. A second submission replaces the first; it does not add to the count. |
| FR-7.5 | The system shall reject unauthenticated submission. Identity is required because the one-rating rule cannot otherwise be enforced. |
| FR-7.6 | The system shall flag for review any contributor submitting more than 20 ratings in a session. |
| FR-7.7 | Community ratings shall be stored in their own table keyed on contributor, division, sector, subsector, hazard and period, with uniqueness enforced across that key. |
| FR-7.8 | The community track shall be displayable beside the data and expert tracks, with the largest divergences listed. |

## 6.8 Scenarios and impact projection

*Verification: test.*

| ID | Requirement |
|---|---|
| FR-8.1 | The system shall support SSP1–SSP5 scenarios, each holding a set of per-indicator adjustments. |
| FR-8.2 | A projection shall apply the scenario's adjustments to baseline indicator values, then run the unchanged normalisation and weighting. |
| FR-8.3 | Every projection shall record the scenario, the horizon and the exact adjustment set applied, so it can be reproduced. |
| FR-8.4 | The system shall project sector and subsector impact per DS division under a selected scenario and horizon. |
| FR-8.5 | Projections shall be stored distinctly from observed assessments and never conflated on the map or in an export. |
| FR-8.6 | An impact explorer screen shall allow a scenario and horizon to be selected and the projected map compared against the baseline. |

## 6.9 Risk layer *(phase 2)*

Vulnerability answers *how badly would this division cope*. It does not answer
*how many people are in the way*. Risk does. **This module is specified for
completeness and deferred to phase 2 [P-12]** — it requires asset layers that do
not yet exist, and the two-layer toolbox operation of FR-6.5.

| ID | Requirement |
|---|---|
| FR-9.1 | The system shall compute a risk index per DS division as the geometric mean of hazard, asset exposure and vulnerability. |
| FR-9.2 | Asset exposure shall be derived by the toolbox from the intersection of the hazard extent with population, buildings, roads and facilities. |
| FR-9.3 | Risk results shall be stored separately from vulnerability results and never conflated on a map or in an export. |
| FR-9.4 | Each stored risk result shall record its three input scores, the profile version behind the vulnerability term, and the asset layers used. |
| FR-9.5 | The system shall report asset exposure in native units alongside the index — people, kilometres of road, counts of schools and hospitals. |
| FR-9.6 | Asset layers shall carry the attributes native-unit reporting depends on, validated against the layer's attribute contract. |
| FR-9.7 | Risk shall use the same five bands as vulnerability. |
| FR-9.8 | Risk shall not be computed where the underlying vulnerability profile is not computable. An incomplete input shall not silently produce a risk figure. |

## 6.10 AI assistant

*Verification: test for retrieval and latency; inspection for the degradation path.*

| ID | Requirement |
|---|---|
| FR-10.1 | The system shall index project and policy documents into a vector store. |
| FR-10.2 | The assistant shall answer questions on likely impacts and candidate adaptation measures, with citations to the retrieved sources. |
| FR-10.3 | The AI layer shall be non-essential. Where the language model or vector store is unavailable, every other part of the system shall continue to function. |
| FR-10.4 | Experts shall be able to review, correct and append to any assistant answer, and the reviewed version shall be what is published. |
| FR-10.5 | Each answer shall carry a status of `draft`, `under_review` or `published`. Only a published answer is visible to the public. |
| FR-10.6 | Where two experts submit differing corrections, both shall be retained and the later shall become current. |
| FR-10.7 | The language and embedding models shall be self-hosted, for data-sovereignty reasons. |

## 6.11 Monitoring

| ID | Requirement |
|---|---|
| FR-11.1 | The system shall record observed outcomes per DS division, sector and hazard, with a date and a source. |
| FR-11.2 | A monitoring dashboard shall compare predicted vulnerability or impact against observed outcomes over time. |
| FR-11.3 | A comparison shall name the profile version and period the prediction came from, so a past prediction is judged against what it actually said. |

## 6.12 Administration

| ID | Requirement |
|---|---|
| FR-12.1 | An administrator shall manage users, roles and provincial scope. |
| FR-12.2 | Self-registration shall require administrator approval before activation. |
| FR-12.3 | An administrator dashboard shall show users, pending registrations, submission volume by track and provincial coverage. |
| FR-12.4 | A submission history shall list every submission with its track, status and version. |
| FR-12.5 | An administrator shall register and manage spatial layers and their attribute contracts. |
| FR-12.6 | An administrator shall govern the catalogue: approve or merge pending indicators, retire indicators, manage aliases. |

## 6.13 Audit and versioning

*Verification: inspection and test.*

| ID | Requirement |
|---|---|
| FR-13.1 | No published result shall be altered in place. Corrections shall create a new version. |
| FR-13.2 | The system shall write an audit entry for every change to data, weights, catalogue, users, roles and spatial layers, recording actor, action, entity, before and after values, and timestamp. |
| FR-13.3 | Audit entries shall be immutable and shall have no deletion path in the API or the interface. |
| FR-13.4 | The audit log shall be queryable by date, actor, action and entity. |
| FR-13.5 | Audit entries shall be retained for at least seven years. |

## 6.14 Interoperability

| ID | Requirement |
|---|---|
| FR-14.1 | The system shall publish OGC-compliant WMS, WFS and WMTS services over published results. |
| FR-14.2 | Results shall be exportable as CSV, GeoJSON and Excel, carrying the same coverage states and provenance as the map. |
| FR-14.3 | No export shall represent an absent value as zero. |
| FR-14.4 | The REST API shall be documented from the implementation, not by hand. |
| FR-14.5 | A health endpoint shall report the status of the database, tile service, job queue and AI layer. |

## 6.15 Migration

| ID | Requirement |
|---|---|
| FR-15.1 | The system shall import reference data from any predecessor system — sectors, hazards, administrative units — and reconcile it against the catalogue, reporting every unmatched entry rather than silently dropping it. |
| FR-15.2 | Pre-existing composite assessment values shall be migrated as archived historical results, marked with an origin of `pre-migration` and a profile version of `unknown`. They shall never be written as indicator values, because a composite score is not an indicator. |
| FR-15.3 | Archived results shall be viewable and comparable against newly computed results, and labelled in the interface as historical with unknown composition. |
| FR-15.4 | Spelling errors in migrated reference data shall be corrected, with the original retained as an alias so historic references still resolve. |
| FR-15.5 | Where a predecessor holds GND-level data, migration shall aggregate it to DS division for version 1 use and retain the GND-level values unmodified, so no collected data is lost. |
| FR-15.6 | Migration shall produce a reconciliation report — records read, matched, aggregated, archived and rejected — reviewed before cut-over. |
| FR-15.7 | Migration shall be re-runnable and idempotent. A second run against the same source shall not duplicate records. |
| FR-15.8 | Cut-over shall not proceed until the reconciliation report is accepted. |
---

# 7. Non-functional requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-1 | **Provenance.** Every stored value shall record its track, contributing user, source file where applicable, and period. Every computed value shall record the job or profile version that produced it. | Inspection — provenance columns `NOT NULL` |
| NFR-2 | **Reproducibility.** Re-running a computation against the same data and profile version shall produce an identical result. No query that feeds a published figure shall depend on an undefined ordering. | Test |
| NFR-3 | **Spatial performance.** Map queries covering a province shall return within 2 seconds. All geometry columns shall be spatially indexed. A single vector tile shall be generated and returned within 500 ms at any zoom. The national extent at DS-division level shall be complete and interactive within 3 seconds on a cold cache. No administrative level, including GND at 14,019 units, shall block the browser's main thread. | Test — load test at stated thresholds |
| NFR-4 | **Security.** Passwords stored hashed. Contribution endpoints authenticated and role-scoped. Public read endpoints unauthenticated by explicit, read-only grant. The API framework's default permission shall be deny. | Inspection — default permission asserted in a settings test |
| NFR-5 | **Deployment posture.** Production ASGI server behind a reverse proxy; debug off; errors to a log, never to the response body; real hostnames configured. | Inspection |
| NFR-6 | **Browser security.** Cross-origin requests restricted to the declared frontend origin; no wildcard origin with credentials; Secure and HttpOnly cookies; HTTPS enforced. | Inspection |
| NFR-7 | **Query safety.** No endpoint shall interpolate request parameters into SQL. Spatial and analytical queries shall use parameter binding. | Inspection |
| NFR-8 | **Data integrity.** Domain rules — weights totalling 100, values in range, valid geometry, computed values requiring a job — shall be enforced in the database, not solely in application code. | Test — negative tests in Annex A |
| NFR-9 | **Auditability.** No published result shall be altered in place. Corrections create a new version. | Test |
| NFR-10 | **Honest absence.** No interface, export or API response shall represent an absent value as zero. Stated as a system-wide property because it is the failure most likely to mislead a reader. | Test — no endpoint returns 0 for an absent value |
| NFR-11 | **Portability.** The system shall run on a single server with no proprietary dependency. | Demonstration — full install, no external service |
| NFR-12 | **Localisation.** The interface and all reference data — DS-division names, sector names, hazard names, indicator names — shall be available in **English, Sinhala and Tamil**. | Inspection — three locales present for all reference data |
| NFR-13 | **Accessibility.** The public interface shall meet WCAG 2.1 Level AA: keyboard navigable, screen-reader compatible, sufficient contrast, and never reliant on colour alone to convey severity or absence. | Inspection — audit |
| NFR-14 | **Responsive layout.** Usable from 360 px to 1920 px wide. Below tablet width the map remains primary. | Demonstration |
| NFR-15 | **Concurrency.** At least 100 concurrent public readers and 20 concurrent authenticated contributors without degradation beyond the stated response times. | Test |
| NFR-16 | **Assistant responsiveness.** The assistant shall begin streaming within 5 seconds and complete a standard answer within 30. | Test |
| NFR-17 | **Recoverability.** The database shall be backed up daily and the backup restorable to a working system. Retention: 30 daily, 12 monthly. Restore shall be exercised before handover, not assumed. | Demonstration |
| NFR-18 | **Observability.** The system shall log API response times, slow database queries and background job durations, and expose them. | Demonstration |
| NFR-19 | **Retention.** Audit entries retained at least 7 years, with no deletion path in the API or interface. | Inspection |
| NFR-20 | **File storage.** Uploaded files shall be stored outside the database with checksums recorded in it. | Inspection |

---

# 8. Data model

## 8.1 Modules

| Module | Tables |
|---|---|
| Auth | `role`, `app_user`, `user_role` |
| Geography | `province`, `ds_division` |
| Catalogue | `hazard_type`, `sector`, `subsector`, `indicator_catalog`, `indicator_alias`, `nap_sector`, `sector_nap_map` |
| Vulnerability | `vulnerability_profile`, `profile_indicator`, `indicator_value`, `vulnerability_result` |
| Community | `community_rating` |
| Scenarios | `ssp_scenario`, `scenario_parameter`, `impact_projection` |
| Monitoring | `monitoring_observation` |
| Import | `import_batch` |
| Spatial toolbox | `spatial_layer`, `spatial_feature`, `spatial_operation`, `computation_job`, `computation_result` |
| AI assistant | `agent_document`, `agent_embedding`, `agent_answer`, `agent_answer_review` |
| Audit | `audit_log` |
| Risk *(phase 2)* | `risk_result` |

Two design decisions shape the model.

**Configuration as data, not schema.** Indicators, sectors, hazards and spatial
layers are rows in catalogues, not tables. A new sector, hazard or map layer is
data entry. This is why the platform absorbs 174 variables across 8 sectors
without a table per sector.

**Separation of calculation from assertion.** The toolbox writes to a results
table; only an explicit user action promotes a result to an indicator value, and
a database constraint makes a computed value without an originating job
impossible.

## 8.2 Enumerated types

```sql
source_type             ('data', 'expert', 'community')
domain_type             ('hazard', 'exposure')
normalization_method    ('minmax', 'zscore', 'none')
norm_scope_type         ('pooled', 'per_year', 'fixed_bounds')
indicator_direction     ('higher_is_worse', 'higher_is_better')
derivation_type         ('raw_upload', 'manual', 'computed')
catalog_status          ('pending', 'active', 'retired')
period_aggregation_type ('average', 'total', 'max', 'end_of_period', 'fixed_window')
import_status           ('uploaded', 'validated', 'loaded', 'rejected', 'rolled_back')
spatial_geometry_type   ('POINT', 'LINESTRING', 'POLYGON', 'MIXED')
computation_status      ('queued', 'running', 'succeeded', 'failed', 'committed')
```

## 8.3 Constraints that carry the model

These are not incidental. Each one prevents a class of silent error and must
survive any refactor.

| Constraint | On | Prevents |
|---|---|---|
| Per-domain weights total exactly 100.000, checked on save | `profile_indicator` via `save_profile_weights()` | A weighting that produces a quietly wrong index rather than a visibly wrong one |
| `weight_pct` is `NUMERIC(6,3)`, not floating point | `profile_indicator` | Totals that cannot reach exactly 100 |
| `normalized_value` between 0 and 1 | `indicator_value` | An index outside its stated range |
| `year_end >= year_start` | `indicator_value`, `computation_job` | Inverted periods |
| Unique on (indicator, division, source, user, scenario, period) | `indicator_value` | Duplicate values, and additive community submission |
| Unique on (contributor, division, sector, subsector, hazard, period) | `community_rating` | One person counting as many toward the n ≥ 10 threshold |
| `derivation = 'computed'` requires a `computation_job_id` | `indicator_value` | An untraceable derived number becoming official data |
| Committing a job requires a target indicator | `computation_job` | A commit with no destination |
| Profile scope unique with `NULLS NOT DISTINCT` | `vulnerability_profile` | Duplicate active profiles for one scope |
| Attribute contract validated on feature insert | `spatial_feature` | A layer that cannot answer the questions it was imported for |

## 8.4 Helper functions and views

| Object | Purpose |
|---|---|
| `sl_area_km2(geometry)` | Area in km², computed in EPSG:5235 |
| `sl_length_km(geometry)` | Length in km, computed in EPSG:5235 |
| `sl_apportion(layer, kind, filter)` | Apportion one layer to DS divisions — polygons by intersected area, lines by length, points by count |
| `sl_apportion_2(asset_layer, extent_layer, kind, filter)` | **New.** Asset layer clipped to a hazard-extent layer, then to each division (FR-6.5) |
| `save_profile_weights(...)` | Validate per-domain totals, retire the current version, insert a new one |
| `iv_for_year(indicator, division, year, source)` | Resolve a query year to a single period value |
| `v_profile_readiness` | Which profiles are computable and which await weights |
| `v_profile_weight_history` | Version history per profile |
| `v_division_vulnerability` | Current published score per division with its coverage state |

### `iv_for_year` determinism

The resolver must return exactly one row for any input, deterministically.
Ordering by period start alone is insufficient — two rows can share a start —
and a non-deterministic result violates NFR-2. The ordering is:

```sql
ORDER BY v.year_start DESC NULLS LAST,          -- later period first
         (v.year_end - v.year_start) ASC,       -- then the narrower period
         v.id DESC                              -- then the most recently entered
LIMIT 1;
```

## 8.5 Tables to be added

The following do not exist yet and are part of the build.

**`community_rating`** — a severity rating is not an indicator value. It has no
`indicator_id` and is keyed on sector × hazard, so it cannot live in
`indicator_value`.

```
id, user_id, ds_division_id, sector_id, subsector_id, hazard_type_id,
year_start, year_end, severity (1-5), comment, photo_ref,
created_at, updated_at
UNIQUE (user_id, ds_division_id, sector_id, subsector_id, hazard_type_id,
        year_start, year_end)
```

**`audit_log`** — append-only, no update or delete path.

```
id, actor_user_id, action, entity_table, entity_id,
before_value JSONB, after_value JSONB, occurred_at, request_id
```

**`nap_sector`** and **`sector_nap_map`** — NAP reference taxonomy and the
many-to-many crosswalk, with an `is_assessable` flag on `nap_sector`.

**`spatial_layer.coverage_geom`** — the declared extent required by FR-6.2 and
FR-6.9.

**`risk_result`** *(phase 2)* — three input scores, profile version, asset
layers used, native-unit exposure figures.

---

# 9. API surface

Representative, not exhaustive. Every endpoint is documented from the
implementation.

| Method | Path | Purpose |
|---|---|---|
| POST | `/imports` | Upload a workbook; validate; stage values; return weights read and variables lacking one |
| GET | `/imports/{id}` | Batch status and per-cell errors |
| POST | `/imports/{id}/rollback` | Reverse a loaded batch |
| GET | `/catalogue/indicators` | The indicator catalogue with normalisation configuration |
| GET | `/catalogue/nap` | NAP sectors and the crosswalk |
| GET | `/profiles/{scope}/weights` | Current weighting |
| PUT | `/profiles/{scope}/weights` | Save a weighting; creates a new version; recomputes |
| GET | `/profiles/{scope}/weights/history` | Version history |
| GET | `/profiles/readiness` | Which profiles are computable |
| POST | `/weights/ahp` | Submit a pairwise comparison matrix; returns weights and the consistency ratio |
| GET | `/vulnerability` | Results filtered by province, sector, subsector, hazard, track, period. Each unit carries an explicit state of assessed, pending or unassessed |
| GET | `/vulnerability/{unit}` | Full composition of one score: both indices, variables, weights, directions, raw and normalised values, profile version, track, period, contributor |
| GET | `/coverage` | Assessed / pending / unassessed counts for the current selection |
| GET | `/tiles/{level}/{z}/{x}/{y}.mvt` | Vector tiles of administrative geometry joined to results |
| POST | `/ratings` | Community severity rating |
| GET | `/ratings/summary` | Community averages with n, and the low-confidence marker |
| POST | `/toolbox/layers` | Register a spatial layer with its attribute contract and coverage extent |
| POST | `/toolbox/jobs` | Queue a spatial computation |
| GET | `/toolbox/jobs/{id}` | Job status and results for review |
| POST | `/toolbox/jobs/{id}/commit` | Promote results to indicator values |
| GET | `/scenarios` | SSP scenarios and their parameters |
| POST | `/scenarios/{id}/project` | Run a projection for a horizon |
| GET | `/monitoring` | Observed outcomes against predictions |
| POST | `/agent/ask` | Retrieval-augmented answer with citations |
| GET | `/audit` | Audit log, filtered by date, actor, action and entity |
| POST | `/migration/run` | Execute or re-run migration; returns the reconciliation report |
| GET | `/exports/{format}` | CSV, GeoJSON or Excel export of the current selection |
| — | `/ogc/wms`, `/ogc/wfs`, `/ogc/wmts` | OGC services over published results |
| GET | `/health` | Status of database, tiles, job queue and AI layer |

## 9.1 Response rules

Three rules apply to every endpoint and are worth stating once:

1. **An absent value is `null`, never `0`.** Every unit in a collection response
   carries an explicit `state` of `assessed`, `pending` or `unassessed`.
2. **Every value carries its period and its track.** A response that omits them
   is incomplete.
3. **Every computed figure names the profile version behind it.**
---

# 10. Build sequence

This section exists so a developer joining the project knows what to do first.
Each stage names what must be true before the next begins.

## 10.0 What already exists

| Component | Status |
|---|---|
| Variable catalogue — 174 variables | Complete |
| DS-division register — 330 divisions, topology validated | Complete |
| Collection workbooks — 243 files, 17,826 rows | Complete |
| Database schema — 28 tables, automated tests pass | Built and verified |
| Reference and catalogue data loaded | Built and verified |
| Spatial toolbox schema and six operations | Built, not exercised |
| Architecture and data-flow design | Complete |
| Everything in the application layer | **Not started** |

## Stage 1 — Schema completion

*Nothing else can be tested against an incomplete schema, so this comes first.*

1. Add `community_rating`, `audit_log`, `nap_sector`, `sector_nap_map`.
2. Add `spatial_layer.coverage_geom`.
3. Add `sl_apportion_2()` for two-layer intersection (FR-6.5).
4. Correct `iv_for_year()` ordering for determinism (§8.4).
5. Re-seed period boundaries as non-overlapping — period 1 to 2025, period 2
   from 2026 **[P-7]**.
6. Regenerate the ERD.

**Exit condition:** every constraint in §8.3 has a passing negative test — an
attempt that should fail, failing for the stated reason.

## Stage 2 — Catalogue and profile API

1. Read endpoints for indicators, sectors, subsectors, hazards, NAP crosswalk.
2. Profile read, including readiness.
3. Weight save through `save_profile_weights()`, with versioning and history.
4. AHP endpoint with consistency ratio.

**Exit condition:** a weighting can be saved, rejected at 99.999, versioned, and
its history read back.

## Stage 3 — Import pipeline

1. Workbook generation from a profile.
2. Upload, full validation against Annex A, staging.
3. Weights read from the WEIGHTS tab and returned for confirmation.
4. Atomic load, batch rollback.
5. Alias reconciliation for unrecognised headers.
6. Granularity validation (FR-2.7).

**Exit condition:** one fixture workbook per validation code, each producing its
stated error and loading nothing.

## Stage 4 — Normalisation and computation engine

1. National-bounds normalisation with all three methods and three temporal
   scopes.
2. Direction inversion.
3. Period resolution and carry-forward with marking.
4. Hazard and exposure indices, then `√(H × E)`.
5. Banding.
6. Refusal on unweighted variables, with a report of which.

**Exit condition:** recomputation is bit-identical; a profile with one unweighted
variable refuses and names it; a division outside a variable's data returns
unassessed, not zero.

## Stage 5 — Tiles and the public map

1. Vector tile generation with per-zoom simplification.
2. Choropleth with three coverage states rendered distinctly.
3. Sector, subsector, hazard, province, track and period controls.
4. Score composition panel.
5. Coverage statement and coverage screen.
6. Ranking chart and value table.
7. Shareable URL state, print output, error and loading states.

**Exit condition:** NFR-3 timings met at national extent; no view anywhere
renders an absent value as zero.

## Stage 6 — Spatial toolbox

1. Layer registration with attribute contract and coverage extent.
2. The six single-layer operations, then the two-layer operation.
3. Job queue, review on map, commit with job linkage.
4. Extent-aware zero handling (FR-6.9).

**Exit condition:** a committed value traces back to layer, operation and
parameters; a division outside a layer's extent is unassessed.

## Stage 7 — Community and expert tracks

1. Expert value entry.
2. Community rating with the uniqueness key and session flagging.
3. Three-track comparison view with divergence listing.

## Stage 8 — Scenarios, monitoring, assistant

1. SSP scenarios and projection, stored separately from observations.
2. Impact explorer.
3. Monitoring dashboard.
4. Document indexing, retrieval-augmented answers, expert review workflow.

## Stage 9 — Administration, audit, interoperability

1. User, role and provincial scope management; registration approval.
2. Catalogue governance.
3. Audit log write path on every mutating endpoint, and the query interface.
4. OGC services and exports.
5. Health endpoint and observability.

## Stage 10 — Migration and cut-over

1. Reference-data reconciliation with an unmatched report.
2. Archived historical results with `pre-migration` origin.
3. GND-level preservation.
4. Reconciliation report, accepted before cut-over.

## Dependency notes

- Stage 4 cannot complete until the hazard-construct question **[P-5]** is
  settled, because the hazard domain of every profile depends on it.
- Stage 5 can begin against seeded reference data before Stage 4 finishes; the
  map's coverage states are testable with no scores at all.
- Stage 6's two-layer operation is required before the fourteen intersection
  variables can be derived, and before any phase-2 risk work.
- The AI assistant (Stage 8) must be built so that its absence degrades nothing
  else (FR-10.3), so it can be sequenced last without risk.

---

# 11. Assumptions, constraints and open items

## 11.1 Assumptions

- DS divisions are the assessment unit. GND data is not required, though any
  that exists during migration is preserved.
- Boundaries are stable for the assessment period. A mid-project boundary
  revision would require remapping historic values.
- Expert-panel review occurs outside the system and is recorded, not enforced.
- Data collection is a periodic exercise, not a real-time feed.
- Provincial teams work in Excel; the generated workbook remains the primary
  collection instrument.

## 11.2 Constraints

- One PostgreSQL instance serves both geometry and vector retrieval.
- The AI layer requires a self-hosted model; the embedding dimension is
  provisional until that model is selected.
- Raster ingestion is deferred, so climate surfaces must be supplied as
  pre-computed per-division values.

## 11.3 Open items

| # | Item | Effect |
|---|---|---|
| O-1 | Weights for 1,783 memberships. Hazard resolves structurally via **[P-5]**; exposure needs profile-by-profile work. | Affected profiles cannot be computed until supplied |
| O-2 | Source register quotes 331 DS divisions; the shapefile contains 330 | One division to reconcile |
| O-3 | Two subsectors hold legacy data for one province only | May indicate incomplete collection rather than genuine absence |
| O-4 | Self-hosted language and embedding model not yet selected | Blocks the AI layer only |
| O-5 | Official DS-division codes, if they exist, not yet adopted | Internal codes generated in the interim |
| O-6 | Tamil names are not held for any reference data | Blocks NFR-12. A translation exercise for 330 divisions, 8 sectors, 3 hazards and 174 indicators |
| O-7 | Asset layers for the phase-2 risk term are not loaded, and `POPULATION` and `FACILITY` are not registered at all | Blocks §6.9 only. Vulnerability is unaffected |
| O-8 | Fixed bounds not yet stated for the 134 count and extent variables | Those variables must hold until national collection completes |
| O-9 | Whether component hazard values exist for the provinces that historically supplied only a composite index | Determines whether **[P-5]** is implementable as written |

---

# Annex A — Validation rules

Codes are part of the interface contract. They may be added to; they are never
renumbered. Every message names the row, the column and the offending value, so
a provincial officer can find and fix the cell without reading this document.

| Code | Condition | Message |
|---|---|---|
| V001 | Required value missing | `Row {row}: {column} cannot be empty` |
| V002 | Duplicate division within one file | `Row {row}: division '{code}' already appears at row {prev}` |
| V003 | Unknown DS division | `Row {row}: '{code}' is not a DS division in the register` |
| V004 | Division outside the officer's province | `Row {row}: '{name}' is in {province}, outside your assigned province` |
| V005 | Hazard does not match the selected profile | `Row {row}: expected hazard '{expected}', found '{actual}'` |
| V006 | Sector does not match the selected profile | `Row {row}: expected sector '{expected}', found '{actual}'` |
| V007 | Period outside the configured ranges | `Row {row}: period '{value}' is not 2020–2025 or 2026–2030` |
| V008 | Non-numeric value in a numeric column | `Row {row}: {column} must be a number, found '{value}'` |
| V009 | Value outside the indicator's plausible range | `Row {row}: {column} = {value}, outside the expected range {min}–{max}` |
| V010 | Negative value on a non-negative indicator | `Row {row}: {column} cannot be negative` |
| V011 | Unknown indicator column | `Column '{name}' is not in the catalogue and has no alias` |
| V012 | Structure altered | `Workbook structure does not match the template: {added} added, {removed} removed, {moved} reordered` |
| V013 | Domain weights do not total 100 | `{domain} weights total {sum}%, must be exactly 100%` |
| V014 | Weight missing | `'{indicator}' has no weight. All {n} indicators in this domain must be weighted` |
| V015 | Weight out of range | `'{indicator}' weight {value} is outside 0–100` |
| V016 | File format unsupported | `Only .xlsx and .xls are accepted, received '{ext}'` |
| V017 | File too large | `File is {size} MB, the limit is {max} MB` |
| V018 | Metadata sheet missing or altered | `This does not appear to be a generated template. Download a fresh one for this profile` |
| V019 | Mixed granularity within a variable | `'{indicator}' holds a single year for {n} divisions and a period for {m}. One granularity per variable` |

**No file loads partially.** A file with one V001 loads nothing. The report
lists every failure at once so the officer makes one round of corrections rather
than discovering errors one at a time.

---

# Annex B — Catalogue summary

| | Count |
|---|---|
| Provinces | 9 |
| Districts | 25 |
| DS divisions | 330 |
| Sectors | 8 |
| Subsectors | 12 |
| Hazards | 3 |
| Canonical indicators | 174 |
| Indicator aliases | 269 |
| Distinct sector × hazard combinations | 33 |
| Province-profiles | 243 |
| Variable-to-profile memberships | 3,664 |
| Memberships awaiting a weight | 1,783 |
| Collection workbooks | 243 |
| Data rows across all workbooks | 17,826 |
| Spatial layers registered | 4 |
| Spatial operations seeded | 6 (7 with FR-6.5) |

### Indicator normalisation groups

| Group | Count | Bounds |
|---|---|---|
| Percentages (`PCT_*`) | 36 | Natural bounds 0 and 100 |
| Composite indices | 4 | Already on a fixed scale |
| Counts, extents, lengths | 134 | A ceiling must be stated, or the variable holds |

### Period aggregation

| Value | Count |
|---|---|
| `average` | 160 |
| `fixed_window` | 11 |
| `max` | 3 |

---

# Annex C — Provisional decisions

Every **[P-n]** marker in this document appears here. Each is stated in the
specification as a definite rule so the build is not blocked. If the expert
panel decides otherwise, the change is confined to what this table names.

| # | Decision as specified | Where | If reversed |
|---|---|---|---|
| **P-1** | `Vulnerability = √(Hazard × Exposure)` | §2.1, FR-4.8 | One line in the computation engine. The raw product would need band thresholds re-derived from the observed distribution, since equal intervals put about half of all divisions in the lowest band |
| **P-2** | Normalisation bounds computed across all 330 divisions nationally | §2.2, FR-4.3 | Bounds become provincial. Cross-province comparison and the national ranking must then be labelled as indicative, and the national colour scale withdrawn |
| **P-3** | Fixed bounds preferred over holding computation | §2.2, FR-4.5 | Every variable holds until national collection completes; nothing publishes until then |
| **P-4** | Five bands, half-open, at 0.2 / 0.4 / 0.6 / 0.8 | §2.7, FR-4.13 | Thresholds are configuration, so a change is a settings edit. Four bands would need the legend and the risk banding changed with it |
| **P-5** | Hazard expressed as components, not as a composite index | §2.8 | The composite index becomes the hazard domain in every profile. Scores stop being decomposable, which conflicts with §1.6 and FR-5.9. **Depends on O-9** |
| **P-6** | Equal weight applied to the exposure domain as an interim, replaced profile by profile | §5.4 | Nothing computes until all 1,225 exposure weights are supplied by hand |
| **P-7** | Periods are non-overlapping: to 2025, then 2026–2030 | §2.5 | Periods overlap at 2025 and a resolution rule is required, with the determinism fix in §8.4 becoming load-bearing |
| **P-8** | NAP relationship recorded as a crosswalk, not by restructuring sectors | §5.3, FR-1.8 | The sector table is rebuilt to the NAP's 13. Agriculture must be dissolved across two NAP sectors and 243 profiles change their sector reference |
| **P-9** | Four NAP entries registered as not assessable | §5.3 | They become assessable sectors requiring indicators, profiles and weights that do not exist |
| **P-10** | Filling gaps inside covered NAP sectors is phase 2 | §5.3 | A second collection round enters version 1 scope: new variables, workbooks and weighting for rubber, energy, marine fisheries, watershed and estate infrastructure |
| **P-11** | The fourteen intersection variables are collected as data until hazard-extent layers exist | §6.6 | Hazard-extent geometry must be sourced and loaded before those variables can be used at all |
| **P-12** | The risk layer is specified but deferred to phase 2 | §1.3, §6.9 | Risk enters version 1, requiring asset layers, the two-layer operation and the population source in O-7 |
| **P-13** | GND is a display level where data exists; community rating stays at DS division | §6.5, §6.7 | The community rating key changes to GND, and the n ≥ 10 threshold becomes far harder to reach across 14,019 units |

---

# Annex D — Requirements summary

| Group | Section | IDs | Count |
|---|---|---|---|
| Catalogue and profiles | 6.1 | FR-1.1 – FR-1.8 | 8 |
| Data collection and import | 6.2 | FR-2.1 – FR-2.11 | 11 |
| Weighting | 6.3 | FR-3.1 – FR-3.14 | 14 |
| Normalisation and computation | 6.4 | FR-4.1 – FR-4.14 | 14 |
| Map and visualisation | 6.5 | FR-5.1 – FR-5.23 | 23 |
| Spatial analysis toolbox | 6.6 | FR-6.1 – FR-6.16 | 16 |
| Community track | 6.7 | FR-7.1 – FR-7.8 | 8 |
| Scenarios and impact | 6.8 | FR-8.1 – FR-8.6 | 6 |
| Risk layer *(phase 2)* | 6.9 | FR-9.1 – FR-9.8 | 8 |
| AI assistant | 6.10 | FR-10.1 – FR-10.7 | 7 |
| Monitoring | 6.11 | FR-11.1 – FR-11.3 | 3 |
| Administration | 6.12 | FR-12.1 – FR-12.6 | 6 |
| Audit and versioning | 6.13 | FR-13.1 – FR-13.5 | 5 |
| Interoperability | 6.14 | FR-14.1 – FR-14.5 | 5 |
| Migration | 6.15 | FR-15.1 – FR-15.8 | 8 |
| **Functional total** | | | **142** |
| Non-functional | 7 | NFR-1 – NFR-20 | 20 |
| **Total** | | | **162** |

Status is deliberately absent from this table. Nothing in the application layer
is built, so a status column would read *not started* on every row and say less
than this sentence does. It is added when implementation begins.

---

*End of document.*
