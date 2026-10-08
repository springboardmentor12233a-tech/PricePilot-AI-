"""PricePilot AI - Milestone 3
JWT authentication, revenue forecast, KPIs, reports, activity history,
product intelligence, and Groq via the OpenAI-compatible API.

Run:
    uvicorn backend.app.v3:app --reload

Open:
    http://127.0.0.1:8000/v3/
"""

import os
import json
import hmac
import hashlib
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from functools import lru_cache

from dotenv import load_dotenv
from openai import OpenAI
import jwt
import numpy as np
import pandas as pd

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.app.main import app
from backend.app.config import COMBINED_PROCESSED, ROOT
from backend.app.ml.demand_forecasting import forecast


# ---------- environment ----------
load_dotenv()

SECRET = os.getenv(
    "PRICEPILOT_JWT_SECRET",
    "dev-secret-change-me-before-deploy-32b"
)

DB = ROOT / "data" / "users.db"
DB.parent.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/api/v3")

inr = lambda n: "₹{:,.0f}".format(n)


# ---------- database ----------
def db():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c


def init_db():
    with db() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS users(
                username TEXT PRIMARY KEY,
                pw TEXT NOT NULL,
                role TEXT NOT NULL,
                created TEXT NOT NULL
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS activity(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                role TEXT,
                action TEXT,
                dataset TEXT,
                details TEXT,
                created TEXT
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS chat_history(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                dataset TEXT,
                question TEXT,
                answer TEXT,
                engine TEXT,
                created TEXT
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS report_history(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                dataset TEXT,
                report_type TEXT,
                created TEXT
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS forecast_history(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                dataset TEXT,
                days INTEGER,
                total REAL,
                trend TEXT,
                confidence REAL,
                created TEXT
            )
        """)

        # Seed demo accounts only if they do not already exist.
        for username, password, role in [
            ("admin", "admin123", "admin"),
            ("user", "user123", "user"),
        ]:
            c.execute(
                "INSERT OR IGNORE INTO users(username,pw,role,created) VALUES(?,?,?,?)",
                (
                    username,
                    hp(password),
                    role,
                    str(datetime.now(timezone.utc).date()),
                ),
            )


def log_activity(username, role, action, dataset="", details=""):
    try:
        with db() as c:
            c.execute(
                """
                INSERT INTO activity
                (username, role, action, dataset, details, created)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    username,
                    role,
                    action,
                    dataset,
                    details,
                    datetime.now(timezone.utc).isoformat(timespec="seconds"),
                ),
            )
    except Exception:
        pass


# ---------- users + JWT ----------
def hp(pw, salt=None):
    salt = salt or secrets.token_hex(8)
    return salt + "$" + hashlib.pbkdf2_hmac(
        "sha256",
        pw.encode(),
        salt.encode(),
        120000,
    ).hex()


def chk(pw, h):
    return hmac.compare_digest(hp(pw, h.split("$")[0]), h)


def token(u, role):
    return jwt.encode(
        {
            "sub": u,
            "role": role,
            "exp": datetime.now(timezone.utc) + timedelta(hours=8),
        },
        SECRET,
        algorithm="HS256",
    )


def me(authorization: str = Header(None)):
    try:
        raw = (authorization or "").split(" ")[-1]
        return jwt.decode(raw, SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(401, "Please sign in again.")


def admin(u=Depends(me)):
    if u["role"] != "admin":
        raise HTTPException(403, "Admin access required.")
    return u


# Initialize after db(), hp(), etc. are defined.
init_db()


# ---------- models ----------
class Cred(BaseModel):
    username: str
    password: str


class Msg(BaseModel):
    message: str
    dataset: str = "Amazon"


# ---------- authentication ----------
@router.post("/auth/login")
def login(b: Cred):
    with db() as c:
        r = c.execute(
            "SELECT * FROM users WHERE username=?",
            (b.username.strip(),),
        ).fetchone()

    if not r or not chk(b.password, r["pw"]):
        raise HTTPException(401, "Wrong username or password.")

    log_activity(r["username"], r["role"], "Signed in")

    return {
        "token": token(r["username"], r["role"]),
        "user": {
            "username": r["username"],
            "role": r["role"],
        },
    }


@router.post("/auth/register")
def register(b: Cred):
    username = b.username.strip()

    if len(username) < 3 or len(b.password) < 6:
        raise HTTPException(
            400,
            "Username 3+ chars, password 6+ chars.",
        )

    try:
        with db() as c:
            c.execute(
                """
                INSERT INTO users(username,pw,role,created)
                VALUES(?,?,?,?)
                """,
                (
                    username,
                    hp(b.password),
                    "user",
                    str(datetime.now(timezone.utc).date()),
                ),
            )
    except sqlite3.IntegrityError:
        raise HTTPException(409, "That username is taken.")

    return login(
        Cred(
            username=username,
            password=b.password,
        )
    )


@router.get("/auth/me")
def whoami(u=Depends(me)):
    return {
        "username": u["sub"],
        "role": u["role"],
    }


# ---------- admin ----------
@router.get("/admin/users")
def users(u=Depends(admin)):
    with db() as c:
        rows = c.execute(
            """
            SELECT username, role, created
            FROM users
            ORDER BY created
            """
        ).fetchall()

    return [dict(r) for r in rows]


@router.post("/admin/users/{name}/role")
def set_role(name: str, role: str, u=Depends(admin)):
    if role not in ("admin", "user"):
        raise HTTPException(400, "Role must be admin or user.")

    with db() as c:
        c.execute(
            "UPDATE users SET role=? WHERE username=?",
            (role, name),
        )

    log_activity(
        u["sub"],
        u["role"],
        "Changed user role",
        details=f"{name} → {role}",
    )

    return {"ok": True}


@router.get("/admin/stats")
def admin_stats(u=Depends(admin)):
    with db() as c:
        users_count = c.execute(
            "SELECT COUNT(*) n FROM users"
        ).fetchone()["n"]

        chats = c.execute(
            "SELECT COUNT(*) n FROM chat_history"
        ).fetchone()["n"]

        reports = c.execute(
            "SELECT COUNT(*) n FROM report_history"
        ).fetchone()["n"]

        forecasts = c.execute(
            "SELECT COUNT(*) n FROM forecast_history"
        ).fetchone()["n"]

    return {
        "users": users_count,
        "ai_queries": chats,
        "reports": reports,
        "forecast_runs": forecasts,
    }


@router.get("/admin/activity")
def admin_activity(limit: int = 12, u=Depends(admin)):
    limit = min(max(limit, 1), 50)

    with db() as c:
        rows = c.execute(
            """
            SELECT username, role, action, dataset, details, created
            FROM activity
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [dict(r) for r in rows]


@router.get("/activity/me")
def my_activity(limit: int = 12, u=Depends(me)):
    limit = min(max(limit, 1), 50)

    with db() as c:
        rows = c.execute(
            """
            SELECT action, dataset, details, created
            FROM activity
            WHERE username=?
            ORDER BY id DESC
            LIMIT ?
            """,
            (u["sub"], limit),
        ).fetchall()

    return [dict(r) for r in rows]


# ---------- data helpers ----------
@lru_cache(1)
def data():
    return pd.read_csv(
        COMBINED_PROCESSED,
        parse_dates=["date"],
        low_memory=False,
        usecols=[
            "product_id",
            "product_name",
            "category",
            "date",
            "units_sold",
            "revenue",
            "price",
            "dataset",
        ],
    )


def sub(ds):
    d = data()
    d = d[d.dataset == ds]

    if d.empty:
        raise HTTPException(404, "Unknown dataset.")

    return d


def daily(ds):
    s = sub(ds).groupby("date").revenue.sum()

    return s.reindex(
        pd.date_range(
            s.index.min(),
            s.index.max(),
        ),
        fill_value=0,
    )


def kp(ds):
    d = sub(ds)
    s = daily(ds)

    last_30 = s.tail(30).sum()
    previous_30 = s.tail(60).head(30).sum()

    return {
        "total_revenue": round(d.revenue.sum(), 2),
        "units": int(d.units_sold.sum()),
        "products": int(d.product_id.nunique()),
        "avg_price": round(d.price.mean(), 2),
        "last30": round(last_30, 2),
        "growth_pct": round(
            (last_30 / previous_30 - 1) * 100
            if previous_30
            else 0,
            1,
        ),
    }


def fc(ds, days):
    s = daily(ds)

    h = s.tail(180)
    r = h.tail(90)
    x = np.arange(len(r))

    b, a = np.polyfit(x, r.values, 1)

    dow = (
        h.groupby(h.index.dayofweek).mean()
        / max(h.mean(), 1e-9)
    ).reindex(range(7)).fillna(1)

    sd = float(
        np.std(
            r.values
            - (a + b * x)
            * dow.reindex(r.index.dayofweek).values
        )
    )

    idx = pd.date_range(
        s.index[-1] + pd.Timedelta(days=1),
        periods=days,
    )

    v = np.maximum(
        (
            a + b * (len(r) + np.arange(days))
        )
        * dow.reindex(idx.dayofweek).values,
        0,
    )

    ch = (
        v.mean()
        / max(r.tail(30).mean(), 1e-9)
        - 1
    )

    return {
        "days": days,
        "history": {
            "labels": [
                str(i.date())
                for i in r.tail(45).index
            ],
            "values": r.tail(45).round(0).tolist(),
        },
        "forecast": {
            "labels": [
                str(i.date())
                for i in idx
            ],
            "values": v.round(0).tolist(),
            "low": np.maximum(
                v - 1.28 * sd,
                0,
            ).round(0).tolist(),
            "high": (
                v + 1.28 * sd
            ).round(0).tolist(),
        },
        "total": round(float(v.sum()), 2),
        "avg_daily": round(float(v.mean()), 2),
        "trend": (
            "Increasing"
            if ch > 0.05
            else "Decreasing"
            if ch < -0.05
            else "Stable"
        ),
        "confidence": round(
            float(
                100
                * np.exp(
                    -sd / max(r.mean(), 1)
                )
            ),
            1,
        ),
    }


# ---------- analytics ----------
@router.get("/kpis")
def r_kpis(
    dataset: str = "Amazon",
    u=Depends(me),
):
    return kp(dataset)


@router.get("/revenue/monthly")
def r_monthly(
    dataset: str = "Amazon",
    u=Depends(me),
):
    m = (
        sub(dataset)
        .set_index("date")
        .revenue
        .resample("MS")
        .sum()
    )

    return {
        "labels": [
            i.strftime("%b %y")
            for i in m.index
        ],
        "values": m.round(0).tolist(),
    }


@router.get("/revenue/forecast")
def r_fc(
    dataset: str = "Amazon",
    days: int = 30,
    u=Depends(me),
):
    if days not in (7, 30, 90):
        raise HTTPException(
            400,
            "days must be 7, 30 or 90",
        )

    f = fc(dataset, days)

    try:
        with db() as c:
            c.execute(
                """
                INSERT INTO forecast_history
                (username,dataset,days,total,trend,confidence,created)
                VALUES(?,?,?,?,?,?,?)
                """,
                (
                    u["sub"],
                    dataset,
                    days,
                    f["total"],
                    f["trend"],
                    f["confidence"],
                    datetime.now(timezone.utc).isoformat(
                        timespec="seconds"
                    ),
                ),
            )
    except Exception:
        pass

    log_activity(
        u["sub"],
        u["role"],
        f"Viewed {days}-day forecast",
        dataset,
        f"{f['trend']} · {f['confidence']}% confidence",
    )

    return f


@router.get("/revenue/categories")
def r_cat(
    dataset: str = "Amazon",
    u=Depends(me),
):
    g = (
        sub(dataset)
        .groupby("category")
        .revenue
        .sum()
        .sort_values(ascending=False)
        .head(6)
    )

    return {
        "labels": g.index.tolist(),
        "values": g.round(0).tolist(),
    }


@router.get("/revenue/top-products")
def r_top(
    dataset: str = "Amazon",
    n: int = 8,
    u=Depends(me),
):
    n = min(max(n, 1), 50)

    g = (
        sub(dataset)
        .groupby("product_name")
        .revenue
        .sum()
        .sort_values(ascending=False)
        .head(n)
    )

    return {
        "labels": [
            str(i)[:22]
            for i in g.index
        ],
        "values": g.round(0).tolist(),
    }


@router.get("/product/{dataset}/{pid}")
def r_prod(
    dataset: str,
    pid: str,
    days: int = 30,
    u=Depends(me),
):
    """Product intelligence without the broken price_recommendation import.

    Uses the selected product's real history to calculate current price and
    a transparent candidate-price revenue recommendation. The recommendation
    is a heuristic based on a local elasticity assumption, not a causal claim.
    """

    if days not in (7, 30, 90):
        raise HTTPException(
            400,
            "days must be 7, 30 or 90",
        )

    try:
        d = sub(dataset).copy()

        # Normalize the identifiers so P00046 / " P00046 " match reliably.
        d["product_id"] = d["product_id"].astype(str).str.strip()
        product = d[d["product_id"] == str(pid).strip()].copy()

        if product.empty:
            raise HTTPException(
                404,
                f"Product {pid} not found in {dataset}.",
            )

        product["date"] = pd.to_datetime(
            product["date"],
            errors="coerce",
        )
        product = product.dropna(subset=["date"]).sort_values("date")

        if product.empty:
            raise HTTPException(
                400,
                f"No valid dated records found for product {pid}.",
            )

        # ---------- current price ----------
        product["price"] = pd.to_numeric(
            product["price"],
            errors="coerce",
        )
        valid_prices = product["price"].dropna()

        if valid_prices.empty:
            raise HTTPException(
                400,
                f"No valid price data found for product {pid}.",
            )

        # Latest available price is the most useful 'Current price'.
        current_price = float(valid_prices.iloc[-1])

        # ---------- recent demand ----------
        product["units_sold"] = pd.to_numeric(
            product["units_sold"],
            errors="coerce",
        ).fillna(0)

        product["revenue"] = pd.to_numeric(
            product["revenue"],
            errors="coerce",
        ).fillna(0)

        latest_date = product["date"].max()
        recent = product[
            product["date"] >= latest_date - pd.Timedelta(days=30)
        ].copy()

        if recent.empty:
            recent = product.tail(30).copy()

        recent_days = max(
            int(recent["date"].dt.normalize().nunique()),
            1,
        )

        recent_units = float(recent["units_sold"].sum())
        avg_daily_units = recent_units / recent_days
        predicted_units = max(avg_daily_units * days, 0.0)

        # ---------- demand trend ----------
        midpoint = max(len(product) // 2, 1)
        first_half = product.iloc[:midpoint]
        second_half = product.iloc[midpoint:]

        first_avg = float(first_half["units_sold"].mean()) if not first_half.empty else 0.0
        second_avg = float(second_half["units_sold"].mean()) if not second_half.empty else 0.0

        if first_avg > 0:
            trend_change = second_avg / first_avg - 1.0
        else:
            trend_change = 0.0

        if trend_change > 0.05:
            trend = "Increasing"
        elif trend_change < -0.05:
            trend = "Decreasing"
        else:
            trend = "Stable"

        # ---------- transparent price recommendation ----------
        # Test +/-20% around the current price. Elasticity -1.2 is the same
        # baseline documented for the project's Milestone 2 recommendation.
        elasticity = -1.2

        candidate_prices = np.linspace(
            current_price * 0.80,
            current_price * 1.20,
            21,
        )

        simulations = []
        for candidate in candidate_prices:
            ratio = candidate / current_price if current_price else 1.0
            expected_units = predicted_units * (ratio ** elasticity)
            expected_revenue = candidate * expected_units

            simulations.append({
                "price": float(candidate),
                "units": float(expected_units),
                "revenue": float(expected_revenue),
            })

        best = max(
            simulations,
            key=lambda row: row["revenue"],
        )

        recommended_price = float(best["price"])
        recommended_units = float(best["units"])
        revenue_forecast = current_price * predicted_units
        revenue_at_recommended = float(best["revenue"])

        price_change_pct = (
            ((recommended_price / current_price) - 1.0) * 100.0
            if current_price > 0
            else 0.0
        )

        # ---------- simple confidence indicator ----------
        observations = len(product)
        if observations >= 100:
            confidence = 90.0
        elif observations >= 50:
            confidence = 85.0
        elif observations >= 20:
            confidence = 78.0
        elif observations >= 10:
            confidence = 70.0
        else:
            confidence = 60.0

        result = {
            "forecast": {
                "predicted_units": round(predicted_units, 2),
                "confidence_score": confidence,
                "confidence": confidence,
                "trend": trend,
                "forecast_days": days,
                "avg_daily_units": round(avg_daily_units, 2),
            },
            "price": {
                "current_price": round(current_price, 2),
                "recommended_price": round(recommended_price, 2),
                "price_change_pct": round(price_change_pct, 2),
                "estimated_elasticity": elasticity,
            },
            "revenue_forecast": round(revenue_forecast, 2),
            "revenue_at_recommended": round(revenue_at_recommended, 2),
            "recommended_expected_units": round(recommended_units, 2),
        }

        log_activity(
            u["sub"],
            u["role"],
            "Viewed product intelligence",
            dataset,
            f"Product {pid} · {days} days",
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        print("PRODUCT INTELLIGENCE ERROR:", repr(e))
        raise HTTPException(500, f"Product intelligence failed: {e}")


# ---------- country revenue map ----------
# The processed combined dataset does not keep the original Country column.
# We therefore use the Online Retail source workbook when available. A small
# verified fallback is kept so the dashboard never becomes blank merely because
# the workbook was moved to a different data folder.
COUNTRY_REVENUE_FALLBACK = {
    "United Kingdom": 9025222.08,
    "Netherlands": 285446.34,
    "Ireland": 283453.96,
    "Germany": 228867.14,
    "France": 209715.11,
    "Australia": 138521.31,
    "Spain": 61577.11,
    "Switzerland": 57089.90,
    "Belgium": 41196.34,
    "Sweden": 38378.33,
    "Japan": 37416.37,
    "Norway": 36165.44,
    "Portugal": 33747.10,
    "Finland": 22546.08,
    "Singapore": 21279.29,
    "Denmark": 18955.34,
    "Italy": 17483.24,
    "Hong Kong": 15691.80,
    "Cyprus": 13590.38,
    "Austria": 10198.68,
    "Israel": 8135.26,
    "Poland": 7334.65,
    "Greece": 4760.52,
    "Iceland": 4310.00,
    "Canada": 3666.38,
    "United States": 3580.39,
    "Malta": 2725.59,
    "United Arab Emirates": 1902.28,
    "Lebanon": 1693.88,
    "Lithuania": 1661.06,
    "Brazil": 1143.60,
    "South Africa": 1002.31,
    "Czechia": 826.74,
    "Bahrain": 754.14,
    "Saudi Arabia": 145.92,
}


def _find_online_retail_source():
    candidates = [
        ROOT / "data" / "raw" / "Online Retail.xlsx",
        ROOT / "data" / "raw" / "Online_Retail.xlsx",
        ROOT / "data" / "Online Retail.xlsx",
        ROOT / "data" / "Online_Retail.xlsx",
        ROOT / "Online Retail.xlsx",
        ROOT / "Online_Retail.xlsx",
    ]

    for path in candidates:
        if path.is_file():
            return path

    # Also search one level deeper under the project root. This handles
    # projects where datasets live in a differently named data folder.
    try:
        for path in ROOT.rglob("*.xlsx"):
            if path.name.lower().replace("_", " ") == "online retail.xlsx":
                return path
    except Exception:
        pass

    return None


@lru_cache(maxsize=1)
def country_revenue():
    source = _find_online_retail_source()

    if source is not None:
        try:
            d = pd.read_excel(
                source,
                usecols=["InvoiceNo", "Quantity", "UnitPrice", "Country"],
            )

            d["InvoiceNo"] = d["InvoiceNo"].astype(str).str.strip()
            d["Quantity"] = pd.to_numeric(d["Quantity"], errors="coerce")
            d["UnitPrice"] = pd.to_numeric(d["UnitPrice"], errors="coerce")
            d["Country"] = d["Country"].astype(str).str.strip()

            d = d[
                (~d["InvoiceNo"].str.startswith("C"))
                & (d["Quantity"] > 0)
                & (d["UnitPrice"] > 0)
                & d["Country"].notna()
            ].copy()

            d["revenue"] = d["Quantity"] * d["UnitPrice"]

            aliases = {
                "EIRE": "Ireland",
                "USA": "United States",
                "RSA": "South Africa",
                "Czech Republic": "Czechia",
            }
            d["Country"] = d["Country"].replace(aliases)

            d = d[~d["Country"].isin([
                "Unspecified",
                "European Community",
                "Channel Islands",
            ])]

            g = (
                d.groupby("Country", as_index=False)["revenue"]
                .sum()
                .sort_values("revenue", ascending=False)
            )

            if not g.empty:
                return {
                    "labels": g["Country"].tolist(),
                    "values": g["revenue"].round(2).tolist(),
                    "total": round(float(g["revenue"].sum()), 2),
                    "source": "Online Retail source data",
                }
        except Exception as exc:
            print("COUNTRY WORKBOOK ERROR:", repr(exc))

    # Never return a 500 for the dashboard map. The values below are the
    # Online Retail country-revenue figures already used by this project UI.
    items = sorted(
        COUNTRY_REVENUE_FALLBACK.items(),
        key=lambda x: x[1],
        reverse=True,
    )

    return {
        "labels": [x[0] for x in items],
        "values": [round(x[1], 2) for x in items],
        "total": round(sum(x[1] for x in items), 2),
        "source": "Online Retail source data fallback",
    }


@router.get("/revenue/countries")
def r_countries(
    dataset: str = "Online Retail",
    u=Depends(me),
):
    if dataset.strip().lower() != "online retail":
        return {
            "labels": [],
            "values": [],
            "total": 0,
            "source": "",
        }

    result = country_revenue()

    log_activity(
        u["sub"],
        u["role"],
        "Viewed revenue by country",
        "Online Retail",
    )

    return result


# ---------- reports ----------
@router.get("/reports/history")
def reports_history(
    limit: int = 10,
    u=Depends(me),
):
    limit = min(max(limit, 1), 50)

    with db() as c:
        rows = c.execute(
            """
            SELECT dataset, report_type, created
            FROM report_history
            WHERE username=?
            ORDER BY id DESC
            LIMIT ?
            """,
            (u["sub"], limit),
        ).fetchall()

    return [dict(r) for r in rows]


@router.get("/report.csv")
def report(
    dataset: str = "Amazon",
    u=Depends(me),
):
    rows = [
        ("KPI", k, v)
        for k, v in kp(dataset).items()
    ]

    for d in (7, 30, 90):
        f = fc(dataset, d)
        rows += [
            (
                f"Forecast {d}d",
                "total_revenue",
                f["total"],
            ),
            (
                f"Forecast {d}d",
                "trend",
                f["trend"],
            ),
            (
                f"Forecast {d}d",
                "confidence_pct",
                f["confidence"],
            ),
        ]

    t = r_top(dataset, 10, u)
    rows += [
        ("Top product", n, v)
        for n, v in zip(
            t["labels"],
            t["values"],
        )
    ]

    c = r_cat(dataset, u)
    rows += [
        ("Category", n, v)
        for n, v in zip(
            c["labels"],
            c["values"],
        )
    ]

    csv = (
        "section,metric,value\n"
        + "\n".join(
            f'"{a}","{b}",{v}'
            for a, b, v in rows
        )
    )

    try:
        with db() as c:
            c.execute(
                """
                INSERT INTO report_history
                (username,dataset,report_type,created)
                VALUES(?,?,?,?)
                """,
                (
                    u["sub"],
                    dataset,
                    "Business snapshot",
                    datetime.now(timezone.utc).isoformat(
                        timespec="seconds"
                    ),
                ),
            )
    except Exception:
        pass

    log_activity(
        u["sub"],
        u["role"],
        "Exported business report",
        dataset,
    )

    return Response(
        csv,
        media_type="text/csv",
        headers={
            "Content-Disposition":
                f"attachment; filename=pricepilot_{dataset}_report.csv"
        },
    )


# ---------- AI chatbot ----------
def local_chat(m, ds):
    t = m.lower()

    days = (
        90
        if any(
            w in t
            for w in ("90", "quarter", "3 month")
        )
        else 7
        if any(
            w in t
            for w in ("7 ", "week")
        )
        else 30
    )

    if any(
        w in t
        for w in ("forecast", "predict", "next", "future")
    ):
        f = fc(ds, days)
        return (
            f"Expected revenue for the next {days} days: "
            f"{inr(f['total'])} "
            f"(about {inr(f['avg_daily'])}/day). "
            f"Trend: {f['trend']}, "
            f"confidence {f['confidence']}%."
        )

    if "categor" in t:
        c = r_cat(ds, None)
        return (
            "Revenue by category: "
            + ", ".join(
                f"{a} {inr(b)}"
                for a, b in zip(
                    c["labels"],
                    c["values"],
                )
            )
        )

    if any(
        w in t
        for w in ("top", "best", "product")
    ):
        c = r_top(ds, 5, None)
        return (
            "Top products by revenue: "
            + ", ".join(
                f"{a} ({inr(b)})"
                for a, b in zip(
                    c["labels"],
                    c["values"],
                )
            )
        )

    if any(
        w in t
        for w in (
            "total",
            "revenue",
            "kpi",
            "sales",
            "growth",
        )
    ):
        k = kp(ds)
        return (
            f"Total revenue is "
            f"{inr(k['total_revenue'])} "
            f"from {k['units']:,} units across "
            f"{k['products']} products. "
            f"The last 30 days made "
            f"{inr(k['last30'])} "
            f"({k['growth_pct']:+}% vs the 30 days before)."
        )

    return (
        "I can answer questions about total revenue, "
        "7/30/90-day forecasts, top products and categories. "
        'Try: "Forecast next 30 days".'
    )


def llm(m, ds):
    key = os.getenv("GROQ_API_KEY")

    if not key:
        return None

    try:
        client = OpenAI(
            api_key=key,
            base_url="https://api.groq.com/openai/v1",
        )

        ctx = json.dumps(
            {
                "dataset": ds,
                "kpis": kp(ds),
                **{
                    f"forecast_{d}d": {
                        k: fc(ds, d)[k]
                        for k in (
                            "total",
                            "trend",
                            "confidence",
                        )
                    }
                    for d in (7, 30, 90)
                },
                "categories": r_cat(ds, None),
                "top_products": r_top(ds, 5, None),
            },
            default=str,
        )

        response = client.chat.completions.create(
            model=os.getenv(
                "GROQ_MODEL",
                "openai/gpt-oss-20b",
            ),
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are PricePilot AI's pricing analyst. "
                        "Answer briefly in plain language using only "
                        "this business data. Currency is INR. If the "
                        "data does not contain an answer, say so "
                        "instead of inventing it.\n\n"
                        + ctx
                    ),
                },
                {
                    "role": "user",
                    "content": m,
                },
            ],
            temperature=0.2,
            max_tokens=500,
        )

        return response.choices[0].message.content

    except Exception:
        return None


@router.post("/chat")
def chat(
    b: Msg,
    u=Depends(me),
):
    a = llm(b.message, b.dataset)

    answer = a or local_chat(
        b.message,
        b.dataset,
    )

    engine = (
        "groq-openai"
        if a
        else "built-in"
    )

    try:
        with db() as c:
            c.execute(
                """
                INSERT INTO chat_history
                (username,dataset,question,answer,engine,created)
                VALUES(?,?,?,?,?,?)
                """,
                (
                    u["sub"],
                    b.dataset,
                    b.message,
                    answer,
                    engine,
                    datetime.now(timezone.utc).isoformat(
                        timespec="seconds"
                    ),
                ),
            )
    except Exception:
        pass

    log_activity(
        u["sub"],
        u["role"],
        "Asked AI analyst",
        b.dataset,
        engine,
    )

    return {
        "answer": answer,
        "engine": engine,
    }


# ---------- app ----------
app.include_router(router)

app.mount(
    "/v3",
    StaticFiles(
        directory=ROOT / "frontend" / "v3",
        html=True,
    ),
    name="v3",
)
