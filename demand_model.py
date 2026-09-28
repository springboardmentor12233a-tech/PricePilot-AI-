"""
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
