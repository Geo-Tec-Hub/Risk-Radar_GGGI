-- ---------------------------------------------------------------------------
-- schema_profile_consensus_save_addendum.sql        Stage 2.2 | 15 August 2026
--
-- Makes save_profile_weights() able to express what T3 requires. Two gaps were
-- found by running the existing function rather than reading it:
--
--   1. IT DROPPED CONSENSUS ENTIRELY. The INSERT into profile_indicator listed
--      only weight and relationship, so every save reset consensus to its
--      column default 'agreed'. An expert who recorded "this variable is not
--      significant" (consensus='rejected', SRS section 2.4) would find that
--      decision silently reverted by the next save, and the exclusion rule that
--      unblocks 97 of 243 profiles rests entirely on that column.
--
--   2. ITS 100% CHECK COUNTED EVERY ITEM. A domain could reach 100 by counting
--      a rejected variable's weight. The CHECK constraint
--      profile_indicator_inactive_unweighted would then reject the INSERT, so
--      nothing corrupt could be stored -- but the user got a constraint
--      violation naming a column instead of "this domain totals 100 only
--      because it counts a variable you excluded". Right outcome, useless
--      message, and it failed after the old version had already been retired.
--
-- Also adds indicator_catalog.is_composite_index, so FR-4.9b can be enforced
-- from data rather than from a name pattern. The three composite indices are
-- currently identifiable only by their codes ending in _HAZARD_INDEX; matching
-- on that string inside a stored function would break the first time somebody
-- adds a variable named, say, LANDSLIDE_HAZARD_INDEX_2050.
--
-- SAFE TO RE-RUN.
-- ---------------------------------------------------------------------------

BEGIN;

-- 1. Which catalogue entries are composite hazard indices ---------------------
ALTER TABLE indicator_catalog
    ADD COLUMN IF NOT EXISTS is_composite_index BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN indicator_catalog.is_composite_index IS
  'True for a pre-computed composite hazard index (SRS section 2.8, [P-5]). '
  'A composite cannot be decomposed, so it carries no weight where components '
  'exist; it is retained as a reference variable and may be displayed. '
  'Drives FR-4.9b -- do not infer this from the code string.';

UPDATE indicator_catalog
   SET is_composite_index = TRUE
 WHERE code IN ('DROUGHT_HAZARD_INDEX', 'FLOOD_HAZARD_INDEX', 'LANDSLIDE_HAZARD_INDEX')
   AND NOT is_composite_index;

-- 2. save_profile_weights, carrying consensus ---------------------------------
--
-- Same signature as before, so nothing that already calls it needs changing;
-- the new fields are optional keys on the existing p_items JSON.
--
--   p_items := [{ "code": "...", "domain": "hazard"|"exposure",
--                 "weight_pct": 50,                -- omit or null when excluded
--                 "relationship": "higher_is_worse",
--                 "weight_pct_from_file": 50,
--                 "consensus": "agreed"|"contested"|"rejected"|"proposed",
--                 "consensus_note": "..." }, ...]
--
-- Defaults to 'agreed' when consensus is absent, which is what every existing
-- caller means.
CREATE OR REPLACE FUNCTION save_profile_weights(
    p_province_id    SMALLINT,
    p_sector_id      BIGINT,
    p_subsector_id   BIGINT,
    p_hazard_type_id BIGINT,
    p_items          JSONB,
    p_user_id        BIGINT,
    p_import_batch_id BIGINT DEFAULT NULL,
    p_panel_note     TEXT    DEFAULT NULL
) RETURNS BIGINT
LANGUAGE plpgsql
AS $fn$
DECLARE
    v_next   INTEGER;
    v_new_id BIGINT;
    v_code   TEXT;
    bad      TEXT;
    n        BIGINT;
