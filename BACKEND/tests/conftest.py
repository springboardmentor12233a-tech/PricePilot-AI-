import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.config import settings
from app.database.base import Base
from app.database.database import get_db
from app.main import app
from app.services import auth_security_service

@compiles(UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "TEXT"


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(setup_database):
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def otp_mailbox(monkeypatch):
    messages = {}
    monkeypatch.setattr(settings, "OTP_EMAIL_PROVIDER", "smtp")
    monkeypatch.setattr(settings, "OTP_EMAIL_FROM", "no-reply@example.test")
    monkeypatch.setattr(settings, "OTP_SMTP_HOST", "smtp.example.test")
    monkeypatch.setattr(settings, "SESSION_COOKIE_SECURE", False)

    def capture(email, otp):
        messages[email] = otp

    monkeypatch.setattr(auth_security_service, "_send_login_otp", capture)
    return messages


@pytest.fixture(scope="function")
def client(setup_database, otp_mailbox):
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client, otp_mailbox):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "Password123!",
            "full_name": "Test User",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "Password123!"},
    )
    challenge_id = login.json()["challenge_id"]
    verified = client.post(
        "/api/v1/auth/verify-otp",
        json={"challenge_id": challenge_id, "otp": otp_mailbox["test@example.com"]},
    )
    return {"Authorization": "Bearer " + verified.json()["access_token"]}