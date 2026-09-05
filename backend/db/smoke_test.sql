-- ============================================================================
-- Risk Radar — smoke tests
--
-- Not "does the SQL parse" (we already know that) but "does the design behave
-- the way the documents claim". Each test RAISES EXCEPTION on failure, so the
-- whole file fails loudly rather than printing something wrong and exiting 0.
--
--   docker compose exec -T db psql -v ON_ERROR_STOP=1 -U riskradar -d riskradar \
--     -f /db/smoke_test.sql
-- ============================================================================
\set ON_ERROR_STOP on

DO $$
DECLARE n BIGINT; m BIGINT; ok BOOLEAN;
BEGIN
RAISE NOTICE '--- reference data ---';

SELECT count(*) INTO n FROM province;
IF n <> 9 THEN RAISE EXCEPTION 'provinces: expected 9, got %', n; END IF;
RAISE NOTICE 'ok   9 provinces';

SELECT count(*) INTO n FROM hazard_type;
IF n <> 3 THEN RAISE EXCEPTION 'hazard types: expected 3, got %', n; END IF;
RAISE NOTICE 'ok   3 hazard types';

SELECT count(*) INTO n FROM indicator_catalog WHERE status = 'active';
IF n <> 174 THEN RAISE EXCEPTION 'catalog: expected 174 active variables, got %', n; END IF;
RAISE NOTICE 'ok   174 canonical variables';

-- ACTIVE profiles, not rows. save_profile_weights() writes a NEW version on
-- every save and retires the previous one, so vulnerability_profile grows for
-- the life of the system: the first time anyone edits weights the row count
-- becomes 244, then 245. 243 is the number of SCOPES (province x sector x
-- subsector x hazard), and exactly one version of each is active at a time.
-- Counting rows here would have failed on the first real weights save, and the
-- message would have accused the seed of being wrong.
SELECT count(*) INTO n FROM vulnerability_profile WHERE is_active;
IF n <> 243 THEN RAISE EXCEPTION 'profiles: expected 243 active, got %', n; END IF;
SELECT count(*) INTO m FROM vulnerability_profile;
IF m > n THEN
  RAISE NOTICE 'ok   243 active vulnerability profiles (% rows incl. % retired version(s))', m, m - n;
ELSE
  RAISE NOTICE 'ok   243 active vulnerability profiles';
END IF;

-- Same trap, one step subtler. Memberships belong to a profile VERSION, so this
-- counts the ones on the 243 active profiles. But 3,664 is a fact about the
-- SEED, not an invariant: FR-1.4b lets an expert add a variable to a profile,
-- which legitimately changes the total. Asserting it forever would turn a
-- permitted edit into a build failure.
--
-- So it is asserted only while the seed is pristine -- every active profile
-- still at version 1 -- and reported once real editing has begun.
SELECT count(*) INTO n
  FROM profile_indicator pi JOIN vulnerability_profile vp ON vp.id = pi.profile_id
 WHERE vp.is_active;
SELECT count(*) INTO m
  FROM profile_indicator pi JOIN vulnerability_profile vp ON vp.id = pi.profile_id
 WHERE vp.is_active AND pi.weight_pct IS NULL;

IF NOT EXISTS (SELECT 1 FROM vulnerability_profile WHERE is_active AND version > 1) THEN
    IF n <> 3664 THEN
        RAISE EXCEPTION 'membership: a pristine seed must have 3664 rows on active profiles, got %', n;
    END IF;
    RAISE NOTICE 'ok   3664 memberships (% awaiting a weight)', m;
ELSE
    RAISE NOTICE 'ok   % memberships on active profiles (% awaiting a weight); not asserted against the seed''s 3664 because weights have been edited', n, m;
END IF;

RAISE NOTICE '--- period rules (A3) ---';

SELECT count(*) INTO n FROM indicator_catalog WHERE period_aggregation = 'fixed_window';
IF n <> 11 THEN RAISE EXCEPTION 'fixed_window: expected 11, got %', n; END IF;
SELECT count(*) INTO m FROM indicator_catalog WHERE period_aggregation = 'max';
IF m <> 3 THEN RAISE EXCEPTION 'max: expected 3, got %', m; END IF;
RAISE NOTICE 'ok   11 fixed_window + 3 max + % average', 174 - n - m;

