# Software Requirements Specification

## Risk Radar — DS-Division Climate Vulnerability Assessment Platform, Sri Lanka

**Version** 1.3 &nbsp;·&nbsp; **Date** 31 July 2026 &nbsp;·&nbsp; **Status** For review

**Owner** Milinda &nbsp;·&nbsp; **Prepared for** GGGI and project stakeholders

> **Revision 1.1** incorporates a first-hand review of the **deployed predecessor
> system** at `riskradar.geoinfobox.com` (§1.5, Annex D). The interface is now
> defined as a continuation and correction of one real users already know.
>
> **Revision 1.2** merges the reviewed content of an independent IEEE 29148 draft
> (§1.6, Annex F). The substantive addition is a **risk layer** — `Risk = Hazard ×
> Exposure × Vulnerability` — computed on top of the existing vulnerability model
> rather than replacing it (§2.6, §6.12). Also added: AHP and entropy weighting,
> Tamil, coded validation rules, an audit log, OGC services, and Must/Should/Could
> priorities. **§2.1–2.5, §5.1–5.4 and §8 are unchanged** — the vulnerability
> model, the data foundation and the built database all stand.
>
> **Revision 1.3** responds to an independent review of v1.2. Two corrections
> matter: the risk index is now a **geometric mean** rather than a raw product
> (§2.6 — the product form put 78% of divisions in the lowest band and none in
> the highest), and the two meanings of *exposure* are now separated by name
> throughout (§2.7). Also added: an acronyms list, verification methods and a
> traceability matrix (Annex G), notifications (§6.15), and eight further
> non-functional requirements.

---

## Executive summary

Risk Radar assesses climate vulnerability for **every one of Sri Lanka's 330
Divisional Secretariat (DS) divisions**, for each combination of economic sector
and climate hazard. It replaces two things at once: a spreadsheet-based process —
243 separate provincial workbooks maintained by hand — and a **deployed first
version** that publishes vulnerability percentages it cannot explain. In their
place it puts a single database, a consistent computation method, and a public
map that shows its own working.

The platform answers one question in a defensible, repeatable way:

> *Which parts of Sri Lanka are most vulnerable to which hazard, for which sector,
> and what is that judgement based on?*

**What makes this different from a mapping exercise.** Four things are unusual
and deliberate:

1. **Every published number can be explained.** A vulnerability score is stored
   alongside the exact version of the weighting that produced it. Changing a
   weight never silently rewrites history.
2. **Three parallel evidence tracks.** Measured data, expert judgement, and
   community perception are collected in the same structure and shown side by
   side. Divergence between them is a finding, not a defect.
3. **Normalisation happens in the system, never in the spreadsheet.** All
   provinces are therefore comparable by construction rather than by convention.
4. **A gap is never drawn as a zero.** The deployed system renders an unassessed
   division and a genuinely low-risk division identically. This specification
   requires the two to be visually and structurally distinct at every layer —
   database, API and map (§6.5). For a tool intended to direct adaptation
   finance, the difference between *"we measured this and it is safe"* and
   *"nobody has looked"* is the whole point.

**Continuity with what is already running.** A first version of Risk Radar is
live and in use. Its core interaction — choose a sector, a hazard and an
administrative level, read a map — is sound and familiar, and this specification
keeps it (§1.5). What it adds is the evidence beneath the number: where the score
came from, what it is made of, when it was measured, and whether it exists at
all.

**Status at the date of this document.** The data foundation and the database
are **built and verified**. The application layer is specified and prototyped
but not yet implemented. Section 10 states precisely what exists.

---

## 1. Introduction

### 1.1 Purpose

This document specifies the requirements for Risk Radar. It is written for a
reviewing audience — funders, government counterparts and technical
reviewers — and is detailed enough for a development team to build from.

### 1.2 Scope

**In scope.** Collection of climate hazard and sector exposure indicators at DS
division level; server-side normalisation; weighted vulnerability computation
per sector × hazard × province; three evidence tracks; a public map; SSP
scenario projection; a spatial analysis toolbox; an AI assistant over project
documents; predicted-versus-actual monitoring; **migration of the deployed
system's existing assessment data** into the new model (§6.11); a **risk layer**
combining hazard, asset exposure and vulnerability (§6.12); an audit log; and
OGC-compliant interoperability.

**Out of scope for V1.** Real-time hazard forecasting or early warning; parcel-
or household-level assessment; automated ingestion from third-party APIs; and
any formal in-system approval workflow (see §3.4).

**Explicitly not carried forward.** The deployed system's data model stores a
single pre-computed percentage per unit × sector × hazard with no weights, no
domains, no time and no provenance. That structure is not extended or patched;
it is migrated into the model of §2 and retired (§6.11, Annex D).

### 1.3 Definitions

| Term | Meaning |
|---|---|
| **DS division** | Divisional Secretariat division — administrative level 3 (ADM3). The unit of assessment. 330 nationally. |
| **GND** | Grama Niladhari division (ADM4), a finer unit. Not used in V1; the deployed system uses it (§1.5). |
| **Deployed system** | The first version of Risk Radar, live at `riskradar.geoinfobox.com`. Referred to throughout as *the deployed system*, never as "the legacy system" — it is in service. |
| **Assessed** | A division for which a vulnerability score has been computed from a complete, weighted profile. |
| **Unassessed** | A division for which no value has been entered. **Distinct from a score of zero.** |
| **Pending** | A division whose profile has values but at least one unweighted variable, so no score may be computed (§5.4). |
| **Coverage** | The count and proportion of divisions that are *assessed* within the current map selection. |
| **Variable / indicator** | A measurable quantity, e.g. *No. of flood events 1974–2023*. |
| **Domain** | Whether a variable expresses **hazard** or **exposure**. |
| **Profile** | The set of variables and weights defining vulnerability for one sector × hazard × province. |
| **Track** | The provenance of a value: `data`, `expert` or `community`. |
| **Period** | A year range a value describes, e.g. 2020–2025. |
| **SSP** | Shared Socioeconomic Pathway (SSP1–SSP5), the IPCC scenario framework. |

### 1.3a Acronyms

| | | | |
|---|---|---|---|
| **ADM1/2/3/4** | Administrative level 1–4 | **AHP** | Analytic Hierarchy Process |
| **API** | Application Programming Interface | **CR** | Consistency Ratio (AHP) |
| **CRS** | Coordinate Reference System | **CSRF** | Cross-Site Request Forgery |
| **DDL** | Data Definition Language | **DRF** | Django REST Framework |
| **DS** | Divisional Secretariat | **EPSG** | European Petroleum Survey Group (CRS registry) |
| **ERD** | Entity-Relationship Diagram | **GGGI** | Global Green Growth Institute |
| **GND** | Grama Niladhari Division | **HSTS** | HTTP Strict Transport Security |
| **IPCC** | Intergovernmental Panel on Climate Change | **JWT** | JSON Web Token |
| **LLM** | Large Language Model | **MVT** | Mapbox Vector Tile |
| **OGC** | Open Geospatial Consortium | **pgvector** | PostgreSQL extension for vector similarity |
| **PostGIS** | Spatial extension for PostgreSQL | **RBAC** | Role-Based Access Control |
| **SLD99** | Sri Lanka Datum 1999 (EPSG:5235) | **SRS** | Software Requirements Specification |
| **SSP** | Shared Socioeconomic Pathway | **WCAG** | Web Content Accessibility Guidelines |
| **WFS/WMS/WMTS** | OGC Web Feature / Map / Map Tile Service | **WSGI/ASGI** | Python web server gateway interfaces |

### 1.4 References

| Artefact | Location |
|---|---|
| System architecture (Figure 1) | `design/architecture/system-architecture.svg` |
| Data flow (Figure 5) | `design/architecture/data-flow.svg` |
| Entity-relationship diagram (Figure 7) | `design/database/erd.svg` |
| Database schema (DDL) | `design/database/schema.sql` + addenda |
| Variable catalogue | `design/ingestion/FINAL_VARIABLES.xlsx` |
| DS-division register | `design/ingestion/dsd_register.csv` |
| Data-collection workbooks | `design/templates/generated/` (243 files) |
| Map figures (Figures 2, 3, 4, 6) | `design/srs/figures/map-*.png`, `generate_maps.py` |
| Interactive prototype | `design/ui/risk-radar-ui-prototype.html` |
| **Deployed system — review of findings** | `design/LIVE_SYSTEM_REVIEW.md` (summarised in Annex D) |
| **Deployed system — UI redesign brief** | `design/ui/UI_REDESIGN_BRIEF.md` |
| **Frontend code review** | `design/ui/FRONTEND_CODE_REVIEW.md` |
| **Map-first data entry workflow** | `design/ui/DATA_ENTRY_WORKFLOW.md` |
| **IEEE 29148 draft — integration analysis** | `design/srs/SRS_INTEGRATION_GEMINI.md` |
| Live decisions and issues log | `PROGRESS_TRACKER.md` |

### 1.5 Relationship to the deployed system

A working version of Risk Radar is **already live and public** at
`riskradar.geoinfobox.com`, with a Django REST API behind it. It was inspected
first-hand on 30 July 2026. This specification is written as its successor, and
that inspection changed several requirements below. Annex D records the findings;
this section states what they mean for the design.

#### What the deployed system does well, and this specification keeps

These are not accidents and they are not up for redesign:

1. **The map is the application.** There is no dashboard standing between the
   user and the geography. Correct for this audience, and retained.
2. **Three controls: sector, hazard, administrative level.** This is the mental
   model users already hold. §6.5 extends it; it does not replace it.
3. **Four administrative levels** — province, district, DS division, GND — with a
   province filter for drilling in.
4. **Map, ranking chart and value table on one screen.** Seeing the ordering
   beside the geography is more useful than either alone.
5. **Public read access with no login**, which §3 states as a requirement.
6. **Print output**, which is unglamorous and evidently used in practice.

#### What it cannot do, and why that drives this document

The deployed system stores **one number per unit × sector × hazard**: a
percentage computed somewhere else and typed in. Everything absent from it
follows from that single decision.

| Question a user cannot ask today | Where this specification answers it |
|---|---|
| Is this division low-risk, or simply not yet assessed? | §6.5, FR-5.8 to FR-5.10 |
| What is this score made of? | §6.5, FR-5.4 |
| How much is hazard, how much is exposure? | §2.1, §6.4 |
| Which variables, at what weights? | §6.3, §6.5 |
| Measured, expert or community? | §2.5, §6.5 |
| Which year or period? | §2.4, §6.5 |
| Who supplied it, and when? | §7, NFR-1 |
| Has it changed since last time? | §6.1, FR-1.6 |

**The most serious of these is the first.** At DS-division level the deployed map
renders most divisions as `0.0%` and leaves them uncoloured; its three-band
legend begins at 1%, so zero falls outside every band. Districts including
Colombo, Galle, Kalutara, Badulla, Kilinochchi, Mannar and Mullaitivu display
`0.0%` — which cannot be a genuine assessment result for any of them. A reader
would reasonably conclude those areas are safe.

This is why "unassessed", "pending" and "assessed" are defined in §1.3 as three
distinct states and required to remain distinct in the database, the API and the
map. It is a correctness requirement, not a presentation preference.

#### Reference-data divergence

| | Deployed | This specification |
|---|---|---|
| Sectors | **15** | 8 |
| Hazards | **20** | 3 — Drought, Flood, Landslide |
| Finest unit | GND (ADM4) | DS division (ADM3) |

The deployed taxonomy is broader, including Coastal & Marine, Ecosystems &
Biodiversity, Health and Energy, and hazards such as sea level rise, salt water
intrusion and coastal erosion. The catalogue specified here covers what the 243
provincial workbooks actually contain. **Whether the wider taxonomy is intended
future scope or aspirational leftovers is an open item (O-7), not an assumption**
— §6.11 requires the migration to preserve any sector or hazard carrying real
data regardless of which way that decision goes.

