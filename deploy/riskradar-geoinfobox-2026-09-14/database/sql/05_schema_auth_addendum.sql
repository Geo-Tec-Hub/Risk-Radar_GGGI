-- ============================================================================
-- Risk Radar — schema addendum: registration, approval and provincial scope
-- 2026-08-09 · applies on top of schema.sql, schema_weights_addendum.sql,
--              spatial-model.sql and schema_consensus_addendum.sql
--
-- WHAT THIS ANSWERS (Milinda, 9 August 2026)
--   "when the user clicks the link there must be a landing page and login based
--    on the user type, and if you want to register for data entry as data entry
--    authorised agency, expert, or public user, then only data can be entered."
--
--   Decisions taken with it:
--     * The landing page does NOT gate the map. Public read without login stays
--       (§3.1) — authentication controls contribution, not viewing.
--     * "Data entry authorised agency" is a ROLE HELD BY A PERSON, not an
--       organisation entity. No organisation table; `app_user.organization`
--       stays free text.
--     * All three types SELF-REGISTER and an administrator approves before the
--       account can write anything (FR-12.2, already specified).
--
-- TWO DEFECTS THIS ALSO FIXES, both found on 9 August 2026
--   1. schema.sql seeds a role called `analyst`. The SRS role model has never
--      had an Analyst — it has a **Data officer**. The seeded code was wrong,
--      not the specification, and nothing references it yet.
--   2. **Provincial scope had no schema support at all.** §3.2 requires that a
--      data officer or expert be bound to one province and that the bound be
--      enforced server-side on every write — but `app_user` carries no province
--      and `user_role` is only (user_id, role_id). The rule was specified,
--      described in the roles table, and impossible to enforce. Fixed below.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Role names — align the seed with the specification.
--
--    Renamed rather than added, so no user can hold a role that the SRS does
--    not define. Safe today because no user_role rows exist yet; if any did,
--    the rename preserves them, since it changes the row rather than the id.
-- ----------------------------------------------------------------------------
UPDATE role
   SET code        = 'data_officer',
       name        = 'Data Entry Agency',
       description = 'Imports workbooks, enters values, sets weights and runs '
                     'toolbox jobs for one assigned province. Registers as '
                     '"data entry authorised agency". A person, not an '
                     'organisation — the employing body is recorded as free '
                     'text on app_user.organization.'
 WHERE code = 'analyst';

UPDATE role SET description =
    'Everything a data officer may do, plus expert-track values, declaring a '
    'profile''s accepted variable set, and the exploratory workspace (SRS §3.2).'
 WHERE code = 'expert';

UPDATE role SET description =
    'Registers as "public user". May submit a 1-5 severity rating, one per '
    'division/sector/hazard/period. Cannot enter indicator values.'
 WHERE code = 'community';

-- ----------------------------------------------------------------------------
-- 2. Registration and approval.
--
--    schema.sql defaults `is_active` to TRUE, which is exactly wrong for
--    self-registration: an account would be able to write the moment it was
--    created. Status replaces it as the authority; is_active is kept in step by
--    a trigger so nothing already reading it breaks.
-- ----------------------------------------------------------------------------
CREATE TYPE account_status AS ENUM ('pending', 'active', 'rejected', 'suspended');

ALTER TABLE app_user
    ADD COLUMN status            account_status NOT NULL DEFAULT 'pending',
    ADD COLUMN requested_role_id SMALLINT REFERENCES role(id) ON DELETE RESTRICT,
    ADD COLUMN province_id       SMALLINT REFERENCES province(id) ON DELETE RESTRICT,
    ADD COLUMN approved_by       BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    ADD COLUMN approved_at       TIMESTAMPTZ,
    ADD COLUMN rejected_reason   TEXT,
    ADD COLUMN registered_at     TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN app_user.status IS
    'pending = self-registered, cannot write anything yet. active = approved by '
    'an administrator. The default is deliberately pending: schema.sql defaulted '
    'is_active to TRUE, which would let a self-registered account write '
    'immediately.';

