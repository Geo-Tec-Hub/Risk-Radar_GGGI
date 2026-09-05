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
import logging
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

log = logging.getLogger(__name__)

_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """A wrong password is False. So is a stored hash argon2 cannot parse.

    Found 5 September 2026: a row whose password_hash was a placeholder (a
    seeded or hand-inserted account) raised InvalidHashError out of here, and
    the login route turned it into a 500. That fails closed, so it was never a
    way in -- but it is the wrong answer. The account cannot authenticate, and
    the honest report of that is "these credentials do not work", not "the
    server is broken". A 500 also sends whoever is debugging it to the wrong
    place entirely. InvalidHashError is NOT a subclass of VerificationError in
    argon2-cffi -- it derives from ValueError -- so it has to be named
    explicitly; catching the base class alone would have looked like a fix and
    changed nothing. Both are logged because either means the row needs
    repairing, and the hash itself is never logged.
    """
    try:
        return _hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False
    except (InvalidHashError, VerificationError):
        log.warning("stored password hash is unusable; treating the login as "
                    "a failure. The account cannot sign in until its hash is "
                    "reset.")
        return False


def new_session_token() -> tuple[str, str]:
    """Returns (raw_token, token_hash). raw_token goes in the cookie; only
    token_hash is ever written to app_session."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_session_token(raw)


def hash_session_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
