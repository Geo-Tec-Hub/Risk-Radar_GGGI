# Data set review — `Data sets.rar`, 17 August 2026

19 workbooks, 129 sheets, **44,230 values**. Checked against the 340-division
register and the 174-variable catalogue in the live schema.

**Headline: the data is excellent and correctly aligned, and it cannot compute
anything yet — every hazard variable is missing.**

---

## 1. Division alignment — perfect

| Check | Result |
|---|---|
| Distinct `DS_Code` values across all files | **340** |
| Codes not found in `dsd_register.csv` | **0** |
| Data sheets whose division set matches their province exactly | **128 of 128** |

This is a stronger result than it looks. The sheets carry `PROVINCE_N`,
`DISTRICT_N`, `DSD_N` and `DS_Code` — the same four fields as
`DS_Boundary.shp` — and the Central paddy sheet ends on **Kothmale West (338),
Thalawakele (339), Nildandahinna (340)**, three of the divisions the 2025
boundary revision created.

**So the collection is confirmed to be on the 340 boundaries, not the old 331.**
That was previously an assurance; it is now measured. No remapping is required.

`DS_Code` (the numeric official code, 1–340) is the join key. It is held in the
register as `ds_code_official_num`.

## 2. Volume and density

| Province | Sheets | Value cells | Populated |
|---|---:|---:|---:|
| Central | 17 | 5,699 | 99.9% |
| Eastern | 13 | 4,860 | 100.0% |
| North Central | 13 | 3,190 | 100.0% |
| Northern | 12 | 3,400 | 99.9% |
| Northwestern | 15 | 7,774 | 100.0% |
| Sabaragamuwa | 15 | 4,060 | 100.0% |
| Southern | 15 | 7,200 | 100.0% |
| Uva | 14 | 3,458 | 100.0% |
| Western | 14 | 4,600 | 100.0% |
| **Total** | **128** | **44,241** | **100.0%** |

Effectively no gaps within the sheets that exist. The gaps are whole sheets that
are absent, not holes inside them.

## 3. The blocker — no hazard data at all

Nine non-composite hazard variables appear across the 243 profiles.
**None of the nine is in this archive:**

```
MISSING  DROUGHT_EVENTS_1974_TO_2022          MISSING  STANDARD_PRECIPITATION_INDEX
MISSING  FLOOD_EVENTS_1974_TO_2023            MISSING  OCCURRENCE_WARM_DAYS
MISSING  LANDSLIDE_EVENTS_1974_TO_2023        MISSING  VERY_WET_DAYS
MISSING  LIGHTNING_INCIDENTS_1974_TO_2023     MISSING  STRONG_WIND_EVENTS_1978_TO_2023
MISSING  CUTTING_FAILURES_EARTH_SLIPS_2000_TO_2023
```

The three composite hazard indices are absent too.

**The file numbering starts at 3.** The archive contains `3.` through `13.`;
there is no `1.` or `2.`. On the evidence, those two files are the hazard
datasets.

**Consequence:** vulnerability is `Hazard × Exposure`. With the hazard domain
empty, **no profile can produce a score** — not one of 243, in any province.
This is the single thing standing between the data and a map.

## 4. What happens the moment the hazard files arrive

**52 profiles have a fully covered exposure domain** and would compute
immediately:

| Count | Sector / subsector |
|---:|---|
| 20 | Water / Potable water |
| 16 | Human settlements |
| 8 | Industry |
| 4 | Transportation |
| 2 | Agriculture / Vegetables & OFC |
| 2 | Inland fishery |

The remaining 190 are partially covered — they need both the hazard files and
some further exposure collection.

## 5. Two sectors are entirely absent

**Coconut** and **Tea** have no data in any province — 18 profiles with nothing
at all. Both are Agriculture subsectors, and together they are the whole of the
NAP's **Export Agriculture** sector.

Missing catalogue variables for them: `COCONUT_EXTENT`, `COCONUT_FARMERS`,
`ANNUAL_COCO_PRODUCTION`, `PCT_COCONUT_EXTENT_AGRICULTURAL_LANDS`, `TEA_EXTENT`,
`TEA_FARMERS`, `ESTATE_SECTOR_POPULATION`, `TOTAL_PLANTS`.

## 6. Import work required — none of it hard

**a. Header rows and column names vary between files.** `7.Paddy` puts its
header on row 4 with `DS_Code` / `DSD_N` / `DISTRICT_N`; `13.Livestock_CP` puts
it on row 3 with `DS Code` / `Ds Division` / `District`. The importer must find
the header rather than assume its position, and normalise names.

**b. 20 column headers are prose, not codes**, and need `indicator_alias`
entries. They are almost all in `3.Flood_Drought_Lslide-maximum_affected_data`:

```
Max # of drought affected People - 2005 to 2022        27 sheets
Max # of Flood affected People - 2005 to 2023          27 sheets
Max # of Flood affected People - 1974 to 2005          22 sheets
Max # of drought affected People - 1974 to 2005        21 sheets
Total Gov Hospitals_2023                               12 sheets
...
```

**c. A modelling question those labels raise.** Several appear as *period pairs
with explicit weights* — `Max_affected_flood - 1974-2004-25%` and
`Max_affected_flood-2005-2023-75%`. The catalogue holds a single
`MAXIMUM_..._AFFECTED_PEOPLE_DURING_1974_TO_2022` variable. Either the two
periods combine 25/75 before import, or the catalogue needs to carry both as
separate variables. **This is a decision, not a mapping** — it changes what the
stored value means. Worth settling before import rather than after.

**d. Stray notes in unused columns.** Several sheets carry free text to the
right of the data (`No Paddy`, division names, counts). The importer should read
only the columns under recognised headers.

## 7. Recommended order

1. **Send files 1 and 2** (the hazard data). Nothing computes without them, and
   52 profiles compute the day they land.
2. Settle the 25% / 75% period question in §6c.
3. Build the importer against these files: locate the header, normalise names,
   join on `DS_Code`, resolve aliases, reject anything unrecognised rather than
   guessing.
4. Coconut and Tea are a separate collection exercise, not an import problem.

---

*Method: every sheet parsed with a tolerant header finder; division sets
compared against `dsd_register.csv`; column headers matched against
`indicator_catalog` and `indicator_alias` by exact, alias and unique-prefix
match; profile coverage computed from the live `profile_indicator` table with
composite hazard indices excluded per [P-5].*
