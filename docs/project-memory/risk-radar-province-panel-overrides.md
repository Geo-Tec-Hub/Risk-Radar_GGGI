---
name: risk-radar-province-panel-overrides
description: How a returned provincial expert review is folded back into the templates — the two sidecar config files, the pinned baseline, and the decisions Central settled on 3 Sep 2026
type: project
---

Established 3 September 2026, when the **Central Province panel returned all 33
workbooks**. Read this before processing any other province's return.

## A returned review carries three different kinds of change

Central's did, and they need separating before anything is regenerated:

1. **Structural mark-up** — they renamed both period tabs to `2021-2025` /
   `2026-2030` but could not change the YEAR_START/YEAR_END cells, which were
   locked. `NOTED.xlsx` says so explicitly.
2. **A catalogue change** — 10 new columns inserted on the data tabs, splitting
   four combined-period variables 25%/75% and adding two new ones.
3. **Real data** — ~12,700 values on the 2021-2025 tab. Central's return is the
   **first actual dataset**, not just a marked-up template.

## Retirement is decided by evidence, not by assumption

A legacy variable is retired only when its *stated successor is present* and the
panel left the parent **completely empty in every profile** while filling the
successor. On that test four parents retired
(`DROUGHT_EVENTS_1974_TO_2022`, `FLOOD_EVENTS_1974_TO_2023`,
`MAXIMUM_{DROUGHT,FLOOD}_AFFECTED_PEOPLE_DURING_1974_TO_202x`, `VERY_WET_DAYS`)
and `LANDSLIDE_EVENTS_1974_TO_2023` / `LIGHTNING_INCIDENTS_1974_TO_2023` did
not — they still carry data. Do **not** retire on emptiness alone: 75 of 189
columns were unfilled, most of them simply not yet collected.

## Folded in as configuration, never by editing the experts' file

`FINAL_VARIABLES.xlsx` is the experts' own artifact and is not edited. Two
sidecars in `design/ingestion/`, both produced by
`build_province_overrides.py` so the derivation is reproducible for the next
province:

- **`catalog_addendum.csv`** — new variable definitions, merged by
  `load_catalog()`. Keeps provincial additions separable from the national
  catalogue.
- **`province_variable_overrides.csv`** — `add` / `retire` / `weight` rows per
  (province, sector, subsector, hazard), applied on top of national membership
  in `main()`. Central: 116 / 58 / 4.

`apply_province_panel.py` turns those into `panel_central.sql`, which re-saves
every affected profile through `save_profile_weights()` — the only supported way
to change a weighting, because it versions the profile, enforces the per-domain
100 rule and refuses to lose an exclusion.

## The baseline must be immovable — this bit off once

`build_province_overrides.py` diffs the returned files against **the build the
panel was sent**, pinned at `design/templates/baseline_2026-08-15/Central`.
It originally pointed at `generated/Central`, which the generator rewrites; a
re-run then diffed the panel's files against themselves, **silently reduced 116
add / 58 retire / 4 weight rows to 0, and exited reporting success.** A
regeneration on that output would have reverted all 33 profiles with nothing to
show it. Check row counts against the previous run, not the exit status.

## Decisions settled on 3 Sep 2026

- **Periods are `(2021,2025)` and `(2026,2030)` for all nine provinces.**
  Contiguous, so README 2b's *later-period-wins* tie-break is gone and no year
  can be double-counted. Supersedes the 2020-2025 / 2025-2030 pair in
  [[risk-radar-upload-template-format]].
- **The tab name is authoritative for the period.** The returned files' year
  cells still read 2020/2025 (locked) — disregard them; the importer reads the
  tab.
- **A variable code may not start with a digit.** The panel's
  `3DAY_CUMULATIVE_RAINFALL` is `THREE_DAY_CUMULATIVE_RAINFALL`; their header is
  recorded in the addendum note as the `indicator_alias` to keep.
- **Retired-parent data is not a concern** — Milinda: everything so far is trial
  data.
- **Derived split weights are marked as derived, not decided.** Where a retired
  parent carried a weight, the 25/75 split is computed so the domain still
  totals 100, and WEIGHTS column G states the basis
  (`derived: 25% of retired X (40)` vs `panel: entered in the returned WEIGHTS
  tab`). They await panel confirmation — never treat a derived number as an
  expert decision. Same distinction as
  [[risk-radar-unweighted-variables]].

Central now has **0 short domains** — the panel closed its four by weighting
previously-unweighted exposure variables. The 26 that remain are the
pre-existing backlog in the other eight provinces (was 30).

Related: [[risk-radar-upload-template-format]],
[[risk-radar-unweighted-variables]], [[risk-radar-central-data-loaded]].
