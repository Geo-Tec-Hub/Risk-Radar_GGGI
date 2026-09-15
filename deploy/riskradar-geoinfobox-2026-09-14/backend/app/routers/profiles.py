"""
Profile API -- BUILD_BRIEF_2026-08-09.md T3, Stage 2.2 / 2.3.

    GET  /api/profiles/{scope}/weights
    PUT  /api/profiles/{scope}/weights
    GET  /api/profiles/readiness

THE SCOPE ENCODING, SETTLED HERE.  `encodeProfileScope()` in
core/models/profile.model.ts was a placeholder, and it was wrong in two ways.

    province : sector : subsector : hazard          e.g.  CEN:AGRICULTURE:PADDY:drought
    NAT      for a profile with no province
    -        for a profile with no subsector        e.g.  WES:WATER:-:flood

It is NOT the profile code (`PADDY_DROUGHT_CEN_V1`), even though that is unique
and would look tidier in a URL.  save_profile_weights() writes a NEW version on
every save and mints a new code with it (`..._V2`), so a client holding a code
is holding a pointer to a version that a colleague's save has already retired.
The scope is the thing that is stable across versions, and it is exactly the
four arguments the database function takes.

The placeholder also carried `period`.  A profile has no period -- periods
belong to indicator values and results (SRS section 2.5).  Including it would
have implied that weights differ by period, which they do not.

Everything here calls the database and reformats the answer.  No Python
reimplementation of a rule the schema already owns (app/db.py): the 100%
total, the contested-note requirement and FR-4.9b all live in
save_profile_weights(), and this module's job on PUT is to translate its
exceptions into HTTP rather than to pre-empt them.
"""

from __future__ import annotations

import logging
from typing import Literal, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, Field

from app.deps import CurrentUser, db, get_current_user

log = logging.getLogger(__name__)

router = APIRouter(prefix="/profiles", tags=["profiles"])

Consensus = Literal["agreed", "contested", "rejected", "proposed"]
Domain = Literal["hazard", "exposure"]


# --------------------------------------------------------------------------- #
# Scope
# --------------------------------------------------------------------------- #

class ProfileScope(BaseModel):
    province: Optional[str]
    sector: str
    subsector: Optional[str]
    hazard: str

    def encode(self) -> str:
        return ":".join([self.province or "NAT", self.sector, self.subsector or "-", self.hazard])


def parse_scope(scope: str) -> ProfileScope:
    parts = scope.split(":")
    if len(parts) != 4 or not all(p.strip() for p in parts):
        raise HTTPException(
            status_code=400,
            detail="scope must be province:sector:subsector:hazard, e.g. CEN:AGRICULTURE:PADDY:drought "
                   "(use NAT for no province, - for no subsector)",
        )
    province, sector, subsector, hazard = (p.strip() for p in parts)
    return ProfileScope(
        province=None if province.upper() == "NAT" else province.upper(),
        sector=sector.upper(),
        subsector=None if subsector == "-" else subsector.upper(),
        hazard=hazard.lower(),
    )


# --------------------------------------------------------------------------- #
# Response models
# --------------------------------------------------------------------------- #

# CASING: camelCase, matching core/models/*.ts and SRS section 9.
#
# This module emitted snake_case while the frontend models declared camelCase,
# so the weights editor read `undefined` for every field and crashed on
# `.map()`. Found by the 4 Sep QA pass, which established that the editor had
# never worked at all. The frontend models and the newer routers
# (vulnerability, reference, imports) already agree with each other and with
# section 9, so this module was the outlier and it is the one that moved.
class ProfileVariable(BaseModel):
    indicatorCode: str
    indicatorName: str
    domain: Domain
    weightPct: Optional[float]
    # The enum, not a '+'/'-' symbol: the symbol is a display convention from
    # the legacy workbooks and encoding it here would put a lossy abbreviation
    # in the contract.
    relationship: str
    consensus: Consensus
    consensusNote: Optional[str]
    decidedAt: Optional[str]
    decidedBy: Optional[str]
    unit: Optional[str]
    # FR-4.9b turns on this, so the client must not have to guess it from the
    # code string. See schema_profile_consensus_save_addendum.sql.
    isCompositeIndex: bool


class DomainTotal(BaseModel):
    domain: Domain
    total: float
    # Stated separately so the client never has to work out why a domain of
    # nine variables sums over six of them.
    counted: int
    excluded: int
    undecided: int


