
import math
from datetime import date
import joblib
import numpy as np
import pandas as pd
import streamlit as st

st.set_page_config(
    page_title="PricePilot | Model Tester",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

MODEL_PATH = "pricepilot_xgboost_model.pkl"

@st.cache_resource
def load_artifact():
    artifact = joblib.load(MODEL_PATH)
    return artifact

def cyclical(value, period):
    return math.sin(2 * math.pi * value / period), math.cos(2 * math.pi * value / period)

def build_row(store_id, product_id, category, region, inventory, units_ordered,
              price, discount, weather, promotion, competitor_pricing,
              seasonality, epidemic, selected_date):
    year = selected_date.year
    month = selected_date.month
    day = selected_date.day
    day_of_week = selected_date.weekday()
    quarter = (month - 1) // 3 + 1
    week_of_year = int(selected_date.isocalendar().week)

    month_sin, month_cos = cyclical(month, 12)
    dow_sin, dow_cos = cyclical(day_of_week, 7)

    price_difference = price - competitor_pricing
    relative_price_difference = (
        price_difference / competitor_pricing
        if competitor_pricing != 0 else 0.0
    )

    if competitor_pricing == 0:
        price_position = "Unknown"
    elif price < competitor_pricing:
        price_position = "Lower"
    elif price > competitor_pricing:
        price_position = "Higher"
    else:
        price_position = "Equal"

    return pd.DataFrame([{
        "Store ID": store_id,
        "Product ID": product_id,
        "Category": category,
        "Region": region,
        "Inventory Level": inventory,
        "Units Ordered": units_ordered,
        "Price": price,
        "Discount": discount,
        "Weather Condition": weather,
        "Promotion": promotion,
        "Competitor Pricing": competitor_pricing,
        "Seasonality": seasonality,
        "Epidemic": epidemic,
        "Year": year,
        "Month": month,
        "Day": day,
        "Price Difference": price_difference,
        "Relative Price Difference": relative_price_difference,
        "Price Position": price_position,
        "Day of Week": day_of_week,
        "Quarter": quarter,
        "Week of Year": week_of_year,
        "Month Sin": month_sin,
        "Month Cos": month_cos,
        "DayOfWeek Sin": dow_sin,
        "DayOfWeek Cos": dow_cos,
    }])

st.markdown("""
<style>
.block-container {padding-top: 2rem; padding-bottom: 3rem; max-width: 1450px;}
.hero {
    padding: 28px 30px;
    border-radius: 22px;
    background: linear-gradient(135deg, #111827 0%, #1f2937 55%, #334155 100%);
    color: white;
    margin-bottom: 22px;
}
.hero h1 {font-size: 2.25rem; margin: 0 0 8px 0;}
.hero p {margin: 0; color: #cbd5e1; font-size: 1rem;}
.card {
    border: 1px solid rgba(148,163,184,.25);
    border-radius: 18px;
    padding: 18px;
    background: rgba(248,250,252,.72);
}
.result {
    padding: 25px;
    border-radius: 20px;
    background: linear-gradient(135deg, #ecfeff, #eff6ff);
    border: 1px solid #bae6fd;
    text-align: center;
}
.result .label {font-size: .9rem; color: #475569;}
.result .value {font-size: 3rem; font-weight: 800; color: #0f172a;}
.small {color:#64748b; font-size:.86rem;}
.warning-box {
    padding: 14px 16px;
    border-radius: 14px;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #9a3412;
}
</style>
""", unsafe_allow_html=True)

try:
    artifact = load_artifact()
except Exception as e:
    st.error("Could not load the model artifact.")
    st.code(str(e))
    st.stop()

model = artifact["model"]
preprocessor = artifact["preprocessor"]
features = artifact["features"]

st.markdown("""
<div class="hero">
    <h1>PricePilot AI — XGBoost Model Tester</h1>
    <p>Interactive interface for testing the saved pricing / prediction model with realistic business inputs.</p>
</div>
""", unsafe_allow_html=True)

with st.sidebar:
    st.header("Model")
    st.success("Model loaded")
    st.write(f"**Name:** {artifact.get('model_name', 'XGBoost')}")
    st.write(f"**Version:** {artifact.get('version', 'N/A')}")
    st.write(f"**Features:** {len(features)}")
    st.write(f"**Trees:** {model.get_params().get('n_estimators', 'N/A')}")
    st.write(f"**Depth:** {model.get_params().get('max_depth', 'N/A')}")
    st.write(f"**Learning rate:** {model.get_params().get('learning_rate', 'N/A')}")
    st.divider()
    st.caption("The saved preprocessing pipeline is used before inference, so the UI tests the actual artifact rather than bypassing its preprocessing.")

st.subheader("1. Product & market context")

c1, c2, c3, c4 = st.columns(4)
with c1:
    store_id = st.text_input("Store ID", "S001")
with c2:
    product_id = st.text_input("Product ID", "P001")
with c3:
    category = st.text_input("Category", "Groceries")
with c4:
    region = st.text_input("Region", "North")

c1, c2, c3, c4 = st.columns(4)
with c1:
    inventory = st.number_input("Inventory Level", min_value=0.0, value=100.0, step=1.0)
with c2:
    units_ordered = st.number_input("Units Ordered", min_value=0.0, value=25.0, step=1.0)
with c3:
    price = st.number_input("Price", min_value=0.0, value=100.0, step=0.5)
with c4:
    discount = st.number_input("Discount", min_value=0.0, value=10.0, step=0.5)

c1, c2, c3, c4 = st.columns(4)
with c1:
    weather = st.selectbox("Weather Condition", ["Sunny", "Cloudy", "Rainy", "Snowy", "Stormy"])
with c2:
    promotion = st.number_input("Promotion", min_value=0.0, value=0.0, step=1.0)
with c3:
    competitor_pricing = st.number_input("Competitor Pricing", min_value=0.0, value=95.0, step=0.5)
with c4:
    seasonality = st.selectbox("Seasonality", ["Spring", "Summer", "Autumn", "Winter"])

c1, c2, c3 = st.columns(3)
with c1:
    epidemic = st.number_input("Epidemic", min_value=0.0, value=0.0, step=1.0)
with c2:
    selected_date = st.date_input("Date", value=date.today())
with c3:
    st.markdown("**Auto-derived features**")
    st.caption("Price difference, relative price difference, price position, calendar features and cyclical date features are calculated automatically.")

row = build_row(
    store_id, product_id, category, region, inventory, units_ordered,
    price, discount, weather, promotion, competitor_pricing,
    seasonality, epidemic, selected_date
)

with st.expander("View the exact 26 features sent to the model"):
    st.dataframe(row[features], use_container_width=True, hide_index=True)

st.subheader("2. Run prediction")

if "prediction" not in st.session_state:
    st.session_state.prediction = None

if st.button("Run XGBoost Prediction", type="primary", use_container_width=True):
    try:
        transformed = preprocessor.transform(row[features])
        prediction = float(np.asarray(model.predict(transformed)).reshape(-1)[0])
        st.session_state.prediction = prediction
    except Exception as e:
        st.error("Prediction failed.")
        st.exception(e)

if st.session_state.prediction is not None:
    prediction = st.session_state.prediction
    st.markdown(f"""
    <div class="result">
        <div class="label">MODEL PREDICTION</div>
        <div class="value">{prediction:,.2f}</div>
        <div class="small">Raw output returned by the saved XGBoost regressor</div>
    </div>
    """, unsafe_allow_html=True)

    st.write("")
    a, b, c = st.columns(3)
    with a:
        st.metric("Price", f"{price:,.2f}")
    with b:
        st.metric("Competitor Price", f"{competitor_pricing:,.2f}")
    with c:
        diff = price - competitor_pricing
        st.metric("Price Difference", f"{diff:,.2f}")

st.divider()

st.subheader("3. Model diagnostics")

st.markdown("""
<div class="warning-box">
<b>Important:</b> The saved artifact contains <b>Units Ordered</b> as one of its 26 input features.
If <i>Units Ordered</i> is actually the target you intended to predict, this is target leakage and the training pipeline should be corrected before using this model in production.
</div>
""", unsafe_allow_html=True)

with st.expander("Model configuration"):
    params = model.get_params()
    selected = {
        "objective": params.get("objective"),
        "n_estimators": params.get("n_estimators"),
        "max_depth": params.get("max_depth"),
        "learning_rate": params.get("learning_rate"),
        "subsample": params.get("subsample"),
        "colsample_bytree": params.get("colsample_bytree"),
        "random_state": params.get("random_state"),
        "tree_method": params.get("tree_method"),
    }
    st.json(selected)

st.caption("PricePilot Model Testing UI • Uses the uploaded pricepilot_xgboost_model.pkl")