The deployed reference data also carries spelling errors that would otherwise
persist as codes — *"Changers in Rainfall Pattern"*, *"Lightening"*, *"High
Intencity Rainfall"*, *"Deforestration"*. FR-11.4 requires correction on
migration with the original retained as an alias.

### 1.6 Relationship to the IEEE 29148 draft

An independent specification — *AI-Enabled National Disaster Risk & Vulnerability
WebGIS Platform* — was drafted against the same problem without sight of what had
been built. It is stronger than this document in structure and breadth: 20
modules, ~180 requirements, formal Must/Should/Could prioritisation, personas and
a traceability matrix.

It was merged selectively. Six modules closed genuine gaps and were adopted; nine
described capabilities already present and contributed rigour rather than
substance; three were deferred to Annex F; two were rejected because they
contradict working code. The full module-by-module decision is in
`SRS_INTEGRATION_GEMINI.md`.

**Three things it caught that this document had missed** and that are now
requirements: **Tamil** (NFR-8 previously specified English and Sinhala only,
which is a compliance failure for a Sri Lankan government platform), an **audit
log** (none of the 28 tables recorded who changed what), and **OGC services**
(nothing exposed the data to other agencies without sending a file).

**The substantive addition is risk** (§2.6). The draft uses the Sendai/IPCC
equation `Risk = Hazard × Exposure × Vulnerability`; this document computes
`Vulnerability = f(Exposure, Hazard)`. Rather than choose, the risk layer is
computed **on top of** the existing model — see §2.6 for why that is coherent
rather than a fudge.

---

## 2. The vulnerability model

### 2.1 The formula

For each DS division *d*, sector *s* and hazard *h*:

```
Vulnerability(d, s, h)  =  f( Exposure(d, s, h) , Hazard(d, h) )
```

Both sides are weighted composites of normalised indicators:

```
Hazard index(d,h)    = Σ  wᵢ × normalised(vᵢ, d)      for hazard-domain variables
Exposure index(d,s,h)= Σ  wⱼ × normalised(vⱼ, d)      for exposure-domain variables

with   Σ wᵢ = 100   and   Σ wⱼ = 100     (each domain sums independently)
```

Every index lies in [0, 1]. Weights are percentages that must total 100 **within
each domain separately** — a hazard set and an exposure set, never pooled. This
is enforced in the database, not merely by convention (§6.3).

### 2.2 Directionality

Not every indicator raises vulnerability. Forest cover and piped-water coverage
reduce it. Each variable therefore carries a **relationship** within its profile:

- `+` higher value raises vulnerability
- `−` higher value lowers vulnerability

Direction is a property of the variable *in that profile*, because the same
variable can behave differently in different contexts.

### 2.3 Why weights vary by province

The same sector × hazard can legitimately be weighted differently in different
provinces — drought matters differently to paddy in the Dry Zone than in the Wet
Zone. The system therefore holds **243 province-scoped profiles** derived from
33 national sector × hazard definitions.

### 2.4 Year ranges, not single years

Data is collected for **periods** (2020–2025 and 2025–2030), not individual
years. Two rules govern interpretation:

**Rule 1 — a period value is a typical year, not a multi-year total.** Selected
because it is the only reading valid for both stock variables (population,
extent, percentages) and flow variables (production, event counts). Summing a
stock across six years would inflate it sixfold.

**Rule 2 — where periods overlap, the later period wins.** 2025 belongs to both
ranges; a query for 2025 resolves to the 2025–2030 value, so no year is ever
counted twice.

Per-variable exceptions are held in the catalogue as `period_aggregation`:

| Rule | Count | Meaning |
|---|---|---|
| `average` | 160 | A typical year within the period (default) |
| `fixed_window` | 11 | The variable defines its own window (e.g. *flood events 1974–2023*); identical in both periods |
| `max` | 3 | Already a maximum over a fixed historical window |

*These classifications are provisional pending expert-panel sign-off; see §11.*

### 2.5 The three tracks

| Track | Source | Purpose |
|---|---|---|
| **Data** | Measured values via workbook import or manual entry | The authoritative assessment |
| **Expert** | Domain specialists supplying values from knowledge | Coverage where measurement is absent; a check on the data |
| **Community** | General users rating severity 1–5 | Lived experience; surfaces perception gaps |

All three share one schema and are separated by a `source` column, so they are
directly comparable. Community averages are published only once **n ≥ 10** to
protect representativeness.

### 2.6 The risk layer

Vulnerability answers *how badly would this division cope*. It does not answer
*how many people are in the way*. Risk does, using the Sendai Framework and IPCC
AR5 formulation:

```
Risk(d, s, h)  =  ( Hazard(d,h) · AssetExposure(d,s,h) · Vulnerability(d,s,h) ) ^ (1/3)
```

**Why the cube root, and not the raw product.** All three terms lie in [0, 1], so
their product is heavily compressed toward zero — three independent terms averaging
0.5 give a product of 0.125. Applying the same five-band classification used for
vulnerability to a raw product puts roughly **78% of divisions in the lowest band
and none in the highest**, which is not a finding about Sri Lanka but an artefact
of multiplying fractions.

The geometric mean preserves everything that makes the multiplicative form correct
— if any one of hazard, asset exposure or vulnerability is zero then risk is zero,
and no term can be compensated for by another — while returning a value on the same
scale as its inputs, so risk and vulnerability can share a legend and be compared
without a mental conversion.

**Why this does not conflict with §2.1** is a question of vocabulary, and §2.7
settles it.

**What is genuinely new is the asset-exposure term**, and it does not need new
data collection. It is a spatial-toolbox output: the intersection of a hazard
zone with population, buildings, roads and facility layers — the operations
already defined in §6.7 and seeded in the database.

**Nothing already built changes.** The 174 variables keep their two domains, the
243 profiles keep their weights, and the vulnerability index is computed exactly
as before. Risk is a further step that consumes it.

### 2.7 Two kinds of exposure, named apart

The word *exposure* carries two distinct meanings in this document, and using one
word for both would be the sort of ambiguity that survives review and then
surfaces as a defect. They are therefore named apart:

| Term used | Meaning | Where it lives |
|---|---|---|
| **Exposure characteristics** | Properties of the exposed system that shape how badly it would fare — cropped extent, dependence on the sector, share of livelihoods derived from it | One of the two weighted domains inside vulnerability (§2.1) |
| **Asset exposure** | The quantity of people and assets physically in harm's way — population, buildings, kilometres of road, schools, hospitals | A term in the risk index (§2.6) |

Both readings are current in the literature; neither is wrong. What would be wrong
is letting a reader think a division scoring high on one necessarily scores high on
the other. A sparsely populated division growing a drought-sensitive crop has high
exposure characteristics and low asset exposure. That distinction is the entire
value of computing both.

**One name is fixed and cannot change.** The database enumerates the vulnerability
domains as `hazard` and `exposure`, and 3,664 rows across 243 profiles carry those
values. The stored token stays `exposure`; every label, legend, export header, API
field name and screen caption reads **exposure characteristics** or **asset
exposure**, never a bare "exposure" (FR-5.16).

---

## 3. Actors and roles

| Actor | Capabilities |
|---|---|
| **Public / guest** | View the map and all published results. **No login required.** |
| **Data Officer** | Import workbooks and enter values for their province; confirm and edit weights; view their submissions. |
| **Expert** | Submit expert-track values; adjust weights; add variables from expertise. |
| **General User** | Submit 1–5 severity ratings with optional comment and photo. |
| **Administrator** | Manage users and registration requests; approve proposed catalogue variables; edit any profile's weights; revert to an earlier version. |

Public read access without authentication is a deliberate transparency
requirement: authentication exists to control *contribution*, not *viewing*.

**This is a narrow exception, not a default.** In the deployed system the same
principle was implemented as an absence of enforcement rather than a grant, and
the result is that every endpoint — including write endpoints — is open to
anonymous users (Annex D, S-1). NFR-4 therefore requires the framework default to
be *deny*, with public read granted explicitly and read-only on the specific
endpoints that serve the map.

### 3.4 Note on approval

**V1 contains no in-system approval workflow.** Data is validated against a
**local expert panel offline**; once that panel has signed off, the data officer
or administrator saves directly. The sign-off is recorded as free text against
the saved weighting (`panel_note`), so provenance survives without imposing a
gate the organisation does not use. This was a deliberate simplification.

---

## 4. System overview

![](../architecture/system-architecture.png)

**Figure 1 — System architecture.** Solid borders denote components built and
verified; dashed borders denote components specified but not yet implemented.

The system is a conventional three-tier web application:

- **Frontend** — React + TypeScript with MapLibre GL for the map.
- **Backend** — FastAPI (Python), exposing a REST API.
- **Store** — a single PostgreSQL instance with **PostGIS** for geometry and
  **pgvector** for the AI retrieval index. One database, not three systems.

The AI assistant is an additional retrieval layer over the same store.

**Relationship to the running deployment.** The deployed system is Django + DRF
against its own PostgreSQL database. The two are **not merged**. This system is
stood up alongside it, the deployed `vulndata` table is migrated into
`indicator_value` (§6.11), and cut-over happens once coverage is verified. The
deployed system is then retired rather than left routed — it currently still
serves a superseded `oldvulndata/` endpoint, and carrying two generations of
dead routes forward a second time is how that happened.

**Geometry is served as tiles, not as a GeoJSON payload.** The deployed system
sends raw GeoJSON to the browser, which is why its DS-division layer takes around
twenty seconds to draw and once locked the renderer past a thirty-second
threshold. At GND level the same approach would ask the browser to hold 14,019
polygons. The API therefore serves vector tiles generated by PostGIS
(`ST_AsMVT`), with per-zoom simplification (NFR-3).

---

## 5. Data foundation

This section describes what has been assembled and loaded. It is stated in
detail because the credibility of every downstream number rests on it.

### 5.1 Geography

| Measure | Value |
|---|---|
| DS divisions (ADM3) | **330** |
| Districts (ADM2) | 25 |
| Provinces (ADM1) | 9 |
| Coordinate reference (storage) | EPSG:4326 (WGS 84) |
| Coordinate reference (measurement) | EPSG:5235 (SLD99) |
| Total area computed | **65,976.7 km²** |

Boundaries come from official ADM1/ADM2/ADM3 shapefiles. The source files carried
**no parent columns**, so each division's district and province were derived by
maximum-area spatial overlap. The result was unambiguous: every division sits at
least 95% inside a single parent, there are no overlapping polygons, and the
divisions tile the country to within 0.054% (coastal generalisation).

Area is computed in EPSG:5235 rather than EPSG:4326. Computing area in a
geographic CRS yields degrees, not metres — a common and silent error. The
computed national total lands within 0.6% of the commonly quoted 65,610 km²,
which is itself evidence the projection handling is correct.

![](figures/map-01-ds-divisions.png)

**Figure 2 — The assessment geography.** All 330 DS divisions, coloured by
province. This is the geometry held in the database and the unit every
vulnerability score is computed for.

![](figures/map-04-hierarchy.png)

**Figure 3 — Administrative hierarchy.** Provinces (ADM1), districts (ADM2) and
DS divisions (ADM3). Assessment happens at ADM3; the levels above are used for
aggregation, filtering and access control. Each level nests exactly inside the
one above — province-derived-via-district matches province-derived-directly for
all 330 divisions, which is how the spatial join was validated.

![](figures/map-02-area.png)

**Figure 4 — Area per DS division.** Divisions vary widely in size, from
compact urban divisions in the west to large divisions in the north and east.
This matters for interpretation: an absolute count means something different in
a 20 km² division than in a 1,000 km² one, which is why several catalogue
variables are expressed as densities or percentages rather than counts.