class ProfileWeights(BaseModel):
    scope: str
    profileId: int
    code: str
    profileVersion: int
    publication: str
    owner: Optional[str]
    derivedFrom: Optional[str]
    panelNote: Optional[str]
    isComputable: bool
    totals: list[DomainTotal]
    # Split by domain rather than returned as one array with a `domain` field.
    # The editor renders two blocks with independent totals and different rules
    # (FR-4.9b offers exclusion only on a composite hazard index), so the split
    # is the shape every consumer needs; doing it here means it is done once.
    hazardVariables: list[ProfileVariable]
    exposureVariables: list[ProfileVariable]


class WeightItem(BaseModel):
    """One row of a save. `weightPct` is omitted or null for anything not
    agreed/contested -- an excluded variable carries no weight, and 0 is not
    the same statement (SRS section 2.4)."""
    indicatorCode: str
    domain: Domain
    weightPct: Optional[float] = None
    relationship: Optional[str] = None
    consensus: Consensus = "agreed"
    consensusNote: Optional[str] = None


class SaveWeights(BaseModel):
    items: list[WeightItem] = Field(min_length=1)
    panelNote: Optional[str] = None


class Readiness(BaseModel):
    profileId: int
    code: str
    scope: str
    publication: str
    nVariables: int
    nContested: int
    nRejected: int
    nProposed: int
    nMissingWeights: int
    hazardTotal: Optional[float]
    exposureTotal: Optional[float]
    isComputable: bool


# --------------------------------------------------------------------------- #
# Queries
# --------------------------------------------------------------------------- #

_ACTIVE_PROFILE = """
    SELECT vp.id, vp.code, vp.version, vp.publication::text AS publication,
           vp.panel_note,
           ou.full_name AS owner,
           df.code      AS derived_from
      FROM vulnerability_profile vp
      JOIN sector s          ON s.id  = vp.sector_id
      JOIN hazard_type h     ON h.id  = vp.hazard_type_id
      LEFT JOIN province p   ON p.id  = vp.province_id
      LEFT JOIN subsector ss ON ss.id = vp.subsector_id
      LEFT JOIN app_user ou  ON ou.id = vp.owner_user_id
      LEFT JOIN vulnerability_profile df ON df.id = vp.derived_from_id
     WHERE vp.is_active
       AND s.code = $2
       AND h.code = $4
       AND p.code  IS NOT DISTINCT FROM $1
       AND ss.code IS NOT DISTINCT FROM $3
"""

_VARIABLES = """
    SELECT ic.code AS indicator_code, ic.name, ic.unit, ic.is_composite_index,
           pi.domain::text        AS domain,
           pi.weight_pct,
           pi.relationship::text  AS relationship,
           pi.consensus::text     AS consensus,
           pi.consensus_note,
           pi.decided_at,
           du.full_name           AS decided_by
      FROM profile_indicator pi
      JOIN indicator_catalog ic ON ic.id = pi.indicator_id
      LEFT JOIN app_user du     ON du.id = pi.decided_by
     WHERE pi.profile_id = $1
     ORDER BY pi.domain, ic.code
"""


async def _scope_ids(pool: asyncpg.Pool, sc: ProfileScope) -> asyncpg.Record:
    """Resolve the four codes to ids, and say which one is wrong if any is.

    A single query returning NULLs beats four round trips, and lets the 404
    name the offending part instead of "profile not found"."""
    row = await pool.fetchrow(
        """
        SELECT (SELECT id FROM province    WHERE code = $1) AS province_id,
               (SELECT id FROM sector      WHERE code = $2) AS sector_id,
               (SELECT id FROM subsector   WHERE code = $3) AS subsector_id,
               (SELECT id FROM hazard_type WHERE code = $4) AS hazard_type_id
        """,
        sc.province, sc.sector, sc.subsector, sc.hazard,
    )
    missing = []
    if sc.province is not None and row["province_id"] is None:
        missing.append(f"province '{sc.province}'")
    if row["sector_id"] is None:
        missing.append(f"sector '{sc.sector}'")
    if sc.subsector is not None and row["subsector_id"] is None:
        missing.append(f"subsector '{sc.subsector}'")
    if row["hazard_type_id"] is None:
        missing.append(f"hazard '{sc.hazard}'")
    if missing:
        raise HTTPException(status_code=404, detail="unknown " + ", ".join(missing))
    return row