RAISE NOTICE '--- weights must total 100 per domain ---';

BEGIN
  PERFORM save_profile_weights(
      (SELECT id FROM province WHERE code = 'CEN'),
      (SELECT id FROM sector   WHERE code = 'AGRICULTURE'),
      (SELECT id FROM subsector WHERE code = 'PADDY'),
      (SELECT id FROM hazard_type WHERE code = 'flood'),
      '[{"code":"FLOOD_HAZARD_INDEX","domain":"hazard","weight_pct":50}]'::jsonb,
      1);
  RAISE EXCEPTION 'save_profile_weights accepted weights totalling 50%% - the guard is not working';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%must total 100%' THEN
    RAISE NOTICE 'ok   rejected a weight set totalling 50%%';
  ELSE
    RAISE;
  END IF;
END;

RAISE NOTICE '--- an exclusion survives a save (the defect of 2026-08-15) ---';

-- save_profile_weights() used to list only weight and relationship in its
-- INSERT, so every save reset consensus to its column default 'agreed'. An
-- expert's "this variable is not significant" was accepted, acknowledged, and
-- silently thrown away -- and because nothing was ever marked rejected, the
-- CHECK that constrains rejected rows never fired. A domain could reach 100 by
-- counting a variable that had been excluded, store it as agreed with its
-- weight intact, and report itself computable. Nothing in the data showed it.
--
-- That is invisible to inspection, so it gets a test rather than a comment.
-- The whole exclusion rule of SRS section 2.4 -- and the 97-of-243 profiles it
-- unblocks -- rests on this column surviving a round trip.
DECLARE
  v_uid   BIGINT;
  v_pid   BIGINT;
  v_cons  TEXT;
  v_w     NUMERIC;
  v_att   BOOLEAN;
BEGIN
  SELECT id INTO v_uid FROM app_user ORDER BY id LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE NOTICE 'SKIP exclusion test - no app_user exists yet';
  ELSE
    -- An inner block with an EXCEPTION handler is a subtransaction: raising at
    -- the end rolls back the test profile, so this leaves no trace. The
    -- variables keep their values, because session memory is not transactional.
    BEGIN
      v_pid := save_profile_weights(
        (SELECT id FROM province WHERE code = 'CEN')::smallint,
        (SELECT id FROM sector WHERE code = 'AGRICULTURE'),
        (SELECT id FROM subsector WHERE code = 'PADDY'),
        (SELECT id FROM hazard_type WHERE code = 'drought'),
        jsonb_build_array(
          jsonb_build_object('code','DROUGHT_EVENTS_1974_TO_2022','domain','hazard','weight_pct',50),
          jsonb_build_object('code','OCCURRENCE_WARM_DAYS','domain','hazard','weight_pct',10),
          jsonb_build_object('code','STANDARD_PRECIPITATION_INDEX','domain','hazard','weight_pct',40),
          jsonb_build_object('code','DROUGHT_HAZARD_INDEX','domain','hazard','consensus','rejected'),
          jsonb_build_object('code','ASWEDDUMIZED_PADDY_EXTENT','domain','exposure','weight_pct',45),
          jsonb_build_object('code','MAXIMUM_DROUGHT_AFFECTED_PEOPLE_DURING_1974_TO_2022','domain','exposure','weight_pct',10),
          jsonb_build_object('code','PADDY_FARMERS','domain','exposure','weight_pct',10),
          jsonb_build_object('code','PCT_PADDY_FARMERS_AGRICULTURAL_OPERATORS','domain','exposure','weight_pct',5),
          jsonb_build_object('code','PCT_PADDY_LAND_TOTAL_LAND_AREA','domain','exposure','weight_pct',15),
          jsonb_build_object('code','PCT_RAIN_FED_PADDY_LANDS','domain','exposure','weight_pct',15)),
        v_uid, NULL, NULL);

      SELECT pi.consensus::text, pi.weight_pct, pi.decided_by IS NOT NULL
        INTO v_cons, v_w, v_att
        FROM profile_indicator pi
        JOIN indicator_catalog ic ON ic.id = pi.indicator_id
       WHERE pi.profile_id = v_pid AND ic.code = 'DROUGHT_HAZARD_INDEX';

      RAISE EXCEPTION 'rollback_the_test_profile';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM <> 'rollback_the_test_profile' THEN RAISE; END IF;
    END;

    IF v_cons IS DISTINCT FROM 'rejected' THEN
      RAISE EXCEPTION 'an exclusion did not survive the save: consensus came back as %, not rejected. save_profile_weights() is dropping consensus again', COALESCE(v_cons,'(row missing)');
    END IF;
    IF v_w IS NOT NULL THEN
      RAISE EXCEPTION 'an excluded variable kept a weight of % percent -- it must carry none', v_w;
    END IF;
    IF NOT v_att THEN
      RAISE EXCEPTION 'an exclusion was stored without an author; it cannot be told from an oversight';
    END IF;
    RAISE NOTICE 'ok   an exclusion survives a save, unweighted and attributed';
  END IF;
