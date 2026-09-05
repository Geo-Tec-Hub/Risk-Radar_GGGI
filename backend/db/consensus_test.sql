-- ============================================================================
-- Risk Radar — negative tests for schema_consensus_addendum.sql (Stage 1.12)
--
-- Not "does the SQL parse" but "does each constraint actually fail, for the
-- stated reason" (BUILD_BRIEF_2026-08-09.md T1). Each test RAISES EXCEPTION
-- if the attempt that should fail instead succeeds, so the file fails loudly
-- rather than printing something wrong and exiting 0 — same convention as
-- smoke_test.sql.
--
-- The whole file runs inside one transaction that is ROLLED BACK at the end,
-- deliberately: several tests mutate real seeded rows (243 profiles, 3,664
-- memberships) to provoke a failure, and none of that may be left behind.
--
--   psql -v ON_ERROR_STOP=1 -U postgres -d riskradar -f backend/db/consensus_test.sql
-- ============================================================================
\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    v_pi_id       BIGINT;
    v_profile_id  BIGINT;
    v_code        TEXT;
    v_scope       RECORD;
    v_new_id      BIGINT;
    v_user_id     BIGINT;
    v_ds_id       BIGINT;
    v_before      RECORD;
    v_after       RECORD;
    v_mismatches  BIGINT;
BEGIN

RAISE NOTICE '--- rule 4: weight_pct = 0 is still rejected (pre-existing CHECK, re-verified) ---';

SELECT id INTO v_pi_id FROM profile_indicator WHERE weight_pct IS NOT NULL LIMIT 1;
BEGIN
    UPDATE profile_indicator SET weight_pct = 0 WHERE id = v_pi_id;
    RAISE EXCEPTION 'weight_pct = 0 was accepted — profile_indicator_weight_pct_check is not enforcing > 0';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%profile_indicator_weight_pct_check%' THEN
        RAISE NOTICE 'ok   weight_pct = 0 rejected (profile_indicator_weight_pct_check)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- rule 4/6: rejected must carry no weight (profile_indicator_inactive_unweighted) ---';

SELECT id INTO v_pi_id FROM profile_indicator WHERE weight_pct IS NOT NULL LIMIT 1;
BEGIN
    UPDATE profile_indicator SET consensus = 'rejected' WHERE id = v_pi_id;
    RAISE EXCEPTION 'consensus=rejected was accepted on a row that still carries a weight';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%profile_indicator_inactive_unweighted%' THEN
        RAISE NOTICE 'ok   rejected + non-null weight_pct rejected (profile_indicator_inactive_unweighted)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- consensus=contested with no note (profile_indicator_contested_explained) ---';

SELECT id INTO v_pi_id FROM profile_indicator LIMIT 1;
BEGIN
    UPDATE profile_indicator SET consensus = 'contested', consensus_note = NULL WHERE id = v_pi_id;
    RAISE EXCEPTION 'consensus=contested was accepted with no consensus_note';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%profile_indicator_contested_explained%' THEN
        RAISE NOTICE 'ok   contested with no note rejected (profile_indicator_contested_explained)';
    ELSE RAISE; END IF;
END;

BEGIN
    UPDATE profile_indicator SET consensus = 'contested', consensus_note = '   ' WHERE id = v_pi_id;
    RAISE EXCEPTION 'consensus=contested was accepted with a blank (whitespace-only) note';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%profile_indicator_contested_explained%' THEN
        RAISE NOTICE 'ok   contested with a blank note also rejected (btrim, not just IS NOT NULL)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- two published+active versions of one scope (vulnerability_profile_one_published_ix) ---';

SELECT province_id, sector_id, subsector_id, hazard_type_id, name
  INTO v_scope
  FROM vulnerability_profile
 WHERE publication = 'published' AND is_active
 LIMIT 1;

BEGIN
    INSERT INTO vulnerability_profile
        (code, name, province_id, sector_id, subsector_id, hazard_type_id,
         version, is_active, publication)
    VALUES
        ('TEST-DUP-PUBLISHED', v_scope.name, v_scope.province_id, v_scope.sector_id,
         v_scope.subsector_id, v_scope.hazard_type_id, 9001, true, 'published');
    RAISE EXCEPTION 'a second published+active version of the same scope was accepted';
EXCEPTION WHEN unique_violation THEN
    IF SQLERRM LIKE '%vulnerability_profile_one_published_ix%' THEN
        RAISE NOTICE 'ok   second published+active version of one scope rejected';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- draft/sandbox with no owner (vulnerability_profile_owner_required) ---';

