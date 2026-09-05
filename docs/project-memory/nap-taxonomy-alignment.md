---
name: nap-taxonomy-alignment
description: "Resolved — Risk Radar records the NAP's 13 sectors as a crosswalk beside its own 8, not by restructuring; collection gaps are phase 2"
type: project
---

**Resolved** and built into SRS v2.1 §5.3 as **[P-8]**, **[P-9]** and
**[P-10]**. The NAP sector list came from Milinda on 1 August 2026.

The two taxonomies do not nest, which is why a crosswalk rather than a
restructure: **Agriculture divides across two NAP sectors** (paddy and field
crops → Food Security; tea and coconut → Export Agriculture) while **Industry
and Transportation combine into one**. A foreign key could not express it even
if wanted. Held as `nap_sector` + `sector_nap_map`, with an `is_assessable`
flag; no live profile changes.

Coverage: six of the thirteen NAP sectors have data (Food Security 110
profiles, Water Resources 40, Industry/Energy/Transportation 33, Human
Settlements 24, Tourism 18, Export Agriculture 18). Seven have none.

Four NAP entries — Disaster Risk Management, Human Mobility & Migration,
Cross-Cutting Governance and Cultural & Heritage — describe response capacity or
institutional arrangements rather than anything with exposure indicators at
DS-division level. They are registered and flagged not assessable, so they
appear in NAP reporting without ever reading as missing data.

**Why the phase-2 split:** the panel answered C3 by making every gap a
collection target — rubber, energy, marine fisheries, watershed, estate
infrastructure — which contradicts both their own C4 answer (register hazards
only, no new variables) and Milinda's earlier register-only decision. SRS v2.1
resolves it as **phase 2** **[P-10]**. This is one of the nine items still
listed as open in `SRS_v1.3_Panel_Review_Resolution.docx`.

**How to apply:** if a second collection round is ever approved, the cost is
what makes it a programme rather than a task — profiles scale as province ×
sector × hazard, so adding sectors and hazards multiplies the 243 profiles and
the 3,664 memberships, against a backlog where none of the 243 is fully weighted
yet. See [[risk-radar-hazard-construct-split]].

Related: [[risk-radar-srs-v21]].
