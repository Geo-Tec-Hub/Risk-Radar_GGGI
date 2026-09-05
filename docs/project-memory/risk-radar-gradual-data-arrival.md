---
name: risk-radar-gradual-data-arrival
description: "Milinda's position (14 Aug 2026): the weights and phase-2 backlogs close gradually as real workbooks arrive and need no decision — provided the user can always see what is outstanding. Became FR-2.17 / FR-2.18"
type: project
---

**Owner decision, 14 August 2026.** Asked about the weights backlog and the
phase-2 collection gaps, Milinda: *"This needs to be addressed gradually as I
upload the real Excel, so we do not need to worry about this at development
stages"* and, on phase 2, *"these data will gradually update, only the case is
user should know what remains to upload."*

**This is the right call, and here is why it holds.** The two backlogs are not
the same kind of thing and neither is a development blocker:

- **128 profiles held for hazard components** close by *collection*, not by
  decision — [P-5] is confirmed (see [[risk-radar-hazard-construct-split]]).
  Nothing to decide.
- **30 exposure groups whose weights do not total 100** are the only genuine
  weights backlog (see [[risk-radar-unweighted-variables]]). They are entered
  in the app at import, by the person who has the domain knowledge, against
  real numbers. Deciding them in advance would be inventing them.

The build is already correct for empty data — §2.2's provincial hold, the three
coverage states, and FR-4.9's refuse-to-compute all assume incompleteness is the
normal state. So the backlog is genuinely not on the critical path.

**The one thing this makes load-bearing: visibility.** If the system computes
nothing until data arrives, the outstanding register *is* the product for
months. Existing FR-2.12–2.16 (the province import summary) covers this only
*after* an import, which is the wrong shape — the question is asked before one.

**Now specified as FR-2.17 and FR-2.18** (SRS v2.3 §6.2, added 14 Aug 2026):

- **FR-2.17** — a *standing* outstanding-data register, available at any time
  without running an import, resolved to **profile × period × variable × DS
  division**, distinguishing *not yet supplied* from *supplied and rejected*
  from *not applicable to this province*.
- **FR-2.18** — for each unmet precondition it must name the thing that would
  discharge it: divisions still holding no value (§2.2), hazard components held
  under [P-5], exposure groups short of 100 (§2.4), and any division in the
  official count but not in the register (§5.1, [O-12]). Exportable as CSV and
  Excel; province-scoped for a data officer, national for an administrator.

**How to apply.** Do not press for weights decisions ahead of the data, and do
not treat 0-of-243-computable as a project failure state — it is the designed
starting condition. Do treat the outstanding register as a first-class screen,
not a report: it is what the user looks at every time until the first province
completes. The three *not supplied / rejected / not applicable* states matter —
collapsing them is the same defect as rendering an absent value as zero.

Related: [[risk-radar-unweighted-variables]],
[[risk-radar-hazard-construct-split]], [[nap-taxonomy-alignment]],
[[risk-radar-331st-division]].
