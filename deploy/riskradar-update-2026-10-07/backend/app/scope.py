"""
Interest areas: what an applicant ASKS to write, and what an admin GRANTS.

One module because the same shape appears in three places — the registration
form, the approval screen, and the amendment endpoint — and a shape defined
three times drifts. `schema_write_scope_addendum.sql` explains why the boundary
sits at the sector with the hazard domain held apart; this file is only the
translation between JSON and those rows.

Two things are deliberately kept apart and must stay apart:

    app_user.requested_scope    what the applicant asked for       A WISH
    user_write_scope            what an administrator granted      A PERMISSION

Writing the request into the grant table at registration would make an
unapproved wish indistinguishable from an approved permission, and every check
in the system reads the grant table. So registration only records, and nothing
in this module writes user_write_scope except on an administrator's action.

Codes are validated at REQUEST time, not at approval time. An applicant who
types a sector that does not exist can fix it while they are looking at the
form; an administrator meeting the same mistake three days later can only guess
what was meant.
"""

from __future__ import annotations

from typing import Optional

import asyncpg
from pydantic import BaseModel, Field

# snake_case here, matching auth.py and admin.py and the frontend's
# auth.model.ts. The camelCase convention (SRS §9) governs the data contracts
# — profiles, vulnerability, reference — which were converted together. The
# auth surface is snake_case end to end on both sides; introducing a third
# style inside it would be worse than the inconsistency it tried to fix.


class InterestArea(BaseModel):
    """One sector, optionally narrowed to one subsector.

    `subsector` omitted means the WHOLE sector, which is the wider grant. It
    reads like the smaller request because it is the shorter object, so the
    admin screen must show it as "Agriculture (all subsectors)" rather than
    just "Agriculture".
    """
    sector: str = Field(min_length=1, max_length=100,
                        description="sector code, e.g. AGRICULTURE")
    subsector: Optional[str] = Field(
        default=None, max_length=100,
        description="subsector code, e.g. PADDY. Omit for the whole sector.")


class ResolvedArea(BaseModel):
    sector_id: int
    sector: str
    sector_name: str
    subsector_id: Optional[int]
    subsector: Optional[str]
    subsector_name: Optional[str]


class ScopeOut(BaseModel):
    """What a user may actually write, as granted."""
    user_id: int
    areas: list[ResolvedArea]
    may_write_hazard_domain: bool


class ScopeRequest(BaseModel):
    """The interest areas half of a registration or an approval."""
    interest_areas: list[InterestArea] = Field(default_factory=list, max_length=64)
    hazard_domain: bool = Field(
        default=False,
        description="asks to write the shared climate variables (SPI, warm "
                    "days, rainfall, event counts) — Met Department / DMC")


class ScopeError(ValueError):
    """Something in the request cannot be granted. The message is written for
    whoever is looking at the form, and is passed to the client unchanged."""


async def resolve_areas(conn: asyncpg.Connection,
                        areas: list[InterestArea]) -> list[ResolvedArea]:
    """Codes -> ids, refusing anything that does not exist or does not pair.

    Raises ScopeError naming every problem at once. Reporting only the first
    means an applicant with three bad codes submits the form four times.
    """
    if not areas:
        return []

    resolved: list[ResolvedArea] = []
    unknown_sectors: list[str] = []
    unknown_subsectors: list[str] = []
    mismatched: list[str] = []
    seen: set[tuple[str, Optional[str]]] = set()
    duplicates: list[str] = []

    for a in areas:
        sector_code = a.sector.strip().upper()
        subsector_code = a.subsector.strip().upper() if a.subsector else None

        key = (sector_code, subsector_code)
        if key in seen:
            duplicates.append(_label(sector_code, subsector_code))
            continue
        seen.add(key)

        s = await conn.fetchrow(
            "SELECT id, code, name FROM sector WHERE code = $1", sector_code)
        if s is None:
            unknown_sectors.append(sector_code)
            continue

        if subsector_code is None:
            resolved.append(ResolvedArea(
                sector_id=s["id"], sector=s["code"], sector_name=s["name"],
                subsector_id=None, subsector=None, subsector_name=None))
            continue

        ss = await conn.fetchrow(
            "SELECT id, code, name, sector_id FROM subsector WHERE code = $1",
            subsector_code)
        if ss is None:
            unknown_subsectors.append(subsector_code)
            continue
        if ss["sector_id"] != s["id"]:
            # Caught here as well as by the table's trigger, because this
            # message can name both halves in the applicant's own words.
            mismatched.append(f"{subsector_code} is not a subsector of {sector_code}")
            continue

        resolved.append(ResolvedArea(
            sector_id=s["id"], sector=s["code"], sector_name=s["name"],
            subsector_id=ss["id"], subsector=ss["code"],
            subsector_name=ss["name"]))

    problems: list[str] = []
    if unknown_sectors:
        problems.append("unknown sector(s): " + ", ".join(sorted(set(unknown_sectors))))
    if unknown_subsectors:
        problems.append("unknown subsector(s): " + ", ".join(sorted(set(unknown_subsectors))))
    if mismatched:
        problems.append("; ".join(sorted(set(mismatched))))
    if duplicates:
        problems.append("listed twice: " + ", ".join(sorted(set(duplicates))))
    if problems:
        raise ScopeError(". ".join(problems))

    _reject_redundant(resolved)
    return resolved


