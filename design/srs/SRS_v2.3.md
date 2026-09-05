# Risk Radar — Software Requirements Specification

## DS-Division Climate Vulnerability Assessment Platform, Sri Lanka

**Version 2.3**  ·  **9 August 2026**  ·  **Status: for implementation**

Owner NMPM Piyasena  ·  Prepared for the development team

---

This document is complete and self-contained. It is written to be built from
without reference to any earlier specification, design note or review. Where a
decision is still awaiting expert-panel confirmation it is stated as a definite
rule so the work is not blocked, and marked **[P-n]**; every such marker is
listed in Annex C with what would change if the panel decides otherwise.

Read §1 to §5 once, in order. §6 to §9 are reference material to work against.
§10 tells you what to build first.

> **What changed in version 2.3.** Two answers from the owner on 9 August 2026,
> both affecting the measurement model rather than the interface.
>
> 1. **Normalisation bounds are provincial, not national, and a province holds
>    until it is complete.** This **reverses [P-2]** and supersedes [P-3]: no
>    fixed ceilings need be stated for the 134 count and extent variables. See
>    §2.2. It is why **[O-8] is closed**.
> 2. **Hazard components will be supplied; the composite index is a stopgap.**
>    **[P-5] is confirmed** rather than assumed, and **[O-9] — the item that
>    gated §10 stage 4 — is closed.** See §2.8.
> 3. **A division carries two indexes — provincial and national — not one that
>    is later restated.** Both are stored and published; neither overwrites the
>    other. See §2.2. The exploratory workspace is **experts only** (§3.2), the
>    accepted variable set is declared by the data-entering user (§2.4), and
>    **331 is the official division count** against 330 in the shapefile.
>    **Answered 10 August 2026** — the missing division is the **Kalmunai
>    split**, registered before its polygons exist and holding no values until
>    they are collected (§11.3 [O-2]). Eastern province and the national index
>    stay unpublished until those values arrive.
>    **Superseded 14 August 2026:** the official count has moved again, to
>    **340**. The mechanism above is unchanged and correct — only the figure is
>    stale, and it is no longer written down anywhere as a live number. See
>    §5.1 and **[O-12]**.
> 4. **An unweighted variable is resolved by excluding it, not by weighting it.**
>    The remainder must total exactly 100 or the profile warns and does not
>    compute. This **supersedes [P-6]**. It unblocks **97 of the 243 profiles
>    immediately**; the hazard domain carries an exception so that excluding
>    cannot silently reinstate the composite index. See §2.4.
>
> 5. **The measurement model is now closed. Owner decision, 14 August 2026.**
>    The vulnerability index **is** the raw product min-max rescaled to
>    **[0, 1]** within its province, and the five band colours are assigned to
>    that 0–1 scale at the even fifths — `0.2 / 0.4 / 0.6 / 0.8` — permanently.
>    **[O-10] and [O-11] are both closed; [P-4] and [P-14] are confirmed.**
>    Thresholds are **not** to be re-derived from the observed distribution when
>    data arrives, and quantile and natural-breaks classification are rejected.
>    The resulting bottom-heavy distribution is accepted as an honest reading.
>    Band colour codes are specified in §2.7 and required by **FR-4.13b**. See
>    §2.1 and §2.7 for the reasoning — it turns on the legend being fixed, which
>    is what lets a map published today still be true in six months.
>
> The first has a consequence that must be read before building anything on top
> of it: **a national vulnerability index requires the complete national
> dataset**, and until it exists no quantity in this system is comparable across
> a provincial boundary. §2.2 states the two phases and what changes between
> them.
>
> 6. **The register is complete and on official codes. 14 August 2026.**
>    The owner supplied `DS_Boundary.shp` (Survey Department, 2025-10-09) —
>    **340 divisions with official codes**. **[O-12], [O-5] and [O-2] are all
>    closed.** The register, map assets, loader and all 243 workbooks are
>    regenerated from it; `ds_division.code` is now the official code, with the
>    generated `CEN-001` codes kept as `legacy_code` for diagnosis only. The nine
>    additions are **splits of existing divisions**, so each starts with no
>    values and three parent codes are retired. See §5.1.
>
> With item 5 there are **no open questions left in the measurement model** —
> §2.1 through §2.8 can be built end to end, and §10 stage 4 no longer carries a
> decision gate. With item 6, **no blocking item remains anywhere**: [O-1]
> (weights) and [O-6] (translation) close by work, [O-4] and [O-7] belong to
> phase 2. What is left is collection, not decisions.

---

# 1. Introduction

## 1.1 Purpose

Risk Radar assesses climate vulnerability for **every Divisional Secretariat
(DS) division in Sri Lanka's official register**, for each combination of
economic sector and climate hazard, and publishes the result as a public map.
The number of divisions is a property of the register, not of this
specification — see §5.1.

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
| DS division | Divisional Secretariat division, administrative level 3 (ADM3). The unit of assessment. The set is defined by `dsd_register.csv`, not by a figure in this document; some divisions are registered *boundary-pending*, carrying no geometry yet. See §5.1 and §11.3 [O-2], [O-12]. |
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

Vulnerability is computed in **two steps**.

**Step 1 — the raw index.** The two domain indices are multiplied:

```
V_raw(d, s, h)  =  Hazard(d, h) × Exposure(d, s, h)                     [P-1]
```

**Step 2 — provincial renormalisation.** The raw index is rescaled across the
divisions of its own province, so the published score uses the full range of the
colour scale:

```
Vulnerability(d, s, h) = ( V_raw(d) − min V_raw(P) ) / ( max V_raw(P) − min V_raw(P) )
                                                                        [P-14]

where P is the province of division d, over the divisions of that province
for the same sector × subsector × hazard and the same period and track.
```

Both domain indices are weighted composites of normalised indicators:

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

### Why the product, and why it is renormalised **[P-1] [P-14]**

The combination is multiplicative, not additive: a division facing no hazard is
not vulnerable however exposed it is, and a division with nothing exposed is not
vulnerable however hazardous its setting. Neither term may compensate for the
other. The product expresses that directly.

The product of two numbers in [0, 1] clusters near zero, so step 2 rescales the
result to the full range of the colour scale.

### What the published score therefore means

The renormalisation makes the score **relative to its province**, and everything
built on top of it must respect that. Four consequences follow directly from the
arithmetic and are not matters of opinion:

1. **In every province, for every profile, exactly one division scores 1.000 and
   one scores 0.000.** This is by construction, not a finding about that
   province.
2. **A score is not comparable across a provincial boundary.** The national map
   is nine independently stretched scales shown together. A division reading 0.8
   in Uva and one reading 0.8 in Western are each "high within their own
   province" and nothing more.
3. **A national ranking of divisions is not defined** and must not be published.
4. **0.000 does not mean "no vulnerability"** — it means "least vulnerable in
   this province". The zero-propagation property of the product is present in
   `V_raw` and is removed by step 2.

The interface must therefore name the quantity honestly (FR-5.13, FR-5.24) and
must not offer a single national legend implying one scale.

> **Note on band thresholds — SETTLED 14 August 2026.** Rescaling stretches the
> endpoints of a distribution; it does not change its shape, so a share of
> divisions will still fall in the lower bands after step 2. **The owner has
> decided that the bands are nevertheless the even fifths of the rescaled 0–1
> scale, permanently.** They are no longer a placeholder and are not to be
> re-derived from the data. See §2.7 for the decision and the reasoning,
> **[P-4]** (now confirmed) and FR-4.13.

