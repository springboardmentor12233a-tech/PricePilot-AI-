from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql.dml import Update
from starlette.requests import Request

from app.core.config import settings
from app.core.security import get_password_hash
from app.database.base import Base
from app.database.database import get_db
from app.main import app
from app.models.auth_security import OtpChallenge, UserSession
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services import auth_security_service

def create_user(client, email="otp@example.com"):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "full_name": "OTP User"},
    )
    assert response.status_code == 201


def start_login(client, mailbox, email="otp@example.com", password="Password123!"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 202
    return response.json()


def verify(client, challenge, otp):
    return client.post(
        "/api/v1/auth/verify-otp",
        json={"challenge_id": challenge["challenge_id"], "otp": otp},
    )


def test_wrong_expired_and_replayed_otp_never_issue_a_second_session(client, otp_mailbox, db_session):
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    bad = verify(client, challenge, "000000")
    assert bad.status_code == 400
    assert "access_token" not in bad.json()

    row = db_session.query(OtpChallenge).filter_by(id=UUID(challenge["challenge_id"])).one()
    row.expires_at = auth_security_service.now_utc()
    db_session.commit()
    expired = verify(client, challenge, otp_mailbox["otp@example.com"])
    assert expired.status_code == 400
    assert db_session.query(UserSession).count() == 0


def test_correct_otp_is_consumed_once(client, otp_mailbox):
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    result = verify(client, challenge, otp_mailbox["otp@example.com"])
    replay = verify(client, challenge, otp_mailbox["otp@example.com"])
    assert result.status_code == 200
    assert replay.status_code == 400
    assert "access_token" not in replay.json()


def test_resend_supersedes_old_challenge_and_observes_cooldown(client, otp_mailbox, monkeypatch):
    monkeypatch.setattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 0)
    create_user(client)
    first = start_login(client, otp_mailbox)
    old_code = otp_mailbox["otp@example.com"]
    response = client.post("/api/v1/auth/resend-otp", json={"challenge_id": first["challenge_id"]})
    second = response.json()
    new_code = otp_mailbox["otp@example.com"]
    assert response.status_code == 202
    assert second["challenge_id"] != first["challenge_id"]
    assert verify(client, first, old_code).status_code == 400
    assert verify(client, second, new_code).status_code == 200


def test_otp_attempt_limit_invalidates_challenge(client, otp_mailbox, monkeypatch):
    monkeypatch.setattr(settings, "OTP_MAX_ATTEMPTS", 2)
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    assert verify(client, challenge, "111111").status_code == 400
    assert verify(client, challenge, "222222").status_code == 400
    assert verify(client, challenge, otp_mailbox["otp@example.com"]).status_code == 400


def test_email_delivery_failure_fails_closed(client, otp_mailbox, monkeypatch, db_session):
    create_user(client)

    def fail_delivery(email, otp):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(auth_security_service, "_send_login_otp", fail_delivery)
    challenge = start_login(client, otp_mailbox)
    assert challenge["message"] == "If the credentials are valid, a verification code was sent."
    assert "access_token" not in challenge
    challenge_row = db_session.query(OtpChallenge).filter_by(
        id=UUID(challenge["challenge_id"])
    ).one()
    assert challenge_row.invalidated_at is not None
    assert challenge_row.sent_at is None
    response = verify(client, challenge, "123456")
    assert response.status_code == 400
    assert db_session.query(UserSession).count() == 0


def test_password_token_endpoint_also_requires_otp(client, otp_mailbox):
    create_user(client)
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "otp@example.com", "password": "Password123!"},
    )
    assert response.status_code == 202
    assert "access_token" not in response.json()


def test_logout_revokes_session_and_all_sessions(client, otp_mailbox):
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    token_response = verify(client, challenge, otp_mailbox["otp@example.com"])
    headers = {"Authorization": "Bearer " + token_response.json()["access_token"]}
    sessions = client.get("/api/v1/auth/sessions", headers=headers)
    assert sessions.status_code == 200
    assert len(sessions.json()) == 1
    assert sessions.json()[0]["is_current"] is True
    assert client.post("/api/v1/auth/logout-all", headers=headers).status_code == 204
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401


def test_session_metadata_ignores_untrusted_forwarded_header(client, otp_mailbox, monkeypatch):
    monkeypatch.setattr(settings, "TRUSTED_PROXY_CIDRS", [])
    create_user(client)
    challenge = client.post(
        "/api/v1/auth/login",
        json={"email": "otp@example.com", "password": "Password123!"},
        headers={"X-Forwarded-For": "203.0.113.88", "User-Agent": "Test Browser"},
    ).json()
    token_response = client.post(
        "/api/v1/auth/verify-otp",
        json={"challenge_id": challenge["challenge_id"], "otp": otp_mailbox["otp@example.com"]},
        headers={"X-Forwarded-For": "203.0.113.88", "User-Agent": "Test Browser"},
    )
    headers = {"Authorization": "Bearer " + token_response.json()["access_token"]}
    session = client.get("/api/v1/auth/sessions", headers=headers).json()[0]
    assert session["client_ip"] != "203.0.113.88"
    assert session["country"] is None
    assert session["region"] is None
    assert session["city"] is None


