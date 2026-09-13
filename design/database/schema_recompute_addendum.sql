-- schema_recompute_addendum.sql
--
-- Apply AFTER schema_climate_scope_addendum.sql. Idempotent.
--
-- WHO MAY RECOMPUTE A PROVINCE
--
-- Recomputing writes no new facts. It re-derives `vulnerability_result` from
-- values and weights that are already in the database, and it is idempotent --
-- running it twice gives the same answer. So the question is not "may this
-- person change the data" but "may this person republish this province's
-- scores", and the honest answer is: anyone already trusted to write anything
-- in that province, because whatever they wrote is meaningless until the
-- engine has read it.
--
-- The narrower alternative -- admin only -- was rejected because it makes the
-- officer who just imported data wait for someone else before the map reflects
-- it, and a map that silently lags its own data is the failure this button
-- exists to prevent.

CREATE OR REPLACE FUNCTION may_recompute_province(
    p_user_id     BIGINT,
    p_province_id SMALLINT
) RETURNS BOOLEAN AS $$
DECLARE
    u RECORD;
BEGIN
    SELECT status, province_id INTO u FROM app_user WHERE id = p_user_id;
    IF NOT FOUND OR u.status <> 'active' THEN
        RETURN FALSE;                       -- default deny (NFR-4)
    END IF;

    IF EXISTS (SELECT 1 FROM user_role ur JOIN role r ON r.id = ur.role_id
                WHERE ur.user_id = p_user_id AND r.code = 'admin') THEN
        RETURN TRUE;
    END IF;

    IF u.province_id IS DISTINCT FROM p_province_id THEN
        RETURN FALSE;
    END IF;

    -- Any sector grant, or the hazard grant. Silence is still not consent: a
    -- user with no grant at all cannot recompute.
    RETURN EXISTS (SELECT 1 FROM user_write_scope s WHERE s.user_id = p_user_id)
        OR COALESCE((SELECT may_write_hazard_domain FROM app_user WHERE id = p_user_id), FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION may_recompute_province IS
    'Whether a user may re-derive published scores for a province. Recompute '
    'writes no new facts and is idempotent, so it is granted to anyone already '
    'trusted to write in that province.';
