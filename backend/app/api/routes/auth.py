"""
User Management API endpoints (PDF Module 1).

Includes get_current_user(), a reusable FastAPI dependency other routers
can import to REQUIRE a logged-in user (e.g. `Depends(get_current_user)`)
-- this is what turns "we have a login endpoint" into actual role-based
access control across the rest of the app, per the PDF's requirement.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.models.models import User, UserRole
from app.schemas.auth import UserRegister, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["User Management"])

# tokenUrl points at our login endpoint -- this is what makes the
# "Authorize" button appear in /docs, so you can log in right there
# and have subsequent requests automatically include your token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        role = UserRole(payload.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {[r.value for r in UserRole]}")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm expects fields named "username" and
    # "password" (a FastAPI/OAuth2 convention) -- we treat "username" as
    # the email here, since our users log in with email, not a separate username.
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Reusable dependency. Any route can require login by adding:
        current_user: User = Depends(get_current_user)
    FastAPI automatically extracts the Bearer token from the request,
    runs this function, and either hands back the User object or
    raises 401 -- the route function itself doesn't need to know HOW
    auth works, just that current_user is guaranteed valid if reached.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Example protected route -- proves the whole auth chain works end-to-end."""
    return current_user