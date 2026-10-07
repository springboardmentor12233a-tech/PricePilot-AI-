# Backend Testing Guide — FastAPI & Pytest

This document details the automated testing architecture, test suites, and execution instructions for the **PricePilot AI** FastAPI backend.

---

## 1. Testing Architecture Overview

FastAPI provides native ASGI test capabilities built upon **Starlette** and **HTTPX**.

### In-Memory vs. Live Network Testing

The repository includes two complementary testing strategies:

| Strategy             | File                | Mode            | Description                                                                                                                                                                    |
| -------------------- | ------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **In-Memory Suite**  | `test_api.py`       | ASGI Direct     | Executes tests directly against the in-memory ASGI application. Bypasses the OS network stack. Zero port collisions (`WinError 10061`), sub-second execution, ideal for CI/CD. |
| **End-to-End Suite** | `test_endpoints.py` | HTTP / Fallback | Connects to `http://127.0.0.1:8000` if the live server is active; automatically falls back to in-memory `TestClient` if offline.                                               |

---

## 2. Test Execution Commands

Run all commands from the project root:

```bash
# 1. Run the full in-memory Pytest suite (Recommended)
pytest test_api.py -v

# 2. Run tests with stdout output enabled
pytest -s test_api.py

# 3. Run standalone endpoint verification script
python test_endpoints.py
```

---

## 3. Test Coverage Matrix (`test_api.py`)

The test suite covers 10 automated test cases across 5 functional domains:

| #   | Test Function                                  | Target Endpoint                   | HTTP   | Description                                                                               |
| --- | ---------------------------------------------- | --------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| 1   | `test_health_check`                            | `/health`                         | `GET`  | Validates API readiness and PostgreSQL connection                                         |
| 2   | `test_auth_login_success`                      | `/auth/login`                     | `POST` | Validates JWT token issuance and user claims                                              |
| 3   | `test_auth_login_invalid_credentials`          | `/auth/login`                     | `POST` | Asserts `401 Unauthorized` on invalid passwords                                           |
| 4   | `test_auth_me_with_valid_token`                | `/auth/me`                        | `GET`  | Validates Bearer token parsing and profile claims                                         |
| 5   | `test_protected_route_unauthorized`            | `/auth/me`                        | `GET`  | Asserts `401/403` rejection when token is missing                                         |
| 6   | `test_demand_forecast_endpoint`                | `/forecast/demand/{id}`           | `GET`  | Validates multi-horizon forecast, $E_d$ elasticity, and 13-point revenue simulation curve |
| 7   | `test_demand_forecast_custom_price_simulation` | `/forecast/demand/{id}?price=...` | `GET`  | Validates what-if price parametrization                                                   |
| 8   | `test_competitors_overview_endpoint`           | `/analytics/competitors`          | `GET`  | Validates catalog-wide price indices and market stance classification                     |
| 9   | `test_competitor_detail_endpoint`              | `/analytics/competitors/{id}`     | `GET`  | Validates product rival pricing, score differential, and historical trend                 |
| 10  | `test_apply_price_permission_unauthorized`     | `/products/{id}/apply-price`      | `POST` | Validates role-based write guard (requires `pricing_manager`)                             |

---

## 4. Writing New Tests

### A. Using Fixtures

Fixtures define reusable test dependencies (such as authenticated JWT sessions):

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_headers():
    res = client.post("/auth/login", json={"email": "manager@pricepilot.ai", "password": "Password123!"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_custom_endpoint(auth_headers):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
```

### B. Dependency Overrides (Mocking)

To override database connections or user identity during isolated testing:

```python
from main import app
from auth import get_current_user

# Mock authenticated user
app.dependency_overrides[get_current_user] = lambda: {
    "id": "mock_id",
    "email": "tester@pricepilot.ai",
    "role": "pricing_manager"
}

# Clear overrides after test
app.dependency_overrides.clear()
```
