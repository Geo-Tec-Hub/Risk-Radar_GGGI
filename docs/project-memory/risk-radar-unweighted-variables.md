---
name: risk-radar-unweighted-variables
description: "An unweighted Risk Radar membership is resolved by excluding it, not by weighting it — and the hazard domain needs an exception or excluding silently reinstates the composite index"
type: project
---

Owner decision, 9 August 2026, now SRS v2.3 §2.4 + FR-4.9 / FR-4.9b.
**Supersedes [P-6]** (equal weight as an exposure interim), because equal weight
alters every other weight in the domain and exclusion does not.

The rule: a blank weight means the variable is not significant, so **exclude it
and require the remainder to total exactly 100**. If it does not, **warn and
refuse to compute** — never rescale to reach 100, because the weights used would
then not be the weights anyone typed.

Two qualifications carry all the weight:

1. **Exclusion is a recorded decision, never an inference.** The app asks on
   save and writes `consensus = 'rejected'` with author and date — the column
   added the same morning, before this rule existed. A blank cannot otherwise be
   told apart from an oversight, and no published score may rest on one.
2. **In the hazard domain, exclude only a blank *composite index*.** If a
   *component* is blank while the composite carries the weight, hold the profile.

**Measured from `seed_all.sql`, 3,664 memberships — do not re-derive:**

| Hazard-domain shape | Profiles | Outcome |
|---|---|---|
| Components weighted, composite blank | **115** | Exclude the composite — this *is* [P-5]. Computes |
| Composite weighted at 100, components blank | **128** | **Hold.** Excluding hands the domain back to the composite |

Exposure: **213 of 243** groups total 100 once blanks are excluded; **30 warn**.
Combined: **97 of 243 profiles computable immediately** — Central 29, Western 24,
Southern 22, Sabaragamuwa 22. Those **30 exposure groups are the entire
remaining weights backlog**; do not describe it as 1,783 memberships.

**How to apply.** I first recommended "never auto-exclude in the hazard domain"
to protect P-5, and it was accepted — then parsing the seed showed it left
**0 of 243** computable, because every hazard group contains a blank. The fix
was to key on *what* is blank. Two lessons: **check a rule against
`seed_all.sql` before recommending it**, and treat the "401 of 486 groups
already total 100" figure in §5.4 as misleading — it counts domain groups, and
every hazard group is in it.

Related: [[risk-radar-hazard-construct-split]], [[risk-radar-srs-v21]],
[[risk-radar-vulnerability-formula]].