BEGIN
    -- ---- validate the items before retiring anything -----------------------
    -- The old version retired the active profile first and validated second, so
    -- a rejected save could leave the scope with no active version at all.

    -- Unknown consensus value: fail here with a readable message rather than on
    -- the enum cast further down.
    SELECT string_agg(DISTINCT x.consensus, ', ')
      INTO bad
      FROM jsonb_to_recordset(p_items) AS x(consensus TEXT)
     WHERE x.consensus IS NOT NULL
       AND x.consensus NOT IN ('agreed', 'contested', 'rejected', 'proposed');
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Unknown consensus value(s): %. Expected agreed, contested, rejected or proposed', bad;
    END IF;

    -- A contested membership must say why (mirrors the CHECK, but the CHECK
    -- fires per row and names a constraint; this names the variable).
    SELECT string_agg(x.code, ', ')
      INTO bad
      FROM jsonb_to_recordset(p_items) AS x(code TEXT, consensus TEXT, consensus_note TEXT)
     WHERE x.consensus = 'contested'
       AND (x.consensus_note IS NULL OR length(btrim(x.consensus_note)) = 0);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'A contested variable must carry a note explaining the disagreement: %', bad;
    END IF;

    -- THE RULE THIS FUNCTION EXISTS FOR (SRS section 2.4, FR-4.9):
    -- a domain totals 100 across agreed + contested ONLY. An excluded variable
    -- contributes nothing -- it is not a zero, it is not in the sum at all.
    SELECT string_agg(format('%s = %s%%', domain, total), ', ')
      INTO bad
      FROM (SELECT x.domain, ROUND(SUM(x.weight_pct), 3) AS total
              FROM jsonb_to_recordset(p_items)
                   AS x(domain TEXT, weight_pct NUMERIC, consensus TEXT)
             WHERE COALESCE(x.consensus, 'agreed') IN ('agreed', 'contested')
             GROUP BY x.domain) s(domain, total)
     WHERE total IS DISTINCT FROM 100.000;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION
            'Weights must total 100%% per domain across agreed and contested variables (got %). '
            'Excluded variables are not counted; never rescale to reach 100.', bad;
    END IF;

    -- FR-4.9b: in the hazard domain, only a COMPOSITE INDEX may be excluded.
    -- Excluding a component while the composite still carries weight hands the
    -- domain back to the composite, which is exactly what [P-5] settled against.
    SELECT count(*)
      INTO n
      FROM jsonb_to_recordset(p_items) AS x(code TEXT, domain TEXT, consensus TEXT)
      JOIN indicator_catalog ic ON ic.code = x.code
     WHERE x.domain = 'hazard'
       AND x.consensus = 'rejected'
       AND NOT ic.is_composite_index
       AND EXISTS (
             SELECT 1
               FROM jsonb_to_recordset(p_items) AS y(code TEXT, domain TEXT, weight_pct NUMERIC, consensus TEXT)
               JOIN indicator_catalog ic2 ON ic2.code = y.code
              WHERE y.domain = 'hazard'
                AND ic2.is_composite_index
                AND y.weight_pct IS NOT NULL
                AND COALESCE(y.consensus, 'agreed') IN ('agreed', 'contested'));
    IF n > 0 THEN
        RAISE EXCEPTION
            'Cannot exclude a hazard component while a composite hazard index carries weight '
            '(FR-4.9b): excluding it would reinstate the composite as the hazard domain, '
            'against [P-5]. Hold the profile as pending instead.';
    END IF;

    -- ---- now it is safe to write -------------------------------------------
    UPDATE vulnerability_profile
       SET is_active = FALSE
     WHERE is_active
       AND province_id    IS NOT DISTINCT FROM p_province_id
       AND sector_id      = p_sector_id
       AND subsector_id   IS NOT DISTINCT FROM p_subsector_id
       AND hazard_type_id = p_hazard_type_id;

    SELECT COALESCE(MAX(version), 0) + 1 INTO v_next
      FROM vulnerability_profile
     WHERE province_id    IS NOT DISTINCT FROM p_province_id
       AND sector_id      = p_sector_id
       AND subsector_id   IS NOT DISTINCT FROM p_subsector_id
       AND hazard_type_id = p_hazard_type_id;

    SELECT format('%s_%s_%s_V%s',
                  upper(regexp_replace(COALESCE(ss.name, s.name), '[^A-Za-z0-9]+', '_', 'g')),
                  upper(h.name), COALESCE(p.code, 'NAT'), v_next)
      INTO v_code
      FROM sector s
      LEFT JOIN subsector ss ON ss.id = p_subsector_id
      JOIN hazard_type h     ON h.id  = p_hazard_type_id
      LEFT JOIN province p   ON p.id  = p_province_id
     WHERE s.id = p_sector_id;

    INSERT INTO vulnerability_profile
        (code, name, province_id, sector_id, subsector_id, hazard_type_id,
         version, is_active, created_by, import_batch_id, panel_note)
    VALUES
        (v_code, v_code, p_province_id, p_sector_id, p_subsector_id, p_hazard_type_id,
         v_next, TRUE, p_user_id, p_import_batch_id, p_panel_note)
    RETURNING id INTO v_new_id;

    INSERT INTO profile_indicator
        (profile_id, indicator_id, domain, weight_pct, relationship,
         weight_pct_from_file, consensus, consensus_note, decided_by, decided_at)
    SELECT v_new_id, ic.id, x.domain::domain_type,
           -- An excluded or undecided membership carries NO weight. Storing 0
           -- would make it look like a variable judged unimportant rather than
           -- one ruled out; the schema CHECK forbids it anyway.
           CASE WHEN COALESCE(x.consensus, 'agreed') IN ('agreed', 'contested')
                THEN x.weight_pct END,
           COALESCE(x.relationship, 'higher_is_worse')::indicator_direction,
           x.weight_pct_from_file,
           COALESCE(x.consensus, 'agreed')::membership_consensus,
           x.consensus_note,
           -- Who decided, and when: an exclusion that cannot be attributed is
           -- indistinguishable from an oversight, and no published score may
           -- rest on one (SRS section 2.4).
           CASE WHEN COALESCE(x.consensus, 'agreed') <> 'agreed' THEN p_user_id END,
           CASE WHEN COALESCE(x.consensus, 'agreed') <> 'agreed' THEN now() END
      FROM jsonb_to_recordset(p_items)
           AS x(code TEXT, domain TEXT, weight_pct NUMERIC,
                relationship TEXT, weight_pct_from_file NUMERIC,
                consensus TEXT, consensus_note TEXT)
      JOIN indicator_catalog ic ON ic.code = x.code;

    RETURN v_new_id;   -- caller recomputes vulnerability against this version
END
$fn$;

COMMENT ON FUNCTION save_profile_weights(SMALLINT, BIGINT, BIGINT, BIGINT, JSONB, BIGINT, BIGINT, TEXT) IS
  'Writes a NEW profile version and returns its id. Domains must total 100 across '
  'agreed + contested only; excluded variables are omitted from the sum and stored '
  'with a NULL weight, attributed to p_user_id. Validates before retiring the '
  'current version, so a rejected save leaves the active profile untouched.';

COMMIT;
