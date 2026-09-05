# Task brief — route authorisation, admin console, error messages

**For Claude Code, working in `frontend-angular/` and `backend/`.**
Three defects, reported by the owner 17 August 2026. Each was verified against
the code before this brief was written; the findings below are observations, not
assumptions.

**Read first:** `CLAUDE.md`, `BUILD_BRIEF_2026-08-09.md`, SRS §3.1 (the role
table), §3.2 (provincial scope), FR-12.7 / FR-12.8, FR-5.20 / FR-5.21, NFR-4
(default deny).

**Do not rebuild what exists.** Auth was built in T2b and works: sessions,
`AuthService`, `adminGuard`, `apiErrorInterceptor`, `require_admin` server-side.
These three tasks close gaps around it. Read each file before changing it.

---

## A1 — Data-entry screens have no authorisation at all

**Severity: high. This is the one to do first.**

### What is actually wrong

In `src/app/app.routes.ts`, only `/admin/registrations` carries a guard:

```ts
{ path: 'entry',   loadComponent: ... },   // no canActivate
{ path: 'weights', loadComponent: ... },   // no canActivate
{ path: 'import',  loadComponent: ... },   // no canActivate
```

Anyone — signed out, or signed in as `community` — can open the data-entry,
weights and import screens. `profile-context.component.ts` already computes
`this.auth.hasRole('data_officer') || this.auth.hasRole('expert')` and uses it to
disable controls, so the screen half-knows; the route does not.

The **server is not** wide open: `PUT /api/profiles/{scope}/weights` enforces
role and province (`app/routers/profiles.py`). So the damage today is a user
being shown a screen they cannot use and discovering it only when a save fails.
That is exactly the FR-5.21 defect — *the client must not appear to have access
the API will refuse.*

### What to build

**1. A general `roleGuard`,** in `src/app/core/guards/role.guard.ts`. Model it on
the existing `admin.guard.ts` — copy its behaviour deliberately:

- call `auth.refreshMe()` every time; never trust a possibly-stale
  `currentUser()` signal, so a revoked session cannot keep a tab working
- `catchError` → redirect, because a guard observable that errors fails the
  navigation outright instead of redirecting

```ts
export function roleGuard(...allowed: RoleCode[]): CanActivateFn
```

- not signed in → `/login` **carrying the attempted URL**:
  `router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })`
- signed in but wrong role → **`/403`, not `/login`**. Bouncing a signed-in
  community user to a sign-in form tells them the wrong thing; they are not
  anonymous, they are not permitted.

**2. Apply it:**

| Route | Roles |
|---|---|
| `/entry` | `data_officer`, `expert`, `admin` |
| `/weights` | `expert`, `admin` |
| `/import` | `data_officer`, `admin` |
| `/admin/**` | `admin` (keep the existing `adminGuard`) |
| `/`, `/map`, `/coverage`, `/login`, `/register` | none — public, FR-12.7 |

**3. Honour `returnUrl` in `login-page.component.ts`** — after a successful sign
in, go to `returnUrl` if present, otherwise `auth.landingRouteForCurrentUser()`.

**4. Add a `/403` route** — a small component saying which roles the page needs
and which the user holds, with a link to the map. Do not word it as an error the
user caused.

**5. Do not remove the in-component role checks.** Belt and braces is the
documented intent (FR-12.8: hiding an action in the UI is never the only
control). The guard stops the page rendering; the component keeps disabling
controls; the server keeps refusing. Three layers, all cheap.

### Done when

- signed out, visiting `/weights` lands on `/login`, and signing in returns you
  to `/weights`
- a `community` user visiting `/weights` lands on `/403`, not `/login`
- an `expert` reaches `/weights`; a `data_officer` reaches `/entry` and `/import`
- `ng build` and `ng test` pass

---

## A2 — Admin has a screen but not a console, and probably no account

### What is actually wrong

Two different things are hiding behind "no admin login":

**(a) There may be no admin account.** Registration writes `status='pending'`
and inactive; approval requires an existing admin. On a database built with
`-Reset` nobody has run `backend\db\bootstrap_admin.ps1`, so there is no admin
to approve anyone, and `/admin/registrations` correctly bounces every visitor to
`/login`. **Check this before writing any code** — it may be the whole
complaint:

```sql
SELECT u.email, u.status, r.code
  FROM app_user u
  LEFT JOIN user_role ur ON ur.user_id = u.id
  LEFT JOIN role r ON r.id = ur.role_id;
```

If that returns nothing, run `bootstrap_admin.ps1` and re-test before changing
anything. Then make the failure legible: see (c).

**(b) There is no admin console.** `/admin/registrations` is the only admin
route. FR-12.3 requires a dashboard showing users, pending registrations,
submission volume by track, and provincial coverage. There is no `/admin`
landing page and no navigation entry, so an admin who signs in has no way to
discover the screen except by typing the URL.

**(c) The bootstrap state is invisible.** A system with no admin account is a
normal first-run state, not a fault, and it should say so.

### What to build

**1. `/admin` dashboard** at `src/app/features/admin/admin-dashboard.component.ts`:

