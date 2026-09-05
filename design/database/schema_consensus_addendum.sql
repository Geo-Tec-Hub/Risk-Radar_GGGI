-- ============================================================================
-- Risk Radar — schema addendum: membership consensus + profile publication
-- 2026-08-09 · applies on top of schema.sql + schema_weights_addendum.sql
--
-- THE QUESTION THIS ANSWERS (Milinda, 2026-08-09)
--   Experts disagree about whether a variable belongs in a profile at all —
--   not merely about how much it should weigh. The proposal was two dashboards:
--   an OFFICIAL one computed only from agreed variables, and an EXPLORATORY one
--   where a user can vary the set and the weights and see what changes.
--
-- WHY DISAGREEMENT CANNOT BE ENCODED AS A ZERO WEIGHT
--   It is not merely inadvisable — it is not representable. schema.sql declares
--       weight_pct NUMERIC(6,3) CHECK (weight_pct > 0 AND weight_pct <= 100)
--   so 0 is rejected. Rev 4 of the weights addendum then dropped NOT NULL and
--   gave NULL the meaning "belongs to the profile, weight not set yet" — the
--   state 1,783 of the 3,664 memberships are in, and the state v_profile_
--   readiness uses to refuse computation. Both available values are taken, and
--   neither means "an expert thinks this does not belong". Overloading either
--   would destroy the readiness signal the import screen depends on.
--   Hence a separate column. Disagreement is recorded, not arithmetically
--   cancelled: a variable dropped by consensus stays visible with the reason
--   it was dropped, which a zero weight could never carry.
--
-- WHY NOT A SECOND DASHBOARD, A SECOND DATA MODEL
--   vulnerability_profile already carries `version` + `is_active`, its unique
--   key already includes version, and vulnerability_result already stores
--   profile_id as lineage plus a `method` JSONB weights snapshot. "Official"
--   and "exploratory" are therefore two states of one object, not two systems.
--   This addendum adds the state; it adds no parallel tables.
--
-- WHY UNANIMITY IS NOT THE GATE
--   Requiring that every expert agree hands each panelist a veto, and would
--   thin profiles to whatever nobody objects to. `contested` exists so a
--   variable can be included AND its dissent published. Only `rejected`
--   removes a variable from computation.
--
-- NOTE ON SCOPE: this is DDL only. It does not change any published score.
-- Every existing membership defaults to 'agreed' and every existing profile
-- to 'published', so applying it is a no-op for the current 243 profiles.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Consensus state of a variable within a profile.
--
--    proposed  — put forward (import FR-1.5, or an expert), not yet considered
--    agreed    — panel accepted it; counts toward the domain's 100
--    contested — included, but dissent is on the record; counts toward the 100
--    rejected  — considered and excluded; does NOT count, carries no weight,
--                and does not block readiness. Kept so the decision survives.
-- ----------------------------------------------------------------------------
CREATE TYPE membership_consensus AS ENUM
    ('proposed', 'agreed', 'contested', 'rejected');

ALTER TABLE profile_indicator
    ADD COLUMN consensus       membership_consensus NOT NULL DEFAULT 'agreed',
    ADD COLUMN consensus_note  TEXT,          -- free text: who disagreed and why
    ADD COLUMN decided_at      TIMESTAMPTZ,
    ADD COLUMN decided_by      BIGINT REFERENCES app_user(id) ON DELETE SET NULL;
-- NOTE: an earlier draft carried `dissent_count SMALLINT` — a tally of how many
-- panel members objected. Removed 9 August 2026 on the owner's instruction: it
-- assumes a meeting procedure that does not exist, and a count nobody actually
-- records is worse than no count. The declaration is made by the **user entering
-- the data**, who states which variables are accepted for the calculation;
-- `decided_by` and `decided_at` capture that, and disagreement worth keeping
-- goes in `consensus_note` as prose. See SRS v2.3 §2.4.

-- A variable that was rejected, or is only proposed, must not carry a weight:
-- otherwise it would silently contribute to a domain total it is not part of.
ALTER TABLE profile_indicator
    ADD CONSTRAINT profile_indicator_inactive_unweighted CHECK (
        consensus IN ('agreed', 'contested') OR weight_pct IS NULL
    );

