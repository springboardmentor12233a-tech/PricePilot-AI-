"""
PricePilot AI - Direct File Restoration Script
Writes all core modules directly to disk to prevent editor diff buffer conflicts.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FILES = {}

# ==============================================================================
# 1. demand_model.py
# ==============================================================================
FILES["demand_model.py"] = '''"""
Multi-Horizon ML Demand Forecasting & Price Elasticity Engine for PricePilot AI
Trains tree-based models (RandomForest and XGBoost) on chronological monthly metrics panel.
Forecasts multi-horizon unit sales (7d, 14d, 30d, 3m, 6m, 12m), calculates 95% confidence intervals,
evaluates Price Elasticity of Demand (E_d), and generates a 13-point revenue simulation curve.
"""

from typing import Dict, Any, Optional, List, Tuple
import numpy as np
import pandas as pd
from sqlalchemy import text
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from database import engine

try:
    from xgboost import XGBRegressor
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

# Model Registry Cache
_DEMAND_MODEL_CACHE: Dict[str, Any] = {
    "model": None,
    "champion_name": None,
    "feature_names": None,
    "metrics": None,
    "residual_std": 5.0,
}


def _extract_training_panel(db_engine) -> pd.DataFrame:
    """
    Extracts chronological panel of monthly metrics joined with product attributes
    and unpivoted competitor price averages.
    """
    query = text("""
        SELECT 
            m.product_id,
            m.period_date,
            m.qty_sold,
            m.unit_price,
            m.lag_unit_price,
            m.freight_price,
            m.product_score,
            m.customers AS customers_count,
            m.weekday_count,
            m.weekend_count,
            m.holiday_count,
            p.category,
            p.weight_g,
            p.photos_qty,
            p.description_length,
            COALESCE(c.comp_avg_price, m.unit_price) AS comp_avg_price,
            COALESCE(c.comp_avg_score, m.product_score) AS comp_avg_score
        FROM monthly_metrics m
        JOIN products p ON m.product_id = p.product_id
        LEFT JOIN (
            SELECT product_id, period_date,
                   AVG(price) AS comp_avg_price,
                   AVG(score) AS comp_avg_score
            FROM competitor_prices
            GROUP BY product_id, period_date
        ) c ON m.product_id = c.product_id AND m.period_date = c.period_date
        ORDER BY m.period_date ASC, m.product_id ASC
    """)

    with db_engine.connect() as conn:
        df = pd.read_sql(query, conn)

    if df.empty:
        return df

    # Feature Engineering
    df["period_date"] = pd.to_datetime(df["period_date"])
    df["month"] = df["period_date"].dt.month
    df["quarter"] = df["period_date"].dt.quarter
    df["price_diff_comp"] = df["unit_price"] - df["comp_avg_price"]
    df["price_ratio_comp"] = df["unit_price"] / (df["comp_avg_price"].replace(0, np.nan))
    df["price_ratio_comp"] = df["price_ratio_comp"].fillna(1.0)
    df["lag_price_diff"] = df["unit_price"] - df["lag_unit_price"].fillna(df["unit_price"])
    df["score_diff"] = df["product_score"].fillna(4.0) - df["comp_avg_score"].fillna(4.0)

    # One-hot encode category
    cat_dummies = pd.get_dummies(df["category"], prefix="cat", drop_first=True)
    df = pd.concat([df, cat_dummies], axis=1)

    return df


def train_demand_model(db_engine=engine) -> Dict[str, Any]:
    """
    Trains and benchmarks RandomForest vs XGBoost on chronological train/test split.
    Caches the best performing champion model into memory.
    """
    df = _extract_training_panel(db_engine)
    if df.empty or len(df) < 20:
        return {"status": "insufficient_data"}

    # Define feature set
    drop_cols = ["product_id", "period_date", "qty_sold", "category"]
    feature_cols = [c for c in df.columns if c not in drop_cols]

    X = df[feature_cols].fillna(0)
    y = df["qty_sold"].astype(float)

    # Strict chronological split (80% train, 20% validation)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    candidates = {}

    # 1. Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=100, max_depth=8, min_samples_leaf=2, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_r2 = float(r2_score(y_test, rf_pred))
    rf_mae = float(mean_absolute_error(y_test, rf_pred))
    rf_rmse = float(np.sqrt(mean_squared_error(y_test, rf_pred)))
    candidates["RandomForest"] = {
        "model": rf,
        "r2": rf_r2,
        "mae": rf_mae,
        "rmse": rf_rmse,
        "preds": rf_pred,
    }

    # 2. XGBoost Regressor
    if XGB_AVAILABLE:
        xgb = XGBRegressor(n_estimators=80, max_depth=5, learning_rate=0.08, random_state=42)
        xgb.fit(X_train, y_train)
        xgb_pred = xgb.predict(X_test)
        candidates["XGBoost"] = {
            "model": xgb,
            "r2": float(r2_score(y_test, xgb_pred)),
            "mae": float(mean_absolute_error(y_test, xgb_pred)),
            "rmse": float(np.sqrt(mean_squared_error(y_test, xgb_pred))),
            "preds": xgb_pred,
        }

    # Pick champion model based on lowest MAE / highest R2
    best_name = max(candidates.keys(), key=lambda k: candidates[k]["r2"])
    champion = candidates[best_name]

    # Calculate residual standard deviation for 95% confidence bounds
    residuals = y_test - champion["preds"]
    resid_std = float(np.std(residuals)) if len(residuals) > 0 else 5.0
    resid_std = max(resid_std, 2.0)

    _DEMAND_MODEL_CACHE["model"] = champion["model"]
    _DEMAND_MODEL_CACHE["champion_name"] = best_name
    _DEMAND_MODEL_CACHE["feature_names"] = feature_cols
    _DEMAND_MODEL_CACHE["residual_std"] = resid_std
    _DEMAND_MODEL_CACHE["metrics"] = {
        "champion": best_name,
        "r2": round(champion["r2"], 4),
        "mae": round(champion["mae"], 2),
        "rmse": round(champion["rmse"], 2),
        "rows": len(df),
    }

    print(
        f"[DemandModel] Champion Model '{best_name}' trained on {len(df)} rows. "
        f"Validation R²={champion['r2']:.4f}, MAE={champion['mae']:.2f}"
    )
    return _DEMAND_MODEL_CACHE["metrics"]


def predict_demand(
    db_engine,
    product_id: str,
    custom_price: Optional[float] = None,
) -> Optional[Dict[str, Any]]:
    """
    Generates multi-horizon demand forecasts, 95% confidence intervals, price elasticity,
    and revenue simulation curve for a given product.
    """
    if _DEMAND_MODEL_CACHE["model"] is None:
        train_demand_model(db_engine)

    model = _DEMAND_MODEL_CACHE["model"]
    feature_cols = _DEMAND_MODEL_CACHE["feature_names"]
    resid_std = _DEMAND_MODEL_CACHE["residual_std"]

    if model is None or feature_cols is None:
        return None

    # Fetch product monthly records
    df_full = _extract_training_panel(db_engine)
    prod_history = df_full[df_full["product_id"] == product_id].copy()

    if prod_history.empty:
        return None

    latest_row = prod_history.iloc[-1].copy()
    base_price = float(latest_row["unit_price"])
    target_price = float(custom_price) if custom_price is not None else base_price

    # Prepare feature vector for target price
    row_features = latest_row.copy()
    row_features["unit_price"] = target_price
    row_features["price_diff_comp"] = target_price - float(latest_row["comp_avg_price"])
    comp_avg = float(latest_row["comp_avg_price"]) if latest_row["comp_avg_price"] > 0 else target_price
    row_features["price_ratio_comp"] = target_price / comp_avg

    X_input = pd.DataFrame([row_features[feature_cols].fillna(0).to_dict()])
    base_monthly_pred = max(0.5, float(model.predict(X_input)[0]))

    # Historical demand statistics
    hist_qty = prod_history["qty_sold"].astype(float).tolist()
    hist_avg = float(np.mean(hist_qty)) if hist_qty else base_monthly_pred
    recent_3m_avg = float(np.mean(hist_qty[-3:])) if len(hist_qty) >= 3 else hist_avg
    growth_rate = round(((recent_3m_avg - hist_avg) / (hist_avg if hist_avg > 0 else 1)) * 100, 1)

    trend_str = "Increasing" if growth_rate > 3.0 else "Decreasing" if growth_rate < -3.0 else "Stable"
    trend_sentiment = "positive" if growth_rate > 3.0 else "negative" if growth_rate < -3.0 else "neutral"

    # Multi-Horizon Projections (7d, 14d, 30d, 3m, 6m, 12m)
    q30d = base_monthly_pred
    q7d = round(q30d * (7.0 / 30.0), 1)
    q14d = round(q30d * (14.0 / 30.0), 1)
    q3m = round(q30d * 3.0 * (1.0 + (growth_rate * 0.005)), 1)
    q6m = round(q30d * 6.0 * (1.0 + (growth_rate * 0.01)), 1)
    q12m = round(q30d * 12.0 * (1.0 + (growth_rate * 0.02)), 1)

    horizons = {
        "7_days": {"qty": q7d, "revenue": round(float(q7d * target_price), 2)},
        "14_days": {"qty": q14d, "revenue": round(float(q14d * target_price), 2)},
        "30_days": {"qty": round(float(q30d), 1), "revenue": round(float(q30d * target_price), 2)},
        "3_months": {"qty": q3m, "revenue": round(float(q3m * target_price), 2)},
        "6_months": {"qty": q6m, "revenue": round(float(q6m * target_price), 2)},
        "12_months": {"qty": q12m, "revenue": round(float(q12m * target_price), 2)},
    }

    # 95% Confidence Interval for 30-day forecast (+/- 1.96 * resid_std)
    ci_margin = 1.96 * resid_std
    ci_lower = max(0.0, round(float(q30d - ci_margin), 1))
    ci_upper = round(float(q30d + ci_margin), 1)

    # Price Elasticity of Demand (E_d = % dQ / % dP)
    p_high = base_price * 1.05
    p_low = base_price * 0.95

    row_high = latest_row.copy()
    row_high["unit_price"] = p_high
    row_high["price_diff_comp"] = p_high - comp_avg
    row_high["price_ratio_comp"] = p_high / comp_avg
    q_high = float(model.predict(pd.DataFrame([row_high[feature_cols].fillna(0).to_dict()]))[0])

    row_low = latest_row.copy()
    row_low["unit_price"] = p_low
    row_low["price_diff_comp"] = p_low - comp_avg
    row_low["price_ratio_comp"] = p_low / comp_avg
    q_low = float(model.predict(pd.DataFrame([row_low[feature_cols].fillna(0).to_dict()]))[0])

    pct_dp = (p_high - p_low) / base_price
    pct_dq = (q_high - q_low) / (base_monthly_pred if base_monthly_pred > 0 else 1.0)
    elasticity_coeff = round(float(pct_dq / (pct_dp if pct_dp != 0 else 0.1)), 2)

    if abs(elasticity_coeff) > 1.1:
        elasticity_type = "Elastic"
        elasticity_desc = "High demand sensitivity: Price changes induce noticeable volume shifts."
    elif abs(elasticity_coeff) < 0.9:
        elasticity_type = "Inelastic"
        elasticity_desc = "Low demand sensitivity: Customers are less price-conscious. Opportunity to capture margin with modest price increases."
    else:
        elasticity_type = "Unitary"
        elasticity_desc = "Balanced sensitivity: Revenue remains relatively steady around current baseline price."

    # 13-Point Revenue Simulation Curve (-30% to +30% in 5% increments)
    sim_curve = []
    best_revenue = 0.0
    best_price = target_price

    multipliers = [-0.30, -0.25, -0.20, -0.15, -0.10, -0.05, 0.0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30]
    for m in multipliers:
        p_sim = round(float(base_price * (1.0 + m)), 2)
        row_sim = latest_row.copy()
        row_sim["unit_price"] = p_sim
        row_sim["price_diff_comp"] = p_sim - comp_avg
        row_sim["price_ratio_comp"] = p_sim / comp_avg
        q_sim = max(0.0, float(model.predict(pd.DataFrame([row_sim[feature_cols].fillna(0).to_dict()]))[0]))
        rev_sim = round(float(p_sim * q_sim), 2)

        sim_curve.append({
            "price": p_sim,
            "demand": round(q_sim, 1),
            "expected_revenue": rev_sim,
            "price_multiplier": round(1.0 + m, 2),
            "is_current": bool(abs(p_sim - target_price) < 0.01),
        })

        if rev_sim > best_revenue:
            best_revenue = rev_sim
            best_price = p_sim

    current_rev = float(target_price * q30d)
    potential_gain_pct = round(((best_revenue - current_rev) / (current_rev if current_rev > 0 else 1.0)) * 100, 1)
    potential_gain_pct = max(0.0, potential_gain_pct)

    # Chart Series (Historical Actuals + Forecasted Trajectory)
    chart_series = []
    for idx, row in prod_history.iloc[-5:].iterrows():
        p_date = row["period_date"]
        chart_series.append({
            "period": p_date.strftime("%b %y") if hasattr(p_date, "strftime") else str(p_date),
            "actual_demand": int(row["qty_sold"]),
            "forecast_demand": None,
            "ci_upper": None,
            "ci_lower": None,
            "unit_price": float(row["unit_price"]),
        })

    # Add current anchor and projections
    chart_series.append({
        "period": "Current",
        "actual_demand": int(latest_row["qty_sold"]),
        "forecast_demand": int(latest_row["qty_sold"]),
        "ci_upper": int(latest_row["qty_sold"]),
        "ci_lower": int(latest_row["qty_sold"]),
        "unit_price": target_price,
    })
    chart_series.append({
        "period": "Next 7 Days",
        "actual_demand": None,
        "forecast_demand": q7d,
        "ci_upper": round(q7d + (ci_margin * 7.0 / 30.0), 1),
        "ci_lower": max(0.0, round(q7d - (ci_margin * 7.0 / 30.0), 1)),
        "unit_price": target_price,
    })
    chart_series.append({
        "period": "Next 14 Days",
        "actual_demand": None,
        "forecast_demand": q14d,
        "ci_upper": round(q14d + (ci_margin * 14.0 / 30.0), 1),
        "ci_lower": max(0.0, round(q14d - (ci_margin * 14.0 / 30.0), 1)),
        "unit_price": target_price,
    })
    chart_series.append({
        "period": "Next 30 Days",
        "actual_demand": None,
        "forecast_demand": round(q30d, 1),
        "ci_upper": ci_upper,
        "ci_lower": ci_lower,
        "unit_price": target_price,
    })

    return {
        "product_id": product_id,
        "category": str(latest_row["category"]),
        "current_price": target_price,
        "competitor_avg_price": round(comp_avg, 2),
        "historical_avg_qty": round(hist_avg, 1),
        "recent_3m_avg_qty": round(recent_3m_avg, 1),
        "growth_rate_pct": growth_rate,
        "demand_trend": trend_str,
        "trend_sentiment": trend_sentiment,
        "confidence_pct": min(95, max(75, int(100 - (resid_std / (hist_avg if hist_avg > 0 else 1)) * 30))),
        "horizons": horizons,
        "confidence_interval": {
            "lower": ci_lower,
            "forecast": round(q30d, 1),
            "upper": ci_upper,
        },
        "elasticity": {
            "coefficient": elasticity_coeff,
            "type": elasticity_type,
            "description": elasticity_desc,
            "optimal_revenue_price": best_price,
            "potential_revenue_gain_pct": potential_gain_pct,
        },
        "revenue_simulation_curve": sim_curve,
        "chart_series": chart_series,
        "model_champion": _DEMAND_MODEL_CACHE.get("champion_name", "RandomForest"),
    }
'''

# ==============================================================================
# 2. main.py
# ==============================================================================
FILES["main.py"] = '''from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from database import engine
import pricing_model
import demand_model
import competitor_analytics
import auth
import urllib.request
import json
import re
import os

app = FastAPI(title="PricePilot AI", version="0.1.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    try:
        n = pricing_model.train_price_model(engine)
        print(f"Pricing model initialized on {n} rows")
    except Exception as e:
        print(f"Pricing model initialization deferred: {e}")

    try:
        meta = demand_model.train_demand_model(engine)
        print(f"Demand model initialized ({meta.get('champion_model', 'Trained')})")
    except Exception as e:
        print(f"Demand model initialization deferred: {e}")


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": str(e)}


# ============================================================================
# Authentication & Role-Based Access Control (RBAC) Endpoints
# ============================================================================

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "business_user"


class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/auth/register")
def register(req: RegisterRequest):
    role = req.role if req.role in ["pricing_manager", "business_user"] else "business_user"
    clean_email = req.email.strip().lower()

    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Valid email address is required")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    hashed = auth.hash_password(req.password)

    try:
        with engine.connect() as conn:
            existing = conn.execute(
                text("SELECT id FROM users WHERE email = :email"), {"email": clean_email}
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="An account with this email already exists")

            insert_query = text("""
                INSERT INTO users (email, hashed_password, full_name, role)
                VALUES (:email, :pwd, :name, :role)
                RETURNING id, email, full_name, role, created_at
            """)
            row = conn.execute(
                insert_query,
                {"email": clean_email, "pwd": hashed, "name": req.full_name, "role": role}
            ).mappings().first()
            conn.commit()

        user_data = dict(row)
        if "created_at" in user_data and hasattr(user_data["created_at"], "isoformat"):
            user_data["created_at"] = user_data["created_at"].isoformat()

        token = auth.create_access_token({"sub": user_data["email"], "role": user_data["role"]})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {e}")


@app.post("/auth/login")
def login(req: LoginRequest):
    clean_email = req.email.strip().lower()

    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, email, hashed_password, full_name, role, created_at FROM users WHERE email = :email"),
            {"email": clean_email}
        ).mappings().first()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not auth.verify_password(req.password, row["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_data = {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role"],
        "created_at": row["created_at"].isoformat() if hasattr(row["created_at"], "isoformat") else str(row["created_at"]),
    }

    token = auth.create_access_token({"sub": user_data["email"], "role": user_data["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data,
    }


@app.get("/auth/me")
def get_current_profile(current_user: Dict[str, Any] = Depends(auth.get_current_user)):
    return current_user


# ============================================================================
# Product Catalog & Historical Metrics Endpoints
# ============================================================================

@app.get("/products")
def list_products():
    try:
        with engine.connect() as conn:
            rows = conn.execute(
                text("""
                    SELECT p.product_id, p.category, p.weight_g,
                           m.unit_price, m.qty_sold, m.total_price, m.product_score
                    FROM products p
                    LEFT JOIN LATERAL (
                        SELECT unit_price, qty_sold, total_price, product_score
                        FROM monthly_metrics
                        WHERE product_id = p.product_id
                        ORDER BY period_date DESC
                        LIMIT 1
                    ) m ON true
                    ORDER BY p.product_id
                """)
            ).mappings().all()
        return [dict(r) for r in rows]
    except Exception as e:
        try:
            with engine.connect() as conn:
                rows = conn.execute(
                    text("SELECT product_id, category FROM products ORDER BY product_id")
                ).mappings().all()
            return [dict(r) for r in rows]
        except Exception:
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/products/{product_id}")
def get_product(product_id: str):
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT * FROM products WHERE product_id = :pid"), {"pid": product_id}
        ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(row)


@app.get("/products/{product_id}/history")
def get_product_history(product_id: str):
    with engine.connect() as conn:
        metrics = conn.execute(
            text("""
                SELECT period_date, qty_sold, unit_price, total_price, freight_price, product_score
                FROM monthly_metrics
                WHERE product_id = :pid
                ORDER BY period_date ASC
            """),
            {"pid": product_id}
        ).mappings().all()

        competitors = conn.execute(
            text("""
                SELECT period_date, competitor_num, price, score
                FROM competitor_prices
                WHERE product_id = :pid
                ORDER BY period_date ASC, competitor_num ASC
            """),
            {"pid": product_id}
        ).mappings().all()

    return {
        "product_id": product_id,
        "metrics": [dict(m) for m in metrics],
        "competitors": [dict(c) for c in competitors],
    }


@app.get("/products/{product_id}/price-recommendation")
def price_recommendation(product_id: str):
    result = pricing_model.predict_price(engine, product_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Product not found or has no pricing history")
    return result


class PriceApprovalRequest(BaseModel):
    new_price: float
    notes: Optional[str] = None


@app.post("/products/{product_id}/apply-price")
def apply_price_update(
    product_id: str,
    payload: PriceApprovalRequest,
    current_user: Dict[str, Any] = Depends(auth.require_role(["pricing_manager"]))
):
    return {
        "status": "applied",
        "product_id": product_id,
        "new_price": payload.new_price,
        "approved_by": current_user["email"],
        "manager_name": current_user["full_name"],
        "notes": payload.notes or "Price approved via PricePilot AI Management Console",
    }


@app.get("/analytics/summary")
def get_summary():
    try:
        with engine.connect() as conn:
            prod_count = conn.execute(text("SELECT COUNT(*) FROM products")).scalar() or 0
            metrics_count = conn.execute(text("SELECT COUNT(*) FROM monthly_metrics")).scalar() or 0
            avg_price = conn.execute(text("SELECT AVG(unit_price) FROM monthly_metrics")).scalar() or 0
            total_revenue = conn.execute(text("SELECT SUM(total_price) FROM monthly_metrics")).scalar() or 0
        return {
            "total_products": prod_count,
            "total_metrics_records": metrics_count,
            "avg_unit_price": round(float(avg_price), 2),
            "total_revenue": round(float(total_revenue), 2),
        }
    except Exception as e:
        return {
            "total_products": 0,
            "total_metrics_records": 0,
            "avg_unit_price": 0.0,
            "total_revenue": 0.0,
            "error": str(e)
        }


# ============================================================================
# Demand Forecasting & Price Elasticity ML Endpoints
# ============================================================================

@app.get("/forecast/demand/{product_id}")
def get_demand_forecast(product_id: str, price: Optional[float] = None):
    result = demand_model.predict_demand(engine, product_id, custom_price=price)
    if result is None:
        raise HTTPException(status_code=404, detail="Product not found or has no demand history")
    return result


# ============================================================================
# Competitor Intelligence Endpoints
# ============================================================================

@app.get("/analytics/competitors")
def get_competitor_insights():
    try:
        insights = competitor_analytics.get_all_competitor_insights(engine)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/competitors/{product_id}")
def get_competitor_detail(product_id: str):
    detail = competitor_analytics.get_product_competitor_detail(engine, product_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Product not found or has no competitor history")
    return detail


# ============================================================================
# Groq AI Copilot Chat Endpoints
# ============================================================================

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatPayload(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "openai/gpt-oss-20b"
    api_key: Optional[str] = None


@app.post("/api/chat")
def chat_proxy(payload: ChatPayload):
    key = payload.api_key or os.environ.get("GROQ_API_KEY", "")
    if key:
        key = re.sub(r'[\s\[\]\'"]+', '', key)

    if not key:
        raise HTTPException(status_code=400, detail="No Groq API key provided")

    clean_messages = [
        {"role": m.role, "content": m.content}
        for m in payload.messages
        if not m.content.startswith("⚠️") and not m.content.startswith("👋")
    ]

    first_user = next((i for i, m in enumerate(clean_messages) if m["role"] == "user"), 0)
    clean_messages = clean_messages[first_user:]

    system_prompt = {
        "role": "system",
        "content": "You are PricePilot AI Copilot, an intelligent dynamic pricing and revenue optimizer assistant. Provide concise, friendly, and structured markdown answers."
    }

    request_data = {
        "model": payload.model or "openai/gpt-oss-20b",
        "messages": [system_prompt] + clean_messages[-6:],
        "temperature": 0.6,
        "max_tokens": 800
    }

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(request_data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "PricePilot/1.0"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode("utf-8"))
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply, "model": payload.model}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"Groq API HTTP Error {e.code}: {err_body}")
        raise HTTPException(status_code=e.code, detail=err_body)
    except Exception as e:
        print(f"Groq API General Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/groq-models")
def get_groq_models(api_key: Optional[str] = None):
    key = api_key or os.environ.get("GROQ_API_KEY", "")
    if key:
        key = re.sub(r'[\s\[\]\'"]+', '', key)
    if not key:
        raise HTTPException(status_code=400, detail="No API key provided")

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/models",
        headers={
            "Authorization": f"Bearer {key}",
            "User-Agent": "Mozilla/5.0"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode("utf-8"))
            models = [
                m["id"] for m in data.get("data", [])
                if not any(x in m["id"].lower() for x in ["whisper", "guard", "safeguard"])
            ]
            return {"models": models}
    except urllib.error.HTTPError as e:
        raise HTTPException(status_code=e.code, detail=e.read().decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
'''

# ==============================================================================
# 3. test_endpoints.py
# ==============================================================================
FILES["test_endpoints.py"] = '''import urllib.request
import json

def test_api():
    base = "http://127.0.0.1:8000"
    with urllib.request.urlopen(f"{base}/health") as res:
        print("1. Health:", json.loads(res.read()))
        
    login_data = json.dumps({"email": "manager@pricepilot.ai", "password": "Password123!"}).encode("utf-8")
    req = urllib.request.Request(f"{base}/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        login_res = json.loads(res.read())
        token = login_res["access_token"]
        user = login_res["user"]
        print(f"2. Login success: {user['email']} | Role: {user['role']}")
        
    req_me = urllib.request.Request(f"{base}/auth/me", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req_me) as res:
        me = json.loads(res.read())
        print(f"3. Auth /me verified: {me['full_name']} | Role: {me['role']}")
        
    with urllib.request.urlopen(f"{base}/forecast/demand/bed1") as res:
        fc = json.loads(res.read())
        print(f"4. Demand Forecast (bed1): {len(fc['horizons'])} horizons | Elasticity: {fc['elasticity']['type']} ({fc['elasticity']['coefficient']}) | 30d qty: {fc['horizons']['30_days']['qty']}")
        
    with urllib.request.urlopen(f"{base}/analytics/competitors") as res:
        comp_all = json.loads(res.read())
        print(f"5. Competitor List: {len(comp_all)} products loaded.")
        p0 = comp_all[0]
        print(f"   First product: {p0['product_id']} | Price Index: {p0['price_index']}% | Stance: {p0['market_stance']} | Tag: {p0['opportunity']['tag']}")
        
    with urllib.request.urlopen(f"{base}/analytics/competitors/bed1") as res:
        detail = json.loads(res.read())
        print(f"6. Competitor Detail (bed1): {len(detail['competitors'])} rivals, {len(detail['historical_trend'])} history periods.")
        for c in detail["competitors"]:
            print(f"   - {c['competitor_id']}: ${c['price']} (diff: ${c['price_difference']}, score: {c['score']})")

if __name__ == "__main__":
    test_api()
'''

# ==============================================================================
# 4. frontend/src/services/api.js
# ==============================================================================
FILES["frontend/src/services/api.js"] = '''import axios from "axios";

const API_BASE = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pricepilot_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const FALLBACK_PRODUCTS = [
  {
    product_id: "bed1",
    category: "bed_bath_table",
    weight_g: 1050,
    unit_price: 39.24,
    qty_sold: 8,
    total_price: 313.92,
    product_score: 4.0,
    comp_avg_price: 50.83,
    recommended_price: 42.0,
    change_pct: 7.0,
    demand_trend: "Increasing",
    confidence: 88,
  },
  {
    product_id: "health1",
    category: "health_beauty",
    weight_g: 450,
    unit_price: 84.9,
    qty_sold: 95,
    total_price: 8065.5,
    product_score: 4.7,
    comp_avg_price: 79.99,
    recommended_price: 82.5,
    change_pct: -2.8,
    demand_trend: "Stable",
    confidence: 94,
  },
  {
    product_id: "computers1",
    category: "computers_accessories",
    weight_g: 820,
    unit_price: 119.0,
    qty_sold: 210,
    total_price: 24990.0,
    product_score: 4.1,
    comp_avg_price: 135.0,
    recommended_price: 128.5,
    change_pct: 8.0,
    demand_trend: "Increasing",
    confidence: 86,
  },
  {
    product_id: "watches1",
    category: "watches_gifts",
    weight_g: 320,
    unit_price: 189.9,
    qty_sold: 68,
    total_price: 12913.2,
    product_score: 4.8,
    comp_avg_price: 199.9,
    recommended_price: 195.0,
    change_pct: 2.7,
    demand_trend: "Increasing",
    confidence: 91,
  },
  {
    product_id: "garden1",
    category: "garden_tools",
    weight_g: 2200,
    unit_price: 49.5,
    qty_sold: 120,
    total_price: 5940.0,
    product_score: 3.9,
    comp_avg_price: 45.0,
    recommended_price: 46.5,
    change_pct: -6.1,
    demand_trend: "Decreasing",
    confidence: 82,
  },
  {
    product_id: "cool1",
    category: "cool_stuff",
    weight_g: 150,
    unit_price: 59.99,
    qty_sold: 340,
    total_price: 20396.6,
    product_score: 4.6,
    comp_avg_price: 64.99,
    recommended_price: 62.5,
    change_pct: 4.2,
    demand_trend: "Increasing",
    confidence: 93,
  },
];

export const FALLBACK_SUMMARY = {
  total_products: 52,
  total_metrics_records: 676,
  avg_unit_price: 88.54,
  total_revenue: 1245890.0,
  opportunities_count: 18,
  avg_margin_uplift: 4.8,
};

export const loginUser = async (email, password) => {
  try {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.access_token) {
      localStorage.setItem("pricepilot_token", res.data.access_token);
      localStorage.setItem("pricepilot_user", JSON.stringify(res.data.user));
      return { success: true, data: res.data };
    }
    throw new Error("No token returned from server");
  } catch (err) {
    const detail = err.response?.data?.detail || err.message || "Login failed";
    return { success: false, error: detail };
  }
};

export const registerUser = async (email, password, fullName, role = "business_user") => {
  try {
    const res = await api.post("/auth/register", {
      email,
      password,
      full_name: fullName,
      role,
    });
    if (res.data?.access_token) {
      localStorage.setItem("pricepilot_token", res.data.access_token);
      localStorage.setItem("pricepilot_user", JSON.stringify(res.data.user));
      return { success: true, data: res.data };
    }
    throw new Error("No token returned from server");
  } catch (err) {
    const detail = err.response?.data?.detail || err.message || "Registration failed";
    return { success: false, error: detail };
  }
};

export const fetchMe = async () => {
  try {
    const token = localStorage.getItem("pricepilot_token");
    if (!token) return { user: null };
    const res = await api.get("/auth/me");
    if (res.data) {
      localStorage.setItem("pricepilot_user", JSON.stringify(res.data));
      return { user: res.data };
    }
    return { user: null };
  } catch (err) {
    localStorage.removeItem("pricepilot_token");
    localStorage.removeItem("pricepilot_user");
    return { user: null };
  }
};

export const logoutUser = () => {
  localStorage.removeItem("pricepilot_token");
  localStorage.removeItem("pricepilot_user");
};

export const fetchHealth = async () => {
  try {
    const res = await api.get("/health");
    return { isLive: res.data.status === "ok", details: res.data };
  } catch (err) {
    return { isLive: false, error: err.message };
  }
};

export const fetchProducts = async () => {
  try {
    const res = await api.get("/products");
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, isLive: true };
    }
    return { data: FALLBACK_PRODUCTS, isLive: false };
  } catch (err) {
    return { data: FALLBACK_PRODUCTS, isLive: false };
  }
};

export const fetchProductRecommendation = async (productId) => {
  try {
    const res = await api.get(`/products/${productId}/price-recommendation`);
    return { data: res.data, isLive: true };
  } catch (err) {
    const item =
      FALLBACK_PRODUCTS.find((p) => p.product_id === productId) ||
      FALLBACK_PRODUCTS[0];
    const diff = item.recommended_price - item.unit_price;
    return {
      data: {
        product_id: item.product_id,
        category: item.category,
        current_price: item.unit_price,
        recommended_price: item.recommended_price,
        change: Number(diff.toFixed(2)),
        change_pct: Number(((diff / item.unit_price) * 100).toFixed(1)),
        competitor_avg_price: item.comp_avg_price,
        as_of: new Date().toISOString().split("T")[0],
        confidence: item.confidence,
        demand_trend: item.demand_trend,
      },
      isLive: false,
    };
  }
};

export const applyPriceUpdate = async (productId, newPrice, notes = "") => {
  try {
    const res = await api.post(`/products/${productId}/apply-price`, {
      new_price: newPrice,
      notes,
    });
    return { success: true, data: res.data };
  } catch (err) {
    const detail = err.response?.data?.detail || err.message || "Failed to apply price";
    return { success: false, error: detail };
  }
};

export const fetchProductHistory = async (productId) => {
  try {
    const res = await api.get(`/products/${productId}/history`);
    if (res.data && res.data.metrics && res.data.metrics.length > 0) {
      return { data: res.data, isLive: true };
    }
    throw new Error("No live history");
  } catch (err) {
    const basePrice = (
      FALLBACK_PRODUCTS.find((p) => p.product_id === productId) ||
      FALLBACK_PRODUCTS[0]
    ).unit_price;
    const history = [
      { month: "Jan", price: basePrice * 0.95, comp1: basePrice * 0.98, comp2: basePrice * 0.94, comp3: basePrice * 1.02, demand: 110 },
      { month: "Feb", price: basePrice * 0.96, comp1: basePrice * 0.97, comp2: basePrice * 0.95, comp3: basePrice * 1.01, demand: 118 },
      { month: "Mar", price: basePrice * 0.98, comp1: basePrice * 1.0, comp2: basePrice * 0.99, comp3: basePrice * 1.04, demand: 125 },
      { month: "Apr", price: basePrice * 1.0, comp1: basePrice * 1.02, comp2: basePrice * 1.01, comp3: basePrice * 1.06, demand: 135 },
      { month: "May", price: basePrice * 1.02, comp1: basePrice * 1.05, comp2: basePrice * 1.03, comp3: basePrice * 1.08, demand: 142 },
      { month: "Jun", price: basePrice, comp1: basePrice * 1.06, comp2: basePrice * 1.04, comp3: basePrice * 1.09, demand: 150 },
    ];
    return { data: { product_id: productId, trend: history }, isLive: false };
  }
};

export const fetchSummary = async () => {
  try {
    const res = await api.get("/analytics/summary");
    if (res.data && res.data.total_products > 0) {
      return { data: res.data, isLive: true };
    }
    return { data: FALLBACK_SUMMARY, isLive: false };
  } catch (err) {
    return { data: FALLBACK_SUMMARY, isLive: false };
  }
};

export const fetchDemandForecast = async (productId, customPrice = null) => {
  try {
    const url = customPrice !== null
      ? `/forecast/demand/${productId}?price=${customPrice}`
      : `/forecast/demand/${productId}`;
    const res = await api.get(url);
    if (res.data && res.data.horizons) {
      return { data: res.data, isLive: true };
    }
    throw new Error("Invalid forecast payload");
  } catch (err) {
    const item = FALLBACK_PRODUCTS.find((p) => p.product_id === productId) || FALLBACK_PRODUCTS[0];
    const basePrice = customPrice !== null ? Number(customPrice) : item.unit_price;
    const baseQty = item.qty_sold || 140;

    const q30d = Math.round(baseQty * (item.demand_trend === "Increasing" ? 1.08 : 0.94));
    const q7d = Math.round(q30d * (7 / 30));
    const q14d = Math.round(q30d * (14 / 30));
    const q3m = Math.round(q30d * 3 * 1.04);
    const q6m = Math.round(q30d * 6 * 1.07);
    const q12m = Math.round(q30d * 12 * 1.12);

    const simPoints = [];
    let bestRev = 0;
    let optPrice = basePrice;
    [-0.3, -0.2, -0.1, -0.05, 0, 0.05, 0.1, 0.2, 0.3].forEach((pct) => {
      const p = Number((basePrice * (1 + pct)).toFixed(2));
      const q = Math.round(q30d * (1 - pct * 1.25));
      const rev = Number((p * q).toFixed(2));
      simPoints.push({
        price: p,
        demand: q,
        expected_revenue: rev,
        price_multiplier: 1 + pct,
        is_current: pct === 0,
      });
      if (rev > bestRev) {
        bestRev = rev;
        optPrice = p;
      }
    });

    return {
      data: {
        product_id: item.product_id,
        category: item.category,
        current_price: basePrice,
        competitor_avg_price: item.comp_avg_price,
        historical_avg_qty: baseQty,
        recent_3m_avg_qty: Math.round(baseQty * 0.98),
        growth_rate_pct: item.demand_trend === "Increasing" ? 8.4 : -4.2,
        demand_trend: item.demand_trend,
        trend_sentiment: item.demand_trend === "Increasing" ? "positive" : "negative",
        confidence_pct: item.confidence,
        horizons: {
          "7_days": { qty: q7d, revenue: Number((q7d * basePrice).toFixed(2)) },
          "14_days": { qty: q14d, revenue: Number((q14d * basePrice).toFixed(2)) },
          "30_days": { qty: q30d, revenue: Number((q30d * basePrice).toFixed(2)) },
          "3_months": { qty: q3m, revenue: Number((q3m * basePrice).toFixed(2)) },
          "6_months": { qty: q6m, revenue: Number((q6m * basePrice).toFixed(2)) },
          "12_months": { qty: q12m, revenue: Number((q12m * basePrice).toFixed(2)) },
        },
        confidence_interval: {
          lower: Math.round(q30d * 0.85),
          forecast: q30d,
          upper: Math.round(q30d * 1.15),
        },
        elasticity: {
          coefficient: -1.25,
          type: "Elastic",
          description: "High demand sensitivity: Price changes induce noticeable volume shifts.",
          optimal_revenue_price: optPrice,
          potential_revenue_gain_pct: 6.8,
        },
        revenue_simulation_curve: simPoints,
        chart_series: [
          { period: "Month -4", actual_demand: Math.round(baseQty * 0.9), forecast_demand: null, ci_upper: null, ci_lower: null, unit_price: basePrice },
          { period: "Month -3", actual_demand: Math.round(baseQty * 0.94), forecast_demand: null, ci_upper: null, ci_lower: null, unit_price: basePrice },
          { period: "Month -2", actual_demand: Math.round(baseQty * 0.98), forecast_demand: null, ci_upper: null, ci_lower: null, unit_price: basePrice },
          { period: "Month -1", actual_demand: baseQty, forecast_demand: null, ci_upper: null, ci_lower: null, unit_price: basePrice },
          { period: "Current", actual_demand: baseQty, forecast_demand: baseQty, ci_upper: baseQty, ci_lower: baseQty, unit_price: basePrice },
          { period: "Next 7 Days", actual_demand: null, forecast_demand: q7d, ci_upper: Math.round(q7d * 1.15), ci_lower: Math.round(q7d * 0.85), unit_price: basePrice },
          { period: "Next 14 Days", actual_demand: null, forecast_demand: q14d, ci_upper: Math.round(q14d * 1.15), ci_lower: Math.round(q14d * 0.85), unit_price: basePrice },
          { period: "Next 30 Days", actual_demand: null, forecast_demand: q30d, ci_upper: Math.round(q30d * 1.15), ci_lower: Math.round(q30d * 0.85), unit_price: basePrice },
        ],
        model_champion: "RandomForest",
      },
      isLive: false,
    };
  }
};

export const fetchCompetitorInsights = async () => {
  try {
    const res = await api.get("/analytics/competitors");
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, isLive: true };
    }
    throw new Error("No live competitor data");
  } catch (err) {
    const fallbackInsights = FALLBACK_PRODUCTS.map((p) => {
      const ourPrice = p.unit_price;
      const compAvg = p.comp_avg_price;
      const priceIndex = Number(((ourPrice / compAvg) * 100).toFixed(1));
      const stance = priceIndex > 105 ? "Premium to Market" : priceIndex < 95 ? "Value / Undercutting" : "Competitive Parity";
      const stanceColor = priceIndex > 105 ? "rose" : priceIndex < 95 ? "emerald" : "indigo";

      return {
        product_id: p.product_id,
        category: p.category,
        our_price: ourPrice,
        our_score: p.product_score,
        our_freight: 12.5,
        comp_avg_price: compAvg,
        comp_min_price: Number((compAvg * 0.92).toFixed(2)),
        comp_max_price: Number((compAvg * 1.10).toFixed(2)),
        comp_avg_score: 4.2,
        comp_avg_freight: 14.0,
        price_index: priceIndex,
        market_stance: stance,
        stance_color: stanceColor,
        competitors: {
          comp_1: { price: Number((compAvg * 0.96).toFixed(2)), score: 4.1, freight: 12.0 },
          comp_2: { price: compAvg, score: 4.3, freight: 14.5 },
          comp_3: { price: Number((compAvg * 1.05).toFixed(2)), score: 4.2, freight: 15.0 },
        },
        opportunity: {
          type: "opportunity",
          tag: "Margin Opportunity",
          badge: "Margin Uplift Opportunity",
          headline: `Rating advantage (${p.product_score}★)`,
          action: "Increase price by 5% – 8%",
          explanation: "Premium perception allows capturing higher margin without demand degradation."
        },
        as_of: new Date().toISOString().split("T")[0],
      };
    });
    return { data: fallbackInsights, isLive: false };
  }
};

export const fetchCompetitorDetail = async (productId) => {
  try {
    const res = await api.get(`/analytics/competitors/${productId}`);
    if (res.data && res.data.competitors) {
      return { data: res.data, isLive: true };
    }
    throw new Error("No live competitor detail");
  } catch (err) {
    const p = FALLBACK_PRODUCTS.find((item) => item.product_id === productId) || FALLBACK_PRODUCTS[0];
    const ourPrice = p.unit_price;
    const compAvg = p.comp_avg_price;
    const priceIndex = Number(((ourPrice / compAvg) * 100).toFixed(1));

    return {
      data: {
        product_id: p.product_id,
        category: p.category,
        our_price: ourPrice,
        our_score: p.product_score,
        our_freight: 12.5,
        comp_avg_price: compAvg,
        comp_min_price: Number((compAvg * 0.92).toFixed(2)),
        comp_max_price: Number((compAvg * 1.08).toFixed(2)),
        comp_avg_score: 4.2,
        comp_avg_freight: 14.0,
        price_index: priceIndex,
        market_stance: priceIndex > 105 ? "Premium to Market" : priceIndex < 95 ? "Value / Undercutting" : "Competitive Parity",
        stance_description: "Positioned relative to local 3-rival category cluster.",
        competitors: [
          {
            competitor_id: "Competitor 1",
            competitor_num: 1,
            price: Number((compAvg * 0.95).toFixed(2)),
            score: 4.1,
            freight: 11.5,
            price_difference: Number((compAvg * 0.95 - ourPrice).toFixed(2)),
            price_diff_pct: Number((((compAvg * 0.95 - ourPrice) / ourPrice) * 100).toFixed(1)),
            is_cheaper_than_us: compAvg * 0.95 < ourPrice,
            score_advantage: Number((p.product_score - 4.1).toFixed(1)),
          },
          {
            competitor_id: "Competitor 2",
            competitor_num: 2,
            price: compAvg,
            score: 4.3,
            freight: 14.0,
            price_difference: Number((compAvg - ourPrice).toFixed(2)),
            price_diff_pct: Number((((compAvg - ourPrice) / ourPrice) * 100).toFixed(1)),
            is_cheaper_than_us: compAvg < ourPrice,
            score_advantage: Number((p.product_score - 4.3).toFixed(1)),
          },
          {
            competitor_id: "Competitor 3",
            competitor_num: 3,
            price: Number((compAvg * 1.06).toFixed(2)),
            score: 4.2,
            freight: 15.5,
            price_difference: Number((compAvg * 1.06 - ourPrice).toFixed(2)),
            price_diff_pct: Number((((compAvg * 1.06 - ourPrice) / ourPrice) * 100).toFixed(1)),
            is_cheaper_than_us: compAvg * 1.06 < ourPrice,
            score_advantage: Number((p.product_score - 4.2).toFixed(1)),
          },
        ],
        opportunity: {
          type: "opportunity",
          tag: "Underpriced Premium",
          badge: "Margin Uplift Opportunity",
          headline: `Rating advantage (${p.product_score}★ vs 4.2★)`,
          action: "Increase price by 5% – 8%",
          explanation: "Premium perception allows capturing higher margin without demand degradation."
        },
        historical_trend: [
          { period: "Jan", our_price: ourPrice * 0.96, comp_1: compAvg * 0.93, comp_2: compAvg * 0.98, comp_3: compAvg * 1.02, comp_avg: compAvg * 0.97, demand: 110 },
          { period: "Feb", our_price: ourPrice * 0.97, comp_1: compAvg * 0.94, comp_2: compAvg * 0.99, comp_3: compAvg * 1.03, comp_avg: compAvg * 0.98, demand: 120 },
          { period: "Mar", our_price: ourPrice * 0.99, comp_1: compAvg * 0.95, comp_2: compAvg * 1.00, comp_3: compAvg * 1.04, comp_avg: compAvg * 0.99, demand: 130 },
          { period: "Apr", our_price: ourPrice, comp_1: compAvg * 0.96, comp_2: compAvg * 1.01, comp_3: compAvg * 1.05, comp_avg: compAvg, demand: 140 },
          { period: "May", our_price: ourPrice * 1.02, comp_1: compAvg * 0.97, comp_2: compAvg * 1.02, comp_3: compAvg * 1.06, comp_avg: compAvg * 1.01, demand: 145 },
          { period: "Jun", our_price: ourPrice, comp_1: compAvg * 0.95, comp_2: compAvg, comp_3: compAvg * 1.06, comp_avg: compAvg, demand: 148 },
        ],
        as_of: new Date().toISOString().split("T")[0],
      },
      isLive: false,
    };
  }
};
'''

# ==============================================================================
# 5. frontend/src/components/AuthModal.jsx
# ==============================================================================
FILES["frontend/src/components/AuthModal.jsx"] = '''import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { loginUser, registerUser } from "../services/api";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState("business_user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await registerUser(email, password, fullName, selectedRole);
        if (res.success && res.data?.user) {
          setSuccessMsg("Account registered successfully! Signing you in...");
          setTimeout(() => {
            onLoginSuccess(res.data.user);
            onClose();
          }, 600);
        } else {
          setError(res.error || "Failed to create account.");
        }
      } else {
        const res = await loginUser(email, password);
        if (res.success && res.data?.user) {
          setSuccessMsg("Sign in successful!");
          setTimeout(() => {
            onLoginSuccess(res.data.user);
            onClose();
          }, 400);
        } else {
          setError(res.error || "Invalid email or password.");
        }
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    setEmail(demoEmail);
    setPassword(demoPassword);

    try {
      const res = await loginUser(demoEmail, demoPassword);
      if (res.success && res.data?.user) {
        setSuccessMsg(`Welcome, ${res.data.user.full_name || res.data.user.email}!`);
        setTimeout(() => {
          onLoginSuccess(res.data.user);
          onClose();
        }, 400);
      } else {
        setError(res.error || "Demo authentication failed.");
      }
    } catch (err) {
      setError(err.message || "Demo sign in error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 items-center justify-center shadow-lg shadow-indigo-500/25 mb-1">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isRegister ? "Create PricePilot Account" : "Sign In to PricePilot AI"}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {isRegister
              ? "Join your team to leverage dynamic pricing, elasticity models, and competitor intelligence."
              : "Enter your credentials or choose a 1-click verified demo profile below."}
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isRegister
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isRegister
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Assign System Role (RBAC)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("pricing_manager")}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedRole === "pricing_manager"
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Pricing Manager</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    Full control: approve prices, override ML elasticity.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("business_user")}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedRole === "business_user"
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Business Analyst</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    Read-only BI, market telemetry & opportunity views.
                  </span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{loading ? "Processing..." : isRegister ? "Create Account & Sign In" : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {!isRegister && (
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block text-center">
              Or Instant 1-Click Demo Profiles
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("manager@pricepilot.ai", "Password123!")}
                disabled={loading}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition-all text-left flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Pricing Manager</div>
                  <div className="text-[10px] text-slate-400">Sarah Jenkins · Full Access</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin("analyst@pricepilot.ai", "Password123!")}
                disabled={loading}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 transition-all text-left flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Business Analyst</div>
                  <div className="text-[10px] text-slate-400">Alex Rivera · Read-Only</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'''

# ==============================================================================
# 6. frontend/src/components/Navbar.jsx
# ==============================================================================
FILES["frontend/src/components/Navbar.jsx"] = '''import React from "react";
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  Search,
  Database,
  LogIn,
  LogOut,
  User,
  ShieldAlert,
} from "lucide-react";

export default function Navbar({
  currentUser,
  onOpenAuthModal,
  onLogout,
  isLiveBackend,
  searchQuery,
  setSearchQuery,
  activePage,
  setActivePage,
}) {
  const isPricingManager = currentUser?.role === "pricing_manager";

  const getInitials = () => {
    if (!currentUser) return "?";
    if (currentUser.full_name) {
      const parts = currentUser.full_name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return currentUser.full_name.slice(0, 2).toUpperCase();
    }
    return currentUser.email ? currentUser.email.slice(0, 2).toUpperCase() : "U";
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between gap-3">
      <div
        onClick={() => setActivePage("home")}
        className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
      >
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
              PricePilot<span className="text-indigo-400">.AI</span>
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Enterprise
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden sm:block">
            Dynamic Pricing & Market Intelligence
          </p>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActivePage("home")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activePage === "home"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setActivePage("prediction")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activePage === "prediction"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Predictor</span>
        </button>
        <button
          onClick={() => setActivePage("dashboard")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activePage === "dashboard"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Dashboard
        </button>
      </nav>

      <div className="hidden lg:flex items-center relative max-w-xs w-full">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
        <input
          type="text"
          placeholder="Search product or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isLiveBackend
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
          }`}
        >
          <Database className="w-3 h-3" />
          <span className="text-[11px]">
            {isLiveBackend ? "Postgres Live" : "Fallback Data"}
          </span>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-2.5 bg-slate-950/80 p-1.5 pl-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                  isPricingManager
                    ? "bg-indigo-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
                title={currentUser.email}
              >
                {getInitials()}
              </div>

              <div className="hidden sm:block text-left pr-1">
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                  {currentUser.full_name || currentUser.email}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {isPricingManager ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-400">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Pricing Manager</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                      <UserCheck className="w-2.5 h-2.5" />
                      <span>Business Analyst</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Not Signed In
            </span>
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
'''

# ==============================================================================
# 7. frontend/src/components/DemandForecastingView.jsx
# ==============================================================================
FILES["frontend/src/components/DemandForecastingView.jsx"] = '''import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  BarChart2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
  Sliders,
  ShieldCheck,
  RefreshCw,
  Target,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchDemandForecast } from "../services/api";

export default function DemandForecastingView({ products = [], initialProductId }) {
  const [selectedProductId, setSelectedProductId] = useState(
    initialProductId || products[0]?.product_id || "bed1"
  );
  const [activeHorizon, setActiveHorizon] = useState("30_days");
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customPrice, setCustomPrice] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const loadForecast = async (productId, price = null) => {
    setLoading(true);
    const res = await fetchDemandForecast(productId, price);
    if (res.data) {
      setForecast(res.data);
      setIsLive(res.isLive);
      if (price === null) {
        setCustomPrice(res.data.current_price);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedProductId) {
      loadForecast(selectedProductId, null);
    }
  }, [selectedProductId]);

  const handlePriceChange = (newP) => {
    setCustomPrice(Number(newP));
    loadForecast(selectedProductId, Number(newP));
  };

  const horizonLabels = {
    "7_days": "7 Days (Flash)",
    "14_days": "14 Days (Sprint)",
    "30_days": "30 Days (1 Month)",
    "3_months": "3 Months (Quarterly)",
    "6_months": "6 Months (Mid-Year)",
    "12_months": "12 Months (Annual)",
  };

  const currentHorizonData = forecast?.horizons?.[activeHorizon] || { qty: 0, revenue: 0 };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Demand Intelligence · Multi-Horizon Models</span>
            {isLive && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                Live Model
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Multi-Horizon Demand Forecasting & Elasticity
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Forecast future sales volume across 6 distinct time horizons with statistical 95% confidence bounds, price elasticity curves, and revenue optimization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500"
          >
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_id} ({p.category?.replace(/_/g, " ")})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-900/40 border border-slate-800 rounded-3xl">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <span className="text-xs">Computing multi-horizon demand inference...</span>
        </div>
      ) : forecast ? (
        <>
          <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            {Object.keys(horizonLabels).map((hKey) => (
              <button
                key={hKey}
                onClick={() => setActiveHorizon(hKey)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeHorizon === hKey
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {horizonLabels[hKey]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Target Projection ({horizonLabels[activeHorizon]})
              </span>
              <div className="text-2xl font-black text-white font-mono mt-2 flex items-center gap-2">
                <span>{currentHorizonData.qty}</span>
                <span className="text-xs font-normal text-slate-400">units</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Projected Revenue: ${currentHorizonData.revenue?.toLocaleString()}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                95% Confidence Interval (30d)
              </span>
              <div className="text-xl font-bold text-cyan-400 font-mono mt-2">
                [{forecast.confidence_interval?.lower} — {forecast.confidence_interval?.upper}]
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Model confidence: {forecast.confidence_pct}% ({forecast.model_champion})
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Price Elasticity (E_d)
              </span>
              <div className="text-xl font-bold text-amber-400 font-mono mt-2 flex items-center gap-2">
                <span>{forecast.elasticity?.coefficient}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  {forecast.elasticity?.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {forecast.elasticity?.description}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Optimal Revenue Price
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
                ${forecast.elasticity?.optimal_revenue_price?.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Potential Revenue Uplift: +{forecast.elasticity?.potential_revenue_gain_pct}%
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  <span>Actuals vs Forecasted Trajectory with 95% Confidence Band</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historical monthly unit sales followed by AI multi-horizon forecasts with shaded uncertainty bounds.
                </p>
              </div>
            </div>

            <div className="h-72 w-full bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={forecast.chart_series || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                            <span className="font-bold text-white block">{label}</span>
                            {payload.map((entry, idx) => (
                              <div key={idx} style={{ color: entry.color }} className="flex justify-between gap-3">
                                <span>{entry.name}:</span>
                                <span className="font-mono font-bold">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="actual_demand"
                    name="Actual Demand"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast_demand"
                    name="AI Forecast"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorForecast)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Price Elasticity & Revenue Simulation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjust target price to test demand sensitivity and identify the maximum revenue curve.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Simulated Price</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  ${customPrice ? Number(customPrice).toFixed(2) : forecast.current_price?.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min={Number(forecast.current_price * 0.7).toFixed(2)}
                max={Number(forecast.current_price * 1.3).toFixed(2)}
                step="0.5"
                value={customPrice || forecast.current_price}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-30% (${(forecast.current_price * 0.7).toFixed(2)})</span>
                <span className="text-slate-300 font-semibold">Baseline: ${forecast.current_price?.toFixed(2)}</span>
                <span>+30% (${(forecast.current_price * 1.3).toFixed(2)})</span>
              </div>
            </div>

            <div className="h-60 w-full bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={forecast.revenue_simulation_curve || []}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="price" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val}`} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                            <span className="font-bold text-white block">Price: ${label}</span>
                            <div className="text-cyan-400 flex justify-between gap-3">
                              <span>Estimated Demand:</span>
                              <span className="font-mono font-bold">{payload[0]?.payload?.demand} units</span>
                            </div>
                            <div className="text-emerald-400 flex justify-between gap-3">
                              <span>Expected Revenue:</span>
                              <span className="font-mono font-bold">${payload[0]?.value}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expected_revenue"
                    name="Expected Revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
'''

# ==============================================================================
# 8. frontend/src/components/CompetitorIntelligenceView.jsx
# ==============================================================================
FILES["frontend/src/components/CompetitorIntelligenceView.jsx"] = '''import React, { useState, useEffect } from "react";
import {
  Users2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Target,
  Search,
  Filter,
  RefreshCw,
  X,
  CheckCircle2,
  DollarSign,
  Truck,
  Star,
  Activity,
  Layers,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchCompetitorInsights, fetchCompetitorDetail } from "../services/api";

export default function CompetitorIntelligenceView({
  products = [],
  onSelectProduct,
}) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStance, setFilterStance] = useState("all");
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    const res = await fetchCompetitorInsights();
    if (res.data) {
      setInsights(res.data);
      setIsLive(res.isLive);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleOpenDetail = async (productId) => {
    setActiveModalProduct(productId);
    setModalLoading(true);
    const res = await fetchCompetitorDetail(productId);
    if (res.data) {
      setModalDetail(res.data);
    }
    setModalLoading(false);
  };

  const handleCloseDetail = () => {
    setActiveModalProduct(null);
    setModalDetail(null);
  };

  const filteredInsights = insights.filter((item) => {
    const matchesSearch =
      item.product_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStance === "all") return true;
    if (filterStance === "opportunity") return item.opportunity?.type === "opportunity";
    if (filterStance === "risk") return item.opportunity?.type === "risk" || item.opportunity?.type === "warning";
    if (filterStance === "premium") return item.market_stance === "Premium to Market";
    if (filterStance === "value") return item.market_stance === "Value / Undercutting";
    return true;
  });

  const opportunityCount = insights.filter((i) => i.opportunity?.type === "opportunity").length;
  const riskCount = insights.filter((i) => i.opportunity?.type === "risk" || i.opportunity?.type === "warning").length;
  const avgPriceIndex = insights.length
    ? Math.round(insights.reduce((acc, i) => acc + (i.price_index || 100), 0) / insights.length)
    : 100;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-900/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Market Intelligence · 3-Competitor Telemetry Feeds</span>
            {isLive && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                Live Postgres Feeds
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Competitor Benchmarking & Positioning
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time tracking of prices, review ratings, and freight fees across competitors (Comp 1, 2, 3) to uncover underpriced premium opportunities and mitigate defection risks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadInsights}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors flex items-center gap-2 text-xs cursor-pointer"
            title="Refresh competitor signals"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Feeds</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Average Price Index
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-2 flex items-center gap-2">
            <span>{avgPriceIndex}%</span>
            <span className="text-xs font-normal text-slate-400">
              {avgPriceIndex > 102 ? "(Market Premium)" : avgPriceIndex < 98 ? "(Market Value)" : "(Parity)"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Baseline 100% = Exact Competitor Cluster Parity
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Margin Uplift Opportunities
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>{opportunityCount} Products</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Higher ratings with room to capture margin
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Defection & Churn Risks
          </span>
          <div className="text-2xl font-extrabold text-rose-400 font-mono mt-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>{riskCount} Products</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Priced above market without rating justification
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Competitors Tracked
          </span>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-2">
            {insights.length * 3} Streams
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            3 distinct competitor signals per product
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product ID or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All Products" },
            { id: "opportunity", label: "Opportunities" },
            { id: "risk", label: "At Risk" },
            { id: "premium", label: "Premium" },
            { id: "value", label: "Value / Discount" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStance(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filterStance === tab.id
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInsights.map((item) => {
          const ourPrice = item.our_price;
          const compAvg = item.comp_avg_price;
          const opp = item.opportunity;
          const priceIndex = item.price_index;
          const isHigherThanComp = priceIndex > 100;

          return (
            <div
              key={item.product_id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                      {item.product_id}
                    </span>
                    <span className="block text-xs text-slate-500 capitalize">
                      {item.category?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                      item.market_stance === "Premium to Market"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : item.market_stance === "Value / Undercutting"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                    }`}
                  >
                    {item.market_stance}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Our Price
                    </span>
                    <span className="text-base font-bold text-white font-mono">
                      ${ourPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5 mt-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      {item.our_score}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Competitor Avg
                    </span>
                    <span className="text-base font-bold text-amber-400 font-mono">
                      ${compAvg.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5 mt-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      {item.comp_avg_score}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Price Index
                    </span>
                    <span className="text-base font-bold text-cyan-400 font-mono">
                      {priceIndex}%
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {isHigherThanComp ? `+${(priceIndex - 100).toFixed(1)}%` : `${(priceIndex - 100).toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                {opp && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs mb-3 space-y-1 ${
                      opp.type === "opportunity"
                        ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                        : opp.type === "risk" || opp.type === "warning"
                        ? "bg-rose-950/30 border-rose-500/30 text-rose-300"
                        : "bg-slate-950/60 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      {opp.type === "opportunity" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : opp.type === "risk" || opp.type === "warning" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span>{opp.tag}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {opp.headline}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                  {item.competitors && Object.entries(item.competitors).map(([cKey, cVal], idx) => (
                    <div key={cKey} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span>Comp {idx + 1}:</span>
                        <span className="text-[10px] text-slate-500">({cVal.score}★)</span>
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-white">${cVal.price?.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                          <Truck className="w-2.5 h-2.5" />
                          ${cVal.freight?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => handleOpenDetail(item.product_id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deep Trend</span>
                </button>
                <button
                  onClick={() => onSelectProduct(item.product_id)}
                  className="flex items-center justify-center gap-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  title="Tune price in prediction engine"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Predict</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={handleCloseDetail}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {modalLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                <span className="text-xs">Loading deep competitor telemetry...</span>
              </div>
            ) : modalDetail ? (
              <>
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                    <Target className="w-4 h-4" />
                    <span>Competitor Intelligence Deep Dive</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-3">
                    <span className="font-mono">{modalDetail.product_id}</span>
                    <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize">
                      {modalDetail.category?.replace(/_/g, " ")}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tracking 3 rival e-commerce merchants against our pricing, customer ratings, and logistics costs.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Direct Rival Comparison Matrix
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 rounded-l-xl">Merchant</th>
                          <th className="py-2.5 px-3">Price</th>
                          <th className="py-2.5 px-3">Review Score</th>
                          <th className="py-2.5 px-3">Freight Cost</th>
                          <th className="py-2.5 px-3">Price Gap</th>
                          <th className="py-2.5 px-3 rounded-r-xl">Rating Adv.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        <tr className="bg-indigo-950/30 text-white font-bold">
                          <td className="py-2.5 px-3 text-indigo-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            <span>Our Store</span>
                          </td>
                          <td className="py-2.5 px-3">${modalDetail.our_price?.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-amber-400">{modalDetail.our_score}★</td>
                          <td className="py-2.5 px-3">${modalDetail.our_freight?.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-slate-400">Baseline</td>
                          <td className="py-2.5 px-3 text-slate-400">Baseline</td>
                        </tr>

                        {modalDetail.competitors?.map((c) => (
                          <tr key={c.competitor_num} className="hover:bg-slate-800/40 text-slate-300">
                            <td className="py-2.5 px-3 font-sans font-medium text-slate-300">
                              {c.competitor_id}
                            </td>
                            <td className="py-2.5 px-3 text-white font-bold">${c.price?.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-amber-400">{c.score}★</td>
                            <td className="py-2.5 px-3 text-slate-400">${c.freight?.toFixed(2)}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[11px] font-bold ${
                                  c.price_difference > 0 ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {c.price_difference > 0 ? `+$${c.price_difference}` : `-$${Math.abs(c.price_difference)}`}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[11px] ${
                                  c.score_advantage > 0 ? "text-emerald-400" : c.score_advantage < 0 ? "text-rose-400" : "text-slate-400"
                                }`}
                              >
                                {c.score_advantage > 0 ? `+${c.score_advantage}★` : `${c.score_advantage}★`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Multi-Month Price Evolution (Our Price vs Competitor Signals)</span>
                    <span className="text-[10px] font-normal text-slate-500 font-mono">
                      {modalDetail.historical_trend?.length || 0} periods recorded
                    </span>
                  </h4>
                  <div className="h-64 w-full bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={modalDetail.historical_trend || []}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                                  <span className="font-bold text-white block">{label}</span>
                                  {payload.map((entry, idx) => (
                                    <div key={idx} style={{ color: entry.color }} className="flex justify-between gap-3">
                                      <span>{entry.name}:</span>
                                      <span className="font-mono font-bold">${entry.value}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="our_price" name="Our Price" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="comp_1" name="Comp 1" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                        <Line type="monotone" dataKey="comp_2" name="Comp 2" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                        <Line type="monotone" dataKey="comp_3" name="Comp 3" stroke="#ec4899" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                        <Line type="monotone" dataKey="comp_avg" name="Comp Avg" stroke="#94a3b8" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {modalDetail.opportunity && (
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
                    <Target className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-amber-300 block">
                        Tactical Pricing Directive: {modalDetail.opportunity.action}
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {modalDetail.opportunity.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
'''

# ==============================================================================
# 9. frontend/src/App.jsx
# ==============================================================================
FILES["frontend/src/App.jsx"] = '''import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import StatCards from "./components/StatCards";
import ProductCatalog from "./components/ProductCatalog";
import PriceRecommendationModal from "./components/PriceRecommendationModal";
import DemandForecastingView from "./components/DemandForecastingView";
import CompetitorIntelligenceView from "./components/CompetitorIntelligenceView";
import SettingsView from "./components/SettingsView";
import HeroSection from "./components/HeroSection";
import PredictionPage from "./components/PredictionPage";
import CustomerQueryChatbot from "./components/CustomerQueryChatbot";
import AuthModal from "./components/AuthModal";
import {
  fetchProducts,
  fetchSummary,
  fetchHealth,
  fetchMe,
  logoutUser,
} from "./services/api";
import {
  Sparkles,
  Layers,
  TrendingUp,
  Users2,
  ShieldCheck,
  UserCheck,
  Lock,
  Activity,
  ArrowRight,
  LogIn,
  KeyRound,
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("pricepilot_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [forecastProductId, setForecastProductId] = useState(null);

  useEffect(() => {
    async function checkAuthAndLoad() {
      setLoading(true);

      try {
        const authRes = await fetchMe();
        if (authRes.user) {
          setCurrentUser(authRes.user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }

      const healthRes = await fetchHealth();
      setIsLiveBackend(healthRes.isLive);

      const productsRes = await fetchProducts();
      setProducts(productsRes.data);

      const summaryRes = await fetchSummary();
      setSummary(summaryRes.data);

      setLoading(false);
    }
    checkAuthAndLoad();
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setActivePage("home");
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleNavigateProtected = (targetPage) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setActivePage(targetPage);
  };

  const handleOpenForecast = (productId) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setForecastProductId(productId);
    setActivePage("dashboard");
    setActiveTab("forecasting");
  };

  const handleOpenPredictor = (productId) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedProductId(productId);
    setActivePage("prediction");
  };

  const userRole = currentUser?.role || "guest";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isLiveBackend={isLiveBackend}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activePage={activePage}
        setActivePage={(page) => {
          if ((page === "prediction" || page === "dashboard") && !currentUser) {
            setIsAuthModalOpen(true);
            return;
          }
          setActivePage(page);
        }}
      />

      {activePage === "home" && (
        <div className="flex-1 flex flex-col">
          {!currentUser && (
            <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-900/60 border-b border-indigo-800/40 px-4 py-2.5 text-center text-xs flex items-center justify-center gap-3">
              <span className="text-indigo-300 flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Enterprise Authentication Required: Sign in to unlock ML forecasting, competitor feeds, and price approval.</span>
              </span>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-sm shadow-indigo-600/30"
              >
                Sign In / Demo
              </button>
            </div>
          )}

          <HeroSection
            onNavigatePrediction={() => handleNavigateProtected("prediction")}
            onNavigateDashboard={() => handleNavigateProtected("dashboard")}
          />
        </div>
      )}

      {activePage === "prediction" && (
        <div className="flex-1 overflow-y-auto bg-slate-950">
          {!currentUser ? (
            <div className="min-h-[80vh] flex items-center justify-center p-6">
              <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-5 shadow-2xl backdrop-blur-md">
                <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Authentication Required
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    AI Price Prediction requires an authorized session. Sign in as a <strong>Pricing Manager</strong> to approve price changes or as a <strong>Business Analyst</strong> to review elasticity models.
                  </p>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Demo Account</span>
                </button>
              </div>
            </div>
          ) : (
            <PredictionPage
              products={products}
              role={userRole}
              onNavigateDashboard={() => setActivePage("dashboard")}
            />
          )}
        </div>
      )}

      {activePage === "dashboard" && (
        <div className="flex-1 flex overflow-hidden">
          {!currentUser ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-5 shadow-2xl backdrop-blur-md">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Executive Console Restricted
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Access to catalog telemetry, competitor tracking matrices, and multi-horizon demand forecasting is protected by Enterprise RBAC.
                  </p>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Select Demo Profile</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                role={userRole}
                counts={{ products: products.length }}
              />

              <main className="flex-1 p-6 sm:p-8 overflow-y-auto bg-slate-950">
                <div className="max-w-7xl mx-auto space-y-6">
                  <div className="p-3.5 px-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {userRole === "pricing_manager" ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-indigo-400" />
                          <span className="text-slate-300">
                            Logged in as <strong className="text-white">{currentUser.full_name || currentUser.email}</strong> (Pricing Manager): <span className="text-indigo-400 font-semibold">Full Price Strategy & Approval Authority</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-slate-300">
                            Logged in as <strong className="text-white">{currentUser.full_name || currentUser.email}</strong> (Business Analyst): <span className="text-emerald-400 font-semibold">Read-Only BI & Market Intelligence View</span>
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                      Session Active
                    </span>
                  </div>

                  {activeTab === "dashboard" && (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                            <span>Executive Pricing Intelligence</span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              Live Dashboard
                            </span>
                          </h1>
                          <p className="text-xs text-slate-400 mt-1">
                            Continuous dynamic price optimization, competitor benchmarking, and elasticity scoring.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActivePage("prediction")}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Open Prediction Engine</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <StatCards
                        summary={summary}
                        productsCount={products.length}
                      />

                      <ProductCatalog
                        products={products}
                        onSelectProduct={handleOpenPredictor}
                        onOpenForecast={handleOpenForecast}
                        role={userRole}
                        searchQuery={searchQuery}
                      />
                    </>
                  )}

                  {activeTab === "products" && (
                    <div>
                      <ProductCatalog
                        products={products}
                        onSelectProduct={handleOpenPredictor}
                        onOpenForecast={handleOpenForecast}
                        role={userRole}
                        searchQuery={searchQuery}
                      />
                    </div>
                  )}

                  {activeTab === "recommendations" && (
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 backdrop-blur-md">
                        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-400" />
                          AI Pricing Recommendation Engine
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          Select any product below to review AI-recommended target pricing, competitor benchmarks, and elasticity simulations.
                        </p>
                      </div>

                      <ProductCatalog
                        products={products}
                        onSelectProduct={handleOpenPredictor}
                        onOpenForecast={handleOpenForecast}
                        role={userRole}
                        searchQuery={searchQuery}
                      />
                    </div>
                  )}

                  {activeTab === "competitors" && (
                    <CompetitorIntelligenceView
                      products={products}
                      onSelectProduct={handleOpenPredictor}
                    />
                  )}

                  {activeTab === "forecasting" && (
                    <DemandForecastingView
                      products={products}
                      initialProductId={forecastProductId}
                    />
                  )}

                  {activeTab === "settings" && (
                    <SettingsView isLiveBackend={isLiveBackend} />
                  )}
                </div>
              </main>
            </>
          )}
        </div>
      )}

      {selectedProductId && activePage === "dashboard" && (
        <PriceRecommendationModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          role={userRole}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <CustomerQueryChatbot />
    </div>
  );
}
'''

def main():
    print("[PopulateFiles] Writing all files directly to disk...")
    for rel_path, content in FILES.items():
        abs_path = os.path.join(BASE_DIR, rel_path)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\n")
        size = os.path.getsize(abs_path)
        print(f"  ✓ Written: {rel_path} ({size:,} bytes)")
    print("[PopulateFiles] All files written successfully!")

if __name__ == "__main__":
    main()