### Two normalisation steps, two different scopes

These are distinct operations and are easy to confuse:

| Step | What is normalised | Scope |
|---|---|---|
| Variable normalisation (§2.2) | Each indicator, to put units on a common scale | **Provincial** — the divisions of one province, once every one of them has a value *(changed in v2.3)* |
| Index renormalisation (step 2 above) | The vulnerability index, to fill the colour scale | **Provincial** **[P-14]** |

**Both steps are now provincial.** Version 2.2 held variable normalisation at
national scope so the score composition panel (FR-5.9) could show normalised
values a reader compares between provinces. That is no longer true, and the
interface must not imply it: a normalised rainfall of 0.8 means *high for this
province*, not *high*.

The relativisation therefore happens twice — once when each indicator is scaled
across the province, and again when the index is rescaled across it.

> **Resolved 14 August 2026 by the owner — [O-11] is closed and [P-14] is
> confirmed.** Step 2 stays. The published vulnerability index **is** the raw
> product min-max rescaled to **[0, 1]** within its province, and the five band
> colours are assigned to that 0–1 scale directly (§2.7).
>
> The question step 2 was being held open for was whether it still earned its
> place now that variable normalisation is provincial too. It does, for a reason
> that is about publication rather than statistics: **a fixed 0–1 scale gives a
> fixed legend.** Every band boundary means the same number in every province,
> in every profile, in every export, permanently. Because data arrives in
> instalments over months (§2.2), any data-derived alternative — quantiles,
> natural breaks — would move the legend each time a province completed, so the
> same colour would mean different things at different times and two published
> maps of the same division could disagree without either being wrong. For a
> public map that is a defect, not a refinement.
>
> **Do not re-argue this from theory, and do not re-derive thresholds from the
> data when it arrives.** The decision is made.

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

**Geographic scope of the bounds — changed in v2.3.** Minimum and maximum are
computed across **the DS divisions of one province**, and only once **every
division of that province has a value** for the variable. A province does not
wait for the other eight.

This **reverses [P-2]**, which specified national bounds across all 330
divisions. The reversal was made by the owner on 9 August 2026 with the costs
stated in advance, and they are stated again here because everything downstream
depends on them:

- A normalised indicator value **is not comparable across a provincial
  boundary**. FR-5.9 must present it as "high for this province".
- There is **no national colour scale** and no national ranking of divisions,
  at either the indicator or the index level.
- Provincial variation is no longer isolated in the weights (§2.4), where it
  was stored, versioned and explainable. It is now also in the measurement
  scale, where it is not visible to a reader. The interface carries the burden
  of saying so — FR-5.13, FR-5.24 to FR-5.26.

What the change buys is that **a province publishes as soon as its own
collection is complete**, without waiting for national collection, and without
anyone having to state a ceiling for the 134 count and extent variables. That
closes **[O-8]**.

**Temporal scope** — `pooled` across periods (default), `per_year`, or
`fixed_bounds` using configured minimum and maximum values.

### Bounds must never move under partial entry

If bounds are re-derived from whichever divisions happen to have been entered so
far, every published score shifts when the next workbook arrives. A division's
number would change without anything about that division changing, no run would
be reproducible, and any figure already exported or cited would be silently
stale. **This is prohibited in all circumstances**, and no amount of labelling
makes it acceptable.

Two behaviours are permitted and no others:

1. **Provincial hold** — no score is computed for any division of a province
   until **every division of that province** has a value for the variable. Once
   complete, the province's bounds are fixed and do not move again while the
   phase lasts. This is the default from v2.3 and applies to all 174 variables.
2. **Fixed bounds** — the variable declares `norm_min` and `norm_max` and
   normalises against them regardless of what has been entered. Still available
   and still preferable where a bound is genuinely known — 36 variables are
   percentages bounded at 0 and 100, and 4 are composite indices already on a
   fixed scale. Using it for those 40 removes them from the hold entirely.

**[P-3] is superseded.** It preferred fixed bounds over holding because holding
meant nothing published until *national* collection completed. Under provincial
hold that objection falls away: the wait is one province long, and evidence that
collection proceeds province by province in instalments is the reason the rule
changed. The 134 counts, extents and lengths no longer need a stated ceiling.

### Two indexes, not two phases

A division carries **two vulnerability indexes for the same profile and period**,
because it has two sets of normalised values behind it:

| | **Provincial index** | **National index** |
|---|---|---|
| Bounds | The division's own province | All divisions nationally |
| Available when | Every division of *that province* holds a value | Every division *in the country* holds a value |
| Means | "How vulnerable, relative to this province" | "How vulnerable, relative to Sri Lanka" |
| Status | **The published headline score** [P-14] | A comparison view, labelled as such |
| Comparable across a provincial boundary | **No** | Yes |

This is the owner's decision of 9 August 2026 and it replaces the phased
formulation that stood earlier the same day. The difference matters: the
national index does not *supersede* the provincial one and does not cause it to
be restated. **Both are computed, both are stored, both are published, and
neither is overwritten.**

Three rules follow:

1. **They are different quantities and shall never be mixed in one view.** A
   legend, an export column or a ranking is either provincial or national and
   shall say which. A single unlabelled number is a defect.
2. **The provincial index remains the headline.** Where the interface shows one
   score without qualification, it is the provincial one, per the panel's
   instruction of 7 August 2026 **[P-14]**.
3. **The national index appears only when its precondition is met** — every
   division in the country holding a value for every variable in the profile —
   and applies to all nine provinces at once, never province by province. Until
   then a division has one index, not two, and the interface shall not imply a
   second is pending.

Because nothing is recomputed and nothing is restated, the moving-bounds problem
of §2.2 does not arise at the boundary between them: the provincial index is
fixed once its province completes and never moves again.

> **Note on the 331st division.** The official register has **331** DS divisions
> and the shapefile carries **330** — see §11.3 **[O-2]**, implemented 10 August
> 2026 as the **Kalmunai split**. Reconciling the register is necessary but not
> sufficient: the national index's precondition is a *value* for every division
> in the register, and the two new divisions start empty. So the national index
> remains uncomputable for every profile, and Eastern province remains short of
> provincial completeness, until Kalmunai Muslim and Kalmunai Tamil are
> collected — which is a longer wait than before the split, not a shorter one.

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

### Resolving an unweighted variable — owner decision, 9 August 2026

An unweighted membership is resolved by **excluding it**, not by inventing a
weight for it. The remaining weights in that domain must then total exactly 100.

This replaces **[P-6]**, which applied equal weight to the exposure domain as an
interim. Equal weight would have changed the meaning of every other weight in
the domain; exclusion leaves them untouched.

Three rules govern it, and the distinction between them is the whole substance:

1. **Exclusion is a recorded decision, never an inference.** The system shall
   not read a blank as "not significant" on its own. On saving a profile with
   blanks it shall ask, and store the answer against the membership with the
   author and the date (`consensus = 'rejected'`, §8). A blank cannot otherwise
   be distinguished from an oversight, and a score must never rest on one.

   **Who declares it — owner decision, 9 August 2026.** The declaration is made
   by the **user entering the data**, who states which variables are accepted
   for this index calculation, and it is stored against that user and date. It
   is *not* a tally of panel votes: counting objections assumes a meeting
   procedure that does not exist, and a count nobody actually records is worse
   than no count. Where disagreement is worth preserving it goes in the free-text
   note beside the declaration.
