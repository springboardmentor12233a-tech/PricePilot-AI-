def test_login_success(client):
    resp = client.post("/api/auth/login", data={"username": "admin@test.com", "password": "Password123!"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    resp = client.post("/api/auth/login", data={"username": "admin@test.com", "password": "wrong"})
    assert resp.status_code == 401


def test_unauthenticated_access_denied(client):
    resp = client.get("/api/dashboard/kpis")
    assert resp.status_code == 401


def test_admin_only_route_blocks_viewer(client, viewer_token):
    resp = client.get("/api/users", headers={"Authorization": f"Bearer {viewer_token}"})
    assert resp.status_code == 403


def test_admin_only_route_allows_admin(client, admin_token):
    resp = client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200


def test_viewer_can_read_dashboard(client, viewer_token):
    resp = client.get("/api/dashboard/kpis", headers={"Authorization": f"Bearer {viewer_token}"})
    assert resp.status_code == 200
    assert resp.json()["has_data"] is True