BEGIN
    INSERT INTO vulnerability_profile
        (code, name, province_id, sector_id, subsector_id, hazard_type_id,
         version, is_active, publication, owner_user_id)
    VALUES
        ('TEST-DRAFT-NO-OWNER', v_scope.name, v_scope.province_id, v_scope.sector_id,
         v_scope.subsector_id, v_scope.hazard_type_id, 9002, true, 'draft', NULL);
    RAISE EXCEPTION 'a draft profile with owner_user_id IS NULL was accepted';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%vulnerability_profile_owner_required%' THEN
        RAISE NOTICE 'ok   draft with no owner rejected (vulnerability_profile_owner_required)';
    ELSE RAISE; END IF;
END;

BEGIN
    INSERT INTO vulnerability_profile
        (code, name, province_id, sector_id, subsector_id, hazard_type_id,
         version, is_active, publication, owner_user_id)
    VALUES
        ('TEST-SANDBOX-NO-OWNER', v_scope.name, v_scope.province_id, v_scope.sector_id,
         v_scope.subsector_id, v_scope.hazard_type_id, 9003, true, 'sandbox', NULL);
    RAISE EXCEPTION 'a sandbox profile with owner_user_id IS NULL was accepted';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%vulnerability_profile_owner_required%' THEN
        RAISE NOTICE 'ok   sandbox with no owner also rejected — same rule, both non-published states';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- insert a result against a sandbox profile (trigger vulnerability_result_no_sandbox) ---';

-- app_user is empty (auth addendum, T1b, is out of scope for T1) — a throwaway
-- row is enough to satisfy owner_user_id's FK; rolled back with everything else.
INSERT INTO app_user (email, password_hash, full_name)
VALUES ('test-t1@example.invalid', 'x', 'T1 test fixture')
RETURNING id INTO v_user_id;

INSERT INTO vulnerability_profile
    (code, name, province_id, sector_id, subsector_id, hazard_type_id,
     version, is_active, publication, owner_user_id)
VALUES
    ('TEST-SANDBOX-RESULT', v_scope.name, v_scope.province_id, v_scope.sector_id,
     v_scope.subsector_id, v_scope.hazard_type_id, 9004, true, 'sandbox', v_user_id)
RETURNING id INTO v_new_id;

SELECT id INTO v_ds_id FROM ds_division LIMIT 1;

BEGIN
    INSERT INTO vulnerability_result
        (ds_division_id, profile_id, hazard_type_id, sector_id, subsector_id,
         source, exposure_index, hazard_index, vulnerability_index)
    VALUES
        (v_ds_id, v_new_id, v_scope.hazard_type_id, v_scope.sector_id, v_scope.subsector_id,
         'data', 0.5, 0.5, 0.25);
    RAISE EXCEPTION 'a vulnerability_result was written against a sandbox profile';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%sandbox%' THEN
        RAISE NOTICE 'ok   result against a sandbox profile rejected (vulnerability_result_no_sandbox)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- two results differing only by index_scope must SUCCEED ---';

SELECT province_id, sector_id, subsector_id, hazard_type_id, id AS profile_id
  INTO v_scope
  FROM vulnerability_profile
 WHERE publication = 'published' AND is_active
 LIMIT 1;

INSERT INTO vulnerability_result
    (ds_division_id, profile_id, hazard_type_id, sector_id, subsector_id,
     source, year_start, year_end, exposure_index, hazard_index, vulnerability_index, index_scope)
VALUES
    (v_ds_id, v_scope.profile_id, v_scope.hazard_type_id, v_scope.sector_id, v_scope.subsector_id,
     'data', 2020, 2025, 0.5, 0.5, 0.25, 'provincial');

INSERT INTO vulnerability_result
    (ds_division_id, profile_id, hazard_type_id, sector_id, subsector_id,
     source, year_start, year_end, exposure_index, hazard_index, vulnerability_index, index_scope)
VALUES
    (v_ds_id, v_scope.profile_id, v_scope.hazard_type_id, v_scope.sector_id, v_scope.subsector_id,
     'data', 2020, 2025, 0.5, 0.5, 0.30, 'national');

RAISE NOTICE 'ok   two rows differing only by index_scope both inserted — the unique key has room for both';

