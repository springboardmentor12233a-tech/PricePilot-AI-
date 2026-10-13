"""
All KPI / analytics numbers used anywhere in the app (dashboard, reports,
chatbot, AI recommendations) are computed here from the real database
tables. Nothing in this file is randomly generated.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import (
    CompetitorPrice, CustomerActivity, DailyOperation, Product,
)


def _ops_query(db: Session, start: Optional[date] = None, end: Optional[date] = None,
                category: Optional[str] = None, product_id: Optional[str] = None,
                channel: Optional[str] = None, warehouse: Optional[str] = None):
    q = db.query(DailyOperation)
    if start:
        q = q.filter(DailyOperation.date >= start)
    if end:
        q = q.filter(DailyOperation.date <= end)
    if category:
        q = q.filter(DailyOperation.category == category)
    if product_id:
        q = q.filter(DailyOperation.product_id == product_id)
    if channel:
        q = q.filter(DailyOperation.channel == channel)
    if warehouse:
        q = q.filter(DailyOperation.warehouse == warehouse)
    return q


def get_kpis(db: Session, **filters) -> dict:
    q = _ops_query(db, **filters)
    df = pd.read_sql(q.statement, db.connection())
    if df.empty:
        return {"has_data": False}

    products = pd.read_sql(db.query(Product).statement, db.connection())
    df = df.merge(products[["product_id", "cost_price"]], on="product_id", how="left")

    total_revenue = float(df["revenue"].sum())
    total_units = float(df["units_sold"].sum())
    avg_price = float(df["final_price"].mean())
    avg_discount = float(df["discount_pct"].mean())
    estimated_cost = float((df["units_sold"] * df["cost_price"]).sum())
    gross_profit = total_revenue - estimated_cost
    profit_margin = (gross_profit / total_revenue * 100) if total_revenue else 0.0
    active_products = int(df["product_id"].nunique())
    avg_demand = float(df["market_demand_index"].mean())
    stockout_rate = float(df["stockout_flag"].mean() * 100)
    avg_competitor_price = float(df["competitor_avg_price"].mean())
    competitor_price_gap = float((df["final_price"] - df["competitor_avg_price"]).mean())

    # conversion rate from customer_activity in same window (best-effort filter by date range)
    act_q = db.query(CustomerActivity)
    if filters.get("start"):
        act_q = act_q.filter(CustomerActivity.timestamp >= filters["start"])
    if filters.get("end"):
        act_q = act_q.filter(CustomerActivity.timestamp <= filters["end"])
    if filters.get("category"):
        act_q = act_q.filter(CustomerActivity.category == filters["category"])
    if filters.get("product_id"):
        act_q = act_q.filter(CustomerActivity.product_id == filters["product_id"])
    act_df = pd.read_sql(act_q.statement, db.connection())
    if not act_df.empty:
        views = (act_df["event_type"] == "view").sum()
        purchases = (act_df["event_type"] == "purchase").sum()
        conversion_rate = float(purchases / views * 100) if views else 0.0
    else:
        conversion_rate = 0.0

    return {
        "has_data": True,
        "total_revenue": round(total_revenue, 2),
        "total_units_sold": int(total_units),
        "average_price": round(avg_price, 2),
        "average_discount_pct": round(avg_discount, 2),
        "estimated_cost": round(estimated_cost, 2),
        "gross_profit_estimated": round(gross_profit, 2),
        "profit_margin_pct_estimated": round(profit_margin, 2),
        "active_products": active_products,
        "average_demand_index": round(avg_demand, 2),
        "stockout_rate_pct": round(stockout_rate, 2),
        "average_competitor_price": round(avg_competitor_price, 2),
        "competitor_price_gap": round(competitor_price_gap, 2),
        "customer_conversion_rate_pct": round(conversion_rate, 2),
    }


def get_trends(db: Session, metric: str = "revenue", **filters) -> list[dict]:
    q = _ops_query(db, **filters)
    df = pd.read_sql(q.statement, db.connection())
    if df.empty:
        return []
    df["date"] = pd.to_datetime(df["date"])
    metric_map = {
        "revenue": ("revenue", "sum"),
        "sales": ("units_sold", "sum"),
        "demand": ("market_demand_index", "mean"),
        "price": ("final_price", "mean"),
    }
    col, agg = metric_map.get(metric, ("revenue", "sum"))
    grouped = df.groupby(df["date"].dt.date)[col].agg(agg).reset_index()
    grouped.columns = ["date", "value"]
    return [{"date": str(r.date), "value": round(float(r.value), 2)} for r in grouped.itertuples()]


def get_breakdown(db: Session, by: str = "category", **filters) -> list[dict]:
    q = _ops_query(db, **filters)
    df = pd.read_sql(q.statement, db.connection())
    if df.empty:
        return []
    col = {"category": "category", "channel": "channel", "warehouse": "warehouse",
           "product": "product_id"}.get(by, "category")
    grouped = df.groupby(col).agg(revenue=("revenue", "sum"), units=("units_sold", "sum")).reset_index()
    grouped = grouped.sort_values("revenue", ascending=False)
    return grouped.rename(columns={col: "label"}).to_dict(orient="records")


def get_top_products(db: Session, n: int = 10, ascending: bool = False, **filters) -> list[dict]:
    q = _ops_query(db, **filters)
    df = pd.read_sql(q.statement, db.connection())
    if df.empty:
        return []
    products = pd.read_sql(db.query(Product).statement, db.connection())
    grouped = df.groupby("product_id").agg(revenue=("revenue", "sum"), units=("units_sold", "sum")).reset_index()
    grouped = grouped.merge(products[["product_id", "product_name", "category"]], on="product_id", how="left")
    grouped = grouped.sort_values("revenue", ascending=ascending).head(n)
    return grouped.to_dict(orient="records")


def get_competitor_analysis(db: Session, product_id: Optional[str] = None) -> list[dict]:
    q = db.query(CompetitorPrice)
    if product_id:
        q = q.filter(CompetitorPrice.product_id == product_id)
    comp_df = pd.read_sql(q.statement, db.connection())
    if comp_df.empty:
        return []
    ops_df = pd.read_sql(db.query(DailyOperation).statement, db.connection())
    latest_ops = ops_df.sort_values("date").groupby("product_id").tail(1)[["product_id", "final_price"]]

    latest_comp_date = comp_df.groupby("product_id")["date"].transform("max")
    recent = comp_df[comp_df["date"] == latest_comp_date]
    agg = recent.groupby("product_id").agg(
        competitor_avg=("competitor_price", "mean"),
        competitor_min=("competitor_price", "min"),
        competitor_max=("competitor_price", "max"),
        num_competitors=("competitor_name", "nunique"),
        availability_pct=("in_stock", "mean"),
    ).reset_index()
    agg = agg.merge(latest_ops, on="product_id", how="left")
    agg["price_gap"] = agg["final_price"] - agg["competitor_avg"]

    def classify(row):
        if pd.isna(row["final_price"]) or pd.isna(row["competitor_avg"]) or row["competitor_avg"] == 0:
            return "unknown"
        diff_pct = (row["final_price"] - row["competitor_avg"]) / row["competitor_avg"] * 100
        if diff_pct < -3:
            return "Below market average"
        if diff_pct > 3:
            return "Above market average"
        return "Near market average"

    agg["positioning"] = agg.apply(classify, axis=1)
    agg["availability_pct"] = (agg["availability_pct"] * 100).round(1)
    return agg.round(2).to_dict(orient="records")


def get_customer_analytics(db: Session, **filters) -> dict:
    q = db.query(CustomerActivity)
    if filters.get("category"):
        q = q.filter(CustomerActivity.category == filters["category"])
    if filters.get("product_id"):
        q = q.filter(CustomerActivity.product_id == filters["product_id"])
    df = pd.read_sql(q.statement, db.connection())
    if df.empty:
        return {"has_data": False}

    funnel = df["event_type"].value_counts().to_dict()
    views = funnel.get("view", 0)
    carts = funnel.get("add_to_cart", 0)
    purchases = funnel.get("purchase", 0)

    purchase_df = df[df["event_type"] == "purchase"]
    aov = float(purchase_df["total_amount"].mean()) if not purchase_df.empty else 0.0

    by_segment = purchase_df.groupby("customer_segment")["total_amount"].sum().reset_index() \
        if not purchase_df.empty else pd.DataFrame(columns=["customer_segment", "total_amount"])
    by_channel = purchase_df.groupby("channel")["total_amount"].sum().reset_index() \
        if not purchase_df.empty else pd.DataFrame(columns=["channel", "total_amount"])
    by_device = df["device"].value_counts().reset_index()
    by_device.columns = ["device", "events"]

    return {
        "has_data": True,
        "funnel": {"view": int(views), "add_to_cart": int(carts), "purchase": int(purchases)},
        "conversion_rate_pct": round(purchases / views * 100, 2) if views else 0.0,
        "average_order_value": round(aov, 2),
        "revenue_by_segment": by_segment.round(2).to_dict(orient="records"),
        "revenue_by_channel": by_channel.round(2).to_dict(orient="records"),
        "device_distribution": by_device.to_dict(orient="records"),
    }


def get_stockout_risks(db: Session, threshold_days: int = 7) -> list[dict]:
    df = pd.read_sql(db.query(DailyOperation).statement, db.connection())
    if df.empty:
        return []
    df["date"] = pd.to_datetime(df["date"])
    recent = df[df["date"] >= df["date"].max() - pd.Timedelta(days=30)]
    grouped = recent.groupby("product_id").agg(
        avg_daily_units=("units_sold", "mean"),
        latest_stock=("stock_available", "last"),
        stockout_freq_pct=("stockout_flag", "mean"),
    ).reset_index()
    grouped["days_of_cover"] = grouped["latest_stock"] / grouped["avg_daily_units"].replace(0, 1)
    grouped["stockout_freq_pct"] = (grouped["stockout_freq_pct"] * 100).round(1)
    at_risk = grouped[grouped["days_of_cover"] <= threshold_days].sort_values("days_of_cover")
    return at_risk.round(2).to_dict(orient="records")
