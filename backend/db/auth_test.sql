-- ============================================================================
-- Risk Radar — negative tests for schema_auth_addendum.sql (Stage 1.13)
--
-- BUILD_BRIEF_2026-08-09.md T1b, written from SRS_v2.3.md §3.2 and §3.5, not
-- from the trigger's own code: "A data officer or expert is bound to one
-- province. They may read national data and must not write outside their
-- province. Scope is enforced server-side on every write, never only in the
-- interface" (§3.2), and "the administrator ... sets the province, without
-- which the role cannot be granted at all" (§3.5) — which is symmetric with
-- an administrator being *national* in the roles table (§3), so the same
-- rule has to run in both directions: no province is missing where one is
-- required, and none is present where one would be a contradiction.
--
-- This rule has been in the specification since v1 and was never
-- enforceable before this addendum — there is no prior behaviour to compare
-- against. These tests assert what the spec requires, not what the trigger
-- happens to do.
--
-- Same convention as consensus_test.sql: every test RAISES EXCEPTION if an
-- attempt that should fail instead succeeds, and the whole file runs inside
-- one transaction that is ROLLED BACK at the end, since several tests must
-- mutate real rows (throwaway app_user / user_role grants) to provoke a
-- failure or prove a success, and none of that may be left behind.
--
--   psql -v ON_ERROR_STOP=1 -U postgres -d riskradar -f backend/db/auth_test.sql
-- ============================================================================
\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    v_admin_role    SMALLINT;
    v_officer_role  SMALLINT;
    v_expert_role   SMALLINT;
    v_province_id   SMALLINT;
    v_user_no_prov  BIGINT;
    v_user_with_prov BIGINT;
    v_status        account_status;
    v_active        BOOLEAN;
BEGIN

SELECT id INTO v_admin_role   FROM role WHERE code = 'admin';
SELECT id INTO v_officer_role FROM role WHERE code = 'data_officer';
SELECT id INTO v_expert_role  FROM role WHERE code = 'expert';
SELECT id INTO v_province_id  FROM province LIMIT 1;

RAISE NOTICE '--- a new registration defaults to pending, not able to write (SRS §3.5) ---';

INSERT INTO app_user (email, password_hash, full_name)
VALUES ('t1b-fixture-1@example.invalid', 'x', 'T1b fixture 1')
RETURNING status, is_active INTO v_status, v_active;

IF v_status <> 'pending' OR v_active <> false THEN
    RAISE EXCEPTION 'a new registration was not pending/inactive by default (got status=%, is_active=%)',
        v_status, v_active;
END IF;
RAISE NOTICE 'ok   a fresh registration is pending and cannot write (is_active=false)';

RAISE NOTICE '--- status=active with no approval recorded (app_user_approval_recorded) ---';

BEGIN
    UPDATE app_user SET status = 'active'
     WHERE email = 't1b-fixture-1@example.invalid';
    RAISE EXCEPTION 'status=active was accepted with no approved_by/approved_at';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%app_user_approval_recorded%' THEN
        RAISE NOTICE 'ok   active with no approval recorded rejected (app_user_approval_recorded)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- status=rejected with no reason (app_user_rejection_explained) ---';

BEGIN
    UPDATE app_user SET status = 'rejected', rejected_reason = NULL
     WHERE email = 't1b-fixture-1@example.invalid';
    RAISE EXCEPTION 'status=rejected was accepted with no rejected_reason — the applicant is entitled to one (SRS §3.5)';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%app_user_rejection_explained%' THEN
        RAISE NOTICE 'ok   rejected with no reason rejected (app_user_rejection_explained)';
    ELSE RAISE; END IF;
END;

BEGIN
    UPDATE app_user SET status = 'rejected', rejected_reason = '   '
     WHERE email = 't1b-fixture-1@example.invalid';
    RAISE EXCEPTION 'status=rejected was accepted with a blank (whitespace-only) reason';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%app_user_rejection_explained%' THEN
        RAISE NOTICE 'ok   rejected with a blank reason also rejected (btrim, not just IS NOT NULL)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- setting status=active (properly, with approval) flips is_active via trigger ---';

