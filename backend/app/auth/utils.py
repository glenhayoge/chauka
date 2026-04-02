from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from app.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash. Supports bcrypt and Django PBKDF2."""
    if hashed_password.startswith("pbkdf2_sha256$"):
        # Django PBKDF2 format: pbkdf2_sha256$iterations$salt$hash
        return _verify_django_pbkdf2(plain_password, hashed_password)
    # bcrypt
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


def _verify_django_pbkdf2(plain_password: str, stored_hash: str) -> bool:
    """Verify against Django's PBKDF2-SHA256 hash format."""
    import hashlib
    import base64

    parts = stored_hash.split("$")
    if len(parts) != 4:
        return False
    _, iterations, salt, hash_b64 = parts
    iterations = int(iterations)
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return base64.b64encode(dk).decode("utf-8") == hash_b64
