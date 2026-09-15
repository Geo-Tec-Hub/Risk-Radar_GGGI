"""
Settings, read from the environment (and optionally backend/.env, which is
gitignored -- see .env.example).

Deliberately NO password field. `%APPDATA%\\postgresql\\pgpass.conf` is the
project's chosen route (CLAUDE.md "hard-won facts": "don't ask for the
password; don't write it into a file that isn't this one"). asyncpg resolves
a missing password the same way `psql` does -- PGPASSWORD env var first, then
the pgpass file, cross-platform, including the Windows APPDATA location --
so the fix here is to never pass one, not to read one and forward it.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Names match backend/.env.example's PG* convention (standard libpq env
    # var names) exactly, so the same .env works whether it's read by this
    # app, psql, or any other libpq-based tool.
    pg_host: str = Field(default="localhost", validation_alias="PGHOST")
    pg_port: int = Field(default=5432, validation_alias="PGPORT")
    pg_database: str = Field(default="riskradar", validation_alias="PGDATABASE")
    pg_user: str = Field(default="postgres", validation_alias="PGUSER")

    # The Angular dev server's real default port (ng serve, no --port
    # override) -- not the 4300 used ad hoc during Stage 5 testing. Matches
    # frontend-angular/proxy.conf.json's expected caller.
    cors_origin: str = Field(default="http://localhost:4200", validation_alias="CORS_ORIGIN")

    # T2b: the opaque session cookie. Secure requires HTTPS -- off by default
    # so local http://localhost:4200 dev keeps working; set true behind TLS.
    session_cookie_name: str = Field(default="rr_session", validation_alias="SESSION_COOKIE_NAME")
    session_lifetime_hours: int = Field(default=24, validation_alias="SESSION_LIFETIME_HOURS")
    session_cookie_secure: bool = Field(default=False, validation_alias="SESSION_COOKIE_SECURE")


@lru_cache
def get_settings() -> Settings:
    return Settings()