-- Contested inclusion is a claim about people, so it must say something.
ALTER TABLE profile_indicator
    ADD CONSTRAINT profile_indicator_contested_explained CHECK (
        consensus <> 'contested'
        OR (consensus_note IS NOT NULL AND length(btrim(consensus_note)) > 0)
    );

COMMENT ON COLUMN profile_indicator.consensus IS
    'Panel position on whether this variable belongs in this profile. '
    'Distinct from weight_pct, which is how much it counts once it does. '
    'weight_pct = 0 is NOT a way to express rejection: the CHECK forbids it, '
    'and NULL already means "weight not set yet".';

COMMENT ON COLUMN profile_indicator.decided_by IS
    'The user who declared this variable accepted or excluded for the '
    'calculation — normally the officer entering the data, per SRS v2.3 §2.4. '
    'Exclusion is a recorded decision, never inferred from a blank weight.';

CREATE INDEX profile_indicator_consensus_ix
    ON profile_indicator (profile_id, consensus);

-- ----------------------------------------------------------------------------
-- 2. Publication state of a profile version.
--
--    published — THE official version. At most one active per scope (below).
--                Its scores are the ones served, exported and tiled.
--    draft     — a saved exploration belonging to a named owner. May be shared
--                by URL and persisted, but is never served as official and
--                never enters an export without its banner.
--    sandbox   — transient. Nothing may be persisted against it at all; see
--                the trigger in §4. This is the state a POST /compute/preview
--                run occupies, which is why it needs no storage.
-- ----------------------------------------------------------------------------
CREATE TYPE publication_state AS ENUM ('published', 'draft', 'sandbox');

ALTER TABLE vulnerability_profile
    ADD COLUMN publication      publication_state NOT NULL DEFAULT 'published',
    ADD COLUMN owner_user_id    BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    ADD COLUMN derived_from_id  BIGINT REFERENCES vulnerability_profile(id)
                                ON DELETE SET NULL;
-- NOTE: `panel_note` is NOT added here. The weights addendum already put it on
-- this table ("approved by Central expert panel, 2026-07-14"), and it remains
-- the right place to record offline sign-off — there is no in-app approval gate
-- in V1. Adding it again would fail. Caught by the semantic checker, not by
-- reading: pglast parsed the duplicate ADD COLUMN without complaint.

-- A draft or sandbox belongs to somebody. A published version belongs to the panel.
ALTER TABLE vulnerability_profile
    ADD CONSTRAINT vulnerability_profile_owner_required CHECK (
        publication = 'published' OR owner_user_id IS NOT NULL
    );

-- Exactly one official version may be active for a given scope at a time.
-- Partial unique index rather than a constraint, because it must ignore the
-- superseded versions that versioning deliberately keeps.
--
-- Pre-flight: the existing unique key includes `version`, so nothing has so far
-- stopped two versions of one scope both being is_active. If the seeded 243 (or
-- any later save) contains such a pair, the index below fails with a bare
-- duplicate-key error naming no rows. Fail first, with the rows named.
DO $$
DECLARE
    v_dupes TEXT;
BEGIN
    SELECT string_agg(code, ', ' ORDER BY code) INTO v_dupes
      FROM vulnerability_profile
     WHERE (province_id, sector_id, subsector_id, hazard_type_id) IN (
           SELECT province_id, sector_id, subsector_id, hazard_type_id
             FROM vulnerability_profile
            WHERE is_active
            GROUP BY province_id, sector_id, subsector_id, hazard_type_id
           HAVING count(*) > 1)
       AND is_active;

    IF v_dupes IS NOT NULL THEN
        RAISE EXCEPTION
            'More than one active profile version shares a scope, so a single '
            'official version cannot be identified. Deactivate the superseded '
            'ones first. Affected: %', v_dupes;
    END IF;
END $$;

CREATE UNIQUE INDEX vulnerability_profile_one_published_ix
    ON vulnerability_profile (province_id, sector_id, subsector_id, hazard_type_id)
    NULLS NOT DISTINCT
    WHERE publication = 'published' AND is_active;

COMMENT ON COLUMN vulnerability_profile.derived_from_id IS
    'The profile version this one was forked from. Lets the exploratory view '
    'answer "what did you change, relative to official?" without diffing '
    'membership sets by hand.';

