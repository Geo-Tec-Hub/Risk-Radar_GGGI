---
name: risk-radar-import-tab
description: The workbook import endpoints and tab, and the duplicate-values defect that only a second user account could reveal
type: project
---

Built 3 September 2026. `POST /api/import/check`, `POST /api/import/load`,
`GET /api/import/batches`; Angular tab at `/import`.

## Check and load are ONE code path

`check` calls the same `load_workbook_values()` as `load` and returns before the
final statement (`dry_run=True`). A validator written separately from the loader
eventually disagrees with it, and the disagreement reaches users as *"it passed
the check and then failed to load"*, which destroys confidence in both.

## Four behaviours to keep

- **The scope pickers are a cross-check, not routing.** `_META` says which
  profile a workbook is for; the sector and hazard chosen in the UI are compared
  against it and a mismatch is **refused**. Uploading the right file under the
  wrong sector would key real values to a real profile and look entirely
  plausible afterwards.
- **Review copies are detected, not declared** — from `_META.protection ==
  'unlocked-review'`. An uploader should not have to know which kind of file
  they were sent.
- **Nothing loads partially.** One negative value in a non-signed variable
  refuses the whole file, naming row, column and value, with `batchId: null` and
  the row count unchanged.
- **An unreadable file is a refusal, not a 500.** A CSV renamed to `.xlsx`
  raised `zipfile.BadZipFile` out of `openpyxl` and returned a server error
  until 4 Sep. A 500 tells the person nothing about what they did wrong.

Import requires a signed-in account (NFR-4) even though the map is public, and
`data_officer` or `expert` — which the schema refuses to grant without a
province.

## The defect only a second account could reveal

Running the endpoint against data the seed had already loaded, values went
**4,412 -> 4,740** instead of staying put.

`indicator_value_uniq` includes **`user_id`**. That is right for the expert and
community tracks, where each contributor's figure is its own record, and wrong
for the official `data` track, where a value belongs to the division and not to
whoever uploaded it. Result: **328 duplicate facts, identical values, two
users** — and the engine's `DISTINCT ON (ds_division_id) ORDER BY year_start
DESC` had no tiebreak, so which row it used was arbitrary. That **silently
breaks the bit-identical recomputation guarantee** while raising nothing.

Fixed at both ends: the loader deletes any existing `source='data'` row for the
same variable / division / period before inserting, **in the same transaction**
(latest official import supersedes, whoever ran it); and the engine's
`DISTINCT ON` gained `id DESC` as a deterministic tiebreak.

**The lesson: a seed script running as one user can never surface a
per-user-key defect.** Test a second import as a different account.

Related: [[risk-radar-central-data-loaded]], [[risk-radar-stage4-engine]],
[[risk-radar-api-and-map]].
