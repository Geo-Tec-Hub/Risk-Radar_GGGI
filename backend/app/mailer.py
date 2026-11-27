"""E-mail through Resend (client NOTED-19, items 6 and 7).

Uses Resend's HTTP API (https://api.resend.com/emails) with only the standard
library, so no new package is needed. With RESEND_API_KEY unset, nothing is
sent and the message is logged instead -- the portal works the same either way.
Sending never breaks the action that triggered it: a failed e-mail is logged
and reported, never raised into the save or approval itself.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import urllib.error
import urllib.request
from typing import Optional

from app.config import get_settings

log = logging.getLogger(__name__)


def _post(payload: dict, key: str) -> tuple[bool, str]:
    req = urllib.request.Request(
        "https://api.resend.com/emails", data=json.dumps(payload).encode(),
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json",
                 "User-Agent": "Climatica/1.0"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return True, r.read().decode()[:200]
    except urllib.error.HTTPError as e:
        return False, "%s %s" % (e.code, e.read().decode()[:300])
    except Exception as e:                          # network, DNS, timeout
        return False, str(e)


async def send_mail(to: list[str], subject: str, text: str,
                    attachment: Optional[tuple[str, bytes]] = None) -> tuple[bool, str]:
    """(sent, detail). `to` may hold several addresses; empty -> nothing sent."""
    to = sorted({t.strip() for t in to if t and "@" in t})
    if not to:
        return False, "no recipient"
    s = get_settings()
    if not s.resend_api_key:
        log.info("e-mail not sent (RESEND_API_KEY not set): to=%s subject=%s", to, subject)
        return False, "e-mail is not configured on the server (RESEND_API_KEY)"
    payload = {"from": s.mail_from, "to": to, "subject": subject, "text": text}
    if attachment:
        payload["attachments"] = [{"filename": attachment[0],
                                   "content": base64.b64encode(attachment[1]).decode()}]
    ok, detail = await asyncio.to_thread(_post, payload, s.resend_api_key)
    (log.info if ok else log.warning)("e-mail %s to %s: %s (%s)",
                                      "sent" if ok else "FAILED", to, subject, detail)
    return ok, detail


async def admin_emails(conn, province_id: Optional[int], *, sharing: bool = False) -> list[str]:
    """Super administrators, plus the province's administrators -- or, for a
    data request, the data sharing administrators."""
    rows = await conn.fetch(
        """SELECT DISTINCT u.email FROM app_user u
             JOIN user_role ur ON ur.user_id = u.id JOIN role r ON r.id = ur.role_id
            WHERE u.status = 'active'
              AND (r.code = 'admin'
                   OR (r.code = 'province_admin' AND NOT $2 AND u.province_id = $1)
                   OR (r.code = 'data_sharing_admin' AND $2))""",
        province_id, sharing)
    return [r["email"] for r in rows]


def notify_in_background(coro) -> None:
    """Fire and forget, so a slow mail server never slows the user's click."""
    task = asyncio.get_running_loop().create_task(coro)
    task.add_done_callback(lambda t: t.exception() and log.warning("mail task: %s", t.exception()))
