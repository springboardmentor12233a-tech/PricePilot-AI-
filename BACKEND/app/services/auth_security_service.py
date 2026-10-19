import hmac
import hashlib
import ipaddress
import logging
import secrets
import smtplib
import ssl
import uuid
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from urllib.parse import quote

import bcrypt
import requests
from fastapi import HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token, create_refresh_token, decode_token, hash_token, verify_password,
)
from app.models.auth_security import OtpChallenge, SecurityEvent, UserSession
from app.models.refresh_token import RefreshToken
from app.models.user import User

logger = logging.getLogger("pricepilot.auth")
_DUMMY_PASSWORD_HASH = bcrypt.hashpw(b"invalid-account-placeholder", bcrypt.gensalt()).decode("utf-8")
GENERIC_CHALLENGE_MESSAGE = "If the credentials are valid, a verification code was sent."
GENERIC_OTP_ERROR = "The verification code is invalid or expired. Sign in again to retry."


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _secret() -> bytes:
    return (settings.OTP_HASH_SECRET or settings.SECRET_KEY).encode("utf-8")


def _account_hash(email: str) -> str:
    normalized = email.strip().casefold()
    return hmac.new(_secret(), b"account:v1:" + normalized.encode("utf-8"), hashlib.sha256).hexdigest()


def _otp_hash(challenge_id: uuid.UUID, otp: str) -> str:
    message = b"otp:v1:" + str(challenge_id).encode("ascii") + b":" + otp.encode("ascii")
    return hmac.new(_secret(), message, hashlib.sha256).hexdigest()


def csrf_for_refresh(refresh_token: str) -> str:
    return hmac.new(_secret(), b"csrf:v1:" + refresh_token.encode("utf-8"), hashlib.sha256).hexdigest()


def _is_trusted_proxy(value: str) -> bool:
    try:
        address = ipaddress.ip_address(value)
        return any(address in ipaddress.ip_network(cidr, strict=False) for cidr in settings.TRUSTED_PROXY_CIDRS)
    except ValueError:
        return False


def client_ip_for_request(request: Request) -> str | None:
    remote = request.client.host if request.client else None
    if not remote or not _is_trusted_proxy(remote):
        return remote[:64] if remote else None

    forwarded = request.headers.get("x-forwarded-for", "")
    chain = []
    for item in forwarded.split(","):
        item = item.strip()
        try:
            chain.append(str(ipaddress.ip_address(item)))
        except ValueError:
            continue

    current = remote
    for candidate in reversed(chain):
        if not _is_trusted_proxy(current):
            break
        current = candidate
    return current[:64]


def _request_metadata(request: Request) -> tuple[str | None, str | None]:
    return client_ip_for_request(request), request.headers.get("user-agent", "")[:512] or None


def _record_event(
    db: Session,
    event_type: str,
    *,
    account_hash: str | None = None,
    user_id: uuid.UUID | None = None,
    session_id: uuid.UUID | None = None,
    client_ip: str | None = None,
    user_agent: str | None = None,
    risk_reasons: list[str] | None = None,
) -> None:
    db.add(SecurityEvent(
        id=uuid.uuid4(),
        event_type=event_type,
        account_hash=account_hash,
        user_id=user_id,
        session_id=session_id,
        client_ip=client_ip,
        user_agent=user_agent,
        risk_reasons=risk_reasons or [],
        created_at=now_utc(),
    ))


def _recent_count(db: Session, account_hash: str, event_type: str, seconds: int) -> int:
    since = now_utc() - timedelta(seconds=seconds)
    return (
        db.query(func.count(SecurityEvent.id))
        .filter(
            SecurityEvent.account_hash == account_hash,
            SecurityEvent.event_type == event_type,
            SecurityEvent.created_at >= since,
        )
        .scalar()
        or 0
    )