2. **If the remainder does not total 100, the system warns and refuses to
   compute** that profile (FR-4.9, Annex A V013). It shall not rescale the
   entered weights to reach 100 silently: the weights used would then not be the
   weights anyone typed.
3. **In the hazard domain, exclusion applies only to a blank composite index.**
   Where a component is blank while the composite carries the weight, the
   variable is awaiting data, not judged insignificant — the profile **holds**.
   Excluding there would leave the composite index as the whole hazard domain,
   silently reversing **[P-5]** and making the score non-decomposable.

**Measured against the seeded catalogue**, and the asymmetry is the reason rule 3
exists at all:

| Hazard-domain shape | Profiles | Under the rule |
|---|---|---|
| Components weighted, composite index blank | **115** | Composite excluded — this *is* [P-5] | 
| Composite index weighted at 100, components blank | **128** | **Held** — pending components |

In the exposure domain, 213 of 243 groups already total exactly 100 once blanks
are excluded and compute at once; **30 warn**. Combining both domains, **97 of
the 243 profiles become computable immediately** — Central 29, Western 24,
Southern 22, Sabaragamuwa 22 — and the remaining 146 are held by hazard
components or by an exposure domain that does not reach 100.

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

> **CONFIRMED 14 August 2026 by the owner. [O-10] is closed and [P-4] is no
> longer provisional.** The thresholds are the even fifths of the rescaled 0–1
> index and they are **fixed**. They are not a placeholder, they are not to be
> re-derived from the observed distribution, and quantile and natural-breaks
> classification are both **rejected**.

**Why fixed thresholds, given the distribution is skewed.** The index is
min-max rescaled to [0, 1] within its province (§2.1 step 2), so the scale is
already full and bounded by construction. Assigning colour to that scale
directly buys three things that a data-derived classification cannot:

1. **The legend never moves.** Data arrives in instalments over months. Every
   data-derived method re-cuts its bands each time a province completes, so the
   same colour would mean different numbers at different times, and two
   published maps of the same division would disagree with no error having
   occurred. A fixed legend makes a printed map, a PDF export and a screenshot
   from six months ago all still true.
2. **The band is explainable.** "This division scores 0.83 out of 1, which is
   the top fifth" is a sentence a provincial officer or a GGGI reviewer can
   check. "This division is in the top quintile of the current dataset" is not
   checkable and changes meaning as the dataset grows.
3. **Colour and number agree.** With even fifths the legend is a ruler: the
   colour is a lossy reading of the score, never an independent claim.

**The accepted cost, stated plainly.** Because a product of two [0, 1] numbers
is right-skewed and rescaling does not change a distribution's shape, the lower
bands will hold more divisions than the upper ones — simulated against the real
province sizes, the bottom band takes roughly 45–50% rather than 20%. **This is
accepted.** A map where most divisions are genuinely low-vulnerability *should*
look like that; forcing 20% into the top band by quantile would manufacture
severity that the measurement does not support. FR-4.15's distribution report is
retained as **monitoring, not as a gate** — it tells the team what the map looks
like, and it no longer feeds a threshold decision.

### Band colours

Assigned to the fixed 0–1 scale. A **single-hue sequential ramp**: severity is
carried by lightness, so the map is readable under every form of colour-vision
deficiency and in greyscale print without relying on hue discrimination.

| Band | Range | Light surface | Dark surface |
|---|---|---|---|
| Very low | `[0, 0.2)` | `#eb827b` | `#971a20` |
| Low | `[0.2, 0.4)` | `#d36963` | `#b03e3b` |
| Moderate | `[0.4, 0.6)` | `#bc504c` | `#c95d57` |
| High | `[0.6, 0.8)` | `#a43735` | `#e27a73` |
| Very high | `[0.8, 1]` | `#8d1a1e` | `#fb9890` |

**The dark-surface column is not an inversion, it is a re-step.** In both modes
*Very high* is the most visually prominent step and *Very low* the least: on a
light surface prominence is darkness, on a dark surface it is lightness. The
direction of salience is what is preserved, not the direction of lightness.

Both sets are validated: monotone lightness, every adjacent pair separated by at
least 0.06 in perceptual lightness, single hue (spread ≤ 1°), and the step
nearest the surface clearing 2:1 contrast against it. **That last check is the
important one here** — it is what stops *Very low* receding into the background
and being read as *no data*, which is the §5.6 "absent rendered as present"
defect this project has already found once.

Because the ramp is one hue, none of these five colours may be used for the
three coverage states of §5.6 (FR-5.14): *pending* carries a texture and
*unassessed* a neutral fill, neither of which appears in the ramp.

Thresholds and colours both remain **configuration** (FR-4.13, FR-4.14), so a
future change is a settings edit, not a release. That is a property of the
implementation, not an invitation — the values above are decided.

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

> **Dependency discharged, 9 August 2026.** The owner confirms that component
> values will be supplied for the provinces that historically gave the composite
> index only, through gradual updates to the collection workbooks. **[P-5] is
> therefore confirmed rather than assumed, and [O-9] is closed.** There is one
> hazard construct, not two, and no rule is required for mixing them.
>
> Until a province's components arrive, its divisions are **pending** for that
> profile — no score, *not* a score of zero (§5.6). This is the existing
> coverage state and needs no additional machinery. The 558 unweighted hazard
> memberships close as the data arrives, by collection rather than by decision.

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
| **Data officer** — registers as **"data entry authorised agency"** | Import workbooks, enter values manually, set weights, run and commit toolbox jobs. | Assigned province only |
| **Expert** | Everything a data officer may do, plus submit expert-track values, declare a profile's accepted variable set, use the exploratory workspace (§3.2), and review AI answers. | Assigned province, or national |
| **Administrator** | All of the above, plus user and role management, catalogue governance, spatial layer registration, migration. | National |

### 3.2 The exploratory workspace is for experts only

Alongside the published map there is a workspace in which a variable set and its
weights can be altered and the effect seen immediately, without changing
anything published (§6.x, T-series). **It is available to the Expert and
Administrator roles only** — owner decision, 9 August 2026.

The restriction is not about trust; it removes a class of problem. An open
workspace would produce aggregates that look like public opinion but are the
opinions of whoever happened to use it — self-selected, not population-weighted,
and repeatable by one motivated person. Public perception has its own
instrument, the **community track** (§5.2), which is structured, per division
and collected. The two shall not be conflated, and no aggregate of workspace
activity shall be presented as a measure of public opinion.

Because access is restricted, the workspace needs no rate limiting and no
public-facing disclaimer beyond its banner. What it does need is that nothing
inside it can reach a published surface: results are not persisted, exports are
watermarked, and no tile or OGC service is served from it.

> **Note on role names.** The database seeded a role called `analyst`, which
> this document has never defined. The seed was wrong, not the specification;
> `schema_auth_addendum.sql` renames it to `data_officer`. There is no Analyst
> role.
>
> **"Data entry authorised agency" is a role held by a person, not an
> organisation** (owner decision, 9 August 2026). The employing body is recorded
> as free text on `app_user.organization`. Consequence to accept: the system
> cannot reliably answer "which agency supplied this figure?", nor reassign one
> officer's work to another when they leave. Introducing an organisation entity
> later is additive and breaks nothing.

