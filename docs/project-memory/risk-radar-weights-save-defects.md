---
name: risk-radar-weights-save-defects
description: save_profile_weights() has now lost an expert panel's weighting twice, the same way — it validates what it was sent and never what it was sent against
type: project
---

Two defects, five weeks apart, in the same function, of the same shape. Worth
one file because the **shape** is the lesson, not either fix.

## The pattern

`save_profile_weights()` validates the payload **it was sent** and never asks
what it was sent **against**. Both defects fell straight out of that, and both
failed silently and upward: the save reported success, the version number
advanced, and the loss only surfaced later as a map that had gone blank for
reasons pointing nowhere near the save.

## 15 August — consensus discarded

The original reset every membership to `agreed`, throwing away exclusions. A
variable an expert panel had deliberately excluded came back in.

## 5 September — a version with zero memberships

Found while testing the new write-scope enforcement. This went in and came back
**200**:

    PUT /api/profiles/CEN:AGRICULTURE:TEA:flood/weights
    {"items":[{"indicatorCode":"X","domain":"hazard","weightPct":100}]}

It retired `TEA_FLOOD_CEN_V5` — a good version with eleven memberships — and
installed an active **V6 with zero**. Three independent holes, each sufficient
on its own:

1. **An unknown code is silently dropped.** The INSERT ends
   `JOIN indicator_catalog ic ON ic.code = x.code`, so a typo, a renamed
   variable or a stale client contributes no row and the save still succeeds.
2. **A domain absent from the payload is never checked.** The 100% rule groups
   by domain over the items *supplied*. Send no exposure rows and there is no
   exposure group, so nothing is compared to 100.
3. **Omitting a variable the profile carries drops it.** Exclusion in this
   project is a recorded decision, never an inference (SRS §2.4, FR-4.9): a
   variable is removed by sending it `rejected`, not by leaving it out.

## The fix, and where it lives

`schema_weights_save_completeness_addendum.sql` adds
`assert_weights_payload_complete()` with those three checks, and **splices** a
`PERFORM` of it into `save_profile_weights()` by rewriting the `prosrc` it finds
in `pg_proc`. Registered as step **5c**, which must run immediately after 5b:
run it before 5b and there is nothing to splice; re-run 5b afterwards and the
splice is overwritten. It raises if the splice point is not found rather than
silently doing nothing.

Fixed at the **database**, not the router, so every caller is covered.
`routers/profiles.py` already translates `asyncpg RaiseError` to 422 with the
message unchanged.

The checks run **before anything is retired**. That is the part that matters:
the 5 September damage was not the refusal that never came, it was that a good
version had already been retired by the time anything went wrong.

## Repair

V6 was deleted — it held nothing and no `vulnerability_result` row rested on it
— and V5 reactivated. 41 divisions recompute, `profileVersion: 5`.

## The tests are worth more than the fix

`backend/tests/test_weights_save_completeness.py`, six tests, keyed on the
**scope** and never on a profile code (the QA #6 lesson: a hardcoded
`PADDY_DROUGHT_CEN_V5` made four tests SKIP and report green). An unchanged
round trip is accepted (positive control, so a refusal test cannot pass because
the save refuses everything); each hole is refused **and names what is wrong**;
removal by sending `rejected` still works, so the checks have not made a
legitimate edit impossible; and a refused save leaves the active version intact.

If this function is ever rewritten, these tests are what makes the rewrite keep
the property.