COMMENT ON COLUMN app_user.requested_role_id IS
    'What the person asked to be at registration — data_officer, expert or '
    'community. Kept separate from user_role, which is what an administrator '
    'actually granted. The two differing is a normal outcome, not an error.';

COMMENT ON COLUMN app_user.province_id IS
    'The single province this user may write to (SRS §3.2). NULL is permitted '
    'only for administrators and community members, who are national in scope.';

-- An approved account must record who approved it and when.
ALTER TABLE app_user
    ADD CONSTRAINT app_user_approval_recorded CHECK (
        status <> 'active' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    );

-- A rejection must say why. A person is entitled to the reason.
ALTER TABLE app_user
    ADD CONSTRAINT app_user_rejection_explained CHECK (
        status <> 'rejected'
        OR (rejected_reason IS NOT NULL AND length(btrim(rejected_reason)) > 0)
    );

CREATE INDEX app_user_status_ix ON app_user (status) WHERE status = 'pending';

-- Keep the legacy flag consistent so existing reads stay correct.
CREATE OR REPLACE FUNCTION sync_user_is_active() RETURNS TRIGGER AS $$
BEGIN
    NEW.is_active := (NEW.status = 'active');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_user_is_active_sync
    BEFORE INSERT OR UPDATE OF status ON app_user
    FOR EACH ROW EXECUTE FUNCTION sync_user_is_active();

-- ----------------------------------------------------------------------------
-- 3. Provincial scope, enforced rather than described.
--
--    A data officer or expert MUST be bound to a province; an administrator
--    must not be. Enforced with a trigger because the rule spans app_user and
--    user_role, which a CHECK cannot see across.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_user_province_scope() RETURNS TRIGGER AS $$
DECLARE
    v_code TEXT;
    v_prov SMALLINT;
BEGIN
    SELECT code INTO v_code FROM role WHERE id = NEW.role_id;
    SELECT province_id INTO v_prov FROM app_user WHERE id = NEW.user_id;

    IF v_code IN ('data_officer', 'expert') AND v_prov IS NULL THEN
        RAISE EXCEPTION
            'Role % requires a province: SRS §3.2 binds a data officer or '
            'expert to exactly one province, enforced server-side on every '
            'write. Set app_user.province_id before granting this role.', v_code
            USING ERRCODE = 'check_violation';
    END IF;

    IF v_code = 'admin' AND v_prov IS NOT NULL THEN
        RAISE EXCEPTION
            'An administrator is national in scope and must not be bound to a '
            'province (user_id=%).', NEW.user_id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_role_province_scope
    BEFORE INSERT OR UPDATE ON user_role
    FOR EACH ROW EXECUTE FUNCTION enforce_user_province_scope();

-- ----------------------------------------------------------------------------
-- 4. Views for the administrator dashboard (FR-12.3).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_pending_registration AS
SELECT u.id, u.email, u.full_name, u.organization, u.registered_at,
       r.code AS requested_role, r.name AS requested_role_name,
       p.name AS requested_province
FROM app_user u
LEFT JOIN role     r ON r.id = u.requested_role_id
LEFT JOIN province p ON p.id = u.province_id
WHERE u.status = 'pending'
ORDER BY u.registered_at;

COMMENT ON VIEW v_pending_registration IS
    'The approval queue. Every row here is a person who cannot write anything '
    'yet. Community registrations sit here too — see the note in SRS §3.5 on '
    'the cost of that to community-track uptake.';

CREATE OR REPLACE VIEW v_user_access AS
SELECT u.id, u.email, u.full_name, u.organization, u.status,
       p.name AS province,
       array_agg(r.code ORDER BY r.code) FILTER (WHERE r.code IS NOT NULL) AS roles
FROM app_user u
LEFT JOIN province  p  ON p.id = u.province_id
LEFT JOIN user_role ur ON ur.user_id = u.id
LEFT JOIN role      r  ON r.id = ur.role_id
GROUP BY u.id, u.email, u.full_name, u.organization, u.status, p.name;

COMMIT;
