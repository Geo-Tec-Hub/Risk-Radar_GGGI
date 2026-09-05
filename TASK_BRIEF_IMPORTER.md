# Task brief — the workbook importer (Stage 3)

**For Claude Code, working in `backend/`.**
Written 18 August 2026, after examining `Paddy_Drought 1.xlsx` and
`Paddy_Flood.xlsx` (Western Province) and the 19-workbook `Data sets.rar`.

**Read first:** `CLAUDE.md`, `DATA_SET_REVIEW_2026-08-17.md`, SRS §2.2
(normalisation), §2.4 (weights and exclusion), §6.2 (FR-2.1 to FR-2.18),
Annex A (validation codes), and `design/templates/generate_templates.py`.

**Goal:** load raw indicator values from the province workbooks into
`indicator_value`, keyed on the official numeric `DS_Code`, rejecting anything
it cannot resolve rather than guessing.

---

## The single most important rule

**Import RAW values only. Never import a pre-normalised column.**

These workbooks compute normalisation in Excel. Verified against
`Paddy_Drought 1.xlsx`: all 40 Western rows reproduce exactly under provincial
min-max, so the *method* matches SRS §2.2 — but the numbers are **frozen**.
They were computed against one set of divisions and one set of values. The
register moved 331 → 340 four days ago; every frozen figure computed before
that is now wrong, silently.

Server-side normalisation exists so bounds recompute. Importing a normalised
column defeats it and double-normalises on top.

Each hazard sheet is laid out in blocks. **Take only the first one:**

```
| PROVINCE_N .. DS_Code | Original Data | Normalization | % Calculation | WEB |
                          ^^^^^^^^^^^^^   ignore -------------------------^
```

## The 25% / 75% event columns

Drought and flood event counts arrive as **two period columns** — e.g.
`No. of Drought events - 1974 to 2004` and `- 2005 to 2022` — which the
workbook combines as `0.25 x normalised(early) + 0.75 x normalised(late)` into a
single `DROUGHT_EVENTS_1974_TO_2022`.

**The owner confirms the source will keep this shape. Do not ask for it to
change, and do not import the combined column.**

Handle it by weighting, which needs no new machinery. The hazard domain gives
`DROUGHT_EVENTS_1974_TO_2022` a weight of 70, so:

```
70 x (0.25 x norm(early) + 0.75 x norm(late))
  ==  17.5 x norm(early)  +  52.5 x norm(late)
```

**These are algebraically identical.** Verified numerically: 40 of 40 Western
rows reproduce the workbook's combined figure exactly, from raw inputs alone.

So:

1. Register two catalogue variables per event pair — e.g.
   `DROUGHT_EVENTS_1974_TO_2004` and `DROUGHT_EVENTS_2005_TO_2022` — each
   holding its **raw count**.
2. Replace the single membership with the two, at `parent_weight x 0.25` and
   `parent_weight x 0.75`.
3. Retire the combined variable from profiles. Keep it in the catalogue as a
   reference variable only.

`profile_indicator.weight_pct` is `NUMERIC(6,3)`, so 17.5 and 52.5 store exactly
and the domain still totals 100. Confirm that in a test rather than assuming.

## Reading the files

Layout varies between workbooks, so **find things rather than assume them**:

- **Header row is not fixed.** Row 4 in `7.Paddy_Subsector`, row 3 in
  `13.Livestock_CP`. Scan the first ~10 rows for a cell normalising to
  `dscode`.
- **Column names vary.** `DS_Code` / `DS Code`, `DSD_N` / `Ds Division`,
  `DISTRICT_N` / `District`. Normalise by stripping non-alphanumerics and
  lowercasing.
- **Join on the numeric `DS_Code`**, which is `dsd_register.ds_code_official_num`.
  Never join on name: nine divisions were renamed in the 2025 revision.
- **Ignore anything right of the recognised headers.** Several sheets carry
  free text there (`No Paddy`, stray division names and counts).
- **`#DIV/0!` appears** in some computed columns. Another reason to read only
  raw blocks; treat any Excel error value as absent, never as zero.
- **Province comes from the sheet name or the filename** (`CP_Paddy`,
  `13.Livestock_CP`). Verify it against `PROVINCE_N` in the rows and reject the
  sheet if they disagree.

## Aliases

20 headers are prose, not codes — mostly in
`3.Flood_Drought_Lslide-maximum_affected_data`:

```
Max # of drought affected People - 2005 to 2022
Max # of Flood affected People - 1974 to 2005
Total Gov Hospitals_2023
```

Resolve through `indicator_alias`, which already holds 269 entries. **Add the
missing ones as data, not as `if` statements in Python.** An unresolvable
header is a rejected sheet with a named reason, never a silent skip.

## Validation — reject, do not guess

Follow Annex A and FR-2.11. Every failure names the sheet, the row, the column
and what was wrong. Specifically:

- unknown `DS_Code` → reject the row
- a division in the province's register missing from the sheet → report as
  outstanding, do not invent a zero
- non-numeric where a number is required → reject the cell, report it
- duplicate `DS_Code` within a sheet → reject the sheet
- **FR-2.7 / V019:** all divisions of one variable must share a period. Reject a
  sheet mixing a single year with a range
- an absent value is **never** stored as `0` (NFR-10)

Load atomically per batch (FR-2.12): a sheet either lands entirely or not at
all, against an `import_batch` id.

## One data correction to make

`WATER_SURFACE_AREA` is `higher_is_worse` in the catalogue but marked `-`
(protective) in the flood workbook, and its profile weight is blank where the
workbook says 15. `PCT_WATER_SURFACE_AREA` and `PCT_FOREST_COVER` are already
`higher_is_better`, so the outlier is `WATER_SURFACE_AREA`. Fix it as a small
addendum, with the workbook cited in the comment.

## Use the workbooks as a test oracle

`Paddy_Drought 1.xlsx` carries `Final_Drought` — the expected normalised value
for every Western division. **Write a test that imports the raw columns,
normalises server-side, and asserts the result matches that sheet to 9 decimal
places.** It is the only independent check of the normalisation engine that
exists, and it was produced by the people who own the methodology.

Do the same for `Weightages_Paddy_Drought` and `Weightages_Paddy_Flood`: they
match the seeded weights exactly, so they also verify the weights loader.

## Done when

- one province workbook imports end to end, with a batch id and a summary
- re-importing the same file is refused or versioned, never silently duplicated
- a sheet with one bad cell rejects that cell and reports it; nothing partial lands
- the `Final_Drought` oracle test passes to 9 dp
- `pytest` green, and the smoke tests still pass
