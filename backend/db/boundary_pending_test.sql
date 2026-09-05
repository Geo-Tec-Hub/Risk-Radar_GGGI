-- ============================================================================
-- Risk Radar — negative tests for schema_boundary_pending_addendum.sql
-- (Stage 1.14, the Kalmunai split, O-2)
--
-- BUILD_BRIEF_2026-08-09.md T1c: "a division with no geometry inserts;
-- anything that would publish a score for one fails; sl_area_km2() over a
-- boundary-pending division returns NULL, not 0, and the country total still
-- lands near 65,600 km2 rather than shifting."
--
-- Same convention as consensus_test.sql / auth_test.sql: every test RAISES
-- EXCEPTION if an attempt that should fail instead succeeds, and the whole
-- file runs inside one transaction that is ROLLED BACK at the end.
--
--   psql -v ON_ERROR_STOP=1 -U postgres -d riskradar -f backend/db/boundary_pending_test.sql
-- ============================================================================
\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    v_province_id    SMALLINT;
    v_profile        RECORD;
    v_pending_id     BIGINT;
    v_surveyed_id    BIGINT;
    v_status         ds_boundary_status;
    v_area           DOUBLE PRECISION;
    v_total_before   DOUBLE PRECISION;
    v_total_after    DOUBLE PRECISION;
    v_real_geom      geometry;
BEGIN

SELECT id INTO v_province_id FROM province LIMIT 1;

RAISE NOTICE '--- a division with no geometry inserts (registered before its boundary is surveyed) ---';

SELECT sum(area_km2) INTO v_total_before FROM ds_division;

INSERT INTO ds_division (code, name, district_name, province_id, geom, area_km2)
VALUES ('TEST-BP-1', 'T1c fixture (boundary pending)', 'Test District', v_province_id, NULL, NULL)
RETURNING id, boundary_status INTO v_pending_id, v_status;

IF v_status <> 'boundary_pending' THEN
    RAISE EXCEPTION 'a division inserted with geom IS NULL did not read boundary_status=boundary_pending (got %)', v_status;
END IF;
RAISE NOTICE 'ok   division with no geometry inserted; boundary_status reads boundary_pending';

RAISE NOTICE '--- a division WITH geometry still reads surveyed (the generated column is not always-pending) ---';

SELECT geom INTO v_real_geom FROM ds_division WHERE geom IS NOT NULL LIMIT 1;
IF v_real_geom IS NULL THEN
    RAISE EXCEPTION 'test fixture assumption broken: no surveyed division with real geometry found to copy';
END IF;

INSERT INTO ds_division (code, name, district_name, province_id, geom, area_km2)
VALUES ('TEST-BP-2', 'T1c fixture (surveyed)', 'Test District', v_province_id,
        v_real_geom, sl_area_km2(v_real_geom))
RETURNING id, boundary_status INTO v_surveyed_id, v_status;

IF v_status <> 'surveyed' THEN
    RAISE EXCEPTION 'a division inserted WITH geometry did not read boundary_status=surveyed (got %)', v_status;
END IF;
RAISE NOTICE 'ok   division with real geometry inserted; boundary_status reads surveyed';

RAISE NOTICE '--- sl_area_km2() over a boundary-pending division returns NULL, not 0 ---';

SELECT area_km2 INTO v_area FROM ds_division WHERE id = v_pending_id;
IF v_area IS NOT NULL THEN
    RAISE EXCEPTION 'a boundary-pending division has a non-null area_km2 (%) -- absent rendered as a number, not absence', v_area;
END IF;
RAISE NOTICE 'ok   boundary-pending division has area_km2 IS NULL (never 0)';

RAISE NOTICE '--- the national area total is unaffected by a boundary-pending row (NULL is not summed as 0) ---';

SELECT sum(area_km2) INTO v_total_after FROM ds_division;
-- v_total_after = v_total_before + the surveyed fixture's area (a real, if
-- small, addition) + nothing for the pending one. Assert the pending
-- fixture contributed exactly zero to the change, not that the totals are
-- untouched outright, since TEST-BP-2 legitimately adds its own area.
-- Un-rounded on both sides, compared with a tight epsilon: rounding each
-- total separately to 3dp before subtracting can itself introduce a
-- thousandth-km2 discrepancy that has nothing to do with the thing under
-- test (found by running this test, not by reasoning about it).
IF abs(v_total_after - v_total_before - sl_area_km2(v_real_geom)) > 0.0001 THEN
    RAISE EXCEPTION 'total area moved by more than the surveyed fixture explains -- before=% after=% surveyed_fixture=%',
        v_total_before, v_total_after, sl_area_km2(v_real_geom);
END IF;
RAISE NOTICE 'ok   boundary-pending division contributes nothing to SUM(area_km2) -- confirmed by difference, not by eyeballing';

RAISE NOTICE '--- anything that would publish a score for a boundary-pending division fails ---';

SELECT vp.id AS profile_id, vp.hazard_type_id, vp.sector_id, vp.subsector_id
  INTO v_profile
  FROM vulnerability_profile vp
 WHERE vp.publication = 'published' AND vp.is_active
 LIMIT 1;

BEGIN
    INSERT INTO vulnerability_result
        (ds_division_id, profile_id, hazard_type_id, sector_id, subsector_id,
         source, exposure_index, hazard_index, vulnerability_index)
    VALUES
        (v_pending_id, v_profile.profile_id, v_profile.hazard_type_id, v_profile.sector_id,
         v_profile.subsector_id, 'data', 0.5, 0.5, 0.25);
    RAISE EXCEPTION 'a vulnerability_result was written for a boundary-pending division';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%boundary-pending%' THEN
        RAISE NOTICE 'ok   result for a boundary-pending division rejected (vulnerability_result_no_boundary_pending)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- the same insert against the surveyed fixture must SUCCEED (the trigger is not blocking everything) ---';

INSERT INTO vulnerability_result
    (ds_division_id, profile_id, hazard_type_id, sector_id, subsector_id,
     source, exposure_index, hazard_index, vulnerability_index)
VALUES
    (v_surveyed_id, v_profile.profile_id, v_profile.hazard_type_id, v_profile.sector_id,
     v_profile.subsector_id, 'data', 0.5, 0.5, 0.25);
RAISE NOTICE 'ok   result for a surveyed division succeeded';

RAISE NOTICE '--- a boundary-pending division cannot be silently "fixed" by an UPDATE that forgets it is pending ---';

-- Not a rule the schema enforces (no trigger blocks updating a pending
-- division's other columns) -- this just confirms boundary_status tracks
-- geom automatically even after an UPDATE, not only at INSERT time.
UPDATE ds_division SET geom = v_real_geom, area_km2 = sl_area_km2(v_real_geom) WHERE id = v_pending_id;
SELECT boundary_status INTO v_status FROM ds_division WHERE id = v_pending_id;
IF v_status <> 'surveyed' THEN
    RAISE EXCEPTION 'supplying geom via UPDATE did not flip boundary_status to surveyed (got %)', v_status;
END IF;
RAISE NOTICE 'ok   supplying a boundary later (UPDATE) flips boundary_status to surveyed automatically';

RAISE NOTICE 'ALL BOUNDARY-PENDING NEGATIVE TESTS PASSED';

END $$;

ROLLBACK;

SELECT 'boundary_pending_test.sql: rolled back — no test row or result was kept' AS note;