-- ----------------------------------------------------------------------------
-- 3. Readiness, revised.
--
--    v_profile_readiness (weights addendum rev 4) counted EVERY membership.
--    Under this addendum a rejected variable must not block computation and
--    must not be expected to reach a weight — otherwise marking a variable
--    rejected would make its profile permanently uncomputable, which is the
--    opposite of the intent.
--
--    Replaces the rev 4 definition. The new columns are NOT appended at the
--    end — publication reads better beside is_active, and the consensus counts
--    beside n_variables — so CREATE OR REPLACE VIEW cannot be used here. It
--    only permits adding columns after the existing ones and fails with
--    "cannot change name of view column" otherwise. DROP first, without
--    CASCADE, so that if anything has come to depend on the view this stops
--    rather than silently dropping it too.
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS v_profile_readiness;

CREATE VIEW v_profile_readiness AS
SELECT vp.id AS profile_id, vp.code, vp.is_active, vp.publication,
       count(*) FILTER (WHERE pi.consensus IN ('agreed', 'contested'))  AS n_variables,
       count(*) FILTER (WHERE pi.consensus = 'contested')               AS n_contested,
       count(*) FILTER (WHERE pi.consensus = 'rejected')                AS n_rejected,
       count(*) FILTER (WHERE pi.consensus = 'proposed')                AS n_proposed,
       count(*) FILTER (WHERE pi.consensus IN ('agreed', 'contested')
                          AND pi.weight_pct IS NULL)                    AS n_missing_weights,
       ROUND(SUM(pi.weight_pct) FILTER (
             WHERE pi.domain = 'hazard'
               AND pi.consensus IN ('agreed', 'contested')), 3)         AS hazard_total,
       ROUND(SUM(pi.weight_pct) FILTER (
             WHERE pi.domain = 'exposure'
               AND pi.consensus IN ('agreed', 'contested')), 3)         AS exposure_total,
       (count(*) FILTER (WHERE pi.consensus IN ('agreed', 'contested')
                           AND pi.weight_pct IS NULL) = 0
        AND ROUND(SUM(pi.weight_pct) FILTER (
              WHERE pi.domain = 'hazard'
                AND pi.consensus IN ('agreed', 'contested')), 3)   = 100
        AND ROUND(SUM(pi.weight_pct) FILTER (
              WHERE pi.domain = 'exposure'
                AND pi.consensus IN ('agreed', 'contested')), 3) = 100) AS is_computable
FROM vulnerability_profile vp
JOIN profile_indicator pi ON pi.profile_id = vp.id
GROUP BY vp.id, vp.code, vp.is_active, vp.publication;

COMMENT ON VIEW v_profile_readiness IS
    'Which profiles are computable. Only agreed and contested memberships count '
    'toward the domain totals; rejected and proposed ones are reported but do '
    'not block. Supersedes the rev 4 definition in schema_weights_addendum.sql.';

-- The official set, for anything that serves scores to the public.
CREATE OR REPLACE VIEW v_official_profile AS
SELECT vp.*
FROM vulnerability_profile vp
WHERE vp.publication = 'published' AND vp.is_active;

COMMENT ON VIEW v_official_profile IS
    'The one active published version per scope. Public map, exports, tiles and '
    'OGC services read through this view and never from vulnerability_profile '
    'directly, so a draft cannot reach a public surface by omission.';

-- ----------------------------------------------------------------------------
-- 4. The sandbox boundary, enforced rather than documented.
--
--    A preview run is a pure re-weighting of values that are already stored and
--    already normalised — normalisation is national with fixed bounds (P-2/P-3),
--    so it does not depend on the weights at all. A preview therefore needs no
--    persistence, and permitting it would create scores with no reviewed
--    lineage that a later export could not distinguish from official ones.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reject_sandbox_result() RETURNS TRIGGER AS $$
DECLARE
    v_pub publication_state;
