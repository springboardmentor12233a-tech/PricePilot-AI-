"""
Security utilities (PDF Module 1: Authentication and authorization).

Two separate concerns here, both standard practice:
  1. PASSWORD HASHING (bcrypt) -- we NEVER store a user's actual password,
     only a one-way hash of it. Even if the database leaked, an attacker
     couldn't recover the real password from the hash.
  2. JWT TOKENS -- after login, instead of the client re-sending a
     username/password on every request, we hand back a signed token.
     The client sends that token on future requests, and we verify its
     signature (using SECRET_KEY) to confirm it's genuine and unexpired,
     without needing to hit the database on every single request just
     to check "is this password right."
"""

from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Returns the decoded payload if valid, or None if the token is
    invalid/expired -- caller decides how to respond (usually a 401)."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
    