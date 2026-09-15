-- schema_weights_save_completeness_addendum.sql
-- Added 2026-09-05.
--
-- WHAT WENT WRONG.  `save_profile_weights()` accepted this payload:
--
--     {"items":[{"indicatorCode":"X","domain":"hazard","weightPct":100}]}
--
-- and returned 200. It retired TEA_FLOOD_CEN_V5 — a good version with eleven
-- memberships — and installed an active V6 with **zero**. The profile stopped
-- being computable and its entire weighting vanished from the active version,
-- with no error anywhere.
--
-- Two independent holes, either of which is enough on its own:
--
--   1. AN UNKNOWN CODE IS SILENTLY DROPPED. The INSERT ends
--      `JOIN indicator_catalog ic ON ic.code = x.code`, so a typo, a renamed
--      variable or a stale client just contributes no row. The save reports
--      success and the variable is gone.
--
--   2. A DOMAIN ABSENT FROM THE PAYLOAD IS NEVER CHECKED. The 100 rule groups
--      by domain over the items SUPPLIED. Send no exposure rows and there is no
--      exposure group, so nothing is compared to 100 and the omission passes.
--
--   3. And, following from both: OMITTING a variable the profile currently
--      carries drops it. This project's standing rule is that exclusion is a
--      recorded decision and never an inference (SRS §2.4, FR-4.9) — a variable
--      is removed by sending it as `rejected`, not by leaving it out.
--
-- This is the same defect class as the 15 August one in the same function,
-- which discarded exclusions: a save that quietly loses part of an expert's
-- weighting while reporting success. The lesson repeating is that this function
-- validates what it was SENT and never asks what it was sent AGAINST.
--
-- The fix adds three pre-flight checks. They run before anything is retired, so
-- a rejected save leaves the existing active version untouched.

BEGIN;

CREATE OR REPLACE FUNCTION assert_weights_payload_complete(
    p_province_id  SMALLINT,
    p_sector_id    BIGINT,
    p_subsector_id BIGINT,
    p_hazard_type_id BIGINT,
    p_items        JSONB
) RETURNS VOID AS $$
DECLARE
    bad      TEXT;
    v_active BIGINT;
BEGIN
    -- 1. Every code must resolve.
    SELECT string_agg(DISTINCT x.code, ', ')
      INTO bad
      FROM jsonb_to_recordset(p_items) AS x(code TEXT)
     WHERE x.code IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM indicator_catalog ic WHERE ic.code = x.code);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION
            'Unknown variable code(s): %. A save naming a variable that does not '
            'exist would silently drop it and report success.', bad;
    END IF;

    -- 2. Both domains must be present. An absent domain is not an empty one.
    SELECT string_agg(d, ', ') INTO bad
      FROM unnest(ARRAY['hazard', 'exposure']) AS d
     WHERE NOT EXISTS (SELECT 1 FROM jsonb_to_recordset(p_items) AS x(domain TEXT)
                        WHERE x.domain = d);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION
            'The payload carries no % row at all. A domain that is absent is '
            'never compared against the 100%% rule, so omitting one would save a '
            'profile with no % weighting and report success.', bad, bad;
    END IF;

    -- 3. Every variable the active version carries must be accounted for.
    --    Removal is `rejected`, never omission (SRS section 2.4).
    SELECT vp.id INTO v_active
      FROM vulnerability_profile vp
     WHERE vp.is_active
       AND vp.province_id    IS NOT DISTINCT FROM p_province_id
       AND vp.sector_id      = p_sector_id
       AND vp.subsector_id   IS NOT DISTINCT FROM p_subsector_id
       AND vp.hazard_type_id = p_hazard_type_id;

    IF v_active IS NOT NULL THEN
        SELECT string_agg(ic.code, ', ' ORDER BY ic.code) INTO bad
          FROM profile_indicator pi
          JOIN indicator_catalog ic ON ic.id = pi.indicator_id
         WHERE pi.profile_id = v_active
           AND NOT EXISTS (SELECT 1 FROM jsonb_to_recordset(p_items) AS x(code TEXT)
                            WHERE x.code = ic.code);
        IF bad IS NOT NULL THEN
            RAISE EXCEPTION
                'These variables are in the profile but missing from the save: %. '
                'Remove a variable by sending it with consensus = ''rejected'', '
                'never by leaving it out — an omission cannot be told apart from '
                'an oversight, and no published score may rest on one.', bad;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION assert_weights_payload_complete IS
    'Pre-flight for save_profile_weights: codes resolve, both domains present, '
    'and nothing the active version carries is silently omitted. Runs before '
    'anything is retired, so a refused save leaves the active version intact.';

-- Wire it in as the first statement of the save, before any validation that
-- assumes the payload describes the whole profile.
DO $wire$
DECLARE
    src TEXT;
BEGIN
    SELECT prosrc INTO src FROM pg_proc WHERE proname = 'save_profile_weights';
    IF src IS NULL THEN
        RAISE EXCEPTION 'save_profile_weights() not found — apply '
                        'schema_profile_consensus_save_addendum.sql first';
    END IF;
    IF position('assert_weights_payload_complete' IN src) > 0 THEN
        RAISE NOTICE 'save_profile_weights already calls the completeness check';
        RETURN;
    END IF;

    src := replace(
        src,
        'BEGIN' || chr(10) ||
        '    -- ---- validate the items before retiring anything ---',
        'BEGIN' || chr(10) ||
        '    PERFORM assert_weights_payload_complete(' || chr(10) ||
        '        p_province_id, p_sector_id, p_subsector_id, p_hazard_type_id, p_items);' || chr(10) ||
        '    -- ---- validate the items before retiring anything ---');

    IF position('assert_weights_payload_complete' IN src) = 0 THEN
        RAISE EXCEPTION 'could not splice the completeness check into '
                        'save_profile_weights() — its preamble has changed; '
                        'add the PERFORM call by hand rather than guessing';
    END IF;

    EXECUTE format(
        'CREATE OR REPLACE FUNCTION save_profile_weights('
        'p_province_id smallint, p_sector_id bigint, p_subsector_id bigint, '
        'p_hazard_type_id bigint, p_items jsonb, p_user_id bigint, '
        'p_import_batch_id bigint DEFAULT NULL, p_panel_note text DEFAULT NULL) '
        'RETURNS bigint LANGUAGE plpgsql AS %L', src);
END
$wire$;

COMMIT;
