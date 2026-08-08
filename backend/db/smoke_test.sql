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

SELECT count(*) INTO n FROM vulnerability_profile;
IF n <> 243 THEN RAISE EXCEPTION 'profiles: expected 243, got %', n; END IF;
RAISE NOTICE 'ok   243 vulnerability profiles';

SELECT count(*) INTO n FROM profile_indicator;
IF n <> 3664 THEN RAISE EXCEPTION 'membership: expected 3664 rows, got %', n; END IF;
SELECT count(*) INTO m FROM profile_indicator WHERE weight_pct IS NULL;
RAISE NOTICE 'ok   3664 memberships (% awaiting a weight)', m;

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
DECLARE n BIGINT; gap DOUBLE PRECISION; ov BIGINT;
BEGIN
SELECT count(*) INTO n FROM ds_division;
IF n = 0 THEN
  RAISE NOTICE 'SKIP geometry tests - run db/load_spatial.sh first';
  RETURN;
END IF;

RAISE NOTICE '--- DS-division geometry ---';
IF n <> 330 THEN RAISE EXCEPTION 'ds_division: expected 330, got %', n; END IF;
RAISE NOTICE 'ok   330 DS divisions loaded';

SELECT count(*) INTO n FROM ds_division WHERE NOT ST_IsValid(geom);
IF n > 0 THEN RAISE EXCEPTION '% DS divisions have invalid geometry', n; END IF;
RAISE NOTICE 'ok   all geometries valid';

SELECT count(*) INTO ov
  FROM ds_division a JOIN ds_division b
    ON a.id < b.id AND ST_Intersects(a.geom, b.geom)
 WHERE ST_Area(ST_Intersection(a.geom, b.geom)) > 1e-7;
IF ov > 0 THEN RAISE EXCEPTION '% overlapping DS-division pairs', ov; END IF;
RAISE NOTICE 'ok   no overlapping divisions';

SELECT count(*) INTO n FROM ds_division WHERE area_km2 IS NULL OR area_km2 <= 0;
IF n > 0 THEN RAISE EXCEPTION '% divisions have no area', n; END IF;
-- Sri Lanka is ~65,600 km2; allow generous slack for coastline generalisation
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
