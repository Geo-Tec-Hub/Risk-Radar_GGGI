"""
Public data requests (client NOTED-17, item 10).

    POST /api/data-requests               anyone: ask for the index data of a map
    GET  /api/data-requests               data sharing administrator: the requests
    GET  /api/data-requests/{id}/pdf      the data, as a PDF to send to the person
    POST /api/data-requests/{id}/status   mark shared / declined

WHAT IS SHARED. Only the index data of the requested map: for each DS division
the hazard index H, the exposure (sector) index E, H x E and the present
exposure index, and the profile weights with each variable's data source,
unit and direction (+/-). Never the raw figures behind them. The map shown is
the FINAL map -- the expert track where it has scores, else the official one.

E-MAIL. No mail server is configured yet (owner, 24 Nov 2026). Requests are
stored and listed for the data sharing administrator; the person is told the
contact address, admin@climatica.com, and the administrator sends the PDF.
"""

from __future__ import annotations

import datetime
import io
import logging
from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from app.deps import CurrentUser, db, get_current_user

log = logging.getLogger(__name__)

router = APIRouter(prefix="/data-requests", tags=["data requests"])

DATA_DISCLAIMER = (
    "By using these data you acknowledge that climate information is subject to scientific "
    "and methodological uncertainties; that the information is provided without warranties; "
    "that you are responsible for its use, interpretation and validation; and that applicable "
    "intellectual property, attribution and data-sharing requirements must be respected. The "
    "provision of this information does not create additional legal, financial or other "
    "obligations for the contributing institutions. This is a system-generated document and "
    "does not require a physical signature.")


def _require_sharer(user: CurrentUser) -> None:
    if not (user.has_role("data_sharing_admin") or user.has_role("admin")):
        raise HTTPException(403, "for the data sharing administrator")


class RequestIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=320)
    organization: Optional[str] = Field(default=None, max_length=200)
    purpose: str = Field(min_length=5, max_length=2000)
    province: str = Field(description="province code, e.g. CEN")
    sector: str
    subsector: Optional[str] = None
    hazard: str
    period: str = Field(pattern=r"^\d{4}-\d{4}$")


class RequestOut(BaseModel):
    id: int
    full_name: str
    email: str
    organization: Optional[str]
    purpose: str
    province: Optional[str]
    sector: Optional[str]
    subsector: Optional[str]
    hazard: Optional[str]
    period: Optional[str]
    requested_at: str
    status: str
    handled_by: Optional[str]
    note: Optional[str]


@router.post("", status_code=201)
async def create(body: RequestIn, pool: asyncpg.Pool = Depends(db)) -> dict:
    pid = await pool.fetchval("SELECT id FROM province WHERE code = $1", body.province.upper())
    if pid is None:
        raise HTTPException(422, "unknown province")
    if "@" not in body.email:
        raise HTTPException(422, "please give a valid e-mail address")
    rid = await pool.fetchval(
        """INSERT INTO data_request (full_name, email, organization, purpose, province_id,
                                     sector_code, subsector_code, hazard_code, period)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id""",
        body.full_name.strip(), body.email.strip().lower(), body.organization, body.purpose.strip(),
        pid, body.sector.upper(), body.subsector.upper() if body.subsector else None,
        body.hazard.lower(), body.period)
    log.info("data request %s from %s", rid, body.email)
    from app.config import get_settings
    from app.mailer import admin_emails, notify_in_background, send_mail
    async with pool.acquire() as conn:
        to = await admin_emails(conn, None, sharing=True)
    notify_in_background(send_mail(
        to, "Climatica: data request from %s" % body.full_name,
        "%s (%s%s) asks for the index data of %s / %s%s / %s / %s.\n\nPurpose: %s\n\n"
        "Handle it here: %s/admin/data-requests\n"
        % (body.full_name, body.email, ", " + body.organization if body.organization else "",
           body.province, body.sector, "/" + body.subsector if body.subsector else "",
           body.hazard, body.period, body.purpose, get_settings().public_url)))
    return {"id": rid, "status": "new",
            "message": "Your request has been sent to the data sharing administrator, "
                       "who will reply to %s by e-mail." % body.email.strip().lower()}


_LIST_SQL = """
    SELECT r.*, p.name AS province, u.full_name AS handler
      FROM data_request r
      LEFT JOIN province p ON p.id = r.province_id
      LEFT JOIN app_user u ON u.id = r.handled_by
"""


def _out(r) -> RequestOut:
    return RequestOut(
        id=r["id"], full_name=r["full_name"], email=r["email"], organization=r["organization"],
        purpose=r["purpose"], province=r["province"], sector=r["sector_code"],
        subsector=r["subsector_code"], hazard=r["hazard_code"], period=r["period"],
        requested_at=r["requested_at"].isoformat(), status=r["status"],
        handled_by=r["handler"], note=r["note"])


