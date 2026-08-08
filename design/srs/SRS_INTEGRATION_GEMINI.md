# Integrating the IEEE 29148 draft

**Source** "AI-Enabled National Disaster Risk & Vulnerability WebGIS Platform",
SRS v1.0, drafted by Gemini 2.5 Pro
**Date** 30 July 2026 · **Decisions confirmed by Milinda**

---

## Summary

The draft is a well-formed IEEE 29148 document: 20 modules, ~180 requirements,
proper Must/Should/Could prioritisation, personas, a traceability matrix, and a
security section. It is stronger than our SRS in **structure and breadth**.

It was written without sight of what exists. It does not know about the 174
catalogued variables, the 330 validated DS divisions, the 243 workbooks, the
28-table database that is built and passing tests, or the React frontend that is
already running. Taken wholesale it would discard all of it.

So the merge is selective. Of 20 modules:

| Decision | Modules | Meaning |
|---|---|---|
| **Adopt** | 6 | Real gaps in our spec. Merged into SRS v1.2 |
| **Adapt** | 9 | We have the capability; take the draft's rigour, keep our model |
| **Defer** | 3 | Valuable, but Phase 2 — recorded in Annex F, not dropped |
| **Reject** | 2 | Contradicts working code or the deployment reality |

---

## The three conflicts, and how they were settled

### 1 · The risk equation — *keep ours, add risk on top*

The draft uses the Sendai / IPCC AR5 standard:

```
Risk = Hazard × Exposure × Vulnerability
```

Ours puts exposure *inside* vulnerability:

```
Vulnerability = f(Exposure, Hazard)
```

Both are legitimate; they decompose the same thing differently. But ours is the
non-standard one, and our 174 variables are already classified into exactly two
domains — hazard and exposure — with weights carried over from the legacy
workbooks. Re-classifying into three groups would invalidate all 243 profiles.

**Settled:** keep the two-domain vulnerability computation exactly as built, and
add **risk as a second, separately stored output** layered on top. The hazard and
exposure indices we already compute feed straight into it; the only genuinely new
input is exposure *of assets* — population, roads, schools, hospitals within the
hazard zone — which the spatial toolbox can compute today from layers already
staged.

This is the best of the two. Nothing built is invalidated, the platform gains a
Sendai-standard number a funder will recognise, and it can finally answer *"how
many people are at risk"* — which our design could not.

New in SRS v1.2: **§2.6** and **§6.12**.

### 2 · The stack — *keep ours, take GeoServer*

The draft specifies Angular 20 + NestJS + MinIO + Redis + BullMQ + Kubernetes.
We have React + OpenLayers running and FastAPI + PostGIS built and tested.

**Settled:** keep ours. Add **GeoServer** for OGC services, which is the one piece
worth having — WMS/WFS/WMTS lets other agencies consume the data directly, and it
solves the tile-performance problem at the same time.

Rejected, with reasons:

| Rejected | Why |
|---|---|
| Angular 20 + Angular Material | Would discard the working React frontend reviewed on 30 July |
| NestJS | FastAPI is specified, and the AI layer is Python anyway — one language fewer |
| Kubernetes | NFR-7 requires single-server operation on government hardware |
| MinIO / S3 | PostgreSQL large objects are sufficient at this data volume |
| Separate Redis + BullMQ | PostgreSQL-backed job queue avoids a second datastore for a workload measured in jobs per day |

### 3 · Scope — *core plus the cheap wins*

The draft's ~120 "Must" requirements include five separate AI agents, a fourteen-
tool GIS toolbar, MFA, SMS gateways, scheduled reporting and Kubernetes
orchestration. That is a multi-team, multi-year programme. Our backend
application has not been started.

**Settled:** adopt what closes a real gap at low cost. Everything else goes to
**Annex F — Phase 2 backlog**, recorded with its origin so it is deferred rather
than lost.

---

## What the draft found that we had missed

These are the genuine catches. Each is now in SRS v1.2.

