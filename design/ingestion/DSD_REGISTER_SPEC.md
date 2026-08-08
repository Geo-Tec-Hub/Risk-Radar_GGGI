# A1 — DS-division register: what's needed

**Purpose:** every data-collection template and every map layer keys off one list of DS
divisions. Until that list is official, the 243 templates carry 25 district-level
placeholder rows and no map can be drawn.

**You have a shapefile — that covers everything.** Hand over the shapefile and I derive the
register from it, so the spreadsheet rows and the map polygons can never drift apart.

---

## 1. What to hand over

A DS-division boundary shapefile for **all of Sri Lanka** (~331 divisions).

A "shapefile" is not one file. Send **all four** of these, same base name:

| file | what it holds | required |
|---|---|---|
| `.shp` | the polygons | yes |
| `.dbf` | the attribute table (names, codes) | yes |
| `.shx` | the index | yes |
| `.prj` | the coordinate system | **yes — without it I cannot place the polygons correctly** |

Also fine: a **GeoDatabase** (`.gdb`), **GeoPackage** (`.gpkg`), or **GeoJSON** — these are
single files and avoid the missing-`.prj` problem entirely. Zip the folder either way.

---

## 2. What the attribute table must contain

Each polygon needs, at minimum:

| needed | typical field names | notes |
|---|---|---|
| DS division name | `DSD_N`, `DSD_NAME`, `NAME_3`, `DS_DIVISI` | official English spelling |
| District | `DISTRICT_N`, `NAME_2`, `DIST_N` | one of the 25 |
| Province | `PROVINCE_N`, `NAME_1`, `PROV_N` | one of the 9 |
| Official code | `DSD_C`, `DSD_CODE`, `PCODE` | **if your office has one, include it** |

Field names don't matter — I map whatever is there. Only the four *concepts* matter.

**On the code:** if the Department of Census & Statistics / Survey Department already issues
DSD codes, use them. Adopting the official code now means the database lines up with every
other government dataset later. If there is no official code, say so and I generate one.

---

## 3. Coordinate system

Either is fine, as long as the `.prj` says which:

- **EPSG:4326** (WGS84 lat/long) — what the web map needs
- **EPSG:5235** (SLD99 / Sri Lanka Grid) — what area and density calculations need

I reproject to hold both: geometry stored in 4326 for display, areas computed in 5235 so
they come out in metres rather than degrees.

---

## 4. What I produce from it

1. `design/ingestion/dsd_register.csv` — replaces the placeholder file:

   ```
   province,district,ds_code,ds_division,level
   Western,Colombo,LK-11-01,Colombo,DS_DIVISION
   Western,Colombo,LK-11-02,Thimbirigasyaya,DS_DIVISION
   ```

2. **All 243 templates regenerated** with real rows (~2 minutes, no other change).
3. The `ds_division` table seeded with names **and** polygons — which unblocks B6 (map API)
   and B7 (spatial layer import).

---

## 5. Checks I run before accepting it

| check | why it matters |
|---|---|
| division count ≈ 331 | catches a partial or single-province extract |
| every division rolls up to one of 25 districts, and 9 provinces | catches misspelt or missing parents |
| no duplicate codes; no duplicate name **within** a district | codes are the join key for every uploaded value |
| geometry is valid and closed; no self-intersections | invalid polygons break area maths and map rendering |
| divisions tile the country — no gaps, no overlaps | overlaps double-count population in aggregates |
| `.prj` present and recognised | otherwise the polygons land in the wrong place |

Anything that fails, I report as a list rather than silently patching it.

---

## 6. If the boundaries are newer than the data

DS division boundaries have been resplit over the years. If your shapefile reflects a newer
set than the 2020–2025 data was collected against, tell me which year the boundaries are
from — that determines whether older values need remapping. Worth a moment's thought now;
it is painful to unpick after ingestion.

---

## One-line version

> Send the DS-division shapefile — including the `.prj` — with province, district, name and
> (if it exists) the official DSD code in the attribute table, and tell me which year the
> boundaries are from.
