from pathlib import Path
from datetime import date, datetime
import math

import joblib
import numpy as np
import pandas as pd
import streamlit as st


# ============================================================
# PAGE CONFIGURATION
# ============================================================

st.set_page_config(
    page_title="PricePilot AI | Demand Intelligence",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ============================================================
# APPLICATION CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = (
    BASE_DIR.parent
    / "ML_MODEL"
    / "model_training"
    / "saved_models"
    / "pricepilot_xgboost_model.pkl"
)

TARGET = "Demand"
TRAINING_START_DATE = date(2022, 1, 1)
TRAINING_END_DATE = date(2024, 1, 30)

EXPECTED_FEATURES = [
    "Store ID",
    "Product ID",
    "Category",
    "Region",
    "Inventory Level",
    "Price",
    "Discount",
    "Weather Condition",
    "Promotion",
    "Competitor Pricing",
    "Seasonality",
    "Epidemic",
    "Year",
    "Month",
    "Day",
    "Price Difference",
    "Relative Price Difference",
    "Price Position",
    "Day of Week",
    "Quarter",
    "Week of Year",
    "Month Sin",
    "Month Cos",
    "DayOfWeek Sin",
    "DayOfWeek Cos",
]

CATEGORICAL_FEATURES = [
    "Store ID",
    "Product ID",
    "Category",
    "Region",
    "Weather Condition",
    "Seasonality",
    "Price Position",
]

NUMERICAL_FEATURES = [
    "Inventory Level",
    "Price",
    "Discount",
    "Promotion",
    "Competitor Pricing",
    "Epidemic",
    "Year",
    "Month",
    "Day",
    "Price Difference",
    "Relative Price Difference",
    "Day of Week",
    "Quarter",
    "Week of Year",
    "Month Sin",
    "Month Cos",
    "DayOfWeek Sin",
    "DayOfWeek Cos",
]


# ============================================================
# PROFESSIONAL UI — WHITE + DARK GREEN DESIGN SYSTEM
# ============================================================

