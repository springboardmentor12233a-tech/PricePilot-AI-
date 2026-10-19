def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_home_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_user_registration(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "user1@example.com", "password": "Password123!", "full_name": "John Doe"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "user1@example.com"
    assert data["full_name"] == "John Doe"
    assert data["is_active"] is True
    assert "id" in data


def test_duplicate_user_registration(client):
    payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "full_name": "Original User",
    }
    client.post("/api/v1/auth/register", json=payload)
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_user_login_requires_otp_before_tokens(client, otp_mailbox):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "loginuser@example.com",
            "password": "SecretPassword123",
            "full_name": "Login User",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@example.com", "password": "SecretPassword123"},
    )
    assert response.status_code == 202
    challenge = response.json()
    assert "access_token" not in challenge
    assert "refresh_token" not in challenge
    assert client.get("/api/v1/auth/me").status_code == 401

    verified = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "challenge_id": challenge["challenge_id"],
            "otp": otp_mailbox["loginuser@example.com"],
        },
    )
    assert verified.status_code == 200
    data = verified.json()
    assert data["access_token"]
    assert "refresh_token" not in data
    assert data["user"]["email"] == "loginuser@example.com"
    assert "httponly" in verified.headers.get("set-cookie", "").lower()
    assert data["token_type"] == "bearer"


def test_login_invalid_password_is_generic_and_never_authenticates(client, otp_mailbox):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrongpass@example.com",
            "password": "RightPassword123",
            "full_name": "Test User",
        },
    )
    wrong = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@example.com", "password": "WrongPassword123"},
    )
    unknown = client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "WrongPassword123"},
    )
    assert wrong.status_code == unknown.status_code == 202
    assert wrong.json()["message"] == unknown.json()["message"]
    assert "access_token" not in wrong.json()
    assert client.get("/api/v1/auth/me").status_code == 401


def test_get_current_user_profile(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"