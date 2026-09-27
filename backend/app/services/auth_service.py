from datetime import datetime, timedelta
from typing import Optional
import hashlib
import hmac
import secrets
import jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole, AuthProvider

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2:{salt}:{key.hex()}"

def verify_password(plain: str, hashed: Optional[str]) -> bool:
    if not hashed:
        return False
    if hashed.startswith("pbkdf2:"):
        try:
            parts = hashed.split(":")
            salt = parts[1]
            stored_key = parts[2]
            key = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt.encode("utf-8"), 100000)
            return hmac.compare_digest(key.hex(), stored_key)
        except Exception:
            return False
    try:
        import bcrypt
        return bcrypt.checkpw(plain.encode('utf-8')[:72], hashed.encode('utf-8'))
    except Exception:
        pass
    return plain == hashed

def create_access_token(user_id: int, email: str, role: str, name: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "name": name,
        "role": role,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session expired or invalid token")

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication credentials required")
    payload = decode_token(token)
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account is inactive or not found")
    return user

def register_user(db: Session, name: str, email: str, password: str, role: UserRole = UserRole.user) -> User:
    existing = db.query(User).filter(User.email == email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists")

    user = User(
        name=name,
        email=email.lower(),
        password_hash=hash_password(password),
        auth_provider=AuthProvider.email,
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account has been deactivated")
    return user

def find_or_create_oauth_user(
    db: Session,
    email: str,
    name: str,
    provider: AuthProvider,
    provider_user_id: str,
    profile_image: Optional[str] = None,
    default_role: UserRole = UserRole.user
) -> User:
    user = db.query(User).filter(User.email == email.lower()).first()
    if user:
        if not user.provider_user_id:
            user.provider_user_id = str(provider_user_id)
            user.auth_provider = provider
        if profile_image and not user.profile_image:
            user.profile_image = profile_image
        db.commit()
        db.refresh(user)
        return user

    new_user = User(
        name=name or email.split('@')[0],
        email=email.lower(),
        auth_provider=provider,
        provider_user_id=str(provider_user_id),
        profile_image=profile_image,
        role=default_role,
        password_hash=None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def seed_default_accounts(db: Session):
    defaults = [
        {"name": "Admin User", "email": "admin@pricepilot.ai", "pw": "Admin@123", "role": UserRole.admin},
        {"name": "Sarah Chen", "email": "analyst@pricepilot.ai", "pw": "Analyst@123", "role": UserRole.analyst},
        {"name": "Raj Kumar", "email": "user@pricepilot.ai", "pw": "User@123", "role": UserRole.user},
    ]
    for d in defaults:
        if not db.query(User).filter(User.email == d["email"]).first():
            u = User(
                name=d["name"],
                email=d["email"],
                password_hash=hash_password(d["pw"]),
                auth_provider=AuthProvider.email,
                role=d["role"]
            )
            db.add(u)
    db.commit()

def require_roles(*roles: UserRole):
    def _check(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}"
            )
        return current_user
    return _check
