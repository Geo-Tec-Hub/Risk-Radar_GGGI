-- ============================================================================
-- Risk Radar — D8: spatial layer + analysis toolbox data model
-- 2026-07-26 · applies on top of schema.sql (+ schema_weights_addendum.sql)
--
-- SAME PRINCIPLE AS THE INDICATOR CATALOG: no per-layer tables.
-- A new layer (LULC, water bodies, roads, buildings, agro-wells...) is a ROW in
-- spatial_layer, not a new table. Its attribute contract lives in JSONB and is
-- validated on import, so heterogeneity is data rather than schema.
--
-- DECISIONS BAKED IN
--   • Geometry is STORED in EPSG:4326 (what MapLibre wants).
--   • Area / length / density are COMPUTED in EPSG:5235 (SLD99, Sri Lanka grid).
--     Computing them in 4326 would give degrees, not metres - the mistake this
--     model exists to prevent (logged 2026-06-20).
--   • The toolbox never writes to indicator_value directly. It produces
--     computation_result rows, which a user explicitly COMMITS. That keeps
--     "someone ran a calculation" separate from "this is an official value",
--     and every committed number keeps a link back to the job that made it.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Layer registry — one row per spatial layer
-- ----------------------------------------------------------------------------
CREATE TYPE spatial_geometry_type AS ENUM ('POINT', 'LINESTRING', 'POLYGON', 'MIXED');

CREATE TABLE spatial_layer (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code             TEXT NOT NULL UNIQUE,          -- LULC, WATER_BODY, ROAD, BUILDING
    name             TEXT NOT NULL,
    description      TEXT,
    geometry_type    spatial_geometry_type NOT NULL,
    -- national attribute contract: {"field": {"type":"number|string|boolean",
    --                                          "required":true, "enum":[...]}}
    attribute_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    srid_source      INTEGER,                       -- CRS the data arrived in
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT spatial_layer_schema_is_object CHECK (jsonb_typeof(attribute_schema) = 'object')
);

-- ----------------------------------------------------------------------------
-- 2. Features
--    ds_division_id is the PRIMARY division for indexing convenience and is
--    NULLABLE on purpose: a road or river crosses divisions, so pinning it to
--    one would be a lie. Per-division apportionment is the toolbox's job
--    (ST_Intersection), not a column.
-- ----------------------------------------------------------------------------
CREATE TABLE spatial_feature (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    layer_id       BIGINT NOT NULL REFERENCES spatial_layer(id) ON DELETE CASCADE,
    ds_division_id BIGINT REFERENCES ds_division(id)            ON DELETE SET NULL,
    feature_code   TEXT,                            -- source system id, if any
    geom           geometry(Geometry, 4326) NOT NULL,
    attributes     JSONB NOT NULL DEFAULT '{}'::jsonb,
    import_batch_id BIGINT REFERENCES import_batch(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT spatial_feature_attrs_object CHECK (jsonb_typeof(attributes) = 'object'),
    CONSTRAINT spatial_feature_geom_valid   CHECK (ST_IsValid(geom)),
    CONSTRAINT spatial_feature_code_uniq    UNIQUE NULLS NOT DISTINCT (layer_id, feature_code)
);
CREATE INDEX spatial_feature_geom_gix  ON spatial_feature USING GIST (geom);
CREATE INDEX spatial_feature_layer_ix  ON spatial_feature (layer_id);
CREATE INDEX spatial_feature_dsd_ix    ON spatial_feature (ds_division_id);
CREATE INDEX spatial_feature_attrs_gix ON spatial_feature USING GIN (attributes);

-- geometry must match the layer's declared type
CREATE OR REPLACE FUNCTION spatial_feature_type_guard() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE want spatial_geometry_type; got TEXT;
BEGIN
    SELECT geometry_type INTO want FROM spatial_layer WHERE id = NEW.layer_id;
    IF want = 'MIXED' THEN RETURN NEW; END IF;
    got := upper(replace(ST_GeometryType(NEW.geom), 'ST_', ''));
    got := regexp_replace(got, '^MULTI', '');
    IF got <> want::TEXT THEN
        RAISE EXCEPTION 'Layer % expects % geometry, got %',
              NEW.layer_id, want, got;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER spatial_feature_type_guard_trg
    BEFORE INSERT OR UPDATE OF geom, layer_id ON spatial_feature
    FOR EACH ROW EXECUTE FUNCTION spatial_feature_type_guard();

-- attributes must satisfy the layer's national contract
CREATE OR REPLACE FUNCTION spatial_feature_attr_guard() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE sch JSONB; k TEXT; spec JSONB; v JSONB; want TEXT;
BEGIN
    SELECT attribute_schema INTO sch FROM spatial_layer WHERE id = NEW.layer_id;
    IF sch IS NULL OR sch = '{}'::jsonb THEN RETURN NEW; END IF;
    FOR k, spec IN SELECT * FROM jsonb_each(sch) LOOP
        v := NEW.attributes -> k;
        IF COALESCE((spec ->> 'required')::boolean, FALSE)
           AND (v IS NULL OR jsonb_typeof(v) = 'null') THEN
            RAISE EXCEPTION 'Layer % requires attribute "%"', NEW.layer_id, k;
        END IF;
        want := spec ->> 'type';
        IF v IS NOT NULL AND jsonb_typeof(v) <> 'null'
           AND want IS NOT NULL AND jsonb_typeof(v) <> want THEN
            RAISE EXCEPTION 'Attribute "%" on layer % must be %, got %',
                  k, NEW.layer_id, want, jsonb_typeof(v);
        END IF;
    END LOOP;
    RETURN NEW;
END $$;

CREATE TRIGGER spatial_feature_attr_guard_trg
    BEFORE INSERT OR UPDATE OF attributes, layer_id ON spatial_feature
    FOR EACH ROW EXECUTE FUNCTION spatial_feature_attr_guard();


-- ----------------------------------------------------------------------------
-- 3. Operation registry — what the toolbox can do
-- ----------------------------------------------------------------------------
CREATE TYPE spatial_operation_kind AS ENUM
    ('area', 'length', 'count', 'density', 'share', 'distance', 'zonal_stat');

CREATE TABLE spatial_operation (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code          TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    kind          spatial_operation_kind NOT NULL,
    description   TEXT,
    -- expected params, e.g. {"attribute_filter":{"type":"object","required":false}}
    params_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_unit   TEXT,                              -- km2, km, count, per_km2, %
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT spatial_operation_params_object CHECK (jsonb_typeof(params_schema) = 'object')
);


-- ----------------------------------------------------------------------------
-- 4. Jobs and results
-- ----------------------------------------------------------------------------
CREATE TYPE computation_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'committed');