def _cleanup_old_auth_data(db: Session, now: datetime) -> None:
    # Opportunistic retention cleanup; no scheduler or new service is required.
    db.query(OtpChallenge).filter(OtpChallenge.expires_at < now - timedelta(days=1)).delete(
        synchronize_session=False
    )
    db.query(RefreshToken).filter(RefreshToken.expires_at < now - timedelta(days=90)).delete(synchronize_session=False)
    db.query(SecurityEvent).filter(SecurityEvent.created_at < now - timedelta(days=90)).delete(
        synchronize_session=False
    )
    db.query(UserSession).filter(
        UserSession.expires_at < now - timedelta(days=180)
    ).delete(synchronize_session=False)


def _send_login_otp(email: str, otp: str) -> None:
    if settings.OTP_EMAIL_PROVIDER != "smtp" or not settings.OTP_EMAIL_FROM or not settings.OTP_SMTP_HOST:
        raise RuntimeError("OTP email delivery is not configured")

    message = EmailMessage()
    message["Subject"] = "Your PricePilot AI sign-in code"
    message["From"] = settings.OTP_EMAIL_FROM
    message["To"] = email
    message.set_content(
        f"Your PricePilot AI verification code is {otp}. "
        f"It expires in {settings.OTP_EXPIRY_SECONDS // 60 or 1} minutes. "
        "If you did not try to sign in, you can ignore this message."
    )
    try:
        with smtplib.SMTP(settings.OTP_SMTP_HOST, settings.OTP_SMTP_PORT, timeout=10) as server:
            if settings.OTP_SMTP_USE_TLS:
                server.starttls(context=ssl.create_default_context())
            if settings.OTP_SMTP_USERNAME:
                server.login(settings.OTP_SMTP_USERNAME, settings.OTP_SMTP_PASSWORD)
            server.send_message(message)
    except Exception as exc:
        # Never include the message, recipient credentials, or verification code in logs.
        logger.warning("OTP delivery failed; error_type=%s", type(exc).__name__)
        raise RuntimeError("OTP delivery failed") from None


def _new_challenge(
    user: User | None,
    account_hash: str,
    otp: str,
    client_ip: str | None,
    user_agent: str | None,
    now: datetime,
    *,
    invalidated: bool,
) -> OtpChallenge:
    challenge_id = uuid.uuid4()
    return OtpChallenge(
        id=challenge_id,
        user_id=user.id if user else None,
        account_hash=account_hash,
        code_hash=_otp_hash(challenge_id, otp),
        attempts=0,
        created_at=now,
        expires_at=now + timedelta(seconds=settings.OTP_EXPIRY_SECONDS),
        sent_at=None,
        invalidated_at=now if invalidated else None,
        client_ip=client_ip,
        user_agent=user_agent,
    )


def begin_login(db: Session, email: str, password: str, request: Request) -> OtpChallenge:
    now = now_utc()
    _cleanup_old_auth_data(db, now)
    account_hash = _account_hash(email)
    client_ip, user_agent = _request_metadata(request)

    # Lock a known account row so simultaneous correct logins supersede challenges in order.
    user = db.query(User).filter(func.lower(User.email) == email.strip().lower()).with_for_update().first()
    if _recent_count(db, account_hash, "login_attempt", settings.AUTH_RATE_WINDOW_SECONDS) >= settings.OTP_LOGIN_RATE_LIMIT:
        _record_event(db, "login_rate_limited", account_hash=account_hash, client_ip=client_ip, user_agent=user_agent)
        db.commit()
        raise HTTPException(status_code=429, detail="Sign-in is temporarily unavailable. Try again later.")

    _record_event(db, "login_attempt", account_hash=account_hash, client_ip=client_ip, user_agent=user_agent)
    password_ok = verify_password(password, user.hashed_password if user else _DUMMY_PASSWORD_HASH)
    valid_credentials = bool(user and user.is_active and password_ok)

    otp = f"{secrets.randbelow(1_000_000):06d}"
    challenge = _new_challenge(
        user if valid_credentials else None, account_hash, otp, client_ip, user_agent, now,
        invalidated=not valid_credentials,
    )

    if valid_credentials:
        try:
            _send_login_otp(user.email, otp)
        except Exception:
            challenge.invalidated_at = now
            _record_event(
                db, "otp_delivery_failed", account_hash=account_hash, user_id=user.id,
                client_ip=client_ip, user_agent=user_agent,
            )
        else:
            prior = db.query(OtpChallenge).filter(
                OtpChallenge.account_hash == account_hash,
                OtpChallenge.consumed_at.is_(None),
                OtpChallenge.invalidated_at.is_(None),
            ).all()
            for old in prior:
                old.invalidated_at = now
            challenge.sent_at = now
            _record_event(
                db, "otp_challenge_issued", account_hash=account_hash, user_id=user.id,
                client_ip=client_ip, user_agent=user_agent,
            )

    db.add(challenge)
    db.commit()
    return challenge

