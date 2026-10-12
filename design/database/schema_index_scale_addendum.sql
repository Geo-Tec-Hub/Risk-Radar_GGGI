-- schema_index_scale_addendum.sql
-- Added 2026-10-12.
--
-- INDEX ENTRY ON A 0-4 SCALE. Experts rate the Hazard and Potential Exposure
-- indexes on 0-4; the model works on 0-1. The form now lets the person pick the
-- scale (0-1 or 0-4) and the value is converted linearly (value / 4) before it
-- is scored. hazard_index / exposure_index keep the 0-1 value the engine uses;
-- the figure exactly as typed and its scale are kept beside it, so the record
-- always shows what the expert actually entered.

BEGIN;

ALTER TABLE track_index_entry
    ADD COLUMN IF NOT EXISTS entered_scale    SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS hazard_entered   DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS exposure_entered DOUBLE PRECISION;

DO $$ BEGIN
    ALTER TABLE track_index_entry
        ADD CONSTRAINT track_index_entry_scale_chk CHECK (entered_scale IN (1, 4));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN track_index_entry.entered_scale IS
    'Top of the scale the person used: 1 (0-1) or 4 (0-4). hazard_index and '
    'exposure_index are always the converted 0-1 values.';

COMMIT;
