-- ============================================================================
-- Risk Radar — AI agent RAG layer (OPTIONAL, needs pgvector)
-- Split out of schema.sql on 2026-07-26.
--
-- WHY SEPARATE: these four tables are the only thing in the database that needs
-- the pgvector extension, and they are not used until Phase 3 (A1-A3). pgvector
-- has no official Windows binary, so requiring it would block B1 on a native
-- Windows Postgres for no benefit. Skip this file now; run it when the agent
-- layer starts and pgvector is available.
--
--   psql -f schema_agent_pgvector.sql
--
-- Embedding dimension 1024 is a placeholder until the self-hosted embedding
-- model is chosen (PROJECT_GUIDE §5) — change vector(N) accordingly.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- Agent RAG layer (pgvector)
-- Embedding dimension 1024 is a placeholder until the self-hosted embedding
-- model is chosen (PROJECT_GUIDE §5) — change vector(N) accordingly.
-- ----------------------------------------------------------------------------
CREATE TABLE agent_document (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title        TEXT NOT NULL,
    doc_type     TEXT NOT NULL,                -- reference_doc | catalog | result_summary | expert_note
    source_table TEXT,                         -- provenance: originating table
    source_id    BIGINT,                       -- provenance: originating row
    content      TEXT NOT NULL,
    metadata     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_embedding (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES agent_document(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    chunk_text  TEXT NOT NULL,
    embedding   vector(1024) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_id, chunk_index)
);
CREATE INDEX agent_embedding_hnsw_ix
    ON agent_embedding USING hnsw (embedding vector_cosine_ops);

-- Expert review/append on agent answers (A2/A3)
CREATE TABLE agent_answer (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question     TEXT NOT NULL,
    answer       TEXT NOT NULL,
    citations    JSONB,                        -- source rows/docs used
    asked_by     BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_answer_review (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    answer_id   BIGINT NOT NULL REFERENCES agent_answer(id) ON DELETE CASCADE,
    expert_id   BIGINT NOT NULL REFERENCES app_user(id)     ON DELETE CASCADE,
    review_text TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

