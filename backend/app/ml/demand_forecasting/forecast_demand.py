"""
Demand forecasting for a single product over a requested horizon.

Models compared on a chronological hold-out split (never shuffled):
  - moving_average: naive baseline (last-30-day mean, flat projection)
  - xgboost: recursive multi-step forecaster using lag/rolling features
  - prophet: additive seasonal model (used only if the `prophet` package
    is installed; skipped gracefully otherwise)

The model with the lowest validation MAE is used for the actual forecast.
The confidence score is NOT random -- see `_confidence_score()` below for
the documented formula.
"""
from __future__ import annotations

import os
from datetime import timedelta

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor

from app.core.config import settings

PROCESSED_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", settings.DATA_PROCESSED_DIR))

try:
    from prophet import Prophet  # type: ignore
    _PROPHET_AVAILABLE = True
except Exception:  # noqa: BLE001
    _PROPHET_AVAILABLE = False


def _load_product_series(product_id: str) -> pd.DataFrame:
    path = os.path.join(PROCESSED_DIR, "feature_table.csv")
    df = pd.read_csv(path, parse_dates=["date"])
    prod = df[df["product_id"] == product_id].sort_values("date").reset_index(drop=True)
    if prod.empty:
        raise ValueError(f"No historical data for product_id={product_id}")
    return prod[["date", "units_sold", "final_price", "competitor_avg_price",
                 "market_demand_index", "stock_available", "is_weekend", "is_holiday",
                 "is_promotional_event"]].copy()


def _make_lag_features(series: pd.Series) -> pd.DataFrame:
    df = pd.DataFrame({"y": series.values})
    for lag in (1, 7, 14):
        df[f"lag_{lag}"] = df["y"].shift(lag)
    df["rolling_mean_7"] = df["y"].shift(1).rolling(7, min_periods=1).mean()
    df["rolling_mean_14"] = df["y"].shift(1).rolling(14, min_periods=1).mean()
    df["dow"] = pd.Series(range(len(df))) % 7
    return df


def _moving_average_baseline(history: pd.Series, horizon: int) -> np.ndarray:
    window = history.tail(30).mean() if len(history) else 0.0
    return np.full(horizon, max(window, 0.0))


def _xgboost_forecast(history_df: pd.DataFrame, horizon: int):
    """Recursive multi-step forecast. Returns (predictions, val_mae, val_rmse)."""
    y = history_df["units_sold"].reset_index(drop=True)
    feat = _make_lag_features(y).dropna().reset_index(drop=True)
    if len(feat) < 20:
        preds = _moving_average_baseline(y, horizon)
        return preds, None, None

    n = len(feat)
    split = int(n * 0.85)
    train, val = feat.iloc[:split], feat.iloc[split:]
    feature_cols = [c for c in feat.columns if c != "y"]

    model = XGBRegressor(n_estimators=200, max_depth=5, learning_rate=0.08, random_state=42, n_jobs=-1)
    model.fit(train[feature_cols], train["y"])

    val_mae = val_rmse = None
    if len(val) > 0:
        val_pred = model.predict(val[feature_cols])
        val_mae = float(mean_absolute_error(val["y"], val_pred))
        val_rmse = float(np.sqrt(mean_squared_error(val["y"], val_pred)))

    # refit on all data for the actual future forecast
    model_full = XGBRegressor(n_estimators=200, max_depth=5, learning_rate=0.08, random_state=42, n_jobs=-1)
    model_full.fit(feat[feature_cols], feat["y"])

    history_list = list(y.values)
    preds = []
    for step in range(horizon):
        lag_1 = history_list[-1]
        lag_7 = history_list[-7] if len(history_list) >= 7 else np.mean(history_list)
        lag_14 = history_list[-14] if len(history_list) >= 14 else np.mean(history_list)
        roll_7 = np.mean(history_list[-7:])
        roll_14 = np.mean(history_list[-14:])
        dow = (len(history_list)) % 7
        x = pd.DataFrame([{
            "lag_1": lag_1, "lag_7": lag_7, "lag_14": lag_14,
            "rolling_mean_7": roll_7, "rolling_mean_14": roll_14, "dow": dow,
        }])[feature_cols]
        pred = max(0.0, float(model_full.predict(x)[0]))
        preds.append(pred)
        history_list.append(pred)

    return np.array(preds), val_mae, val_rmse


def _prophet_forecast(dates: pd.Series, y: pd.Series, horizon: int):
    dfp = pd.DataFrame({"ds": dates, "y": y})
    split = int(len(dfp) * 0.85)
    train, val = dfp.iloc[:split], dfp.iloc[split:]
    if len(train) < 30:
        return None, None, None
    m = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=True)
    m.fit(train)

    val_mae = val_rmse = None
    if len(val) > 0:
        future_val = val[["ds"]]
        fc_val = m.predict(future_val)
        val_mae = float(mean_absolute_error(val["y"], fc_val["yhat"]))
        val_rmse = float(np.sqrt(mean_squared_error(val["y"], fc_val["yhat"])))

    m_full = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=True)
    m_full.fit(dfp)
    future = m_full.make_future_dataframe(periods=horizon)
    forecast = m_full.predict(future).tail(horizon)
    preds = forecast["yhat"].clip(lower=0).values
    lower = forecast["yhat_lower"].clip(lower=0).values
    upper = forecast["yhat_upper"].clip(lower=0).values
    return (preds, lower, upper), val_mae, val_rmse


