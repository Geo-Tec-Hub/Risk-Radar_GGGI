# database/ — to be produced (D3)

Expected artifacts:
- `erd.svg` — entity relationship diagram.
- `schema.sql` — PostgreSQL + PostGIS + pgvector DDL.

Core tables: `ds_division` (geom), `indicator_catalog`, `hazard_type`, `sector`,
`subsector`, `indicator_value` (source enum data/expert/community, user_id, scenario_id),
`vulnerability_result`, `ssp_scenario`, `scenario_parameter`, `impact_projection`,
`monitoring_observation`, `users`/`roles`, `agent_document` + `agent_embedding` (pgvector).

Key rule: schema is **config-driven** (indicator_catalog), one indicator_value table with a
**source provenance** column. See PROJECT_GUIDE.md §4 D3.
