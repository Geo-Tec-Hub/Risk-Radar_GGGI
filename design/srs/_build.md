# Software Requirements Specification

## Risk Radar — DS-Division Climate Vulnerability Assessment Platform, Sri Lanka

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 29 July 2026 |
| **Status** | For review |
| **Owner** | Milinda |
| **Prepared for** | GGGI and project stakeholders |

---

## Executive summary

Risk Radar assesses climate vulnerability for **every one of Sri Lanka's 330
Divisional Secretariat (DS) divisions**, for each combination of economic sector
and climate hazard. It replaces a spreadsheet-based process — 243 separate
provincial workbooks maintained by hand — with a single database, a consistent
computation method, and a public map.

The platform answers one question in a defensible, repeatable way:

> *Which parts of Sri Lanka are most vulnerable to which hazard, for which sector,
> and what is that judgement based on?*

**What makes this different from a mapping exercise.** Three things are unusual
and deliberate:

1. **Every published number can be explained.** A vulnerability score is stored
   alongside the exact version of the weighting that produced it. Changing a
   weight never silently rewrites history.
2. **Three parallel evidence tracks.** Measured data, expert judgement, and
   community perception are collected in the same structure and shown side by
   side. Divergence between them is a finding, not a defect.
3. **Normalisation happens in the system, never in the spreadsheet.** All
   provinces are therefore comparable by construction rather than by convention.

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
documents; and predicted-versus-actual monitoring.

**Out of scope for V1.** Real-time hazard forecasting or early warning; parcel-
or household-level assessment; automated ingestion from third-party APIs; and
any formal in-system approval workflow (see §3.4).

### 1.3 Definitions

| Term | Meaning |
|---|---|
| **DS division** | Divisional Secretariat division — administrative level 3 (ADM3). The unit of assessment. 330 nationally. |
| **GND** | Grama Niladhari division (ADM4), a finer unit. Not used in V1. |
| **Variable / indicator** | A measurable quantity, e.g. *No. of flood events 1974–2023*. |
| **Domain** | Whether a variable expresses **hazard** or **exposure**. |
| **Profile** | The set of variables and weights defining vulnerability for one sector × hazard × province. |
| **Track** | The provenance of a value: `data`, `expert` or `community`. |
| **Period** | A year range a value describes, e.g. 2020–2025. |
| **SSP** | Shared Socioeconomic Pathway (SSP1–SSP5), the IPCC scenario framework. |

### 1.4 References

| Artefact | Location |
|---|---|
| System architecture (Figure 1) | `design/architecture/system-architecture.svg` |
| Data flow (Figure 2) | `design/architecture/data-flow.svg` |
| Entity-relationship diagram (Figure 3) | `design/database/erd.svg` |
| Database schema (DDL) | `design/database/schema.sql` + addenda |
| Variable catalogue | `design/ingestion/FINAL_VARIABLES.xlsx` |
| DS-division register | `design/ingestion/dsd_register.csv` |
| Data-collection workbooks | `design/templates/generated/` (243 files) |
| Interactive prototype | `design/ui/risk-radar-ui-prototype.html` |
| Live decisions and issues log | `PROGRESS_TRACKER.md` |

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

### 3.4 Note on approval

**V1 contains no in-system approval workflow.** Data is validated against a
**local expert panel offline**; once that panel has signed off, the data officer
or administrator saves directly. The sign-off is recorded as free text against
the saved weighting (`panel_note`), so provenance survives without imposing a
gate the organisation does not use. This was a deliberate simplification.

---

## 4. System overview

![Figure 1 — System architecture](../architecture/system-architecture.png){width=6.3in}

**Figure 1 — System architecture.** Solid borders denote components built and
verified; dashed borders denote components specified but not yet implemented.

The system is a conventional three-tier web application:

- **Frontend** — React + TypeScript with MapLibre GL for the map.
- **Backend** — FastAPI (Python), exposing a REST API.
- **Store** — a single PostgreSQL instance with **PostGIS** for geometry and
  **pgvector** for the AI retrieval index. One database, not three systems.

The AI assistant is an additional retrieval layer over the same store.