- pending registrations (count + link to the existing screen)
- users by role and province
- provincial coverage — reuse `GET /api/profiles/readiness`, which already
  returns `is_computable`, `n_missing_weights` and a scope per profile
- **the empty state is the first state you build.** With no values loaded, this
  dashboard is mostly zeroes; make that read as "nothing collected yet", never
  as a broken screen.

Backend: extend `app/routers/admin.py`. Keep `require_admin` on every route.
Follow `app/db.py` — call the database, do not re-model it in Python.

**2. A navigation entry** visible only when `auth.hasRole('admin')`, in `app.html`.

**3. First-run guidance.** When no admin exists, `/login` should say so plainly
— *"No administrator account has been created yet. Run `backend\\db\\bootstrap_admin.ps1`."*
Add an unauthenticated `GET /api/auth/bootstrap-status` returning
`{ has_admin: boolean }` and nothing else. **Return only that boolean** — no
counts, no emails: it is a public endpoint (NFR-4).

### Done when

- an admin signing in sees an Admin link and lands on a working `/admin`
- a non-admin sees no Admin link and gets `/403` if they type the URL
- with the `app_user` table empty, `/login` explains what to run
- `bootstrap-status` returns nothing but `has_admin`

---

## A3 — Error messages: one real bug, and missing field-level detail

### What is actually wrong

`api-error.interceptor.ts` is well built and already surfaces the server's
message via `err.error?.detail`. **The bug is that FastAPI's `detail` is not
always a string.**

Verified against the running API:

```
our own rule violation      -> detail is a str
   "Weights must total 100% per domain across agreed and contested variables..."

Pydantic body validation    -> detail is a LIST
   [{'type': 'literal_error', 'loc': ['body','items',0,'domain'],
     'msg': "Input should be 'hazard' or 'exposure'", ...}]
```

`ApiError.message` is typed `string`, so the list is assigned straight through
and `{{ error() }}` renders **`[object Object]`**. Every malformed-input error in
the app currently shows that.

Second gap: even once it reads, a single banner cannot tell the user *which row*
of a weights table is wrong. `ApiError` has no field information, so
`weights-editor.component.ts` can only put the whole message at the top.

### What to build

**1. Fix the interceptor** — normalise all three `detail` shapes:

| Shape | Meaning | Render as |
|---|---|---|
| `string` | our own rule, written for the user | show verbatim, **do not paraphrase** |
| `list` of `{loc, msg}` | Pydantic validation | one line per entry, `loc` mapped to a field name |
| absent / status 0 | network | "Could not reach the server." |

**2. Extend `ApiError`** with optional structured detail — keep `message` as the
human summary so existing callers keep working:

```ts
export interface ApiFieldError { readonly field: string; readonly message: string; }
export interface ApiError {
  readonly status: number;
  readonly message: string;
  readonly fields?: readonly ApiFieldError[];   // from Pydantic loc/msg
}
```

Map `loc: ['body','items',0,'domain']` to something a person recognises — the
indicator code of row 0, not `items.0.domain`. The component knows the row order
it sent; pass the index through and let it resolve the name.

**3. Show field errors where the field is.** In `weights-editor.component.ts`,
render `fields` inline against the offending row and keep the summary at the top.

**4. Give the common statuses a sentence each**, since raw text is not always
enough:

| Status | Message |
|---|---|
| 401 | "Your session has ended. Sign in to continue." + route to `/login?returnUrl=` |
| 403 | Name the role required and the role held |
| 409 | "Someone else saved this profile while you were editing. Reload to see their version." |
| 422 | Server message verbatim — these are written for the user |
| 500 | "Something went wrong at our end. Nothing was saved." — never a stack trace |
| 0 | "Could not reach the server. Check that the API is running on port 8000." |

**5. Never let an error look like an empty result.** The interceptor already
rethrows rather than swallowing; keep it that way. A failed load must render the
error state, never an empty table — that is the same family of defect as
rendering an absent value as zero (NFR-10).

### Done when

- submitting a malformed weight shows a readable sentence, never `[object Object]`
- a domain totalling 95 shows the server's message verbatim, at the top **and**
  against the offending rows
- stopping the API and clicking Save shows the port-8000 message
- a 401 mid-edit routes to `/login` and returns to the editor afterwards

---

## Working rules

1. **Read before writing.** Every file named here already has purposeful
   comments explaining why it is the way it is. Preserve that reasoning; extend
   it rather than replacing it.
2. **Server-side authorisation is the real control.** Nothing in A1 or A2 may
   weaken `require_admin` or the province check in `profiles.py`. UI guards are
   an aid to the user, not a security boundary.
3. **Do not invent error text for rules the database owns.** The 100%-total,
   contested-note and FR-4.9b messages come from `save_profile_weights()` and
   are written for the person editing weights. Pass them through.
4. **Test what you change.** `backend/tests/test_profiles.py` shows the pattern:
   a real database, real requests, negative cases. Add cases for the new guards
   and the interceptor rather than asserting by eye.
5. **Suggested order: A1, then A3, then A2.** A1 is the actual hole; A3 makes
   everything else diagnosable; A2 is the largest and benefits from both.
