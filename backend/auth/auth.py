from sqlalchemy.orm import Session

from backend.database.models import User, Role
from backend.auth.security import (
    hash_password,
    verify_password,
    create_access_token
)


def register_user(
    db: Session,
    username: str,
    email: str,
    password: str,
    role_name: str
):
    # Check whether username already exists
    existing_username = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if existing_username:
        return None, "Username already exists"

    # Check whether email already exists
    existing_email = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_email:
        return None, "Email already exists"

    # Find requested role
    role = (
        db.query(Role)
        .filter(Role.name == role_name)
        .first()
    )

    if not role:
        return None, "Invalid role"

    # Hash password
    password_hash = hash_password(password)

    # Create user
    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        role_id=role.id
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user, None


def login_user(
    db: Session,
    email: str,
    password: str
):
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        return None

    if not verify_password(
        password,
        user.password_hash
    ):
        return None

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.name
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "role": user.role.name
    }