| # | Gap | Why it matters |
|---|---|---|
| G-1 | **Tamil** | Our NFR-8 specified English and Sinhala only. Tamil is an official language of Sri Lanka. For a government platform this is a compliance failure, not a nice-to-have. |
| G-2 | **No audit log** | 28 tables and not one records who changed what. A platform steering public money needs this, and it is cheap to add now and painful to retrofit. |
| G-3 | **No OGC services** | Nothing exposed WMS/WFS/WMTS. Other agencies cannot consume the data without asking for a file. |
| G-4 | **AHP and entropy weighting** | We only supported direct numeric entry. Expert panels genuinely do work by pairwise comparison, and AHP produces a consistency ratio that tells you when a panel has contradicted itself. That is exactly the credibility check our offline sign-off lacks. |
| G-5 | **Validation error codes** | Ours said "errors reported per cell". The draft specifies 15 coded messages with formats. Testable rather than aspirational. |
| G-6 | **No Must/Should/Could** | Every requirement in our SRS read as equally mandatory, which makes scope negotiation impossible. |
| G-7 | **Health check and backup** | Neither was specified. Both are asked for at handover. |
| G-8 | **Personas** | The draft's three personas make the actor table concrete. |
| G-9 | **Time slider and swipe compare** | We have two periods and no way to see the change between them on the map. |
| G-10 | **Exposure-at-risk KPIs** | Population, roads, schools and hospitals in the hazard zone. Follows for free once risk is added, and it is the number a planner actually wants. |

**G-1 and G-2 are the two I should have caught.** Tamil in particular — the DS
division register already carries a Sinhala name column and no Tamil one.

---

## Module-by-module

| # | Module | Decision | Note |
|---|---|---|---|
| 1 | User & role management | Adapt | Have actors and roles; take sector scoping, lockout, soft delete |
| 2 | Authentication | Adopt | JWT with refresh rotation, password policy, httpOnly cookies. MFA → Phase 2 |
| 3 | Spatial data management | Adapt | `spatial_layer` catalogue exists (D8); take the wider format list and CRS handling |
| 4 | Layer management | Adapt | Take basemaps, styling, classification methods, reordering |
| 5 | Hazard management | Adapt | Hazard table exists; historical hazard events → Phase 2 |
| 6 | Sector management | Have | 8 sectors, 12 subsectors already catalogued |
| 7 | Indicator & weight management | **Adopt** | AHP + entropy are new. Weight versioning we already have |
| 8 | Data import & validation | **Adopt** | Take the 15 coded validation rules verbatim |
| 9 | Vulnerability engine | Have | Normalisation methods align. Add z-score and rank explicitly |
| 10 | Risk engine | **Adopt** | The substantive addition — see conflict 1 |
| 11 | Temporal analysis | **Adopt** | Time slider, swipe, trend. Fits our year-range model |
| 12 | WebGIS visualisation | Adapt | Measure, print, share, bookmark → V1. Route, 3D, nearest facility → Phase 2 |
| 13 | AI agents | Defer | One assistant with tools, not five configured agents. Same capability, one config |
| 14 | Dashboard & analytics | Adapt | KPI cards and priority ranking → V1. Decision-support view → Should |
| 15 | Reporting & export | Adapt | PDF, PNG, CSV → V1. Word, PowerPoint, scheduling → Phase 2 |
| 16 | Notifications | Defer | In-app only in V1. Email → Should, SMS → Phase 2 |
| 17 | System administration | Adapt | Have most; take the admin console section list |
| 18 | Audit & version control | **Adopt** | Real gap |
| 19 | API & OGC interoperability | **Adopt** | Real gap |
| 20 | Security, backup, performance | Adopt | Mostly added in v1.1 after the live review; take backup and health check |

---

## Where the draft is wrong about Sri Lanka

Worth correcting before any of it is quoted:

- **"~331 DS Divisions"** — the official shapefile contains **330**. This is a
  known discrepancy already logged as open item O-3; the draft repeats the
  commonly quoted figure without the caveat.
- **"~14,022 GN Divisions"** — the deployed system holds **14,019**.
- **SRID 5235 for storage.** The draft stores geometry in EPSG:5235. We store in
  **4326 and measure in 5235**, which is the safer arrangement: web clients and
  OGC services expect 4326, and reprojecting on every request is wasteful.
  Measurement is where the projection actually matters.
- **Weights summing to 1.0.** Ours sum to **100 per domain**. Same thing, but the
  per-domain part is not optional — a hazard set and an exposure set are weighted
  separately and never pooled.

---

## What this does not change

The vulnerability model (§2), the data foundation (§5.1–5.4), and the 28-table
data model (§8) stand. The draft proposes a different schema; ours is built,
tested, and holds concepts the draft's does not — period rules, provenance
tracks, indicator aliases, and the two-step commit that keeps a computed value
traceable to the job that produced it.

The draft's schema has no periods, no tracks, no aliases, and writes computed
values directly. Adopting it would be a step backwards.