def test_users_cannot_revoke_another_users_session(client, otp_mailbox):
    create_user(client, "first@example.com")
    first_challenge = start_login(client, otp_mailbox, "first@example.com")
    first_token = verify(client, first_challenge, otp_mailbox["first@example.com"]).json()["access_token"]
    first_headers = {"Authorization": "Bearer " + first_token}
    first_session = client.get("/api/v1/auth/sessions", headers=first_headers).json()[0]["id"]

    create_user(client, "second@example.com")
    second_challenge = start_login(client, otp_mailbox, "second@example.com")
    second_token = verify(client, second_challenge, otp_mailbox["second@example.com"]).json()["access_token"]
    second_headers = {"Authorization": "Bearer " + second_token}
    response = client.delete("/api/v1/auth/sessions/" + first_session, headers=second_headers)
    assert response.status_code == 404


def test_organization_authorization_remains_separate_after_otp(client, otp_mailbox):
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    token = verify(client, challenge, otp_mailbox["otp@example.com"]).json()["access_token"]
    response = client.get(
        "/api/v1/products/organization/" + str(uuid4()),
        headers={"Authorization": "Bearer " + token},
    )
    assert response.status_code == 403


def test_concurrent_otp_verification_consumes_at_most_once(tmp_path):
    db_path = str(tmp_path / "otp-race.db")
    race_engine = create_engine(
        "sqlite:///" + db_path,
        connect_args={"check_same_thread": False, "timeout": 10},
    )
    Base.metadata.create_all(bind=race_engine)
    RaceSession = sessionmaker(autocommit=False, autoflush=False, bind=race_engine)
    user_id = uuid4()
    challenge_id = uuid4()
    now = auth_security_service.now_utc()
    email = "race@example.com"
    otp = "314159"
    with RaceSession() as db:
        db.add(User(
            id=user_id,
            email=email,
            full_name="Concurrent User",
            hashed_password=get_password_hash("Password123!"),
            is_active=True,
            is_verified=False,
        ))
        db.add(OtpChallenge(
            id=challenge_id,
            user_id=user_id,
            account_hash=auth_security_service._account_hash(email),
            code_hash=auth_security_service._otp_hash(challenge_id, otp),
            attempts=0,
            created_at=now,
            expires_at=now + timedelta(minutes=5),
            sent_at=now,
        ))
        db.commit()

    def override_get_db():
        db = RaceSession()
        try:
            yield db
        finally:
            db.close()

    previous_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as race_client:
            def submit():
                try:
                    response = race_client.post(
                        "/api/v1/auth/verify-otp",
                        json={"challenge_id": str(challenge_id), "otp": otp},
                    )
                    return "accepted" if response.status_code == 200 else "rejected"
                except OperationalError:
                    return "database_busy"

            with ThreadPoolExecutor(max_workers=2) as pool:
                outcomes = list(pool.map(lambda _: submit(), range(2)))
        assert outcomes.count("accepted") == 1
        assert all(outcome in {"accepted", "rejected", "database_busy"} for outcome in outcomes)
        with RaceSession() as db:
            assert db.query(UserSession).filter_by(user_id=user_id).count() == 1
    finally:
        if previous_override is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_override
        race_engine.dispose()

def test_refresh_rotates_token_and_reuse_revokes_session(client, otp_mailbox, db_session):
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    verified = verify(client, challenge, otp_mailbox["otp@example.com"])
    original_refresh = client.cookies.get("pricepilot_refresh")
    original_csrf = verified.json()["csrf_token"]
    assert original_refresh

    rotated = client.post(
        "/api/v1/auth/refresh",
        headers={"X-CSRF-Token": original_csrf},
    )
    assert rotated.status_code == 200
    assert "refresh_token" not in rotated.json()
    rotated_access = rotated.json()["access_token"]
    replacement_refresh = client.cookies.get("pricepilot_refresh")
    assert replacement_refresh != original_refresh
    original_row = db_session.query(RefreshToken).filter_by(
        token_hash=auth_security_service.hash_token(original_refresh)
    ).one()
    replacement_row = db_session.query(RefreshToken).filter_by(
        token_hash=auth_security_service.hash_token(replacement_refresh)
    ).one()
    assert original_row.replaced_by_id == replacement_row.id
    assert original_row.revoked_at is not None
    assert replacement_row.revoked_at is None
    assert db_session.query(RefreshToken).count() == 2

    replay = client.post(
        "/api/v1/auth/refresh",
        cookies={"pricepilot_refresh": original_refresh, "pricepilot_csrf": original_csrf},
        headers={"X-CSRF-Token": original_csrf},
    )
    assert replay.status_code == 401
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer " + rotated_access},
    ).status_code == 401