END;

RAISE NOTICE '--- computed values cannot exist without a job (D8 lineage) ---';

BEGIN
  INSERT INTO indicator_value
      (indicator_id, ds_division_id, source, raw_value, derivation)
  VALUES ((SELECT id FROM indicator_catalog LIMIT 1),
          (SELECT id FROM ds_division LIMIT 1), 'data', 1.0, 'computed');
  RAISE EXCEPTION 'a computed value was accepted with no computation_job_id';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE 'ok   rejected derivation=computed with no job';
END;

RAISE NOTICE '--- geometry type is enforced per layer ---';

BEGIN
  INSERT INTO spatial_feature (layer_id, feature_code, geom, attributes)
  VALUES ((SELECT id FROM spatial_layer WHERE code = 'ROAD'), 'BAD-1',
          ST_GeomFromText('POLYGON((0 0,1 0,1 1,0 1,0 0))', 4326),
          '{"class": "A"}'::jsonb);  -- valid attributes, so only the geometry check is exercised
  RAISE EXCEPTION 'a polygon was accepted into a LINESTRING layer';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%expects%geometry%' THEN
    RAISE NOTICE 'ok   rejected a polygon on the ROAD layer';
  ELSE RAISE; END IF;
END;

RAISE NOTICE '--- required layer attributes are enforced ---';

BEGIN
  INSERT INTO spatial_feature (layer_id, feature_code, geom, attributes)
  VALUES ((SELECT id FROM spatial_layer WHERE code = 'LULC'), 'BAD-2',
          ST_GeomFromText('POLYGON((0 0,1 0,1 1,0 1,0 0))', 4326),
          '{"year": 2024}'::jsonb);          -- missing required "class"
  RAISE EXCEPTION 'a LULC feature was accepted without its required "class" attribute';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%requires attribute%' THEN
    RAISE NOTICE 'ok   rejected a LULC feature missing "class"';
  ELSE RAISE; END IF;
END;

RAISE NOTICE 'ALL SMOKE TESTS PASSED';
END $$;

-- ---------------------------------------------------------------------------
-- Tests that need DS-division geometry; skipped cleanly if it is not loaded.
-- ---------------------------------------------------------------------------
DO $$
DECLARE n BIGINT; gap DOUBLE PRECISION; ov BIGINT; known_overlap_km2 DOUBLE PRECISION;
        registered BIGINT; surveyed BIGINT; pending BIGINT;
BEGIN
SELECT count(*) INTO n FROM ds_division;
IF n = 0 THEN
  RAISE NOTICE 'SKIP geometry tests - run db/load_spatial.sh first';
  RETURN;
END IF;

