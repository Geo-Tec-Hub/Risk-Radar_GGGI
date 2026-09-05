---
name: risk-radar-hazard-construct-split
description: "Risk Radar profiles define hazard two incompatible ways — 128 use a composite index, 115 use its components. RESOLVED 9 Aug 2026: components win, the missing values are coming later"
type: project
---

Found on 6 August 2026 by parsing `design/ingestion/seed_all.sql`. The single
highest-leverage open item in the project.

Every profile weights its hazard domain one of two ways, and **no profile uses
both**:

| Hazard model | Profiles |
|---|---|
| Composite index (e.g. `DROUGHT_HAZARD_INDEX`) weighted at 100% | 128 |
| Components — event counts, SPI, warm days | 115 |
| Both | 0 |

For Paddy–Drought: Central, Sabaragamuwa and Southern weight events 50 / warm
days 10 / SPI 40; Western 70 / 10 / 20; Eastern, North Central, Northern,
North Western and Uva put 100 on the composite index.

**Why it matters:** these are two different definitions of hazard wearing one
name — a hazard index of 0.7 in Ampara and 0.7 in Kandy are not the same
statement. And **all 558 unweighted memberships in the hazard domain arise from
this split and nothing else**, so one decision closes 31% of the 1,783-item
weighting backlog. The variable *set* is already identical across all nine
provinces in all 33 sector-hazard groups, so nothing needs re-collecting.

**How to apply:** SRS v2.1 §2.8 resolves it as **components, not the composite
index** (**[P-5]**), because a composite index cannot be decomposed and
decomposability is the first of the four properties in §1.6. This is stated as a
rule so the build is not blocked, but it is **not confirmed by the panel**.

**O-9 answered by Milinda, 9 August 2026: yes, eventually — just not yet.** The
component values will arrive; the Excel files are updated gradually. So **[P-5]
holds and is now confirmed**: components, one hazard construct, no rule needed
for mixing two. The composite index is a stopgap, not a parallel definition.

Three consequences. (1) The five provinces that supplied only the composite
stay **pending** — no score, not a score of zero — until their components land;
that is the existing coverage state, so no new machinery. (2) The 558 blank
hazard weights close as the files arrive, not by a decision. (3) Because data
now demonstrably arrives in instalments, **normalisation bounds must be fixed
values, never re-derived from what has been entered** — "hold until all 330
divisions report" would mean nothing publishes for months. That makes O-8
(ceilings for the 134 count variables) the next real blocker.

The other 1,225 unweighted memberships are in the exposure domain and are
diffuse — 108 variables, the twelve largest contributors accounting for 27% —
so they need genuine profile-by-profile work. Note also that 401 of the 486
profile-domain groups already total exactly 100 *while* containing an unweighted
variable, so this is a re-weighting of all 243 profiles, not a gap-fill.

Related: [[risk-radar-srs-v21]], [[risk-radar-vulnerability-formula]].
