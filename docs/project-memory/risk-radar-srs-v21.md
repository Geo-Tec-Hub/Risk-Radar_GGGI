---
name: risk-radar-srs-v21
description: SRS v2.3 (9 Aug 2026) is the authoritative Risk Radar specification; v2.2, v2.1, v1.3 and SRS.md are all superseded
type: project
---

`design/srs/SRS_v2.3.md` (source) and `SRS_v2.3.docx` (build) are the
authoritative specification. Written to be followed end to end without any
earlier document. **v2.2, v2.1, v1.3 and SRS.md are superseded — do not edit or
cite them.** The file name in this memory is historical; only the version below
matters.

Rebuild with `python build_docx.py SRS_v2.3.md` — the script takes the source on
the command line, so a version bump needs no script edit. Never edit the .docx
directly; the two drift.

**Version history worth knowing, because the model moved fast:**

- v2.0 (6 Aug) — rewritten self-contained; `[P-n]` markers + Annex C introduced
- v2.1 (7 Aug) — formula changed to the raw product renormalised per province
- v2.2 (8 Aug) — frontend stack reversed to Angular
- **v2.3 (9 Aug)** — **normalisation bounds became provincial (reverses P-2),
  with a provincial hold (supersedes P-3); P-5 confirmed and O-9 closed; the
  national index specified as a second phase requiring all 330 divisions.**
  See [[risk-radar-vulnerability-formula]] and
  [[risk-radar-hazard-construct-split]] for the substance.

**How to apply:**

- Unconfirmed decisions are stated as definite rules and marked `[P-n]`, listed
  in **Annex C** with what changes if reversed. Add a new `[P-n]` rather than
  leaving a gap. Reversed and superseded ones are struck through in place, not
  deleted — Annex C is a record, not a current-state list.
- Open items live in **§11.3** (O-1 … O-11). Same convention.
- After any edit, re-run the integrity check: every `FR-n.n` / `NFR-n`
  referenced must also be defined, and the Annex D counts must match the actual
  table rows. Both have caught real errors. **Note: Annex D counts are stale
  after v2.3 — FR-4.3b, FR-4.5b and FR-5.24b were added.**
- A version bump must land in **all six pointer files** or it drifts:
  `CLAUDE.md`, `PROJECT_GUIDE.md`, `PROGRESS_TRACKER.md`,
  `design/ui/FRONTEND_BUILD_GUIDE.md`, `design/ui/FRONTEND_CODE_REVIEW.md`, and
  any live handoff file.

Structure: §1–5 read once in order, §6–9 are reference, **§10 is a ten-stage
build sequence with an exit condition per stage**.

Two companion documents, still current: `SRS_v1.3_Expert_Panel_Questions.docx`
(the 21 questions put to the panel) and `SRS_v1.3_Panel_Review_Resolution.docx`
(what they answered).

Related: [[risk-radar-vulnerability-formula]],
[[risk-radar-hazard-construct-split]], [[nap-taxonomy-alignment]],
[[srs-v13-open-findings]].
