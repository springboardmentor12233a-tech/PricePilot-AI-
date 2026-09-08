def test_health_check(client):
    """Test public health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_home_endpoint(client):
    """Test public home endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_user_registration(client):
    """Test user registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user1@example.com",
            "password": "Password123!",
            "full_name": "John Doe",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "user1@example.com"
    assert data["full_name"] == "John Doe"
    assert data["is_active"] is True
    assert "id" in data


def test_duplicate_user_registration(client):
    """Test registering a user with an already existing email."""
    user_payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "full_name": "Original User",
    }
    client.post("/api/v1/auth/register", json=user_payload)
    
    response = client.post("/api/v1/auth/register", json=user_payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_user_login(client):
    """Test user login and token generation."""
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
        json={
            "email": "loginuser@example.com",
            "password": "SecretPassword123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client):
    """Test login with wrong password."""
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrongpass@example.com",
            "password": "RightPassword123",
            "full_name": "Test User",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "wrongpass@example.com",
            "password": "WrongPassword123",
        },
    )
    assert response.status_code == 401


def test_get_current_user_profile(client, auth_headers):
    """Test protected /auth/me route with valid token."""
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
