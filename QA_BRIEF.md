# QA brief — Risk Radar, Central Province slice

**For Claude Code, working in this repository, with the app running locally.**

Your job is to find defects and report them. **Do not fix anything** unless this
brief says so or Milinda asks — a QA pass that edits as it goes produces a report
nobody can reproduce.

---

## The one rule that matters

**Run it. Do not report from reading.**

This project has a documented history of defects that were invisible to reading
and obvious the moment something executed: a UTF-8 BOM, a WIN1252 console
encoding, a column name that did not exist, a function that silently discarded
an exclusion, a filter list that had drifted from the database, two routes with
the same path. Every one compiled, type-checked and looked right.

So: a finding needs a **reproduction** — the exact request, command or click
sequence — and **observed output**. "This looks wrong" is not a finding. If you
cannot make it happen, say so and mark it unconfirmed rather than dropping it.

## Checking a frontend change

`tsc --noEmit` does **not** check Angular templates. Two build breaks have
shipped past it already — a missing `DatePipe` import, and a template printing a
field that had been removed from its interface. Both type-checked clean and both
failed at `ng serve`.

    cd frontend-angular && npm run check:templates

Run that before reporting that a frontend change compiles. "tsc passed" is a
weaker claim than it sounds.

## Before you start

1. Read `PROGRESS_TRACKER.md` §3 (issues log). It is long, and it is the fastest
   way to avoid re-reporting something already resolved, and to learn which
   traps recur.
2. Read `RUN_LOCALLY.md` and confirm the app is up: API on :8000, Angular on
   :4200, database `riskradar` on localhost:5432.
3. Confirm the baseline below. **If these numbers do not match, stop and say so**
   — every later test is meaningless against a different dataset.

```
340 DS divisions, 340 surveyed, 0 boundary-pending, 66,037 km2
33 active Central profiles, all is_computable
4,412 indicator_value rows, period 2021-2025
1,323 vulnerability_result rows
```

## Do NOT re-litigate these

They are closed owner decisions, not oversights. Reporting them as defects wastes
the report's credibility:

- **Band thresholds are fixed even fifths** (0.2/0.4/0.6/0.8) and deliberately
  not derived from the distribution. The bottom band holding ~45-70% of
  divisions is expected. See `core/models/band.model.ts`.
- **`V = H x E` rescaled per province.** Scores are not comparable across a
  provincial boundary and a national ranking is not defined.
- **Unweighted variables are excluded from computation, not weighted at 0.**
- **Blank means not collected. It is never a zero.**
- **`contested` weights are derived, awaiting the Central panel.** Their being
  unconfirmed is by design and is stated in the data.

---

## 1. Registration, approval, sessions

- Register a new account. Confirm it lands as `pending` and **cannot sign in**.
- Approve it as an admin, then sign in. Reject another and confirm the reason is
  recorded and sign-in still refused.
- **Try to approve without an admin role.** It must fail closed, not merely hide
  the button — call `POST /api/admin/registrations/{id}/approve` directly with a
  non-admin session.
- Sign out, then reuse the old session cookie. It must be refused.
- Check the schema constraint `app_user_approval_recorded`: an account cannot be
  `active` without recording who approved it and when. Try to violate it.
- **FR-5.21:** the client must never look signed in while the API rejects it.
  Delete the cookie in devtools with the app open and exercise a protected
  action.

## 2. Import (`/import`)

- Import a Central workbook from `Data sets\CP\CP\Central_want to edit year
  ranges`. **Check only** first, then **Import**. The two must agree.
- **Scope cross-check:** import a Paddy file under Livestock/Cattle. It must be
  refused, naming both scopes, and load nothing.
- **Partial-load:** corrupt one cell (a negative in a non-signed variable, text
  where a number belongs, an unknown column heading) and confirm the file loads
  **nothing** — `batchId: null`, `indicator_value` count unchanged — and that
  **all** errors come back at once, not just the first.
- **Re-import the same file as a different user account.** The row count must not
  change and no duplicate facts may appear. This is a real defect that was fixed
  on 3 Sep; confirm it stays fixed:
  ```sql
  SELECT count(*) FROM (SELECT indicator_id, ds_division_id, year_start, year_end,
    source FROM indicator_value GROUP BY 1,2,3,4,5 HAVING count(*) > 1) s;  -- 0
  ```
- **Unauthenticated import must 401.** The map is public; writing is not.
- Upload something that is not a template — a random .xlsx, a .csv renamed, a
  20 MB+ file — and confirm each is refused with a message that says what is
  wrong rather than a stack trace.

## 3. Weights (`/weights`, `PUT /api/profiles/{scope}/weights`)

- Save a weighting where a domain totals 99 or 101. It must be **refused**, and
  the message must name the domain and total. Nothing may be rescaled to reach
  100.
- Mark a variable `contested` **without** a note. Refused, naming the variable.
- Save an exclusion (`rejected`) and confirm it **survives the save** with
  `decided_by` and `decided_at` set. This is the 15 Aug defect; re-check it.
- Confirm a save creates a **new version** and retires the previous one, rather
  than mutating in place.
- **Casing:** `routers/profiles.py` emits snake_case, `core/models/profile.model.ts`
  declares camelCase. Determine whether the weights editor actually works
  end to end, or whether it silently reads `undefined`. This is a known open
  item — confirm the real user-visible impact.

## 4. Computation (`compute_all.py`, `app/engine/vulnerability.py`)

- Run it twice and diff. **Bit-identical, 0 differing rows.**
- Remove one variable's weight and confirm the profile **refuses and names it**.
- Delete one division's values and confirm it comes back **unassessed**, with no
  row in `vulnerability_result` — not a zero.
- Confirm every profile has exactly one division at 1.000.
- `pytest tests/test_engine_refusal.py` with `DATABASE_URL` set — 4 tests.

## 5. Map and API (`/map`)

- Pick sector, subsector and hazard. Confirm the options come from the API and
  that **every** offered combination returns a profile — no 404s from the
  dropdowns.
- **Absent is never a low score.** Cattle Farming / Drought has three unassessed
  divisions (NU5, NU6, NU7). They must render hatched, with `value: null` and
  `band: null` in the payload, never band 1.
- **Sector not present.** Inland Fishery has 19 of Central's 41. They must render
  flat, be **unselectable**, and appear as their own legend entry and their own
  count in the coverage statement — not as *Very low*.
- The coverage denominator must be the province's divisions (41), not the
  national boundary count (340).
- Switching province must re-fit the map and hide the other provinces.
- `indexScope=national` must return **409 with a reason**, not an empty map.
- Compare a division's panel figures against the database directly. They must
  agree.

## 6. Cross-cutting

- **Sinhala names** (`ds_division_si`) must survive the round trip — database,
  API, browser — without mojibake.
- Error states: stop the API and confirm the map says so rather than rendering
  everything as unassessed with no explanation.
- Check for anything that renders an absent value as `0`, `-`, or a band. That
  is this project's signature defect class.
- Note any endpoint returning a stack trace or leaking a SQL error to the client.

---

## The report

Write `QA_REPORT_<date>.md` at the repository root:

- **One table of findings**, ordered by severity, each with: what you did, what
  happened, what should have happened, and the file or endpoint involved.
- Severity: **blocker** (data loss, wrong published number, auth bypass) ·
  **major** (a documented rule not enforced) · **minor** (message, wording,
  cosmetic) · **note** (works, but worth knowing).
- A short list of **what you could not test**, and why. Honest gaps are more
  useful than a report that implies full coverage.
- **Do not fix anything.** If a fix is obvious, say so in one line. Milinda
  decides what gets changed.
