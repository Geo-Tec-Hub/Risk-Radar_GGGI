"""
Risk Radar API — FastAPI scaffold (BUILD_BRIEF_2026-08-09.md T2, Stage 2.0).

Routes are mounted under /api to match frontend-angular/proxy.conf.json,
which forwards /api/* to this app's port (8000) without rewriting the path,
and environment.ts's apiBaseUrl ('/api'), which every ApiClientService call
is already built against.

Run: .\\venv\\Scripts\\uvicorn.exe app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import open_pool_or_none
from app.routers import admin, auth, health, imports, profiles, reference, vulnerability

logging.basicConfig(level=logging.INFO)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # A database that is down must not stop the API from starting: /api/health
    # exists to say "API up, database down", and it cannot say anything at all
    # from a process that failed to boot. open_pool_or_none() logs the reason
    # and returns None; get_pool() retries on the next request, so starting
    # PostgreSQL after the API recovers without a restart. See app/db.py.
    app.state.pool = await open_pool_or_none(app)
    yield
    if app.state.pool is not None:
        await app.state.pool.close()


app = FastAPI(title="Risk Radar API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")
app.include_router(reference.router, prefix="/api")
app.include_router(imports.router, prefix="/api")
app.include_router(vulnerability.router, prefix="/api")