## 3.1 Public access

Public read access without authentication is a deliberate transparency
requirement. **Authentication exists to control contribution, not viewing.**

The landing page of §3.5 does **not** change this. It is a front door, not a
gate: one route from it reaches the map with no account at all.

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

## 3.5 Landing, sign-in and registration

Owner decision, 9 August 2026. The application currently opens directly onto the
map with no account concept at all; this section specifies what replaces that.

**The landing page is the front door and offers two routes:**

1. **View the map** — no account, no sign-in, straight to §6.5. This is the
   route the transparency requirement of §3.1 depends on and it must remain
   one click from the landing page.
2. **Sign in or register** — for anyone who intends to contribute.

**Registration is self-service, and the registrant chooses one of three types:**

| Chosen at registration | Role granted | May then |
|---|---|---|
| **Data entry authorised agency** | `data_officer` | Enter indicator values for one assigned province |
| **Expert** | `expert` | The above, plus expert-track values, declaring a profile's accepted variable set, and the exploratory workspace (§3.2) |
| **Public user** | `community` | Submit a 1–5 severity rating. **Not** indicator values |

**No account may write anything until an administrator approves it**
(FR-12.2). A self-registered account is created `pending`; the administrator
approves it, grants the role and — for a data officer or expert — sets the
province, without which the role cannot be granted at all (§3.2). Approval is
recorded with who and when; a rejection must state a reason, because the person
is entitled to it.

> **A cost to weigh.** Requiring approval for **public users** too means every
> community rating waits on an administrator. That will suppress community-track
> uptake, and the community track is the only honest instrument for public
> perception (§3.2). This is specified as chosen; if uptake proves poor, the
> remedy is to auto-activate the `community` type alone, which changes nothing
> else — a public user can only ever submit a rating.

**Data entry is impossible without all three of** an approved account, a granted
role that permits it, and — for indicator values — a province that matches the
data. The last is enforced server-side on every write, never only in the
interface.

## 3.4 Approval of data

**There is no in-system approval workflow for data.** Data is validated against a local
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
| Frontend | **Angular + TypeScript**, **OpenLayers** for the map |
| Backend | FastAPI (Python), REST |
| Store | PostgreSQL with **PostGIS** for geometry and **pgvector** for the AI retrieval index |
| Tiles | Server-generated Mapbox Vector Tiles (MVT) |
| Documents | Object storage for uploaded workbooks and source files; checksums in the database |

One database, not three systems. The AI assistant is an additional retrieval
layer over the same store, not a separate service with its own copy of the data.

### Why Angular, and what it replaces

An earlier React application exists — 46 files, Vite, OpenLayers 10 — and a
version of it is deployed. **It is retired as of version 2.2 and kept as
reference only** (§10.0). The frontend is rebuilt in Angular because that is
what the team building and maintaining this platform writes; a codebase the
maintainers cannot service is worth less than a rebuild, however working it is.

This reverses a decision taken on 31 July 2026, when an independently drafted
specification proposed Angular and the choice was made to keep React. That
decision was made on the grounds of preserving working code. The grounds have
changed; the decision follows.

Two things this reversal does **not** change, and they are the reason its cost
is bounded:

- **The backend is unaffected.** Angular is a frontend choice and carries no
  implication for FastAPI, the schema, the seed generators or the toolbox. The
  API contract in §9 is written against neither framework.
- **The map is a rebuild, not a redesign.** The interaction the React
  application arrived at — select divisions on the map, enter values for the
  selection in a side panel, multi-select supported — is the workflow specified
  in §6.2 and it carries over unchanged. What does not carry over is its code,
  including three defects found in review that a rebuild is an opportunity to
  not repeat: absent values rendered identically to zero, the maximum rating
  rendered invisible, and a redundant read-and-update issued after every write.

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
GeoJSON for every division makes the map take tens of seconds to draw and blocks
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

Boundaries come from official ADM1/ADM2/ADM3 shapefiles. The ADM3 source is
**`DS_Boundary.shp` (Survey Department, 2025-10-09)**, supplied by the owner on
14 August 2026: **340 divisions**, 9 provinces, 25 districts, carrying the
**official DS-division codes** in `New_DS_Cod`. It replaces `SL_RDSD.shp`, which
held an earlier 330-polygon revision.

**The register and the polygon set now describe the same objects.** Every
registered division has a boundary and every boundary has a register row —
`design/ingestion/dsd_register.csv` remains the single authority for which
divisions exist, but for the first time nothing is boundary-pending. The
mechanism that allows a division to be registered before its boundary is drawn
(`boundary_status`, `geom` nullable, §11.3 [O-2]) is retained: it cost nothing to
keep and the last three weeks are the argument for keeping it.

**Codes are the official ones and they are the join key.** `KA1`, `AM8`, `GA14`.
The generated `CEN-001` codes are retained as `ds_division.legacy_code` so a
stale reference can be diagnosed rather than silently returning nothing, and are
never a join key. Three codes are **retired and never reused** — `EAS-008`
(Kalmunai, split in two) and `CEN-032` / `CEN-034` (Ambagamuwa and Kothmale, each
split in two). A retired code must fail loudly; the alternative is a stale
reference quietly resolving to about half the area it used to mean.

**No division count is hardcoded anywhere** — not in this document as a live
statement, not in the schema, not in the smoke tests, not in the frontend. Every
count is read from the register at the moment it is needed. The count moved three
times in three weeks (330 → 331 → 340), and each move would otherwise have
required a sweep of prose, seeds, tests and assets in which one missed occurrence
is a silent defect. **That it has now settled is not a reason to write it down.**

### The 2025 boundary revision

Nine divisions are new relative to the earlier revision, and **none of them is
new land** — each is carved out of a division that already existed. Parentage was
established by overlaying the new polygons on the old set, not by matching names:

| New division | Code | Carved from |
|---|---|---|
| Ambagamuwa Korale | `NU1` | Ambagamuwa (`CEN-032`, retired) |
| Norwood | `NU7` | Ambagamuwa (`CEN-032`, retired) |
| Kothmale East | `NU3` | Kothmale (`CEN-034`, retired) |
| Kothmale West | `NU4` | Kothmale (`CEN-034`, retired) |
| Mathurata | `NU5` | Hanguranketa (`CEN-033`) |
| Nildandahinna | `NU6` | Walapane (`CEN-036`) |
| Thalawakele | `NU9` | Nuwara Eliya (`CEN-035`) |
| Kalthota | `RA10` | Balangoda (`SAB-013`) |
| Madampagama | `GA14` | Hikkaduwa (`SOU-011`) |
| Rathgama | `GA18` | Hikkaduwa (`SOU-011`) |
| Wanduramba | `GA20` | Baddegama (`SOU-003`) |

**Two known defects in the supplied geometry, recorded rather than patched.**
Two inter-district boundaries were digitised inconsistently by the agencies
either side, leaving thin overlapping ribbons:

