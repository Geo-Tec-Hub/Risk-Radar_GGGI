---
name: srs-v13-open-findings
description: How each of the six SRS v1.3 defects found on 1 August 2026 was resolved — all are now closed in SRS v2.1
type: project
---

Six defects were found reviewing SRS v1.3. **All are now closed** in
[[risk-radar-srs-v21]]. Kept as a record so they are not re-raised, and because
two of them describe traps that could recur.

| Finding | Resolution |
|---|---|
| `f` never defined in §2.1 | Defined — see [[risk-radar-vulnerability-formula]] |
| Scale slip: Σw = 100 × [0,1] gives [0,100] but text said [0,1] | SRS v2.1 §2.1 writes the `/100` explicitly |
| `iv_for_year()` tie-break non-deterministic, violating reproducibility | Ordering fixed in §8.4: period start desc, then narrower period, then latest id. Also largely moot now periods no longer overlap |
| No rule against mixed granularity within a variable | Now FR-2.7 and validation code V019 — see [[risk-radar-mixed-granularity-risk]] |
| O-11 understated the asset-layer gap | Restated: `POPULATION` and `FACILITY` are unregistered, not merely unloaded. Only `LULC`, `WATER_BODY`, `ROAD`, `BUILDING` exist |
| §10 understated the risk layer — no risk table in the schema at all | Risk deferred to phase 2 as **[P-12]**; `risk_result` listed in §8.5 as a table to be added |

**Why worth keeping:** two of these are traps rather than one-off errors. A
non-deterministic `ORDER BY` feeding a published figure will pass every test and
still violate reproducibility. And an open-items register that understates a gap
("registered but not loaded" when the layer does not exist) is worse than no
register, because it stops anyone looking.

**How to apply:** when reviewing any future revision, run the same two checks
that caught most of these — resolve every requirement cross-reference against
its definition, and verify each claim in the open-items register against the
actual schema and seed rather than against the previous document.
