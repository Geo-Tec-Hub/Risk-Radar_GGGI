# Risk Radar — build brief

**Written:** 9 August 2026 · **For:** the Claude Code session doing the work
**Status:** the single live work order. **Delete it** when §7 is fully ticked.

Nine decisions landed on 9 August 2026 and changed the measurement model. They are
already in the specification and the schema; they are **not** in the application. This
file says what to build, in what order, and which rules exist for reasons you cannot see
from the code.

It is a work order, not a specification. **`design/srs/SRS_v2.3.md` is authoritative and
wins wherever the two differ.**

**Companion file.** This brief looks *forward* — what to build. `CHANGES_2026-08-09.md`
looks *backward* — what already exists that is now wrong, decision by decision, with the
files to edit and a grep sweep list. Read that one when modifying existing code.

---

## 0. How to work

Top to bottom. Each task names its gate — **do not skip a gate.**

Only **T1** can start today. Everything with an HTTP endpoint is blocked on **T2**,
because the FastAPI application has never been scaffolded. Stage 5 was already built
ahead of its gate once: the Angular client is real and typed, and every call it makes
returns 502. Do not add screens to that pile without an endpoint behind them.

After each task: tick it here, tick the row on the Stage board in `PROGRESS_TRACKER.md
§2a`, and **add a row to §3 saying what broke and why the fix is what it is.** That log
is the project's memory — it is how the reasoning survives, and it has already stopped
several problems from being solved twice.

### 0.1 How to run a session

**One task per session.** Do not ask for two — context runs out mid-task and the second
gets done badly. Open the code tool with `Risk Radar` as the working folder and paste:

```
Read CLAUDE.md, then BUILD_BRIEF_2026-08-09.md.

Do T1 only. Stop at its gate — do not start T2.

When the negative tests pass, update PROGRESS_TRACKER.md: tick the Stage 1 row
and add a §3 issues-log row saying what broke and why the fix is what it is.
Then tell me what you changed and what you could not do.
```

Change `T1` for whichever task is next. The tasks are ordered; **T1 is the only one that
can start today** — everything with an endpoint waits on T2.

**To update existing code rather than write new code**, point at the other file instead:

```
Read CLAUDE.md, then CHANGES_2026-08-09.md.

Apply C2 and C10 to frontend-angular only. Do not change anything the file
does not list, and do not start on the backend.

Finish with the grep sweep at the end of that file and tell me what it found.
```

**Four things to say if it goes off course.**

- *"That is gated on T2. Stop and tell me what you would need."* — if it starts building
  screens against endpoints that do not exist. This has already happened once.
- *"Check that against `seed_all.sql` before you rely on it."* — for any claim about
  counts, weights or profiles. A plausible-sounding number has been wrong before.
- *"Run `python design/database/check_ddl.py`, then `generate_erd.py`."* — after any DDL
  change. Both have caught real defects.
- *"Do not hand-edit that; it is generated. Change the script and re-run."* — for
  `seed_all.sql`, `erd.*` and the 243 workbooks.

**Do not run two sessions against this folder at once.** The design conversation and the
code session both edit these files, and both are told to append to `PROGRESS_TRACKER.md`
§3. Two agents holding stale copies of one file overwrite each other silently — no error,
valid-looking code, and the lost thing is usually the tracker row explaining a decision.
Finish one, let it report, then start the other.

**Two environment notes.** Keep the database password out of prompts and out of shell
history — use `%APPDATA%\postgresql\pgpass.conf`, which `psql` reads automatically (see
`backend/.env.example`). And **run git natively in PowerShell**, not through a mounted
path, or the index corrupts.

**Applying an addendum and registering it are two separate jobs.** A file applied by hand
with `psql -f` is absent from `apply_native.ps1`, so the next `-Reset` rebuilds without
it and says nothing. Do both, and prove the second from a **cold build against a scratch
database**, not by reading the script.

---

## 1. Read first

