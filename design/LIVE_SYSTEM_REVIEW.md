# Review of the live Risk Radar

**Target:** `riskradar.geoinfobox.com` (frontend) · `riskradarback.geoinfobox.com` (API)
**Date:** 30 July 2026
**Method:** Browser inspection of the running system, plus unauthenticated
requests to public API endpoints. **Read-only — nothing was created, modified or
deleted.** Probing stopped as soon as each issue was confirmed.

---

## Read this part first

**The production API requires no authentication, and the production server is
publishing its own configuration to anyone who asks.**

These are not theoretical. Both were confirmed from a signed-out request. I
stopped testing at the point of confirmation rather than seeing how far it went.

| # | Finding | Severity |
|---|---|---|
| S-1 | Every API endpoint is readable **and writable** by anonymous users | **Critical** |
| S-2 | `DEBUG = True` in production — full settings and environment dumped on any error | **Critical** |
| S-3 | Running on Django's **development server** (`WSGIServer/0.2`) | **High** |
| S-4 | `CORS_ALLOW_ALL_ORIGINS = True` together with `CORS_ALLOW_CREDENTIALS = True` | **High** |
| S-5 | Auth, session and CSRF cookies all have `Secure = False`; `SameSite = None` | **High** |
| S-6 | `ALLOWED_HOSTS = ['*']`, no HSTS, no HTTPS redirect | Medium |

### S-1 · The API is open to the world

`GET /api/users/sector/`, `/api/users/hazard/` and `/api/users/vulndata/check/`
all return **HTTP 200 to a signed-out client**, and each advertises
`Allow: GET, POST` with a working submission form.

The cause is visible in the exposed settings:

```
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [...]      # authentication configured
                                                 # DEFAULT_PERMISSION_CLASSES absent
}
```

With no default permission class, Django REST Framework falls back to
`AllowAny`. Authentication is configured but **never enforced**, so any
endpoint that does not set permissions explicitly is public. On the evidence,
that is all of them.

Practically: anyone who finds the URL can read the vulnerability dataset and
write to it. A single unauthenticated POST could add a sector, a hazard, or a
vulnerability value, and nothing in the data would show where it came from.

**Fix:** set a project-wide default immediately, then relax deliberately per view.

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [...],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
}
```

Public read of published results is a legitimate requirement — but it should be
granted explicitly on the few endpoints that serve the map, and should be
read-only (`IsAuthenticatedOrReadOnly` at most, never on write endpoints).

### S-2 · DEBUG is on in production

Requesting `/api/users/entrycount/` (which happens to be broken — see F-2)
returned a full Django debug page to an anonymous client, containing:

- the complete settings module — database engine, name (`infobox_riskradar`),
  user (`postgres`), host, installed apps, middleware
- absolute filesystem paths (`/var/www/sites/geoinfobox.com/riskradarback/…`)
- Python version, virtualenv path, process user (`www-data`), server hostname
- internal network addresses (`192.168.11.x`) and the dynamic-DNS name
- the requesting client's own IP address
- a full stack trace with local variables

Django's `SafeExceptionReporterFilter` masked `SECRET_KEY`, the database
password and email credentials — that is the one piece of luck here. Everything
else was in the clear.

A 404 on any unmatched path also prints the **entire URL routing table**, which
is how the full API surface below was enumerated.

**Fix:** `DEBUG = False`, set `ALLOWED_HOSTS` to the real hostnames, and
configure `LOGGING` (currently `{}`) so errors go to a log rather than the
browser. Do this first — it is a one-line change and closes the widest hole.

### S-3 · Django's development server is serving production

`SERVER_SOFTWARE: 'WSGIServer/0.2'` means the site is running under
`manage.py runserver`. Django's own documentation states plainly that this
server is not audited for security and must not be used in production. It is
also single-process, which is a likely contributor to the freezes in F-3.

**Fix:** run under gunicorn or uWSGI behind nginx.

### S-4 · CORS allows any origin, with credentials

```
CORS_ALLOW_ALL_ORIGINS  = True
CORS_ALLOW_CREDENTIALS  = True
CORS_ALLOW_METHODS      = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
```

Any website a logged-in user visits can make credentialed requests to this API
on their behalf, including DELETE and PUT. The `CORS_ALLOWED_ORIGINS` list is
still pointing at development addresses (`http://192.168.11.159:3000`), which
suggests the allow-all was a development shortcut that was never removed.

**Fix:** `CORS_ALLOW_ALL_ORIGINS = False` and list the real frontend origin.
`corsheaders.middleware.CorsMiddleware` also appears **twice** in `MIDDLEWARE`;
remove the duplicate.

### S-5 · Cookies are not marked Secure

```
AUTH_COOKIE_SECURE    = False       AUTH_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE    = False
```

`SameSite=None` without `Secure` is rejected outright by current browsers, so
this is likely breaking authentication as well as weakening it — see F-1.

**Fix:** set all three to `True`, keep `SameSite=None` only if the frontend is
genuinely on a different site, and add `SECURE_SSL_REDIRECT = True` plus an
`SECURE_HSTS_SECONDS` value.

### Also

The account credentials shared with me should be **rotated**. `12345678` would
not survive a dictionary attack, and it has now travelled through a chat log.
Given S-1, account security is not currently what protects the data — but it
will be once the permissions are fixed.

---

## Functional problems

| # | Finding | Impact |
|---|---|---|
| F-1 | Session appears signed in while the API returns 401 | Users silently locked out |
| F-2 | `/api/users/entrycount/` returns HTTP 500 | Feature broken |
| F-3 | Selecting the DSD layer froze the browser for over 30 seconds | Unusable at DS level |
| F-4 | "My Data" shows "Loading…" indefinitely | No error state anywhere |

