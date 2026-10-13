"""
app.py
------
AI-Powered Retail Business Intelligence — Streamlit Dashboard

Run with:
    streamlit run app.py

This file only handles UI/layout. All calculations live in src/ so the
dashboard, a future API, and the AI assistant all share the exact same
numbers.
"""

import os
import sys

import pandas as pd
import plotly.express as px
import streamlit as st

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src import data_processing, kpi_engine, ml_prediction, report_generator, groq_service

# --------------------------------------------------------------------------
# PAGE CONFIG
# --------------------------------------------------------------------------
st.set_page_config(
    page_title="PricePilot AI: Dynamic Pricing Optimization & Revenue Intelligence System",
    page_icon="📊",
    layout="wide",
)

DATA_DIR = "data"
MODEL_DIR = "models"


# --------------------------------------------------------------------------
# CACHED DATA / MODEL LOADING
# --------------------------------------------------------------------------
@st.cache_data(show_spinner="Loading and processing datasets...")
def get_data():
    return data_processing.load_all(DATA_DIR)


@st.cache_resource(show_spinner=False)
def get_model_and_metrics():
    model = ml_prediction.load_model(os.path.join(MODEL_DIR, "best_sales_prediction_model.pkl"))
    metrics = ml_prediction.load_metrics(os.path.join(MODEL_DIR, "model_metrics.json"))
    return model, metrics


try:
    sales_master, funnel, competitor, catalog = get_data()
    data_load_error = None
except Exception as e:
    sales_master = funnel = competitor = catalog = pd.DataFrame()
    data_load_error = str(e)

model, ml_metrics = get_model_and_metrics()

# --------------------------------------------------------------------------
# HEADER
# --------------------------------------------------------------------------
st.title("📊 AI-Powered Retail Business Intelligence")
st.caption("Sales Prediction • KPI Analytics • Groq-powered Business Assistant")

if data_load_error:
    st.error(
        f"Could not load datasets: {data_load_error}\n\n"
        f"Make sure daily_operations.csv, customer_activity.csv, "
        f"competitor_prices.csv and product_catalog.csv are inside the "
        f"data/ folder."
    )
    st.stop()

# --------------------------------------------------------------------------
# SIDEBAR FILTERS
# --------------------------------------------------------------------------
st.sidebar.header("🔎 Filters")

min_date = sales_master["date"].min().date()
max_date = sales_master["date"].max().date()

date_range = st.sidebar.date_input(
    "Date range", value=(min_date, max_date), min_value=min_date, max_value=max_date
)
if isinstance(date_range, tuple) and len(date_range) == 2:
    date_start, date_end = date_range
else:
    date_start, date_end = min_date, max_date

category_options = ["All"] + sorted(sales_master["category"].dropna().unique().tolist())
category = st.sidebar.selectbox("Category", category_options)

# products depend on the selected category
prod_pool = sales_master if category == "All" else sales_master[sales_master["category"] == category]
product_map = (
    prod_pool[["product_id", "product_name"]]
    .drop_duplicates()
    .sort_values("product_name")
)
product_options = ["All"] + [f"{r.product_id} — {r.product_name}" for r in product_map.itertuples()]
product_choice = st.sidebar.selectbox("Product", product_options)
product = product_choice.split(" — ")[0] if product_choice != "All" else "All"

channel_options = ["All"] + sorted(sales_master["channel"].dropna().unique().tolist())
channel = st.sidebar.selectbox("Channel", channel_options)

brand_options = ["All"] + sorted(sales_master["brand"].dropna().unique().tolist()) if "brand" in sales_master.columns else ["All"]
brand = st.sidebar.selectbox("Brand", brand_options)

if st.sidebar.button("↺ Reset filters"):
    st.rerun()

st.sidebar.divider()
if groq_service.is_available():
    st.sidebar.success("AI Assistant: Connected to Groq")
else:
    st.sidebar.warning("AI Assistant: Offline (set GROQ_API_KEY in .env)")

if model is not None:
    st.sidebar.success(f"ML Model loaded: {ml_metrics.get('best_model_name', 'Unknown')}")
else:
    st.sidebar.warning("ML Model not found in models/ folder")

# --------------------------------------------------------------------------
# APPLY FILTERS
# --------------------------------------------------------------------------
filters = {
    "date_start": date_start, "date_end": date_end,
    "category": category, "product": product,
    "channel": channel, "brand": brand,
}
f_sales, f_funnel, f_competitor = kpi_engine.apply_filters(sales_master, funnel, competitor, filters)