def _reject_redundant(resolved: list[ResolvedArea]) -> None:
    """A whole-sector grant plus a subsector grant under the same sector.

    Harmless to may_write_profile — the whole-sector row already answers yes —
    but it is a request that does not mean what it looks like. Someone who asks
    for "Agriculture" AND "Agriculture / Paddy" almost certainly meant to name
    two subsectors and left one blank by accident, and an admin approving the
    list as written would grant all of Agriculture without noticing.
    """
    whole = {a.sector for a in resolved if a.subsector_id is None}
    clashes = sorted({a.sector for a in resolved
                      if a.subsector_id is not None and a.sector in whole})
    if clashes:
        raise ScopeError(
            "these sectors are listed both as a whole sector and as one of "
            "their subsectors: %s. Ask for the whole sector or for the named "
            "subsectors, not both — the whole-sector entry would silently make "
            "the narrower ones meaningless."
            % ", ".join(clashes))


def as_requested_scope(areas: list[InterestArea], hazard_domain: bool) -> dict:
    """The JSON kept in app_user.requested_scope. Stored as CODES, not ids: it
    is a record of what a person asked for and must stay readable years later,
    when an id may point at a row that has been renamed or retired."""
    return {
        "sectors": [
            {"sector": a.sector.strip().upper(),
             "subsector": a.subsector.strip().upper() if a.subsector else None}
            for a in areas
        ],
        "hazardDomain": bool(hazard_domain),
    }


async def replace_scope(conn: asyncpg.Connection, user_id: int,
                        resolved: list[ResolvedArea], hazard_domain: bool,
                        granted_by: int, note: Optional[str] = None) -> None:
    """Make the granted scope exactly `resolved`. Caller supplies the
    transaction, so a half-applied amendment is not reachable."""
    await conn.execute("DELETE FROM user_write_scope WHERE user_id = $1", user_id)
    for a in resolved:
        await conn.execute(
            """INSERT INTO user_write_scope
                   (user_id, sector_id, subsector_id, granted_by, note)
               VALUES ($1, $2, $3, $4, $5)""",
            user_id, a.sector_id, a.subsector_id, granted_by, note)
    await conn.execute(
        "UPDATE app_user SET may_write_hazard_domain = $1 WHERE id = $2",
        bool(hazard_domain), user_id)


async def read_scope(conn: asyncpg.Connection, user_id: int) -> ScopeOut:
    rows = await conn.fetch(
        """SELECT s.sector_id, sec.code AS sector, sec.name AS sector_name,
                  s.subsector_id, ss.code AS subsector, ss.name AS subsector_name
             FROM user_write_scope s
             JOIN sector sec ON sec.id = s.sector_id
             LEFT JOIN subsector ss ON ss.id = s.subsector_id
            WHERE s.user_id = $1
            ORDER BY sec.code, ss.code NULLS FIRST""", user_id)
    flag = await conn.fetchval(
        "SELECT may_write_hazard_domain FROM app_user WHERE id = $1", user_id)
    return ScopeOut(
        user_id=user_id,
        areas=[ResolvedArea(**dict(r)) for r in rows],
        may_write_hazard_domain=bool(flag))


def _label(sector: str, subsector: Optional[str]) -> str:
    return f"{sector} / {subsector}" if subsector else sector
