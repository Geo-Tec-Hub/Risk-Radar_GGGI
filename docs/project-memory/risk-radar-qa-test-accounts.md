---
name: risk-radar-qa-test-accounts
description: The QA test accounts on the local riskradar database — emails, roles, and how to recreate them after a rebuild
type: reference
---

Created by the 4 September 2026 QA pass on a **local** `riskradar` database.

| Email | Password | Role | Province |
|---|---|---|---|
| admin@riskradar.lk | `QaAdmin!2026` | admin | — |
| qa.dataofficer@example.com | `TestPass123!` | data_officer | Central |
| qa.pending.user1@example.com | `TestPass123!` | community | — |
| qa.reject.user1@example.com | `TestPass123!` | — (rejected, cannot sign in) | — |
| qa.failclosed.target@example.com | — | — (still pending, never approved) | — |

`admin@riskradar.lk` is the bootstrap administrator; its password was reset to
the value above for testing. Use it for `/admin/registrations` — approving and
rejecting registrations is admin-only and fails closed for everyone else.

`qa.dataofficer@example.com` is the one to use for the import tab and the
weights editor: importing needs `data_officer` or `expert`, and the schema
refuses either role without a province. An admin is **not** enough on its own.

The last two are **deliberately unusable** — they exist to prove the negative
cases (a rejected account still refuses sign-in; a pending one is never
silently approved). Do not "fix" them.

## Scope — local fixtures only

A development database on one machine. Note that unlike the `@example.com`
rows, `admin@riskradar.lk` is on a **real-looking domain and is an
administrator**: if that address and password ever exist on a deployed
instance, this file becomes a liability rather than a convenience. Change it
before anything is exposed beyond localhost, and do not add real credentials
here.

## They do not survive a rebuild

`apply_native.ps1 -CreateDb` drops the database, so these go with it. To
recreate: bootstrap an admin, then self-register each account at `/register`
and approve it at `/admin/registrations`.

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\db\bootstrap_admin.ps1 `
  -Email admin@riskradar.lk -Password '<pick one>' -FullName "Risk Radar Admin"
```

That script exists to break a chicken-and-egg: only an admin can grant the
admin role, so the first one is made directly against the database.

Granting `data_officer` needs `app_user.province_id` set **first** —
`enforce_user_province_scope()` raises otherwise, because SRS §3.2 binds a data
officer or expert to exactly one province and enforces it server-side on every
write.

Passwords are argon2id and cannot be read back from the database. To reset one,
re-hash with the app's own hasher rather than inventing one:

```powershell
.\venv\Scripts\python.exe -c "from app.security import hash_password; print(hash_password('<new>'))"
```

Also present and **not** a login: `panel-import@riskradar.local`, a suspended
service account whose only purpose is to carry attribution for decisions loaded
from a file. Its `password_hash` is `!no-login`, which no hasher produces, so
nothing can authenticate as it. See [[risk-radar-central-data-loaded]].

Related: [[risk-radar-qa-2026-09-04]], [[risk-radar-import-tab]].