def _totals(variables: list[ProfileVariable]) -> list[DomainTotal]:
    """The counted total is over agreed + contested only, matching
    save_profile_weights() exactly. If these two ever disagree, the editor shows
    a total the server will refuse -- so the rule lives in one place and this
    mirrors it deliberately rather than inventing a second one."""
    out = []
    for domain in ("hazard", "exposure"):
        rows = [v for v in variables if v.domain == domain]
        if not rows:
            continue
        counted = [v for v in rows if v.consensus in ("agreed", "contested")]
        out.append(DomainTotal(
            domain=domain,
            total=round(sum(v.weightPct or 0 for v in counted), 3),
            counted=len(counted),
            excluded=sum(1 for v in rows if v.consensus == "rejected"),
            undecided=sum(1 for v in rows if v.consensus == "proposed"),
        ))
    return out


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #

@router.get("/readiness", response_model=list[Readiness])
async def readiness(pool: asyncpg.Pool = Depends(db)) -> list[Readiness]:
    """v_profile_readiness for every active profile.

    Declared BEFORE /{scope}/weights on purpose: FastAPI matches in
    declaration order, and 'readiness' would otherwise be parsed as a scope.
    """
    rows = await pool.fetch(
        """
        SELECT r.*, COALESCE(p.code,'NAT') AS prov, s.code AS sect,
               COALESCE(ss.code,'-') AS subs, h.code AS haz
          FROM v_profile_readiness r
          JOIN vulnerability_profile vp ON vp.id = r.profile_id
          JOIN sector s          ON s.id  = vp.sector_id
          JOIN hazard_type h     ON h.id  = vp.hazard_type_id
          LEFT JOIN province p   ON p.id  = vp.province_id
          LEFT JOIN subsector ss ON ss.id = vp.subsector_id
         WHERE r.is_active
         ORDER BY r.code
        """
    )
    return [
        Readiness(
            profileId=r["profile_id"], code=r["code"],
            scope=f"{r['prov']}:{r['sect']}:{r['subs']}:{r['haz']}",
            publication=r["publication"],
            nVariables=r["n_variables"], nContested=r["n_contested"],
            nRejected=r["n_rejected"], nProposed=r["n_proposed"],
            nMissingWeights=r["n_missing_weights"],
            hazardTotal=float(r["hazard_total"]) if r["hazard_total"] is not None else None,
            exposureTotal=float(r["exposure_total"]) if r["exposure_total"] is not None else None,
            isComputable=r["is_computable"],
        )
        for r in rows
    ]


@router.get("/{scope}/weights", response_model=ProfileWeights)
async def get_weights(
    scope: str = Path(description="province:sector:subsector:hazard, e.g. CEN:AGRICULTURE:PADDY:drought"),
    pool: asyncpg.Pool = Depends(db),
) -> ProfileWeights:
    sc = parse_scope(scope)
    await _scope_ids(pool, sc)      # 404 naming the wrong part, before "no profile"

    prof = await pool.fetchrow(_ACTIVE_PROFILE, sc.province, sc.sector, sc.subsector, sc.hazard)
    if prof is None:
        raise HTTPException(status_code=404, detail=f"no active profile for scope {sc.encode()}")

    rows = await pool.fetch(_VARIABLES, prof["id"])
    variables = [
        ProfileVariable(
            indicatorCode=r["indicator_code"], indicatorName=r["name"],
            unit=r["unit"], domain=r["domain"],
            weightPct=float(r["weight_pct"]) if r["weight_pct"] is not None else None,
            relationship=r["relationship"],
            consensus=r["consensus"], consensusNote=r["consensus_note"],
            decidedAt=r["decided_at"].isoformat() if r["decided_at"] else None,
            decidedBy=r["decided_by"],
            isCompositeIndex=r["is_composite_index"],
        )
        for r in rows
    ]

    ready = await pool.fetchrow(
        "SELECT is_computable FROM v_profile_readiness WHERE profile_id = $1", prof["id"]
    )

    return ProfileWeights(
        scope=sc.encode(), profileId=prof["id"], code=prof["code"],
        profileVersion=prof["version"], publication=prof["publication"],
        owner=prof["owner"], derivedFrom=prof["derived_from"],
        panelNote=prof["panel_note"],
        isComputable=bool(ready["is_computable"]) if ready else False,
        totals=_totals(variables),
        hazardVariables=[v for v in variables if v.domain == "hazard"],
        exposureVariables=[v for v in variables if v.domain == "exposure"],
    )