| File | Why |
|---|---|
| `design/srs/SRS_v2.3.md` §2.1–2.4, §3.2, §5.4–5.6, §6.1–6.5, §9, §10 | Authoritative. Everything earlier is superseded |
| Same file, the "what changed in 2.3" box | The nine decisions, in one place |
| Same file, Annex C | Provisional decisions `[P-n]`, and what reversing each would cost. Struck-through entries are history, not current rules |
| `PROGRESS_TRACKER.md` §3, rows dated 2026-08-09 | Why each rule below exists |
| `design/database/schema_consensus_addendum.sql` | Read its header comment, not just its columns |
| `design/database/schema_weights_addendum.sql` | `save_profile_weights()`, versioning, `import_batch` |
| `CLAUDE.md` | Hard-won facts. Do not re-derive them |

---

## 2. The model, in one page

`Vulnerability = f(Hazard, Exposure)` per DS division, per sector × hazard.

```
Hazard(d,h)      = Σ (wᵢ/100) × normalised(vᵢ, d)      over hazard variables
Exposure(d,s,h)  = Σ (wⱼ/100) × normalised(vⱼ, d)      over exposure variables
V_raw(d)         = Hazard × Exposure
Published(d)     = min-max rescale of V_raw across the divisions of d's province
```

Each domain's weights total exactly 100. Every index lies in [0, 1]. Hazard carries no
sector argument — flood hazard in a division is the same physical fact whether the
question is paddy or tourism.

**Normalisation is provincial.** A variable is min–max scaled across the divisions of
one province, computed only once **every division of that province holds a value**.

**So the relativisation happens twice** — once per variable, once on the index. A
normalised 0.8 means *high for this province*, not *high*. Nothing is comparable across a
provincial boundary.

**A division carries two indexes**, because two sets of bounds sit behind it:

| | Provincial | National |
|---|---|---|
| Bounds | Its own province | All divisions nationally |
| Exists when | That province is complete | **Every** division in the register is |
| Status | **The headline score** | Comparison view, labelled |

They coexist. The national one never replaces, overwrites or restates the provincial one.
`index_scope` is part of `vulnerability_result`'s unique key, so a division holds two
rows per profile and period.

Three tracks — **data / expert / community** — share one schema, separated by a `source`
column. The community track is the instrument for public perception. Nothing else is.

---

## 3. Rules you must not break

Each has a reason. If you think one is wrong, say so and stop — do not route around it.

1. **Never mix the two index scopes.** One legend, export column or ranking is either
   provincial or national and must say which. An unqualified score means provincial
   (FR-4.3c). An unlabelled number is a defect.

2. **Bounds are provincial, and a province holds until complete.** No score publishes for
   any division of a province until every division of that province has a value. A
   province does not wait for the other eight. *(This reverses `[P-2]`. Ignore any text
   still asserting national bounds.)*

3. **Bounds never move under partial entry.** Never re-derive them from whichever
   divisions happen to have arrived — every published score would shift when the next
   workbook lands, and nothing would be reproducible or citable. Report progress toward
   completeness; never normalise over it.

4. **`weight_pct = 0` is not exclusion.** The CHECK is `> 0`, so zero is rejected, and
   `NULL` already means *"belongs to the profile, weight not set yet"* — the state 1,783
   of 3,664 memberships occupy. Exclusion is `consensus = 'rejected'`.

5. **An unweighted variable is resolved by excluding it**, and the remainder must then
   total exactly 100. If it does not: **warn and refuse to compute.** Never rescale the
   entered weights to reach 100 — the weights used would not be the weights anyone typed.

6. **Exclusion is declared, never inferred.** The system must not read a blank as "not
   significant" on its own. Ask on save; store the answer with the user and the date. A
   blank cannot otherwise be told apart from an oversight, and no published score may rest
   on one.

7. **In the hazard domain, exclude only a blank *composite index*.** Where a *component*
   is blank while the composite carries the weight, the profile **holds** — that variable
   is awaiting data, not judged insignificant. Excluding there hands the whole hazard
   domain back to the composite index and silently reverses `[P-5]`, making scores
   non-decomposable (FR-4.9b). This distinction is the difference between 97 profiles
   computing and zero.

