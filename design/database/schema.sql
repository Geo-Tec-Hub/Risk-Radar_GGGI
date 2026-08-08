-- ============================================================================
-- Climate Vulnerability Web-GIS — Core Schema (D3, rev 6)
-- rev 6 (2026-07-18, expert input): data arrive as YEAR RANGES (e.g.
-- 2020–2025, 2025–2030), not single years. All time-bearing fact tables use
-- year_start/year_end (single-year data: year_start = year_end). Engine rule
-- for boundary years shared by two periods: latest period wins (to confirm).
-- PostgreSQL 16 + PostGIS + pgvector
--
-- Design principles (PROJECT_GUIDE.md §1):
--   * Config-driven: hazard types, sectors, subsectors, parameters live in
--     indicator_catalog — adding one is data entry, not a migration.
--   * Weighting layer (rev 2, from paddy sample 2026-07-02): variable sets +
--     weights are defined per sector×hazard_type in vulnerability_profile /
--     profile_indicator. Variables are context-free and reusable; weights and
--     +/- relationship are contextual. Rev 4 (from 9-province workbooks,
--     2026-07-02): profiles are PROVINCE-scoped — the same sector×hazard has
--     different variable sets/weights per province. province_id NULL on a
--     profile = national fallback; the engine picks the division's province
--     profile first, then falls back to national.
--   * One indicator_value table for all three tracks, distinguished by a
--     `source` provenance column (data / expert / community) + user_id.
--   * Normalization is server-side; raw_value is what uploads carry,
--     normalized_value is computed per catalog config.
--   * One Postgres instance serves PostGIS geometry AND pgvector RAG index.
--
-- Note: D8 (spatial layer + toolbox) will ALTER indicator_value to add
-- computation_job_id lineage and add spatial_* tables in spatial-model.sql.
-- Requires PostgreSQL >= 15 (UNIQUE NULLS NOT DISTINCT).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
-- pgvector is NOT required by this file. The agent RAG tables that need it were
-- moved to schema_agent_pgvector.sql (2026-07-26) so the core database can be
-- built without pgvector, which is awkward to install on Windows and is not
-- needed until Phase 3.

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
CREATE TYPE source_type          AS ENUM ('data', 'expert', 'community');
CREATE TYPE domain_type          AS ENUM ('hazard', 'exposure');
CREATE TYPE normalization_method AS ENUM ('minmax', 'zscore', 'none');
CREATE TYPE indicator_direction  AS ENUM ('higher_is_worse', 'higher_is_better');
CREATE TYPE derivation_type      AS ENUM ('raw_upload', 'manual', 'computed');
CREATE TYPE norm_scope_type      AS ENUM ('pooled', 'per_year', 'fixed_bounds');
CREATE TYPE catalog_status       AS ENUM ('pending', 'active', 'retired');

-- ----------------------------------------------------------------------------
-- Auth: users / roles
-- ----------------------------------------------------------------------------
CREATE TABLE role (
    id          SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,          -- admin | analyst | expert | community
    name        TEXT NOT NULL,
    description TEXT
);

