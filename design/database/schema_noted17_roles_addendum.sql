-- schema_noted17_roles_addendum.sql
-- Added 2026-11-24 (client feedback NOTED-17, items 9, 10, 13).
--
-- 1. ROLES. The existing `admin` is the SUPER ADMINISTRATOR (national). Two
--    new roles:
--      province_admin      bound to ONE province. Creates and approves that
--                          province's experts and official data-entry users,
--                          approves their data, may write and recompute there.
--      data_sharing_admin  national. Receives public data requests and shares
--                          the index data (H, E, H x E, weights) as a PDF.
-- 2. EXPERTS IN SEVERAL PROVINCES. user_province lists the provinces an expert
--    may assess in. app_user.province_id stays their first (home) province, so
--    every existing single-province rule keeps working unchanged.
-- 3. APPROVALS. A change by an expert or a data-entry user is stored in
--    pending_change and applied only when the provincial (or super)
--    administrator approves it. Until then the maps keep the approved values.
-- 4. UNDO. assessment_history keeps the expert-track figures of a division as
--    they were before each applied change, so the previous version can be
--    restored.
-- 5. DATA REQUESTS. data_request holds requests from the public for index data.
-- Who created whom: app_user.approved_by already records the administrator who
-- approved or created each account, so no new column is needed for that.

BEGIN;

INSERT INTO role (code, name, description) VALUES
    ('province_admin', 'Provincial Administrator',
     'Creates and approves the experts and official data-entry users of one '
     'province, and approves the data they enter for its DS divisions.'),
    ('data_sharing_admin', 'Data Sharing Administrator',
     'Receives requests from the public for index data and shares it.')
ON CONFLICT (code) DO NOTHING;

-- A provincial administrator, like an officer or expert, needs a province.
CREATE OR REPLACE FUNCTION enforce_user_province_scope() RETURNS TRIGGER AS $$
DECLARE
    v_code TEXT;
    v_prov SMALLINT;
BEGIN
    SELECT code INTO v_code FROM role WHERE id = NEW.role_id;
    SELECT province_id INTO v_prov FROM app_user WHERE id = NEW.user_id;

    IF v_code IN ('data_officer', 'expert', 'province_admin') AND v_prov IS NULL THEN
        RAISE EXCEPTION
            'Role % requires a province. Set app_user.province_id before '
            'granting this role.', v_code
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

-- True when the user is an active provincial administrator of that province.
CREATE OR REPLACE FUNCTION is_province_admin(p_user_id BIGINT, p_province_id SMALLINT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM app_user u
          JOIN user_role ur ON ur.user_id = u.id
          JOIN role r ON r.id = ur.role_id AND r.code = 'province_admin'
         WHERE u.id = p_user_id AND u.status = 'active'
           AND u.province_id = p_province_id);
$$ LANGUAGE sql STABLE;

-- The three write checks: a provincial administrator may do in their own
-- province whatever an officer granted every sector there could do.
CREATE OR REPLACE FUNCTION may_write_profile(
    p_user_id      BIGINT,
    p_province_id  SMALLINT,
    p_sector_id    BIGINT,
    p_subsector_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    u RECORD;
BEGIN
    SELECT status, province_id, id INTO u FROM app_user WHERE id = p_user_id;
    IF NOT FOUND OR u.status <> 'active' THEN
        RETURN FALSE;
    END IF;
    IF EXISTS (SELECT 1 FROM user_role ur JOIN role r ON r.id = ur.role_id
                WHERE ur.user_id = p_user_id AND r.code = 'admin') THEN
        RETURN TRUE;
    END IF;
    IF is_province_admin(p_user_id, p_province_id) THEN
        RETURN TRUE;
    END IF;
    IF u.province_id IS DISTINCT FROM p_province_id THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM user_write_scope s
         WHERE s.user_id = p_user_id
           AND s.sector_id = p_sector_id
           AND (s.subsector_id IS NULL OR s.subsector_id = p_subsector_id));
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION may_write_hazard(
    p_user_id     BIGINT,
    p_province_id SMALLINT
) RETURNS BOOLEAN AS $$
DECLARE
    u RECORD;