This figure also demonstrates the choropleth rendering the vulnerability map
uses — the same geometry, shaded by a different attribute.

### 5.2 Variable catalogue

| Measure | Value |
|---|---|
| Canonical variables | **174** (162 exposure, 12 hazard) |
| Sectors | 8 |
| Subsectors | 12 |
| Hazards | 3 — Drought, Flood, Landslide |
| National profiles (sector × hazard) | **33** |
| Province-scoped profiles | **243** |
| Variables per profile | 6 to 25 |
| Aliases (historic names → canonical code) | 269 |

The catalogue was consolidated from 311 raw variable descriptions found across
the legacy provincial workbooks. An automated deduplication pass proposed 213
canonical variables; this was then **superseded by an expert-refined list**,
which assigned official codes per sector and hazard. The alias table preserves
every historic spelling so legacy sheets remain importable.

### 5.3 Data-collection instruments

**243 workbooks** were generated — one per province × sector × hazard — covering
**17,826 data rows**. Each contains two period tabs with all DS divisions of that
province pre-filled and locked, a variable dictionary, a reference-only weights
tab, and a hidden metadata sheet the importer validates against.

Workbooks are **generated from the catalogue**, never hand-authored, so the
collection instrument and the database cannot drift apart.

### 5.4 Weight coverage

Of **3,664** variable-to-profile memberships, **1,881 (51%)** carry a weight
inherited from the legacy provincial workbooks. The remaining **1,783** belong to
variables the expert refresh newly added and have no weight yet.

This is tracked explicitly rather than hidden: a null weight means *this variable
belongs to the profile but has not yet been weighted*. The engine **refuses to
compute** a vulnerability score for any profile with an unweighted variable
(§6.3). No partial or provisional score is ever published.

Combined with §6.5, this yields the three states a division can be in on the map:

| State | Meaning | Map treatment |
|---|---|---|
| **Assessed** | Complete weighted profile, score computed | Choropleth colour |
| **Pending** | Values present, at least one weight missing | Outlined, hatched, labelled *Pending* |
| **Unassessed** | No values entered | Neutral grey, labelled *No data* |

### 5.5 The deployed system's existing dataset

The deployed system holds its assessments in a single `vulndata` table keyed on
`gnd_id · sector · hazard`, carrying one `value`. It is the only body of
vulnerability data currently published, and it must be migrated rather than
discarded.

| Concept | Deployed | This specification |
|---|---|---|
| Hazard / exposure split | one combined `value` | two domains, indexed separately |
| Weights | none | `profile_indicator`, Σ100 per domain, versioned |
| Direction (+/−) | none | per variable, per profile |
| Time | none | `year_start` / `year_end`, period rules |
| Provenance track | none | `data` / `expert` / `community` |
| Raw vs normalised | one pre-computed value | raw stored, normalised server-side |
| Explainability | score cannot be decomposed | result pins the exact profile version |
| Indicator catalogue | none | 174 canonical variables + 269 aliases |

**This is the substantive gap.** The deployed system stores a *conclusion* — a
percentage worked out elsewhere. This specification stores the *evidence* and
computes the conclusion, which is what makes a score explainable, reproducible
and comparable between provinces.

The consequence for migration is that a deployed `value` cannot become an
`indicator_value`: it is a composite, not an indicator. FR-11.2 therefore
migrates it as an **archived historical result** with its profile version
recorded as *pre-migration, composition unknown*, so it can be shown and compared
but never presented as though its provenance were known.

---

## 6. Functional requirements

**Priority convention.** Every requirement is **Must** unless tagged. `(Should)`
means important but not release-blocking; `(Could)` means desirable, first to be
cut. Requirements deferred entirely are in Annex F rather than here.

**Identifier convention.** A requirement ID is a **stable name, not a position**.
IDs are assigned when a requirement is written and never reused or renumbered, so
that a defect report, a test case or a review comment citing FR-5.4 means the same
thing a year from now. Requirements are grouped for reading, which means IDs do
not always ascend down the page. Annex G lists every requirement in numeric order.

**Verification.** Each group states how its requirements are to be verified —
by **test** (automated), **demonstration** (exercised against the running system),
**inspection** (code or configuration reviewed) or **analysis** (reasoned from
design). Annex G carries the per-requirement matrix.

### 6.1 Catalogue and profiles

| ID | Requirement |
|---|---|
| FR-1.1 | The system shall hold all indicators in a configurable catalogue. Adding a hazard, sector or variable shall be data entry, not a code change. |
| FR-1.2 | Each variable shall have a globally unique code, a name, a domain, a normalisation method and scope, a default direction, a status (`pending`/`active`/`retired`) and a period-aggregation rule. |
| FR-1.3 | The system shall maintain aliases mapping historic names to canonical codes, and shall use them to resolve columns during import. |
| FR-1.4 | A profile shall define, for one sector × hazard × province, the variable set with a weight and direction for each. |
| FR-1.5 | Only `active` variables may join a profile. A variable proposed during import shall be created as `pending` and require administrator approval. |
| FR-1.6 | Every change to a profile's weighting shall create a **new version**. Previous versions and the results computed from them shall be retained. |

### 6.2 Data collection and import

| ID | Requirement |
|---|---|
| FR-2.1 | The system shall generate a download template per profile, with DS divisions pre-filled and locked. |
| FR-2.2 | On upload, the system shall validate structure against the workbook's embedded metadata and reject files with added, removed or reordered columns. |
| FR-2.3 | Validation failures shall be reported per cell, with the file identified, and shall not partially load. Validation of a full-size workbook — the largest generated template carries 17,826 rows — shall complete within 30 seconds, and shall report **every** failure in one pass so the officer makes one round of corrections rather than discovering errors one at a time. |
| FR-2.4 | The importer shall read the workbook's weights tab and pre-fill the confirmation screen. Values in the workbook are advisory; the confirmed values are authoritative. |
| FR-2.5 | Uploaded values shall be stored **raw**, in native units. The system shall never accept pre-normalised input. |
| FR-2.6 | Each imported value shall be linked to its source file so an import can be reversed as a unit. |
| FR-2.7 | Legacy or ad-hoc spreadsheets shall be importable via a reconciliation path that proposes catalogue matches for unrecognised columns. |
| FR-2.8 | Manual entry shall be available for single-division updates, generated from the same catalogue. |
| FR-2.9 | Validation failures shall use the **coded rule set in Annex E**, each with a stable code and a fixed message format naming the row, the column and the offending value. Codes are part of the interface contract: they may be added to, but not renumbered. |

### 6.3 Weighting

| ID | Requirement |
|---|---|
| FR-3.1 | Weights shall be entered in the application, not carried by the data file. |
| FR-3.2 | On every import the officer shall be shown the profile's weights pre-filled and editable, with variables lacking a weight visually distinguished. |
| FR-3.3 | The system shall refuse to save a weighting unless each domain totals **exactly** 100% and no weight is blank. Weights are stored as exact decimals to three places, not floating point, so exactness is always achievable and no tolerance is required or permitted — 33.333 + 33.333 + 33.334 is exactly 100.000. Clients shall round to three decimal places before submission; a total of 99.999 is a rejection, not a rounding matter. |
| FR-3.3b | Where a domain does not total 100, the screen shall show the shortfall or excess and offer to distribute it across the unweighted or least-recently-edited indicators. The system helps the user reach exactly 100 rather than relaxing the rule. |
| FR-3.4 | Saving shall take effect immediately and create a new profile version; no approval step shall block it. |
| FR-3.5 | An optional expert-panel sign-off note shall be recorded with each saved weighting. |
| FR-3.6 | Weights shall be editable at any time from a dedicated screen, showing full change history: version, author, date, source file and sign-off note. |
| FR-3.7 | The system shall expose which profiles are computable and which are awaiting weights. |
| FR-3.8 | The system shall support the following weight-derivation methods: **direct entry** (default), **equal weight**, **AHP** and **entropy**. Whichever is used, the stored result is the same per-domain percentage set, so downstream computation is unaffected. |
| FR-3.9 | For **AHP**, the system shall present a pairwise comparison matrix on Saaty's 1–9 scale, derive the priority vector, and compute the **consistency ratio**. Where CR > 0.10 the system shall warn that the comparisons are internally contradictory and shall not permit the weighting to be saved without acknowledgement. |
| FR-3.9b | Acknowledgement of a consistency ratio above 0.10 shall require a **free-text justification**, which shall be stored with the weighting version and written to the audit log. A checkbox is not sufficient: the point is to record why an expert stood by an internally contradictory comparison, so a later reader can judge it. |
| FR-3.10 | For **entropy**, the system shall derive weights objectively from the dispersion of the indicator values themselves, and shall state plainly that the result reflects the data rather than expert judgement. `(Should)` |
| FR-3.11 | The method used shall be stored with the weighting version, alongside its inputs — the comparison matrix for AHP, the source values for entropy — so any weight set can be re-derived and audited. |

### 6.4 Computation

![](../architecture/data-flow.png)

**Figure 5 — Vulnerability data flow.**

| ID | Requirement |
|---|---|
| FR-4.1 | Normalisation shall be performed server-side for all tracks identically, per the method and scope configured on each variable. |
| FR-4.2 | Normalised values shall lie in [0, 1]. |
| FR-4.3 | Normalisation scope shall be configurable as pooled across periods, per period, or fixed bounds, so results remain comparable over time. |
| FR-4.4 | The engine shall apply each variable's period-aggregation rule and shall resolve overlapping periods by preferring the later period. |
| FR-4.5 | The engine shall compute a hazard index and an exposure index per DS division, then combine them into a vulnerability index. |
| FR-4.6 | The engine shall **refuse to compute** any profile containing an unweighted variable, and shall report which are missing. |
| FR-4.7 | Each stored result shall reference the exact profile version used. |
| FR-4.8 | Where a value is missing for a period, the most recent prior value shall be carried forward. The carried value shall retain its original track, contributor and source, shall record the period it came from, and shall be marked as carried at the point of storage — not inferred later. |
| FR-4.8b | A carried-forward value shall be visible as such: annotated *"carried from {period}"* in the detail panel, counted separately in the coverage statement (§6.5), and excluded from any claim that a division was assessed for the period displayed. |
| FR-4.9 | Normalisation bounds shall not shift under a partially entered province. Where a profile's divisions are incompletely entered, the system shall either hold computation until the set is complete or normalise against fixed configured bounds, per the scope set on each indicator (FR-4.3). It shall never silently re-derive minimum and maximum from whichever divisions happen to have been entered so far, because that makes every published score move when the last division arrives. |

### 6.5 Map and visualisation

The map is the application. Its structure is inherited from the deployed system
— sector, hazard and administrative level, with the ranking and value table
beside the geography — because that structure works and users know it (§1.5).
The requirements below extend it in four directions: **honesty about coverage**
(FR-5.8 to FR-5.11), **explanation of the score** (FR-5.4), **time** (FR-5.12),
and **performance at the levels that matter** (FR-5.1b).

#### Core map

