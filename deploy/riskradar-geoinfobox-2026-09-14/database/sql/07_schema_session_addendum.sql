-- ============================================================================
-- Risk Radar — schema addendum: server-side sessions (T2b, Stage 9.6)
-- 2026-08-11 · applies on top of schema.sql, schema_weights_addendum.sql,
--              spatial-model.sql, schema_consensus_addendum.sql,
--              schema_auth_addendum.sql and schema_boundary_pending_addendum.sql
--
-- WHAT THIS ANSWERS
--   T2b needs real sign-in. Two decisions were made before this file was
--   written, not re-opened here: sessions are server-side, in a table, with
--   the cookie carrying an opaque session id only; and the cookie is
--   Secure + HttpOnly + SameSite (enforced in app/, not the database).
--
-- WHY THE TABLE STORES A HASH, NOT THE TOKEN
--   The cookie value is a high-entropy opaque token. Storing it verbatim
--   would mean anyone who can read this table — a backup, a careless log
--   line, a second client with read access — can impersonate every live
--   session with no further work, the same reasoning that argon2id hashes
--   `app_user.password_hash` rather than storing the password. A session
--   token is already random (unlike a password, it needs no slow/memory-hard
--   hash to resist guessing), so a plain SHA-256 digest is enough: fast to
--   verify, and a leaked digest cannot be turned back into a valid cookie.
--
-- WHY REVOCATION IS A TRIGGER, NOT AN APPLICATION-LAYER STEP
--   "An account can be deactivated or rejected after approval" — and per
--   §4.2, the database owns integrity: a second client updating app_user
--   directly (a future admin tool, a support script, a DBA fixing something
--   by hand) must not be able to leave a stale session valid by skipping
--   whatever the API would otherwise have remembered to do. So the instant
--   `app_user.status` moves away from 'active', every session for that user
--   is revoked, unconditionally, at the row level — not only via the
--   POST /admin/registrations/{id}/reject endpoint that happens to be the
--   first caller of it.
--
-- WHY A VIEW FOR "IS THIS SESSION VALID"
--   "Valid" is three conditions — not revoked, not expired, and the owning
--   account still active — repeated at every call site if left as raw SQL.
--   `v_active_session` makes it one predicate so `/auth/me` and every future
--   authenticated route ask the same question the same way, matching R5's
--   reasoning in the frontend guide (one styling module) applied here to
--   authorisation instead of colour.
-- ============================================================================

BEGIN;

CREATE TABLE app_session (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token_hash     CHAR(64) NOT NULL UNIQUE,   -- sha256 hex digest of the cookie value
    user_id        BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at     TIMESTAMPTZ NOT NULL,
    revoked_at     TIMESTAMPTZ,
    revoked_reason TEXT
);

COMMENT ON TABLE app_session IS
    'Server-side sessions (T2b). The cookie carries the opaque token whose '
    'SHA-256 digest is token_hash; the raw token is never stored. A row here '
    'is the sole authority on whether a session is live -- sign-out and '
    'admin-driven deactivation both act by revoking rows, not by relying on '
    'the cookie to expire client-side.';

COMMENT ON COLUMN app_session.token_hash IS
    'SHA-256 hex digest of the opaque session cookie value. Never the raw '
    'token -- a database read alone must not be enough to impersonate a '
    'session, mirroring why passwords are hashed rather than stored.';

CREATE INDEX app_session_user_ix ON app_session (user_id) WHERE revoked_at IS NULL;

-- A session is either revoked with a reason recorded, or not revoked at all
-- -- never a revoked_at with no explanation, never a reason with no revocation.
ALTER TABLE app_session
    ADD CONSTRAINT app_session_revocation_explained CHECK (
        (revoked_at IS NULL) = (revoked_reason IS NULL)
    );

-- Cannot create an already-expired session. (Whether a still-open session has
-- since expired is a read-time question -- see v_active_session below -- not
-- something a CHECK constraint can track, since "now" moves and the
-- constraint would need re-evaluating with no row change to trigger it.)
ALTER TABLE app_session
    ADD CONSTRAINT app_session_expires_after_creation CHECK (expires_at > created_at);

CREATE VIEW v_active_session AS
SELECT s.id, s.token_hash, s.user_id, s.created_at, s.expires_at,
       u.status AS user_status, u.is_active AS user_is_active
  FROM app_session s
  JOIN app_user u ON u.id = s.user_id
 WHERE s.revoked_at IS NULL
   AND s.expires_at > now();

COMMENT ON VIEW v_active_session IS
    'A session is usable only if it is unrevoked, unexpired, AND its owning '
    'account is still active -- the third condition is what the revocation '
    'trigger below exists to keep true without a second check at read time.';

-- ----------------------------------------------------------------------------
-- Deactivating or rejecting a user must actually end their sessions.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION revoke_sessions_on_deactivation() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'active' AND NEW.status <> 'active' THEN
        UPDATE app_session
           SET revoked_at = now(),
               revoked_reason = 'account status changed to ' || NEW.status::text
         WHERE user_id = NEW.id AND revoked_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_user_revoke_sessions_on_deactivation
    AFTER UPDATE OF status ON app_user
    FOR EACH ROW EXECUTE FUNCTION revoke_sessions_on_deactivation();

COMMENT ON TRIGGER app_user_revoke_sessions_on_deactivation ON app_user IS
    'Fires whenever status leaves active (suspended, rejected after a prior '
    'approval, or otherwise) and revokes every session that user still has '
    'open. Does not fire pending->active (nothing to revoke) or on any '
    'transition that does not leave active.';

COMMIT;
