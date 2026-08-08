# Sector Ingestion Playbook

How to load any sector/subsector into the database from an Excel file — repeatable,
idempotent, and without ever creating new tables. Every run adds **rows** to the shared
catalog schema (`sector` → `subsector` → `indicator_catalog` → `indicator_value`).

> **Prerequisite (one time):** the generic schema must exist. Run PROJECT_GUIDE.md
> component **D3** first (ERD + `schema.sql`). After that, repeat the prompt below for as
> many sectors as you like, in any order.

---

## The copy-paste prompt

Fill the **bold** blanks and send it, with the Excel file(s) attached:

> Ingest into the database: **Sector = \<name\>**, **Subsector(s) = \<list, or "all sheets in
> file"\>**, using the uploaded Excel file(s) **\<filename(s)\>**. Treat domain as
> **exposure** (or **hazard**). Investigate every parameter column, register them in
> `indicator_catalog` under this sector/subsector, load the raw DS-division values into
> `indicator_value` (source=data), compute normalized values, and update the sector registry.

Optional add-ons you can append to the prompt:
- "Direction overrides: \<param\> = higher-is-better." (otherwise inferred)
- "Normalization: use z-score for \<param\>." (default min–max)
- "Year = \<YYYY\>." (otherwise read from file or asked)

---

## What happens on every run (the SOP)

1. **Read** all sheets of the uploaded Excel.
2. **Detect the DS-division key column** and match names against `ds_division`
   (handles the 331+ DS divisions). Unmatched names are flagged, never silently dropped.
3. **Profile each parameter column** and infer: clean name, `unit`, `direction`
   (+1 = higher means more vulnerable / −1 = higher means less), `domain`
   (hazard | exposure), and `norm_method` (minmax | zscore). Present this mapping table
   for a one-line confirm before writing.
4. **Upsert** `sector` and `subsector` rows.
5. **Insert** `indicator_catalog` rows — keyed by a stable `code`, so re-running the same
   file updates rather than duplicates.
6. **Load** raw values into `indicator_value` (source=`data`, with `year`, `user_id`=system).
7. **Compute** `normalized_value` per the catalog config.
8. **Update** `SECTOR_REGISTRY.md` and regenerate that sector's tab in the Excel upload
   template (`design/templates/`).
9. **Report**: # parameters registered, # divisions loaded, unmatched names, missing values.

---

## Guarantees

- **No per-sector tables.** Sector heterogeneity lives in catalog rows, not schema changes.
- **Idempotent.** Re-running a sector's file is safe (upsert by `code`).
- **Track-agnostic.** The same catalog later receives expert/community values (different
  `source`), so all three tracks stay comparable.
- **Self-documenting.** Every ingest appends to the registry below.

---

## Reference: Sri Lanka NAP sectors (2016–2025)

Nine official vulnerable sectors — Food Security · Water Resources · Coastal & Marine ·
Health · Human Settlements & Infrastructure · Ecosystems & Biodiversity · Tourism &
Recreation · Export Agriculture · Industry, Energy & Transportation.

The 13-sector variant splits **Food Security** → Crop Agriculture / Livestock / Fisheries
and **Industry, Energy & Transportation** → Industry / Energy / Transportation.

NAP Appendix Tables A1–A9 (physical effects → impacts → adaptation needs per sector) are a
good source of candidate exposure parameters when an Excel column needs interpreting.
Source: https://unfccc.int/sites/default/files/resource/NAP-Sri-Lanka-2016.pdf