st.markdown(
    """
    <style>
        :root {
            --green-950: #052e16;
            --green-900: #064e3b;
            --green-800: #065f46;
            --green-700: #047857;
            --green-600: #059669;
            --green-50: #ecfdf5;
            --white: #ffffff;
            --border: #cbd5e1;
            --border-green: #a7f3d0;
            --text: #111827;
            --text-muted: #475569;
        }

        html, body, [class*="css"] {
            font-family: Inter, -apple-system, BlinkMacSystemFont,
                         "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .stApp, .main {
            background: #ffffff !important;
            color: #111827 !important;
        }

        .block-container {
            max-width: 1500px;
            padding-top: 1.35rem;
            padding-bottom: 4rem;
        }

        /* Force readable default text */
        p, span, label, li {
            color: #111827;
        }

        /* Sidebar */
        [data-testid="stSidebar"] {
            background: #f8fafc !important;
            border-right: 1px solid #cbd5e1 !important;
        }

        [data-testid="stSidebar"] * {
            color: #111827 !important;
        }

        [data-testid="stSidebar"] h1,
        [data-testid="stSidebar"] h2,
        [data-testid="stSidebar"] h3 {
            color: #064e3b !important;
            font-weight: 800 !important;
        }

        /* Hero */
        .hero {
            background: linear-gradient(135deg, #052e16 0%, #064e3b 52%, #047857 100%);
            color: #ffffff !important;
            border-radius: 20px;
            padding: 30px 36px;
            margin-bottom: 20px;
            border: 1px solid #064e3b;
            box-shadow: 0 14px 34px rgba(5,46,22,.16);
        }

        .hero * {
            color: #ffffff !important;
        }

        .hero-title {
            font-size: 2.4rem;
            font-weight: 850;
            letter-spacing: -.04em;
            margin: 0;
        }

        .hero-subtitle {
            margin: 8px 0 0;
            color: #dcfce7 !important;
            font-size: 1rem;
            font-weight: 500;
        }

        .hero-badge {
            display: inline-block;
            margin-top: 18px;
            padding: 7px 12px;
            border-radius: 999px;
            background: rgba(255,255,255,.12);
            border: 1px solid rgba(255,255,255,.25);
            color: #ffffff !important;
            font-size: .76rem;
            font-weight: 800;
        }

        /* Sections */
        .section-title {
            color: #064e3b !important;
            font-size: 1.2rem;
            font-weight: 850;
            margin: 26px 0 9px;
        }

        .section-caption {
            color: #475569 !important;
            font-size: .88rem;
            margin-top: -3px;
            margin-bottom: 13px;
        }

        /* Cards */
        .panel {
            background: #ffffff !important;
            color: #111827 !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 4px 14px rgba(15,23,42,.045);
        }

        .panel * {
            color: #111827 !important;
        }

        .mini-card {
            background: #ffffff !important;
            border: 1px solid #a7f3d0 !important;
            border-left: 4px solid #047857 !important;
            border-radius: 12px;
            padding: 14px 16px;
            min-height: 82px;
            box-shadow: 0 3px 12px rgba(5,46,22,.04);
        }

        .mini-label {
            color: #475569 !important;
            font-size: .73rem;
            text-transform: uppercase;
            letter-spacing: .06em;
            font-weight: 800;
        }

        .mini-value {
            color: #064e3b !important;
            font-size: 1.22rem;
            font-weight: 850;
            margin-top: 4px;
        }

        /* Inputs — explicit high contrast */
        [data-testid="stWidgetLabel"] p,
        [data-testid="stWidgetLabel"] span,
        .stTextInput label,
        .stNumberInput label,
        .stSelectbox label,
        .stDateInput label {
            color: #064e3b !important;
            font-weight: 750 !important;
        }

        input, textarea {
            color: #111827 !important;
            background: #ffffff !important;
            border: 1px solid #94a3b8 !important;
            border-radius: 9px !important;
        }

        input::placeholder {
            color: #64748b !important;
        }

        input:focus, textarea:focus {
            border-color: #047857 !important;
            box-shadow: 0 0 0 2px rgba(4,120,87,.12) !important;
        }

        [data-baseweb="select"] > div {
            background: #ffffff !important;
            border-color: #94a3b8 !important;
            color: #111827 !important;
        }

        [data-baseweb="select"] * {
            color: #111827 !important;
        }

        [role="listbox"], [role="option"] {
            background: #ffffff !important;
            color: #111827 !important;
        }

        [role="option"]:hover {
            background: #ecfdf5 !important;
            color: #064e3b !important;
        }

        [data-baseweb="calendar"],
        [data-baseweb="calendar"] * {
            background: #ffffff !important;
            color: #111827 !important;
        }

        /* Buttons */
        div.stButton > button {
            min-height: 48px;
            border-radius: 11px;
            font-weight: 800;
            color: #ffffff !important;
            background: #065f46 !important;
            border: 1px solid #064e3b !important;
            box-shadow: 0 5px 12px rgba(6,78,59,.14);
        }

        div.stButton > button:hover {
            background: #047857 !important;
            border-color: #047857 !important;
            color: #ffffff !important;
        }

        /* Metrics */
        [data-testid="stMetric"] {
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            border-top: 3px solid #047857 !important;
            border-radius: 12px;
            padding: 12px 14px;
        }

        [data-testid="stMetricLabel"] p {
            color: #475569 !important;
            font-weight: 700 !important;
        }

        [data-testid="stMetricValue"] {
            color: #064e3b !important;
            font-weight: 850 !important;
        }

        /* Prediction */
        .prediction-card {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border: 1px solid #86efac;
            border-top: 5px solid #047857;
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 14px 30px rgba(5,46,22,.09);
        }

        .prediction-label {
            color: #047857 !important;
            font-size: .78rem;
            text-transform: uppercase;
            letter-spacing: .13em;
            font-weight: 850;
        }

        .prediction-value {
            color: #052e16 !important;
            font-size: 3.8rem;
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: -.05em;
            margin: 10px 0;
        }

        .prediction-unit {
            color: #475569 !important;
            font-size: .92rem;
        }

        /* Alerts */
        [data-testid="stAlert"] {
            border-radius: 11px !important;
        }

        [data-testid="stAlert"] p,
        [data-testid="stAlert"] span {
            color: #111827 !important;
        }

        /* Tabs */
        button[data-baseweb="tab"] {
            color: #475569 !important;
            font-weight: 750 !important;
        }

        button[data-baseweb="tab"][aria-selected="true"] {
            color: #065f46 !important;
        }

        [data-baseweb="tab-highlight"] {
            background: #047857 !important;
        }

        /* Tables / expanders */
        [data-testid="stDataFrame"] {
            border: 1px solid #cbd5e1 !important;
            border-radius: 10px !important;
        }

        [data-testid="stExpander"] {
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 12px !important;
        }

        [data-testid="stExpander"] summary,
        [data-testid="stExpander"] summary span {
            color: #064e3b !important;
            font-weight: 800 !important;
        }

        code {
            color: #064e3b !important;
            background: #ecfdf5 !important;
        }

        [data-testid="stCaptionContainer"] {
            color: #475569 !important;
        }

        /* Status */
        .status-ok {
            padding: 11px 14px;
            border-radius: 10px;
            background: #ecfdf5;
            border: 1px solid #86efac;
            color: #166534 !important;
            font-weight: 800;
            font-size: .88rem;
        }

        /* Footer */
        .footer {
            text-align: center;
            color: #64748b !important;
            font-size: .78rem;
            padding-top: 20px;
        }

        #MainMenu, footer {
            visibility: hidden;
        }
    </style>
    """,
    unsafe_allow_html=True,
)