@router.put("/{scope}/weights", response_model=ProfileWeights)
async def put_weights(
    body: SaveWeights,
    scope: str = Path(description="province:sector:subsector:hazard"),
    pool: asyncpg.Pool = Depends(db),
    user: CurrentUser = Depends(get_current_user),
) -> ProfileWeights:
    """Write a new profile version. Returns the saved profile, so the editor
    renders what the database actually stored rather than what it sent."""
    sc = parse_scope(scope)
    ids = await _scope_ids(pool, sc)

    # NFR-4, default deny. A data officer or expert may only edit their own
    # province; an administrator has no province and may edit any.
    if not user.has_role("admin"):
        if not (user.has_role("expert") or user.has_role("data_officer")):
            raise HTTPException(status_code=403, detail="expert or data officer role required")
        if sc.province is None:
            raise HTTPException(status_code=403, detail="only an administrator may edit a national profile")
        if user.province_id != ids["province_id"]:
            raise HTTPException(
                status_code=403,
                detail=f"you are scoped to {user.province or 'no province'} and cannot edit {sc.province}",
            )
        # Sector scope, asked of the database rather than reimplemented here
        # (schema_write_scope_addendum.sql). Weights are the sharper case: they
        # decide published scores, and save_profile_weights() records decided_by
        # permanently — attributing a tea weighting to a fisheries expert does
        # not merely risk a bad number, it makes the audit trail assert
        # something false.
        may = await pool.fetchval(
            "SELECT may_write_profile($1, $2, $3, $4)",
            user.id, ids["province_id"], ids["sector_id"], ids["subsector_id"])
        if not may:
            raise HTTPException(
                status_code=403,
                detail=(f"you are not granted {sc.sector}"
                        + (f" / {sc.subsector}" if sc.subsector else "")
                        + ". Weights are attributed permanently to whoever saves "
                          "them, so they may only be set within your own sectors. "
                          "Ask an administrator to widen your scope."),
            )

    # ONLY AN ACTIVE VARIABLE MAY JOIN A PROFILE (schema.sql rev 5).
    #
    # This is checked here rather than inside save_profile_weights() on purpose.
    # That function's body is SPLICED INTO by
    # schema_weights_save_completeness_addendum.sql, which finds the body in
    # pg_proc and edits it -- so every change to the function has to be applied
    # in the right order or the splice is silently overwritten (RUN_LOCALLY.md
    # documents this as the one failure that does not announce itself). Adding a
    # guard there would put a live foot-gun in the way of a rule that has no
    # other caller. It is stated once, here, at the only endpoint that adds
    # variables to a profile.
    codes = [i.indicatorCode for i in body.items]
    not_active = await pool.fetch(
        """SELECT code, status::text AS status FROM indicator_catalog
            WHERE code = ANY($1::text[]) AND status <> 'active'""", codes)
    if not_active:
        raise HTTPException(
            status_code=422,
            detail="these variables are not active in the catalogue, so they "
                   "cannot be weighted into a profile: "
                   + ", ".join("%s (%s)" % (r["code"], r["status"]) for r in not_active)
                   + ". An administrator approves a proposed variable before it "
                     "can carry a weight.")
    unknown = set(codes) - {r["code"] for r in await pool.fetch(
        "SELECT code FROM indicator_catalog WHERE code = ANY($1::text[])", codes)}
    if unknown:
        raise HTTPException(
            status_code=422,
            detail="no such variable: " + ", ".join(sorted(unknown)))

    items = [
        {
            # The database function's own payload keys are snake_case; this is
            # the one place the two conventions meet, and it is a deliberate
            # translation rather than a leak.
            "code": i.indicatorCode,
            "domain": i.domain,
            "weight_pct": i.weightPct,
            "relationship": i.relationship,
            "consensus": i.consensus,
            "consensus_note": i.consensusNote,
        }
        for i in body.items
    ]

    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.fetchval(
                    "SELECT save_profile_weights($1,$2,$3,$4,$5::jsonb,$6,$7,$8)",
                    ids["province_id"], ids["sector_id"], ids["subsector_id"],
                    ids["hazard_type_id"], __import__("json").dumps(items),
                    user.id, None, body.panelNote,
                )
    except asyncpg.exceptions.RaiseError as exc:
        # These are the rules talking -- the 100% total, the contested note,
        # FR-4.9b -- and their messages are written for the person editing the
        # weights. Pass them through; do not paraphrase.
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except asyncpg.exceptions.CheckViolationError as exc:
        log.warning("weights save violated a CHECK: %s", exc)
        raise HTTPException(status_code=422, detail="the saved weights violate a schema rule") from exc

    return await get_weights(scope=sc.encode(), pool=pool)
