"""
kpi_engine.py
-------------
Calculates every business KPI directly from the merged datasets produced by
data_processing.py. No KPI value is ever fabricated — everything here is a
pandas aggregation over real rows. Every ratio is guarded against
division-by-zero.

Public functions
-----------------
safe_div(a, b, default=0.0)
apply_filters(sales_master, funnel, competitor, filters)  -> filtered copies
calculate_kpis(sales_master, funnel, competitor)           -> dict of scalar KPIs
revenue_growth(sales_master)                                -> dict (MoM growth)
profit_growth(sales_master)                                 -> dict (MoM growth)
revenue_by_category(sales_master)                            -> DataFrame
revenue_by_channel(sales_master)                              -> DataFrame
top_products_by_revenue(sales_master, n=10)                    -> DataFrame
top_products_by_profit(sales_master, n=10)                      -> DataFrame
monthly_trend(sales_master)                                      -> DataFrame (revenue, profit, units by month)
conversion_trend(funnel)                                          -> DataFrame (monthly conversion rate)
stockout_analysis(sales_master)                                     -> DataFrame (stockout rate by category)
price_comparison(sales_master)                                       -> DataFrame (our price vs competitor by month)
"""

from __future__ import annotations

import numpy as np
import pandas as pd


# --------------------------------------------------------------------------
# HELPER
# --------------------------------------------------------------------------
def safe_div(numerator, denominator, default=0.0):
    """Division that never raises / never returns inf or nan."""
    try:
        if denominator in (0, None) or pd.isna(denominator):
            return default
        result = numerator / denominator
        if pd.isna(result) or np.isinf(result):
            return default
        return result
    except (ZeroDivisionError, TypeError):
        return default


# --------------------------------------------------------------------------
# FILTERING (used by the dashboard sidebar)
# --------------------------------------------------------------------------
def apply_filters(sales_master, funnel, competitor, filters: dict):
    """
    filters keys (all optional): date_start, date_end, category, product,
    channel, brand
    """
    sm = sales_master.copy()
    fn = funnel.copy()
    cp = competitor.copy()

    date_start = filters.get("date_start")
    date_end = filters.get("date_end")
    category = filters.get("category")
    product = filters.get("product")
    channel = filters.get("channel")
    brand = filters.get("brand")

    if date_start is not None:
        date_start = pd.to_datetime(date_start)
        sm = sm[sm["date"] >= date_start]
        fn = fn[fn["date"] >= date_start]
        cp = cp[cp["date"] >= date_start]
    if date_end is not None:
        date_end = pd.to_datetime(date_end)
        sm = sm[sm["date"] <= date_end]
        fn = fn[fn["date"] <= date_end]
        cp = cp[cp["date"] <= date_end]

    if category and category != "All":
        sm = sm[sm["category"] == category]
        if "category" in fn.columns:
            fn = fn[fn["category"] == category]

    if product and product != "All":
        sm = sm[sm["product_id"] == product]
        if "product_id" in fn.columns:
            fn = fn[fn["product_id"] == product]
        cp = cp[cp["product_id"] == product]

    if channel and channel != "All":
        sm = sm[sm["channel"] == channel]
        if "channel" in fn.columns:
            fn = fn[fn["channel"] == channel]

    if brand and brand != "All" and "brand" in sm.columns:
        sm = sm[sm["brand"] == brand]

    return sm, fn, cp


