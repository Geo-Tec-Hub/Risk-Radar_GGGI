---
name: risk-radar-331st-division
description: "DS boundaries: 330 → 331 → 340 (Survey Dept 2025 revision, loaded 14 Aug 2026). Official codes adopted, register complete. The nine additions are SPLITS, not new land. Never hardcode the count"
type: project
---

**Source of truth: `design/spatial/DS_Boundary.shp`** — Survey Department,
2025-10-09, supplied 14 August 2026. **340 divisions**, official codes in
`New_DS_Cod`, projected in **EPSG:5234 (Kandawala Sri Lanka Grid), not 4326**.
`SL_RDSD.shp` is the superseded 330-polygon revision — do not load it.
**[O-12], [O-5] and [O-2] are all closed.**

## The lesson is the volatility, not any one number

330 (Jul, shapefile) → 331 (10 Aug, Kalmunai split, O-2) → **340** (14 Aug,
2025 revision, O-12). **Never hardcode the count** — not in prose, schema, smoke
tests, frontend or a user-facing string. SRS §5.1 names three quantities read at
runtime: *official*, *registered* (`dsd_register.csv`, the denominator for every
completeness rule) and *drawable* (`geom IS NOT NULL`). They are equal today;
**that is not a reason to write the number down.**

Rows per province: Central 41 · Eastern 45 · North Central 29 · Northern 34 ·
Northwestern 46 · Sabaragamuwa 29 · Southern 50 · Uva 26 · Western 40.

## The nine additions are splits, not new land

Established by **overlaying the new polygons on the old set, not by matching
names**. Ambagamuwa → Ambagamuwa Korale + Norwood; Kothmale → Kothmale East +
West; Hikkaduwa → Madampagama + Rathgama + remainder; Baddegama → Wanduramba;
Hanguranketa → Mathurata; Walapane → Nildandahinna; Nuwara Eliya → Thalawakele;
Balangoda → Kalthota. Recorded per row in the register's `split_from` column.

Two consequences a name-match would have hidden:

1. **New units start with no values** — copying the parent's double-counts every
   count and extent variable (the Kalmunai rule).
2. **The six surviving parents now cover less area than before**, so an extent or
   count value collected against the old boundary is *wrong* for them, not merely
   stale. Milinda confirms the 2020–2025 collection is tabulated against the 340
   boundaries, so no remapping is required.

## Codes

`ds_division.code` is the **official** code (`KA1`, `AM8`, `GA14`), adopted by
`schema_official_dscode_addendum.sql` (Stage 1.15). Generated `CEN-001` codes
survive as `legacy_code` for **diagnosing stale references only, never a join
key**. `EAS-008`, `CEN-032` and `CEN-034` are **retired and never reused** — each
was split in two, and a retired code must fail loudly rather than quietly resolve
to half the area it used to mean.

**Join the shapefile to the register on `new_ds_cod`, never on name.** Nine
divisions were renamed in this revision ("Koralai Pattu North" → "KORALAI PATTU
NORTH (VAHARAI)"); the old name join would have loaded them as boundary-pending
with a good polygon sitting unused in staging — no error, no map.

## How to apply

- The migration **renames in place**, never delete-and-reload: `ds_division.id`
  is referenced by `indicator_value`, `vulnerability_result`, `community_rating`
  and the toolbox tables. Its retirement step is **guarded** — if a retired
  division holds any value it raises instead of deleting.
- **Test migrations against a scratch PostgreSQL seeded to the pre-migration
  state.** Doing so caught two defects invisible on reading: a row-separating
  comma swallowed by a trailing `--` comment (whole `VALUES` list malformed), and
  two parent divisions with no successor row at all.
- Pass **`-s_srs EPSG:5234` explicitly** to ogr2ogr — that .prj carries no EPSG
  authority code, and a misread source CRS places every polygon in the wrong part
  of the world without raising anything. Verify any reprojection by comparing
  centroids to the previous boundaries (median offset was 244 m here).
- Re-run the six acceptance checks in `DSD_REGISTER_SPEC.md` §5 if the boundary
  set is revised again. It has moved three times in three weeks.
- **Two helper scripts now live in `design/templates/`:**
  `verify_workbooks.py` (opens all 243 workbooks and checks row counts, codes and
  names against the register, on both period tabs) and `rebuild_manifest.py`
  (regenerates `MANIFEST.csv` from the workbooks). Run the verifier after any
  register change — it is the only thing that catches a half-regenerated set,
  which otherwise looks completely normal.
- `generate_templates.py --start N --limit M` regenerates in chunks, but **each
  chunk rewrites MANIFEST.csv** unless `--resume` is passed, so run
  `rebuild_manifest.py` afterwards.

Related: [[risk-radar-vulnerability-formula]], [[risk-radar-srs-v21]],
[[risk-radar-gradual-data-arrival]].
