"""
Admin: the variable catalogue, hazard types, and who may write what.

    GET  /api/admin/catalog                  browse variables
    POST /api/admin/catalog                  propose a NEW variable (pending)
    POST /api/admin/catalog/{id}/status      approve or retire one (admin)
    PUT  /api/admin/catalog/{id}/unit        set or correct a variable's unit (admin, expert, data officer; recorded)
    PUT  /api/admin/catalog/{id}/source      set a variable's data source, per province or default (recorded)
    PUT  /api/admin/catalog/{id}/direction   set a variable's DEFAULT direction (admin; recorded)
    DELETE /api/admin/catalog/{id}           delete an unused variable, else retire it (admin)
    GET  /api/admin/hazards                  hazard types
    POST /api/admin/hazards                  add one (admin)
    GET  /api/admin/users                    accounts, roles, sectors, province
    PUT  /api/admin/users/{id}/roles         change an account's roles (admin)

WHY A NEW VARIABLE ARRIVES 'pending' AND NOT 'active'.
`catalog_status` was built for exactly this (schema.sql rev 5): a variable
proposed during collection is held until an administrator approves it, because a
code is forever. Values key to it, upload templates carry a column for it, and
profiles cite it in their audit trail -- so a typo'd or duplicate code is not a
tidy-up, it is a second variable that quietly splits one fact in two. Anyone
trusted to write data may PROPOSE; only an administrator may make it real.

WHY ADDING A VARIABLE TO A PROFILE DOES NOT HAPPEN HERE.
It would have to choose a weight, and a weight is a panel decision, not an
administrative one. So this module hands the chosen codes to the weights editor
(`/weights?...&add=CODE`) and the panel sets the split there, saving a new
profile version through `save_profile_weights()` exactly as any other weight
change does. One path writes weights, and it is the audited one.
"""

from __future__ import annotations

import re
from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.deps import CurrentUser, db, get_current_user, require_admin

router = APIRouter(tags=["admin"])

CODE_RE = re.compile(r"^[A-Z][A-Z0-9_]{2,79}$")


# ---------------------------------------------------------------- catalogue
class CatalogItem(BaseModel):
    id: int
    code: str
    name: str
    domain: Optional[str]
    unit: Optional[str]
    direction: str
    status: str
    usedInProfiles: int
    # Last unit change, so a wrong edit is visible next to the unit itself.
    unitPrevious: Optional[str] = None
    unitChangedBy: Optional[str] = None
    unitChangedAt: Optional[str] = None
    # Catalogue-wide data source, used where a province has not set its own.
    defaultDataSource: Optional[str] = None


class NewVariable(BaseModel):
    code: str = Field(min_length=3, max_length=80)
    name: str = Field(min_length=3, max_length=200)
    domain: str = Field(pattern="^(hazard|exposure)$")
    unit: Optional[str] = None
    direction: str = Field(default="higher_is_worse",
                           pattern="^(higher_is_worse|higher_is_better)$")
    description: Optional[str] = None
    dataSource: Optional[str] = Field(default=None, max_length=300)


class StatusChange(BaseModel):
    status: str = Field(pattern="^(active|pending|retired)$")