8. **Pending and unassessed mean no score, not a score of zero.** Three coverage states,
   rendered distinctly, everywhere. The retired React app got this wrong; do not repeat it.

9. **No file loads partially.** One error loads nothing. The report lists every failure at
   once, each naming row, column and offending value (FR-2.3).

10. **Weight saves write a new profile version**, never an in-place update
    (`save_profile_weights()`). **No in-app approval gate in V1** — panel review is
    offline, recorded in `panel_note`.

11. **The exploratory workspace is Expert and Administrator only** (§3.2). Nothing inside
    it may reach a published surface: no persistence, watermarked exports, no tiles, no
    OGC. Never present activity in it as public opinion.

12. **Generated files are generated.** `seed_all.sql`, `erd.*` and the 243 workbooks come
    from scripts. Change the script and re-run; never hand-edit output.

13. **Parsing is not verification.** After any DDL change run
    `python design/database/check_ddl.py` (needs `pglast`), then
    `python design/database/generate_erd.py`. The checker has already caught two defects
    that parsed cleanly.

14. **Schema changes go in an addendum**, never by editing `schema.sql` in place.

---

## 4. What exists today

**Database** — built and smoke-tested on a local **PostgreSQL 15 + PostGIS** (Windows,
PowerShell, no Docker). 28 tables. Scripts in `backend/db/`: `check_prereqs.ps1`,
`apply_native.ps1 -Reset`, `smoke_test_native.ps1`.

**`schema_consensus_addendum.sql`** — written, statically verified, **not yet applied**:

- `profile_indicator.consensus` — `proposed / agreed / contested / rejected`, plus
  `consensus_note`, `decided_at`, `decided_by`. Only `agreed` and `contested` count toward
  a domain's 100. `rejected` carries no weight and does not block readiness. `contested`
  must carry a note. **No vote tally — deliberately.**
- `vulnerability_profile.publication` — `published / draft / sandbox`, plus
  `owner_user_id` and `derived_from_id`; one published+active version per scope.
- `vulnerability_result.index_scope` — `provincial / national`, in the unique key, plus
  `bound_min` / `bound_max`.
- `v_profile_readiness` redefined · `v_official_profile` · `v_track_divergence` ·
  trigger `vulnerability_result_no_sandbox`.

**`check_ddl.py`** — DDL symbol-table resolver. Run it after every schema change.

**FastAPI** — does not exist. No `backend/app/`.

**Angular** — `frontend-angular/`, Angular 22, OpenLayers, standalone components, signals.
Routes `/`, `/coverage`, `/entry`, `/weights`, `/import`. `ApiClientService` already types
`/vulnerability`, `/vulnerability/{unit}`, `/coverage`, `/health`,
`/profiles/{scope}/weights` (GET+PUT), `/profiles/{scope}/weights/history`, `/imports`,
`/imports/{id}`, `/imports/{id}/summary`, `/imports/{id}/rollback`. **All of them fail
today.** Boundaries come from a stopgap static
`design/spatial/ds_divisions.simplified.geojson` joined client-side — replace at Stage 5.2.

---

## 5. The work

### T1 — Apply the addendum and prove its constraints ☑ 2026-08-09
**Gate:** none. Start here. **Tracker:** Stage 1.12.

Apply it, then write a **negative test per constraint** — an attempt that should fail,
failing for the stated reason. Stage 1's exit criterion is not "the statement ran".

| Attempt | Must fail because |
|---|---|
| `UPDATE profile_indicator SET weight_pct = 0` | `weight_pct > 0` |
| `consensus='rejected'` while `weight_pct IS NOT NULL` | `profile_indicator_inactive_unweighted` |
| `consensus='contested'` with no note | `profile_indicator_contested_explained` |
| Two `published`+`is_active` versions of one scope | `vulnerability_profile_one_published_ix` |
| `draft`/`sandbox` with `owner_user_id IS NULL` | `vulnerability_profile_owner_required` |
| Insert a result against a sandbox profile | trigger `vulnerability_result_no_sandbox` |
| Two results differing only by `index_scope` | must **succeed** — that is the point |

