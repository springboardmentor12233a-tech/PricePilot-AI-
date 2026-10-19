from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate


def register_user(db: Session, user_in: UserCreate) -> User:
    existing_user = db.query(User).filter(User.email == str(user_in.email).lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = User(
        email=str(user_in.email).lower(),
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Compatibility credential check. Routes must use begin_login and OTP verification."""
    from app.core.security import verify_password

    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if user is None or not user.is_active or not verify_password(password, user.hashed_password):
        return None
    return user


def create_user_tokens(db: Session, user_id):
    """Password-only token issuance is disabled; OTP verification creates sessions."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Complete email verification before creating an authenticated session.",
    )