| Pair | Overlap | Shape |
|---|---|---|
| Palugaswewa (`AN17`, Anuradhapura) ↔ Higurakgoda (`PO3`, Polonnaruwa) | 2.110 km² | 474 fragments along 24.2 km |
| Elahera (`PO2`, Polonnaruwa) ↔ Naula (`MA6`, Matale) | 0.759 km² | 228 fragments along 13.7 km |

Both average under 100 m wide — the two sides traced the same line differently,
rather than claiming the same block of land. A further 47 pairs touch with
overlaps under 20 m², which is ordinary digitising noise. Total double-counted
area is 2.9 km² of 66,034 km², or **0.004%**.

**Nothing is edited to make this go away.** No boundary may be invented, and the
correction belongs to the Survey Department. The two pairs are instead pinned by
code in `smoke_test.sql`, with a ceiling that fails if either grows — so a third
overlap anywhere still fails the build, which a merely looser threshold would
have silently admitted. The only practical effect is that area-based
apportionment in the §6.6 toolbox double-counts that 0.004%; vulnerability
scores are keyed by division rather than by area and are unaffected.

The rule that follows is the one the Kalmunai split established: **a division
created by a split starts with no values.** Copying the parent's would
double-count every count and extent variable across the pair. It also means the
*surviving* parents — Hikkaduwa, Baddegama, Hanguranketa, Walapane, Nuwara Eliya,
Balangoda — now describe a smaller area than they did, so any extent or count
value collected against the older boundary is wrong for them, not merely stale.

**The owner confirms the 2020–2025 collection is tabulated against these 340
boundaries**, so no remapping is required. Had it been otherwise, the affected
children would have been held pending rather than filled from the parent.

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

> **How to read every division count in this document.** There are three
> different quantities and they are not interchangeable:
>
> - **The official count** — how many DS divisions the Government recognises.
>   Set outside this project; the source of truth for what the register *should*
>   contain. Under reconciliation — see [O-12].
> - **The registered count** — rows in `dsd_register.csv`. The **unit of
>   assessment and the denominator for every completeness statement**, including
>   the provincial hold and the national precondition in §2.2.
> - **The drawable count** — registered divisions whose `geom` is not null. What
>   the map can draw today; always ≤ the registered count.
>
> A registered division with no boundary is a first-class object: it counts
> against completeness, it holds values, and it returns NULL — never 0 — from
> every geometric operation (§6.6). **All three counts are read from the data at
> runtime and none is written into this document as a live figure.** Where a
> number appears in a *historical* statement — what `[P-2]` specified, what a
> superseded version asserted, what a dated decision recorded — it is left as it
> was written and is not a live count.

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
rows. They are not evenly distributed: Central has 33, Sabaragamuwa and Southern
29, Uva 28, North-Western and Western 27, Eastern and North Central 24, Northern
22. This per-province total is the denominator FR-2.15 reports against. Each
workbook contains:

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
| FR-1.4 | A profile composer screen shall allow an administrator or expert to add or remove variables from a profile and set the domain and direction of each. |
| FR-1.4b | An expert who adds a variable to a profile shall be given, in the same flow, a means of supplying that variable's values for every division of the province — by spreadsheet upload against a generated template, or by manual entry. Adding a variable without a route to its data is incomplete: the variable would hold the profile indefinitely under §2.2. The system shall state, at the point of adding, how many divisions require a value and that the profile will not compute until they have one. |
| FR-1.4c | Adding or removing a variable shall create a new profile version and shall show the effect on the domain's weights before saving, since a domain already totalling 100 must be re-weighted to accommodate an addition (§5.4). |
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
| FR-2.12 | On completing an import the system shall present a **province import summary** covering three things: what was loaded, what was computed as a result, and what remains outstanding for that province. It shall be shown on screen and be retrievable later against the batch. |
| FR-2.13 | The "what was loaded" part shall state the profile, period and track imported, the number of DS divisions matched against the province's register, the number of values loaded, the number of variables covered, weights read from the WEIGHTS tab, and any values carried forward from an earlier period. |
| FR-2.14 | The "what was computed" part shall state which profiles became computable as a result of this import, the hazard and exposure indices and the raw and renormalised vulnerability index produced, the provincial minimum and maximum used in renormalisation, and the resulting distribution across the five bands. |
| FR-2.15 | The "what remains" part shall state, for the province as a whole: how many of its profiles have been imported and how many are outstanding, naming them; how many variables still lack a weight and in which profiles; and how many DS divisions in the province are assessed, pending and unassessed. |
| FR-2.16 | The province import summary shall be exportable as PDF and CSV, so a provincial officer can circulate it without access to the system. |
| FR-2.17 | The system shall maintain a **standing outstanding-data register**, available at any time without running an import, stating what has still to be supplied before each profile, each province and the national dataset can compute. It shall resolve to the level at which data is actually supplied — profile × period × variable × DS division — and shall distinguish *not yet supplied* from *supplied and rejected* from *not applicable to this province*. |
| FR-2.18 | The outstanding-data register shall name, for each unmet precondition, the specific thing that would discharge it: the divisions of a province still holding no value (§2.2), the hazard components still to arrive for a profile held under [P-5], the exposure groups whose weights do not total 100 (§2.4), and any DS division present in the official count but not yet in the register or not yet carrying a boundary (§5.1). It shall be exportable as CSV and Excel, and shall be reachable by a data officer for their own province and by an administrator nationally. |

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
| FR-4.3 | **Normalisation bounds shall be computed across the DS divisions of one province**, and only once every division of that province holds a value for the variable (§2.2). Normalised indicator values shall not be presented as comparable between provinces. *(Changed in v2.3; reverses [P-2].)* |
| FR-4.3b | When, and only when, every DS division in the official register holds a value for a variable, the system shall **additionally** compute national bounds for it and store a second, national index alongside the provincial one (§2.2). The national index shall not replace, overwrite or trigger recomputation of the provincial index. It shall become available for all nine provinces at once, never province by province. |
| FR-4.3c | Every stored and exported vulnerability index shall carry the scope of its bounds — provincial or national — as a first-class attribute, not as a presentation choice. No view, legend, export column or ranking shall mix the two, and an unqualified score shall mean the provincial index. |
| FR-4.4 | Temporal normalisation scope shall be configurable per variable as pooled across periods, per period, or fixed bounds. |
| FR-4.5 | Normalisation bounds shall not shift under partial entry. The system shall either use fixed configured bounds or hold computation until every division **of the province** has a value. It shall never re-derive bounds from whichever divisions happen to have been entered, and shall never publish a score computed on incomplete bounds. |
| FR-4.5b | The system shall report, per province and variable, how many of that province's divisions hold a value and how many are outstanding — this being the precondition for any of that province's scores existing at all. It shall not describe a score as normalised over a partial set. |
| FR-4.6 | A variable whose direction is `higher_is_better` shall have its normalised value inverted as `1 − x`. |
| FR-4.7 | The engine shall apply each variable's period-aggregation rule. |
| FR-4.8 | The engine shall compute a hazard index and an exposure index per DS division, each as the weighted sum of its domain's normalised values divided by 100, and multiply them to give the raw index `V_raw = H × E`. |
| FR-4.8b | The engine shall rescale `V_raw` by min-max across the divisions of its own province, for the same sector, subsector, hazard, period and track, to produce the published vulnerability index. |
| FR-4.8c | Both `V_raw` and the renormalised index shall be stored, together with the provincial minimum and maximum used, so any published score can be reproduced and explained. |
| FR-4.8d | Renormalisation shall not run until every division of the province has a computable score for that profile, so the provincial bounds are complete when they are applied. |
| FR-4.8e | Where a province's raw scores are all equal, the renormalised score shall be reported as undefined rather than as an arbitrary value, and the divisions shall be shown as assessed with no band. |
| FR-4.9 | The engine shall refuse to compute any profile whose weights, after excluded memberships are removed, do not total exactly 100 in each domain, and shall report which variables are unresolved. An unweighted membership is resolved only by an explicit recorded exclusion (§2.4), never by inferring insignificance from the blank itself, and never by rescaling the remaining weights to reach 100. |
| FR-4.9b | In the hazard domain, exclusion shall be permitted only where the unweighted variable is a composite hazard index. Where a component is unweighted while a composite index carries weight, the profile shall be held as pending, so that excluding cannot reinstate the composite index as the hazard domain contrary to [P-5]. |
| FR-4.10 | Each stored result shall reference the exact profile version used and the period it describes. |
| FR-4.11 | Where a value is missing for a period the most recent prior value shall be carried forward. The carried value shall retain its original track, contributor and source, shall record the period it came from, and shall be marked as carried at the point of storage — not inferred later. |
| FR-4.12 | A carried-forward value shall be visible as such: annotated in the detail panel, counted separately in the coverage statement, and excluded from any claim that a division was assessed for the period displayed. |
| FR-4.13 | The system shall classify scores into five bands with half-open thresholds at **0.2 / 0.4 / 0.6 / 0.8** on the rescaled 0–1 index. These thresholds are **fixed** (§2.7, [P-4] confirmed 14 August 2026) and shall not be derived from, or adjusted to, the observed distribution. They shall be held as configuration, changeable without a code change or a migration, so that a future decision to change them is an edit rather than a release. |
| FR-4.15 | The system shall provide a report of the observed distribution of the published index — counts and proportions per band, per province and per profile. This is **monitoring, not a threshold-setting input** ([O-10] closed 14 August 2026): it tells the team how the map reads and flags a province whose distribution is degenerate, and it shall not be presented as a proposal to re-cut the bands. |
| FR-4.13b | The five bands shall be rendered with the single-hue sequential ramp specified in §2.7, in a light-surface and a dark-surface variant, held as configuration alongside the thresholds. Severity shall be carried by lightness, not by hue, so that the map remains readable under colour-vision deficiency and in greyscale. No band colour shall be reused for any of the three coverage states (FR-5.14), and the band nearest the surface shall retain at least 2:1 contrast against it so that the lowest band cannot be read as absent data. |
| FR-4.14 | Recomputation against the same data and profile version shall produce an identical result. |

