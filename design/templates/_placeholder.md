# templates/ — to be produced (D6)

Expected artifacts:
- `hazard_upload_template.xlsx`
- `exposure_upload_template.xlsx`

Each row = DS division × indicator code (FK to indicator_catalog) × **raw** value +
metadata (year, source, unit, notes). Dropdowns/validation from the catalog. A README sheet.
**No normalization in Excel** — it is computed server-side.

Produce with the **xlsx** skill. If you have sample data, upload it first so the schema is
modeled on your real columns. See PROJECT_GUIDE.md §4 D6.