def resend_login_otp(db: Session, challenge_id: uuid.UUID, request: Request) -> tuple[uuid.UUID, int]:
    now = now_utc()
    client_ip, user_agent = _request_metadata(request)
    candidate = db.query(OtpChallenge).filter(OtpChallenge.id == challenge_id).first()
    if candidate is None or candidate.user_id is None:
        return uuid.uuid4(), settings.OTP_RESEND_COOLDOWN_SECONDS

    # All login and resend paths lock the user row before a challenge row to avoid lock inversion.
    user = db.query(User).filter(
        User.id == candidate.user_id,
        User.is_active.is_(True),
    ).with_for_update().first()
    if user is None:
        return uuid.uuid4(), settings.OTP_RESEND_COOLDOWN_SECONDS

    current = (
        db.query(OtpChallenge)
        .filter(OtpChallenge.id == challenge_id, OtpChallenge.user_id == user.id)
        .with_for_update()
        .first()
    )
    if current is None or current.invalidated_at or current.consumed_at or current.sent_at is None:
        return uuid.uuid4(), settings.OTP_RESEND_COOLDOWN_SECONDS

    account_hash = current.account_hash
    elapsed = int((now - _as_utc(current.sent_at)).total_seconds())
    remaining = max(0, settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed)
    if remaining:
        return current.id, remaining

    if _recent_count(db, account_hash, "otp_resend_attempt", settings.AUTH_RATE_WINDOW_SECONDS) >= settings.OTP_MAX_ATTEMPTS:
        _record_event(db, "otp_resend_limited", account_hash=account_hash, user_id=user.id,
                      client_ip=client_ip, user_agent=user_agent)
        db.commit()
        return current.id, settings.OTP_RESEND_COOLDOWN_SECONDS

    # Count the attempt and begin cooldown even if SMTP fails.
    _record_event(db, "otp_resend_attempt", account_hash=account_hash, user_id=user.id,
                  client_ip=client_ip, user_agent=user_agent)
    current.sent_at = now
    otp = f"{secrets.randbelow(1_000_000):06d}"
    replacement = _new_challenge(user, account_hash, otp, client_ip, user_agent, now, invalidated=False)
    try:
        _send_login_otp(user.email, otp)
    except Exception:
        _record_event(db, "otp_delivery_failed", account_hash=account_hash, user_id=user.id,
                      client_ip=client_ip, user_agent=user_agent)
        db.commit()
        return current.id, settings.OTP_RESEND_COOLDOWN_SECONDS

    prior = db.query(OtpChallenge).filter(
        OtpChallenge.account_hash == account_hash,
        OtpChallenge.consumed_at.is_(None),
        OtpChallenge.invalidated_at.is_(None),
    ).all()
    for old in prior:
        old.invalidated_at = now
    replacement.sent_at = now
    db.add(replacement)
    _record_event(db, "otp_resend_sent", account_hash=account_hash, user_id=user.id,
                  client_ip=client_ip, user_agent=user_agent)
    db.commit()
    return replacement.id, settings.OTP_RESEND_COOLDOWN_SECONDS