## 6.5 Map and visualisation

*Verification: demonstration, plus automated tests for coverage and absence rules.*

The map is the application. There is no dashboard standing between the user and
the geography. Three controls — sector, hazard, administrative level — with a
province filter, and the ranking and value table beside the map.

### Core map

| ID | Requirement |
|---|---|
| FR-5.1 | The system shall publish a choropleth of the real administrative boundaries, rendered with OpenLayers in the Angular client, accessible without login. |
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
| FR-5.9 | Selecting a division shall show the full composition of its score: hazard index, exposure index, every contributing variable with its weight, direction, raw value, normalised value and unit. Each normalised value shall be labelled as relative to its province and shall state the provincial minimum and maximum that produced it, since from v2.3 it is not comparable across a provincial boundary (§2.2). |
| FR-5.10 | The composition shall name the profile version, track, period and contributing user for every value shown. |
| FR-5.11 | The system shall show the same division compared across hazards and across tracks. |
| FR-5.12 | Every published figure shall carry its source citation and the date it was last updated. |
| FR-5.13 | The legend shall name the quantity displayed. A vulnerability map shall not be labelled *risk*. |
| FR-5.24 | Because both the indicator values and the published index are scaled within each province (§2.1, §2.2), the map shall state that scores are **relative to the province** and shall not present a single national legend implying one scale. Where divisions from more than one province are shown together, the interface shall say so. |
| FR-5.24b | The interface shall not offer any cross-province comparison based on the provincial index or on normalised indicator values, at any time. Cross-province comparison shall be offered only through the national index, only once it exists, and only with its scope named. Where both indexes exist for a division, both shall be shown together with what each means, and neither shall be presented as a correction of the other. |
| FR-5.25 | The system shall not offer a national ranking of divisions by the published index. Rankings shall be scoped to a province. |
| FR-5.26 | The score composition panel shall show both the raw index and the renormalised index, with the provincial minimum and maximum that produced it. |

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

*Verification: test against the real division polygons — the drawable count, not
the registered count (§5.1); a boundary-pending division has no geometry to
intersect and must return NULL, never 0. The test asserts the relationship, not
either number.*

Many indicators are not collected as numbers — they are derived from geometry.
*% forest cover*, *% water surface area*, *flood-affected road length* and
*buildings in landslide-prone areas* are all questions about the intersection of
a map layer with a DS division. The toolbox computes them in the database,
against the same polygons the map draws.

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
| FR-12.2 | Self-registration shall require administrator approval before activation. The registrant shall choose one of three types — data entry authorised agency, expert, or public user — and that choice shall be stored as *requested*, distinct from the role an administrator actually grants (§3.5). |
| FR-12.7 | The system shall present a landing page as its entry point, offering at least a route to the public map requiring no account and a route to sign in or register. The public-map route shall not be gated (§3.1, FR-5.1). |
| FR-12.8 | On sign-in the system shall route the user according to the roles granted to them, and shall show only the actions those roles permit. Hiding an action in the interface shall never be the only control: every write shall be authorised server-side against role and province (§3.2). |
| FR-12.9 | An administrator approving a registration shall grant a role and, for a data officer or expert, assign exactly one province. The system shall refuse to grant either role without a province. A rejection shall record a reason, and the reason shall be available to the applicant. |
| FR-12.10 | An account that is pending, rejected or suspended shall be able to read whatever the public may read and to write nothing. The interface shall state which of those states the account is in rather than failing silently. |
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
| GET | `/imports/{id}/summary` | Province import summary — loaded, computed, outstanding (FR-2.12) |
| GET | `/provinces/{code}/status` | Standing view of the same summary for a province, independent of any batch |
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
| DS-division register — every registered division loaded; all divisions carrying a boundary topology-validated | **Reopened** — see [O-12]; boundary-pending rows loaded and correct |
| Collection workbooks — 243 files, 17,826 rows | Complete |
| Database schema — 28 tables, automated tests pass | Built and verified |
| Reference and catalogue data loaded | Built and verified |
| Spatial toolbox schema and six operations | Built, not exercised |
| Architecture and data-flow design | Complete |
| React frontend — 46 files, OpenLayers 10, partly deployed | **Retired (§4.1).** Reference only: read it for the entry workflow and the three defects listed there, do not extend it |
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
7. Province import summary — loaded, computed, outstanding (FR-2.12 to FR-2.16).

**Exit condition:** one fixture workbook per validation code, each producing its
stated error and loading nothing.

## Stage 4 — Normalisation and computation engine

1. Provincial-bounds normalisation with all three methods and three temporal
   scopes (§2.2 — the bounds became provincial in v2.3).