BEGIN
    SELECT publication INTO v_pub
      FROM vulnerability_profile WHERE id = NEW.profile_id;

    IF v_pub = 'sandbox' THEN
        RAISE EXCEPTION
            'vulnerability_result may not be written against a sandbox profile '
            '(profile_id=%). A sandbox run is a stateless preview; save it as a '
            'draft version first if the result is worth keeping.', NEW.profile_id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vulnerability_result_no_sandbox
    BEFORE INSERT OR UPDATE ON vulnerability_result
    FOR EACH ROW EXECUTE FUNCTION reject_sandbox_result();

-- ----------------------------------------------------------------------------
-- 4b. Two indexes per division: provincial and national.
--
--    Owner decision, 9 August 2026 (SRS v2.3 §2.2). A division carries TWO
--    vulnerability indexes for the same profile and period, because two sets of
--    normalised values sit behind it: one bounded by its province, one bounded
--    nationally. They coexist — the national one does not supersede, overwrite
--    or restate the provincial one.
--
--    schema.sql's unique key has no room for this: it is
--      (ds_division_id, profile_id, source, scenario_id, year_start, year_end)
--    so the second index would collide with the first. The scope must be part
--    of the key, and it is a stored attribute rather than a presentation choice
--    (FR-4.3c) — an unlabelled score is a defect, so the label has to exist in
--    the data.
-- ----------------------------------------------------------------------------
CREATE TYPE index_scope AS ENUM ('provincial', 'national');

ALTER TABLE vulnerability_result
    ADD COLUMN index_scope index_scope NOT NULL DEFAULT 'provincial',
    ADD COLUMN bound_min   DOUBLE PRECISION,   -- the min used, for explainability
    ADD COLUMN bound_max   DOUBLE PRECISION;   -- the max used (FR-5.26)

COMMENT ON COLUMN vulnerability_result.index_scope IS
    'Which bounds produced this index. provincial = the headline published '
    'score [P-14]. national = the cross-province comparison view, which exists '
    'only once every division in the official register holds a value. Never '
    'mix the two in one legend, export column or ranking.';

ALTER TABLE vulnerability_result
    DROP CONSTRAINT vulnerability_result_uniq;

ALTER TABLE vulnerability_result
    ADD CONSTRAINT vulnerability_result_uniq UNIQUE NULLS NOT DISTINCT
        (ds_division_id, profile_id, source, scenario_id,
         year_start, year_end, index_scope);

-- ----------------------------------------------------------------------------
-- 5. Track divergence — expert vs community vs data, side by side.
--
--    This needs no new storage: vulnerability_result is already keyed by
--    `source`, so the comparison Milinda wants between expert judgement and
--    public perception is a pivot over rows that already exist. It is a view,
--    not a feature.
--
--    NOTE: the honest instrument for "public perception" is the COMMUNITY
--    TRACK — structured, per division, collected. It is not an aggregate of
--    sandbox runs, which measure only the opinions of whoever happened to click.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_track_divergence AS
SELECT vr.ds_division_id,
       vr.profile_id,
       vr.hazard_type_id,
       vr.sector_id,
       vr.subsector_id,
       vr.scenario_id,
       vr.year_start,
       vr.year_end,
       vr.index_scope,          -- provincial and national must not be pooled
       MAX(vr.vulnerability_index) FILTER (WHERE vr.source = 'data')      AS v_data,
       MAX(vr.vulnerability_index) FILTER (WHERE vr.source = 'expert')    AS v_expert,
       MAX(vr.vulnerability_index) FILTER (WHERE vr.source = 'community') AS v_community,
       MAX(vr.vulnerability_index) FILTER (WHERE vr.source = 'expert')
         - MAX(vr.vulnerability_index) FILTER (WHERE vr.source = 'community')
                                                                          AS expert_minus_community
FROM vulnerability_result vr
GROUP BY vr.ds_division_id, vr.profile_id, vr.hazard_type_id, vr.sector_id,
         vr.subsector_id, vr.scenario_id, vr.year_start, vr.year_end,
         vr.index_scope;

COMMENT ON VIEW v_track_divergence IS
    'Expert, community and data scores for the same division, profile and index '
    'scope, plus the expert-community gap. Grouped by index_scope so a '
    'provincial score is never differenced against a national one. For the '
    'provincial scope both operands are rescaled within their own province '
    '(P-14), so the gap is meaningful within a province and must not be '
    'compared across one.';

COMMIT;