def _confidence_score(val_mae: float | None, y_mean: float, history_len: int,
                       horizon: int, interval_width_ratio: float | None) -> tuple[float, str]:
    """
    Documented, deterministic confidence score (0-100), built from four signals:
      1. Validation error relative to the series mean (lower error -> higher score)
      2. Prediction interval width relative to the mean (narrower -> higher score)
      3. Amount of historical data available (more days -> higher score, capped)
      4. Forecast horizon length (longer horizon -> lower score)
    Each signal contributes 0-25 points; the total is the confidence score.
    """
    # 1. error component
    if val_mae is None or y_mean <= 0:
        error_component = 12.5  # unknown error -> neutral midpoint
    else:
        relative_error = min(val_mae / y_mean, 2.0)
        error_component = max(0.0, 25 * (1 - relative_error / 2.0))

    # 2. interval width component
    if interval_width_ratio is None:
        interval_component = 12.5
    else:
        interval_component = max(0.0, 25 * (1 - min(interval_width_ratio, 2.0) / 2.0))

    # 3. data availability component
    data_component = 25 * min(history_len / 365.0, 1.0)

    # 4. horizon penalty component
    horizon_component = 25 * max(0.0, 1 - (horizon / 365.0))

    score = round(error_component + interval_component + data_component + horizon_component, 1)
    score = float(np.clip(score, 0, 100))

    if score >= 75:
        label = "High Confidence"
    elif score >= 50:
        label = "Medium Confidence"
    else:
        label = "Low Confidence"
    return score, label


def _classify_trend(preds: np.ndarray, recent_history: np.ndarray) -> str:
    if len(preds) == 0:
        return "Stable Demand"
    forecast_mean = float(np.mean(preds))
    history_mean = float(np.mean(recent_history[-30:])) if len(recent_history) else forecast_mean
    if history_mean == 0:
        return "Stable Demand"
    change_pct = (forecast_mean - history_mean) / history_mean * 100
    if change_pct > 5:
        return "Increasing Demand"
    if change_pct < -5:
        return "Decreasing Demand"
    return "Stable Demand"


def forecast_product_demand(product_id: str, horizon_days: int = 30) -> dict:
    df = _load_product_series(product_id)
    y = df["units_sold"]
    dates = df["date"]

    candidates = {}

    baseline_preds = _moving_average_baseline(y, horizon_days)
    candidates["moving_average"] = {"preds": baseline_preds, "val_mae": None, "val_rmse": None, "lower": None, "upper": None}

    xgb_preds, xgb_mae, xgb_rmse = _xgboost_forecast(df, horizon_days)
    candidates["xgboost"] = {"preds": xgb_preds, "val_mae": xgb_mae, "val_rmse": xgb_rmse, "lower": None, "upper": None}

    if _PROPHET_AVAILABLE and len(df) >= 60:
        try:
            result, p_mae, p_rmse = _prophet_forecast(dates, y, horizon_days)
            if result is not None:
                p_preds, p_lower, p_upper = result
                candidates["prophet"] = {"preds": p_preds, "val_mae": p_mae, "val_rmse": p_rmse,
                                          "lower": p_lower, "upper": p_upper}
        except Exception:  # noqa: BLE001
            pass

    # pick model with lowest val_mae; if none has a val_mae, fall back to xgboost, else moving_average
    scored = {k: v["val_mae"] for k, v in candidates.items() if v["val_mae"] is not None}
    if scored:
        best_name = min(scored, key=scored.get)
    elif "xgboost" in candidates:
        best_name = "xgboost"
    else:
        best_name = "moving_average"

    best = candidates[best_name]
    preds = np.asarray(best["preds"])

    if best["lower"] is not None:
        lower, upper = best["lower"], best["upper"]
    else:
        # simple residual-based interval using validation MAE (or 20% of mean as fallback)
        spread = best["val_mae"] if best["val_mae"] else max(preds.mean() * 0.2, 1.0)
        lower = np.clip(preds - 1.28 * spread, 0, None)  # ~80% interval
        upper = preds + 1.28 * spread

    interval_width_ratio = float(np.mean(upper - lower) / preds.mean()) if preds.mean() > 0 else None
    conf_score, conf_label = _confidence_score(
        val_mae=best["val_mae"], y_mean=float(y.mean()), history_len=len(df),
        horizon=horizon_days, interval_width_ratio=interval_width_ratio,
    )
    trend = _classify_trend(preds, y.values)

    last_date = dates.max()
    forecast_rows = []
    for i in range(horizon_days):
        forecast_rows.append({
            "date": str((last_date + timedelta(days=i + 1)).date()),
            "predicted_demand": round(float(preds[i]), 2),
            "lower_bound": round(float(lower[i]), 2),
            "upper_bound": round(float(upper[i]), 2),
        })

    return {
        "product_id": product_id,
        "horizon_days": horizon_days,
        "model_used": best_name,
        "candidates_compared": list(candidates.keys()),
        "validation_metrics": {k: {"val_mae": v["val_mae"], "val_rmse": v["val_rmse"]} for k, v in candidates.items()},
        "trend": trend,
        "confidence_score": conf_score,
        "confidence_label": conf_label,
        "confidence_reason": (
            f"Based on validation MAE of the selected model ({best_name}), "
            f"the width of the {'model' if best['lower'] is not None else 'residual-based'} prediction interval, "
            f"{len(df)} days of available history, and a {horizon_days}-day forecast horizon."
        ),
        "mae": best["val_mae"],
        "rmse": best["val_rmse"],
        "forecast": forecast_rows,
        "historical_tail": [
            {"date": str(d.date()), "units_sold": float(u)}
            for d, u in zip(dates.tail(60), y.tail(60))
        ],
    }