2. Direction inversion.
3. Period resolution and carry-forward with marking.
4. Hazard and exposure indices, then the raw product `V_raw = H × E`.
5. Provincial renormalisation of `V_raw` to [0, 1], storing the bounds used.
6. Banding at the fixed thresholds, read from configuration, with the §2.7
   colour ramp applied (FR-4.13, FR-4.13b).
7. Refusal on unweighted variables, with a report of which.
8. The FR-4.15 distribution report — as monitoring, not as an input to
   thresholds ([O-10] closed).

**Exit condition:** recomputation is bit-identical; a profile with one unweighted
variable refuses and names it; a division outside a variable's data returns
unassessed, not zero; every province produces exactly one 1.000 and one 0.000
per profile, which is the signature that step 2 ran correctly.

**This stage no longer carries a decision gate.** Earlier drafts held stage 4
open pending two questions — whether step 2 earned its place ([O-11]) and where
the band thresholds should sit ([O-10]). Both were closed by the owner on
14 August 2026. Build steps 5 and 6 as specified; do not stop to re-derive
thresholds from whatever data has arrived.

## Stage 5 — Tiles and the public map

*This stage stands up the Angular client (§4.1). Everything the frontend does in
later stages builds on what is scaffolded here, so the routing, the map
component and the API layer are set up once, properly, at this point.*

1. Angular application scaffold: routing, the OpenLayers map component, a typed
   API client generated from or checked against §9, and environment
   configuration with no hardcoded API host.
2. Vector tile generation with per-zoom simplification.
3. Choropleth with three coverage states rendered distinctly. **The rule is
   NFR-10: an absent value is not a zero.** The retired React client failed
   exactly here, and no rebuild is worth doing if it repeats that.
4. Sector, subsector, hazard, province, track and period controls.
5. Score composition panel.
6. Coverage statement and coverage screen.
7. Ranking chart and value table.
8. Shareable URL state, print output, error and loading states.

**Exit condition:** NFR-3 timings met at national extent; no view anywhere
renders an absent value as zero; a coverage state is asserted by an automated
test, not by looking at the map.

## Stage 6 — Spatial toolbox

1. Layer registration with attribute contract and coverage extent.
2. The six single-layer operations, then the two-layer operation.
3. Job queue, review on map, commit with job linkage.
4. Extent-aware zero handling (FR-6.9).

**Exit condition:** a committed value traces back to layer, operation and
parameters; a division outside a layer's extent is unassessed.

## Stage 7 — Community and expert tracks