@router.get("/admin/catalog", response_model=list[CatalogItem])
async def list_catalog(
    q: Optional[str] = None,
    domain: Optional[str] = Query(None, pattern="^(hazard|exposure)$"),
    status: Optional[str] = Query(None, pattern="^(active|pending|retired)$"),
    limit: int = 200,
    pool: asyncpg.Pool = Depends(db),
    _user: CurrentUser = Depends(get_current_user),
) -> list[CatalogItem]:
    rows = await pool.fetch(
        """
        SELECT ic.id, ic.code, ic.name, ic.domain::text AS domain, ic.unit,
               ic.direction::text AS direction, ic.status::text AS status,
               (SELECT count(*) FROM profile_indicator pi
                 JOIN vulnerability_profile vp ON vp.id = pi.profile_id
                WHERE pi.indicator_id = ic.id AND vp.is_active) AS used,
               uc.old_unit, uc.changed_at, au.full_name AS changed_by,
               ic.default_data_source
          FROM indicator_catalog ic
          LEFT JOIN LATERAL (
                SELECT old_unit, changed_at, changed_by FROM indicator_unit_change
                 WHERE indicator_id = ic.id ORDER BY changed_at DESC, id DESC LIMIT 1
          ) uc ON true
          LEFT JOIN app_user au ON au.id = uc.changed_by
         WHERE ($1::text IS NULL OR ic.code ILIKE '%' || $1 || '%'
                                 OR ic.name ILIKE '%' || $1 || '%')
           AND ($2::text IS NULL OR ic.domain::text = $2)
           AND ($3::text IS NULL OR ic.status::text = $3)
         ORDER BY (ic.status = 'pending') DESC, ic.code
         LIMIT $4
        """, q, domain, status, min(limit, 500))
    return [CatalogItem(id=r["id"], code=r["code"], name=r["name"],
                        domain=r["domain"], unit=r["unit"], direction=r["direction"],
                        status=r["status"], usedInProfiles=r["used"],
                        unitPrevious=r["old_unit"],
                        unitChangedBy=r["changed_by"],
                        unitChangedAt=r["changed_at"].isoformat() if r["changed_at"] else None,
                        defaultDataSource=r["default_data_source"])
            for r in rows]