@router.get("", response_model=list[RequestOut])
async def list_requests(
    user: CurrentUser = Depends(get_current_user),
    pool: asyncpg.Pool = Depends(db),
) -> list[RequestOut]:
    _require_sharer(user)
    return [_out(r) for r in await pool.fetch(_LIST_SQL + " ORDER BY r.requested_at DESC LIMIT 300")]


class StatusIn(BaseModel):
    status: str = Field(pattern="^(new|shared|declined)$")
    note: Optional[str] = Field(default=None, max_length=1000)


@router.post("/{request_id}/status", response_model=RequestOut)
async def set_status(
    request_id: int,
    body: StatusIn,
    user: CurrentUser = Depends(get_current_user),
    pool: asyncpg.Pool = Depends(db),
) -> RequestOut:
    _require_sharer(user)
    done = await pool.execute(
        """UPDATE data_request SET status = $2, note = $3, handled_by = $4, handled_at = now()
            WHERE id = $1""", request_id, body.status, body.note, user.id)
    if done.endswith(" 0"):
        raise HTTPException(404, "no such request")
    return _out(await pool.fetchrow(_LIST_SQL + " WHERE r.id = $1", request_id))


@router.get("/{request_id}/pdf")
async def data_pdf(
    request_id: int,
    user: CurrentUser = Depends(get_current_user),
    pool: asyncpg.Pool = Depends(db),
) -> Response:
    _require_sharer(user)
    name, body = await build_pdf(pool, request_id)
    return Response(content=body, media_type="application/pdf",
                    headers={"Content-Disposition": 'attachment; filename="%s"' % name})


async def build_pdf(pool, request_id: int) -> tuple[str, bytes]:
    req = await pool.fetchrow(_LIST_SQL + " WHERE r.id = $1", request_id)
    if req is None:
        raise HTTPException(404, "no such request")
    from app.routers.vulnerability import results as vulnerability_results
    pcode = await pool.fetchval("SELECT code FROM province WHERE id = $1", req["province_id"])
    track = "expert"
    units = await vulnerability_results(
        province=pcode, sector=req["sector_code"], hazard=req["hazard_code"],
        period=req["period"], subsector=req["subsector_code"], indexScope="provincial",
        track=track, pool=pool)
    if not any(u.state == "assessed" for u in units):
        track = "data"
        units = await vulnerability_results(
            province=pcode, sector=req["sector_code"], hazard=req["hazard_code"],
            period=req["period"], subsector=req["subsector_code"], indexScope="provincial",
            track=track, pool=pool)
    async with pool.acquire() as conn:
        prof = await conn.fetchrow(
            """SELECT vp.id, vp.code, vp.version, s.name AS sector, ss.name AS subsector,
                      h.name AS hazard, vp.province_id
                 FROM vulnerability_profile vp
                 JOIN sector s ON s.id = vp.sector_id
                 LEFT JOIN subsector ss ON ss.id = vp.subsector_id
                 JOIN hazard_type h ON h.id = vp.hazard_type_id
                WHERE vp.is_active AND vp.province_id = $1 AND s.code = $2
                  AND COALESCE(ss.code, '-') = COALESCE($3, '-') AND h.code = $4""",
            req["province_id"], req["sector_code"], req["subsector_code"], req["hazard_code"])
        if prof is None:
            raise HTTPException(404, "no active profile for that request")
        weights = await conn.fetch(
            """SELECT ic.code, ic.name, pi.domain::text AS domain, pi.weight_pct::float8 AS w,
                      ic.unit, pi.relationship::text AS rel,
                      COALESCE(ps.data_source, ic.default_data_source) AS source
                 FROM profile_indicator pi
                 JOIN indicator_catalog ic ON ic.id = pi.indicator_id
                 LEFT JOIN indicator_province_source ps
                        ON ps.indicator_id = ic.id AND ps.province_id = $2
                WHERE pi.profile_id = $1 AND pi.consensus IN ('agreed', 'contested')
                ORDER BY pi.domain DESC, pi.weight_pct DESC NULLS LAST, ic.code""",
            prof["id"], req["province_id"])
    body = _render(req, prof, track, units, weights)
    return "Climatica_data_%s_%s.pdf" % (prof["code"], req["period"]), body


@router.post("/{request_id}/send", response_model=RequestOut)
async def send(
    request_id: int,
    user: CurrentUser = Depends(get_current_user),
    pool: asyncpg.Pool = Depends(db),
) -> RequestOut:
    """E-mail the data PDF to the address on the request, and mark it shared
    (NOTED-19, item 7)."""
    _require_sharer(user)
    from app.mailer import send_mail
    req = await pool.fetchrow(_LIST_SQL + " WHERE r.id = $1", request_id)
    if req is None:
        raise HTTPException(404, "no such request")
    name, body = await build_pdf(pool, request_id)
    ok, detail = await send_mail(
        [req["email"]], "Climatica: the data you requested",
        "Dear %s,\n\nPlease find attached the index data you requested from Climatica "
        "(%s / %s%s / %s / %s).\n\nBy using these data you acknowledge the conditions in "
        "the disclaimer at the bottom of the document.\n\nClimatica data sharing administrator\n"
        % (req["full_name"], req["province"], req["sector_code"],
           "/" + req["subsector_code"] if req["subsector_code"] else "", req["hazard_code"],
           req["period"]), attachment=(name, body))
    if not ok:
        raise HTTPException(502, "the e-mail could not be sent: %s" % detail)
    await pool.execute(
        """UPDATE data_request SET status = 'shared', handled_by = $2, handled_at = now(),
                  note = COALESCE(note || ' | ', '') || $3 WHERE id = $1""",
        request_id, user.id, "e-mailed to %s" % req["email"])
    return _out(await pool.fetchrow(_LIST_SQL + " WHERE r.id = $1", request_id))


