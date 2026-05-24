from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, Header, HTTPException

from app.database import get_connection

SECRET = "stoa-local-dev-secret"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return f"pbkdf2_sha256${salt}${base64.b64encode(digest).decode()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, salt, digest = password_hash.split("$", 2)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    return hmac.compare_digest(hash_password(password, salt), f"{algorithm}${salt}${digest}")


def _sign(payload: str) -> str:
    return hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()


def create_access_token(user_id: str) -> str:
    payload = base64.urlsafe_b64encode(json.dumps({"sub": user_id}).encode()).decode()
    return f"{payload}.{_sign(payload)}"


def decode_access_token(token: str) -> str:
    try:
      payload, signature = token.split(".", 1)
    except ValueError as exc:
      raise HTTPException(status_code=401, detail="Invalid token") from exc
    if not hmac.compare_digest(_sign(payload), signature):
      raise HTTPException(status_code=401, detail="Invalid token")
    data = json.loads(base64.urlsafe_b64decode(payload.encode()).decode())
    return str(data["sub"])


def public_user(row: Any) -> dict[str, str]:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
    }


def current_user(authorization: str | None = Header(default=None)) -> dict[str, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    user_id = decode_access_token(authorization.removeprefix("Bearer ").strip())
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=401, detail="Unknown user")
    return public_user(row)


def require_role(*roles: str):
    def dependency(user: dict[str, str] = Depends(current_user)) -> dict[str, str]:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user

    return dependency
