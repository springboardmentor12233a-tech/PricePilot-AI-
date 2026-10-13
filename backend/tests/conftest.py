import os
import sys
from datetime import date, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.security import hash_password  # noqa: E402
from app.database.db import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.models import (  # noqa: E402
    CompetitorPrice, CustomerActivity, DailyOperation, Product, RoleEnum, User,
)

TEST_DB_URL = "sqlite:///./test_pricepilot.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # synthetic fixture data ONLY for tests, per project rules
    p1 = Product(product_id="P9001", product_name="Test Widget", category="TestCat",
                 subcategory="Sub", brand="TestBrand", cost_price=10.0, base_price=25.0,
                 currency="USD", launch_date=date(2024, 1, 1), weight_kg=1.0,
                 rating=4.2, num_reviews=50, is_active=True)
    db.add(p1)

    base_date = date(2024, 1, 1)
    for i in range(60):
        d = base_date + timedelta(days=i)
        db.add(DailyOperation(
            date=d, product_id="P9001", category="TestCat", list_price=25.0,
            discount_pct=0, final_price=25.0 - (i % 5), units_sold=10 + (i % 7),
            revenue=(25.0 - (i % 5)) * (10 + (i % 7)), channel="Website",
            stock_available=100 - i, restocked=False, stockout_flag=False,
            warehouse="WH-1", competitor_avg_price=24.0, competitor_min_price=22.0,
            day_of_week=d.strftime("%A"), is_weekend=d.weekday() >= 5, is_holiday=False,
            is_festival_season=False, is_promotional_event=False,
            market_demand_index=75.0, inflation_rate_pct=3.0, consumer_confidence_index=100.0,
        ))
        db.add(CompetitorPrice(date=d, product_id="P9001", competitor_name="CompX",
                                competitor_price=24.0, in_stock=True))
        db.add(CustomerActivity(session_id=f"S{i}", timestamp=datetime.combine(d, datetime.min.time()),
                                 customer_id=f"C{i}", customer_segment="New", product_id="P9001",
                                 category="TestCat", event_type="view", device="mobile", channel="Website",
                                 price_shown=25.0))
    db.commit()

    for email, role in [("admin@test.com", RoleEnum.ADMIN), ("viewer@test.com", RoleEnum.VIEWER)]:
        db.add(User(email=email, full_name=email.split("@")[0], hashed_password=hash_password("Password123!"), role=role))
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_pricepilot.db"):
        os.remove("./test_pricepilot.db")


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_token(client):
    resp = client.post("/api/auth/login", data={"username": "admin@test.com", "password": "Password123!"})
    return resp.json()["access_token"]


@pytest.fixture
def viewer_token(client):
    resp = client.post("/api/auth/login", data={"username": "viewer@test.com", "password": "Password123!"})
    return resp.json()["access_token"]
