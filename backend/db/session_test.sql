-- ============================================================================
-- Risk Radar — negative tests for schema_session_addendum.sql (Stage 9.6)
--
-- BUILD_BRIEF_2026-08-09.md T2b: "Sessions are SERVER-SIDE, in a new table.
-- The cookie carries an opaque session id only ... Sign-out and administrator
-- revocation must actually invalidate the session, because an account can be
-- deactivated or rejected after approval." These tests assert that promise
-- at the database layer, independent of whatever the FastAPI routers do —
-- a second client updating app_user directly must get the same outcome.
--
-- Same convention as auth_test.sql: every test RAISES EXCEPTION if an
-- attempt that should fail instead succeeds, and the whole file runs inside
-- one transaction that is ROLLED BACK at the end.
--
--   psql -v ON_ERROR_STOP=1 -U postgres -d riskradar -f backend/db/session_test.sql
-- ============================================================================
\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    v_user_id      BIGINT;
    v_session_id   BIGINT;
    v_session_id_2 BIGINT;
    v_admin_role   SMALLINT;
    v_count        INT;
    v_revoked_at   TIMESTAMPTZ;
    v_revoked_why  TEXT;
BEGIN

SELECT id INTO v_admin_role FROM role WHERE code = 'admin';

-- A pre-approved, active fixture user, so later status transitions have
-- something valid to move away FROM (app_user_approval_recorded requires
-- approved_by/approved_at to be set together with status=active -- id is
-- not known until after INSERT, so approve in a second statement that sets
-- all three of status/approved_at/approved_by together, as auth_test.sql does).
INSERT INTO app_user (email, password_hash, full_name)
VALUES ('t2b-session-fixture@example.invalid', 'x', 'T2b session fixture')
RETURNING id INTO v_user_id;
UPDATE app_user SET status = 'active', approved_at = now(), approved_by = v_user_id
 WHERE id = v_user_id;

RAISE NOTICE '--- revoked_at without revoked_reason (app_session_revocation_explained) ---';

BEGIN
    INSERT INTO app_session (token_hash, user_id, expires_at, revoked_at)
    VALUES (encode(sha256('t2b-tok-1'::bytea), 'hex'), v_user_id, now() + interval '1 day', now());
    RAISE EXCEPTION 'a session with revoked_at set but no revoked_reason was accepted';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%app_session_revocation_explained%' THEN
        RAISE NOTICE 'ok   revoked_at with no reason rejected (app_session_revocation_explained)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- revoked_reason without revoked_at (app_session_revocation_explained) ---';

BEGIN
    INSERT INTO app_session (token_hash, user_id, expires_at, revoked_reason)
    VALUES (encode(sha256('t2b-tok-2'::bytea), 'hex'), v_user_id, now() + interval '1 day', 'signed out');
    RAISE EXCEPTION 'a session with revoked_reason set but no revoked_at was accepted';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%app_session_revocation_explained%' THEN
        RAISE NOTICE 'ok   revoked_reason with no revoked_at rejected (app_session_revocation_explained)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- expires_at <= created_at (app_session_expires_after_creation) ---';

BEGIN
    INSERT INTO app_session (token_hash, user_id, created_at, expires_at)
    VALUES (encode(sha256('t2b-tok-3'::bytea), 'hex'), v_user_id, now(), now() - interval '1 hour');
    RAISE EXCEPTION 'a session expiring before it was created was accepted';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM LIKE '%app_session_expires_after_creation%' THEN
        RAISE NOTICE 'ok   expires_at <= created_at rejected (app_session_expires_after_creation)';
    ELSE RAISE; END IF;
END;

RAISE NOTICE '--- duplicate token_hash (app_session_token_hash_key, UNIQUE) ---';

INSERT INTO app_session (token_hash, user_id, expires_at)
VALUES (encode(sha256('t2b-tok-dup'::bytea), 'hex'), v_user_id, now() + interval '1 day')
RETURNING id INTO v_session_id;

BEGIN
    INSERT INTO app_session (token_hash, user_id, expires_at)
    VALUES (encode(sha256('t2b-tok-dup'::bytea), 'hex'), v_user_id, now() + interval '1 day');
    RAISE EXCEPTION 'a duplicate token_hash was accepted -- two sessions would validate the same cookie';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'ok   duplicate token_hash rejected (unique constraint)';
END;

RAISE NOTICE '--- must also pass: a well-formed session inserts cleanly and appears in v_active_session ---';