Must also pass: marking a variable `rejected` makes its profile *more* computable, never
less; all 243 profiles return the same domain totals as before the addendum.

Put the tests in `backend/db/`, in the existing PowerShell style. Then `check_ddl.py`,
then `generate_erd.py`.

**Done 2026-08-09.** `backend/db/consensus_test.sql` + `consensus_test_native.ps1`, all
seven rows plus both "must also pass" checks, proven against the live database and again
from a cold build against a scratch database. See `PROGRESS_TRACKER.md` §3.

---

### T1b — Apply the auth addendum and prove its constraints ☑ 2026-08-09
**Gate:** T1. **Tracker:** Stage 1.13.

`schema_auth_addendum.sql` adds registration, approval and — for the first time —
enforceable provincial scope. Negative tests:

| Attempt | Must fail because |
|---|---|
| `status='active'` with no `approved_by` / `approved_at` | `app_user_approval_recorded` |
| `status='rejected'` with no reason | `app_user_rejection_explained` |
| Grant `data_officer` to a user with `province_id IS NULL` | trigger `user_role_province_scope` |
| Grant `expert` with no province | same |
| Grant `admin` to a user who *has* a province | same — admins are national |

Must also pass: a new `app_user` row defaults to `pending` with `is_active` false; setting
`status='active'` flips `is_active` true via the trigger; `SELECT code FROM role` returns
`data_officer` and **no** `analyst`.

**Done 2026-08-09.** `backend/db/auth_test.sql` + `auth_test_native.ps1`, written from
SRS §3.2/§3.5's text rather than the trigger's code, plus the mirror-image positive grants
so the negative tests aren't vacuous. Proven live and from a cold build. TEMPORARY warning
at `apply_native.ps1` step 6/7 removed. See `PROGRESS_TRACKER.md` §3.

---

### T1c — The Kalmunai split: 330 → 331 ☑ 2026-08-10
**Gate:** T1b. **Tracker:** Stage 1.14. **Do this before T2** — it is Stage 1 schema
work, and the register, seed and templates all hang off it.

O-2 was answered on 10 August 2026: `EAS-008 Kalmunai` is held as one row where the
official register carries **Kalmunai Muslim** and **Kalmunai Tamil** separately. Ampara
goes 19 → 20; the register goes 330 → **331**.

**Schema first — this is not a data edit.** `ds_division.geom` is
`geometry(MultiPolygon, 4326) **NOT NULL**`, so a division cannot currently exist without
a boundary. New addendum (rule 14, never edit `schema.sql`):

- make `geom` nullable, and add a **boundary-pending** state that is readable without
  inspecting `geom` for NULL at every call site
- `area_km2` stays NULL for such a division — do **not** default it to 0, which would
  make it look measured (this is the "absent rendered as zero" defect from `FrontEnd/`)
- a negative test per constraint, to the same bar as T1 and T1b: a division with no
  geometry inserts; anything that would publish a score for one fails; `sl_area_km2()`
  over a boundary-pending division returns NULL, not 0, and the country total still
  lands near 65,600 km² rather than shifting

**Then the register and everything generated from it.**

- `dsd_register.csv` — **retire `EAS-008` and never reuse it.** Issue two new codes for
  Kalmunai Muslim and Kalmunai Tamil. Do not keep `EAS-008` for one half: it would go on
  resolving while quietly meaning a smaller area. Do not renumber Eastern alphabetically.
- regenerate `seed_all.sql` (`generate_seed.py`) and the 243 workbooks
  (`generate_templates.py`) — **never hand-edit either** (rule 12). Eastern's workbooks
  each gain one DS row, on both period tabs.
