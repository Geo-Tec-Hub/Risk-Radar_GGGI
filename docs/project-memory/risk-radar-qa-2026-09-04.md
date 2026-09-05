---
name: risk-radar-qa-2026-09-04
description: What the first independent QA pass found, what was fixed, and the failure shapes worth watching for again
type: project
---

An independent QA pass ran 4 September 2026 against `QA_BRIEF.md`. Report at
`QA_REPORT_2026-09-04.md`. It was a good pass: it verified engine behaviour by
hand when the documented test command failed rather than reporting the engine
broken, and it refused to call a click-through a defect it could not separate
from its own automation.

## Fixed

1. **`schema_signed_values_addendum.sql` was never registered in
   `apply_native.ps1`** — written, documented in `RUN_LOCALLY.md`'s *manual*
   order, absent from the automated script. A fresh build failed at
   `seed_central.py` with `column "value_kind" does not exist`. It was the only
   unregistered file in `design\database`.
   Registering it exposed a **second-order trap**: at that point
   `THREE_DAY_CUMULATIVE_RAINFALL` does not exist yet (the panel introduces it
   later), so the UPDATE matched nothing and the variable stayed `absolute` —
   which would reject every negative value in 18 profiles. Fix:
   `apply_province_panel.py` sets `value_kind` **on the INSERT**, plus a
   follow-up UPDATE for rows created before the column existed.
2. **`tests/test_engine_refusal.py` keyed on `PADDY_DROUGHT_CEN_V5`** — a
   version-qualified code that existed only where `panel_central.sql` had been
   re-run five times. On a fresh database the lookup found nothing and all four
   tests **skipped**, reporting green. Re-keyed to the scope. `pytest-asyncio`
   pinned in `requirements-dev.txt`; `asyncio_mode` set in `pytest.ini`.
3. **CSV renamed to .xlsx returned 500** — now a refusal naming the cause.
4. **15 of 48 dropdown combinations 404ed.** `/api/reference/taxonomy` scoped
   sector→subsector to real profiles but returned hazards as one flat list.
   Hazards are now per sector and per subsector. Verified: 33 offered, 0 404s.
5. **The weights editor had never worked, two independent ways** — a
   five-segment scope the API rejects, and snake_case/camelCase shape mismatch.
   See [[risk-radar-api-and-map]].

## Failure shapes worth watching for again

- **A skipped test reports green.** So does a validator that never ran. Check
  that a suite RAN the number of tests you expect, not just that it was not red.
- **Half-solving a guard is worse than not having one**, because the docstring
  then claims the problem is handled.
- **A file can be written, documented and still not wired in.** Audit the
  applier against the directory, not against memory.
- **`tsc --noEmit` does not check templates.** `npm run check:templates` does.

## Still open after this pass

- **Sinhala names never reach the database.** `dsd_register.csv` carries
  `ds_division_si`; no column exists on `ds_division` and nothing references it.
  A feature decision, not a bug.
- **Retired profile versions leave orphaned `vulnerability_result` rows.** Not
  user-visible (the API filters on `is_active`) but a raw `count(*)` overcounts
  as weights are revised. Retention policy undecided.
- **The national index has no computation pass.** The engine writes
  `index_scope = 'provincial'` only. Blocked on data, not code.

Related: [[risk-radar-api-and-map]], [[risk-radar-stage4-engine]],
[[risk-radar-import-tab]], [[risk-radar-qa-test-accounts]].