# ============================================================
# HELPERS
# ============================================================

def money(value: float) -> str:
    return f"${value:,.2f}"


def pct(value: float) -> str:
    return f"{value:.2f}%"


def cyclical(value: int, period: int):
    angle = 2 * math.pi * value / period
    return math.sin(angle), math.cos(angle)


def price_position(price: float, competitor: float) -> str:
    if competitor <= 0 or math.isclose(price, competitor, rel_tol=0, abs_tol=1e-9):
        return "Similar to Competitor"
    if price < competitor:
        return "Cheaper than Competitor"
    return "More Expensive than Competitor"


def scenario_label(price: float, competitor: float, discount: float, promotion: int) -> str:
    if promotion == 1 and discount >= 20 and price < competitor:
        return "High-Competition Offer"
    if price < competitor:
        return "Competitive Pricing"
    if price > competitor:
        return "Premium Pricing"
    return "Market-Aligned Pricing"


def build_row(
    store_id,
    product_id,
    category,
    region,
    inventory,
    price,
    discount,
    weather,
    promotion,
    competitor_pricing,
    seasonality,
    epidemic,
    selected_date,
):
    year = selected_date.year
    month = selected_date.month
    day = selected_date.day
    day_of_week = selected_date.weekday()
    quarter = ((month - 1) // 3) + 1
    week_of_year = int(selected_date.isocalendar().week)

    month_sin, month_cos = cyclical(month, 12)
    dow_sin, dow_cos = cyclical(day_of_week, 7)

    price_difference = price - competitor_pricing
    relative_price_difference = (
        price_difference / competitor_pricing
        if competitor_pricing > 0
        else 0.0
    )

    position = price_position(price, competitor_pricing)

    row = pd.DataFrame(
        [{
            "Store ID": store_id,
            "Product ID": product_id,
            "Category": category,
            "Region": region,
            "Inventory Level": inventory,
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
            "Price Position": position,
            "Day of Week": day_of_week,
            "Quarter": quarter,
            "Week of Year": week_of_year,
            "Month Sin": month_sin,
            "Month Cos": month_cos,
            "DayOfWeek Sin": dow_sin,
            "DayOfWeek Cos": dow_cos,
        }]
    )

    return row


# ============================================================
# MODEL LOADING
# ============================================================

@st.cache_resource
def load_artifact(model_path: str, modified_time: float):
    artifact = joblib.load(model_path)

    if not isinstance(artifact, dict):
        raise TypeError("Invalid model artifact. Expected a dictionary.")

    required_keys = ["model", "preprocessor", "features"]
    missing_keys = [key for key in required_keys if key not in artifact]

    if missing_keys:
        raise KeyError(f"Model artifact is missing keys: {missing_keys}")

    model = artifact["model"]
    preprocessor = artifact["preprocessor"]
    features = list(artifact["features"])

    # XGBoost fitted-state validation.
    try:
        model.get_booster()
    except Exception as exc:
        raise RuntimeError(
            "The XGBoost object stored in the artifact is not fitted."
        ) from exc

    if features != EXPECTED_FEATURES:
        raise ValueError(
            "Feature contract mismatch. "
            f"Expected {len(EXPECTED_FEATURES)} features but received "
            f"{len(features)}."
        )

    return artifact


# ============================================================
# MODEL PATH / LOAD
# ============================================================

if not MODEL_PATH.exists():
    st.error("Trained PricePilot model was not found.")
    st.code(str(MODEL_PATH))
    st.stop()

try:
    artifact = load_artifact(
        str(MODEL_PATH),
        MODEL_PATH.stat().st_mtime,
    )
except Exception as exc:
    st.error("PricePilot model could not be loaded.")
    st.exception(exc)
    st.stop()


model = artifact["model"]
preprocessor = artifact["preprocessor"]
features = list(artifact["features"])

model_name = artifact.get("model_name", "XGBoost Demand Prediction")
model_version = artifact.get("version", "2.0")
target = artifact.get("target", TARGET)
best_iteration = artifact.get("best_iteration", "N/A")
best_rmse = artifact.get("best_validation_rmse", None)
test_metrics = artifact.get("test_metrics", {})


# ============================================================
# SESSION STATE
# ============================================================

if "prediction" not in st.session_state:
    st.session_state.prediction = None

if "last_prediction_time" not in st.session_state:
    st.session_state.last_prediction_time = None

if "last_prediction_row" not in st.session_state:
    st.session_state.last_prediction_row = None


# ============================================================
# HERO
# ============================================================

st.markdown(
    """
    <div class="hero">
        <div class="hero-title">PricePilot AI</div>
        <div class="hero-subtitle">
            Demand Forecasting & Pricing Intelligence powered by a trained XGBoost regression pipeline
        </div>
        <div class="hero-badge">
            LIVE MODEL • 25 FEATURES • AUTOMATED FEATURE ENGINEERING
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)


# ============================================================
# TOP STATUS BAR
# ============================================================

status_cols = st.columns(4)

with status_cols[0]:
    st.markdown(
        '<div class="mini-card"><div class="mini-label">Model Status</div>'
        '<div class="mini-value">● Ready</div></div>',
        unsafe_allow_html=True,
    )

with status_cols[1]:
    st.markdown(
        f'<div class="mini-card"><div class="mini-label">Model Version</div>'
        f'<div class="mini-value">{model_version}</div></div>',
        unsafe_allow_html=True,
    )

with status_cols[2]:
    st.markdown(
        f'<div class="mini-card"><div class="mini-label">Input Features</div>'
        f'<div class="mini-value">{len(features)}</div></div>',
        unsafe_allow_html=True,
    )

with status_cols[3]:
    st.markdown(
        f'<div class="mini-card"><div class="mini-label">Prediction Target</div>'
        f'<div class="mini-value">{target}</div></div>',
        unsafe_allow_html=True,
    )


# ============================================================
# SIDEBAR - MODEL CENTER
# ============================================================

with st.sidebar:
    st.header("Model Center")

    st.markdown(
        '<div class="status-ok">Model loaded and fitted successfully</div>',
        unsafe_allow_html=True,
    )

    st.divider()

    st.subheader("Artifact")
    st.caption(f"File: {MODEL_PATH.name}")
    st.caption(f"Location: {MODEL_PATH.parent}")

    st.subheader("Model")
    st.write(f"**Name:** {model_name}")
    st.write(f"**Version:** {model_version}")
    st.write(f"**Target:** {target}")
    st.write(f"**Features:** {len(features)}")

    params = model.get_params()

    st.divider()
    st.subheader("XGBoost Configuration")
    st.write(f"**Estimators:** {params.get('n_estimators', 'N/A')}")
    st.write(f"**Max depth:** {params.get('max_depth', 'N/A')}")
    st.write(f"**Learning rate:** {params.get('learning_rate', 'N/A')}")
    st.write(f"**Subsample:** {params.get('subsample', 'N/A')}")
    st.write(f"**Column sampling:** {params.get('colsample_bytree', 'N/A')}")
    st.write(f"**Best iteration:** {best_iteration}")

    if best_rmse is not None:
        st.write(f"**Validation RMSE:** {float(best_rmse):,.4f}")

    if test_metrics:
        st.divider()
        st.subheader("Stored Test Metrics")
        for key, value in test_metrics.items():
            if isinstance(value, (int, float, np.integer, np.floating)):
                st.write(f"**{key}:** {float(value):,.4f}")

    st.divider()
    st.caption("PricePilot AI • Demand Intelligence")


# ============================================================
# INPUT WORKSPACE
# ============================================================

st.markdown(
    '<div class="section-title">1. Product & Market Configuration</div>',
    unsafe_allow_html=True,
)
st.markdown(
    '<div class="section-caption">Define the product, store, category and market context.</div>',
    unsafe_allow_html=True,
)

with st.container(border=True):
    c1, c2, c3, c4 = st.columns(4)

    with c1:
        store_id = st.text_input("Store ID", value="S001")

    with c2:
        product_id = st.text_input("Product ID", value="P0001")

    with c3:
        category = st.selectbox(
            "Category",
            ["Electronics", "Clothing", "Groceries"],
        )

    with c4:
        region = st.selectbox(
            "Region",
            ["North", "South", "East", "West"],
        )


st.markdown(
    '<div class="section-title">2. Pricing, Inventory & Promotion</div>',
    unsafe_allow_html=True,
)
st.markdown(
    '<div class="section-caption">Set the commercial variables used by the demand model.</div>',
    unsafe_allow_html=True,
)

with st.container(border=True):
    c1, c2, c3, c4 = st.columns(4)

    with c1:
        inventory = st.number_input(
            "Inventory Level",
            min_value=0.0,
            value=100.0,
            step=1.0,
        )

    with c2:
        price = st.number_input(
            "Current Price ($)",
            min_value=0.01,
            value=100.0,
            step=0.50,
        )

    with c3:
        discount = st.number_input(
            "Discount (%)",
            min_value=0.0,
            max_value=100.0,
            value=10.0,
            step=0.5,
        )

    with c4:
        promotion = st.selectbox(
            "Promotion",
            [0, 1],
            format_func=lambda x: "Active" if x == 1 else "Inactive",
        )


st.markdown(
    '<div class="section-title">3. External & Competitive Factors</div>',
    unsafe_allow_html=True,
)
st.markdown(
    '<div class="section-caption">Capture market conditions that can influence customer demand.</div>',
    unsafe_allow_html=True,
)

with st.container(border=True):
    c1, c2, c3, c4 = st.columns(4)

    with c1:
        weather = st.selectbox(
            "Weather Condition",
            ["Sunny", "Cloudy", "Rainy", "Snowy", "Stormy"],
        )

    with c2:
        competitor_pricing = st.number_input(
            "Competitor Price ($)",
            min_value=0.01,
            value=95.0,
            step=0.50,
        )

    with c3:
        seasonality = st.selectbox(
            "Seasonality",
            ["Spring", "Summer", "Autumn", "Winter"],
        )

    with c4:
        epidemic = st.selectbox(
            "Epidemic / Crisis",
            [0, 1],
            format_func=lambda x: "Active" if x == 1 else "Normal",
        )


st.markdown(
    '<div class="section-title">4. Forecast Date</div>',
    unsafe_allow_html=True,
)

with st.container(border=True):
    c1, c2, c3 = st.columns([1, 1, 1])

    with c1:
        selected_date = st.date_input(
            "Prediction Date",
            value=date.today(),
        )

    with c2:
        st.info(
            "Temporal features such as year, month, weekday, quarter, "
            "week number and cyclical encodings are calculated automatically."
        )

    with c3:
        st.success(
            "Demand is the model target. Historical sales, revenue and "
            "target leakage variables are not requested as inputs."
        )


# ============================================================
# DERIVED BUSINESS SIGNALS
# ============================================================

price_diff = price - competitor_pricing
relative_diff = (
    price_diff / competitor_pricing
    if competitor_pricing > 0
    else 0.0
)
position = price_position(price, competitor_pricing)
scenario = scenario_label(price, competitor_pricing, discount, promotion)

st.markdown(
    '<div class="section-title">5. Live Pricing Intelligence</div>',
    unsafe_allow_html=True,
)

signal_cols = st.columns(5)

with signal_cols[0]:
    st.metric("Price Delta", money(price_diff))

with signal_cols[1]:
    st.metric("Relative Price Gap", pct(relative_diff * 100))

with signal_cols[2]:
    st.metric("Price Position", position)

with signal_cols[3]:
    st.metric("Promotion", "Active" if promotion else "Inactive")

with signal_cols[4]:
    st.metric("Scenario", scenario)


# ============================================================
# BUILD MODEL INPUT
# ============================================================

row = build_row(
    store_id=store_id,
    product_id=product_id,
    category=category,
    region=region,
    inventory=inventory,
    price=price,
    discount=discount,
    weather=weather,
    promotion=promotion,
    competitor_pricing=competitor_pricing,
    seasonality=seasonality,
    epidemic=epidemic,
    selected_date=selected_date,
)


# ============================================================
# DATE DISTRIBUTION WARNING
# ============================================================

if selected_date > TRAINING_END_DATE:
    st.warning(
        f"Forecast date {selected_date:%Y-%m-%d} is beyond the historical "
        f"training range ({TRAINING_START_DATE:%Y-%m-%d} to "
        f"{TRAINING_END_DATE:%Y-%m-%d}). The model can generate a prediction, "
        "but this should be treated as an extrapolated forecast rather than a guarantee."
    )


# ============================================================
# FEATURE ENGINEERING INSPECTOR
# ============================================================

st.markdown(
    '<div class="section-title">6. Model Feature Inspection</div>',
    unsafe_allow_html=True,
)

tab_input, tab_derived, tab_numeric, tab_contract = st.tabs(
    [
        "Full Model Input",
        "Calculated Features",
        "Numeric Features",
        "Feature Contract",
    ]
)

with tab_input:
    st.caption(f"Exact {len(features)}-feature matrix passed to the saved pipeline.")
    st.dataframe(
        row[features].T.rename(columns={0: "Value"}),
        use_container_width=True,
    )

with tab_derived:
    derived_cols = [
        "Year",
        "Month",
        "Day",
        "Day of Week",
        "Quarter",
        "Week of Year",
        "Price Difference",
        "Relative Price Difference",
        "Price Position",
        "Month Sin",
        "Month Cos",
        "DayOfWeek Sin",
        "DayOfWeek Cos",
    ]
    st.dataframe(
        row[derived_cols].T.rename(columns={0: "Calculated Value"}),
        use_container_width=True,
    )

with tab_numeric:
    st.dataframe(
        row[NUMERICAL_FEATURES].T.rename(columns={0: "Value"}),
        use_container_width=True,
    )

with tab_contract:
    contract_df = pd.DataFrame(
        {
            "Feature": EXPECTED_FEATURES,
            "Type": [
                "Categorical" if x in CATEGORICAL_FEATURES else "Numerical"
                for x in EXPECTED_FEATURES
            ],
            "Source": [
                "User Input" if x not in {
                    "Year", "Month", "Day", "Price Difference",
                    "Relative Price Difference", "Price Position",
                    "Day of Week", "Quarter", "Week of Year",
                    "Month Sin", "Month Cos", "DayOfWeek Sin",
                    "DayOfWeek Cos",
                } else "Engineered"
                for x in EXPECTED_FEATURES
            ],
        }
    )
    st.dataframe(contract_df, use_container_width=True, hide_index=True)


# ============================================================
# PREDICTION ENGINE
# ============================================================

st.markdown(
    '<div class="section-title">7. Demand Prediction</div>',
    unsafe_allow_html=True,
)

run_col1, run_col2, run_col3 = st.columns([1, 2, 1])

with run_col2:
    run_prediction = st.button(
        "Run Demand Prediction",
        type="primary",
        use_container_width=True,
    )

if run_prediction:
    try:
        model_input = row[features].copy()
        transformed = preprocessor.transform(model_input)

        raw_prediction = model.predict(transformed)
        prediction = float(np.asarray(raw_prediction).reshape(-1)[0])

        if not np.isfinite(prediction):
            raise ValueError("Model returned a non-finite prediction.")

        # Demand cannot be negative from a business interpretation perspective.
        # Preserve the raw prediction separately for diagnostics.
        prediction_display = max(0.0, prediction)

        st.session_state.prediction = prediction_display
        st.session_state.raw_prediction = prediction
        st.session_state.last_prediction_row = row.copy()
        st.session_state.last_prediction_time = datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    except Exception as exc:
        st.session_state.prediction = None
        st.error("Prediction execution failed.")
        st.exception(exc)


# ============================================================
# RESULTS
# ============================================================

if st.session_state.prediction is not None:
    pred = float(st.session_state.prediction)
    raw_pred = float(st.session_state.get("raw_prediction", pred))

    estimated_revenue = pred * price
    price_gap_pct = relative_diff * 100

    st.markdown(
        f"""
        <div class="prediction-card">
            <div class="prediction-label">Predicted Unit Demand</div>
            <div class="prediction-value">{pred:,.2f}</div>
            <div class="prediction-unit">
                estimated units for the selected product, store and forecast date
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("<br>", unsafe_allow_html=True)

    # Executive metrics
    m1, m2, m3, m4 = st.columns(4)

    with m1:
        st.metric(
            "Estimated Revenue",
            money(estimated_revenue),
            help="Predicted demand × current selling price.",
        )

    with m2:
        st.metric(
            "Current Price",
            money(price),
        )

    with m3:
        st.metric(
            "Competitor Price",
            money(competitor_pricing),
        )

    with m4:
        st.metric(
            "Inventory",
            f"{inventory:,.0f}",
        )

    # Business interpretation
    st.markdown(
        '<div class="section-title">8. Business Interpretation</div>',
        unsafe_allow_html=True,
    )

    interpretation_cols = st.columns(3)

    with interpretation_cols[0]:
        st.markdown(
            f"""
            <div class="panel">
                <b>Pricing Position</b><br><br>
                {position}<br>
                <span style="color:#64748b">
                    Price gap: {money(price_diff)} ({price_gap_pct:.2f}%)
                </span>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with interpretation_cols[1]:
        st.markdown(
            f"""
            <div class="panel">
                <b>Commercial Setup</b><br><br>
                Discount: {discount:.1f}%<br>
                Promotion: {"Active" if promotion else "Inactive"}<br>
                Scenario: {scenario}
            </div>
            """,
            unsafe_allow_html=True,
        )

    with interpretation_cols[2]:
        st.markdown(
            f"""
            <div class="panel">
                <b>Forecast Context</b><br><br>
                Date: {selected_date:%d %b %Y}<br>
                Season: {seasonality}<br>
                Weather: {weather}
            </div>
            """,
            unsafe_allow_html=True,
        )

    # Prediction audit
    with st.expander("Prediction Audit & Technical Details"):
        audit_df = pd.DataFrame(
            {
                "Parameter": [
                    "Prediction target",
                    "Model",
                    "Model version",
                    "Features",
                    "Raw XGBoost output",
                    "Displayed demand",
                    "Prediction generated",
                ],
                "Value": [
                    target,
                    model_name,
                    str(model_version),
                    str(len(features)),
                    f"{raw_pred:,.6f}",
                    f"{pred:,.6f}",
                    st.session_state.last_prediction_time or "N/A",
                ],
            }
        )
        st.dataframe(audit_df, use_container_width=True, hide_index=True)

    st.caption(
        "Estimated Revenue = Predicted Demand × Current Price. "
        "This is a derived business metric, not the model's prediction target."
    )


# ============================================================
# FOOTER
# ============================================================

st.divider()

st.markdown(
    """
    <div class="footer">
        PricePilot AI • Demand Forecasting & Pricing Intelligence<br>
        XGBoost Regression • Automated Feature Engineering • 25-Feature Model Contract
    </div>
    """,
    unsafe_allow_html=True,
)