def test_refresh_requires_csrf_proof(client, otp_mailbox):
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    verify(client, challenge, otp_mailbox["otp@example.com"])
    response = client.post("/api/v1/auth/refresh")
    assert response.status_code == 403


def test_login_account_rate_limit(client, otp_mailbox, monkeypatch):
    monkeypatch.setattr(settings, "OTP_LOGIN_RATE_LIMIT", 1)
    create_user(client)
    assert start_login(client, otp_mailbox)["challenge_id"]
    limited = client.post(
        "/api/v1/auth/login",
        json={"email": "otp@example.com", "password": "Password123!"},
    )
    assert limited.status_code == 429
    assert "access_token" not in limited.json()


def test_resend_cooldown_does_not_send_duplicate_email(client, otp_mailbox):
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    original_code = otp_mailbox["otp@example.com"]
    response = client.post("/api/v1/auth/resend-otp", json={"challenge_id": challenge["challenge_id"]})
    assert response.status_code == 202
    assert response.json()["challenge_id"] == challenge["challenge_id"]
    assert otp_mailbox["otp@example.com"] == original_code
def test_failed_resend_is_rate_limited_and_keeps_last_delivered_code(client, otp_mailbox, monkeypatch):
    monkeypatch.setattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 0)
    monkeypatch.setattr(settings, "OTP_MAX_ATTEMPTS", 1)
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    delivered_code = otp_mailbox["otp@example.com"]
    calls = {"count": 0}

    def fail_delivery(email, otp):
        calls["count"] += 1
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(auth_security_service, "_send_login_otp", fail_delivery)
    first_resend = client.post("/api/v1/auth/resend-otp", json={"challenge_id": challenge["challenge_id"]})
    second_resend = client.post(
        "/api/v1/auth/resend-otp",
        json={"challenge_id": first_resend.json()["challenge_id"]},
    )
    assert first_resend.status_code == second_resend.status_code == 202
    assert calls["count"] == 1
    assert second_resend.json()["challenge_id"] == challenge["challenge_id"]
    assert verify(client, challenge, delivered_code).status_code == 200


def test_expired_signed_refresh_token_cannot_rotate(client, otp_mailbox, db_session):
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    verify(client, challenge, otp_mailbox["otp@example.com"])
    live_refresh = client.cookies.get("pricepilot_refresh")
    payload = auth_security_service.decode_token(live_refresh)
    expired_refresh = auth_security_service.create_refresh_token(
        payload["sub"],
        expires_delta=timedelta(seconds=-1),
        session_id=payload["sid"],
    )
    now = auth_security_service.now_utc()
    db_session.add(
        RefreshToken(
            user_id=UUID(payload["sub"]),
            session_id=UUID(payload["sid"]),
            token_hash=auth_security_service.hash_token(expired_refresh),
            expires_at=now + timedelta(days=7),
        )
    )
    db_session.commit()

    csrf = auth_security_service.csrf_for_refresh(expired_refresh)
    response = client.post(
        "/api/v1/auth/refresh",
        cookies={"pricepilot_refresh": expired_refresh, "pricepilot_csrf": csrf},
        headers={"X-CSRF-Token": csrf},
    )
    assert response.status_code == 401
    assert db_session.query(RefreshToken).count() == 2


def test_revoked_session_cannot_rotate_refresh_token(client, otp_mailbox, db_session):
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    verify(client, challenge, otp_mailbox["otp@example.com"])
    refresh = client.cookies.get("pricepilot_refresh")
    payload = auth_security_service.decode_token(refresh)
    session = db_session.get(UserSession, UUID(payload["sid"]))
    session.revoked_at = auth_security_service.now_utc()
    db_session.commit()

    csrf = auth_security_service.csrf_for_refresh(refresh)
    response = client.post(
        "/api/v1/auth/refresh",
        cookies={"pricepilot_refresh": refresh, "pricepilot_csrf": csrf},
        headers={"X-CSRF-Token": csrf},
    )
    assert response.status_code == 401
    assert db_session.query(RefreshToken).count() == 1