RAISE NOTICE '--- DS-division geometry ---';
-- ---------------------------------------------------------------------------
-- These assertions deliberately DO NOT hardcode a division count.
--
-- The count moved three times in three weeks: 330 (shapefile as supplied) ->
-- 331 (Kalmunai split, O-2, 10 Aug 2026) -> 340 (Survey Department's 2025
-- revision, loaded 14 Aug 2026, O-12 closed). Every literal written here has had
-- to be chased through prose, seeds, assets and tests, and a missed one is a
-- silent defect rather than a loud one. It has settled at 340 -- that is not a
-- reason to write 340 here.
--
-- So: assert the INVARIANTS, which do not change when the register grows, and
-- report the counts as notices. The register itself (dsd_register.csv, loaded
-- by load_spatial) is the only authority for how many divisions exist; a test
-- that disagrees with the register is testing the test.
-- ---------------------------------------------------------------------------
SELECT count(*) INTO registered FROM ds_division;
SELECT count(*) INTO surveyed  FROM ds_division WHERE boundary_status = 'surveyed';
SELECT count(*) INTO pending   FROM ds_division WHERE boundary_status = 'boundary_pending';

IF registered = 0 THEN
  RAISE EXCEPTION 'ds_division is empty - the register did not load';
END IF;

-- Every division is in exactly one of the two states. This is what actually
-- protects the coverage rules: a third state, or a NULL, means some division is
-- invisible to §2.2 completeness and to the map legend alike.
IF surveyed + pending <> registered THEN
  RAISE EXCEPTION 'boundary_status: % surveyed + % pending <> % registered - an unaccounted state exists',
    surveyed, pending, registered;
END IF;

-- A surveyed division must have geometry and a boundary-pending one must not.
-- If these ever cross, the toolbox returns 0 where it should return NULL, which
-- is the failure mode the whole boundary-pending design exists to prevent.
SELECT count(*) INTO n FROM ds_division WHERE boundary_status = 'surveyed' AND geom IS NULL;
IF n <> 0 THEN RAISE EXCEPTION '% divisions are marked surveyed but have no geometry', n; END IF;
SELECT count(*) INTO n FROM ds_division WHERE boundary_status = 'boundary_pending' AND geom IS NOT NULL;
IF n <> 0 THEN RAISE EXCEPTION '% divisions are marked boundary_pending but carry geometry', n; END IF;

-- Every registered division resolves to a province and a district, boundary or
-- no boundary. A division with no province can never be counted toward its
-- province's completeness, so it would block publication invisibly.
-- district_name, not district_id: ds_division holds the district as text
-- (district_code / district_name), because the register is the authority for
-- the ADM2 rollup and there is no district table to key against.
SELECT count(*) INTO n FROM ds_division WHERE province_id IS NULL OR district_name IS NULL;
IF n <> 0 THEN RAISE EXCEPTION '% divisions have no province or no district', n; END IF;

RAISE NOTICE 'ok   % DS divisions registered (% surveyed, % boundary-pending)',
  registered, surveyed, pending;
IF pending > 0 THEN
  RAISE NOTICE 'note % division(s) are boundary-pending: they count toward completeness, hold values, and return NULL from every geometric operation',
    pending;
END IF;

n := registered;

-- ST_IsValid(NULL) is NULL, so "WHERE NOT ST_IsValid(geom)" already excludes
-- boundary-pending rows without needing a boundary_status filter here.
SELECT count(*) INTO n FROM ds_division WHERE NOT ST_IsValid(geom);
IF n > 0 THEN RAISE EXCEPTION '% DS divisions have invalid geometry', n; END IF;
RAISE NOTICE 'ok   all surveyed geometries valid';