- smoke tests: `330` → `331` in `smoke_test.sql` and the messages in `apply_native.ps1`,
  `load_spatial.ps1`, `check_prereqs.ps1`, `backend/README.md`. **The spatial load still
  loads 330 polygons** — assert that separately and name the gap, rather than loosening
  the division-count assertion to make both pass.
- `check_ddl.py`, then `generate_erd.py`, then the full cold-build proof against a scratch
  database (rule: applying and registering are two different jobs).

**Frontend.** `design/spatial/ds_divisions.simplified.geojson` keeps 330 features. Nothing
may read `features.length` as the division count, and a division present in the register
but absent from the geojson must render as *boundary pending* — **not** dropped from the
list, and **not** drawn at a guessed location.

**Both new divisions start with no values**, by decision. Say plainly in the T9
completeness label that Eastern is now **two** divisions short rather than one: this moves
the province *further* from publishing, and that is the correct outcome — 330 was never
complete, it was incomplete and silent.

**Do not invent the boundary.** Polygons come later, from Milinda. The naming is
provisional pending an official source; the count of 331 is not.

**Done 2026-08-10.** `schema_boundary_pending_addendum.sql` (nullable `geom`, generated
`boundary_status`, trigger blocking a score for a boundary-pending division).
`backend/db/boundary_pending_test.sql` + `.ps1`. Register edited (EAS-008 retired,
EAS-045/046 added), `seed_all.sql` regenerated (no-op, confirmed), all 243 workbooks
regenerated (24 Eastern ones gained a row, confirmed nothing else changed).
`load_spatial.ps1`/`.sh` fixed — INNER JOIN was silently dropping unmatched register
rows instead of loading them boundary-pending. `smoke_test.sql`, `apply_native.ps1`,
`check_prereqs.ps1`, `backend/README.md` updated off the bare 330 — including a real
bug the cold build itself caught: surveyed count is **329**, not 330 (the orphaned old
Kalmunai polygon matches no register row and was never going to be 330). Registered as
step 7/8 in `apply_native.ps1`, proven from a cold build against a scratch database,
then applied to the live database (delete-then-reload for the retired code, since
`ON CONFLICT` upserts but never deletes). `frontend-angular`'s stale
"read features.length for a count" guidance corrected. See `PROGRESS_TRACKER.md` §3.

---

### T2 — Scaffold FastAPI ☑ 2026-08-11
**Gate:** T1c. **Tracker:** Stage 2.0. **Nothing else proceeds without this.**

Python, FastAPI, Pydantic v2, `backend/app/`. Pick SQLAlchemy or asyncpg and record the
choice in §3 of the tracker. Settings from environment; `.env` gitignored so the database
password is never committed. `/health` — the Angular client already calls it. CORS for
`localhost:4200`, aligned with the existing `proxy.conf.json`.

**Done when** `GET /health` returns 200 from the running Angular dev server and at least
one screen stops showing its error state.

**Done 2026-08-11.** `backend/app/` (`config.py`, `db.py`, `main.py`, `routers/health.py`),
`backend/venv/`, `requirements.txt`. **Decision: asyncpg, raw SQL, no ORM, no Alembic** —
reasoning recorded in `PROGRESS_TRACKER.md` §3 (the T2 row). Routes mounted at `/api`
(not bare `/health`) — required by `proxy.conf.json` + `apiBaseUrl`, not stylistic. No
password read anywhere in `app/` — `asyncpg.create_pool()` is called with no `password=`
argument, so it resolves one itself via `pgpass.conf`, same as `psql`. CORS restricted to
`http://localhost:4200`; verified a disallowed origin gets no CORS header at all. Added a
small header badge (`shared/backend-status.component.ts`) using the already-typed but
never-called `ApiClientService.getHealth()`, since nothing else in the app would have
exercised `/health` and made the "done when" bar checkable. Verified end to end: browser
network log shows `GET http://localhost:4200/api/health → 200 OK` through the real
dev-server proxy, badge reads "Backend connected".

---

