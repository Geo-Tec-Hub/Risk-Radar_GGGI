-- ============================================================================
-- Risk Radar — schema addendum: import batches + weights entered in the app
-- 2026-07-26 (rev 2 — simplified for V1) · applies on top of schema.sql
--
-- DECISIONS (Milinda, 2026-07-26)
--   1. Weights are entered in the APP at import time, not carried by the data.
--      The workbook's WEIGHTS tab is reference-only; the app is the master.
--   2. On every upload the officer sees weights PRE-FILLED (read from that
--      workbook, or from the profile's current set) and may EDIT them.
--   3. NO in-app approval gate. Data is verified against a local expert panel
--      offline; once that panel has signed off, the data feeder or admin edits
--      and saves directly. Keep V1 simple — no hard rules, no pending states.
--
-- WHAT IS STILL ENFORCED (and why it is not "complexity")
--   Saving weights writes a NEW vulnerability_profile version rather than
--   overwriting profile_indicator. This is invisible to the user — one button,
--   one save — but it means every stored vulnerability_result still knows the
--   weights that produced it. Overwriting in place would silently change the
--   meaning of every past score with no way to explain the difference.
--   If you ever want plain overwrite instead, drop save_profile_weights() and
--   UPDATE profile_indicator directly; nothing else depends on the versioning.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Import batch — one row per uploaded workbook.
--    schema.sql tracks provenance per value (source / user / data_source) but
--    has no handle for "the file this came from". Needed so the weights screen
--    can be tied to its upload, and so a bad import can be undone as a unit.
-- ----------------------------------------------------------------------------
CREATE TYPE import_status AS ENUM ('uploaded', 'validated', 'loaded', 'rejected', 'rolled_back');

CREATE TABLE import_batch (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    filename       TEXT   NOT NULL,
    profile_code   TEXT,                       -- from the workbook's hidden _META tab
    province_id    SMALLINT REFERENCES province(id)          ON DELETE SET NULL,
    sector_id      BIGINT   REFERENCES sector(id)            ON DELETE SET NULL,
    subsector_id   BIGINT   REFERENCES subsector(id)         ON DELETE SET NULL,
    hazard_type_id BIGINT   REFERENCES hazard_type(id)       ON DELETE SET NULL,
    year_start     INTEGER,
    year_end       INTEGER,
    status         import_status NOT NULL DEFAULT 'uploaded',
    rows_total     INTEGER,
    rows_loaded    INTEGER,
    error_count    INTEGER NOT NULL DEFAULT 0,
    error_detail   JSONB,                      -- per-cell validation failures
    uploaded_by    BIGINT NOT NULL REFERENCES app_user(id)   ON DELETE RESTRICT,
    uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT import_batch_period_valid CHECK (
        year_end IS NULL OR year_start IS NULL OR year_end >= year_start)
);
CREATE INDEX import_batch_recent_ix ON import_batch (uploaded_at DESC);
CREATE INDEX import_batch_scope_ix
    ON import_batch (province_id, sector_id, hazard_type_id, status);

ALTER TABLE indicator_value
    ADD COLUMN import_batch_id BIGINT REFERENCES import_batch(id) ON DELETE SET NULL;
CREATE INDEX indicator_value_batch_ix ON indicator_value (import_batch_id);


-- ----------------------------------------------------------------------------
-- 2. Who saved a weight set, when, and off the back of which file.
--    Plain audit columns — no status, no workflow.
-- ----------------------------------------------------------------------------
ALTER TABLE vulnerability_profile
    ADD COLUMN created_by      BIGINT REFERENCES app_user(id)    ON DELETE SET NULL,
    ADD COLUMN import_batch_id BIGINT REFERENCES import_batch(id) ON DELETE SET NULL,
    ADD COLUMN panel_note      TEXT;   -- e.g. "approved by Central expert panel, 2026-07-14"

-- what the workbook said, kept beside what was actually saved, so the two can
-- be compared later. NULL = variable was new in the refined catalogue.
ALTER TABLE profile_indicator
    ADD COLUMN weight_pct_from_file NUMERIC(6,3)
        CHECK (weight_pct_from_file > 0 AND weight_pct_from_file <= 100);


-- ----------------------------------------------------------------------------
-- 3. Save a weight set. One call, takes effect immediately.
--
--    p_items: JSONB array of
--       {"code":"FLOOD_HAZARD_INDEX","domain":"hazard","weight_pct":40,
--        "relationship":"higher_is_worse","weight_pct_from_file":35}
--
--    Weights must total 100 per domain — the one rule kept, because a total
--    that is not 100 makes the resulting index silently wrong rather than
--    visibly wrong.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION save_profile_weights(
    p_province_id    SMALLINT,
    p_sector_id      BIGINT,
    p_subsector_id   BIGINT,
    p_hazard_type_id BIGINT,
    p_items          JSONB,
    p_user_id        BIGINT,
    p_import_batch_id BIGINT DEFAULT NULL,
    p_panel_note     TEXT    DEFAULT NULL
) RETURNS BIGINT
LANGUAGE plpgsql AS $$
DECLARE
    v_next   INTEGER;
    v_new_id BIGINT;
    v_code   TEXT;
    bad      TEXT;
BEGIN
    -- weights must total 100 within each domain
    SELECT string_agg(format('%s = %s%%', domain, total), ', ')
      INTO bad
      FROM (SELECT x.domain, ROUND(SUM(x.weight_pct), 3) AS total
              FROM jsonb_to_recordset(p_items)
                   AS x(code TEXT, domain TEXT, weight_pct NUMERIC)
             GROUP BY x.domain) s(domain, total)
     WHERE total <> 100.000;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Weights must total 100%% per domain (got %)', bad;
    END IF;

    -- retire the current active version for this scope
    UPDATE vulnerability_profile
       SET is_active = FALSE
     WHERE is_active
       AND province_id    IS NOT DISTINCT FROM p_province_id
       AND sector_id      = p_sector_id
       AND subsector_id   IS NOT DISTINCT FROM p_subsector_id
       AND hazard_type_id = p_hazard_type_id;

    SELECT COALESCE(MAX(version), 0) + 1 INTO v_next
      FROM vulnerability_profile
     WHERE province_id    IS NOT DISTINCT FROM p_province_id
       AND sector_id      = p_sector_id
       AND subsector_id   IS NOT DISTINCT FROM p_subsector_id
       AND hazard_type_id = p_hazard_type_id;

    SELECT format('%s_%s_%s_V%s',
                  upper(regexp_replace(COALESCE(ss.name, s.name), '[^A-Za-z0-9]+', '_', 'g')),
                  upper(h.name), COALESCE(p.code, 'NAT'), v_next)
      INTO v_code
      FROM sector s
      LEFT JOIN subsector ss ON ss.id = p_subsector_id
      JOIN hazard_type h     ON h.id  = p_hazard_type_id
      LEFT JOIN province p   ON p.id  = p_province_id
     WHERE s.id = p_sector_id;

    INSERT INTO vulnerability_profile
        (code, name, province_id, sector_id, subsector_id, hazard_type_id,
         version, is_active, created_by, import_batch_id, panel_note)
    VALUES
        (v_code, v_code, p_province_id, p_sector_id, p_subsector_id, p_hazard_type_id,
         v_next, TRUE, p_user_id, p_import_batch_id, p_panel_note)
    RETURNING id INTO v_new_id;

    INSERT INTO profile_indicator
        (profile_id, indicator_id, domain, weight_pct, relationship, weight_pct_from_file)
    SELECT v_new_id, ic.id, x.domain::domain_type, x.weight_pct,
           COALESCE(x.relationship, 'higher_is_worse')::indicator_direction,
           x.weight_pct_from_file
      FROM jsonb_to_recordset(p_items)
           AS x(code TEXT, domain TEXT, weight_pct NUMERIC,
                relationship TEXT, weight_pct_from_file NUMERIC)
      JOIN indicator_catalog ic ON ic.code = x.code;

    RETURN v_new_id;   -- caller recomputes vulnerability against this version
END $$;


-- ----------------------------------------------------------------------------
-- 4. Weight history — "who changed what, when", for the admin screen
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_profile_weight_history AS
SELECT vp.id AS profile_id, vp.code, vp.version, vp.is_active,
       p.name AS province, s.name AS sector, ss.name AS subsector, h.name AS hazard,
       u.full_name AS saved_by, vp.created_at AS saved_at,
       ib.filename AS source_file, vp.panel_note,
       (SELECT count(*) FROM profile_indicator pi WHERE pi.profile_id = vp.id) AS n_variables
FROM vulnerability_profile vp
JOIN sector s            ON s.id  = vp.sector_id
JOIN hazard_type h       ON h.id  = vp.hazard_type_id
LEFT JOIN subsector ss   ON ss.id = vp.subsector_id
LEFT JOIN province p     ON p.id  = vp.province_id
LEFT JOIN app_user u     ON u.id  = vp.created_by
LEFT JOIN import_batch ib ON ib.id = vp.import_batch_id;

COMMIT;

-- ============================================================================
-- API contract for B2 (implementation note, not DDL)
--
--   POST /imports                     -> upload workbook, validate structure
--        returns { batch_id, profile_scope, rows_matched,
--                  weights_read:[{code,domain,weight_pct,relationship}],
--                  variables_without_weight:[code] }
--        Values are staged; weights are not applied yet.
--
--   PUT  /profiles/{scope}/weights    -> save_profile_weights(); takes effect
--        immediately, then recompute vulnerability for the returned version.
--        Used both at import and from the standalone "Profile weights" screen.
--
--   GET  /profiles/{scope}/weights            -> current active set
--   GET  /profiles/{scope}/weights/history    -> v_profile_weight_history
--
-- Roles: data officer, expert and admin may all save weights. Expert-panel
-- sign-off happens offline; record it in panel_note rather than as a status.
-- ============================================================================


-- ============================================================================
-- ADDENDUM rev 3 (2026-07-26) — year-range semantics
--
-- DECISIONS (Milinda, 2026-07-26)
--   1. BOUNDARY YEAR: periods 2020-2025 and 2025-2030 share 2025.
--      Rule = LATEST PERIOD WINS. A query for a year present in two periods
--      resolves to the later period, so no year is ever counted twice.
--   2. RANGE VALUE MEANING: a value covering a period is a TYPICAL YEAR,
--      not a multi-year total. Chosen because it is the only reading valid for
--      both stocks (population, extent, %) and flows (production, events) —
--      summing a stock over six years would inflate it sixfold.
--      Per-variable exceptions are carried in indicator_catalog.period_aggregation;
--      proposed values are in design/ingestion/period_aggregation.csv and await
--      expert review via PERIOD_RULES_REVIEW.xlsx.
-- ============================================================================

BEGIN;

CREATE TYPE period_aggregation_type AS ENUM (
    'average',        -- typical value for one year in the period (DEFAULT)
    'total',          -- genuine sum across the period
    'max',            -- already a maximum over a fixed historical window
    'end_of_period',  -- the level at the period's end
    'fixed_window'    -- variable defines its own year window; identical in every period
);

ALTER TABLE indicator_catalog
    ADD COLUMN period_aggregation period_aggregation_type NOT NULL DEFAULT 'average';

COMMENT ON COLUMN indicator_catalog.period_aggregation IS
    'How a value spanning year_start..year_end is interpreted. Drives B3. '
    'Default average = a typical year, NOT a multi-year total.';

-- Resolve a query year to a single period value, applying "latest period wins".
-- A year sitting in two periods returns only the later one.
CREATE OR REPLACE FUNCTION iv_for_year(
    p_indicator_id BIGINT, p_ds_division_id BIGINT, p_year INTEGER,
    p_source source_type DEFAULT 'data'
) RETURNS SETOF indicator_value
LANGUAGE sql STABLE AS $$
    SELECT *
      FROM indicator_value v
     WHERE v.indicator_id   = p_indicator_id
       AND v.ds_division_id = p_ds_division_id
       AND v.source         = p_source
       AND p_year BETWEEN COALESCE(v.year_start, p_year) AND COALESCE(v.year_end, p_year)
     ORDER BY v.year_start DESC NULLS LAST     -- latest period wins
     LIMIT 1;
$$;

COMMIT;


-- ============================================================================
-- ADDENDUM rev 4 (2026-07-26) — allow profile membership without a weight
--
-- WHY: schema.sql made profile_indicator.weight_pct NOT NULL. That predates the
-- decision that weights are entered in the app after import. Seeding the 243
-- profiles is impossible under it: 1,783 of 3,664 memberships are variables the
-- expert refresh added, which legitimately have no weight yet.
--
-- Found by trying to load the seed for real (B1) - the DDL parsed fine for
-- weeks and only failed when data hit it.
--
-- NULL now means "this variable belongs to the profile, weight not yet set" -
-- exactly the state the UI renders as "new - needs weight". The CHECK still
-- applies whenever a weight IS present, and the engine refuses to compute a
-- vulnerability index while any weight in the profile is NULL.
-- ============================================================================

BEGIN;

ALTER TABLE profile_indicator ALTER COLUMN weight_pct DROP NOT NULL;

COMMENT ON COLUMN profile_indicator.weight_pct IS
    'NULL = variable belongs to the profile but has no weight yet (set in the app). '
    'B3 must refuse to compute while any weight in the profile is NULL.';

-- Which profiles are not yet computable, for the admin screen.
CREATE OR REPLACE VIEW v_profile_readiness AS
SELECT vp.id AS profile_id, vp.code, vp.is_active,
       count(*)                                        AS n_variables,
       count(*) FILTER (WHERE pi.weight_pct IS NULL)    AS n_missing_weights,
       ROUND(SUM(pi.weight_pct) FILTER (WHERE pi.domain = 'hazard'), 3)   AS hazard_total,
       ROUND(SUM(pi.weight_pct) FILTER (WHERE pi.domain = 'exposure'), 3) AS exposure_total,
       (count(*) FILTER (WHERE pi.weight_pct IS NULL) = 0
        AND ROUND(SUM(pi.weight_pct) FILTER (WHERE pi.domain = 'hazard'), 3)   = 100
        AND ROUND(SUM(pi.weight_pct) FILTER (WHERE pi.domain = 'exposure'), 3) = 100) AS is_computable
FROM vulnerability_profile vp
JOIN profile_indicator pi ON pi.profile_id = vp.id
GROUP BY vp.id, vp.code, vp.is_active;

COMMIT;