| ID | Requirement |
|---|---|
| FR-5.1 | The system shall publish a choropleth of the real administrative boundaries (Figure 2), rendered with MapLibre GL, accessible without login. |
| FR-5.1b | Geometry shall be delivered as **vector tiles** generated server-side with per-zoom simplification. The map shall remain interactive at national extent at every administrative level, including GND (NFR-3). |
| FR-5.1c | The system shall offer province, district and DS-division layers. A GND layer shall be offered only where GND data exists, and shall not render at national extent below a defined zoom threshold. |
| FR-5.2 | Users shall filter by province, sector, subsector and hazard. Subsector shall be a first-class filter, not folded into sector. |
| FR-5.3 | Users shall switch between the three tracks, and view them side by side. |
| FR-5.5 | Context layers (land use, water, roads, buildings) shall be toggleable with adjustable opacity. |
| FR-5.7 | Community averages shall be shown only where n ≥ 10, always with n displayed. Where 10 ≤ n < 30 the average shall additionally carry a **low-confidence** marker, so a threshold crossed by one rating does not read with the same authority as one crossed by fifty. |
| FR-5.7b | Community submission shall be rate-limited: one rating per contributor per division per sector × hazard × period, replaceable but not additive. The system shall reject unauthenticated bulk submission and shall flag for review any contributor submitting more than 20 ratings in a session. Without this, ten submissions from one person clear the n ≥ 10 publication threshold and the community track becomes the easiest number in the system to fabricate. |
| FR-5.18 | The map shall carry a **summary panel** for the current selection: the highest- and lowest-scoring divisions, the distribution across the five bands, coverage (§6.5), and — where risk is displayed — asset exposure in native units (FR-12.6). This serves the reader who needs the headline figure without interpreting a choropleth. `(Should)` |
| FR-5.19 | The system shall encode the full map selection — indicator shown, sector, subsector, hazard, period, track, administrative level, extent and active layers — in a **shareable URL**, and authenticated users shall be able to save named bookmarks of that state. `(Should)` |
| FR-5.13 | The map view shall be printable and exportable, preserving the legend, the coverage statement (FR-5.10) and the selection in force. |

#### Explaining the score

| ID | Requirement |
|---|---|
| FR-5.4 | Selecting a division shall show: its vulnerability score; the **hazard index and exposure index separately**; every contributing variable with its weight, direction and raw value; the profile version used; the track; the period; and the contributing user and date. |
| FR-5.4b | The detail panel shall show the division's scores across the other hazards for the same sector, for context. |
| FR-5.4c | No published score shall be displayed anywhere in the interface without a route to its composition. A number the user cannot interrogate is the defect this system exists to correct. |
| FR-5.6 | Where a profile contains unweighted variables, the map shall state that the profile is not computable and shall not display a partial composition as though it were complete. |

#### Coverage — assessed, pending, unassessed

These requirements exist because the deployed system fails them, with the
consequences described in §1.5.

| ID | Requirement |
|---|---|
| FR-5.8 | The system shall represent **assessed**, **pending** and **unassessed** as three distinct states, carried through the database and the API, not derived in the browser. |
| FR-5.9 | The three states shall be **visually distinct** on the map and in every table. An unassessed unit shall never be rendered, exported or tabulated as a value of zero, blank, or 0.0%. |
| FR-5.10 | Every map view shall display a **coverage statement** for the current selection, in the form *"n of N divisions assessed"*, with pending and unassessed counts available. |
| FR-5.11 | The legend shall define a band for every value the map can display, including zero. A genuine score of zero shall be distinguishable from an absent one by shape or pattern, not by colour alone (NFR-9). |

#### Time

| ID | Requirement |
|---|---|
| FR-5.12 | The user shall select the assessment period (§2.4). The period in force shall be visible on the map at all times and included in any export. |
| FR-5.12b | Where a division has results for more than one period, the detail panel shall show the change between them. |
| FR-5.12c | A **time slider** shall step the map through available periods with play, pause and step controls, animating the change in the choropleth. |
| FR-5.12d | A **swipe tool** shall compare two periods, tracks or hazards under a draggable divider, and a **split view** shall show them side by side. |
| FR-5.12e | The system shall report period-over-period change per division — absolute, percentage, and direction. `(Should)` |

#### Interface states

| ID | Requirement |
|---|---|
| FR-5.14 | Loading, empty and error states shall be explicit. A failed request shall produce a message naming what failed; no view shall present an indefinite spinner. |
| FR-5.15 | The interface shall derive authentication state from the API, not from client-side state. Where the API reports the session invalid, the user shall be told and offered re-authentication. |
| FR-5.16 | Terminology shall match the method. **Vulnerability** results shall be labelled vulnerability and **risk** results risk, in legends, headings, tooltips, exports and API field names; neither term shall ever be used for the other. Following §2.7, a bare "exposure" shall not appear anywhere in the interface: the label reads **exposure characteristics** or **asset exposure**. |
| FR-5.17 | Every published view shall carry a link to the methodology and the date the displayed results were computed. |

### 6.6 Scenarios and impact

| ID | Requirement |
|---|---|
| FR-6.1 | The system shall support SSP1–SSP5 scenarios. Each scenario shall hold a set of **per-indicator adjustments** — a multiplier, an additive offset, or an absolute override — together with a horizon year and a citation for where the adjustment came from. Adjustments shall be configurable by an administrator without a code change, consistent with the catalogue-as-data principle (§8). |
| FR-6.1b | A projection shall apply the scenario's adjustments to baseline indicator values, then run the unchanged normalisation and weighting pipeline. A scenario changes the inputs, never the method — so a projected score and an observed score remain comparable. |
| FR-6.1c | Every projection shall record the scenario, the horizon, and the exact adjustment set applied, so it can be reproduced after the scenario definition is revised. |
| FR-6.2 | The system shall project sector and subsector impact per DS division under a selected scenario and horizon. |
| FR-6.3 | Projections shall be stored distinctly from observed assessments and never conflated on the map. |

### 6.7 Spatial analysis toolbox

This is what makes the platform a web-GIS rather than a mapping viewer. Many
vulnerability indicators are not collected as numbers at all — they are
*derived* from geometry. "% of forest cover", "flood-affected road length",
"buildings in a landslide-prone area" and "% water surface area" are all
questions about the intersection of a map layer with a DS division. The toolbox
computes them, in the database, against the same 330 polygons the map draws.

| ID | Requirement |
|---|---|
| FR-7.1 | Spatial layers shall be registered in a catalogue with a national attribute contract, validated on import. No layer shall require a new table. |
| FR-7.2 | The toolbox shall provide area, length, count, share, density and distance operations per DS division. |
| FR-7.3 | Area and length shall be computed in EPSG:5235. |
| FR-7.4 | Toolbox output shall be written as a **result awaiting review**, never directly as an indicator value. |
| FR-7.5 | A user shall explicitly commit a result before it becomes an indicator value, and the committed value shall retain a link to the job that produced it. |
| FR-7.6 | The user shall be able to review results on the map before committing, and to discard them. |
| FR-7.7 | Vector layers shall be importable from shapefile, GeoJSON or GeoPackage, and reprojected to EPSG:4326 on import. |
| FR-7.8 | **Raster support is deferred to Phase 2** (Annex F). All six V1 toolbox operations produce vector-derived scalar results, so raster ingestion adds no capability until zonal-statistics operations exist. This is a real limitation and is stated rather than left implicit: rainfall, elevation and temperature surfaces are natively raster, and until Phase 2 those indicators must be supplied as pre-computed per-division values through the workbook rather than derived in the system. |
| FR-7.9 | Remote OGC layers (WMS, WFS) shall be registrable as reference layers for display and visual context, without being copied into the database. `(Should)` |

**Operations available.** Six are defined and seeded in the database:

| Code | Kind | Output | Question it answers |
|---|---|---|---|
| `AREA_KM2` | area | km² | How much of this layer falls in each division? |
| `LENGTH_KM` | length | km | How much road, river or coastline does each division contain? |
| `FEATURE_COUNT` | count | count | How many features — wells, schools, intake points? |
| `AREA_SHARE_PCT` | share | % | What proportion of the division is forest, paddy or water? |
| `DENSITY_PER_KM2` | density | per km² | How concentrated are those features? |
| `DIST_TO_NEAREST` | distance | km | How far is each division from the coast, a river or a facility? |

Each accepts an optional attribute filter, so a single land-cover layer can
answer "% forest", "% paddy" and "% built-up" without three separate imports.

![](figures/map-03-toolbox.png)

**Figure 6 — Worked example.** `DIST_TO_NEAREST` run against the real 330
divisions, measuring distance to the coastline. The gradient from the coast to
the central highlands is exactly the kind of derived exposure variable the
toolbox produces. Fifty-four divisions lie within 5 km of the sea; the furthest
inland is 107 km.

**Why a two-step commit.** A calculation is not an assertion. The toolbox writes
to `computation_result`, and only an explicit user action promotes a result into
`indicator_value`. A database constraint makes a computed value without an
originating job impossible, so any derived number can always be traced back to
the layer, operation and parameters that produced it. Without this, a
plausible-looking but wrongly-parameterised calculation could quietly become
official data.

### 6.8 AI assistant

| ID | Requirement |
|---|---|
| FR-8.1 | The system shall index project and policy documents into a vector store. |
| FR-8.2 | The assistant shall answer questions on likely impacts and candidate adaptation measures, with citations to retrieved sources. |
| FR-8.2b | The AI layer shall be **non-essential to the platform**. Where the language model or vector store is unavailable, the system shall say so plainly in place of the assistant and every other feature shall continue to work. No map, computation, import or export shall depend on it. |
| FR-8.3 | Experts shall be able to review, correct and append to any assistant answer, and the reviewed version shall be what is published. |
| FR-8.3b | Each answer shall carry a status of `draft`, `under_review` or `published`. Only a published answer is visible to the public. The **original generated text and the corrected text shall both be retained**, so the record shows what the model said and what an expert was willing to put their name to. |
| FR-8.3c | Where two experts submit differing corrections, both shall be retained and the later shall become current; the system shall not attempt to merge them or to adjudicate. |

### 6.9 Monitoring

| ID | Requirement |
|---|---|
| FR-9.1 | The system shall record observed outcomes against the corresponding projection. An observed outcome shall be entered by a data officer or administrator as a value per DS division per sector × hazard per period, with a source reference and a date, through the same map-based entry surface used for indicator values. |
| FR-9.2 | The system shall report divergence between predicted and observed values and highlight the largest gaps. |

### 6.10 Administration

| ID | Requirement |
|---|---|
| FR-10.1 | Administrators shall manage users, roles and provincial scope. |
| FR-10.2 | Self-registration shall be possible; accounts shall require administrator approval before activation. |
| FR-10.3 | Administrators shall view all submissions and revert a profile to an earlier version. |
| FR-10.4 | Administrators shall approve or reject variables proposed during import. |

### 6.11 Migration from the deployed system

The deployed system holds the only published assessment data in existence
(§5.5). Migration is a requirement of V1, not a follow-on activity.

| ID | Requirement |
|---|---|
| FR-11.1 | The system shall import the deployed system's reference data — sectors, hazards and administrative units — and reconcile it against the catalogue, reporting every unmatched entry rather than silently dropping it. |
| FR-11.2 | Deployed `vulndata` values shall be migrated as **archived historical results**, marked with an origin of `pre-migration` and a profile version recorded as unknown. They shall never be written to `indicator_value`, because a composite score is not an indicator. |
| FR-11.3 | Archived results shall be viewable and comparable against newly computed results, and shall be labelled in the interface as historical with unknown composition. |
| FR-11.4 | Spelling errors in deployed reference data shall be corrected on migration, with the original spelling retained as an alias so historic references still resolve (§1.5). |
| FR-11.5 | Where the deployed system holds GND-level data, the migration shall aggregate it to DS division for V1 use and **retain the GND-level values unmodified**, so no collected data is lost if GND assessment is later adopted (O-8). |
| FR-11.6 | Migration shall produce a reconciliation report — records read, matched, aggregated, archived and rejected — which shall be reviewed before cut-over. |
| FR-11.7 | Migration shall be re-runnable and idempotent. A second run against the same source shall not duplicate records. |
| FR-11.8 | Cut-over shall not proceed until the reconciliation report is accepted. The deployed system's routes shall then be retired, not left serving alongside the replacement. |

### 6.12 Risk assessment