CREATE TABLE app_user (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    organization  TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_role (
    user_id BIGINT   NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role_id SMALLINT NOT NULL REFERENCES role(id)     ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

INSERT INTO role (code, name) VALUES
    ('admin',     'Administrator'),
    ('analyst',   'Data Analyst'),
    ('expert',    'External Expert'),
    ('community', 'Community Member');

-- ----------------------------------------------------------------------------
-- Geography: provinces + DS divisions (admin unit of analysis)
-- Geometry stored in EPSG:4326 for the map; metric computations (area etc.)
-- are done in EPSG:5235 (SLD99 / Sri Lanka grid) at compute time.
-- ----------------------------------------------------------------------------
CREATE TABLE province (
    id   SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,   -- CEN | EAS | NCE | NOR | NWE | SAB | SOU | UVA | WES
    name TEXT NOT NULL
);

INSERT INTO province (code, name) VALUES
    ('CEN','Central'), ('EAS','Eastern'), ('NCE','North Central'),
    ('NOR','Northern'), ('NWE','North Western'), ('SAB','Sabaragamuwa'),
    ('SOU','Southern'), ('UVA','Uva'), ('WES','Western');

CREATE TABLE ds_division (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code          TEXT NOT NULL UNIQUE,        -- official DSD code
    name          TEXT NOT NULL,
    district_code TEXT,
    district_name TEXT,
    province_id   SMALLINT NOT NULL REFERENCES province(id) ON DELETE RESTRICT,
    geom          geometry(MultiPolygon, 4326) NOT NULL,
    area_km2      DOUBLE PRECISION,            -- precomputed in EPSG:5235
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ds_division_geom_gix ON ds_division USING gist (geom);

-- ----------------------------------------------------------------------------
-- Classification: hazard types, 13 sectors, subsectors (rows, not tables)
-- ----------------------------------------------------------------------------
CREATE TABLE hazard_type (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,          -- flood | drought | landslide | ...
    name        TEXT NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE sector (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    description TEXT,
    weight      NUMERIC(6,4) NOT NULL DEFAULT 1.0,  -- optional per-sector weight
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE subsector (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sector_id   BIGINT NOT NULL REFERENCES sector(id) ON DELETE CASCADE,
    code        TEXT NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (sector_id, code)
);

-- ----------------------------------------------------------------------------
-- indicator_catalog — pure VARIABLE REGISTRY.
-- One row per measurable variable, with globally unique code
-- (e.g. PADDY_EXTENT_ASW — per-sheet labels like E1/H1 are NOT codes; they
-- live on profile_indicator.label). A variable is context-free here: the
-- same variable can serve as exposure in one profile and hazard in another,
-- and is entered once per DS division regardless of how many profiles use it.
-- Membership, weights, and +/- relationship live in vulnerability_profile /
-- profile_indicator below. domain/hazard/sector fields here are optional
-- classification hints only (default form grouping), not constraints.
-- ----------------------------------------------------------------------------
CREATE TABLE indicator_catalog (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code           TEXT NOT NULL UNIQUE,       -- stable global key used in uploads
    name           TEXT NOT NULL,
    description    TEXT,
    domain         domain_type,                -- hint: typical usage
    hazard_type_id BIGINT REFERENCES hazard_type(id) ON DELETE SET NULL,  -- hint
    sector_id      BIGINT REFERENCES sector(id)      ON DELETE SET NULL,  -- hint
    subsector_id   BIGINT REFERENCES subsector(id)   ON DELETE SET NULL,  -- hint
    unit           TEXT,
    norm_method    normalization_method NOT NULL DEFAULT 'minmax',
    -- rev 3: normalization scope across years. 'pooled' (default) = min/max
    -- computed across ALL years so a division's index is comparable over time;
    -- 'per_year' = classic within-year ranking; 'fixed_bounds' = use
    -- norm_min/norm_max. Engine rule: if an indicator has no value for the
    -- requested year, use the latest available value as-of that year.
    norm_scope     norm_scope_type      NOT NULL DEFAULT 'pooled',
    direction      indicator_direction  NOT NULL DEFAULT 'higher_is_worse', -- default; profile may override
    norm_min       DOUBLE PRECISION,           -- fixed bounds (norm_scope='fixed_bounds')
    norm_max       DOUBLE PRECISION,
    -- rev 5: catalog governance. Variables proposed during upload
    -- reconciliation land as 'pending' (values held until admin approves or
    -- merges into an existing variable). Only 'active' variables can join
    -- profiles. 'retired' preserves history without deletion.
    status         catalog_status NOT NULL DEFAULT 'active',
    proposed_by    BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX indicator_catalog_domain_ix ON indicator_catalog (domain, status);

-- ----------------------------------------------------------------------------
-- indicator_alias — rev 5: remembered column-header mappings from the upload
-- reconciliation wizard. When a legacy sheet's header (e.g. 'Distance_to_Sea')
-- is mapped to a catalog variable once, the alias persists and future uploads
-- auto-map silently. Matching is case-insensitive.
-- ----------------------------------------------------------------------------
CREATE TABLE indicator_alias (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    indicator_id BIGINT NOT NULL REFERENCES indicator_catalog(id) ON DELETE CASCADE,
    alias        TEXT NOT NULL,
    created_by   BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX indicator_alias_norm_ux ON indicator_alias (lower(alias));

-- ----------------------------------------------------------------------------
-- vulnerability_profile + profile_indicator — the WEIGHTING LAYER.
-- Variable sets and weights are defined per PROVINCE × sector(×subsector) ×
-- hazard type, e.g. Central/Paddy–Flood vs Eastern/Paddy–Flood (rev 4: the
-- 9-province workbooks show these genuinely differ). One workbook = one
-- profile; one variable row = one profile_indicator (weight % + relationship).
-- province_id NULL = national fallback profile (used when a division's
-- province has no specific profile).
-- `version` allows methodology revisions without losing old results.
-- Weight sums (=100 per domain) are validated service-side at activation.
-- ----------------------------------------------------------------------------
CREATE TABLE vulnerability_profile (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code           TEXT NOT NULL UNIQUE,       -- e.g. PADDY_FLOOD_CEN_V1
    name           TEXT NOT NULL,
    province_id    SMALLINT REFERENCES province(id)           ON DELETE CASCADE,
    sector_id      BIGINT NOT NULL REFERENCES sector(id)      ON DELETE CASCADE,
    subsector_id   BIGINT REFERENCES subsector(id)            ON DELETE CASCADE,
    hazard_type_id BIGINT NOT NULL REFERENCES hazard_type(id) ON DELETE CASCADE,
    version        INTEGER NOT NULL DEFAULT 1,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    description    TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT vulnerability_profile_uniq UNIQUE NULLS NOT DISTINCT
        (province_id, sector_id, subsector_id, hazard_type_id, version)
);
CREATE INDEX vulnerability_profile_scope_ix
    ON vulnerability_profile (province_id, sector_id, hazard_type_id) WHERE is_active;

CREATE TABLE profile_indicator (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id   BIGINT NOT NULL REFERENCES vulnerability_profile(id) ON DELETE CASCADE,
    indicator_id BIGINT NOT NULL REFERENCES indicator_catalog(id)     ON DELETE RESTRICT,
    domain       domain_type NOT NULL,          -- role of the variable IN THIS profile
    label        TEXT,                          -- display label from source sheet (H1, E5, ...)
    weight_pct   NUMERIC(6,3) NOT NULL CHECK (weight_pct > 0 AND weight_pct <= 100),
    relationship indicator_direction NOT NULL DEFAULT 'higher_is_worse',  -- '+' / '-'
    notes        TEXT,
    UNIQUE (profile_id, domain, indicator_id)
);
CREATE INDEX profile_indicator_profile_ix ON profile_indicator (profile_id, domain);

-- ----------------------------------------------------------------------------
-- SSP scenarios + scenario parameters
-- ----------------------------------------------------------------------------
CREATE TABLE ssp_scenario (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,          -- SSP1 .. SSP5
    name        TEXT NOT NULL,
    description TEXT,
    horizon_year INTEGER,                      -- e.g. 2050
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO ssp_scenario (code, name) VALUES
    ('SSP1', 'SSP1 — Sustainability'),
    ('SSP2', 'SSP2 — Middle of the Road'),
    ('SSP3', 'SSP3 — Regional Rivalry'),
    ('SSP4', 'SSP4 — Inequality'),
    ('SSP5', 'SSP5 — Fossil-fueled Development');

-- A scenario parameter modifies an indicator (or a whole hazard/sector) under
-- a scenario, e.g. multiplier on flood frequency under SSP5.
CREATE TABLE scenario_parameter (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    scenario_id    BIGINT NOT NULL REFERENCES ssp_scenario(id) ON DELETE CASCADE,
    indicator_id   BIGINT REFERENCES indicator_catalog(id) ON DELETE CASCADE,
    hazard_type_id BIGINT REFERENCES hazard_type(id)       ON DELETE CASCADE,
    sector_id      BIGINT REFERENCES sector(id)            ON DELETE CASCADE,
    param_key      TEXT NOT NULL,              -- e.g. 'multiplier', 'delta', 'growth_rate'
    param_value    DOUBLE PRECISION,
    params         JSONB,                      -- richer parameterizations
    notes          TEXT,
    CONSTRAINT scenario_param_target CHECK (
        indicator_id IS NOT NULL OR hazard_type_id IS NOT NULL OR sector_id IS NOT NULL
    )
);
CREATE INDEX scenario_parameter_scenario_ix ON scenario_parameter (scenario_id);

-- ----------------------------------------------------------------------------
-- indicator_value — ONE table for all three tracks.
-- scenario_id NULL = baseline (observed present-day) value.
-- derivation: raw_upload (Excel), manual (form), computed (D8 toolbox —
-- computation_job_id FK is added by spatial-model.sql).
-- ----------------------------------------------------------------------------
CREATE TABLE indicator_value (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    indicator_id     BIGINT NOT NULL REFERENCES indicator_catalog(id) ON DELETE RESTRICT,
    ds_division_id   BIGINT NOT NULL REFERENCES ds_division(id)       ON DELETE RESTRICT,
    source           source_type NOT NULL,
    user_id          BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    scenario_id      BIGINT REFERENCES ssp_scenario(id) ON DELETE CASCADE,
    year_start       INTEGER,                  -- period covered by the value
    year_end         INTEGER,                  -- = year_start for single-year data
    raw_value        DOUBLE PRECISION NOT NULL,
    normalized_value DOUBLE PRECISION,          -- server-computed, [0..1]
    derivation       derivation_type NOT NULL DEFAULT 'raw_upload',
    unit             TEXT,
    data_source      TEXT,                      -- provenance of the raw number
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT normalized_in_range CHECK (
        normalized_value IS NULL OR (normalized_value >= 0 AND normalized_value <= 1)
    ),
    CONSTRAINT indicator_period_valid CHECK (
        year_end IS NULL OR year_start IS NULL OR year_end >= year_start
    ),
    CONSTRAINT indicator_value_uniq UNIQUE NULLS NOT DISTINCT
        (indicator_id, ds_division_id, source, user_id, scenario_id, year_start, year_end)
);
CREATE INDEX indicator_value_lookup_ix
    ON indicator_value (indicator_id, ds_division_id, source, scenario_id);
CREATE INDEX indicator_value_division_ix ON indicator_value (ds_division_id);

-- ----------------------------------------------------------------------------
-- vulnerability_result — computed V = f(Exposure, Hazard) per DS division,
-- per profile (sector×hazard weighting) × track × scenario.
-- profile_id is the lineage: exactly which variable set + weights produced
-- this score. hazard/sector/subsector columns are denormalized from the
-- profile for fast map filtering.
-- ----------------------------------------------------------------------------
CREATE TABLE vulnerability_result (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ds_division_id      BIGINT NOT NULL REFERENCES ds_division(id)           ON DELETE CASCADE,
    profile_id          BIGINT NOT NULL REFERENCES vulnerability_profile(id) ON DELETE CASCADE,
    hazard_type_id      BIGINT NOT NULL REFERENCES hazard_type(id) ON DELETE CASCADE,
    sector_id           BIGINT NOT NULL REFERENCES sector(id)      ON DELETE CASCADE,
    subsector_id        BIGINT REFERENCES subsector(id)            ON DELETE CASCADE,
    source              source_type NOT NULL,
    scenario_id         BIGINT REFERENCES ssp_scenario(id)         ON DELETE CASCADE,
    year_start          INTEGER,
    year_end            INTEGER,
    exposure_index      DOUBLE PRECISION NOT NULL CHECK (exposure_index      BETWEEN 0 AND 1),
    hazard_index        DOUBLE PRECISION NOT NULL CHECK (hazard_index        BETWEEN 0 AND 1),
    vulnerability_index DOUBLE PRECISION NOT NULL CHECK (vulnerability_index BETWEEN 0 AND 1),
    method              JSONB,                  -- f(E,H) spec + weights snapshot
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT vulnerability_result_uniq UNIQUE NULLS NOT DISTINCT
        (ds_division_id, profile_id, source, scenario_id, year_start, year_end)
);
CREATE INDEX vulnerability_result_map_ix
    ON vulnerability_result (hazard_type_id, sector_id, source, scenario_id);
CREATE INDEX vulnerability_result_profile_ix
    ON vulnerability_result (profile_id);

-- ----------------------------------------------------------------------------
-- impact_projection — projected sector/subsector impact under an SSP scenario
-- ----------------------------------------------------------------------------
CREATE TABLE impact_projection (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    scenario_id            BIGINT NOT NULL REFERENCES ssp_scenario(id) ON DELETE CASCADE,
    ds_division_id         BIGINT NOT NULL REFERENCES ds_division(id)  ON DELETE CASCADE,
    sector_id              BIGINT NOT NULL REFERENCES sector(id)       ON DELETE CASCADE,
    subsector_id           BIGINT REFERENCES subsector(id)             ON DELETE CASCADE,
    hazard_type_id         BIGINT REFERENCES hazard_type(id)           ON DELETE CASCADE,
    year_start             INTEGER NOT NULL,   -- projection period, e.g. 2025–2030
    year_end               INTEGER NOT NULL,
    baseline_vulnerability DOUBLE PRECISION,
    projected_impact       DOUBLE PRECISION NOT NULL,   -- model output index
    details                JSONB,
    computed_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT impact_period_valid CHECK (year_end >= year_start),
    CONSTRAINT impact_projection_uniq UNIQUE NULLS NOT DISTINCT
        (scenario_id, ds_division_id, sector_id, subsector_id, hazard_type_id, year_start, year_end)
);
CREATE INDEX impact_projection_scenario_ix
    ON impact_projection (scenario_id, sector_id, year_start);

-- ----------------------------------------------------------------------------
-- monitoring_observation — actual observed outcomes, to compare against
-- predicted impact (closes the loop)
-- ----------------------------------------------------------------------------
CREATE TABLE monitoring_observation (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ds_division_id       BIGINT NOT NULL REFERENCES ds_division(id) ON DELETE CASCADE,
    sector_id            BIGINT REFERENCES sector(id)               ON DELETE SET NULL,
    subsector_id         BIGINT REFERENCES subsector(id)            ON DELETE SET NULL,
    indicator_id         BIGINT REFERENCES indicator_catalog(id)    ON DELETE SET NULL,
    impact_projection_id BIGINT REFERENCES impact_projection(id)    ON DELETE SET NULL,
    observed_value       DOUBLE PRECISION NOT NULL,
    unit                 TEXT,
    observed_on          DATE NOT NULL,
    data_source          TEXT,
    notes                TEXT,
    recorded_by          BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX monitoring_observation_proj_ix
    ON monitoring_observation (impact_projection_id);
CREATE INDEX monitoring_observation_div_ix
    ON monitoring_observation (ds_division_id, observed_on);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER indicator_value_touch
    BEFORE UPDATE ON indicator_value
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- Convenience view: map-ready latest vulnerability per division
-- ----------------------------------------------------------------------------
CREATE VIEW v_division_vulnerability AS
SELECT vr.id,
       d.code  AS ds_code,
       d.name  AS ds_name,
       d.geom,
       p.code  AS province_code,
       vp.code AS profile_code,
       h.code  AS hazard_code,
       s.code  AS sector_code,
       ss.code AS subsector_code,
       vr.source,
       sc.code AS scenario_code,
       vr.year_start,
       vr.year_end,
       vr.exposure_index,
       vr.hazard_index,
       vr.vulnerability_index,
       vr.computed_at
FROM vulnerability_result vr
JOIN ds_division           d  ON d.id  = vr.ds_division_id
JOIN province              p  ON p.id  = d.province_id
JOIN vulnerability_profile vp ON vp.id = vr.profile_id
JOIN hazard_type           h  ON h.id  = vr.hazard_type_id
JOIN sector                s  ON s.id  = vr.sector_id
LEFT JOIN subsector    ss ON ss.id = vr.subsector_id
LEFT JOIN ssp_scenario sc ON sc.id = vr.scenario_id;
