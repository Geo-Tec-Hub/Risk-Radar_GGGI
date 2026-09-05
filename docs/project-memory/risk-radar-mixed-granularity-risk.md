---
name: risk-radar-mixed-granularity-risk
description: Resolved — one Risk Radar variable may not hold single-year and multi-period values across divisions; mixed input is rejected at import
type: project
---

**Resolved.** The expert panel chose to forbid it; SRS v2.1 carries the rule as
**FR-2.7** with validation code **V019**.

The hazard it prevents: `indicator_value` stores a single year as a period whose
start and end are equal, so both forms coexist silently. Normalisation would
then pool an actual year against a typical year on one scale, and a volatile
variable measured in a single severe year normalises toward the top of the range
for reasons of collection rather than reality. No error, plausible provenance,
normal-looking score.

**How to apply:** the 243 generated workbooks cannot produce this — two locked
period tabs, nowhere to enter a single year. The route that can is the **spatial
toolbox**, whose output against a dated layer is genuinely single-year. FR-6.14
therefore requires toolbox output to carry a period label consistent with the
variable's other divisions, so a commit cannot violate FR-2.7. If either
requirement is ever relaxed, they must be relaxed together.

Related: [[risk-radar-srs-v21]], [[srs-v13-open-findings]].
