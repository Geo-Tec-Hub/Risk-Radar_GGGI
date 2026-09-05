---
name: risk-radar-upload-template-format
description: "Structure of the 243 generated upload templates, why every variable is a column, and why an unweighted variable is left BLANK not 0"
type: project
---

Established 25 Aug 2026 by reading `design/templates/generated/Central/
PADDY_DROUGHT_CEN_V1_upload_template.xlsx` against
`design/ingestion/seed_all.sql` and `dsd_register.csv`.

## Two generations exist — only the later one is current

An earlier **18 July 2026** generation is still in circulation and is wrong in
four ways at once. If a workbook shows any of these, it is the old one:

| | 18 Jul (stale) | current |
|---|---|---|
| Sheets | 2 period tabs, README, _META | + a **WEIGHTS** tab |
| Central rows | **8** | **41** |
| `DS_CODE` | legacy `CEN-nnn` | **official** `KA1`…`NU10` |
| Columns | weighted variables only | **every** variable in the profile |
| Column codes | generator-shortened | canonical catalog codes |

The legacy codes in the old file are also **misaligned against the register**:
it has `CEN-001 = Gangawata Korale`, but `dsd_register.csv` has
`CEN-001 = Akurana`. Data entered on the old file imports without error and
lands on the wrong divisions. See [[risk-radar-331st-division]] on why
`legacy_code` is never a join key.

## Current structure

- **Two period tabs** — frozen, navy fixed columns / orange hazard / green
  exposure headers, grey EXAMPLE row the importer ignores, yellow value cells
  with a `decimal >= 0` validation. Fixed columns are `DS_CODE | DS_DIVISION |
  DISTRICT | YEAR_START | YEAR_END`, trailing `DATA_SOURCE | NOTES`.
  **Periods became 2021-2025 / 2026-2030 on 3 Sep 2026** — see
  [[risk-radar-province-panel-overrides]].
- **WEIGHTS** — every variable in the profile, with `legacy weight %`, a yellow
  `PROPOSED WEIGHT %` column, a `basis of the proposal` column (added 3 Sep) and
  a `SUM - <domain> (must equal 100)` formula per domain. REFERENCE ONLY: the
  app remains the master record.
- **README**, **_META** (hidden) — `_META` is the import contract and carries
  `expected_columns`, `periods`, `protection` and the period-aggregation map.

## The variable set does NOT vary by province

Measured across all 3,664 memberships: **all 33 sector-hazard families have an
identical variable set in every province they exist in.** Only the **weights**
differ. So a template can carry every parameter everywhere at no modelling cost.

## Blank, not 0, for a variable that is not counted

Milinda proposed writing **0** for an uncounted parameter. Arithmetically
identical to a blank — but reject it:

- **A pre-filled 0 makes every sheet arrive already valid.** The per-domain SUM
  passes, nobody is prompted, and the FR-2.17 / FR-2.18 outstanding register
  goes empty while the decisions have not been made. See
  [[risk-radar-gradual-data-arrival]].
- **It erases the distinction FR-4.9 depends on.** Exclusion must be a *recorded*
  decision (`consensus = 'rejected'`, author and date), never an inference. A
  typed 0 is indistinguishable from a generator default, so a published score
  could rest on one. See [[risk-radar-unweighted-variables]].
- Blank keeps "not yet reviewed" separable from "considered and rejected" —
  the same defect class as rendering an absent score as *Very low*.

Related: [[risk-radar-unweighted-variables]], [[risk-radar-331st-division]],
[[risk-radar-gradual-data-arrival]], [[risk-radar-province-panel-overrides]].
