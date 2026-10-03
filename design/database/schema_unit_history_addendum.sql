-- schema_unit_history_addendum.sql
-- Added 2026-10-02.
--
-- WHY. Units were blank for every variable (FINAL_VARIABLES.xlsx never had a
-- unit column). They are now set in the app, and not only by administrators:
-- data officers and experts may change them too (owner decision, 2 Oct 2026).
-- A unit belongs to the VARIABLE, so one province's change is seen by every
-- province and sector that reads it. Every change is therefore recorded here
-- -- old value, new value, who, when -- so a wrong change is visible and can be
-- put back. A unit is descriptive: changing it never touches a value, weight,
-- profile version or score.

BEGIN;

CREATE TABLE IF NOT EXISTS indicator_unit_change (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    indicator_id BIGINT NOT NULL REFERENCES indicator_catalog(id) ON DELETE CASCADE,
    old_unit     TEXT,
    new_unit     TEXT,
    changed_by   BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS indicator_unit_change_ind_idx
    ON indicator_unit_change (indicator_id, changed_at DESC);

COMMENT ON TABLE indicator_unit_change IS
    'History of unit edits on indicator_catalog.unit: who changed it, when, and '
    'what it was before. Written by PUT /api/admin/catalog/{id}/unit.';

COMMIT;