### T2b — Auth: landing page, sign-in, registration ☑ 2026-08-11
**Gate:** T2. **Tracker:** Stage 9.6. **Do this before T3** — every write endpoint after
it needs a user and a province to authorise against.

**API.** `POST /auth/register` (type = agency / expert / public, creates `pending`),
`POST /auth/login`, `POST /auth/logout`, `GET /auth/me`,
`GET /admin/registrations` (`v_pending_registration`),
`POST /admin/registrations/{id}/approve` (role + province),
`POST /admin/registrations/{id}/reject` (reason required).

Session/auth cookies `Secure` and `HttpOnly` (§4). Default permission **deny**; public
read is an explicit, endpoint-by-endpoint, read-only grant (NFR-4).

**Angular.** `/` becomes the landing page — the map moves to `/map` and must stay **one
click away with no account** (FR-12.7, §3.1). Add `/login`, `/register`,
`/admin/registrations`, an auth guard, a session service, and auth methods on
`ApiClientService`. Route by role on sign-in (FR-12.8).

**Two rules that are easy to get wrong.** The client must not appear signed in while the
API rejects its requests (FR-5.21). And hiding an action in the UI is never the only
control — **every write is authorised server-side against role and province** (FR-12.8),
which is what the T1b trigger makes possible.

For a data officer, pre-set and lock the province selector in
`features/entry/profile-context.component.html`; reading nationally stays open.

**Done 2026-08-11.** `schema_session_addendum.sql` (`app_session`, `v_active_session`,
trigger `app_user_revoke_sessions_on_deactivation`), `backend/db/session_test.sql` +
`.ps1` (9 checks), registered as step 7/9 in `apply_native.ps1` (renumbered from 8 to 9
steps), proven from a cold build then applied to the live database. `app/security.py`
(argon2id, session tokens), `app/deps.py`, `routers/auth.py` + `routers/admin.py`, all
under `/api`. `backend/db/bootstrap_admin.ps1` for the first admin (chicken-and-egg: no
one can approve an admin through an API that requires one). Angular: `AuthService`,
`adminGuard`, landing/login/register/admin-registrations screens, `app.routes.ts`
restructured (`/` → landing, `/map` → the map), 401 clears auth state in the
interceptor, province lock on `/entry` for `data_officer`/`expert`. Verified with `curl`
against the running API and again through the browser, including that an admin
rejecting an already-**active** account revokes its live session with no `logout` call
(the database trigger does it) — see `PROGRESS_TRACKER.md` §3 for the full chain.
**Not done: the cookie is not marked `Secure`** — `session_cookie_secure` defaults
`false` because local dev is plain `http://localhost:4200`, and `Secure` would make the
cookie unsendable there. `HttpOnly` and `SameSite=Lax` are on unconditionally. Set
`SESSION_COOKIE_SECURE=true` behind real TLS before this reaches a public host.

---

### T3 — Profile API, with consensus ☐
**Gate:** T2. **Tracker:** Stage 2.2, 2.3.

```
GET  /profiles/{scope}/weights     + consensus, consensusNote per variable
                                   + publication, owner, derivedFrom
PUT  /profiles/{scope}/weights     accepts consensus changes in the same save,
                                   through save_profile_weights() (new version)
GET  /profiles/readiness           v_profile_readiness, incl. n_contested,
                                   n_rejected, n_proposed
```

Mirror the new fields in `core/models/profile.model.ts`. `encodeProfileScope()` there is a
**placeholder** — settle the real `{scope}` encoding here and make both sides agree.

**Server rule:** a domain totals 100 across `agreed` + `contested` only. Reject a save that
reaches 100 by counting a `rejected` variable.

---

### T4 — Weights editor: consensus, the save prompt, adding a variable ☐
**Gate:** T3. **Tracker:** Stage 7.4.

Extend `features/weights/weights-editor.component.ts`:

- consensus control per variable; note field **required** when `contested` (mirror the
  CHECK client-side so the user learns before the round trip — and let the server reject
  anyway)
