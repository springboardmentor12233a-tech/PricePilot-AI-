from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_active_user
from fastapi.security import OAuth2PasswordRequestForm
from app.database.database import get_db
from app.schemas.user import LoginRequest, RefreshTokenRequest, Token, UserCreate, UserResponse
from app.services.auth_service import authenticate_user, create_user_tokens, register_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    return register_user(db, user_in)


@router.post("/login", response_model=Token)
def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and obtain JWT tokens."""
    user = authenticate_user(db, login_in.email, login_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return create_user_tokens(db, user.id)
@router.post("/token", response_model=Token)
def token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 token endpoint for Swagger UI. `username` is treated as email.

    Returns access and refresh tokens.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return create_user_tokens(db, user.id)


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_active_user)):
    """Get the currently logged-in user profile."""
    return current_user