# --------------------------------------------------------------------------
# CORE SCALAR KPIs (1-15)
# --------------------------------------------------------------------------
def calculate_kpis(sales_master: pd.DataFrame, funnel: pd.DataFrame,
                    competitor: pd.DataFrame) -> dict:
    sm = sales_master
    fn = funnel

    total_revenue = float(sm["revenue"].sum())
    total_units_sold = float(sm["units_sold"].sum())
    total_cost = float(sm["total_cost"].sum(skipna=True))
    total_profit = float(sm["profit"].sum(skipna=True))
    profit_margin_pct = safe_div(total_profit, total_revenue) * 100

    avg_selling_price = safe_div(total_revenue, total_units_sold)
    avg_discount_pct = float(sm["discount_pct"].mean()) if "discount_pct" in sm.columns and len(sm) else 0.0

    # ---- customer funnel ----
    views = int((fn["event_type"] == "view").sum())
    add_to_cart = int((fn["event_type"] == "add_to_cart").sum())
    purchases = int((fn["event_type"] == "purchase").sum())
    conversion_rate = safe_div(purchases, views) * 100

    # ---- stockout ----
    stockout_rate = 0.0
    if "stockout_flag" in sm.columns and len(sm):
        stockout_rate = safe_div(int(sm["stockout_flag"].sum()), len(sm)) * 100

    # ---- competitor pricing ----
    avg_competitor_price = 0.0
    avg_our_price = 0.0
    price_difference = 0.0
    if "competitor_avg_price" in sm.columns and sm["competitor_avg_price"].notna().any():
        avg_competitor_price = float(sm["competitor_avg_price"].mean())
    elif len(competitor):
        avg_competitor_price = float(competitor["competitor_price"].mean())

    if "final_price" in sm.columns and len(sm):
        avg_our_price = float(sm["final_price"].mean())
    price_difference = avg_our_price - avg_competitor_price

    kpis = {
        "total_revenue": round(total_revenue, 2),
        "total_units_sold": round(total_units_sold, 2),
        "total_cost": round(total_cost, 2),
        "total_profit": round(total_profit, 2),
        "profit_margin_pct": round(profit_margin_pct, 2),
        "avg_selling_price": round(avg_selling_price, 2),
        "avg_discount_pct": round(avg_discount_pct, 2),
        "customer_views": views,
        "add_to_cart_count": add_to_cart,
        "purchases": purchases,
        "conversion_rate_pct": round(conversion_rate, 2),
        "stockout_rate_pct": round(stockout_rate, 2),
        "avg_competitor_price": round(avg_competitor_price, 2),
        "avg_our_price": round(avg_our_price, 2),
        "price_difference_vs_competitor": round(price_difference, 2),
    }
    return kpis


# --------------------------------------------------------------------------
# GROWTH KPIs (16-17) — Month-over-month, based on the two most recent
# complete months present in the (filtered) data
# --------------------------------------------------------------------------
def _last_two_months(sm: pd.DataFrame):
    if sm.empty or "year_month" not in sm.columns:
        return None, None
    months = sorted(sm["year_month"].dropna().unique())
    if len(months) < 2:
        return None, None
    return months[-2], months[-1]  # previous, current


def revenue_growth(sales_master: pd.DataFrame) -> dict:
    prev_month, cur_month = _last_two_months(sales_master)
    if prev_month is None:
        return {"previous_month": None, "current_month": None,
                "previous_revenue": 0.0, "current_revenue": 0.0, "revenue_growth_pct": 0.0}

    prev_rev = float(sales_master.loc[sales_master["year_month"] == prev_month, "revenue"].sum())
    cur_rev = float(sales_master.loc[sales_master["year_month"] == cur_month, "revenue"].sum())
    growth = safe_div(cur_rev - prev_rev, prev_rev) * 100
    return {
        "previous_month": prev_month, "current_month": cur_month,
        "previous_revenue": round(prev_rev, 2), "current_revenue": round(cur_rev, 2),
        "revenue_growth_pct": round(growth, 2),
    }


def profit_growth(sales_master: pd.DataFrame) -> dict:
    prev_month, cur_month = _last_two_months(sales_master)
    if prev_month is None:
        return {"previous_month": None, "current_month": None,
                "previous_profit": 0.0, "current_profit": 0.0, "profit_growth_pct": 0.0}

    prev_p = float(sales_master.loc[sales_master["year_month"] == prev_month, "profit"].sum())
    cur_p = float(sales_master.loc[sales_master["year_month"] == cur_month, "profit"].sum())
    growth = safe_div(cur_p - prev_p, prev_p) * 100
    return {
        "previous_month": prev_month, "current_month": cur_month,
        "previous_profit": round(prev_p, 2), "current_profit": round(cur_p, 2),
        "profit_growth_pct": round(growth, 2),
    }


# --------------------------------------------------------------------------
# BREAKDOWNS (18-24)
# --------------------------------------------------------------------------
def revenue_by_category(sales_master: pd.DataFrame) -> pd.DataFrame:
    if sales_master.empty:
        return pd.DataFrame(columns=["category", "revenue"])
    out = sales_master.groupby("category", as_index=False)["revenue"].sum()
    return out.sort_values("revenue", ascending=False)


def revenue_by_channel(sales_master: pd.DataFrame) -> pd.DataFrame:
    if sales_master.empty:
        return pd.DataFrame(columns=["channel", "revenue"])
    out = sales_master.groupby("channel", as_index=False)["revenue"].sum()
    return out.sort_values("revenue", ascending=False)