---

## 5. Data foundation

This section describes what has been assembled and loaded. It is stated in
detail because the credibility of every downstream number rests on it.

### 5.1 Geography

| | |
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

### 5.2 Variable catalogue

| | |
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

---

## 6. Functional requirements

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
| FR-2.3 | Validation failures shall be reported per cell, with the file identified, and shall not partially load. |
| FR-2.4 | The importer shall read the workbook's weights tab and pre-fill the confirmation screen. Values in the workbook are advisory; the confirmed values are authoritative. |
| FR-2.5 | Uploaded values shall be stored **raw**, in native units. The system shall never accept pre-normalised input. |
| FR-2.6 | Each imported value shall be linked to its source file so an import can be reversed as a unit. |
| FR-2.7 | Legacy or ad-hoc spreadsheets shall be importable via a reconciliation path that proposes catalogue matches for unrecognised columns. |
| FR-2.8 | Manual entry shall be available for single-division updates, generated from the same catalogue. |

### 6.3 Weighting

| ID | Requirement |
|---|---|
| FR-3.1 | Weights shall be entered in the application, not carried by the data file. |
| FR-3.2 | On every import the officer shall be shown the profile's weights pre-filled and editable, with variables lacking a weight visually distinguished. |
| FR-3.3 | The system shall refuse to save a weighting unless each domain totals exactly 100% and no weight is blank. |
| FR-3.4 | Saving shall take effect immediately and create a new profile version; no approval step shall block it. |
| FR-3.5 | An optional expert-panel sign-off note shall be recorded with each saved weighting. |
| FR-3.6 | Weights shall be editable at any time from a dedicated screen, showing full change history: version, author, date, source file and sign-off note. |
| FR-3.7 | The system shall expose which profiles are computable and which are awaiting weights. |

### 6.4 Computation

![Figure 2 — Data flow](../architecture/data-flow.png){width=6.3in}

**Figure 2 — Vulnerability data flow.**

| ID | Requirement |
|---|---|
| FR-4.1 | Normalisation shall be performed server-side for all tracks identically, per the method and scope configured on each variable. |
| FR-4.2 | Normalised values shall lie in [0, 1]. |
| FR-4.3 | Normalisation scope shall be configurable as pooled across periods, per period, or fixed bounds, so results remain comparable over time. |
| FR-4.4 | The engine shall apply each variable's period-aggregation rule and shall resolve overlapping periods by preferring the later period. |
| FR-4.5 | The engine shall compute a hazard index and an exposure index per DS division, then combine them into a vulnerability index. |
| FR-4.6 | The engine shall **refuse to compute** any profile containing an unweighted variable, and shall report which are missing. |
| FR-4.7 | Each stored result shall reference the exact profile version used. |
| FR-4.8 | Where a value is missing for a period, the most recent prior value shall be carried forward and the result flagged as such. |

### 6.5 Map and visualisation

| ID | Requirement |
|---|---|
| FR-5.1 | The system shall publish a DS-division choropleth, accessible without login. |
| FR-5.2 | Users shall filter by province, sector, subsector and hazard. |
| FR-5.3 | Users shall switch between the three tracks, and view them side by side. |
| FR-5.4 | Selecting a division shall show its score, the variables and weights behind it, its profile version, and its scores across other hazards. |
| FR-5.5 | Context layers (land use, water, roads, buildings) shall be toggleable with adjustable opacity. |
| FR-5.6 | The map shall indicate where a profile has unweighted variables excluded from the displayed composition. |
| FR-5.7 | Community averages shall be shown only where n ≥ 10, always with n displayed. |

### 6.6 Scenarios and impact

| ID | Requirement |
|---|---|
| FR-6.1 | The system shall support SSP1–SSP5 scenarios, each with a parameter set that shifts indicator values. |
| FR-6.2 | The system shall project sector and subsector impact per DS division under a selected scenario and horizon. |
| FR-6.3 | Projections shall be stored distinctly from observed assessments and never conflated on the map. |

### 6.7 Spatial analysis toolbox