def _geolocate(ip: str | None) -> dict[str, str | None]:
    if not ip or not settings.GEOLOCATION_API_URL:
        return {"country": None, "region": None, "city": None}
    try:
        url = settings.GEOLOCATION_API_URL.format(ip=quote(ip, safe=""))
        headers = {}
        if settings.GEOLOCATION_API_TOKEN:
            headers["Authorization"] = f"Bearer {settings.GEOLOCATION_API_TOKEN}"
        response = requests.get(url, headers=headers, timeout=(1, 2))
        response.raise_for_status()
        result = response.json()
        return {
            "country": str(result.get("country") or "")[:100] or None,
            "region": str(result.get("region") or "")[:100] or None,
            "city": str(result.get("city") or "")[:100] or None,
        }
    except Exception as exc:
        logger.info("Optional geolocation lookup unavailable; error_type=%s", type(exc).__name__)
        return {"country": None, "region": None, "city": None}


def _risk_reasons(db: Session, user: User, account_hash: str, user_agent: str | None, location: dict) -> list[str]:
    cutoff = now_utc() - timedelta(days=180)
    previous = (
        db.query(UserSession)
        .filter(UserSession.user_id == user.id, UserSession.login_at >= cutoff)
        .order_by(UserSession.login_at.desc())
        .all()
    )
    reasons: list[str] = []
    if previous and not any(session.user_agent == user_agent for session in previous):
        reasons.append("new_device_or_browser")
    if previous and location.get("country"):
        last = previous[0]
        if last.country and last.country != location["country"]:
            reasons.append("new_approximate_country")
        elif last.city and location.get("city") and last.city != location["city"]:
            reasons.append("new_approximate_city")
    recent_sessions = sum(1 for session in previous if _as_utc(session.login_at) >= now_utc() - timedelta(hours=1))
    if recent_sessions >= 5:
        reasons.append("unusual_login_frequency")
    if _recent_count(db, account_hash, "otp_failed", 3600) >= 2:
        reasons.append("repeated_failed_otp")
    return reasons


def _issue_session(db: Session, user: User, challenge: OtpChallenge, request: Request) -> dict:
    now = now_utc()
    client_ip, user_agent = _request_metadata(request)
    location = _geolocate(client_ip)
    reasons = _risk_reasons(db, user, challenge.account_hash, user_agent, location)
    session = UserSession(
        id=uuid.uuid4(),
        user_id=user.id,
        login_at=now,
        last_activity_at=now,
        expires_at=now + timedelta(days=30),
        client_ip=client_ip,
        user_agent=user_agent,
        country=location["country"],
        region=location["region"],
        city=location["city"],
    )
    db.add(session)
    db.flush()

    user.is_verified = True
    user.last_login_at = now
    access_token = create_access_token(str(user.id), session_id=str(session.id))
    refresh_token = create_refresh_token(str(user.id), session_id=str(session.id))
    refresh_record = RefreshToken(
        id=uuid.uuid4(),
        user_id=user.id,
        session_id=session.id,
        token_hash=hash_token(refresh_token),
        expires_at=now + timedelta(days=7),
    )
    db.add(refresh_record)
    _record_event(
        db, "session_created", account_hash=challenge.account_hash, user_id=user.id,
        session_id=session.id, client_ip=client_ip, user_agent=user_agent, risk_reasons=reasons,
    )
    if reasons:
        _record_event(
            db, "suspicious_login_signals", account_hash=challenge.account_hash, user_id=user.id,
            session_id=session.id, client_ip=client_ip, user_agent=user_agent, risk_reasons=reasons,
        )
    db.commit()
    db.refresh(user)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "csrf_token": csrf_for_refresh(refresh_token),
        "user": user,
        "session": session,
    }


