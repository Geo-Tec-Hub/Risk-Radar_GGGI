-- schema_track_withdrawal_addendum.sql
-- Added 2026-11-09 (client request NOTED-14).
--
-- REMOVING AN EXPERT / COMMUNITY ASSESSMENT.
--
-- A division's track score for one profile scope (sector / subsector / hazard)
-- can be withdrawn from the map. Deleting the figures alone is not enough:
-- parameter figures live in indicator_value keyed by VARIABLE, not by profile,
-- and most variables are shared -- every drought variable by every drought
-- profile, a cattle exposure variable by cattle-drought AND cattle-flood. So
-- deleting them would also wipe other sectors' expert maps, and keeping them
-- means the next recompute scores the withdrawn profile again.
--
-- A row here says "this scope is withdrawn for this division on this track";
-- app/engine/track.py refuses to score it while the row exists. Figures that
-- belong to no other profile are deleted with it; shared figures are kept for
-- the profiles still using them. Saving a new assessment for the same scope
-- deletes the row, so withdrawing is undone by simply assessing again.

BEGIN;

CREATE TABLE IF NOT EXISTS track_withdrawal (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ds_division_id  BIGINT NOT NULL REFERENCES ds_division(id) ON DELETE CASCADE,
    sector_id       BIGINT NOT NULL REFERENCES sector(id) ON DELETE CASCADE,
    subsector_id    BIGINT REFERENCES subsector(id) ON DELETE CASCADE,
    hazard_type_id  BIGINT NOT NULL REFERENCES hazard_type(id) ON DELETE CASCADE,
    source          source_type NOT NULL CHECK (source IN ('expert', 'community')),
    year_start      INTEGER NOT NULL,
    year_end        INTEGER NOT NULL CHECK (year_end >= year_start),
    withdrawn_by    BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    withdrawn_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    note            TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS track_withdrawal_uniq
    ON track_withdrawal (ds_division_id, sector_id, COALESCE(subsector_id, 0),
                         hazard_type_id, source, year_start, year_end);

COMMENT ON TABLE track_withdrawal IS
    'An expert/community assessment removed from the map for one division and '
    'profile scope. The track engine does not score a withdrawn scope; a new '
    'save deletes the row. See schema_track_withdrawal_addendum.sql.';

-- The API connects as the database owner in Docker; this grant is for the
-- deployments that use a separate application role.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'riskradar_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON track_withdrawal TO riskradar_app;
    END IF;
END $$;

COMMIT;