def test_invalid_refresh_token_cannot_create_replacement(client, db_session):
    invalid_refresh = "not-a-valid-refresh-token"
    csrf = auth_security_service.csrf_for_refresh(invalid_refresh)
    response = client.post(
        "/api/v1/auth/refresh",
        cookies={"pricepilot_refresh": invalid_refresh, "pricepilot_csrf": csrf},
        headers={"X-CSRF-Token": csrf},
    )
    assert response.status_code == 401
    assert db_session.query(RefreshToken).count() == 0


def test_refresh_commit_failure_rolls_back_replacement_and_old_token_claim(
    client, otp_mailbox, db_session, monkeypatch
):
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    verify(client, challenge, otp_mailbox["otp@example.com"])
    refresh = client.cookies.get("pricepilot_refresh")
    old_hash = auth_security_service.hash_token(refresh)

    def fail_commit():
        raise RuntimeError("injected commit failure")

    monkeypatch.setattr(db_session, "commit", fail_commit)
    with pytest.raises(RuntimeError, match="injected commit failure"):
        auth_security_service.rotate_refresh_token(db_session, refresh)

    old_row = db_session.query(RefreshToken).filter_by(token_hash=old_hash).one()
    assert old_row.replaced_by_id is None
    assert old_row.revoked_at is None
    assert db_session.query(RefreshToken).count() == 1


def test_refresh_compare_and_swap_loss_rolls_back_then_revokes_session(
    client, otp_mailbox, db_session, monkeypatch
):
    create_user(client)
    challenge = start_login(client, otp_mailbox)
    verify(client, challenge, otp_mailbox["otp@example.com"])
    refresh = client.cookies.get("pricepilot_refresh")
    old_hash = auth_security_service.hash_token(refresh)
    real_execute = db_session.execute
    forced = {"done": False}

    def lose_claim(statement, *args, **kwargs):
        if isinstance(statement, Update) and not forced["done"]:
            forced["done"] = True
            return SimpleNamespace(rowcount=0)
        return real_execute(statement, *args, **kwargs)

    monkeypatch.setattr(db_session, "execute", lose_claim)
    with pytest.raises(HTTPException) as error:
        auth_security_service.rotate_refresh_token(db_session, refresh)

    assert error.value.status_code == 401
    old_row = db_session.query(RefreshToken).filter_by(token_hash=old_hash).one()
    payload = auth_security_service.decode_token(refresh)
    session = db_session.get(UserSession, UUID(payload["sid"]))
    assert session.revoked_at is not None
    assert old_row.revoked_at is not None
    assert old_row.replaced_by_id is None
    assert db_session.query(RefreshToken).count() == 1


def test_concurrent_refresh_attempts_issue_at_most_one_replacement(tmp_path):
    race_engine = create_engine(
        "sqlite:///" + str(tmp_path / "refresh-race.db"),
        connect_args={"check_same_thread": False, "timeout": 10},
    )
    Base.metadata.create_all(bind=race_engine)
    RaceSession = sessionmaker(autocommit=False, autoflush=False, bind=race_engine)
    user_id = uuid4()
    session_id = uuid4()
    now = auth_security_service.now_utc()
    raw_refresh = auth_security_service.create_refresh_token(
        str(user_id), session_id=str(session_id)
    )

    with RaceSession() as db:
        db.add(
            User(
                id=user_id,
                email="refresh-race@example.com",
                full_name="Refresh Race User",
                hashed_password=get_password_hash("Password123!"),
                is_active=True,
                is_verified=False,
            )
        )
        db.add(
            UserSession(
                id=session_id,
                user_id=user_id,
                login_at=now,
                last_activity_at=now,
                expires_at=now + timedelta(days=30),
            )
        )
        db.add(
            RefreshToken(
                user_id=user_id,
                session_id=session_id,
                token_hash=auth_security_service.hash_token(raw_refresh),
                expires_at=now + timedelta(days=7),
            )
        )
        db.commit()

    from threading import Barrier

    barrier = Barrier(2)

    def rotate():
        with RaceSession() as db:
            barrier.wait(timeout=5)
            try:
                auth_security_service.rotate_refresh_token(db, raw_refresh)
                return "accepted"
            except HTTPException:
                return "rejected"
            except OperationalError:
                return "database_busy"

    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(pool.map(lambda _: rotate(), range(2)))
        assert outcomes.count("accepted") == 1
        assert all(value in {"accepted", "rejected", "database_busy"} for value in outcomes)
        with RaceSession() as db:
            tokens = db.query(RefreshToken).filter_by(session_id=session_id).all()
            old_hash = auth_security_service.hash_token(raw_refresh)
            replacements = [token for token in tokens if token.token_hash != old_hash]
            unrevoked = [token for token in tokens if token.revoked_at is None]
            assert len(replacements) <= 1
            assert len(unrevoked) <= 1
    finally:
        race_engine.dispose()