> **Blocked on O-11.** The asset layers this module consumes — population,
> buildings, roads, facilities — are registered in the spatial catalogue but not
> loaded. Risk cannot be implemented or tested until they are. **Vulnerability
> (§6.4) is entirely unaffected and proceeds independently**; nothing on the
> critical path waits for this.

| ID | Requirement |
|---|---|
| FR-12.1 | The system shall compute a risk index per DS division as the **geometric mean** of hazard, asset exposure and vulnerability, each normalised to [0, 1] (§2.6). The raw product shall not be used: it compresses the distribution so severely that the shared five-band classification places roughly 78% of divisions in the lowest band and none in the highest. |
| FR-12.2 | Asset exposure shall be derived by the spatial toolbox (§6.7) from the intersection of the hazard extent with population, building, road, facility and land-use layers. No separate data collection shall be required. |
| FR-12.3 | Risk results shall be stored separately from vulnerability results, and the two shall never be conflated on a map or in an export. |
| FR-12.4 | Each stored risk result shall record its three input scores, the profile version behind the vulnerability term, and the toolbox jobs behind the exposure term. |
| FR-12.5 | The system shall classify risk into five bands with configurable thresholds, and shall apply the same banding to vulnerability so the two are read consistently. |
| FR-12.6 | The system shall report asset exposure in **native units alongside the index** — people, kilometres of road, counts of schools and hospitals — because a planner needs the count, not only the normalised score. |
| FR-12.6b | Asset layers shall carry the attributes native-unit reporting depends on, validated against the layer's attribute contract on import (FR-7.1): a population count on population polygons, a length on line layers, and a facility type on point layers. A layer lacking them may be displayed but shall not be selectable as a risk input. |
| FR-12.7 | The system shall support weighted-overlay and AHP-derived combination of the three terms as alternatives to the multiplicative form, recording which was used. `(Should)` |
| FR-12.8 | Risk shall not be computed where the underlying vulnerability profile is not computable (§6.3). An incomplete input shall not produce a complete-looking output. |

### 6.15 Notifications

Deliberately minimal. Assessment data changes on a collection cycle measured in
months, not minutes, so a busy alerting system would mostly generate noise. What
is worth telling someone is that work landed in their area, or that a score moved
enough to be worth a second look.

| ID | Requirement |
|---|---|
| FR-15.1 | The system shall raise a notification when a dataset is published or withdrawn for a province the recipient is scoped to, and when a published vulnerability or risk score changes by 10 percentage points or more, or crosses a band boundary, between versions. `(Should)` |
| FR-15.2 | Notifications shall be delivered in-app, and by email where the user has opted in. Users shall control which events they receive and for which provinces and sectors. `(Should)` |
| FR-15.3 | A notification shall state what changed, from what to what, in which divisions, by whose action, and shall link to the view that shows it. A notification that only says something happened is not worth sending. `(Should)` |
| FR-15.4 | Notifications shall be derived from the audit log (§6.13) rather than raised independently, so no event can be notified that is not also recorded. |

### 6.13 Audit and versioning

| ID | Requirement |
|---|---|
| FR-13.1 | The system shall record an audit entry for every data-modifying operation: create, update, delete, publish, unpublish, weight change, computation, commit, export, login and logout. |
| FR-13.2 | Each entry shall record the actor, the action, the entity and its identifier, the previous and new values, the IP address, and the timestamp. |
| FR-13.3 | Audit entries shall be **append-only**. No interface or API shall permit their modification or deletion. |
| FR-13.4 | Administrators shall filter the audit log by date, actor, action and entity type, and export the result. |
| FR-13.5 | The system shall retain version history for indicator values, weightings, results and layer configurations, and shall show a comparison between any two versions. `(Should)` |
| FR-13.6 | An administrator shall be able to revert a profile weighting to an earlier version, which creates a new version rather than deleting the intervening ones. |

### 6.14 Interoperability

| ID | Requirement |
|---|---|
| FR-14.1 | The system shall publish administrative boundaries, hazard layers and published results as OGC **WMS 1.3.0**, **WFS 2.0** and **WMTS 1.0** services. |
| FR-14.2 | OGC endpoints shall serve published results only. Draft, pending and unpublished data shall not be reachable through them. |
| FR-14.3 | The REST API shall be documented as an **OpenAPI 3.0** specification served by the application. |
| FR-14.4 | The system shall issue scoped API keys for external integration, with per-key rate limits and expiry. `(Should)` |
| FR-14.5 | The system shall expose a health endpoint reporting the status of the database, the tile service, the job queue and the AI layer. |
| FR-14.6 | Bulk export shall be available as CSV, GeoJSON and Excel, carrying the same three data states as the map (§6.5). |

---

## 7. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | **Provenance.** Every stored value shall record its track, contributing user, source file where applicable, and period. Every computed value shall record the job or profile version that produced it. |
| NFR-2 | **Reproducibility.** Re-running a computation against the same data and profile version shall produce an identical result. |
| NFR-3 | **Spatial performance.** Map queries covering a province shall return within 2 seconds; all geometry columns shall be spatially indexed. Geometry shall be served as vector tiles with per-zoom simplification, and no administrative level — including GND at 14,019 units — shall block the browser's main thread at national extent. A single vector tile shall be generated and returned within **500 ms** at any zoom; the national extent at DS-division level shall be complete and interactive within **3 seconds** on a cold cache. |
| NFR-4 | **Security.** Passwords shall be stored hashed; contribution endpoints shall be authenticated and role-scoped; public read endpoints shall be unauthenticated **by explicit, read-only grant**. The API framework's default permission shall be *deny*, so an endpoint that specifies nothing is closed rather than open. |
| NFR-4b | **Deployment posture.** The application shall run under a production WSGI/ASGI server behind a reverse proxy, never a development server. Debug mode shall be off in any deployed environment; errors shall go to a log, never to the response body. Allowed hosts shall name the real hostnames. |
| NFR-4c | **Browser security.** Cross-origin requests shall be restricted to the declared frontend origin; wildcard origins shall not be combined with credentialed requests. Session, authentication and CSRF cookies shall be marked `Secure` and `HttpOnly`, and HTTPS shall be enforced. |
| NFR-4d | **Query safety.** No endpoint shall interpolate request parameters into SQL. Spatial and analytical queries shall use parameter binding. |
| NFR-5 | **Data integrity.** Domain rules (weights totalling 100, values in range, valid geometry, computed values requiring a job) shall be enforced in the database, not solely in application code. |
| NFR-6 | **Auditability.** No published result shall be altered in place. Corrections shall create a new version. |
| NFR-7 | **Portability.** The system shall run on a single server with no proprietary dependency. |
| NFR-8 | **Localisation.** The interface and all reference data — DS-division names, sector names, hazard names, indicator names — shall be available in **English, Sinhala and Tamil**. Tamil is an official language of Sri Lanka; a national government platform that omits it is not deployable. The DS-division register currently carries English and Sinhala only, and needs a Tamil column (O-10). |
| NFR-9 | **Accessibility.** The public map shall be usable without login on a standard browser, and shall not rely on colour alone to convey severity or the absence of data. |
| NFR-10 | **Honest absence.** No interface, export or API response shall represent an absent value as zero. This is stated as a system-wide property because it is violated most easily at the boundaries between layers, where a missing key becomes a default. |
| NFR-11 | **Accessibility, formally.** The public interface shall meet **WCAG 2.1 Level AA**: keyboard navigable, screen-reader compatible, and legible to colour-blind users — for which an alternative palette shall be selectable. |
| NFR-12 | **Recoverability.** The database shall be backed up daily and the backup restorable to a working system. Retention: 30 daily, 12 weekly, 12 monthly. A restore shall be tested before handover, not assumed. |
| NFR-13 | **Observability.** The system shall log API response times, slow database queries and background job durations, and expose them to an administrator. `(Should)` |
| NFR-14 | **Concurrency.** The system shall serve at least **100 concurrent public readers** and **20 concurrent authenticated contributors** without exceeding the response targets in NFR-3. These figures reflect a platform used by nine provincial teams and an interested public, not a consumer service; NFR-7's single-server constraint should be revisited if observed usage approaches them. |
| NFR-15 | **Assistant responsiveness.** The assistant shall begin streaming within 5 seconds and complete a standard answer within 30. Exceeding this shall surface as a timeout with an explanation, never as an indefinite wait (FR-5.14). |
| NFR-16 | **Responsive layout.** The interface shall be usable from **360 px to 1920 px** wide. Below tablet width the map remains primary and the side panels become sheets; no function shall be reachable only on a wide screen. |
| NFR-17 | **Retention.** Audit entries shall be retained for at least **7 years**, matching the horizon over which an adaptation investment justified by these scores would be evaluated. Uploaded workbooks and computation results shall be retained indefinitely, since they are the evidence behind published figures. Assistant conversation history shall be retained for 1 year. Deletion of anything within a retention period shall be impossible through the interface or API. |
| NFR-18 | **File storage.** Uploaded workbooks, generated exports and documents indexed by the assistant shall be held on the server filesystem or S3-compatible storage, with the path, checksum and size recorded in the database. The database shall not store file bodies. |

---

## 8. Data model

![](../database/erd.png)

**Figure 7 — Entity-relationship diagram (28 tables).**

Grouped by module:

| Module | Purpose |
|---|---|
| **Auth** | Users, roles, provincial scope |
| **Geography** | Provinces and DS divisions with geometry |
| **Catalogue** | Hazards, sectors, subsectors, indicator catalogue, aliases |
| **Vulnerability** | Profiles, profile membership, indicator values, results |
| **Scenarios** | SSP scenarios, parameters, impact projections |
| **Monitoring** | Observed outcomes |
| **Import** | Upload batches with per-cell error detail |
| **Spatial toolbox** | Layers, features, operations, jobs, results |
| **AI agent** | Documents, embeddings, answers, expert reviews |

Two design decisions shape the model:

**Configuration as data, not schema.** Indicators and spatial layers are rows in
catalogues, not tables. A new sector, hazard or map layer is data entry. This is
why the platform can absorb 174 variables across 8 sectors without 174 columns
or 8 subsystems.

**Separation of calculation from assertion.** The toolbox writes to a results
table; only an explicit user action promotes a result to an indicator value. A
database constraint makes a computed value without a originating job impossible.

---

## 9. API surface