| ID | Requirement |
|---|---|
| FR-7.1 | Spatial layers shall be registered in a catalogue with a national attribute contract, validated on import. No layer shall require a new table. |
| FR-7.2 | The toolbox shall provide area, length, count, share, density and distance operations per DS division. |
| FR-7.3 | Area and length shall be computed in EPSG:5235. |
| FR-7.4 | Toolbox output shall be written as a **result awaiting review**, never directly as an indicator value. |
| FR-7.5 | A user shall explicitly commit a result before it becomes an indicator value, and the committed value shall retain a link to the job that produced it. |

### 6.8 AI assistant

| ID | Requirement |
|---|---|
| FR-8.1 | The system shall index project and policy documents into a vector store. |
| FR-8.2 | The assistant shall answer questions on likely impacts and candidate adaptation measures, with citations to retrieved sources. |
| FR-8.3 | Experts shall be able to review, correct and append to any assistant answer, and the reviewed version shall be what is published. |

### 6.9 Monitoring

| ID | Requirement |
|---|---|
| FR-9.1 | The system shall record observed outcomes against the corresponding projection. |
| FR-9.2 | The system shall report divergence between predicted and observed values and highlight the largest gaps. |

### 6.10 Administration

| ID | Requirement |
|---|---|
| FR-10.1 | Administrators shall manage users, roles and provincial scope. |
| FR-10.2 | Self-registration shall be possible; accounts shall require administrator approval before activation. |
| FR-10.3 | Administrators shall view all submissions and revert a profile to an earlier version. |
| FR-10.4 | Administrators shall approve or reject variables proposed during import. |

---

## 7. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | **Provenance.** Every stored value shall record its track, contributing user, source file where applicable, and period. Every computed value shall record the job or profile version that produced it. |
| NFR-2 | **Reproducibility.** Re-running a computation against the same data and profile version shall produce an identical result. |
| NFR-3 | **Spatial performance.** Map queries covering a province shall return within 2 seconds; all geometry columns shall be spatially indexed. |
| NFR-4 | **Security.** Passwords shall be stored hashed; contribution endpoints shall be authenticated and role-scoped; public read endpoints shall be unauthenticated. |
| NFR-5 | **Data integrity.** Domain rules (weights totalling 100, values in range, valid geometry, computed values requiring a job) shall be enforced in the database, not solely in application code. |
| NFR-6 | **Auditability.** No published result shall be altered in place. Corrections shall create a new version. |
| NFR-7 | **Portability.** The system shall run on a single server with no proprietary dependency. |
| NFR-8 | **Localisation.** DS-division names shall be held in English and Sinhala. |
| NFR-9 | **Accessibility.** The public map shall be usable without login on a standard browser, and shall not rely on colour alone to convey severity. |

---

## 8. Data model

![Figure 3 — Entity-relationship diagram](../database/erd.png){width=6.3in}

**Figure 3 — Entity-relationship diagram (28 tables).**

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
| `GET` | `/vulnerability` | Results filtered by province, sector, hazard, track, period |
| `GET` | `/map/geojson` | DS-division geometry joined to results |
| `POST` | `/ratings` | Community severity rating |
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
| Architecture and data-flow design | **Complete** | Figures 1–2 |
| UI design | **Prototyped** | Interactive prototype; Annex A |
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

1. DS divisions are the assessment unit; GND-level data is not required for V1.
2. Boundaries are stable for the assessment period; a mid-project boundary
   revision would require remapping historic values.
3. Expert-panel review occurs outside the system and is recorded, not enforced.
4. Data collection is a periodic exercise, not a real-time feed.

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

---

\newpage

## Annex A — Screen specification

Screens captured from the interactive prototype
(`design/ui/risk-radar-ui-prototype.html`), which runs on the **real catalogue**:
330 DS divisions, 174 variables and 243 profiles.

> **These are prototype screens, not delivered software.** They specify intended
> behaviour and have been used to validate the workflow with stakeholders. The
> frontend is not implemented.

### A.1 Access

![](figures/01-login.png){width=6.3in}

**Figure A1 — Login and role selection.** Four authenticated roles plus guest
access. Public users reach the map without credentials (FR-5.1).

