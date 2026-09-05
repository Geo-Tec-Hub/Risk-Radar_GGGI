---
name: risk-radar-write-scope
description: Why a province is not a narrow enough write boundary, where the sector/hazard-domain line sits, and how a scope is asked for and granted
type: project
---

Added 5 September 2026, on Milinda's observation while setting up a data-entry
agency account: *"there is no specific sector for data entry office — he can
import any data set, but if you look at the files they are specific for sector
or subsector and hazard. Same is true for external experts."*

## Why this became urgent when it did

SRS §3.2 binds a data officer or expert to one province, and until 3 September
that was the only write boundary. On 3 September the official track became
**latest-import-supersedes**, to fix a duplicate-rows defect. That changed what
a wrong-sector upload costs: before, a harmless duplicate; after, a **silent
overwrite** that the map then recomputes from as though nothing happened. Every
agency in Central shares one province, so nothing stood between a livestock
officer and the paddy figures.

## Where the boundary goes, and why it is two things and not one

Measured on Central's loaded data, not assumed:

    exposure   97 variables, 3,920 facts, each used by ~1.9  profiles
    hazard     12 variables,   492 facts, each used by ~13.5 profiles

Exposure variables really are sector-specific, so a sector grant governs them
cleanly — 89% of the data. The twelve hazard variables are not: SPI, warm days,
rainfall and event counts appear across most sectors and belong to the
Meteorological Department and the DMC. **Every workbook carries both**, so a
sector grant alone would still let a paddy officer overwrite the climate
figures thirteen other sectors depend on.

Hence `user_write_scope` (sector, optionally narrowed to one subsector) **and**
a separate `app_user.may_write_hazard_domain` flag. Milinda chose this over
restricting whole templates, and chose sector-with-optional-subsector
granularity.

## Deliberately NOT scoped

- **Reads.** The map is public (FR-12.7). An officer who cannot see other
  sectors cannot sanity-check their own, and there is no confidentiality
  argument for hiding a published score.
- **Hazard type** (drought / flood / landslide). The agency that owns paddy owns
  paddy-drought and paddy-flood alike — the exposure variables are identical and
  only the climate columns differ, which the grant above already covers.
- **Province.** Already singular and enforced.

## One function answers the question

`may_write_profile(user, province, sector, subsector)` — default deny, admin
bypass, province must match, then a row in `user_write_scope` must cover the
sector (a NULL `subsector_id` means the whole sector). The API **asks** it
rather than reimplementing it, so the rule cannot drift between an endpoint and
the database. Enforced at both write paths: `load_template.py` (out-of-scope
workbook, and separately hazard columns without the grant) and
`PUT /profiles/{scope}/weights`.

`schema_write_scope_addendum.sql`, step **7b** in `apply_native.ps1`.

## Request and grant are two different things, in two different places

    app_user.requested_scope   what the applicant asked for      A WISH
    user_write_scope           what an administrator granted     A PERMISSION

Writing the request into the grant table at registration would make an
unapproved wish indistinguishable from an approved permission, and the grant
table is what every check reads. `requested_scope` stores **codes, not ids**, so
it stays readable years later when an id may point at a renamed or retired row.

Codes are validated at **request** time. An applicant who mistypes a sector can
fix it while the form is in front of them; an administrator meeting the same
mistake three days later can only guess what was meant.

`app/scope.py` holds the one definition of the shape — the same thing appears on
the registration form, the approval screen and the amendment endpoint, and a
shape defined three times drifts.

## The approval refuses to default, on purpose

`POST /admin/registrations/{id}/approve` **requires** `scopes` for
`data_officer` and `expert`, and never fills it in from the request. An approval
that silently grants whatever was asked is not a decision. The 422 names what
the applicant asked for, so the administrator is not sent looking for it.

The same reasoning shapes the screen: the admin queue shows the request as
**text** and starts the checkboxes **empty**, with one "Grant what was asked"
button. Pre-ticking the request would hand the decision straight back and
satisfy the server's guard with a form nobody read.

The grant runs **last and in the same transaction** as the role and province, so
a scope that cannot be granted leaves the account `pending` rather than
active-but-unable-to-write.

`PUT /admin/users/{id}/scope` amends later. It **replaces** rather than adds, so
what is on the screen is what the account ends up with; an empty list is a valid
decision that revokes everything.

## /reference/interest-areas is not /taxonomy

Two endpoints that look like duplicates and are not:

- `/taxonomy` answers *what can I look at* and is scoped to profiles that exist,
  because offering a combination with no profile behind it produces a 404 the
  user cannot act on.
- `/interest-areas` answers *what can I be granted permission to write* and is
  the **full** catalogue. Scoping it to existing profiles would mean nobody
  could ask to be the first officer for a sector: the sector would be invisible
  until data existed, and the data cannot exist until someone is granted it.

## A whole sector plus one of its subsectors

Refused at both ends. It is harmless to `may_write_profile` — the whole-sector
row already answers yes — but it almost always means a box was ticked by
accident, and an administrator approving the list as written would grant the
whole sector without noticing. The whole-sector entry is the **wider** grant
even though it is the shorter object, which is why every screen must show it as
"Agriculture (all subsectors)" and never as bare "Agriculture".
