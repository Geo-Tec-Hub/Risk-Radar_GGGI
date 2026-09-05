---
name: risk-radar-central-data-loaded
description: Central Province is loaded and computable — what is in the database, the traps found loading it, and the readings applied while the panel confirms them
type: project
---

Established 3 September 2026. Central is the **first province with real data**.

## What is in the database

- **14,020 cells read → 4,412 distinct values**, 41 DS divisions, period
  **2021-2025** only (the 2026-2030 tab is empty). The ratio is expected, not
  loss: a raw value is keyed to variable × division × period, **not to
  profile**, so a variable shared across profiles is one fact.
- **0 rejected, 0 conflicts** — where two workbooks carried the same figure they
  agreed every time. Worth re-running that check for the next province; a silent
  last-write-wins across 33 files would be invisible.
- All 33 Central profiles report `is_computable = true`, both domains exactly
  100.000. Memberships: 229 `agreed`, 98 `contested`, 58 `rejected`,
  194 `proposed`.

## Consensus values carry specific meanings — do not flatten them

`contested` is used for a **derived** weight: it counts toward the domain total
so the profile computes, but it is visibly not an expert decision, carries a
note saying how it was derived, and is attributable. `rejected` is a superseded
variable, naming its replacement. `proposed` is a membership with no weight yet —
not counted, not excluded, keeping "not yet reviewed" separable from
"considered and rejected". Every non-agreed row is attributed to a **suspended
`panel-import@riskradar.local` service account**; a NULL decided_by would make
an exclusion indistinguishable from an oversight (SRS §2.4).

## Three traps found by running it

1. **A legacy variable NAME can be a specification.** `VERY_WET_DAYS` is named
   *"Very wet days (95th percentile) **and** 3 day cumulative rain fall (out of
   35 — 40% for very wet days and 60% for 3 day cumulative respectively)"*. It
   was a composite; the panel split it. Reading it as a 1:1 rename gave one
   component the whole weight and left the other unweighted — i.e. **excluded** —
   discarding 60% of a flood/landslide hazard variable **while the domain still
   totalled 100**, so nothing would have looked wrong. Always read the catalogue
   row, not just the code.
2. **An alias must never override a real code.**
   `VERY_WET_DAYS_95TH_PERCENTILE` was a legacy alias for `VERY_WET_DAYS` before
   becoming a variable; applying aliases blindly folded the panel's new column
   back into the one it replaced. Two columns resolving to one variable is now an
   explicit error, not last-write-wins.
3. **A global rule can be right in general and wrong for two variables.** The
   `>= 0` import rule rejected 498 of 14,020 values, all in
   `THREE_DAY_CUMULATIVE_RAINFALL` (median **−0.01**) and `OCCURRENCE_WARM_DAYS`
   — both changes or trends. Fixed **per variable** via
   `indicator_catalog.value_kind` (`absolute` / `signed`,
   `schema_signed_values_addendum.sql`), never by relaxing the rule, which would
   have accepted a negative population count.

## Two readers, by design

`app/importer/reader.py` parses only the **legacy** nine-province workbooks.
`app/importer/template_reader.py` + `load_template.py` are the **strict** path
for generated templates, where `_META` is the contract. That is the dual-path
ingestion of D3 rev 5, not duplication. The seed script and the upload endpoint
must both go through `load_workbook_values` so they cannot diverge.

Review copies are read with `expected=` (the profile as it now stands) because
the panel's `_META` describes the build they were sent; column ORDER is enforced
only for locked issues.

## Readings applied, pending the panel's confirmation

Milinda's call, 3 Sep: proceed on the best reading rather than wait. Recorded
here so the reading is never mistaken for the panel's own answer. Questions are
in `Expert Review/PANEL_QUESTIONS_CENTRAL_2026-09-03.md`.

- Both signed variables keep **`higher_is_worse`** — a wetter 3-day rainfall
  trend is worse for flood and landslide, more warm days worse for drought.
- The very-wet-days composite keeps its **40/60** split, read off the legacy
  variable's own name.
- The period splits keep **25/75**, the proportion the panel's own column
  headings state. These stay `contested`, not `agreed`.
- `3DAY_CUMULATIVE_RAINFALL` is renamed `THREE_DAY_CUMULATIVE_RAINFALL` (a code
  cannot start with a digit); their heading survives as an alias.

**Exposure if a direction answer comes back inverted:**
`THREE_DAY_CUMULATIVE_RAINFALL` carries 21 of the hazard domain's 100 points
across 18 profiles. Correcting it is one catalogue column plus a recompute —
cheap **because normalisation is server-side**. That design principle paid for
itself here.

Related: [[risk-radar-province-panel-overrides]], [[risk-radar-stage4-engine]],
[[risk-radar-unweighted-variables]], [[risk-radar-dev-database-replica]].
