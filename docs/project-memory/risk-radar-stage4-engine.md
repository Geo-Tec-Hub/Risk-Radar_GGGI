---
name: risk-radar-stage4-engine
description: The Stage 4 computation engine — where it lives, what it refuses, what it proved on Central's real data, and how a structural zero is handled
type: project
---

Built 3 September 2026 and run on Central's real data. **33 of 33 profiles
compute, 1,323 result rows.**

## Where it lives

`backend/app/engine/vulnerability.py` — `compute_profile()` returns either a
`Computation` or a `Refusal`; `store()` writes `vulnerability_result`.
`backend/compute_all.py` runs a whole province. Refusal tests in
`backend/tests/test_engine_refusal.py`.

The model itself is CLOSED — see [[risk-radar-vulnerability-formula]]. Do not
re-derive it.

## What it refuses, and why refusing matters

A profile does **not** compute when a variable is agreed or contested but
carries no weight (FR-4.7 — the refusal **names** the variables), or when a
domain does not total 100 (FR-4.9 — never rescale up; that silently
redistributes an expert's weighting across variables they never touched).

The failure mode these guard against is silent: a profile that quietly drops an
unweighted variable still produces a full-looking map. Only an assertion catches
it, which is why the four cases are tests and not inspection — and why one of
them is a **positive control**, since a refusal test passes for the wrong reason
if the profile never computed at all.

## Verified on real data, not by reading

- **Recomputation is bit-identical** — 0 differing rows across all 1,323.
- All 33 profiles put exactly one division at **1.000** (the signature that the
  provincial rescale ran).
- An unassessed division carries **no row**, never a zero.
- **131 memberships are `higher_is_better`**, so direction inversion is load-
  bearing, not academic — every *catalogue* row says `higher_is_worse`, so
  reading only the catalogue would have missed it. Use the MEMBERSHIP's
  relationship.

## Structural zeros — settled 3 Sep 2026

Of the 90 zero scores, **64 are structural**: a whole domain is 0 because the
sector is not present. 19 of Central's 41 divisions have no inland fishery at
all; 10 have no pig or sheep farming. The other 26 are ordinary provincial
minima, one per profile.

**Owner decision: a division where the sector is not present is not selectable
and carries no score.** The API returns it as a fourth coverage state,
`not_applicable`, with `value` and `band` null while `hazardIndex` /
`exposureIndex` still carry the zero that is the evidence. See
[[risk-radar-api-and-map]].

**The engine is unchanged.** The stored row keeps its honest 0.000 and the
provincial min-max bounds still include these divisions. Dropping them from the
rescale would move every other division's score, and the measurement model is
closed — that is a separate owner decision. Its cost, accepted for now: with 19
divisions anchoring the floor, variation among the 22 fishery divisions is
compressed.

So the exit criterion restates as: **exactly one 1.000 always; exactly one
0.000 only where the provincial minimum is unique.**

## Coverage on Central

22 of 33 profiles score all 41 divisions; the rest 37-40. The shortfalls are
honest gaps — NU5/NU6/NU7 have no livestock returns, MA1/MA6/MA7/MA9 no
landslide-area figures.

Related: [[risk-radar-vulnerability-formula]], [[risk-radar-api-and-map]],
[[risk-radar-central-data-loaded]], [[risk-radar-unweighted-variables]].