Representative endpoints; not exhaustive.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/imports` | Upload a workbook; validate; stage values; return weights read and variables lacking one |
| `GET` | `/imports/{id}` | Batch status and per-cell errors |
| `PUT` | `/profiles/{scope}/weights` | Save a weighting; creates a new version; recomputes |
| `GET` | `/profiles/{scope}/weights` | Current weighting |
| `GET` | `/profiles/{scope}/weights/history` | Version history |
| `GET` | `/profiles/readiness` | Which profiles are computable |
| `GET` | `/vulnerability` | Results filtered by province, sector, hazard, track, period; each unit carries an explicit state of `assessed`, `pending` or `unassessed` |
| `GET` | `/vulnerability/{unit}` | Full composition of one score: hazard and exposure indices, variables, weights, directions, raw values, profile version, track, period, contributor |
| `GET` | `/coverage` | Assessed / pending / unassessed counts for the current selection (FR-5.10) |
| `GET` | `/tiles/{level}/{z}/{x}/{y}.mvt` | Vector tiles of administrative geometry joined to results (FR-5.1b) |
| `POST` | `/ratings` | Community severity rating |
| `POST` | `/migration/run` | Execute or re-run migration from the deployed system; returns the reconciliation report (FR-11.6, FR-11.7) |
| `GET` | `/risk` | Risk results by province, sector, hazard, period, with the three input scores |
| `GET` | `/risk/{unit}/exposure` | Assets exposed in native units — people, km of road, facility counts (FR-12.6) |
| `POST` | `/weights/ahp` | Submit a pairwise comparison matrix; returns weights and the consistency ratio (FR-3.9) |
| `GET` | `/audit` | Audit log, filtered by date, actor, action and entity (FR-13.4) |
| `GET` | `/health` | Status of database, tiles, job queue and AI layer (FR-14.5) |
| — | `/ogc/wms`, `/ogc/wfs`, `/ogc/wmts` | OGC services over published results (FR-14.1) |
| `POST` | `/toolbox/jobs` | Queue a spatial computation |
| `POST` | `/toolbox/jobs/{id}/commit` | Promote results to indicator values |
| `POST` | `/agent/ask` | Retrieval-augmented answer with citations |

---

## 10. Delivery status

Stated plainly so the reader can distinguish what exists from what is specified.

| Component | Status | Evidence |
|---|---|---|
| Variable catalogue | **Complete** | 174 variables, expert-refined |
| DS-division register | **Complete** | 330 divisions, topology validated |
| Data-collection workbooks | **Complete** | 243 files, 17,826 rows |
| Database schema | **Built and verified** | 28 tables; automated tests pass |
| Reference and catalogue data loaded | **Built and verified** | Live database |
| Architecture and data-flow design | **Complete** | Figures 1, 5 |
| Review of the deployed system | **Complete** | First-hand inspection, 30 July 2026; Annex D |
| UI design | **Prototyped** | Interactive prototype; Annex A |
| Migration from the deployed system | **Specified** | §6.11; not implemented |
| Risk layer | **Specified** | §6.12; needs asset layers (O-11) |
| Audit log | **Specified** | §6.13; not in the built schema — needs an addendum |
| OGC services | **Specified** | §6.14; GeoServer not yet deployed |
| Backend API | **Specified** | Not implemented |
| Frontend application | **Specified** | Not implemented |
| SSP engine | **Specified** | Not implemented |
| Spatial toolbox | **Designed (schema built)** | Not implemented |
| AI assistant | **Specified** | Not implemented |
| Monitoring | **Specified** | Not implemented |

The database was built and tested on 29 July 2026. Automated tests verify not
only that tables exist but that the **rules behave**: a weight set totalling less
than 100% is rejected; a computed value without a job is rejected; an invalid
geometry on a line-only layer is rejected; and the national area total falls in a
plausible range, confirming correct projection handling.

---

## 11. Assumptions, constraints and open items

### Assumptions

1. DS divisions are the assessment unit; GND-level data is not *required* for
   V1, though FR-11.5 requires any that exists to be preserved.
2. Boundaries are stable for the assessment period; a mid-project boundary
   revision would require remapping historic values.
3. Expert-panel review occurs outside the system and is recorded, not enforced.
4. Data collection is a periodic exercise, not a real-time feed.
5. The deployed system remains available for migration until cut-over, and its
   database is accessible for a direct read rather than only through its API.

### Constraints

1. One PostgreSQL instance serves both geometry and vector retrieval.
2. The AI layer requires a self-hosted model for data-sovereignty reasons; the
   embedding dimension is provisional until that model is selected.
3. Provincial teams work in Excel; the workbook remains the primary collection
   instrument.

### Open items

| # | Item | Effect |
|---|---|---|
| O-1 | Weights for 1,783 newly added variable memberships | Affected profiles cannot be computed until supplied |
| O-2 | Expert sign-off on 14 period-aggregation exceptions | Defaults applied; reversible |
| O-3 | Source register quotes 331 DS divisions; the supplied shapefile contains 330 | One division to reconcile |
| O-4 | Two subsectors have legacy data for one province only | May indicate incomplete collection rather than genuine absence |
| O-5 | Self-hosted language and embedding model not yet selected | Blocks the AI layer only |
| O-6 | Official DS-division codes, if they exist, not yet adopted | Internal codes generated in the interim |
| O-7 | **Do the deployed system's additional 7 sectors and 17 hazards remain in scope?** They exist in the running system but in none of the 243 provincial workbooks | Determines the catalogue's target size and the shape of the migration reconciliation (FR-11.1) |
| O-8 | **Is GND-level data genuinely populated in the deployed system?** | If substantial GND data exists, aggregating to DS division for V1 discards resolution that was collected. FR-11.5 preserves it either way, but the answer affects whether GND becomes a V1 display level (FR-5.1c) |
| O-9 | Security findings against the running deployment (Annex D) are unremediated | They concern the deployed system, not this specification, but the data at risk is the data being migrated. Remediation is independent of this build and should not wait for it |
| O-10 | **Tamil names are not held for any reference data.** The DS-division register has English and Sinhala columns only; sector, hazard and indicator names are English-only | Blocks NFR-8. Needs an authoritative Tamil source for 330 divisions, 8 sectors, 3 hazards and 174 indicators — a translation exercise, not a technical one |
| O-11 | Asset layers for the risk exposure term (population, buildings, facilities) are registered in the spatial catalogue but not yet loaded | Blocks §6.12 only. Vulnerability is unaffected |
| O-12 | Raster ingestion is deferred (FR-7.8), so climate surfaces must be supplied as pre-computed per-division values | Constrains how rainfall, elevation and temperature indicators are collected until Phase 2 |

---

## Annex A — Screen specification

Screens captured from the interactive prototype
(`design/ui/risk-radar-ui-prototype.html`), which runs on the **real catalogue**:
330 DS divisions, 174 variables and 243 profiles.

> **These are prototype screens, not delivered software.** They specify intended
> behaviour and have been used to validate the workflow with stakeholders. The
> frontend is not implemented.

### A.0 Continuity with the deployed system

Every screen below is a successor to something users already have, or a
deliberate addition. Read this table before the screens: it is the argument that
this is an evolution rather than a replacement users must relearn.

| Deployed screen | Successor | What changes |
|---|---|---|
| Map — sector / hazard / layer controls | A.2 Public map | Subsector, period and track added; the three familiar controls stay in place and in order |
| Map — choropleth | A.2 Public map | Unassessed and pending become distinct states; the legend gains a band for zero; coverage is stated on the view |
| Map — "Average Value" bar chart | A.2 Public map | Retained; ranking beside the map is genuinely useful. Label corrected; unassessed units excluded from the average rather than counted as zero |
| Map — value table | A.2 Public map | Retained; gains state, period and track columns |
| Map — "More" panel (province filter, GND layer) | A.2 Public map | Promoted out of a secondary panel; GND offered only where GND data exists |
| *(no equivalent)* | A.2 detail panel | **New.** Hazard and exposure indices, contributing variables, weights, directions, profile version, contributor, date |
| *(no equivalent)* | A.3 Three tracks compared | **New.** The deployed system has one undifferentiated source |
| Add Data | A.4–A.6 Import flow | Workbook upload with structural validation, then weights confirmed on screen, then review — replacing single-value form entry |
| My Data | A.17 Submission history | Gains track, status and version per submission |
| Login | A.1 Access | Role and provincial scope; session state derived from the API (FR-5.15) |
| Print | FR-5.13 | Retained; export now carries the legend, period and coverage statement |
| About | FR-5.17 | Becomes the methodology page, linked from every published view |

**Two deployed screens could not be inspected.** *Add Data* and *My Data* require
an authenticated session, and the deployed system's own session-state defect
(Annex D, F-1) prevented access during the review. Their successors are specified
from the prototype and the workbook-driven process, and **should be reconciled
against the live screens before the frontend is built** — the current data-entry
workflow may contain accommodations worth preserving that are not visible from
outside.

### A.1 Access

![](figures/01-login.png)

**Figure A1 — Login and role selection.** Four authenticated roles plus guest
access. Public users reach the map without credentials (FR-5.1).

### A.2 Public map

![](figures/02-map-public.png)

**Figure A2 — Public vulnerability map.** Sector, subsector, hazard and province
filters, track selector, and a detail panel showing the score, the weighted
composition behind it, and comparison across hazards. Note the advisory that
variables without a weight are excluded from the composition chart
(FR-5.2 to FR-5.6).

> **The prototype predates the review of the deployed system** and does not yet
> show the coverage statement (FR-5.10), the period selector (FR-5.12), or the
> distinct rendering of unassessed and pending divisions (FR-5.8, FR-5.9). Those
> are requirements of this specification and take precedence over the screen as
> drawn. The panel layout and the control ordering are what the figure specifies.

> **The prototype draws a schematic tile grid, not the real boundaries.** Each
> tile is one DS division and carries its real name, but the geometry is
> deliberately simplified so the prototype runs as a single file with no map
> server. The delivered map renders the actual polygons shown in **Figure 2**
> via MapLibre GL (FR-5.1). The tiles demonstrate the interaction — filters,
> track switching, selection, the detail panel — not the cartography.

![](figures/03-map-compare.png)

**Figure A3 — Three tracks compared.** Measured, expert and community
assessments side by side, with the largest divergences listed — the mechanism by
which perception gaps become visible (FR-5.3).

### A.3 Data import

![](figures/04-entry-context.png)

**Figure A4 — Step 1, context.** Track, province, sector, subsector, hazard and
period. The system reports the profile's variable count and how many lack a
weight before the officer proceeds.

![](figures/05-entry-upload.png)

**Figure A5 — Step 2, upload.** The workbook is uploaded *before* weights are
discussed, so the weights screen can be pre-filled from it (FR-2.2, FR-2.4).

![](figures/06-entry-upload-done.png)

**Figure A6 — Step 2, validated.** Divisions matched, variables counted, weights
read from the workbook, and remaining blanks reported (FR-2.3).

![](figures/07-entry-weights.png)

**Figure A7 — Step 3, confirm weights (incomplete).** Weights arrive pre-filled
and tagged by origin. Variables with no weight are highlighted. Both domain
totals are shown live and **the Next action is disabled** while any weight is
blank (FR-3.2, FR-3.3).

![](figures/08-entry-weights-ok.png)

**Figure A8 — Step 3, complete.** Both domains total 100% and the optional
expert-panel sign-off note is recorded (FR-3.3, FR-3.5).

![](figures/09-entry-review.png)

**Figure A9 — Step 4, review.** Summarises what changed against the workbook and
states the effect of saving: values load, the weighting is saved as a new
version, and vulnerability is recomputed (FR-3.4, FR-1.6).

### A.4 Profile weights

![](figures/10-profile-weights.png)

**Figure A10 — Profile weights.** Any profile may be selected and re-weighted at
any time, independently of an import. The change history records version, author,
date, source file and sign-off note (FR-3.6).

### A.5 Expert track

![](figures/11-expert-params.png)

**Figure A11 — Expert parameters.** Variables defined by the measured-data
profile are mandatory; experts may adjust weights and add variables from their
expertise.

![](figures/12-expert-values.png)

**Figure A12 — Expert value entry.** Raw values in native units, with period and
source recorded per variable (FR-2.5).

### A.6 Community track

![](figures/13-community-rating.png)

**Figure A13 — Community rating.** A deliberately short flow: a 1–5 severity
rating, an optional comment and photo. The contribution threshold is kept low
because representativeness depends on volume (FR-5.7).

### A.7 Administration

![](figures/14-admin-dashboard.png)

**Figure A14 — Administrator dashboard.** Users, pending registrations,
submission volume by track, and provincial coverage.

![](figures/15-admin-users.png)

**Figure A15 — User management.** Role and provincial scope per user (FR-10.1).

![](figures/16-admin-registrations.png)

**Figure A16 — Registration requests.** Self-registration requires approval
before activation (FR-10.2).

![](figures/17-submissions.png)

**Figure A17 — Submission history.** Every submission with its track, status and
version.

### A.8 Screens specified but not yet prototyped

| Screen | Requirement |
|---|---|
| Profile composer | FR-1.4 |
| Ingestion mapping resolver | FR-2.7 |
| Impact explorer | FR-6.2 |
| Monitoring dashboard | FR-9.2 |
| Spatial toolbox (layer import, run, review, commit) | FR-7.2 to FR-7.7 |
| AI assistant chat and expert review | FR-8.2, FR-8.3 |
| Coverage view — where data is missing, by province and profile | FR-5.10 |
| Migration reconciliation report | FR-11.6 |

---

## Annex B — Catalogue summary

| Dimension | Value |
|---|---|
| Canonical variables | 174 |
| — hazard domain | 12 |
| — exposure domain | 162 |
| Sectors | 8 |
| Subsectors | 12 |
| Hazards | 3 |
| National profiles | 33 |
| — drought | 15 |
| — flood | 15 |
| — landslide | 3 |
| Province-scoped profiles | 243 |
| Variable memberships | 3,664 |
| — with a weight | 1,881 (51%) |
| — awaiting a weight | 1,783 (49%) |
| Aliases | 269 |
| Variables per profile | 6 to 25 |

### Sectors and subsectors

| Sector | Subsectors |
|---|---|
| Agriculture | Paddy, Tea, Coconut, Vegetable & Other Field Crops |
| Livestock | Buffalo, Cattle, Goat, Pig & Sheep, Poultry farming |
| Water | Potable Water, Irrigation Water |
| Inland Fishery | Inland Fishery |
| Human Settlements | — |
| Industry | — |
| Tourism | — |
| Transportation | — |

---

## Annex C — Verification record

Automated checks executed against the live database, 29 July 2026.

| Check | Result |
|---|---|
| Reference data loaded (9 provinces, 3 hazards, 8 sectors, 12 subsectors) | Pass |
| 174 active variables | Pass |
| 243 profiles, 3,664 memberships | Pass |
| Period rules preserved (160 / 11 / 3) | Pass |
| Weight set totalling 50% is **rejected** | Pass |
| Computed value without an originating job is **rejected** | Pass |
| Polygon on a line-only spatial layer is **rejected** | Pass |
| Feature missing a required attribute is **rejected** | Pass |
| 330 DS divisions, all geometry valid | Pass |
| No overlapping divisions | Pass |
| National area 65,976.7 km² (plausible range) | Pass |

The negative tests matter more than the positive ones: they demonstrate that the
integrity rules described in this document are enforced by the database rather
than merely intended.

---

## Annex D — Review of the deployed system

**Target** `riskradar.geoinfobox.com` (frontend), `riskradarback.geoinfobox.com`
(API) &nbsp;·&nbsp; **Date** 30 July 2026

**Method.** Inspection of the running application through a browser, plus
unauthenticated requests to public API endpoints. **Read-only — nothing was
created, modified or deleted.** Probing stopped at the point each issue was
confirmed rather than continuing to establish its extent.

Full detail is in `design/LIVE_SYSTEM_REVIEW.md`. This annex records what bears
on the specification.

### D.1 Functional and data-model findings

| # | Finding | Where addressed |
|---|---|---|
| L-1 | Unassessed units render as `0.0%`, indistinguishable from a genuine low score | FR-5.8 to FR-5.11, NFR-10 |
| L-2 | A score cannot be decomposed — no domains, no variables, no weights | §2.1, FR-5.4 |
| L-3 | No time dimension; no period, year or trend anywhere | §2.4, FR-5.12 |
| L-4 | No provenance — no track, contributor or date on any value | NFR-1 |
| L-5 | DS-division layer takes ≈20 s to render; froze the browser past 30 s on one attempt. Geometry is served as raw GeoJSON | FR-5.1b, NFR-3 |
| L-6 | Session appears authenticated in the header while the API returns 401; no error state shown | FR-5.14, FR-5.15 |
| L-7 | `/api/users/entrycount/` returns HTTP 500 (serializer receives raw bytes) | — deployed-system defect |
| L-8 | "My Data" shows an indefinite loading state | FR-5.14 |
| L-9 | Legend says "Risk Levels"; the quantity is vulnerability | FR-5.16 |
| L-10 | Reference-data spelling errors would persist as codes | FR-11.4 |
| L-11 | No methodology, source citation or "last updated" anywhere | FR-5.17 |
| L-12 | A superseded `oldvulndata/` endpoint is still routed and live | FR-11.8 |

### D.2 Security findings

These concern the **running deployment**, not this specification. They are
recorded here because the data they expose is the data §6.11 migrates, and
because remediation is independent of this build and should not wait for it.

| # | Finding | Severity |
|---|---|---|
| S-1 | Every API endpoint is readable **and writable** by anonymous users. The framework's default permission class is unset, so DRF falls back to `AllowAny` | **Critical** |
| S-2 | `DEBUG = True` in production — settings, filesystem paths, internal network addresses and the full URL routing table returned to anonymous clients on error | **Critical** |
| S-3 | Running on Django's development server (`WSGIServer/0.2`) | High |
| S-4 | `CORS_ALLOW_ALL_ORIGINS` combined with `CORS_ALLOW_CREDENTIALS`, permitting credentialed cross-site DELETE and PUT | High |
| S-5 | Session, auth and CSRF cookies all `Secure = False` with `SameSite = None` — a combination current browsers reject outright, and a likely cause of L-6 | High |
| S-6 | `ALLOWED_HOSTS = ['*']`, no HSTS, no HTTPS redirect | Medium |
| S-7 | Several endpoints named `.../sql/`; not tested, but should be reviewed in source for parameter interpolation | Unknown |

Django's exception filter masked the secret key and database password. That is
the one piece of luck in the list.

**Recommended immediate remediation on the deployed system**, independent of this
project: set `DEBUG = False` and real `ALLOWED_HOSTS`; set a default permission
class of `IsAuthenticated` and grant public read explicitly and read-only; close
CORS to the real origin; set the three cookie `Secure` flags; move off
`runserver`; and rotate credentials. NFR-4 through NFR-4d carry the corresponding
requirements into the replacement so the same posture is not rebuilt.

### D.3 What the review changed in this document

| Section | Change |
|---|---|
| §1.5 | New — relationship to the deployed system |
| §5.5 | New — the deployed dataset and why its values cannot become indicator values |
| §6.5 | Rewritten — coverage states, score explanation, time, interface states, terminology |
| §6.11 | New — migration requirements |
| §7 | NFR-3 strengthened; NFR-4b/4c/4d and NFR-10 added |
| §9 | Coverage, composition, tile and migration endpoints added |
| §11 | O-7, O-8, O-9 added |
| Annex A.0 | New — screen-by-screen continuity mapping |

Nothing in §2 (the vulnerability model), §5.1–5.4 (the data foundation) or §8
(the data model) changed. The review confirmed those choices rather than
challenging them: every capability the deployed system lacks is one the model
already provides for.

---

## Annex E — Validation rules

Codes are part of the interface contract. They may be added to; they are never
renumbered. Every message names the row, the column and the offending value, so a
provincial officer can find and fix the cell without reading a log.

| Code | Condition | Message |
|---|---|---|
| V001 | Required value missing | `Row {row}: {column} cannot be empty` |
| V002 | Duplicate division within one file | `Row {row}: division '{code}' already appears at row {prev}` |
| V003 | Unknown DS division | `Row {row}: '{code}' is not a DS division in the register` |
| V004 | Division outside the officer's province | `Row {row}: '{name}' is in {province}, outside your assigned province` |
| V005 | Hazard does not match the selected profile | `Row {row}: expected hazard '{expected}', found '{actual}'` |
| V006 | Sector does not match the selected profile | `Row {row}: expected sector '{expected}', found '{actual}'` |
| V007 | Period outside the configured ranges | `Row {row}: period '{value}' is not 2020–2025 or 2025–2030` |
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

**No file loads partially.** A file with one V001 loads nothing (FR-2.3). The
report lists every failure at once so the officer makes one round of corrections
rather than discovering errors one at a time.

---

## Annex F — Phase 2 backlog

Recorded rather than dropped. Each entry names where it came from, so a later
reviewer can see it was considered and deferred deliberately.

### Deferred from the IEEE 29148 draft

| Item | Why deferred |
|---|---|
| Five separately configured AI agents | One assistant with the same tools delivers the same capability. Five system prompts to maintain is configuration surface, not function |
| Planning agent — mitigation costing | Requires a costed intervention catalogue that does not exist. Generating plausible-looking cost figures without one would be worse than omitting it |
| Report generation to Word and PowerPoint | PDF covers the need in V1 |
| Scheduled and emailed reporting | Follows report generation |
| SMS alerting | Gateway cost and contract; email and in-app cover V1 |
| Multi-factor authentication | Worth having; not release-blocking for a platform whose write surface is a few dozen officers |
| Route finding, nearest facility, 3D view | Specialist tools with narrow use here. Measure, buffer, intersect and print cover normal work |
| Machine-learning risk method | Needs historical outcome data — observed disaster impact per division — which does not exist. Would be fitting a model to nothing |
| Fuzzy-logic risk method | Defensible, but weighted overlay and AHP already give two methods; a third adds explanation burden |
| Kubernetes orchestration | NFR-7 requires single-server operation on government hardware |
| Historical hazard event register | Useful for validation later; not needed to compute an assessment |
| Read replicas, horizontal scaling | 330 divisions and a few hundred concurrent readers do not require it. Revisit if usage says otherwise |

### Deferred from this specification

| Item | Why deferred |
|---|---|
| GND-level assessment | V1 assesses at DS division. FR-11.5 preserves any GND data found during migration so the option stays open (O-8) |
| Real-time hazard feeds and early warning | A different system with different availability requirements |
| Crowdsourced citizen reporting beyond the community rating | The 1–5 rating is the V1 scope of public contribution |

---

<!-- ANNEX-G:BEGIN generated by generate_traceability.py -->

## Annex G — Requirements traceability

Generated from the requirement tables in this document by
`generate_traceability.py`. Re-run it after adding a requirement; do not
edit this annex by hand.

Verification methods follow IEEE 29148: **Test** (automated, repeatable),
**Demonstration** (exercised against the running system), **Inspection**
(code or configuration reviewed), **Analysis** (reasoned from design).


### Functional requirements

| ID | Section | Priority | Implemented by | Verification | Note |
|---|---|---|---|---|---|
| FR-1.1 | §6.1 Catalogue and profiles | Must | Catalogue service | Test | Automated against the seeded catalogue |
| FR-1.2 | §6.1 Catalogue and profiles | Must | Catalogue service | Test | Automated against the seeded catalogue |
| FR-1.3 | §6.1 Catalogue and profiles | Must | Catalogue service | Test | Automated against the seeded catalogue |
| FR-1.4 | §6.1 Catalogue and profiles | Must | Catalogue service | Test | Automated against the seeded catalogue |
| FR-1.5 | §6.1 Catalogue and profiles | Must | Catalogue service | Test | Automated against the seeded catalogue |
| FR-1.6 | §6.1 Catalogue and profiles | Must | Catalogue service | Test | Automated against the seeded catalogue |
| FR-2.1 | §6.2 Data collection and import | Must | Import service | Test | Fixture workbooks, one per Annex E code |
| FR-2.2 | §6.2 Data collection and import | Must | Import service | Test | Fixture workbooks, one per Annex E code |
| FR-2.3 | §6.2 Data collection and import | Must | Import service | Test | Fixture workbooks, one per Annex E code |
| FR-2.4 | §6.2 Data collection and import | Must | Import service | Test | Fixture workbooks, one per Annex E code |
| FR-2.5 | §6.2 Data collection and import | Must | Import service | Test | Fixture workbooks, one per Annex E code |
| FR-2.6 | §6.2 Data collection and import | Must | Import service | Test | Fixture workbooks, one per Annex E code |
| FR-2.7 | §6.2 Data collection and import | Must | Import service | Test | Fixture workbooks, one per Annex E code |
| FR-2.8 | §6.2 Data collection and import | Must | Import service | Test | Fixture workbooks, one per Annex E code |
| FR-2.9 | §6.2 Data collection and import | Must | Import service | Test | Fixture workbooks, one per Annex E code |
| FR-3.1 | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.2 | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.3 | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.3b | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.4 | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.5 | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.6 | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.7 | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.8 | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.9 | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.9b | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.10 | §6.3 Weighting | Should | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-3.11 | §6.3 Weighting | Must | Weighting service | Test | Includes negative tests: 99.999 rejected |
| FR-4.1 | §6.4 Computation | Must | Computation engine | Test | Recomputation must be bit-identical (NFR-2) |
| FR-4.2 | §6.4 Computation | Must | Computation engine | Test | Recomputation must be bit-identical (NFR-2) |
| FR-4.3 | §6.4 Computation | Must | Computation engine | Test | Recomputation must be bit-identical (NFR-2) |
| FR-4.4 | §6.4 Computation | Must | Computation engine | Test | Recomputation must be bit-identical (NFR-2) |
| FR-4.5 | §6.4 Computation | Must | Computation engine | Test | Recomputation must be bit-identical (NFR-2) |
| FR-4.6 | §6.4 Computation | Must | Computation engine | Test | Recomputation must be bit-identical (NFR-2) |
| FR-4.7 | §6.4 Computation | Must | Computation engine | Test | Recomputation must be bit-identical (NFR-2) |
| FR-4.8 | §6.4 Computation | Must | Computation engine | Test | Recomputation must be bit-identical (NFR-2) |
| FR-4.8b | §6.4 Computation | Must | Computation engine | Test | Recomputation must be bit-identical (NFR-2) |
| FR-4.9 | §6.4 Computation | Must | Computation engine | Test | Recomputation must be bit-identical (NFR-2) |
| FR-5.1 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.1b | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.1c | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.2 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.3 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.4 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.4b | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.4c | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.5 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.6 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.7 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.7b | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.8 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.9 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.10 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.11 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.12 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.12b | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.12c | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.12d | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.12e | §6.5 Map and visualisation | Should | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.13 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.14 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.15 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.16 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.17 | §6.5 Map and visualisation | Must | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.18 | §6.5 Map and visualisation | Should | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-5.19 | §6.5 Map and visualisation | Should | Map frontend | Demonstration | Scripted browser run at each admin level |
| FR-6.1 | §6.6 Scenarios and impact | Must | Scenario engine | Test | Projection reproducible from stored adjustments |
| FR-6.1b | §6.6 Scenarios and impact | Must | Scenario engine | Test | Projection reproducible from stored adjustments |
| FR-6.1c | §6.6 Scenarios and impact | Must | Scenario engine | Test | Projection reproducible from stored adjustments |
| FR-6.2 | §6.6 Scenarios and impact | Must | Scenario engine | Test | Projection reproducible from stored adjustments |
| FR-6.3 | §6.6 Scenarios and impact | Must | Scenario engine | Test | Projection reproducible from stored adjustments |
| FR-7.1 | §6.7 Spatial analysis toolbox | Must | Spatial toolbox | Test | Known-answer checks in EPSG:5235 |
| FR-7.2 | §6.7 Spatial analysis toolbox | Must | Spatial toolbox | Test | Known-answer checks in EPSG:5235 |
| FR-7.3 | §6.7 Spatial analysis toolbox | Must | Spatial toolbox | Test | Known-answer checks in EPSG:5235 |
| FR-7.4 | §6.7 Spatial analysis toolbox | Must | Spatial toolbox | Test | Known-answer checks in EPSG:5235 |
| FR-7.5 | §6.7 Spatial analysis toolbox | Must | Spatial toolbox | Test | Known-answer checks in EPSG:5235 |
| FR-7.6 | §6.7 Spatial analysis toolbox | Must | Spatial toolbox | Test | Known-answer checks in EPSG:5235 |
| FR-7.7 | §6.7 Spatial analysis toolbox | Must | Spatial toolbox | Test | Known-answer checks in EPSG:5235 |
| FR-7.8 | §6.7 Spatial analysis toolbox | Must | Spatial toolbox | Test | Known-answer checks in EPSG:5235 |
| FR-7.9 | §6.7 Spatial analysis toolbox | Should | Spatial toolbox | Test | Known-answer checks in EPSG:5235 |
| FR-8.1 | §6.8 AI assistant | Must | Assistant | Demonstration | Includes the layer-unavailable path (FR-8.2b) |
| FR-8.2 | §6.8 AI assistant | Must | Assistant | Demonstration | Includes the layer-unavailable path (FR-8.2b) |
| FR-8.2b | §6.8 AI assistant | Must | Assistant | Demonstration | Includes the layer-unavailable path (FR-8.2b) |
| FR-8.3 | §6.8 AI assistant | Must | Assistant | Demonstration | Includes the layer-unavailable path (FR-8.2b) |
| FR-8.3b | §6.8 AI assistant | Must | Assistant | Demonstration | Includes the layer-unavailable path (FR-8.2b) |
| FR-8.3c | §6.8 AI assistant | Must | Assistant | Demonstration | Includes the layer-unavailable path (FR-8.2b) |
| FR-9.1 | §6.9 Monitoring | Must | Monitoring | Demonstration |  |
| FR-9.2 | §6.9 Monitoring | Must | Monitoring | Demonstration |  |
| FR-10.1 | §6.10 Administration | Must | Admin console | Demonstration |  |
| FR-10.2 | §6.10 Administration | Must | Admin console | Demonstration |  |
| FR-10.3 | §6.10 Administration | Must | Admin console | Demonstration |  |
| FR-10.4 | §6.10 Administration | Must | Admin console | Demonstration |  |
| FR-11.1 | §6.11 Migration from the deployed system | Must | Migration job | Test | Idempotency: second run adds no rows |
| FR-11.2 | §6.11 Migration from the deployed system | Must | Migration job | Test | Idempotency: second run adds no rows |
| FR-11.3 | §6.11 Migration from the deployed system | Must | Migration job | Test | Idempotency: second run adds no rows |
| FR-11.4 | §6.11 Migration from the deployed system | Must | Migration job | Test | Idempotency: second run adds no rows |
| FR-11.5 | §6.11 Migration from the deployed system | Must | Migration job | Test | Idempotency: second run adds no rows |
| FR-11.6 | §6.11 Migration from the deployed system | Must | Migration job | Test | Idempotency: second run adds no rows |
| FR-11.7 | §6.11 Migration from the deployed system | Must | Migration job | Test | Idempotency: second run adds no rows |
| FR-11.8 | §6.11 Migration from the deployed system | Must | Migration job | Test | Idempotency: second run adds no rows |
| FR-12.1 | §6.12 Risk assessment | Must | Risk engine | Test | Blocked on O-11 until asset layers load |
| FR-12.2 | §6.12 Risk assessment | Must | Risk engine | Test | Blocked on O-11 until asset layers load |
| FR-12.3 | §6.12 Risk assessment | Must | Risk engine | Test | Blocked on O-11 until asset layers load |
| FR-12.4 | §6.12 Risk assessment | Must | Risk engine | Test | Blocked on O-11 until asset layers load |
| FR-12.5 | §6.12 Risk assessment | Must | Risk engine | Test | Blocked on O-11 until asset layers load |
| FR-12.6 | §6.12 Risk assessment | Must | Risk engine | Test | Blocked on O-11 until asset layers load |
| FR-12.6b | §6.12 Risk assessment | Must | Risk engine | Test | Blocked on O-11 until asset layers load |
| FR-12.7 | §6.12 Risk assessment | Should | Risk engine | Test | Blocked on O-11 until asset layers load |
| FR-12.8 | §6.12 Risk assessment | Must | Risk engine | Test | Blocked on O-11 until asset layers load |
| FR-13.1 | §6.13 Audit and versioning | Must | Audit subsystem | Test | Append-only proven by attempted UPDATE/DELETE |
| FR-13.2 | §6.13 Audit and versioning | Must | Audit subsystem | Test | Append-only proven by attempted UPDATE/DELETE |
| FR-13.3 | §6.13 Audit and versioning | Must | Audit subsystem | Test | Append-only proven by attempted UPDATE/DELETE |
| FR-13.4 | §6.13 Audit and versioning | Must | Audit subsystem | Test | Append-only proven by attempted UPDATE/DELETE |
| FR-13.5 | §6.13 Audit and versioning | Should | Audit subsystem | Test | Append-only proven by attempted UPDATE/DELETE |
| FR-13.6 | §6.13 Audit and versioning | Must | Audit subsystem | Test | Append-only proven by attempted UPDATE/DELETE |
| FR-14.1 | §6.14 Interoperability | Must | API and OGC layer | Test | GetCapabilities parsed and schema-validated |
| FR-14.2 | §6.14 Interoperability | Must | API and OGC layer | Test | GetCapabilities parsed and schema-validated |
| FR-14.3 | §6.14 Interoperability | Must | API and OGC layer | Test | GetCapabilities parsed and schema-validated |
| FR-14.4 | §6.14 Interoperability | Should | API and OGC layer | Test | GetCapabilities parsed and schema-validated |
| FR-14.5 | §6.14 Interoperability | Must | API and OGC layer | Test | GetCapabilities parsed and schema-validated |
| FR-14.6 | §6.14 Interoperability | Must | API and OGC layer | Test | GetCapabilities parsed and schema-validated |
| FR-15.1 | §6.15 Notifications | Should | Notification service | Demonstration |  |
| FR-15.2 | §6.15 Notifications | Should | Notification service | Demonstration |  |
| FR-15.3 | §6.15 Notifications | Should | Notification service | Demonstration |  |
| FR-15.4 | §6.15 Notifications | Must | Notification service | Demonstration |  |

### Non-functional requirements

| ID | Priority | Implemented by | Verification | Note |
|---|---|---|---|---|
| NFR-1 | Must | Database | Inspection | Schema review: provenance columns NOT NULL |
| NFR-2 | Must | Computation | Test | Same inputs, same profile version, identical output |
| NFR-3 | Must | Tile service | Test | Load test at stated thresholds |
| NFR-4 | Must | API framework | Inspection | Default permission asserted in settings test |
| NFR-4b | Must | API framework | Inspection | Default permission asserted in settings test |
| NFR-4c | Must | API framework | Inspection | Default permission asserted in settings test |
| NFR-4d | Must | API framework | Inspection | Default permission asserted in settings test |
| NFR-5 | Must | Database | Test | Negative tests in Annex C |
| NFR-6 | Must | Database | Test | No in-place update of a published result |
| NFR-7 | Must | Deployment | Demonstration | Full install on one server, no external service |
| NFR-8 | Must | Frontend, data | Inspection | Three locales present for all reference data |
| NFR-9 | Must | Frontend | Inspection | WCAG 2.1 AA audit |
| NFR-10 | Must | All layers | Test | No endpoint returns 0 for an absent value |
| NFR-11 | Must | Frontend | Inspection | Keyboard and screen-reader pass |
| NFR-12 | Must | Operations | Demonstration | Restore exercised before handover, not assumed |
| NFR-13 | Should | Operations | Demonstration |  |
| NFR-14 | Must | Deployment | Test | Concurrency load test |
| NFR-15 | Must | Assistant | Test | Time to first token and to completion |
| NFR-16 | Must | Frontend | Demonstration | 360 px to 1920 px |
| NFR-17 | Must | Database | Inspection | Deletion path absent from API and interface |
| NFR-18 | Must | Storage | Inspection | Checksums recorded, bodies not in the database |

**146 requirements** — 125 functional, 21 non-functional. **134 Must · 12 Should · 0 Could.**

Status is deliberately absent. Nothing in the application layer is built (§10), so a status column would read *not started* on every row and say less than this sentence does. It is added when implementation begins.

<!-- ANNEX-G:END -->

---

*End of document.*