kpis = kpi_engine.calculate_kpis(f_sales, f_funnel, f_competitor)

# --------------------------------------------------------------------------
# KPI CARDS
# --------------------------------------------------------------------------
st.markdown("### Key Performance Indicators")
c1, c2, c3, c4, c5, c6 = st.columns(6)
c1.metric("Total Revenue", f"${kpis['total_revenue']:,.0f}")
c2.metric("Total Profit", f"${kpis['total_profit']:,.0f}")
c3.metric("Total Units Sold", f"{kpis['total_units_sold']:,.0f}")
c4.metric("Profit Margin", f"{kpis['profit_margin_pct']:.2f}%")
c5.metric("Conversion Rate", f"{kpis['conversion_rate_pct']:.2f}%")
c6.metric("Stockout Rate", f"{kpis['stockout_rate_pct']:.2f}%")

if f_sales.empty:
    st.warning("No rows match the selected filters. Try widening your date range or clearing a filter.")
    st.stop()

st.divider()

# --------------------------------------------------------------------------
# SECTION 1: Revenue & Profit Trends
# --------------------------------------------------------------------------
st.markdown("## 1️⃣ Revenue & Profit Trends")
trend = kpi_engine.monthly_trend(f_sales)

t1, t2 = st.columns(2)
with t1:
    fig = px.line(trend, x="year_month", y="revenue", markers=True, title="Monthly Revenue Trend")
    st.plotly_chart(fig, width='stretch')
with t2:
    fig = px.line(trend, x="year_month", y="profit", markers=True, title="Monthly Profit Trend",
                  color_discrete_sequence=["#2ca02c"])
    st.plotly_chart(fig, width='stretch')

fig = px.bar(trend, x="year_month", y="units_sold", title="Units Sold Trend")
st.plotly_chart(fig, width='stretch')

rg = kpi_engine.revenue_growth(f_sales)
pg = kpi_engine.profit_growth(f_sales)
g1, g2 = st.columns(2)
g1.info(f"Revenue Growth ({rg['previous_month']} → {rg['current_month']}): **{rg['revenue_growth_pct']}%**")
g2.info(f"Profit Growth ({pg['previous_month']} → {pg['current_month']}): **{pg['profit_growth_pct']}%**")

st.divider()

# --------------------------------------------------------------------------
# SECTION 2: Category & Channel Analysis
# --------------------------------------------------------------------------
st.markdown("## 2️⃣ Category & Channel Analysis")
cat_rev = kpi_engine.revenue_by_category(f_sales)
chan_rev = kpi_engine.revenue_by_channel(f_sales)

s2a, s2b = st.columns(2)
with s2a:
    fig = px.bar(cat_rev, x="category", y="revenue", title="Revenue by Category", color="category")
    st.plotly_chart(fig, width='stretch')
with s2b:
    fig = px.pie(chan_rev, names="channel", values="revenue", title="Revenue by Channel")
    st.plotly_chart(fig, width='stretch')

st.divider()

# --------------------------------------------------------------------------
# SECTION 3: Product Performance
# --------------------------------------------------------------------------
st.markdown("## 3️⃣ Product Performance")
top_rev = kpi_engine.top_products_by_revenue(f_sales, 10)
top_profit = kpi_engine.top_products_by_profit(f_sales, 10)

s3a, s3b = st.columns(2)
with s3a:
    fig = px.bar(top_rev.sort_values("revenue"), x="revenue", y="product_name",
                 orientation="h", title="Top 10 Products by Revenue")
    st.plotly_chart(fig, width='stretch')
with s3b:
    fig = px.bar(top_profit.sort_values("profit"), x="profit", y="product_name",
                 orientation="h", title="Top 10 Products by Profit", color_discrete_sequence=["#2ca02c"])
    st.plotly_chart(fig, width='stretch')

st.divider()

# --------------------------------------------------------------------------
# SECTION 4: Competitor Price Analysis
# --------------------------------------------------------------------------
st.markdown("## 4️⃣ Competitor Price Analysis")
price_cmp = kpi_engine.price_comparison(f_sales)
fig = px.line(price_cmp, x="year_month", y=["avg_our_price", "avg_competitor_price"],
              markers=True, title="Our Price vs Competitor Price (Monthly Average)")
st.plotly_chart(fig, width='stretch')
st.caption(
    f"Average our price: **${kpis['avg_our_price']:.2f}** | "
    f"Average competitor price: **${kpis['avg_competitor_price']:.2f}** | "
    f"Difference: **${kpis['price_difference_vs_competitor']:.2f}** "
    f"({'we are cheaper' if kpis['price_difference_vs_competitor'] < 0 else 'we are pricier'})"
)

