import logging
import smtplib
import ssl
from pathlib import Path

import pytest

from app.core.config import BACKEND_ENV_FILE, Settings, settings
from app.services import auth_security_service

SMTP_USERNAME = "smtp-user-secret@example.test"
SMTP_PASSWORD = "smtp-password-secret"
RECIPIENT = "recipient-secret@example.test"
OTP = "917204"
ERROR_MARKER = "exception-message-secret"


class FakeSMTP:
    def __init__(self, events, failure_stage=None, failure=None):
        self.events = events
        self.failure_stage = failure_stage
        self.failure = failure
        self.message = None
        self.authenticated = False

    def __enter__(self):
        self.events.append("enter")
        return self

    def __exit__(self, exc_type, exc, traceback):
        self.events.append("close")
        return False

    def _fail(self, stage):
        if self.failure_stage == stage:
            raise self.failure

    def ehlo(self):
        self.events.append("ehlo")
        self._fail("ehlo")

    def starttls(self, context):
        self.events.append(("starttls", isinstance(context, ssl.SSLContext)))
        self._fail("starttls")

    def login(self, username, password):
        self.events.append("authenticate")
        self.authenticated = username == SMTP_USERNAME and password == SMTP_PASSWORD
        self._fail("authenticate")

    def send_message(self, message):
        self.events.append("send_message")
        self.message = message
        self._fail("send_message")


def configure_smtp(monkeypatch):
    monkeypatch.setattr(settings, "OTP_EMAIL_PROVIDER", "smtp")
    monkeypatch.setattr(settings, "OTP_EMAIL_FROM", SMTP_USERNAME)
    monkeypatch.setattr(settings, "OTP_SMTP_HOST", "smtp.gmail.test")
    monkeypatch.setattr(settings, "OTP_SMTP_PORT", 587)
    monkeypatch.setattr(settings, "OTP_SMTP_USERNAME", SMTP_USERNAME)
    monkeypatch.setattr(settings, "OTP_SMTP_PASSWORD", SMTP_PASSWORD)
    monkeypatch.setattr(settings, "OTP_SMTP_USE_TLS", True)


def test_settings_env_file_is_anchored_to_backend_directory():
    assert Path(Settings.model_config["env_file"]) == Path(BACKEND_ENV_FILE)
    assert BACKEND_ENV_FILE == Path(auth_security_service.__file__).resolve().parents[2] / ".env"


def test_smtp_delivery_uses_starttls_and_sends_message(monkeypatch):
    configure_smtp(monkeypatch)
    events = []
    connection = {}
    smtp_instance = {}

    def smtp_factory(host, port, timeout):
        connection.update(host=host, port=port, timeout=timeout)
        events.append("connect")
        smtp_instance["server"] = FakeSMTP(events)
        return smtp_instance["server"]

    monkeypatch.setattr(auth_security_service.smtplib, "SMTP", smtp_factory)
    auth_security_service._send_login_otp(RECIPIENT, OTP)

    assert connection == {"host": "smtp.gmail.test", "port": 587, "timeout": 30}
    assert events == [
        "connect",
        "enter",
        "ehlo",
        ("starttls", True),
        "ehlo",
        "authenticate",
        "send_message",
        "close",
    ]
    assert smtp_instance["server"].authenticated is True
    assert smtp_instance["server"].message["To"] == RECIPIENT
    assert OTP in smtp_instance["server"].message.get_content()


@pytest.mark.parametrize(
    ("failure_stage", "failure", "expected_stage", "expected_type"),
    [
        ("starttls", ssl.SSLError(ERROR_MARKER), "starttls", "SSLError"),
        (
            "authenticate",
            smtplib.SMTPAuthenticationError(535, ERROR_MARKER.encode()),
            "authenticate",
            "SMTPAuthenticationError",
        ),
        (
            "authenticate",
            smtplib.SMTPServerDisconnected(ERROR_MARKER),
            "authenticate",
            "SMTPServerDisconnected",
        ),
        ("connect", TimeoutError(ERROR_MARKER), "connect", "TimeoutError"),
    ],
)
def test_smtp_failure_logs_safe_stage_details_without_secrets(
    monkeypatch, caplog, failure_stage, failure, expected_stage, expected_type
):
    configure_smtp(monkeypatch)
    events = []

    def smtp_factory(host, port, timeout):
        if failure_stage == "connect":
            raise failure
        return FakeSMTP(events, failure_stage, failure)

    monkeypatch.setattr(auth_security_service.smtplib, "SMTP", smtp_factory)
    caplog.set_level(logging.WARNING, logger="pricepilot.auth")

    with pytest.raises(RuntimeError, match="OTP delivery failed"):
        auth_security_service._send_login_otp(RECIPIENT, OTP)

    logged = caplog.text
    assert f"error_type={expected_type}" in logged
    assert f"smtp_stage={expected_stage}" in logged
    assert "smtp_host=smtp.gmail.test" in logged
    assert "smtp_port=587" in logged
    assert "password_has_edge_whitespace=False" in logged
    for secret in (SMTP_USERNAME, SMTP_PASSWORD, RECIPIENT, OTP, ERROR_MARKER):
        assert secret not in logged
