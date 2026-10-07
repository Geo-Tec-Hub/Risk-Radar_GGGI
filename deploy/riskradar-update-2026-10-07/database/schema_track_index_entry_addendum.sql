-- schema_track_index_entry_addendum.sql
-- Added 2026-10-02.
--
-- DIRECT INDEX ENTRY ON THE EXPERT AND COMMUNITY TRACKS (client request,
-- 30 Sep 2026; owner decision 2 Oct 2026).
--
-- An expert or community member may assess a division in ONE of two ways:
--   * by parameters -- a raw figure for every weighted variable (as before,
--     stored in indicator_value), or
--   * by index      -- just a Hazard index and a Potential Exposure index,
--     each on the 0-1 scale, stored HERE.
-- A person uses one way per division, profile scope and period: saving one
-- clears their entry of the other kind, so the two are never mixed for the
-- same person.
--
-- Only H and E are stored. The raw index (H x E) and the normalised score are
-- always COMPUTED by the engine (app/engine/track.py), never typed: a typed raw
-- index could contradict H x E, and the provincial rescale depends on every
-- division of the province, which one person cannot know.
--
-- Keyed by the profile's SCOPE (sector / subsector / hazard), not its id, so an
-- entry survives a weights save that mints a new profile version -- exactly as
-- the parameter figures in indicator_value do.

BEGIN;

CREATE TABLE IF NOT EXISTS track_index_entry (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ds_division_id  BIGINT NOT NULL REFERENCES ds_division(id) ON DELETE CASCADE,
    sector_id       BIGINT NOT NULL REFERENCES sector(id) ON DELETE CASCADE,
    subsector_id    BIGINT REFERENCES subsector(id) ON DELETE CASCADE,
    hazard_type_id  BIGINT NOT NULL REFERENCES hazard_type(id) ON DELETE CASCADE,
    source          source_type NOT NULL CHECK (source IN ('expert', 'community')),
    user_id         BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    year_start      INTEGER NOT NULL,
    year_end        INTEGER NOT NULL CHECK (year_end >= year_start),
    hazard_index    DOUBLE PRECISION NOT NULL CHECK (hazard_index BETWEEN 0 AND 1),
    exposure_index  DOUBLE PRECISION NOT NULL CHECK (exposure_index BETWEEN 0 AND 1),
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS track_index_entry_uniq
    ON track_index_entry (ds_division_id, sector_id, COALESCE(subsector_id, 0),
                          hazard_type_id, source, user_id, year_start, year_end);

COMMENT ON TABLE track_index_entry IS
    'Expert/community assessment entered as indexes (H and E, 0-1) instead of '
    'parameter figures. Raw H x E and the normalised score are computed, never '
    'stored here. See schema_track_index_entry_addendum.sql.';

COMMIT;