CREATE TABLE computation_job (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    layer_id       BIGINT NOT NULL REFERENCES spatial_layer(id)     ON DELETE RESTRICT,
    operation_id   BIGINT NOT NULL REFERENCES spatial_operation(id) ON DELETE RESTRICT,
    -- where the output is destined, once committed
    indicator_id   BIGINT REFERENCES indicator_catalog(id) ON DELETE SET NULL,
    scenario_id    BIGINT REFERENCES ssp_scenario(id)      ON DELETE SET NULL,
    year_start     INTEGER,
    year_end       INTEGER,
    params         JSONB NOT NULL DEFAULT '{}'::jsonb,
    status         computation_status NOT NULL DEFAULT 'queued',
    error_message  TEXT,
    requested_by   BIGINT NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    requested_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at    TIMESTAMPTZ,
    committed_by   BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    committed_at   TIMESTAMPTZ,
    CONSTRAINT computation_job_period_valid CHECK (
        year_end IS NULL OR year_start IS NULL OR year_end >= year_start),
    CONSTRAINT computation_job_commit_chk CHECK (
        (status = 'committed') = (committed_at IS NOT NULL)),
    -- committing without saying which indicator it becomes is meaningless
    CONSTRAINT computation_job_commit_target_chk CHECK (
        status <> 'committed' OR indicator_id IS NOT NULL)
);
CREATE INDEX computation_job_status_ix ON computation_job (status, requested_at DESC);

CREATE TABLE computation_result (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_id           BIGINT NOT NULL REFERENCES computation_job(id) ON DELETE CASCADE,
    ds_division_id   BIGINT NOT NULL REFERENCES ds_division(id)     ON DELETE CASCADE,
    value            DOUBLE PRECISION NOT NULL,
    unit             TEXT,
    feature_count    INTEGER,                    -- how many features contributed
    indicator_value_id BIGINT REFERENCES indicator_value(id) ON DELETE SET NULL,
    UNIQUE (job_id, ds_division_id)
);
CREATE INDEX computation_result_job_ix ON computation_result (job_id);


-- ----------------------------------------------------------------------------
-- 5. Lineage on indicator_value — "which job produced this number?"
--    derivation_type already exists in schema.sql ('raw_upload','manual','computed').
-- ----------------------------------------------------------------------------
ALTER TABLE indicator_value
    ADD COLUMN computation_job_id BIGINT REFERENCES computation_job(id) ON DELETE SET NULL;
CREATE INDEX indicator_value_job_ix ON indicator_value (computation_job_id);

-- a computed value must say where it came from, and an uploaded one must not pretend
ALTER TABLE indicator_value
    ADD CONSTRAINT indicator_value_lineage_chk CHECK (
        (derivation = 'computed' AND computation_job_id IS NOT NULL) OR
        (derivation <> 'computed' AND computation_job_id IS NULL));


-- ----------------------------------------------------------------------------
-- 6. Metric helpers — always compute in EPSG:5235, never in degrees
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sl_area_km2(g geometry) RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT ST_Area(ST_Transform(g, 5235)) / 1000000.0;
$$;