INSERT INTO app_session (token_hash, user_id, expires_at)
VALUES (encode(sha256('t2b-tok-good'::bytea), 'hex'), v_user_id, now() + interval '1 day')
RETURNING id INTO v_session_id_2;

IF NOT EXISTS (SELECT 1 FROM v_active_session WHERE id = v_session_id_2) THEN
    RAISE EXCEPTION 'a fresh, unrevoked, unexpired session for an active user did not appear in v_active_session';
END IF;
RAISE NOTICE 'ok   a well-formed session is visible in v_active_session';

RAISE NOTICE '--- v_active_session excludes an expired session even if never revoked ---';

IF EXISTS (
    SELECT 1 FROM v_active_session WHERE token_hash = encode(sha256('t2b-tok-3'::bytea), 'hex')
) THEN
    RAISE EXCEPTION 'an already-expired session appeared in v_active_session';
END IF;
-- (the expires_at<=created_at insert above never committed a row, so check
--  expiry exclusion properly with a row that legitimately exists but has aged out)
INSERT INTO app_session (token_hash, user_id, created_at, expires_at)
VALUES (encode(sha256('t2b-tok-aged'::bytea), 'hex'), v_user_id,
        now() - interval '2 days', now() - interval '1 day');
IF EXISTS (
    SELECT 1 FROM v_active_session WHERE token_hash = encode(sha256('t2b-tok-aged'::bytea), 'hex')
) THEN
    RAISE EXCEPTION 'a session whose expires_at is in the past still appeared in v_active_session';
END IF;
RAISE NOTICE 'ok   an expired-but-unrevoked session is excluded from v_active_session';

RAISE NOTICE '--- T2b: admin/deactivation must actually invalidate the session (not just the API layer) ---';

-- Move the fixture user away from active directly at the row level, exactly
-- as a future admin tool or a DBA fix would -- not via any FastAPI endpoint,
-- since the requirement is that the DATABASE enforces this, not one caller of it.
UPDATE app_user SET status = 'suspended' WHERE id = v_user_id;

SELECT revoked_at, revoked_reason INTO v_revoked_at, v_revoked_why
  FROM app_session WHERE id = v_session_id_2;

IF v_revoked_at IS NULL OR v_revoked_why IS NULL THEN
    RAISE EXCEPTION 'a session for a user moved to status=suspended was NOT revoked by the trigger';
END IF;
IF v_revoked_why NOT LIKE '%suspended%' THEN
    RAISE EXCEPTION 'session was revoked but the reason does not mention the new status (got: %)', v_revoked_why;
END IF;
RAISE NOTICE 'ok   moving the account to suspended revoked its open session, reason recorded (%)', v_revoked_why;

IF EXISTS (SELECT 1 FROM v_active_session WHERE id = v_session_id_2) THEN
    RAISE EXCEPTION 'a session revoked by the deactivation trigger still appears in v_active_session';
END IF;
RAISE NOTICE 'ok   the revoked session no longer appears in v_active_session';

RAISE NOTICE '--- must also pass: the trigger does not fire on transitions that do not LEAVE active ---';

-- A second fixture, still pending, never having been active -- moving
-- pending -> active must NOT touch any session (none exist yet, and OLD.status
-- is not 'active', so the trigger's WHEN-equivalent guard must not act).
INSERT INTO app_user (email, password_hash, full_name)
VALUES ('t2b-session-fixture-2@example.invalid', 'x', 'T2b session fixture 2')
RETURNING id INTO v_user_id;

INSERT INTO app_session (token_hash, user_id, expires_at)
VALUES (encode(sha256('t2b-tok-pending-user'::bytea), 'hex'), v_user_id, now() + interval '1 day');

UPDATE app_user SET status = 'active', approved_at = now(), approved_by = v_user_id
 WHERE id = v_user_id;

SELECT count(*) INTO v_count
  FROM app_session WHERE user_id = v_user_id AND revoked_at IS NOT NULL;

IF v_count <> 0 THEN
    RAISE EXCEPTION 'pending -> active revoked % session(s) that had nothing to do with a deactivation', v_count;
END IF;
RAISE NOTICE 'ok   pending -> active did not revoke the session that predates approval';

RAISE NOTICE 'ALL SESSION-ADDENDUM NEGATIVE TESTS PASSED';

END $$;

ROLLBACK;

SELECT 'session_test.sql: rolled back — no test row, session or grant was kept' AS note;