- rejected variables struck through, excluded from the total, **not hidden**
- **the save-time prompt** (rule 6): on saving with blanks, ask *"these N variables have no
  weight. Treat as not significant?"* and write the answer as `consensus='rejected'` with
  author and date. In the hazard domain offer this **only** where the blank is a composite
  index; where a component is blank and the composite carries weight, say the profile is
  held pending data and do not offer exclusion at all
- **the re-weighting warning.** 401 of 486 domain groups already total exactly 100 while
  containing an unweighted variable. Adding or re-including a variable **forces the others
  down**. Show the redistribution before saving; never accept a domain totalling 105
- **adding a variable** (FR-1.4b/c): an expert who adds one gets, in the same flow, a route
  to its values for every division — generated template upload or manual entry — and is
  told how many divisions need a value. A variable added without data **holds the whole
  profile indefinitely** under rule 2. Say so at the point of adding

Keep three states distinct in the copy: *weight not set yet* · *weight is small* · *does
not belong*.

---

### T5 — `POST /compute/preview` ☐
**Gate:** T2; the engine itself is Stage 4. **Tracker:** Stage 4.8.

Normalised values do not depend on weights, so a preview is a pure re-weighting of stored
values: no writes, no tables, no profile version.

```
POST /compute/preview
{ "scope": {province, sector, subsector?, hazard, period},
  "hazardVariables":   [{indicatorCode, weightPct, direction}],
  "exposureVariables": [{indicatorCode, weightPct, direction}] }
-> [{ dsCode, vRaw, vScaled, indexScope: "provincial", coverageState }]
```

- Persist nothing — the T1 trigger enforces this if you get it wrong.
- **One province, provincial scope only.** National scope needs every division in the
  register to hold a value, which is false today (O-2).
- Return `vRaw` as well as the scaled value.
- A province that is not complete returns **no scores at all**, not partial ones.
- Labelled indicative; never reaches an export, tile or OGC service.

---

### T6 — Official vs exploratory ☐
**Gate:** T5. **Tracker:** Stage 7.5.

Two views over one data model. **Do not build parallel tables.**

- **Official** reads `v_official_profile` — public map, exports, tiles, OGC.
- **Exploratory** — **Expert and Administrator only.** Fork the official profile into a
  `draft` (owner and `derived_from_id` set), change variables and weights, redraw from
  `/compute/preview`. Show the diff against official.

Persistent banner, distinct legend heading, watermarked exports with a distinct filename,
no tile cache, no OGC. Read through `v_official_profile` rather than filtering at each call
site, so a draft cannot reach a public surface by omission. No rate limiting needed —
access is restricted.

---

### T7 — Sensitivity sweep ☐  *(Should)*
**Gate:** T5. **Tracker:** Stage 8.5.

This is what earns the exploratory workspace its place. Sweep a variable's weight from 0
to its domain maximum, renormalising the rest proportionally, and report rank changes,
mean absolute change in scaled score, and how many divisions change band. Tornado chart
across the profile's variables.

The output is a sentence like *"weighting this anywhere from 0 to 25% changes no
division's band"* — which turns a disagreement into a measurement.

---

### T8 — Track divergence ☐
**Gate:** T2. **Tracker:** Stage 7.3.

`v_track_divergence` exists. Expose it; render the expert−community gap per division.

It groups by `index_scope` — never difference a provincial score against a national one.
Both operands are rescaled within their own province, so the gap is meaningful **within** a
province and must not be compared across one. **Public perception is the community track,
never an aggregate of exploratory sessions.**

---

### T9 — Import data-quality dashboard ☐
**Gate:** T2 for coverage; **Stage 3** for the per-file half. **Tracker:** Stage 3.6.

One screen after upload:

- **Validation** — every failure at once, naming row, column, value. Nothing loads partially.
- **Weights** — what the WEIGHTS tab supplied, what still lacks one. The tab is advisory;
  the app is master.
- **Completeness** — progress against the per-province workbook denominator: Central 33,
  Sabaragamuwa 29, Southern 29, Uva 28, North-Western 27, Western 27, Eastern 24,
  North Central 24, Northern 22.