CREATE OR REPLACE FUNCTION sl_length_km(g geometry) RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT ST_Length(ST_Transform(g, 5235)) / 1000.0;
$$;

-- Apportion a layer to DS divisions. Polygons contribute intersected AREA,
-- lines intersected LENGTH, points a COUNT. This is the core of the toolbox.
CREATE OR REPLACE FUNCTION sl_apportion(
    p_layer_id BIGINT,
    p_kind     spatial_operation_kind,
    p_filter   JSONB DEFAULT NULL      -- attribute equality filter, e.g. {"class":"paddy"}
) RETURNS TABLE (ds_division_id BIGINT, value DOUBLE PRECISION, feature_count INTEGER)
LANGUAGE sql STABLE AS $$
    SELECT d.id,
           CASE p_kind
               WHEN 'area'   THEN COALESCE(SUM(sl_area_km2(ST_Intersection(f.geom, d.geom))), 0)
               WHEN 'length' THEN COALESCE(SUM(sl_length_km(ST_Intersection(f.geom, d.geom))), 0)
               WHEN 'count'  THEN COUNT(f.id)::DOUBLE PRECISION
               ELSE COALESCE(SUM(sl_area_km2(ST_Intersection(f.geom, d.geom))), 0)
           END,
           COUNT(f.id)::INTEGER
      FROM ds_division d
      LEFT JOIN spatial_feature f
             ON f.layer_id = p_layer_id
            AND ST_Intersects(f.geom, d.geom)
            AND (p_filter IS NULL OR f.attributes @> p_filter)
     GROUP BY d.id;
$$;

COMMIT;


-- ============================================================================
-- Seed: the four layers the map prototype already toggles, plus the toolbox
-- ============================================================================
BEGIN;

INSERT INTO spatial_layer (code, name, geometry_type, attribute_schema) VALUES
 ('LULC',       'Land use / land cover', 'POLYGON',
  '{"class":{"type":"string","required":true},"year":{"type":"number","required":false}}'),
 ('WATER_BODY', 'Water bodies (tanks, reservoirs, lagoons)', 'POLYGON',
  '{"name":{"type":"string","required":false},"type":{"type":"string","required":true},"perennial":{"type":"boolean","required":false}}'),
 ('ROAD',       'Road network', 'LINESTRING',
  '{"class":{"type":"string","required":true},"surface":{"type":"string","required":false}}'),
 ('BUILDING',   'Building footprints', 'POLYGON',
  '{"use":{"type":"string","required":false},"storeys":{"type":"number","required":false}}')
ON CONFLICT (code) DO NOTHING;

INSERT INTO spatial_operation (code, name, kind, output_unit, description, params_schema) VALUES
 ('AREA_KM2',      'Total area per DS division',            'area',     'km2',
  'Sum of feature area clipped to each DS division, computed in EPSG:5235.',
  '{"attribute_filter":{"type":"object","required":false}}'),
 ('LENGTH_KM',     'Total length per DS division',          'length',   'km',
  'Sum of line length clipped to each DS division, computed in EPSG:5235.',
  '{"attribute_filter":{"type":"object","required":false}}'),
 ('FEATURE_COUNT', 'Feature count per DS division',         'count',    'count',
  'Number of features intersecting each DS division.',
  '{"attribute_filter":{"type":"object","required":false}}'),
 ('AREA_SHARE_PCT','Share of DS-division area',             'share',    '%',
  'Clipped feature area as a percentage of the DS division area (EPSG:5235).',
  '{"attribute_filter":{"type":"object","required":false}}'),
 ('DENSITY_PER_KM2','Feature density per DS division',      'density',  'per_km2',
  'Feature count (or length) divided by DS-division area in km2.',
  '{"attribute_filter":{"type":"object","required":false},"numerator":{"type":"string","required":false}}'),
 ('DIST_TO_NEAREST','Mean distance to nearest feature',     'distance', 'km',
  'Mean distance from DS-division centroid to the nearest feature (EPSG:5235).',
  '{"attribute_filter":{"type":"object","required":false}}')
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- ============================================================================
-- Toolbox flow (for B8 / F6)
--
--   1. User picks layer + operation + optional attribute filter, and the
--      indicator the output should become.  -> INSERT computation_job (queued)
--   2. Worker runs sl_apportion(), writes one computation_result per DS
--      division, sets status='succeeded'.
--   3. User reviews the numbers on the map. Nothing official yet.
--   4. User COMMITS: for each result INSERT INTO indicator_value
--        (derivation='computed', computation_job_id=<job>, raw_value=<value>)
--      then set computation_result.indicator_value_id and job status='committed'.
--
--   The lineage CHECK on indicator_value makes step 4 the only way a computed
--   number can exist - a computed value without a job is rejected outright.
-- ============================================================================