def top_products_by_revenue(sales_master: pd.DataFrame, n: int = 10) -> pd.DataFrame:
    if sales_master.empty:
        return pd.DataFrame(columns=["product_id", "product_name", "revenue"])
    out = sales_master.groupby(["product_id", "product_name"], as_index=False)["revenue"].sum()
    return out.sort_values("revenue", ascending=False).head(n)


def top_products_by_profit(sales_master: pd.DataFrame, n: int = 10) -> pd.DataFrame:
    if sales_master.empty:
        return pd.DataFrame(columns=["product_id", "product_name", "profit"])
    out = sales_master.groupby(["product_id", "product_name"], as_index=False)["profit"].sum()
    return out.sort_values("profit", ascending=False).head(n)


def monthly_trend(sales_master: pd.DataFrame) -> pd.DataFrame:
    """Monthly Revenue (22), Monthly Profit (23), Monthly Units Sold (24)."""
    if sales_master.empty:
        return pd.DataFrame(columns=["year_month", "revenue", "profit", "units_sold"])
    out = sales_master.groupby("year_month", as_index=False).agg(
        revenue=("revenue", "sum"),
        profit=("profit", "sum"),
        units_sold=("units_sold", "sum"),
    )
    return out.sort_values("year_month")


def conversion_trend(funnel: pd.DataFrame) -> pd.DataFrame:
    if funnel.empty:
        return pd.DataFrame(columns=["year_month", "views", "purchases", "conversion_rate_pct"])
    grp = funnel.groupby("year_month")["event_type"].value_counts().unstack(fill_value=0)
    for col in ["view", "purchase"]:
        if col not in grp.columns:
            grp[col] = 0
    grp["conversion_rate_pct"] = grp.apply(
        lambda r: safe_div(r["purchase"], r["view"]) * 100, axis=1
    )
    grp = grp.reset_index().rename(columns={"view": "views", "purchase": "purchases"})
    return grp[["year_month", "views", "purchases", "conversion_rate_pct"]].sort_values("year_month")


def stockout_analysis(sales_master: pd.DataFrame) -> pd.DataFrame:
    if sales_master.empty or "stockout_flag" not in sales_master.columns:
        return pd.DataFrame(columns=["category", "stockout_rate_pct"])
    grp = sales_master.groupby("category").agg(
        total_days=("stockout_flag", "size"),
        stockout_days=("stockout_flag", "sum"),
    ).reset_index()
    grp["stockout_rate_pct"] = grp.apply(
        lambda r: safe_div(r["stockout_days"], r["total_days"]) * 100, axis=1
    )
    return grp.sort_values("stockout_rate_pct", ascending=False)


def price_comparison(sales_master: pd.DataFrame) -> pd.DataFrame:
    """Our average final price vs competitor average price, by month."""
    if sales_master.empty:
        return pd.DataFrame(columns=["year_month", "avg_our_price", "avg_competitor_price"])
    out = sales_master.groupby("year_month", as_index=False).agg(
        avg_our_price=("final_price", "mean"),
        avg_competitor_price=("competitor_avg_price", "mean"),
    )
    return out.sort_values("year_month")


# --------------------------------------------------------------------------
# MASTER SUMMARY (used to build the AI context)
# --------------------------------------------------------------------------
def full_kpi_report(sales_master, funnel, competitor) -> dict:
    """Bundles every KPI/table into one dict — used by report_generator & groq_service."""
    report = {}
    report.update(calculate_kpis(sales_master, funnel, competitor))
    report["revenue_growth"] = revenue_growth(sales_master)
    report["profit_growth"] = profit_growth(sales_master)
    report["revenue_by_category"] = revenue_by_category(sales_master).to_dict("records")
    report["revenue_by_channel"] = revenue_by_channel(sales_master).to_dict("records")
    report["top_products_by_revenue"] = top_products_by_revenue(sales_master).to_dict("records")
    report["top_products_by_profit"] = top_products_by_profit(sales_master).to_dict("records")
    report["monthly_trend"] = monthly_trend(sales_master).to_dict("records")
    report["stockout_by_category"] = stockout_analysis(sales_master).to_dict("records")
    return report


if __name__ == "__main__":
    from data_processing import load_all
    sm, fn, cp, cat = load_all("data")
    kpis = calculate_kpis(sm, fn, cp)
    for k, v in kpis.items():
        print(f"{k}: {v}")
    print("\nRevenue growth:", revenue_growth(sm))
    print("Profit growth:", profit_growth(sm))
    print("\nTop 5 products by revenue:\n", top_products_by_revenue(sm, 5))
