-- schema_param_source_addendum.sql
-- Added 2026-10-07 (client note NOTED_4_Revised).
--
-- DATA SOURCE PER PARAMETER, PER PROVINCE. "The source for each parameter
-- should be included. The same variable may have different sources for
-- different provinces." So the source is stored per (variable, province), with
-- a catalogue-wide default used where a province has not set its own.
--
-- This is the source of the PARAMETER (e.g. "Dept. of Census and Statistics").
-- The DATA_SOURCE column in the upload workbooks is unchanged: it still records
-- where an individual division's figure came from.
--
-- Every change to a source, and to a variable's default direction on the Model
-- page, is recorded in indicator_meta_change (who, when, old, new).

BEGIN;

ALTER TABLE indicator_catalog
    ADD COLUMN IF NOT EXISTS default_data_source TEXT;

CREATE TABLE IF NOT EXISTS indicator_province_source (
    indicator_id BIGINT   NOT NULL REFERENCES indicator_catalog(id) ON DELETE CASCADE,
    province_id  SMALLINT NOT NULL REFERENCES province(id) ON DELETE CASCADE,
    data_source  TEXT     NOT NULL CHECK (length(btrim(data_source)) > 0),
    updated_by   BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (indicator_id, province_id)
);

CREATE TABLE IF NOT EXISTS indicator_meta_change (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    indicator_id BIGINT NOT NULL REFERENCES indicator_catalog(id) ON DELETE CASCADE,
    province_id  SMALLINT REFERENCES province(id) ON DELETE CASCADE,  -- NULL = catalogue-wide
    field        TEXT NOT NULL CHECK (field IN ('data_source', 'direction')),
    old_value    TEXT,
    new_value    TEXT,
    changed_by   BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS indicator_meta_change_ind_idx
    ON indicator_meta_change (indicator_id, changed_at DESC);

COMMENT ON TABLE indicator_province_source IS
    'Data source of a parameter in one province. Falls back to '
    'indicator_catalog.default_data_source where absent.';
COMMENT ON TABLE indicator_meta_change IS
    'History of data-source and default-direction edits (Model page / weights page).';

COMMIT;