def verify_login_otp(db: Session, challenge_id: uuid.UUID, otp: str, request: Request) -> dict:
    now = now_utc()
    challenge = (
        db.query(OtpChallenge)
        .filter(OtpChallenge.id == challenge_id)
        .with_for_update()
        .first()
    )
    if challenge is None or challenge.user_id is None or challenge.sent_at is None:
        raise HTTPException(status_code=400, detail=GENERIC_OTP_ERROR)
    if (
        challenge.consumed_at is not None or challenge.invalidated_at is not None
        or _as_utc(challenge.expires_at) <= now
        or challenge.attempts >= settings.OTP_MAX_ATTEMPTS
    ):
        raise HTTPException(status_code=400, detail=GENERIC_OTP_ERROR)

    if _recent_count(db, challenge.account_hash, "otp_failed", settings.AUTH_RATE_WINDOW_SECONDS) >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail=GENERIC_OTP_ERROR)

    supplied_hash = _otp_hash(challenge.id, otp)
    if not hmac.compare_digest(challenge.code_hash, supplied_hash):
        from sqlalchemy import update

        db.execute(
            update(OtpChallenge)
            .where(
                OtpChallenge.id == challenge.id,
                OtpChallenge.consumed_at.is_(None),
                OtpChallenge.invalidated_at.is_(None),
                OtpChallenge.expires_at > now,
                OtpChallenge.attempts < settings.OTP_MAX_ATTEMPTS,
            )
            .values(attempts=OtpChallenge.attempts + 1).execution_options(synchronize_session=False)
        )
        _record_event(
            db, "otp_failed", account_hash=challenge.account_hash, user_id=challenge.user_id,
            client_ip=client_ip_for_request(request), user_agent=request.headers.get("user-agent", "")[:512] or None,
        )
        db.flush()
        db.refresh(challenge)
        if challenge.attempts >= settings.OTP_MAX_ATTEMPTS:
            challenge.invalidated_at = now
        db.commit()
        raise HTTPException(status_code=400, detail=GENERIC_OTP_ERROR)

    from sqlalchemy import update

    consumed = db.execute(
        update(OtpChallenge)
        .where(
            OtpChallenge.id == challenge.id,
            OtpChallenge.consumed_at.is_(None),
            OtpChallenge.invalidated_at.is_(None),
            OtpChallenge.expires_at > now,
            OtpChallenge.attempts < settings.OTP_MAX_ATTEMPTS,
        )
        .values(consumed_at=now).execution_options(synchronize_session=False)
    )
    if consumed.rowcount != 1:
        db.rollback()
        raise HTTPException(status_code=400, detail=GENERIC_OTP_ERROR)

    user = db.query(User).filter(User.id == challenge.user_id, User.is_active.is_(True)).first()
    if user is None:
        db.commit()
        raise HTTPException(status_code=400, detail=GENERIC_OTP_ERROR)
    return _issue_session(db, user, challenge, request)


