"""
Passwords and session tokens (T2b).

Two different secrets, two different treatments, on purpose:

* A password is chosen by a human and is comparatively low-entropy, so it
  must be hashed with something slow and memory-hard to resist offline
  guessing -- argon2id (PasswordHasher's default profile). This is the only
  password hashing in the app; app_user.password_hash is NOT NULL, so every
  registration (including a community user) sets one, per T2b's brief.

* A session token is generated here with `secrets.token_urlsafe`, already
  128 bits of CSPRNG entropy -- guessing one is infeasible regardless of hash
  speed, so a fast SHA-256 digest is enough for what the database needs to
  store (schema_session_addendum.sql, `token_hash`). The raw token is
  returned once, for the cookie, and never stored -- see that file's header
  comment for why (a database read alone must not be enough to impersonate
  a session).
"""

from __future__ import annotations

import hashlib
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def new_session_token() -> tuple[str, str]:
    """Returns (raw_token, token_hash). raw_token goes in the cookie; only
    token_hash is ever written to app_session."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_session_token(raw)


def hash_session_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