@router.delete("/{request_id}", status_code=204)
async def remove(
    request_id: int,
    user: CurrentUser = Depends(get_current_user),
    pool: asyncpg.Pool = Depends(db),
) -> None:
    """Delete an unwanted request (NOTED-19, item 8)."""
    _require_sharer(user)
    done = await pool.execute("DELETE FROM data_request WHERE id = $1", request_id)
    if done.endswith(" 0"):
        raise HTTPException(404, "no such request")


def _render(req, prof, track, units, weights) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    st = getSampleStyleSheet()
    small = st["BodyText"].clone("small", fontSize=7, leading=9, textColor=colors.HexColor("#555555"))
    cell = st["BodyText"].clone("cell", fontSize=7.5, leading=9)
    buf = io.BytesIO()

    def footer(c, doc):
        c.saveState()
        c.setFont("Helvetica", 6)
        c.setFillColor(colors.HexColor("#666666"))
        from reportlab.pdfbase.pdfmetrics import stringWidth
        width, y, line = doc.pagesize[0] - 30 * mm, 22 * mm, ""
        for w in DATA_DISCLAIMER.split():
            t = (line + " " + w).strip()
            if stringWidth(t, "Helvetica", 6) > width:
                c.drawString(15 * mm, y, line)
                y -= 7.5
                line = w
            else:
                line = t
        c.drawString(15 * mm, y, line)
        c.drawRightString(doc.pagesize[0] - 15 * mm, 8 * mm, "Page %d" % doc.page)
        c.restoreState()

    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm,
                            topMargin=15 * mm, bottomMargin=35 * mm,
                            title="Climatica index data", author="Climatica")
    what = prof["sector"] + (" / " + prof["subsector"] if prof["subsector"] else "")
    flow = [
        Paragraph("Climatica - index data", st["Title"]),
        Paragraph("%s Province  |  %s  |  %s  |  %s" % (req["province"], what, prof["hazard"],
                                                       req["period"]), st["Heading4"]),
        Paragraph("Prepared for %s%s on %s. Profile %s (version %d). Source: %s track "
                  "(the expert track where it has scores, otherwise the official track). "
                  "Indexes are provincial: scaled within %s Province." % (
                      req["full_name"], (", " + req["organization"]) if req["organization"] else "",
                      datetime.date.today().strftime("%d %b %Y"), prof["code"], prof["version"],
                      "Expert" if track == "expert" else "Official", req["province"]), small),
        Spacer(1, 4 * mm),
        Paragraph("Index values by DS division", st["Heading3"]),
    ]
    rows = [["DS division", "District", "Hazard index (H)", "Exposure index (E)", "H x E",
             "Present exposure index"]]
    for u in sorted(units, key=lambda x: (x.district, x.dsDivision)):
        if u.hazardIndex is None:
            continue
        rows.append([u.dsDivision, u.district, "%.4f" % u.hazardIndex, "%.4f" % u.exposureIndex,
                     "%.4f" % (u.hazardIndex * u.exposureIndex),
                     "%.4f" % u.value if u.value is not None else "sector not present"])
    t = Table(rows, repeatRows=1, colWidths=[38 * mm, 30 * mm, 26 * mm, 28 * mm, 20 * mm, 36 * mm])
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 7.5),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 7.5),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e9ecef")),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#adb5bd")),
        ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
    ]))
    flow += [t, Spacer(1, 6 * mm), Paragraph("Profile weights", st["Heading3"])]
    wrows = [["Domain", "Variable", "Weight %", "Unit", "Data source", "Direction"]]
    for w in weights:
        wrows.append([w["domain"].capitalize(), Paragraph(w["name"] or w["code"], cell),
                      "%g" % w["w"] if w["w"] is not None else "-", Paragraph(w["unit"] or "-", cell),
                      Paragraph(w["source"] or "-", cell),
                      Paragraph("+ (higher = more exposed)" if w["rel"] == "higher_is_worse"
                                else "&minus; (higher = less exposed)", cell)])
    wt = Table(wrows, repeatRows=1, colWidths=[17 * mm, 55 * mm, 15 * mm, 24 * mm, 36 * mm, 33 * mm])
    wt.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 7.5),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 7.5),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e9ecef")),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#adb5bd")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    flow.append(wt)
    doc.build(flow, onFirstPage=footer, onLaterPages=footer)
    return buf.getvalue()
