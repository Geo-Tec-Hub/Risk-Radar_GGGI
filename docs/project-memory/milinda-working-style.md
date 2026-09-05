---
name: milinda-working-style
description: "How Milinda works on Risk Radar — short answers, findings verified against the repo, decisions deferred until he asks"
type: feedback
---

Observed across the SRS review sessions of 1–7 August 2026.

**Keep answers short.** He asks for "short answer" explicitly when a reply runs
long. Lead with the conclusion, then the evidence. He reads carefully and does
not need the reasoning restated.

**Verify against the repo, do not reason from the document.** The findings he
valued most came from parsing `seed_all.sql` and the schema — the 128/115/0
hazard split, 401 of 486 weight groups already at 100, all 558 hazard blanks
having one structural cause. A claim traceable to a file beats a claim traceable
to a specification.

**He defers action deliberately.** "Wait till I ask", "let me resolve them
later" — record findings, do not start fixing. When he does say go, he means the
whole thing, not a first step.

**Say when the experts are wrong, then do what they decided.** He wants the
disagreement on record — the band-distribution arithmetic, the consequences of
provincial renormalisation — but once the panel has ruled, build it as ruled and
put the reservation in the provisional register rather than re-arguing. See
[[risk-radar-vulnerability-formula]].

**Deliverables are for other people.** The panel paper, the resolution document
and SRS v2.1 all go to third parties — experts, a new developer. Documents
should stand alone, state their own context, and not assume the reader has seen
anything earlier.

**Why:** he is the owner and sole technical author of Risk Radar, coordinating
an offline expert panel and handing implementation to a developer he has not yet
briefed. His time goes on judgement, not on being walked through detail.