1. Expert value entry — select divisions on the map, enter values for the
   selection in a side panel, multi-select supported (§6.2). This interaction
   carries over from the retired React client; its code does not.
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
| O-1 | Weights for 1,783 memberships — **substantially reduced 9 August 2026** by the exclusion rule in §2.4: 97 of 243 profiles compute immediately. What remains is 128 profiles held for hazard components (closing by collection, not decision) and **30 exposure groups whose weights do not total 100**, which need real attention. | 146 profiles cannot be computed until resolved |
| ~~O-2~~ | ~~331 official against 330 in the register; the missing division unidentified~~ — **ANSWERED 10 August 2026: the Kalmunai split.** `EAS-008 Kalmunai` is held as one row where the official register carries **Kalmunai Muslim** and **Kalmunai Tamil** separately. Ampara goes 19 → 20 and the register 330 → **331**. Three rules go with the answer: **`EAS-008` is retired and never reused**, so a stale reference fails rather than silently resolving to half the original area; **both rows are registered before their polygons exist**, carrying an explicit *boundary-pending* state, because no boundary may be invented and no division may be silently dropped for lacking one; and **both start with no values**, since copying the parent's would double-count every count and extent variable across the pair. The **naming is provisional** pending an official source — the count of 331 is not | **Implemented 10 August 2026 (T1c, Stage 1.14) — no longer scheduled work, this is the live database.** `ds_division.geom` is nullable via `schema_boundary_pending_addendum.sql`, applied and negative-tested; the register, `seed_all.sql`, all 243 workbooks and the live database all read 331 (329 surveyed, 2 boundary-pending). Note it moves Eastern province *further* from the completeness §2.2 requires, not closer, because two of its divisions now hold no values by design. This is the correct outcome and is not a regression: 330 was never complete, it was incomplete and silent. |
| ~~O-3~~ | ~~Two subsectors hold legacy data for one province only~~ — **CLOSED 9 August 2026.** Some sectors genuinely exist in some provinces only; Vegetables & OFC and Inland Fishery are Central-province sectors. Collection is not incomplete, **no further workbooks are required**, and the count stands at 243 | — |
| O-4 | Self-hosted language and embedding model not yet selected | Blocks the AI layer only |
| ~~O-5~~ | ~~Official DS-division codes, if they exist, not yet adopted~~ — **CLOSED 14 August 2026.** `DS_Boundary.shp` carries them in `New_DS_Cod`; adopted as `ds_division.code` by `schema_official_dscode_addendum.sql`, with the generated codes kept as `legacy_code` for diagnosis only. Taken now precisely because **no bulk data has been entered yet** — the same migration after collection would have meant re-keying every uploaded value | — |
| O-6 | Tamil names are not held for any reference data, and **eleven divisions now have no Sinhala name either** | Blocks NFR-12. A translation exercise across all 340 divisions, 8 sectors, 3 hazards and 174 indicators. **Now unblocked to start** — [O-12] closed on 14 August 2026, so the register will not move underneath the work. The eleven divisions created by the 2025 revision (§5.1) carry an English name only; the other 329 inherit the Sinhala name held against their pre-revision row |
| O-7 | Asset layers for the phase-2 risk term are not loaded, and `POPULATION` and `FACILITY` are not registered at all | Blocks §6.9 only. Vulnerability is unaffected |
| ~~O-8~~ | ~~Fixed bounds for the 134 count and extent variables~~ — **CLOSED 9 August 2026.** Provincial bounds with a provincial hold (§2.2) mean no ceiling need be stated | — |
| ~~O-10~~ | ~~Band thresholds are a placeholder until real values are loaded~~ — **CLOSED 14 August 2026 by the owner.** The thresholds are the even fifths of the rescaled 0–1 index and are **fixed**; quantile and natural-breaks classification are rejected. The bottom-heavy distribution this item was raised about is **accepted** as an honest reading rather than corrected by re-cutting the bands (§2.7). Band colours specified in the same section; FR-4.15 is retained as monitoring | — |
| ~~O-9~~ | ~~Whether component hazard values exist for the provinces that historically supplied only a composite index~~ — **CLOSED 9 August 2026.** They will be supplied through gradual workbook updates; **[P-5]** confirmed (§2.8). §10 stage 4 is no longer gated | — |
| ~~O-11~~ | ~~Whether the provincial index rescale (§2.1 step 2) still earns its place now that variable normalisation is also provincial~~ — **CLOSED 14 August 2026 by the owner.** Step 2 stays: the index is min-max rescaled to [0, 1] within its province and the band colours are assigned to that scale directly. Decided on publication grounds rather than statistical ones — a bounded 0–1 scale is what makes the legend fixed (§2.1, §2.7). **[P-14]** confirmed | — |
| ~~O-12~~ | ~~The official DS-division count has moved again — 340 official against a register of 331, nine divisions unregistered~~ — **CLOSED 14 August 2026.** The owner supplied `DS_Boundary.shp` (Survey Department, 2025-10-09): 340 divisions, with official codes, valid geometry, 25 districts and 9 provinces all resolving, 0 duplicate names or codes, and the polygons tiling the country to within 0.004%. The register, the map assets, the loader and the 243 workbooks were regenerated from it. The nine additions are **splits of existing divisions, not new land** (§5.1), so each starts with no values and three parent codes are retired | **The national index is no longer blocked by the register.** Its precondition is now a *value* for every one of the 340 divisions — which is collection, not reconciliation. Note the register being complete moves every affected province *further* from publishing, not closer, because eleven divisions now hold no values by design; that is the correct outcome, the same one the Kalmunai split produced |

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
| DS divisions | Read from `dsd_register.csv` at runtime — registered, drawable and official counts differ (§5.1, [O-12]) |
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
| **P-1** | `V_raw = Hazard × Exposure`, the raw product with no transform | §2.1, FR-4.8 | A monotonic transform such as `√(H × E)` would change the spacing of scores but not their order, so bands would need re-deriving either way |
| ~~**P-2**~~ | ~~Normalisation bounds computed across all 330 divisions nationally~~ — **REVERSED 9 August 2026 by the owner.** Bounds are provincial, applied once a province is complete (§2.2, FR-4.3). The consequences the "if reversed" column anticipated are now in force: no national colour scale, no national ranking, and no cross-province comparison of any quantity until §2.2 phase 2 | §2.2, FR-4.3 | Reinstating national bounds means nothing publishes until all 330 divisions report, for every one of the 134 unbounded variables |
| ~~**P-3**~~ | ~~Fixed bounds preferred over holding computation~~ — **SUPERSEDED 9 August 2026.** The preference existed because holding meant waiting for *national* collection. Under the provincial hold of §2.2 the wait is one province long, so holding is now the default and fixed bounds are retained only for the 40 variables whose bounds are genuinely known | §2.2, FR-4.5 | — |
| **P-4** | Five bands, half-open, at 0.2 / 0.4 / 0.6 / 0.8 on the rescaled 0–1 index — **CONFIRMED 14 August 2026 by the owner; O-10 closed.** No longer provisional, and explicitly not to be re-derived from the data | §2.7, FR-4.13, FR-4.13b | Thresholds are configuration, so a change is a settings edit. Four bands would need the legend and the risk banding changed with it. Reverting to a data-derived classification would make the legend move as each province completes, which is the specific outcome this decision rejects |
| **P-5** | Hazard expressed as components, not as a composite index — **CONFIRMED 9 August 2026; O-9 discharged.** No longer provisional | §2.8 | The composite index becomes the hazard domain in every profile. Scores stop being decomposable, which conflicts with §1.6 and FR-5.9 |
| ~~**P-6**~~ | ~~Equal weight applied to the exposure domain as an interim~~ — **SUPERSEDED 9 August 2026 by the owner.** An unweighted membership is resolved by explicit exclusion, with the remainder required to total 100 (§2.4). Equal weight would have altered every other weight in the domain; exclusion does not | §2.4, §5.4 | — |
| **P-7** | Periods are non-overlapping: to 2025, then 2026–2030 | §2.5 | Periods overlap at 2025 and a resolution rule is required, with the determinism fix in §8.4 becoming load-bearing |
| **P-8** | NAP relationship recorded as a crosswalk, not by restructuring sectors | §5.3, FR-1.8 | The sector table is rebuilt to the NAP's 13. Agriculture must be dissolved across two NAP sectors and 243 profiles change their sector reference |
| **P-9** | Four NAP entries registered as not assessable | §5.3 | They become assessable sectors requiring indicators, profiles and weights that do not exist |
| **P-10** | Filling gaps inside covered NAP sectors is phase 2 | §5.3 | A second collection round enters version 1 scope: new variables, workbooks and weighting for rubber, energy, marine fisheries, watershed and estate infrastructure |
| **P-11** | The fourteen intersection variables are collected as data until hazard-extent layers exist | §6.6 | Hazard-extent geometry must be sourced and loaded before those variables can be used at all |
| **P-12** | The risk layer is specified but deferred to phase 2 | §1.3, §6.9 | Risk enters version 1, requiring asset layers, the two-layer operation and the population source in O-7 |
| **P-14** | The published index is the raw product rescaled by min-max **within its province** | §2.1, FR-4.8b | If rescaling were national, scores would be comparable across provinces and a national ranking would be possible; if there were no rescaling at all, the score would be absolute and FR-5.24 to FR-5.26 would fall away. Expert-panel instruction, 7 August 2026. **CONFIRMED 14 August 2026 by the owner; O-11 closed.** The v2.3 doubt — that provincial variable normalisation had already done step 2's work — is resolved in favour of keeping it: the bounded 0–1 output is what makes the band legend fixed and permanent (§2.7). No longer provisional, and not to be reopened from theory |
| **P-13** | GND is a display level where data exists; community rating stays at DS division | §6.5, §6.7 | The community rating key changes to GND, and the n ≥ 10 threshold becomes far harder to reach across 14,019 units |

---

# Annex D — Requirements summary

| Group | Section | IDs | Count |
|---|---|---|---|
| Catalogue and profiles | 6.1 | FR-1.1 – FR-1.8 | 10 |
| Data collection and import | 6.2 | FR-2.1 – FR-2.18 | 18 |
| Weighting | 6.3 | FR-3.1 – FR-3.14 | 14 |
| Normalisation and computation | 6.4 | FR-4.1 – FR-4.15 | 24 |
| Map and visualisation | 6.5 | FR-5.1 – FR-5.26 | 27 |
| Spatial analysis toolbox | 6.6 | FR-6.1 – FR-6.16 | 16 |
| Community track | 6.7 | FR-7.1 – FR-7.8 | 8 |
| Scenarios and impact | 6.8 | FR-8.1 – FR-8.6 | 6 |
| Risk layer *(phase 2)* | 6.9 | FR-9.1 – FR-9.8 | 8 |
| AI assistant | 6.10 | FR-10.1 – FR-10.7 | 7 |
| Monitoring | 6.11 | FR-11.1 – FR-11.3 | 3 |
| Administration | 6.12 | FR-12.1 – FR-12.10 | 10 |
| Audit and versioning | 6.13 | FR-13.1 – FR-13.5 | 5 |
| Interoperability | 6.14 | FR-14.1 – FR-14.5 | 5 |
| Migration | 6.15 | FR-15.1 – FR-15.8 | 8 |
| **Functional total** | | | **169** |
| Non-functional | 7 | NFR-1 – NFR-20 | 20 |
| **Total** | | | **189** |

**A count exceeds its range where suffixed IDs were inserted** — `FR-1.4b`,
`FR-4.3b`, `FR-4.8c`, `FR-12.7` and the rest. That is the identifier rule in §6
working as intended: IDs are never renumbered, so the range endpoints and the
count are independent facts and both are stated. Regenerated 14 August 2026 by
counting definition rows in §6, not by hand; re-run the same count after any
requirement is added.

Status is deliberately absent from this table. Nothing in the application layer
is built, so a status column would read *not started* on every row and say less
than this sentence does. It is added when implementation begins.

---

*End of document.*