### F-1 · Signed in according to the UI, signed out according to the API

The header renders **Logout**, implying an authenticated session, while
`GET /api/users/me/` returns **401** and the console logs `Failed to fetch user
data`. The frontend decides what to render from something held client-side
rather than from the API's answer.

The user sees an application that looks logged in but cannot load any of their
data, with no message explaining why and no redirect to the login page. Given
S-5, expired or browser-rejected cookies are the likely trigger.

### F-2 · A serializer bug returns 500

```
AttributeError: Got AttributeError when attempting to get a value for field `id`
on serializer `EntryCountViewDataSerializer`.
'bytes' object has no attribute 'id'
```

The view is passing raw bytes — almost certainly the result of a raw SQL query —
to a serializer expecting model instances. This is what exposed the settings
dump in S-2, so the two compound each other.

### F-3 · The DS-division layer is too heavy for the browser

Clicking **DSD** locked the renderer long enough that a screenshot request timed
out after 30 seconds. The layer is 330 polygons carrying roughly 1.36 million
vertices in the source shapefile; sending that as raw GeoJSON to the browser
will not work.

**Fix:** serve simplified geometry at low zoom (`ST_SimplifyPreserveTopology`),
or vector tiles via `ST_AsMVT`. PostGIS is already installed, so both are
available server-side. This is the difference between the map being usable at
national extent and not.

### F-4 · No error states

Three distinct failures — 401, 500, and a hung render — all present to the user
as either an infinite spinner or nothing at all. Any of them would take a long
time to diagnose from a user's report.

---

## The existing data model

The full API surface (46 routes) was readable from a 404 page. The core is a
single `vulndata` table. Its create form takes:

```
user_id · gnd_id · gnd · sec · hzd · value
```

That is one number per Grama Niladhari division × sector × hazard. Compared
with the model specified in the SRS, the following are absent:

| Concept | Live system | New design |
|---|---|---|
| Hazard vs exposure split | one combined `value` | two domains, indices computed separately |
| Weights | none | `profile_indicator`, Σ100 per domain, versioned |
| Direction (+/−) | none | per variable, per profile |
| Time | none | `year_start`/`year_end`, period rules |
| Provenance track | none | `data` / `expert` / `community` |
| Raw vs normalised | one value, pre-computed | raw stored, normalised server-side |
| Explainability | score cannot be decomposed | result pins the exact profile version |
| Indicator catalogue | none — no variable list | 174 canonical variables + aliases |

**This is the substantive gap.** The live system stores a *conclusion* — a
vulnerability percentage someone worked out elsewhere. The new design stores the
*evidence* and computes the conclusion, which is what makes a score explainable,
reproducible, and comparable between provinces.

### Reference data differences

| | Live | New design |
|---|---|---|
| Sectors | **15** | 8 |
| Hazards | **20** | 3 (Drought, Flood, Landslide) |
| Finest unit | GND (ADM4) | DS division (ADM3) |

The live taxonomy is broader — it includes Coastal & Marine, Ecosystems &
Biodiversity, Health, Energy and Coastal Fisheries, and hazards such as sea
level rise, salt water intrusion and coastal erosion. **This is worth a
decision, not an assumption.** The refined catalogue we built covers only what
the 243 provincial workbooks actually contained; the live list may represent
intended future scope.

The live reference data also carries typos that should be corrected before
migration, since they will otherwise persist as codes: *"Changers in Rainfall
Pattern"*, *"Lightening"* (should be Lightning), *"High Intencity Rainfall"*,
*"Deforestration"*.

### Other observations

- `oldvulndata/dsd/geom/avg/` is still routed and live — legacy left in place.
- Several routes are named `.../sql/` (`pd/sql/`, `dsd/sql/`, `gnd/sql/select/`).
  If any of these interpolate request parameters into SQL, that is an injection
  risk. I did not test them; **they should be reviewed in the source.**
- `APPEND_SLASH = False` while every route ends in a slash — any client that
  omits it gets a 404 rather than a redirect.
- No pagination is visible on list endpoints.

---

## What I would do, in order

**Today — stop the bleeding.** None of these need a redesign:

1. `DEBUG = False` and set `ALLOWED_HOSTS`
2. Add `DEFAULT_PERMISSION_CLASSES = ['...IsAuthenticated']`
3. `CORS_ALLOW_ALL_ORIGINS = False`; list the real origin; remove the duplicate middleware
4. Set the three cookie `Secure` flags; add `SECURE_SSL_REDIRECT`
5. Rotate the shared password

**This week.** Move off `runserver` to gunicorn + nginx. Configure logging. Fix
the `entrycount` serializer. Add an error state to the frontend and make it
trust the API's answer rather than a client-side flag.

**Then — the improved version.** The work already completed is the replacement:
a schema that stores evidence rather than conclusions, 174 catalogued variables,
330 validated DS divisions, versioned weights, and 243 collection workbooks.

The sensible path is not to patch the live system into that shape but to stand
the new one up alongside it, migrate `vulndata` into `indicator_value`, and cut
over. Two questions need answering before migration can be designed:

- **Do the extra 7 sectors and 17 hazards stay?** They are in the live system
  but absent from every provincial workbook.
- **Is GND-level data actually populated?** If real GND data exists, dropping
  to DS-division-only would lose it — and the GND shapefile is already staged.

I can answer both by querying the live API for row counts, if you want that
before deciding.