BEGIN
    SELECT status, province_id, may_write_hazard_domain INTO u
      FROM app_user WHERE id = p_user_id;
    IF NOT FOUND OR u.status <> 'active' THEN
        RETURN FALSE;
    END IF;
    IF EXISTS (SELECT 1 FROM user_role ur JOIN role r ON r.id = ur.role_id
                WHERE ur.user_id = p_user_id AND r.code = 'admin') THEN
        RETURN TRUE;
    END IF;
    IF is_province_admin(p_user_id, p_province_id) THEN
        RETURN TRUE;
    END IF;
    IF NOT u.may_write_hazard_domain THEN
        RETURN FALSE;
    END IF;
    RETURN u.province_id IS NOT DISTINCT FROM p_province_id;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION may_recompute_province(
    p_user_id     BIGINT,
    p_province_id SMALLINT
) RETURNS BOOLEAN AS $$
DECLARE
    u RECORD;
BEGIN
    SELECT status, province_id INTO u FROM app_user WHERE id = p_user_id;
    IF NOT FOUND OR u.status <> 'active' THEN
        RETURN FALSE;
    END IF;
    IF EXISTS (SELECT 1 FROM user_role ur JOIN role r ON r.id = ur.role_id
                WHERE ur.user_id = p_user_id AND r.code = 'admin') THEN
        RETURN TRUE;
    END IF;
    IF is_province_admin(p_user_id, p_province_id) THEN
        RETURN TRUE;
    END IF;
    IF u.province_id IS DISTINCT FROM p_province_id THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (SELECT 1 FROM user_write_scope s WHERE s.user_id = p_user_id)
        OR COALESCE((SELECT may_write_hazard_domain FROM app_user WHERE id = p_user_id), FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- ---- 2. experts in several provinces ----------------------------------------
CREATE TABLE IF NOT EXISTS user_province (
    user_id     BIGINT   NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    province_id SMALLINT NOT NULL REFERENCES province(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, province_id)
);
-- Every existing province-bound account keeps its province.
INSERT INTO user_province (user_id, province_id)
SELECT id, province_id FROM app_user WHERE province_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ---- 3. approvals -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS pending_change (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kind          TEXT NOT NULL CHECK (kind IN ('assessment_save', 'assessment_remove',
                                                'assessment_restore', 'import_load',
                                                'batch_values')),
    province_id   SMALLINT NOT NULL REFERENCES province(id),
    submitted_by  BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    summary       TEXT NOT NULL,
    payload       JSONB NOT NULL,
    file_name     TEXT,
    file_body     BYTEA,
    -- what it concerns, so the expert form can show "waiting for approval"
    ds_division_id BIGINT REFERENCES ds_division(id) ON DELETE CASCADE,
    sector_id      BIGINT,
    subsector_id   BIGINT,
    hazard_type_id BIGINT,
    source         TEXT,
    status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'failed')),
    decided_by    BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    decided_at    TIMESTAMPTZ,
    decision_note TEXT
);
CREATE INDEX IF NOT EXISTS pending_change_queue_ix ON pending_change (province_id, status);

-- ---- 4. undo ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_history (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ds_division_id BIGINT NOT NULL REFERENCES ds_division(id) ON DELETE CASCADE,
    sector_id      BIGINT NOT NULL,
    subsector_id   BIGINT,
    hazard_type_id BIGINT NOT NULL,
    source         source_type NOT NULL,
    year_start     INTEGER NOT NULL,
    year_end       INTEGER NOT NULL,
    snapshot       JSONB NOT NULL,      -- figures, index entries, withdrawn flag
    reason         TEXT,
    created_by     BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    restored_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS assessment_history_ix
    ON assessment_history (ds_division_id, sector_id, hazard_type_id, source);

-- ---- 5. public data requests -------------------------------------------------
CREATE TABLE IF NOT EXISTS data_request (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name     TEXT NOT NULL,
    email         TEXT NOT NULL,
    organization  TEXT,
    purpose       TEXT NOT NULL,
    province_id   SMALLINT REFERENCES province(id),
    sector_code   TEXT,
    subsector_code TEXT,
    hazard_code   TEXT,
    period        TEXT,
    requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    status        TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'shared', 'declined')),
    handled_by    BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    handled_at    TIMESTAMPTZ,
    note          TEXT
);

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'riskradar_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON user_province, pending_change,
              assessment_history, data_request TO riskradar_app;
    END IF;
END $$;

COMMIT;