st.divider()

# --------------------------------------------------------------------------
# SECTION 5: Customer Behaviour
# --------------------------------------------------------------------------
st.markdown("## 5️⃣ Customer Behaviour")
conv_trend = kpi_engine.conversion_trend(f_funnel)
stockout_df = kpi_engine.stockout_analysis(f_sales)

s5a, s5b = st.columns(2)
with s5a:
    fig = px.line(conv_trend, x="year_month", y="conversion_rate_pct", markers=True,
                  title="Customer Conversion Rate Trend")
    st.plotly_chart(fig, width='stretch')
with s5b:
    fig = px.bar(stockout_df, x="category", y="stockout_rate_pct", title="Stockout Rate by Category",
                 color_discrete_sequence=["#d62728"])
    st.plotly_chart(fig, width='stretch')

funnel_counts = pd.DataFrame({
    "stage": ["Views", "Add to Cart", "Purchases"],
    "count": [kpis["customer_views"], kpis["add_to_cart_count"], kpis["purchases"]],
})
fig = px.funnel(funnel_counts, x="count", y="stage", title="Customer Funnel")
st.plotly_chart(fig, width='stretch')

st.divider()

# --------------------------------------------------------------------------
# SECTION 6: AI Business Assistant
# --------------------------------------------------------------------------
st.markdown("## 6️⃣ 🤖 AI Business Assistant (powered by Groq)")

if not groq_service.is_available():
    st.warning(
        "AI Assistant is offline — add your GROQ_API_KEY to a .env file to enable it. "
        "All KPIs and charts above are fully functional without it."
    )

tab_chat, tab_predict, tab_report = st.tabs(["💬 Ask AI", "🔮 Predict Sales", "📄 Generate Report"])

with tab_chat:
    st.caption("Ask about revenue, profit, top products, pricing, conversion, restocking, or the ML model.")
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    for role, msg in st.session_state.chat_history:
        with st.chat_message(role):
            st.markdown(msg)

    question = st.chat_input("e.g. Which category generated the highest revenue?")
    if question:
        st.session_state.chat_history.append(("user", question))
        with st.chat_message("user"):
            st.markdown(question)
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                answer = report_generator.answer_question(
                    question, f_sales, f_funnel, f_competitor, ml_metrics
                )
            st.markdown(answer)
        st.session_state.chat_history.append(("assistant", answer))

with tab_predict:
    st.caption("Uses the model trained in Point 1 (best_sales_prediction_model.pkl). "
               "No prediction is shown if the model isn't loaded or inputs don't match.")
    if model is None:
        st.info("No trained model found in models/. Add best_sales_prediction_model.pkl to enable predictions.")
    else:
        expected_features = ml_prediction.get_expected_features(model)
        if not expected_features:
            st.info("Model loaded, but its expected feature names could not be detected "
                    "(the model may have been trained on a plain array, not a DataFrame). "
                    "Predictions are disabled until Point 1 saves feature_names_in_.")
        else:
            st.write("Fill in the values used at training time:")
            input_vals = {}
            cols = st.columns(3)
            for i, feat in enumerate(expected_features):
                with cols[i % 3]:
                    input_vals[feat] = st.number_input(feat, value=0.0, key=f"feat_{feat}")
            if st.button("Predict"):
                pred = ml_prediction.predict_sales(model, input_vals)
                if pred is None:
                    st.error("Prediction failed. Check that the input values match the training features.")
                else:
                    st.success(f"Predicted value: **{pred:,.2f}**")
                    st.session_state["latest_prediction"] = pred

with tab_report:
    st.caption("Generates a full business report from the CURRENTLY FILTERED data using Groq.")
    if st.button("📄 Generate Business Report"):
        with st.spinner("Generating report..."):
            report_text = report_generator.generate_business_report(f_sales, f_funnel, f_competitor, ml_metrics)
        st.markdown(report_text)
        st.download_button("Download report (.md)", report_text, file_name="business_report.md")

st.divider()
st.caption(
    f"Model in use: {ml_metrics.get('best_model_name', 'N/A')} | "
    f"MAE: {ml_metrics.get('mae', 'N/A')} | "
    f"RMSE: {ml_metrics.get('rmse', 'N/A')} | "
    f"R²: {ml_metrics.get('r2', 'N/A')}"
)