- **Readiness** — which profiles became computable, which are blocked and by what.

**Word the completeness label exactly right:**

> 18 of 25 divisions entered — **bounds fixed**, 7 outstanding.

and **never** "normalisation based on 18 divisions". Reporting how much has arrived is
correct; normalising over it is rule 3. Those outstanding divisions are also precisely what
stands between this province and having any scores at all — say so, because this label is
the province's progress bar to going live.

---

## 6. Traps

- **Load-bearing numbers, asserted by the smoke tests — do not re-derive.** 174 canonical
  variables · 33 national profiles · 243 province-profiles · 3,664 memberships · 1,783 NULL
  weights.
- **97 of 243 profiles compute immediately** under rules 5–7 (Central 29, Western 24,
  Southern 22, Sabaragamuwa 22). 128 are held for hazard components. **30 exposure groups
  warn** — that is the entire remaining weights backlog. Do not describe it as 1,783.
- **The "401 of 486" figure in §5.4 reads more encouragingly than it is** — it counts
  domain groups, and every hazard group is in it.
- **331 is the official division count; the register and shapefile hold 330** — answered
  10 August 2026 as the **Kalmunai split**, implemented by **T1c**. Until T1c runs, the
  live database still holds 330. After it runs the **register holds 331 and the shapefile
  still holds 330** — that gap is expected, not a defect, until the polygons are drawn.
  Never reconcile the two by reading `features.length` as the division count.
- **Year ranges, not years.** 2020–2025 and 2025–2030; a value is a *typical year*, not a
  multi-year total. 2025 sits in both — latest period wins (`iv_for_year()`).
- **Geometry EPSG:4326, measurement EPSG:5235.** Use `sl_area_km2()` / `sl_length_km()`.
  Country area lands near 65,600 km².
- **`design/ingestion/seed_indicator_catalog_final.sql` is superseded.** Use `seed_all.sql`.
- **`FrontEnd/` is the retired React app** — reference only, for its map-select → side-panel
  workflow and for three defects not to repeat: absent value rendered as zero, maximum
  rating invisible, redundant read-and-update after every write.
- **Do not run git through the OneDrive mount** — it corrupts the index. PowerShell natively.
- **`generate_erd.py` has a hardcoded `FILES` list and an `ALWAYS_SHOW` allowlist.** A new
  addendum is invisible to the diagram until both are updated.

---

## 7. Open — do not invent answers

- ~~**O-2**~~ **— answered 10 August 2026: the Kalmunai split.** Moved out of this section
  and into **T1c**, which implements it. The old warning here — *"do not add a register row
  without geometry, that breaks the map instead of the arithmetic"* — still holds and is
  precisely why T1c is a schema task: the boundary-pending state exists so that a division
  without a polygon is **visible and named**, never silently dropped. Eastern and the
  national index stay unpublished, now waiting on values for two new divisions rather than
  on a decision.
- **O-10** — band thresholds are placeholder, and are needed **per index scope**. To be
  settled later, from real values, via FR-4.15.
- **O-11** — does the provincial index rescale still earn its place now that normalisation
  is provincial too? Answer at Stage 4 from the distribution report, **not from theory.**
  The formula has already changed three times in eight days.
- **Annex D's requirement counts are stale** — seven FRs were added on 9 August and that
  table has not been regenerated.

---

## 8. Definition of done

- [ ] Every task ticked, each with a `PROGRESS_TRACKER.md §3` row explaining what broke
- [ ] `python design/database/check_ddl.py` → `OK — every dependency resolves.`
- [ ] `python design/database/generate_erd.py` re-run; `erd.svg` / `.png` committed
- [ ] Every §8.3 constraint has a **passing negative test**
- [ ] No absent value renders as zero; no stale or empty view presented as data
- [ ] No provincial and national quantity share a legend, column or ranking
- [ ] Nothing from the exploratory workspace reaches a public surface, export, tile or OGC
- [ ] This file deleted
