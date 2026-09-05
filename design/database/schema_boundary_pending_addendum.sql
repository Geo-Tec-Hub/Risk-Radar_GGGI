-- ============================================================================
-- Risk Radar — schema addendum: boundary-pending DS divisions (the Kalmunai split)
-- 2026-08-09/10 · applies on top of schema.sql, schema_weights_addendum.sql,
--                 spatial-model.sql, schema_consensus_addendum.sql and
--                 schema_auth_addendum.sql
--
-- THE QUESTION THIS ANSWERS (O-2, answered 10 August 2026)
--   The source register quoted 331 DS divisions; the official shapefile and
--   dsd_register.csv both held 330. The gap was in Ampara district, Eastern
--   province: EAS-008 "Kalmunai" is held as one row where the official count
--   splits it into Kalmunai Muslim and Kalmunai Tamil.
--
-- WHY THIS IS SCHEMA WORK, NOT A DATA EDIT
--   ds_division.geom is `geometry(MultiPolygon, 4326) NOT NULL`. A division
--   cannot currently exist in this database without a boundary — and the two
--   new divisions do not have one yet; Milinda supplies it later. Adding a
--   register row for either without relaxing that constraint is not possible,
--   and inventing a placeholder boundary (e.g. splitting the old Kalmunai
--   polygon in half by a straight line) would be worse than not having one —
--   it would look surveyed and would not be.
--
-- WHY A GENERATED COLUMN, NOT "CHECK geom IS NULL" AT EVERY CALL SITE
--   `boundary_status` is `GENERATED ALWAYS ... STORED`, computed once from
--   `geom IS NULL`, so every reader — SQL, the ERD, a future API serialiser —
--   can select or filter on a named state instead of repeating the NULL
--   check and risking the exact defect this project has already found once
--   in `FrontEnd/` (absent rendered identically to present, because nothing
--   asked the question at the boundary where it mattered).
--
-- WHAT THIS DELIBERATELY DOES NOT FIX
--   `sl_apportion()` (spatial-model.sql) LEFT JOINs spatial_feature to
--   ds_division and ST_Intersects against d.geom; for a boundary-pending
--   division that predicate is NULL, the join yields no rows, and
--   COALESCE(..., 0) turns that into a *0*, not NULL — the same class of
--   defect this addendum exists to prevent, one layer up. Left alone
--   deliberately: sl_apportion() is Stage 6 (spatial toolbox) work, not
--   started, and fixing a function nothing yet calls risks silent drift from
--   whatever Stage 6 actually needs. Flagged here so it is not rediscovered
--   as a surprise: Stage 6 must special-case boundary_pending divisions
--   before sl_apportion() is exposed through the toolbox API.
--
-- WHAT NEEDED NO CHANGE
--   sl_area_km2(geometry) and sl_length_km(geometry) (spatial-model.sql) are
--   plain SQL wrapping ST_Transform/ST_Area/ST_Length, all of which are
--   PostGIS-strict — NULL in, NULL out, with no COALESCE downgrading it to
--   zero. Verified, not assumed; see the negative test.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. A division may exist with no boundary yet.
-- ----------------------------------------------------------------------------
ALTER TABLE ds_division ALTER COLUMN geom DROP NOT NULL;

CREATE TYPE ds_boundary_status AS ENUM ('surveyed', 'boundary_pending');

ALTER TABLE ds_division ADD COLUMN boundary_status ds_boundary_status
    GENERATED ALWAYS AS (
        CASE WHEN geom IS NULL THEN 'boundary_pending'::ds_boundary_status
             ELSE 'surveyed'::ds_boundary_status END
    ) STORED;

COMMENT ON COLUMN ds_division.boundary_status IS
    'Derived, never written directly. boundary_pending means the division is '
    'registered (it counts toward the official 331) but has no polygon yet -- '
    'read this column, not "geom IS NULL", so absence stays visible instead '
    'of becoming an implicit convention every caller has to remember.';

COMMENT ON COLUMN ds_division.geom IS
    'Nullable since the Kalmunai split (O-2, 10 Aug 2026): a division can be '
    'registered before its boundary is surveyed. NULL means boundary_pending, '
    'never "not yet loaded" or any other undocumented meaning -- if a second '
    'reason to be NULL ever appears, it needs its own state, not an overload '
    'of this one.';

-- ----------------------------------------------------------------------------
-- 2. A boundary-pending division cannot publish a score.
--
--    Mirrors vulnerability_result_no_sandbox (schema_consensus_addendum.sql):
--    enforced by trigger, because the rule reads a sibling table
--    (ds_division) that a CHECK on vulnerability_result cannot see.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reject_boundary_pending_result() RETURNS TRIGGER AS $$
DECLARE
    v_status ds_boundary_status;
    v_code   TEXT;
BEGIN
    SELECT boundary_status, code INTO v_status, v_code
      FROM ds_division WHERE id = NEW.ds_division_id;

    IF v_status = 'boundary_pending' THEN
        RAISE EXCEPTION
            'vulnerability_result may not be written for a boundary-pending '
            'division (ds_division_id=%, code=%). It has no geometry yet -- '
            'not merely no score -- so nothing about it can be mapped, '
            'exported or published until a boundary is supplied.', NEW.ds_division_id, v_code
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vulnerability_result_no_boundary_pending
    BEFORE INSERT OR UPDATE ON vulnerability_result
    FOR EACH ROW EXECUTE FUNCTION reject_boundary_pending_result();

COMMIT;
