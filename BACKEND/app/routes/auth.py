import hmac
import uuid

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_active_user
from app.database.database import get_db
from app.models.auth_security import UserSession
from app.schemas.user import (
    LoginRequest, OtpChallengeResponse, OtpResendRequest, OtpVerifyRequest,
    SessionResponse, Token, UserCreate, UserResponse,
)
from app.services.auth_security_service import (
    GENERIC_CHALLENGE_MESSAGE, begin_login, csrf_for_refresh, list_sessions,
    resend_login_otp, revoke_all_sessions, revoke_current_session, revoke_other_session,
    rotate_refresh_token, verify_login_otp,
)
from app.services.auth_service import register_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
REFRESH_COOKIE = "pricepilot_refresh"
CSRF_COOKIE = "pricepilot_csrf"
COOKIE_PATH = "/api/v1/auth"


def _set_auth_cookies(response: Response, refresh_token: str, csrf_token: str) -> None:
    options = {
        "max_age": 7 * 24 * 60 * 60,
        "path": COOKIE_PATH,
        "secure": settings.SESSION_COOKIE_SECURE,
        "samesite": settings.SESSION_COOKIE_SAMESITE,
    }
    response.set_cookie(REFRESH_COOKIE, refresh_token, httponly=True, **options)
    response.set_cookie(CSRF_COOKIE, csrf_token, httponly=False, path="/", secure=settings.SESSION_COOKIE_SECURE, samesite=settings.SESSION_COOKIE_SAMESITE, max_age=options["max_age"])


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE, path=COOKIE_PATH, secure=settings.SESSION_COOKIE_SECURE,
                           httponly=True, samesite=settings.SESSION_COOKIE_SAMESITE)
    response.delete_cookie(CSRF_COOKIE, path="/", secure=settings.SESSION_COOKIE_SECURE,
                           httponly=False, samesite=settings.SESSION_COOKIE_SAMESITE)


def _token_response(payload: dict, response: Response) -> Token:
    _set_auth_cookies(response, payload["refresh_token"], payload["csrf_token"])
    return Token(
        access_token=payload["access_token"],
        token_type="bearer",
        csrf_token=payload["csrf_token"],
        user=UserResponse.model_validate(payload["user"]),
    )


def _validate_csrf(refresh_token: str | None, cookie_token: str | None, header_token: str | None) -> None:
    if not refresh_token or not cookie_token or not header_token:
        raise HTTPException(status_code=403, detail="Refresh request could not be validated.")
    expected = csrf_for_refresh(refresh_token)
    if not (
        hmac.compare_digest(cookie_token, header_token)
        and hmac.compare_digest(expected, header_token)
    ):
        raise HTTPException(status_code=403, detail="Refresh request could not be validated.")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, user_in)


@router.post("/login", response_model=OtpChallengeResponse, status_code=status.HTTP_202_ACCEPTED)
def login(login_in: LoginRequest, request: Request, db: Session = Depends(get_db)):
    challenge = begin_login(db, str(login_in.email), login_in.password, request)
    return OtpChallengeResponse(
        challenge_id=challenge.id,
        expires_in=settings.OTP_EXPIRY_SECONDS,
        resend_after_seconds=settings.OTP_RESEND_COOLDOWN_SECONDS,
        message=GENERIC_CHALLENGE_MESSAGE,
    )


@router.post("/token", response_model=OtpChallengeResponse, status_code=status.HTTP_202_ACCEPTED)
def token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Swagger's password grant remains password-only and therefore can only begin an OTP challenge.
    challenge = begin_login(db, form_data.username, form_data.password, request)
    return OtpChallengeResponse(
        challenge_id=challenge.id,
        expires_in=settings.OTP_EXPIRY_SECONDS,
        resend_after_seconds=settings.OTP_RESEND_COOLDOWN_SECONDS,
        message=GENERIC_CHALLENGE_MESSAGE,
    )


@router.post("/verify-otp", response_model=Token)
def verify_otp(payload: OtpVerifyRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    result = verify_login_otp(db, payload.challenge_id, payload.otp, request)
    return _token_response(result, response)


@router.post("/resend-otp", response_model=OtpChallengeResponse, status_code=status.HTTP_202_ACCEPTED)
def resend_otp(payload: OtpResendRequest, request: Request, db: Session = Depends(get_db)):
    challenge_id, wait_seconds = resend_login_otp(db, payload.challenge_id, request)
    return OtpChallengeResponse(
        challenge_id=challenge_id,
        expires_in=settings.OTP_EXPIRY_SECONDS,
        resend_after_seconds=wait_seconds,
        message=GENERIC_CHALLENGE_MESSAGE,
    )


@router.post("/refresh", response_model=Token)
def refresh_session(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    csrf_cookie: str | None = Cookie(default=None, alias=CSRF_COOKIE),
    csrf_header: str | None = Header(default=None, alias="X-CSRF-Token"),
    db: Session = Depends(get_db),
):
    _validate_csrf(refresh_token, csrf_cookie, csrf_header)
    result = rotate_refresh_token(db, refresh_token)
    return _token_response(result, response)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    request: Request,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    current_session: UserSession = request.state.auth_session
    revoke_current_session(db, current_user.id, current_session.id)
    _clear_auth_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
def logout_all(
    response: Response,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    revoke_all_sessions(db, current_user.id)
    _clear_auth_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/sessions", response_model=list[SessionResponse])
def get_sessions(
    request: Request,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    session: UserSession = request.state.auth_session
    return list_sessions(db, current_user.id, session.id)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_session(
    session_id: uuid.UUID,
    response: Response,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not revoke_other_session(db, current_user.id, session_id):
        raise HTTPException(status_code=404, detail="Session not found.")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_active_user)):
    return current_user