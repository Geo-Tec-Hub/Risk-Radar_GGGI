-- schema_signed_values_addendum.sql
-- Added 2026-09-03, after the Central Province panel's returned data.
--
-- WHY.  Every upload template declares "raw values must be numbers >= 0", and
-- the template reader enforced it globally.  On its first real payload that
-- rule rejected 498 of 14,020 values across exactly two variables:
--
--     THREE_DAY_CUMULATIVE_RAINFALL   -30.05 .. 57.05   median -0.01
--     OCCURRENCE_WARM_DAYS             -1.25 ..  3.50   median  1.78
--
-- A median of -0.01 is not a rainfall depth.  Both read as a CHANGE or TREND
-- rather than a quantity, and for those a negative number is meaningful, not an
-- error.  Every other variable in the same files is strictly positive - very
-- wet days sits at 102.8-139.5, SPI at 1.44-1.88 - so the rule is right in
-- general and wrong for these two.
--
-- The fix is therefore a per-variable declaration, NOT a relaxed global rule.
-- Loosening the check everywhere would have silently accepted a negative
-- population count or a negative land extent, which is exactly the class of
-- defect the check exists to catch.
--
-- WHAT IS STILL OPEN.  Whether these are anomalies against a baseline or trends
-- per decade is not yet established, and neither is the sign convention.  The
-- enum deliberately says only 'signed' rather than guessing between them.
-- Normalisation is unaffected either way: min-max is offset-invariant, so a
-- signed series normalises correctly.  Only DIRECTION could be wrong, and that
-- is one column to change plus a recompute - cheap precisely because
-- normalisation is server-side (design principle 1).

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'indicator_value_kind') THEN
        CREATE TYPE indicator_value_kind AS ENUM (
            'absolute',  -- a quantity: counts, extents, populations, depths
            'signed'     -- a change or trend, so negative is meaningful
        );
    END IF;
END $$;

ALTER TABLE indicator_catalog
    ADD COLUMN IF NOT EXISTS value_kind indicator_value_kind
        NOT NULL DEFAULT 'absolute';

COMMENT ON COLUMN indicator_catalog.value_kind IS
    'absolute = a quantity, must be >= 0 on import. signed = a change or trend, '
    'where a negative value is meaningful. Set per variable on evidence, never '
    'by relaxing the import rule globally.';

UPDATE indicator_catalog
   SET value_kind = 'signed',
       description = COALESCE(description || ' | ', '')
           || 'Signed: the Central panel supplied negative values (2026-09-03). '
              'Whether these are anomalies against a baseline or per-decade '
              'trends, and the intended sign convention, are with the panel.'
 WHERE code IN ('THREE_DAY_CUMULATIVE_RAINFALL', 'OCCURRENCE_WARM_DAYS')
   AND value_kind <> 'signed';

COMMIT;