### A.2 Public map

![](figures/02-map-public.png){width=6.3in}

**Figure A2 — Public vulnerability map.** DS-division choropleth with sector,
subsector, hazard and province filters, track selector, and a detail panel
showing the score, the weighted composition behind it, and comparison across
hazards. Note the advisory that variables without a weight are excluded from the
composition chart (FR-5.2 to FR-5.6).

![](figures/03-map-compare.png){width=6.3in}

**Figure A3 — Three tracks compared.** Measured, expert and community
assessments side by side, with the largest divergences listed — the mechanism by
which perception gaps become visible (FR-5.3).

### A.3 Data import

![](figures/04-entry-context.png){width=6.3in}

**Figure A4 — Step 1, context.** Track, province, sector, subsector, hazard and
period. The system reports the profile's variable count and how many lack a
weight before the officer proceeds.

![](figures/05-entry-upload.png){width=6.3in}

**Figure A5 — Step 2, upload.** The workbook is uploaded *before* weights are
discussed, so the weights screen can be pre-filled from it (FR-2.2, FR-2.4).

![](figures/06-entry-upload-done.png){width=6.3in}

**Figure A6 — Step 2, validated.** Divisions matched, variables counted, weights
read from the workbook, and remaining blanks reported (FR-2.3).

![](figures/07-entry-weights.png){width=6.3in}

**Figure A7 — Step 3, confirm weights (incomplete).** Weights arrive pre-filled
and tagged by origin. Variables with no weight are highlighted. Both domain
totals are shown live and **the Next action is disabled** while any weight is
blank (FR-3.2, FR-3.3).

![](figures/08-entry-weights-ok.png){width=6.3in}

**Figure A8 — Step 3, complete.** Both domains total 100% and the optional
expert-panel sign-off note is recorded (FR-3.3, FR-3.5).

![](figures/09-entry-review.png){width=6.3in}

**Figure A9 — Step 4, review.** Summarises what changed against the workbook and
states the effect of saving: values load, the weighting is saved as a new
version, and vulnerability is recomputed (FR-3.4, FR-1.6).

### A.4 Profile weights

![](figures/10-profile-weights.png){width=6.3in}

**Figure A10 — Profile weights.** Any profile may be selected and re-weighted at
any time, independently of an import. The change history records version, author,
date, source file and sign-off note (FR-3.6).

### A.5 Expert track

![](figures/11-expert-params.png){width=6.3in}

**Figure A11 — Expert parameters.** Variables defined by the measured-data
profile are mandatory; experts may adjust weights and add variables from their
expertise.

![](figures/12-expert-values.png){width=6.3in}

**Figure A12 — Expert value entry.** Raw values in native units, with period and
source recorded per variable (FR-2.5).

### A.6 Community track

![](figures/13-community-rating.png){width=6.3in}

**Figure A13 — Community rating.** A deliberately short flow: a 1–5 severity
rating, an optional comment and photo. The contribution threshold is kept low
because representativeness depends on volume (FR-5.7).

### A.7 Administration

![](figures/14-admin-dashboard.png){width=6.3in}

**Figure A14 — Administrator dashboard.** Users, pending registrations,
submission volume by track, and provincial coverage.

![](figures/15-admin-users.png){width=6.3in}

**Figure A15 — User management.** Role and provincial scope per user (FR-10.1).

![](figures/16-admin-registrations.png){width=6.3in}

**Figure A16 — Registration requests.** Self-registration requires approval
before activation (FR-10.2).

![](figures/17-submissions.png){width=6.3in}

**Figure A17 — Submission history.** Every submission with its track, status and
version.

### A.8 Screens specified but not yet prototyped

| Screen | Requirement |
|---|---|
| Profile composer | FR-1.4 |
| Ingestion mapping resolver | FR-2.7 |
| Impact explorer | FR-6.2 |
| Monitoring dashboard | FR-9.2 |
| Spatial toolbox | FR-7.2 to FR-7.5 |
| AI assistant chat and expert review | FR-8.2, FR-8.3 |

---

\newpage

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

\newpage

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

*End of document.*