-- Same reasoning: ST_Intersects(NULL, x) is NULL, never TRUE, so a
-- boundary-pending division can never appear in an overlap pair.
--
-- TWO KNOWN OVERLAPS ARE PINNED BY NAME, NOT TOLERATED BY THRESHOLD.
--
-- DS_Boundary.shp (Survey Dept, 2025-10-09) contains two inter-district
-- boundaries digitised inconsistently by the agencies either side:
--
--     Palugaswewa (AN17, Anuradhapura) <-> Higurakgoda (PO3, Polonnaruwa)
--         2.110 km2, 474 fragments along a 24.2 km line
--     Elahera     (PO2, Polonnaruwa)   <-> Naula       (MA6, Matale)
--         0.759 km2, 228 fragments along a 13.7 km line
--
-- Both are long thin ribbons averaging under 100 m wide, not disputed blocks of
-- land -- the two sides simply traced the same district boundary differently.
-- The other 47 touching pairs are all under 20 m2 and fall below the threshold
-- below, which is what it is for.
--
-- They are excluded BY CODE rather than by raising the threshold, deliberately.
-- A threshold loose enough to admit 2.11 km2 would also admit a genuine new
-- overlap of 2 km2 anywhere in the country, silently. Naming them means any
-- THIRD overlap still fails, and the ceiling check below fails if either of
-- these two grows -- so a future boundary revision that makes things worse is
-- caught rather than absorbed.
--
-- The underlying defect is the Survey Department's to fix; it is recorded in
-- SRS section 5.1. Its only practical effect is that area-based apportionment
-- in the D8 toolbox double-counts ~2.9 km2 of the 66,034 km2 national area
-- (0.004%). Vulnerability scores are keyed by division, not by area, and are
-- unaffected.
SELECT count(*) INTO ov
  FROM ds_division a JOIN ds_division b
    ON a.id < b.id AND ST_Intersects(a.geom, b.geom)
 WHERE ST_Area(ST_Intersection(a.geom, b.geom)) > 1e-7
   AND (LEAST(a.code, b.code), GREATEST(a.code, b.code))
       NOT IN (('AN17', 'PO3'), ('MA6', 'PO2'));
IF ov > 0 THEN
  RAISE EXCEPTION '% overlapping DS-division pairs beyond the two known digitising mismatches', ov;
END IF;

-- And the two known ones must not grow.
SELECT coalesce(max(ST_Area(ST_Transform(ST_Intersection(a.geom, b.geom), 5235)) / 1e6), 0)
  INTO known_overlap_km2
  FROM ds_division a JOIN ds_division b
    ON a.id < b.id AND ST_Intersects(a.geom, b.geom)
 WHERE (LEAST(a.code, b.code), GREATEST(a.code, b.code))
       IN (('AN17', 'PO3'), ('MA6', 'PO2'));
IF known_overlap_km2 > 2.2 THEN
  RAISE EXCEPTION 'a known boundary mismatch has grown to % km2 (was 2.110) - re-examine the shapefile',
    round(known_overlap_km2::numeric, 3);
END IF;
RAISE NOTICE 'ok   no overlapping divisions beyond 2 known boundary mismatches (largest % km2)',
  round(known_overlap_km2::numeric, 3);

-- A boundary-pending division MUST have NULL area (rule 4-equivalent for
-- geometry: absent is not zero) -- checked among only the surveyed ones, or
-- this would fire on exactly the 2 rows that are correctly NULL.
SELECT count(*) INTO n FROM ds_division WHERE boundary_status = 'surveyed' AND (area_km2 IS NULL OR area_km2 <= 0);
IF n > 0 THEN RAISE EXCEPTION '% surveyed divisions have no area', n; END IF;
SELECT count(*) INTO n FROM ds_division WHERE boundary_status = 'boundary_pending' AND area_km2 IS NOT NULL;
IF n > 0 THEN RAISE EXCEPTION '% boundary-pending divisions have a non-null area_km2 -- absence rendered as a number', n; END IF;
RAISE NOTICE 'ok   every surveyed division has a positive area; every boundary-pending one has none';

-- Sri Lanka is ~65,600 km2; allow generous slack for coastline generalisation.
-- SUM ignores the 2 boundary-pending NULLs on its own -- no special-casing
-- needed for the total to stay meaningful.
SELECT sum(area_km2) INTO gap FROM ds_division;
IF gap < 55000 OR gap > 75000 THEN
  RAISE EXCEPTION 'total area % km2 is implausible - is area_km2 computed in degrees?', round(gap::numeric,1);
END IF;
RAISE NOTICE 'ok   total area % km2 (plausible, so EPSG:5235 was used)', round(gap::numeric, 1);

RAISE NOTICE 'ALL GEOMETRY TESTS PASSED';
END $$;

-- ---------------------------------------------------------------------------
-- Readiness: which profiles can actually be computed today?
-- ---------------------------------------------------------------------------
SELECT is_computable, count(*) AS profiles, sum(n_missing_weights) AS weights_missing
  FROM v_profile_readiness
 GROUP BY is_computable
 ORDER BY is_computable;