@router.post("/admin/catalog", response_model=CatalogItem, status_code=201)
async def propose_variable(
    body: NewVariable,
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> CatalogItem:
    """Propose a variable. It lands as `pending` and cannot join a profile until
    an administrator approves it."""
    code = body.code.strip().upper().replace(" ", "_")
    if not CODE_RE.match(code):
        raise HTTPException(
            422, "a variable code is 3-80 characters, uppercase letters, digits "
                 "and underscores, starting with a letter -- e.g. PADDY_EXTENT")
    if not (user.has_role("admin") or user.has_role("expert")
            or user.has_role("data_officer")):
        raise HTTPException(403, "only a data officer, expert or administrator "
                                 "may propose a variable")
    async with pool.acquire() as conn:
        clash = await conn.fetchrow(
            "SELECT code, status::text AS status FROM indicator_catalog WHERE code = $1", code)
        if clash:
            raise HTTPException(
                409, "%s already exists (%s). Use it rather than creating a second "
                     "code for the same fact -- two codes split one fact in two."
                     % (clash["code"], clash["status"]))
        # An alias resolving to something else means the name is already spoken
        # for by a variable under another code, which is the same trap.
        alias = await conn.fetchval(
            """SELECT ic.code FROM indicator_alias ia
                 JOIN indicator_catalog ic ON ic.id = ia.indicator_id
                WHERE upper(ia.alias) = $1""", code)
        if alias:
            raise HTTPException(
                409, "%s is already an alias for %s" % (code, alias))
        # 'pending' is set by the column default only for rows that omit it;
        # stating it here makes the intent visible at the call site.
        r = await conn.fetchrow(
            """
            INSERT INTO indicator_catalog (code, name, description, domain, unit,
                                           direction, status, proposed_by,
                                           default_data_source)
            VALUES ($1, $2, $3, $4::domain_type, $5, $6::indicator_direction,
                    'pending', $7, $8)
            RETURNING id, code, name, domain::text AS domain, unit,
                      direction::text AS direction, status::text AS status,
                      default_data_source
            """, code, body.name.strip(), body.description, body.domain,
            body.unit, body.direction, user.id,
            (body.dataSource or "").strip() or None)
    return CatalogItem(id=r["id"], code=r["code"], name=r["name"], domain=r["domain"],
                       unit=r["unit"], direction=r["direction"], status=r["status"],
                       usedInProfiles=0, defaultDataSource=r["default_data_source"])


@router.post("/admin/catalog/{variable_id}/status", response_model=CatalogItem)
async def set_variable_status(
    variable_id: int,
    body: StatusChange,
    _admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> CatalogItem:
    async with pool.acquire() as conn:
        used = await conn.fetchval(
            """SELECT count(*) FROM profile_indicator pi
                 JOIN vulnerability_profile vp ON vp.id = pi.profile_id
                WHERE pi.indicator_id = $1 AND vp.is_active""", variable_id)
        if body.status == "retired" and used:
            # Retiring a live variable would leave active profiles citing
            # something the catalogue says is gone, and the next recompute would
            # be scored on a set nobody chose.
            raise HTTPException(
                409, "this variable is in %d active profile(s). Remove it from "
                     "them first -- retiring it underneath them would change "
                     "published scores with no panel decision behind it." % used)
        r = await conn.fetchrow(
            """UPDATE indicator_catalog SET status = $2::catalog_status
                WHERE id = $1
            RETURNING id, code, name, domain::text AS domain, unit,
                      direction::text AS direction, status::text AS status""",
            variable_id, body.status)
        if r is None:
            raise HTTPException(404, "no such variable")
    return CatalogItem(id=r["id"], code=r["code"], name=r["name"], domain=r["domain"],
                       unit=r["unit"], direction=r["direction"], status=r["status"],
                       usedInProfiles=used)


class UnitChange(BaseModel):
    # Blank clears the unit. Kept short: it is printed in a narrow column and
    # in row 3 of every upload template.
    unit: Optional[str] = Field(default=None, max_length=40)


@router.put("/admin/catalog/{ref}/unit", response_model=CatalogItem)
async def set_variable_unit(
    ref: str,
    body: UnitChange,
    user: CurrentUser = Depends(get_current_user),
    pool: asyncpg.Pool = Depends(db),
) -> CatalogItem:
    """Set the unit a variable is measured in.

    WHO (owner decision, 2 Oct 2026): an administrator, expert or data officer.
    A unit belongs to the variable, so a change made for one province is seen
    by every province and sector that reads it -- hence every change is written
    to `indicator_unit_change` (old, new, who, when) in the same transaction,
    and the catalogue shows the previous unit beside the current one.

    The unit describes the variable; it does not change any stored value,
    weight or score, so it does not create a new profile version."""
    if not (user.has_role("admin") or user.has_role("expert")
            or user.has_role("data_officer")):
        raise HTTPException(403, "only a data officer, expert or administrator "
                                 "may change a unit")
    unit = (body.unit or "").strip() or None
    async with pool.acquire() as conn:
        # `ref` is the numeric id (Model page) or the variable code (weights
        # editor, which knows codes, not ids).
        variable_id = await conn.fetchval(
            "SELECT id FROM indicator_catalog WHERE id::text = $1 OR code = upper($1)", ref)
        if variable_id is None:
            raise HTTPException(404, "no such variable")
        async with conn.transaction():
            old = await conn.fetchrow(
                "SELECT unit FROM indicator_catalog WHERE id = $1 FOR UPDATE", variable_id)
            if old is None:
                raise HTTPException(404, "no such variable")
            if (old["unit"] or None) != unit:
                await conn.execute(
                    """INSERT INTO indicator_unit_change
                           (indicator_id, old_unit, new_unit, changed_by)
                       VALUES ($1, $2, $3, $4)""",
                    variable_id, old["unit"], unit, user.id)
                await conn.execute(
                    "UPDATE indicator_catalog SET unit = $2 WHERE id = $1",
                    variable_id, unit)
        r = await conn.fetchrow(
            """SELECT ic.id, ic.code, ic.name, ic.domain::text AS domain, ic.unit,
                      ic.direction::text AS direction, ic.status::text AS status,
                      (SELECT count(*) FROM profile_indicator pi
                         JOIN vulnerability_profile vp ON vp.id = pi.profile_id
                        WHERE pi.indicator_id = ic.id AND vp.is_active) AS used,
                      uc.old_unit, uc.changed_at, au.full_name AS changed_by
                 FROM indicator_catalog ic
                 LEFT JOIN LATERAL (
                       SELECT old_unit, changed_at, changed_by FROM indicator_unit_change
                        WHERE indicator_id = ic.id ORDER BY changed_at DESC, id DESC LIMIT 1
                 ) uc ON true
                 LEFT JOIN app_user au ON au.id = uc.changed_by
                WHERE ic.id = $1""", variable_id)
    return CatalogItem(id=r["id"], code=r["code"], name=r["name"], domain=r["domain"],
                       unit=r["unit"], direction=r["direction"], status=r["status"],
                       usedInProfiles=r["used"], unitPrevious=r["old_unit"],
                       unitChangedBy=r["changed_by"],
                       unitChangedAt=r["changed_at"].isoformat() if r["changed_at"] else None)


async def _resolve_variable(conn, ref: str) -> int:
    vid = await conn.fetchval(
        "SELECT id FROM indicator_catalog WHERE id::text = $1 OR code = upper($1)", ref)
    if vid is None:
        raise HTTPException(404, "no such variable")
    return vid


def _require_writer(user: CurrentUser) -> None:
    if not (user.has_role("admin") or user.has_role("expert")
            or user.has_role("data_officer")):
        raise HTTPException(403, "only a data officer, expert or administrator may "
                                 "change this")


class SourceChange(BaseModel):
    # Province CODE (WES) for a province's own source; omitted/null for the
    # catalogue-wide default.
    province: Optional[str] = None
    dataSource: Optional[str] = Field(default=None, max_length=300)


class SourceOut(BaseModel):
    code: str
    province: Optional[str]
    dataSource: Optional[str]
    effectiveDataSource: Optional[str]
    changedBy: Optional[str] = None
    changedAt: Optional[str] = None


@router.put("/admin/catalog/{ref}/source", response_model=SourceOut)
async def set_variable_source(
    ref: str,
    body: SourceChange,
    user: CurrentUser = Depends(get_current_user),
    pool: asyncpg.Pool = Depends(db),
) -> SourceOut:
    """Set where a parameter's figures come from (client note, 7 Oct 2026).

    Per PROVINCE, because the same variable may come from different sources in
    different provinces. A data officer or expert may set it for their own
    province; the catalogue-wide default (no province) is an administrator's.
    Every change is written to indicator_meta_change. Descriptive only: no
    value, weight, version or score changes."""
    _require_writer(user)
    src = (body.dataSource or "").strip() or None
    async with pool.acquire() as conn:
        vid = await _resolve_variable(conn, ref)
        code = await conn.fetchval("SELECT code FROM indicator_catalog WHERE id = $1", vid)
        pid = None
        if body.province:
            pid = await conn.fetchval(
                "SELECT id FROM province WHERE code = upper($1) OR name = $1", body.province)
            if pid is None:
                raise HTTPException(404, "no such province: %s" % body.province)
            if not user.has_role("admin") and user.province_id != pid:
                raise HTTPException(403, "you may set sources for your own province only")
        elif not user.has_role("admin"):
            raise HTTPException(403, "the default source (all provinces) is set by an "
                                     "administrator; choose your province instead")
        async with conn.transaction():
            if pid is None:
                old = await conn.fetchval(
                    "SELECT default_data_source FROM indicator_catalog WHERE id = $1 FOR UPDATE", vid)
                if (old or None) != src:
                    await conn.execute(
                        "UPDATE indicator_catalog SET default_data_source = $2 WHERE id = $1", vid, src)
            else:
                old = await conn.fetchval(
                    """SELECT data_source FROM indicator_province_source
                        WHERE indicator_id = $1 AND province_id = $2 FOR UPDATE""", vid, pid)
                if (old or None) != src:
                    if src is None:
                        await conn.execute(
                            """DELETE FROM indicator_province_source
                                WHERE indicator_id = $1 AND province_id = $2""", vid, pid)
                    else:
                        await conn.execute(
                            """INSERT INTO indicator_province_source
                                   (indicator_id, province_id, data_source, updated_by)
                               VALUES ($1, $2, $3, $4)
                               ON CONFLICT (indicator_id, province_id) DO UPDATE
                                  SET data_source = EXCLUDED.data_source,
                                      updated_by = EXCLUDED.updated_by,
                                      updated_at = now()""", vid, pid, src, user.id)
            if (old or None) != src:
                await conn.execute(
                    """INSERT INTO indicator_meta_change
                           (indicator_id, province_id, field, old_value, new_value, changed_by)
                       VALUES ($1, $2, 'data_source', $3, $4, $5)""",
                    vid, pid, old, src, user.id)
        eff = await conn.fetchval(
            """SELECT COALESCE(
                   (SELECT data_source FROM indicator_province_source
                     WHERE indicator_id = $1 AND province_id = $2),
                   (SELECT default_data_source FROM indicator_catalog WHERE id = $1))""",
            vid, pid)
        last = await conn.fetchrow(
            """SELECT mc.changed_at, au.full_name FROM indicator_meta_change mc
                 LEFT JOIN app_user au ON au.id = mc.changed_by
                WHERE mc.indicator_id = $1 AND mc.field = 'data_source'
                  AND mc.province_id IS NOT DISTINCT FROM $2
                ORDER BY mc.changed_at DESC, mc.id DESC LIMIT 1""", vid, pid)
    return SourceOut(code=code, province=body.province, dataSource=src,
                     effectiveDataSource=eff,
                     changedBy=last["full_name"] if last else None,
                     changedAt=last["changed_at"].isoformat() if last else None)


class DirectionChange(BaseModel):
    direction: str = Field(pattern="^(higher_is_worse|higher_is_better)$")


@router.put("/admin/catalog/{ref}/direction", response_model=CatalogItem)
async def set_variable_direction(
    ref: str,
    body: DirectionChange,
    user: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> CatalogItem:
    """Change a variable's DEFAULT direction -- the one it takes when it is next
    added to a profile. Existing profiles keep their own direction (it changes
    scores, so it is changed per profile in the weights editor, where the save
    writes a new profile version). Recorded in indicator_meta_change."""
    async with pool.acquire() as conn:
        vid = await _resolve_variable(conn, ref)
        async with conn.transaction():
            old = await conn.fetchval(
                "SELECT direction::text FROM indicator_catalog WHERE id = $1 FOR UPDATE", vid)
            if old != body.direction:
                await conn.execute(
                    "UPDATE indicator_catalog SET direction = $2::indicator_direction WHERE id = $1",
                    vid, body.direction)
                await conn.execute(
                    """INSERT INTO indicator_meta_change
                           (indicator_id, province_id, field, old_value, new_value, changed_by)
                       VALUES ($1, NULL, 'direction', $2, $3, $4)""",
                    vid, old, body.direction, user.id)
        r = await conn.fetchrow(
            """SELECT ic.id, ic.code, ic.name, ic.domain::text AS domain, ic.unit,
                      ic.direction::text AS direction, ic.status::text AS status,
                      ic.default_data_source,
                      (SELECT count(*) FROM profile_indicator pi
                         JOIN vulnerability_profile vp ON vp.id = pi.profile_id
                        WHERE pi.indicator_id = ic.id AND vp.is_active) AS used
                 FROM indicator_catalog ic WHERE ic.id = $1""", vid)
    return CatalogItem(id=r["id"], code=r["code"], name=r["name"], domain=r["domain"],
                       unit=r["unit"], direction=r["direction"], status=r["status"],
                       usedInProfiles=r["used"], defaultDataSource=r["default_data_source"])


class DeleteOut(BaseModel):
    code: str
    outcome: str        # 'deleted' | 'retired'
    message: str


@router.delete("/admin/catalog/{ref}", response_model=DeleteOut)
async def delete_variable(
    ref: str,
    _admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> DeleteOut:
    """Remove an unwanted variable (client note, 7 Oct 2026).

    A variable that was never used -- no values on any track, never in any
    profile version -- is deleted outright. One with history is RETIRED
    instead: hidden from new use, its values and old scores kept, because
    deleting it would leave published scores resting on nothing. A variable in
    an ACTIVE profile is refused: remove it from those profiles first."""
    async with pool.acquire() as conn:
        vid = await _resolve_variable(conn, ref)
        code = await conn.fetchval("SELECT code FROM indicator_catalog WHERE id = $1", vid)
        active = await conn.fetchval(
            """SELECT count(*) FROM profile_indicator pi
                 JOIN vulnerability_profile vp ON vp.id = pi.profile_id
                WHERE pi.indicator_id = $1 AND vp.is_active""", vid)
        if active:
            raise HTTPException(
                409, "%s is in %d active profile(s). Remove it from them in the weights "
                     "editor first -- deleting it underneath them would change published "
                     "scores with no decision behind it." % (code, active))
        n_values = await conn.fetchval(
            "SELECT count(*) FROM indicator_value WHERE indicator_id = $1", vid)
        n_hist = await conn.fetchval(
            "SELECT count(*) FROM profile_indicator WHERE indicator_id = $1", vid)
        if n_values == 0 and n_hist == 0:
            try:
                async with conn.transaction():
                    await conn.execute("DELETE FROM indicator_alias WHERE indicator_id = $1", vid)
                    await conn.execute("DELETE FROM indicator_catalog WHERE id = $1", vid)
                return DeleteOut(code=code, outcome="deleted",
                                 message="%s was never used, so it was deleted." % code)
            except asyncpg.exceptions.ForeignKeyViolationError:
                pass    # something else still points at it: retire instead
        await conn.execute(
            "UPDATE indicator_catalog SET status = 'retired' WHERE id = $1", vid)
        return DeleteOut(
            code=code, outcome="retired",
            message="%s has data or past profile versions behind it, so it was retired "
                    "instead of deleted: it is hidden from new use and its history and "
                    "old scores are kept." % code)


# ------------------------------------------------------------- hazard types
class HazardOut(BaseModel):
    id: int
    code: str
    name: str
    isActive: bool
    profiles: int


class NewHazard(BaseModel):
    code: str = Field(min_length=2, max_length=40)
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = None


@router.get("/admin/hazards", response_model=list[HazardOut])
async def list_hazards(
    pool: asyncpg.Pool = Depends(db),
    _user: CurrentUser = Depends(get_current_user),
) -> list[HazardOut]:
    rows = await pool.fetch(
        """SELECT h.id, h.code, h.name, h.is_active,
                  (SELECT count(*) FROM vulnerability_profile vp
                    WHERE vp.hazard_type_id = h.id AND vp.is_active) AS profiles
             FROM hazard_type h ORDER BY h.name""")
    return [HazardOut(id=r["id"], code=r["code"], name=r["name"],
                      isActive=r["is_active"], profiles=r["profiles"]) for r in rows]


@router.post("/admin/hazards", response_model=HazardOut, status_code=201)
async def add_hazard(
    body: NewHazard,
    _admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> HazardOut:
    """Add a hazard type.

    A hazard on its own scores nothing: a profile is sector x hazard x province,
    so until someone builds profiles for it and weights them, the new hazard
    appears in no filter and no map. That is deliberate -- the alternative is a
    hazard offered in the UI with no model behind it.
    """
    code = body.code.strip().lower().replace(" ", "_")
    if not re.match(r"^[a-z][a-z0-9_]{1,39}$", code):
        raise HTTPException(422, "a hazard code is lowercase letters, digits and "
                                 "underscores -- e.g. cyclone, storm_surge")
    async with pool.acquire() as conn:
        if await conn.fetchval("SELECT 1 FROM hazard_type WHERE code = $1", code):
            raise HTTPException(409, "hazard %s already exists" % code)
        r = await conn.fetchrow(
            """INSERT INTO hazard_type (code, name, description, is_active)
               VALUES ($1, $2, $3, TRUE)
            RETURNING id, code, name, is_active""",
            code, body.name.strip(), body.description)
    return HazardOut(id=r["id"], code=r["code"], name=r["name"],
                     isActive=r["is_active"], profiles=0)


# -------------------------------------------------------------------- users
class UserOut(BaseModel):
    id: int
    email: str
    fullName: str
    organization: Optional[str]
    status: str
    province: Optional[str]
    roles: list[str]
    scopes: list[str]
    mayWriteHazardDomain: bool


class RoleOut(BaseModel):
    code: str
    name: str
    description: Optional[str]


class RoleChange(BaseModel):
    roles: list[str]


@router.get("/admin/roles", response_model=list[RoleOut])
async def list_roles(
    _admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> list[RoleOut]:
    """The roles that exist, read from the `role` table rather than hardcoded in
    the client. A list typed into the UI drifts the first time a role is added,
    and the drift shows up as a role nobody can assign."""
    rows = await pool.fetch("SELECT code, name, description FROM role ORDER BY code")
    return [RoleOut(code=r["code"], name=r["name"], description=r["description"])
            for r in rows]


@router.get("/admin/users", response_model=list[UserOut])
async def list_users(
    province: Optional[str] = None,
    sector: Optional[str] = None,
    _admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> list[UserOut]:
    """Every account with the sectors it may write.

    Filtering by sector asks "who covers this?", which is the question an
    administrator actually has -- the reverse lookup (what may this person
    write) is already answered per row.
    """
    rows = await pool.fetch(
        """
        SELECT u.id, u.email, u.full_name, u.organization, u.status::text AS status,
               p.name AS province, u.may_write_hazard_domain,
               COALESCE((SELECT array_agg(r.code ORDER BY r.code)
                           FROM user_role ur JOIN role r ON r.id = ur.role_id
                          WHERE ur.user_id = u.id), '{}') AS roles,
               COALESCE((SELECT array_agg(
                             s.name || COALESCE(' / ' || ss.name, ' (all subsectors)')
                             ORDER BY s.name)
                           FROM user_write_scope w
                           JOIN sector s ON s.id = w.sector_id
                           LEFT JOIN subsector ss ON ss.id = w.subsector_id
                          WHERE w.user_id = u.id), '{}') AS scopes
          FROM app_user u
          LEFT JOIN province p ON p.id = u.province_id
         WHERE ($1::text IS NULL OR p.name = $1)
           AND ($2::text IS NULL OR EXISTS (
                   SELECT 1 FROM user_write_scope w2 JOIN sector s2 ON s2.id = w2.sector_id
                    WHERE w2.user_id = u.id AND s2.name = $2))
         ORDER BY u.status, u.full_name
        """, province, sector)
    return [UserOut(id=r["id"], email=r["email"], fullName=r["full_name"],
                    organization=r["organization"], status=r["status"],
                    province=r["province"], roles=list(r["roles"]),
                    scopes=list(r["scopes"]),
                    mayWriteHazardDomain=r["may_write_hazard_domain"]) for r in rows]


@router.put("/admin/users/{user_id}/roles", response_model=UserOut)
async def set_roles(
    user_id: int,
    body: RoleChange,
    admin: CurrentUser = Depends(require_admin),
    pool: asyncpg.Pool = Depends(db),
) -> UserOut:
    """Replace an account's roles. The body is the whole set, for the same
    reason the scope endpoint replaces rather than adds: what the administrator
    sees on screen is what the account ends up with, and revocation needs no
    second endpoint that nobody remembers to call."""
    wanted = sorted({r.strip() for r in body.roles if r.strip()})
    if user_id == admin.id and "admin" not in wanted:
        # Removing your own last admin role locks the instance out of its own
        # admin screens, and the fix then needs a psql session.
        raise HTTPException(409, "you cannot remove your own administrator role")
    async with pool.acquire() as conn:
        async with conn.transaction():
            if not await conn.fetchval("SELECT 1 FROM app_user WHERE id = $1", user_id):
                raise HTTPException(404, "no such user")
            ids = {r["code"]: r["id"] for r in await conn.fetch(
                "SELECT id, code FROM role WHERE code = ANY($1::text[])", wanted)}
            missing = [c for c in wanted if c not in ids]
            if missing:
                raise HTTPException(422, "no such role: %s" % ", ".join(missing))
            await conn.execute("DELETE FROM user_role WHERE user_id = $1", user_id)
            for code in wanted:
                await conn.execute(
                    "INSERT INTO user_role (user_id, role_id) VALUES ($1, $2)",
                    user_id, ids[code])
    users = await list_users(province=None, sector=None, _admin=admin, pool=pool)
    found = [u for u in users if u.id == user_id]
    if not found:
        raise HTTPException(404, "no such user")
    return found[0]