-- app_user_approval_recorded requires approved_by AND approved_at together
-- with status=active in the SAME row version -- set all three in one
-- statement, not two, or the intermediate state trips the CHECK itself.
UPDATE app_user
   SET status = 'active', approved_at = now(),
       approved_by = id  -- self-approval is fine for the FK; only the constraint is under test here
 WHERE email = 't1b-fixture-1@example.invalid';

SELECT status, is_active INTO v_status, v_active
  FROM app_user WHERE email = 't1b-fixture-1@example.invalid';

IF v_status <> 'active' OR v_active <> true THEN
    RAISE EXCEPTION 'approving a user did not flip is_active to true (status=%, is_active=%)', v_status, v_active;
END IF;
RAISE NOTICE 'ok   status=active (with approval recorded) flips is_active true via app_user_is_active_sync';

RAISE NOTICE '--- SRS §3.2: a data officer or expert is bound to one province — enforced on the GRANT, not just described ---';

INSERT INTO app_user (email, password_hash, full_name, province_id)
VALUES ('t1b-fixture-no-province@example.invalid', 'x', 'T1b fixture, no province', NULL)
RETURNING id INTO v_user_no_prov;

BEGIN
    INSERT INTO user_role (user_id, role_id) VALUES (v_user_no_prov, v_officer_role);
    RAISE EXCEPTION 'data_officer was granted to a user with no province — SRS §3.2 requires one';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%requires a province%' THEN
        RAISE NOTICE 'ok   granting data_officer with no province rejected (user_role_province_scope)';
    ELSE RAISE; END IF;
END;

BEGIN
    INSERT INTO user_role (user_id, role_id) VALUES (v_user_no_prov, v_expert_role);
    RAISE EXCEPTION 'expert was granted to a user with no province — SRS §3.2 requires one, same as data_officer';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%requires a province%' THEN
        RAISE NOTICE 'ok   granting expert with no province also rejected (same trigger, same rule)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- SRS §3 roles table: an administrator is national — must NOT be bound to a province ---';

INSERT INTO app_user (email, password_hash, full_name, province_id)
VALUES ('t1b-fixture-with-province@example.invalid', 'x', 'T1b fixture, has a province', v_province_id)
RETURNING id INTO v_user_with_prov;

BEGIN
    INSERT INTO user_role (user_id, role_id) VALUES (v_user_with_prov, v_admin_role);
    RAISE EXCEPTION 'admin was granted to a user who HAS a province — administrators are national (SRS §3)';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%national in scope%' THEN
        RAISE NOTICE 'ok   granting admin to a user with a province rejected (user_role_province_scope)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- the same trigger must not over-block: the compliant grants below must SUCCEED ---';

-- data_officer / expert WITH a province: this is the normal, intended case.
-- If the trigger rejected this too, the negative tests above would be
-- vacuously true (a trigger that rejects everything "passes" all of them).
INSERT INTO user_role (user_id, role_id) VALUES (v_user_with_prov, v_officer_role);
RAISE NOTICE 'ok   data_officer granted to a user WITH a province succeeded';

DELETE FROM user_role WHERE user_id = v_user_with_prov AND role_id = v_officer_role;
INSERT INTO user_role (user_id, role_id) VALUES (v_user_with_prov, v_expert_role);
RAISE NOTICE 'ok   expert granted to a user WITH a province succeeded';

-- admin WITHOUT a province: also the normal, intended case.
INSERT INTO user_role (user_id, role_id) VALUES (v_user_no_prov, v_admin_role);
RAISE NOTICE 'ok   admin granted to a user with NO province succeeded';

RAISE NOTICE '--- role seed matches the specification (SRS §3): data_officer exists, analyst does not ---';

IF NOT EXISTS (SELECT 1 FROM role WHERE code = 'data_officer') THEN
    RAISE EXCEPTION 'role.code data_officer not found — the analyst rename did not apply';
END IF;
IF EXISTS (SELECT 1 FROM role WHERE code = 'analyst') THEN
    RAISE EXCEPTION 'role.code analyst still exists — the SRS role model has never defined an Analyst';
END IF;
RAISE NOTICE 'ok   role table has data_officer and no analyst';

RAISE NOTICE 'ALL AUTH-ADDENDUM NEGATIVE TESTS PASSED';

END $$;

ROLLBACK;

SELECT 'auth_test.sql: rolled back — no test row or grant was kept' AS note;
