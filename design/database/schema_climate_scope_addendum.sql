-- schema_climate_scope_addendum.sql
--
-- Apply AFTER schema_write_scope_addendum.sql. Idempotent.
--
-- WHY
-- ---
-- `indicator_value` keys a value to (indicator, ds_division, period). There is
-- no sector column, and there never was: the drought-event count for Akurana is
-- ONE fact, read by coconut, paddy, tea, livestock and every other profile that
-- carries the variable.
--
-- Until now those twelve hazard variables were nonetheless collected inside
-- every sector workbook, so the same fact arrived ~13x. The loader's rule on
-- the `data` track is "the newest import supersedes, whoever ran it"
-- (load_template.py, 3 Sep 2026), which means the last sector officer to import
-- silently overwrote every other sector's copy of the climate. Nothing warned,
-- because nothing was wrong at row level -- the rows were simply replaced.
--
-- The fix is a province-wide CLIMATE workbook that carries the hazard variables
-- once, owned by one officer, and sector workbooks that carry only their own
-- exposure columns. This addendum adds the one thing that needs to live in the
-- schema: the authority on whether a person may write climate values.
--
-- WHY A FUNCTION AND NOT AN `IF` IN PYTHON
-- ----------------------------------------
-- `may_write_profile()` already owns "may this person write to this sector
-- scope". Asking the same kind of question a second way, in application code,
-- is how the two answers drift. So the climate question gets a function beside
-- it, with the same shape and the same default-deny.
--
-- BEHAVIOUR CHANGE, DELIBERATE
-- ----------------------------
-- The old inline check in load_template.py read `app_user.may_write_hazard_domain`
-- directly and therefore exempted nobody -- an ADMIN was refused a workbook
-- carrying climate columns, while `may_write_profile()` two lines above waved
-- the same admin through. That asymmetry was not a decision, it was an
-- oversight. `may_write_hazard()` exempts admins exactly as `may_write_profile()`
-- does. This grants an admin nothing they could not already grant themselves in
-- one UPDATE; it only stops them being told "no" for something they own.

CREATE OR REPLACE FUNCTION may_write_hazard(
    p_user_id     BIGINT,
    p_province_id SMALLINT
) RETURNS BOOLEAN AS $$
DECLARE
    u RECORD;
BEGIN
    SELECT status, province_id, may_write_hazard_domain
      INTO u
      FROM app_user
     WHERE id = p_user_id;

    IF NOT FOUND OR u.status <> 'active' THEN
        RETURN FALSE;                       -- default deny (NFR-4)
    END IF;

    -- An administrator is not province- or domain-bound, same as may_write_profile.
    IF EXISTS (SELECT 1 FROM user_role ur JOIN role r ON r.id = ur.role_id
                WHERE ur.user_id = p_user_id AND r.code = 'admin') THEN
        RETURN TRUE;
    END IF;

    IF NOT u.may_write_hazard_domain THEN
        RETURN FALSE;
    END IF;

    -- The grant is domain-wide but not country-wide: a provincial climate
    -- officer owns their own province's weather, not the island's. A user with
    -- no province (NULL) matches no province here, which is the same rule
    -- may_write_profile() applies -- national writes go through an admin.
    RETURN u.province_id IS NOT DISTINCT FROM p_province_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION may_write_hazard IS
    'The single authority on whether a user may write hazard-domain (climate) '
    'values for a province. Used by the CLIMATE workbook path and by the '
    'hazard-column check on sector workbooks, so both give the same answer.';
