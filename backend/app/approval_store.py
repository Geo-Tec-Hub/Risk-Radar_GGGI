"""Storing changes that wait for approval (client NOTED-17, item 9).

An expert's assessment and an official data-entry user's import or correction
are not applied when submitted. They are stored here with everything needed to
apply them later, and routers/approvals.py applies them -- as the person who
submitted them, through the same code path -- when the provincial (or super)
administrator approves. Until then the map keeps the approved values.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

log = logging.getLogger(__name__)

# Where approval notices would be e-mailed. No mail server is configured yet
# (owner, 24 Nov 2026): the request is stored and listed on the Approvals page,
# and this address is shown to users as the contact.
NOTIFY_ADDRESS = "admin@climatica.com"


async def submit_change(conn, *, kind: str, province_id: int, user, summary: str,
                        payload: dict, division_id: Optional[int] = None, prof=None,
                        source: Optional[str] = None, file_name: Optional[str] = None,
                        file_body: Optional[bytes] = None) -> int:
    pid = await conn.fetchval(
        """INSERT INTO pending_change
               (kind, province_id, submitted_by, summary, payload, file_name, file_body,
                ds_division_id, sector_id, subsector_id, hazard_type_id, source)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id""",
        kind, province_id, user.id, summary, json.dumps(payload, default=str),
        file_name, file_body, division_id,
        prof["sector_id"] if prof else None, prof["subsector_id"] if prof else None,
        prof["hazard_type_id"] if prof else None, source)
    log.info("pending change %s (%s) by user %s for province %s", pid, kind, user.id, province_id)
    # E-mail the province's administrators and the super administrators (NOTED-19).
    from app.config import get_settings
    from app.mailer import admin_emails, notify_in_background, send_mail
    to = await admin_emails(conn, province_id)
    pname = await conn.fetchval("SELECT name FROM province WHERE id = $1", province_id)
    reason = (payload or {}).get("note") if isinstance(payload, dict) else None
    notify_in_background(send_mail(
        to, "Climatica: approval needed -- %s" % summary[:120],
        "A change is waiting for your approval in Climatica.\n\n"
        "Province: %s\nSubmitted by: %s\nChange: %s\n%s\n"
        "Review it here: %s/admin/approvals\n"
        % (pname, user.full_name or user.email, summary,
           ("Reason given: %s\n" % reason) if reason else "", get_settings().public_url)))
    return pid


async def pending_for(conn, prof, division_id: int, source: str) -> Optional[dict]:
    """The waiting change for this division and scope, if any."""
    r = await conn.fetchrow(
        """SELECT id, kind, submitted_by, submitted_at FROM pending_change
            WHERE status = 'pending' AND ds_division_id = $1 AND sector_id = $2
              AND subsector_id IS NOT DISTINCT FROM $3 AND hazard_type_id = $4
              AND source = $5
            ORDER BY id DESC LIMIT 1""",
        division_id, prof["sector_id"], prof["subsector_id"], prof["hazard_type_id"], source)
    return dict(r) if r else None
