-- schema_write_scope_addendum.sql
-- Added 2026-09-05.
--
-- WHY.  A data officer or expert is bound to one PROVINCE and to nothing else.
-- Every workbook, though, is specific to a sector, a subsector and a hazard, and
-- in Central every agency shares one province — so a livestock officer could
-- import a paddy workbook, and an expert in one field could set the weights that
-- determine another field's published scores.
--
-- That became sharper on 3 September, when the official track was made
-- LATEST-IMPORT-SUPERSEDES to fix a duplicate-rows defect. A wrong-sector upload
-- no longer produces a harmless duplicate; it OVERWRITES, silently, and the map
-- recomputes as though nothing happened.
--
-- WHERE THE BOUNDARY ACTUALLY IS.  Measured on Central's loaded data:
--
--     exposure   97 variables, 3,920 facts, each used by ~1.9 profiles
--     hazard     12 variables,   492 facts, each used by ~13.5 profiles
--
-- Exposure variables are genuinely sector-specific, so a sector grant governs
-- them cleanly — 89% of the data. The twelve hazard variables are not: SPI,
-- warm days, rainfall and event counts appear across most sectors and belong to
-- the Meteorological Department and the DMC, not to Agriculture or Livestock.
-- Every workbook carries both, so a sector grant alone would still let a paddy
-- officer overwrite the climate figures thirteen other sectors depend on.
--
-- Hence two separate things: a sector scope, and a distinct hazard-domain grant.
--
-- WHAT IS DELIBERATELY *NOT* SCOPED
--   * READS. The map is public (FR-12.7). An officer who cannot see other
--     sectors cannot sanity-check their own, and there is no confidentiality
--     argument for hiding a published score.
--   * HAZARD TYPE (drought / flood / landslide). The agency that owns paddy owns
--     paddy-drought and paddy-flood alike — the exposure variables are identical
--     and only the climate columns differ, and those are covered by the grant
--     above. A hazard-type grant would multiply rows without matching any real
--     authority.
--   * PROVINCE. Already singular and enforced (SRS §3.2). Unchanged.

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. The scope itself
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_write_scope (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      BIGINT   NOT NULL REFERENCES app_user(id)  ON DELETE CASCADE,
    sector_id    BIGINT   NOT NULL REFERENCES sector(id)    ON DELETE RESTRICT,
    -- NULL means the whole sector. A row naming a subsector narrows to it.
    subsector_id BIGINT            REFERENCES subsector(id) ON DELETE RESTRICT,
    granted_by   BIGINT            REFERENCES app_user(id)  ON DELETE SET NULL,
    granted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    note         TEXT
);

-- NULLS NOT DISTINCT so a second whole-sector grant collides with the first
-- rather than quietly duplicating it (PostgreSQL 15+, as schema.sql requires).
CREATE UNIQUE INDEX IF NOT EXISTS user_write_scope_uniq
    ON user_write_scope (user_id, sector_id, subsector_id) NULLS NOT DISTINCT;

CREATE INDEX IF NOT EXISTS user_write_scope_user_ix ON user_write_scope (user_id);

COMMENT ON TABLE user_write_scope IS
    'Which sectors a user may WRITE to. Reads are unrestricted (FR-12.7). '
    'A row with subsector_id NULL grants the whole sector.';

-- A subsector grant must belong to the sector it is granted under, or the row
-- says something that cannot be true.
CREATE OR REPLACE FUNCTION enforce_write_scope_consistency() RETURNS TRIGGER AS $$
DECLARE
    v_parent BIGINT;
BEGIN
    IF NEW.subsector_id IS NOT NULL THEN
        SELECT sector_id INTO v_parent FROM subsector WHERE id = NEW.subsector_id;
        IF v_parent IS DISTINCT FROM NEW.sector_id THEN
            RAISE EXCEPTION
                'subsector % does not belong to sector % — a write scope cannot '
                'name a pairing that does not exist',
                NEW.subsector_id, NEW.sector_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_write_scope_consistency ON user_write_scope;
CREATE TRIGGER user_write_scope_consistency
    BEFORE INSERT OR UPDATE ON user_write_scope
    FOR EACH ROW EXECUTE FUNCTION enforce_write_scope_consistency();

-- ----------------------------------------------------------------------------
-- 2. The hazard-domain grant, held separately
-- ----------------------------------------------------------------------------

ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS may_write_hazard_domain BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN app_user.may_write_hazard_domain IS
    'May write hazard-domain (climate) variables — SPI, warm days, rainfall, '
    'event counts. Held apart from user_write_scope because those twelve '
    'variables are shared across ~13.5 profiles each and belong to the Met '
    'Department / DMC rather than to any one sector. FALSE by default: a sector '
    'grant alone must not carry them.';

-- What the applicant asked for at registration, kept apart from what was
-- granted. Recording the request in the same place as the grant would make an
-- unapproved wish indistinguishable from an approved permission.
ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS requested_scope JSONB;

COMMENT ON COLUMN app_user.requested_scope IS
    'The interest areas named at registration, e.g. '
    '{"sectors":[{"sector":"AGRICULTURE","subsector":"PADDY"}],"hazardDomain":true}. '
    'A REQUEST, never a permission — the admin grants into user_write_scope.';

-- ----------------------------------------------------------------------------
-- 3. One place that answers "may this user write here?"
-- ----------------------------------------------------------------------------

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
        RETURN FALSE;                      -- default deny (NFR-4)
    END IF;

    -- An administrator is not province- or sector-bound.
    IF EXISTS (SELECT 1 FROM user_role ur JOIN role r ON r.id = ur.role_id
                WHERE ur.user_id = p_user_id AND r.code = 'admin') THEN
        RETURN TRUE;
    END IF;

    IF u.province_id IS DISTINCT FROM p_province_id THEN
        RETURN FALSE;
    END IF;

    -- No rows at all = no sector granted = no writes. Silence is not consent.
    RETURN EXISTS (
        SELECT 1 FROM user_write_scope s
         WHERE s.user_id = p_user_id
           AND s.sector_id = p_sector_id
           AND (s.subsector_id IS NULL OR s.subsector_id = p_subsector_id)
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION may_write_profile IS
    'The single authority on whether a user may write to a profile scope. The '
    'API asks this rather than reimplementing it, so the rule cannot drift '
    'between an endpoint and the database.';

COMMIT;
