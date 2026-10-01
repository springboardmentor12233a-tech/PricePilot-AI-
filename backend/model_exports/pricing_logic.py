"""
PricePilot AI — validated pricing/forecasting logic, exported from Colab
(milestone2.ipynb) on 2026-09-30. These functions are deterministic (no
randomness, no tuning) and reproduce identical output to Colab given the
same input data. Do NOT let an AI coding tool rewrite or "improve" this
logic — load it as-is and call it from the FastAPI routers.

Requires: elasticity_model (loaded from elasticity_model.pkl),
df1_elec (loaded from dataset1_electronics_training_snapshot.csv),
df1_elec_trimmed (same snapshot, filtered to cutoff_date <= 2018-06-30 —
see note at bottom).
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score


def recommend_price_elasticity_based(current_price, competitor_price, baseline_qty,
                                      price_gap_coef, price_min=None, price_max=None,
                                      n_candidates=50):
    """
    Uses the validated elasticity coefficient from Dataset 1 to simulate how
    quantity sold responds to price changes relative to a competitor price,
    then recommends the price that maximizes predicted revenue.

    price_gap_coef: pull this from the loaded model at runtime, e.g.
        price_gap_coef = elasticity_model.params['price_gap_pct']
    Do not hardcode it — always read it from the model object so if the
    model is ever legitimately re-fit, this stays in sync automatically.
    """
    if price_min is None:
        price_min = current_price * 0.7
    if price_max is None:
        price_max = current_price * 1.3

    candidate_prices = np.linspace(price_min, price_max, n_candidates)
    results = []

    for p in candidate_prices:
        gap_pct = (p - competitor_price) / competitor_price
        predicted_qty = baseline_qty + (price_gap_coef * gap_pct)
        predicted_qty = max(predicted_qty, 0)
        predicted_revenue = p * predicted_qty
        results.append({'price': p, 'predicted_qty': predicted_qty, 'predicted_revenue': predicted_revenue})

    results_df = pd.DataFrame(results)
    best = results_df.loc[results_df['predicted_revenue'].idxmax()]

    return {
        'current_price': current_price,
        'recommended_price': best['price'],
        'predicted_qty_at_recommended': best['predicted_qty'],
        'predicted_revenue_at_recommended': best['predicted_revenue'],
        'all_candidates': results_df
    }


def forecast_price_trend(df1_elec, product_id, periods_ahead=3):
    """
    Fits a simple linear trend to a product's historical price and
    forecasts price for the next N periods (months) ahead. Deterministic —
    fits fresh every call, always produces the same result for the same data.
    """
    product_data = df1_elec[df1_elec['product_id'] == product_id].sort_values('month_year').copy()

    if len(product_data) < 4:
        return None

    product_data['time_idx'] = range(len(product_data))
    X = product_data[['time_idx']]
    y = product_data['unit_price']

    model = LinearRegression()
    model.fit(X, y)

    y_pred_hist = model.predict(X)
    r2 = r2_score(y, y_pred_hist)
    mae = mean_absolute_error(y, y_pred_hist)

    future_idx = pd.DataFrame(
        np.arange(len(product_data), len(product_data) + periods_ahead),
        columns=['time_idx']
    )
    future_prices = model.predict(future_idx)

    last_date = product_data['month_year'].max()
    future_dates = pd.date_range(start=last_date, periods=periods_ahead + 1, freq='MS')[1:]

    return {
        'product_id': product_id,
        'r_squared': r2,
        'mae': mae,
        'trend_slope': model.coef_[0],
        'historical': product_data[['month_year', 'unit_price']],
        'forecast_dates': future_dates,
        'forecast_prices': future_prices
    }


def classify_trend(recent_avg, baseline_avg, threshold=0.10):
    """
    Demand trend classification. Call with:
        classify_trend(trimmed_data['qty'].tail(3).mean(), trimmed_data['qty'].mean())
    where trimmed_data is df1_elec_trimmed filtered to cutoff_date <= 2018-06-30
    (the cutoff exists because the raw data has a collection-artifact drop-off
    after that date — see project history for why).
    """
    if baseline_avg == 0:
        return "Stable Demand"
    pct_change = (recent_avg - baseline_avg) / baseline_avg
    if pct_change > threshold:
        return "Increasing Demand"
    elif pct_change < -threshold:
        return "Decreasing Demand"
    else:
        return "Stable Demand"


def compute_confidence_score_ols(model, prediction_std_error, r_squared):
    """
    Confidence score grounded in the model's real R² combined with this
    specific prediction's relative standard error. Never fabricate this
    number — always compute it from the actual fitted model.

    r_squared: elasticity_model.rsquared (pull from the loaded model, not hardcoded)
    prediction_std_error: relative_std_err, computed per-product like this:
        pred_summary = elasticity_model.get_prediction(pd.DataFrame({
            'price_gap_pct': [current_gap], 'product_id': [product_id]
        })).summary_frame()
        predicted_qty = max(pred_summary['mean'].iloc[0], 1e-6)
        relative_std_err = pred_summary['mean_se'].iloc[0] / predicted_qty
    """
    r2_factor = max(0, min(1, r_squared))
    precision_factor = max(0, min(1, 1 - prediction_std_error))
    confidence = 100 * r2_factor * (0.5 + 0.5 * precision_factor)
    return round(confidence, 1)


# ---------------------------------------------------------------------------
# Example of the full per-product KPI assembly (from build_full_kpi_record_v2
# in the original notebook) — this is the reference for how the 4 functions
# above compose together. The FastAPI pricing/forecast routers should follow
# this exact sequence.
# ---------------------------------------------------------------------------
def build_full_kpi_record(elasticity_model, df1_elec, df1_elec_trimmed, product_id):
    product_data = df1_elec[df1_elec['product_id'] == product_id].sort_values('month_year')
    current_price = product_data['unit_price'].iloc[-1]
    competitor_price = product_data['comp_1'].iloc[-1]
    baseline_qty = product_data['qty'].mean()

    price_gap_coef = elasticity_model.params['price_gap_pct']
    model_r_squared = elasticity_model.rsquared

    price_rec = recommend_price_elasticity_based(
        current_price=current_price,
        competitor_price=competitor_price,
        baseline_qty=baseline_qty,
        price_gap_coef=price_gap_coef,
    )

    forecast_result = forecast_price_trend(df1_elec, product_id, periods_ahead=1)

    trimmed_data = df1_elec_trimmed[df1_elec_trimmed['product_id'] == product_id]
    trend = classify_trend(trimmed_data['qty'].tail(3).mean(), trimmed_data['qty'].mean())

    current_gap = (current_price - competitor_price) / competitor_price
    pred_summary = elasticity_model.get_prediction(pd.DataFrame({
        'price_gap_pct': [current_gap],
        'product_id': [product_id]
    })).summary_frame()
    predicted_qty = max(pred_summary['mean'].iloc[0], 1e-6)
    relative_std_err = pred_summary['mean_se'].iloc[0] / predicted_qty

    confidence = compute_confidence_score_ols(elasticity_model, relative_std_err, model_r_squared)

    return {
        "product_id": product_id,
        "current_price": round(float(current_price), 2),
        "recommended_price": round(float(price_rec['recommended_price']), 2),
        "price_gap_pct": round(float((price_rec['recommended_price'] - current_price) / current_price * 100), 1),
        "predicted_revenue": round(float(price_rec['predicted_revenue_at_recommended']), 2),
        "price_trend": "Rising" if forecast_result and forecast_result['trend_slope'] > 0 else "Falling",
        "price_trend_monthly_change": round(float(forecast_result['trend_slope']), 2) if forecast_result else None,
        "next_month_price_forecast": round(float(forecast_result['forecast_prices'][0]), 2) if forecast_result else None,
        "demand_trend": trend,
        "confidence_score": confidence,
    }