def rotate_refresh_token(db: Session, raw_refresh: str) -> dict:
    payload = decode_token(raw_refresh)
    if payload.get("type") != "refresh" or not payload.get("sub") or not payload.get("sid"):
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.")
    try:
        user_id = uuid.UUID(payload["sub"])
        session_id = uuid.UUID(payload["sid"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.")

    now = now_utc()
    old = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == hash_token(raw_refresh))
        .with_for_update()
        .first()
    )
    session = db.query(UserSession).filter(
        UserSession.id == session_id, UserSession.user_id == user_id
    ).with_for_update().first()
    if old is None or session is None or old.session_id != session_id or old.user_id != user_id:
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.")

    if old.replaced_by_id is not None or old.revoked_at is not None:
        session.revoked_at = now
        db.query(RefreshToken).filter(
            RefreshToken.session_id == session.id, RefreshToken.revoked_at.is_(None)
        ).update({RefreshToken.revoked_at: now}, synchronize_session=False)
        _record_event(db, "refresh_token_reuse", user_id=user_id, session_id=session.id,
                      client_ip=None, risk_reasons=["refresh_token_reuse"])
        db.commit()
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.")

    if (
        _as_utc(old.expires_at) <= now
        or session.revoked_at is not None
        or _as_utc(session.expires_at) <= now
    ):
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.")

    replacement = create_refresh_token(str(user_id), session_id=str(session_id))
    replacement_id = uuid.uuid4()
    from sqlalchemy import update

    claimed = db.execute(
        update(RefreshToken)
        .where(RefreshToken.id == old.id, RefreshToken.revoked_at.is_(None), RefreshToken.replaced_by_id.is_(None))
        .values(revoked_at=now, replaced_by_id=replacement_id)
    )
    if claimed.rowcount != 1:
        session.revoked_at = now
        _record_event(db, "refresh_token_reuse", user_id=user_id, session_id=session.id,
                      risk_reasons=["refresh_token_reuse"])
        db.commit()
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.")

    db.add(RefreshToken(
        id=replacement_id,
        user_id=user_id,
        session_id=session.id,
        token_hash=hash_token(replacement),
        expires_at=now + timedelta(days=7),
    ))
    session.last_activity_at = now
    _record_event(db, "refresh_token_rotated", user_id=user_id, session_id=session.id)
    db.commit()
    user = db.query(User).filter(User.id == user_id).first()
    return {
        "access_token": create_access_token(str(user_id), session_id=str(session_id)),
        "refresh_token": replacement,
        "csrf_token": csrf_for_refresh(replacement),
        "user": user,
    }


def revoke_current_session(db: Session, user_id: uuid.UUID, session_id: uuid.UUID) -> None:
    now = now_utc()
    session = db.query(UserSession).filter(
        UserSession.id == session_id, UserSession.user_id == user_id
    ).first()
    if session and session.revoked_at is None:
        session.revoked_at = now
        db.query(RefreshToken).filter(
            RefreshToken.session_id == session_id, RefreshToken.revoked_at.is_(None)
        ).update({RefreshToken.revoked_at: now}, synchronize_session=False)
        _record_event(db, "session_revoked", user_id=user_id, session_id=session_id)
        db.commit()


def revoke_all_sessions(db: Session, user_id: uuid.UUID) -> None:
    now = now_utc()
    db.query(UserSession).filter(
        UserSession.user_id == user_id, UserSession.revoked_at.is_(None)
    ).update({UserSession.revoked_at: now}, synchronize_session=False)
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)
    ).update({RefreshToken.revoked_at: now}, synchronize_session=False)
    _record_event(db, "logout_all", user_id=user_id)
    db.commit()


def revoke_other_session(db: Session, user_id: uuid.UUID, session_id: uuid.UUID) -> bool:
    now = now_utc()
    session = db.query(UserSession).filter(
        UserSession.id == session_id, UserSession.user_id == user_id
    ).first()
    if session is None:
        return False
    if session.revoked_at is None:
        session.revoked_at = now
        db.query(RefreshToken).filter(
            RefreshToken.session_id == session_id, RefreshToken.revoked_at.is_(None)
        ).update({RefreshToken.revoked_at: now}, synchronize_session=False)
        _record_event(db, "session_revoked", user_id=user_id, session_id=session_id)
        db.commit()
    return True


def list_sessions(db: Session, user_id: uuid.UUID, current_session_id: uuid.UUID) -> list[dict]:
    sessions = (
        db.query(UserSession)
        .filter(UserSession.user_id == user_id)
        .order_by(UserSession.login_at.desc())
        .all()
    )
    return [
        {
            "id": item.id,
            "login_at": item.login_at,
            "last_activity_at": item.last_activity_at,
            "expires_at": item.expires_at,
            "revoked_at": item.revoked_at,
            "client_ip": item.client_ip,
            "user_agent": item.user_agent,
            "country": item.country,
            "region": item.region,
            "city": item.city,
            "is_current": item.id == current_session_id,
        }
        for item in sessions
    ]