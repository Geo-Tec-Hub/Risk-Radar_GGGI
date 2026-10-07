"""GET /api/health -- SRS §9: "Status of database, tiles, job queue and AI layer"."""

import logging
from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel

from app.db import get_pool

log = logging.getLogger(__name__)

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    database: str
    # Stage 5.2 (tiles), Stage 6 (job queue) and Stage 8 (AI layer) don't
    # exist yet -- said plainly, not faked as "ok" because nothing calls them.
    tiles: str = "not_implemented"
    job_queue: str = "not_implemented"
    ai_layer: str = "not_implemented"


@router.get("/health", response_model=HealthResponse)
async def health(
    response: Response,
    pool: Optional[asyncpg.Pool] = Depends(get_pool),
) -> HealthResponse:
    """
    Reports 200 when the database answers, 503 when it does not. Both are real
    answers from a running API -- the endpoint's purpose is to distinguish
    "API down" (nothing responds) from "API up, database down".

    The failure reason is logged, never returned. asyncpg's connection errors
    carry host, port, user and database name, and an auth failure quotes the
    user back verbatim; this endpoint is unauthenticated and public, so
    returning `str(exc)` would hand infrastructure detail to anyone who asked
    (NFR-4, default deny).
    """
    if pool is None:
        response.status_code = 503
        return HealthResponse(status="degraded", database="unavailable")

    try:
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
    except Exception:  # noqa: BLE001 -- health reports any failure, not specific ones
        log.exception("health check: database query failed")
        response.status_code = 503
        return HealthResponse(status="degraded", database="error")

    return HealthResponse(status="ok", database="ok")