-- the old key (without index_scope) would have collided; confirm it actually
-- would have, so this test is not vacuously true
BEGIN
    INSERT INTO vulnerability_result
        (ds_division_id, profile_id, hazard_type_id, sector_id, subsector_id,
         source, year_start, year_end, exposure_index, hazard_index, vulnerability_index, index_scope)
    VALUES
        (v_ds_id, v_scope.profile_id, v_scope.hazard_type_id, v_scope.sector_id, v_scope.subsector_id,
         'data', 2020, 2025, 0.5, 0.5, 0.99, 'provincial');
    RAISE EXCEPTION 'a true duplicate (same index_scope too) was accepted — vulnerability_result_uniq is not enforcing';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'ok   a true duplicate (same index_scope) is still rejected — the key still does its job';
END;

RAISE NOTICE '--- rejecting a variable makes its profile MORE computable, never less ---';

-- POTABLE_WATER_DROUGHT_SOU_V1: exactly one missing weight, and it is the
-- composite hazard index (C5 — the one row exclusion is allowed on). Both
-- domain totals are already 100 among the agreed rows, so excluding it
-- should flip is_computable straight to true. Picked by code, not LIMIT 1 on
-- an unordered join — many of the 115 "components weighted, composite blank"
-- profiles would otherwise match and most of them have *other* blanks too.
SELECT id INTO v_profile_id
  FROM vulnerability_profile
 WHERE code = 'POTABLE_WATER_DROUGHT_SOU_V1';

IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'test fixture profile POTABLE_WATER_DROUGHT_SOU_V1 not found — has the seed changed?';
END IF;

SELECT n_missing_weights, is_computable INTO v_before
  FROM v_profile_readiness WHERE profile_id = v_profile_id;

IF v_before.n_missing_weights <> 1 OR v_before.is_computable <> false THEN
    RAISE EXCEPTION 'test fixture assumption broken: expected exactly 1 missing weight and is_computable=false, got missing=% computable=%',
        v_before.n_missing_weights, v_before.is_computable;
END IF;

UPDATE profile_indicator pi SET consensus = 'rejected'
  FROM indicator_catalog ic
 WHERE pi.indicator_id = ic.id
   AND pi.profile_id = v_profile_id
   AND ic.code = 'DROUGHT_HAZARD_INDEX';

SELECT n_missing_weights, is_computable INTO v_after
  FROM v_profile_readiness WHERE profile_id = v_profile_id;

IF v_after.n_missing_weights >= v_before.n_missing_weights THEN
    RAISE EXCEPTION 'rejecting a variable did not reduce n_missing_weights (before % after %)',
        v_before.n_missing_weights, v_after.n_missing_weights;
END IF;
IF v_before.is_computable AND NOT v_after.is_computable THEN
    RAISE EXCEPTION 'rejecting a variable made a computable profile UNcomputable — readiness went backwards';
END IF;
IF NOT v_after.is_computable THEN
    RAISE EXCEPTION 'expected rejecting the sole missing (composite) weight to flip is_computable to true, still false';
END IF;
RAISE NOTICE 'ok   rejecting the blank composite index: missing weights % -> %, is_computable false -> true',
    v_before.n_missing_weights, v_after.n_missing_weights;

RAISE NOTICE '--- the addendum changed no published domain total (no-op on existing data) ---';

-- Re-derive what the OLD (rev 4, pre-addendum) view would have summed: it had
-- no consensus filter, so it is SUM(weight_pct) over every row in the domain.
-- Every untouched row still defaults to consensus='agreed', so the two must
-- match for every profile this test has not deliberately mutated above.
SELECT count(*) INTO v_mismatches
  FROM (
      SELECT pi.profile_id,
             ROUND(SUM(pi.weight_pct) FILTER (WHERE pi.domain = 'hazard'), 3)   AS old_hazard,
             ROUND(SUM(pi.weight_pct) FILTER (WHERE pi.domain = 'exposure'), 3) AS old_exposure
        FROM profile_indicator pi
       WHERE pi.profile_id NOT IN (v_profile_id)  -- excludes the one profile this test rejected a variable in
       GROUP BY pi.profile_id
  ) old_calc
  JOIN v_profile_readiness r ON r.profile_id = old_calc.profile_id
 WHERE r.hazard_total   IS DISTINCT FROM old_calc.old_hazard
    OR r.exposure_total IS DISTINCT FROM old_calc.old_exposure;

IF v_mismatches <> 0 THEN
    RAISE EXCEPTION '% profiles have a domain total that changed under the new view, expected 0 (no-op)', v_mismatches;
END IF;
RAISE NOTICE 'ok   all 242 untouched profiles (243 minus the one just rejected above) have identical domain totals under the new view';

RAISE NOTICE 'ALL CONSENSUS-ADDENDUM NEGATIVE TESTS PASSED';

END $$;

ROLLBACK;

SELECT 'consensus_test.sql: rolled back — no test row or mutation was kept' AS note;
