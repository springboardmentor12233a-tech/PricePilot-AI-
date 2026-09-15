"""
PricePilot AI — Milestone 2
KPI Extractor & Business Intelligence Engine
=============================================
Computes real business KPIs from the integrated dataset:
  - Revenue growth (monthly, quarterly, YoY)
  - Profit over time
  - Demand elasticity KPIs
  - Competitor gap analysis
  - Category performance
  - Promotion ROI
Outputs JSON for the dashboard and CSV for reporting.
"""

import os, json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns

# ─── Paths ─────────────────────────────────────────────────────────
BASE    = os.path.dirname(os.path.abspath(__file__))
DATA    = os.path.join(BASE, "..", "data", "processed", "integrated_pricing_demand_dataset.csv")
OUT     = os.path.join(BASE, "..", "docs")
PLOT    = os.path.join(BASE, "..", "ml", "plots")
KPI_OUT = os.path.join(BASE, "..", "docs", "kpis.json")
os.makedirs(OUT, exist_ok=True)

df = pd.read_csv(DATA)
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df["year"]  = df["date"].dt.year
df["month"] = df["date"].dt.month
df["ym"]    = df["date"].dt.to_period("M").astype(str)
df["yq"]    = df["date"].dt.to_period("Q").astype(str)

# ─── Core KPIs ─────────────────────────────────────────────────────
total_revenue  = float(df["revenue"].sum())
total_profit   = float(df["gross_profit"].sum())
avg_margin     = float(df["profit_margin_pct"].mean())
total_units    = int(df["units_sold"].sum())
avg_price      = float(df["current_price"].mean())
avg_rating     = float(df["product_rating"].mean())
promo_rev_lift = float(df.groupby("is_promotion")["revenue"].mean().pct_change().iloc[-1] * 100)
holiday_lift   = float(df.groupby("is_holiday")["units_sold"].mean().pct_change().iloc[-1] * 100)

# ─── Monthly Revenue & Profit ──────────────────────────────────────
monthly = df.groupby("ym").agg(
    revenue=("revenue","sum"),
    profit=("gross_profit","sum"),
    units=("units_sold","sum"),
).reset_index().sort_values("ym")
monthly["revenue_growth"] = monthly["revenue"].pct_change() * 100

# ─── Quarterly Revenue ─────────────────────────────────────────────
quarterly = df.groupby("yq").agg(
    revenue=("revenue","sum"),
    profit=("gross_profit","sum"),
    margin=("profit_margin_pct","mean"),
).reset_index().sort_values("yq")

# ─── Category KPIs ────────────────────────────────────────────────
cat = df.groupby("category").agg(
    revenue=("revenue","sum"),
    profit=("gross_profit","sum"),
    units=("units_sold","sum"),
    avg_price=("current_price","mean"),
    margin=("profit_margin_pct","mean"),
    rating=("product_rating","mean"),
).reset_index().sort_values("revenue", ascending=False)

# ─── Promo vs Non-Promo ────────────────────────────────────────────
promo = df.groupby("is_promotion").agg(
    revenue=("revenue","sum"),
    units=("units_sold","sum"),
    margin=("profit_margin_pct","mean"),
).reset_index()

# ─── Competitor Gap ────────────────────────────────────────────────
df["price_advantage"] = df["comp_avg_price"] - df["current_price"]
comp_gap = df.groupby("category")["price_advantage"].mean().reset_index()

# ─── Holiday vs Normal ─────────────────────────────────────────────
holiday = df.groupby("is_holiday").agg(
    revenue=("revenue","sum"),
    units=("units_sold","sum"),
).reset_index()

# ─── Top Products ──────────────────────────────────────────────────
top_products = df.groupby("product_name").agg(
    revenue=("revenue","sum"),
    profit=("gross_profit","sum"),
    units=("units_sold","sum"),
    avg_price=("current_price","mean"),
    margin=("profit_margin_pct","mean"),
).reset_index().sort_values("revenue", ascending=False).head(10)

# ─── Assemble KPI JSON ─────────────────────────────────────────────
kpis = {
    "summary": {
        "total_revenue":      round(total_revenue, 2),
        "total_profit":       round(total_profit, 2),
        "avg_margin_pct":     round(avg_margin, 2),
        "total_units_sold":   total_units,
        "avg_selling_price":  round(avg_price, 2),
        "avg_product_rating": round(avg_rating, 2),
        "promo_revenue_lift_pct":  round(promo_rev_lift, 2),
        "holiday_demand_lift_pct": round(holiday_lift, 2),
        "num_products":       int(df["product_name"].nunique()),
        "num_categories":     int(df["category"].nunique()),
        "date_range":         f"{df['date'].min().date()} to {df['date'].max().date()}",
    },
    "monthly_revenue": monthly[["ym","revenue","profit","units","revenue_growth"]].fillna(0).to_dict(orient="records"),
    "quarterly_revenue": quarterly.to_dict(orient="records"),
    "category_kpis":  cat.round(2).to_dict(orient="records"),
    "promo_kpis":     promo.round(2).to_dict(orient="records"),
    "competitor_gap": comp_gap.round(2).to_dict(orient="records"),
    "holiday_kpis":   holiday.round(2).to_dict(orient="records"),
    "top_products":   top_products.round(2).to_dict(orient="records"),
}

with open(KPI_OUT, "w") as f:
    json.dump(kpis, f, indent=2)
print(f"[OK] KPI JSON saved → {KPI_OUT}")

# ─── KPI PLOTS ─────────────────────────────────────────────────────
plt.style.use("dark_background")
BG, CARD = "#0f172a", "#1e293b"
C = ["#6366f1","#10b981","#f59e0b","#ec4899","#06b6d4","#8b5cf6","#34d399"]

# ── Plot A: Monthly Revenue & Profit ──────────────────────────────
fig, ax1 = plt.subplots(figsize=(16,5))
fig.patch.set_facecolor(BG); ax1.set_facecolor(CARD)
x = range(len(monthly))
ax1.fill_between(x, monthly["revenue"]/1e6, alpha=0.25, color=C[0])
ax1.plot(x, monthly["revenue"]/1e6, color=C[0], lw=2.5, label="Revenue ($M)")
ax2 = ax1.twinx()
ax2.fill_between(x, monthly["profit"]/1e6, alpha=0.15, color=C[1])
ax2.plot(x, monthly["profit"]/1e6, color=C[1], lw=2, linestyle="--", label="Gross Profit ($M)")
ax2.set_facecolor(CARD)
ax1.set_xticks(list(x)[::2]); ax1.set_xticklabels(list(monthly["ym"])[::2], rotation=35, ha="right", fontsize=8, color="#94a3b8")
ax1.set_ylabel("Revenue ($M)", color=C[0]); ax2.set_ylabel("Gross Profit ($M)", color=C[1])
ax1.tick_params(colors="white"); ax2.tick_params(colors="white")
for sp in ax1.spines.values(): sp.set_color("#334155")
for sp in ax2.spines.values(): sp.set_color("#334155")
lines1, labs1 = ax1.get_legend_handles_labels(); lines2, labs2 = ax2.get_legend_handles_labels()
ax1.legend(lines1+lines2, labs1+labs2, facecolor=CARD, edgecolor="#334155", labelcolor="white", fontsize=10)
ax1.set_title("Monthly Revenue & Gross Profit Trend", fontsize=14, fontweight="bold", color="white", pad=12)
plt.tight_layout()
plt.savefig(os.path.join(PLOT,"07_monthly_revenue_profit.png"), dpi=150, bbox_inches="tight", facecolor=BG); plt.close()
print("[OK] Plot 07: Monthly Revenue & Profit")

# ── Plot B: Category Revenue Comparison ───────────────────────────
fig, axes = plt.subplots(1,2,figsize=(16,6)); fig.patch.set_facecolor(BG)
axes[0].set_facecolor(CARD); axes[1].set_facecolor(CARD)
colors_bar = C[:len(cat)]
bars = axes[0].bar(cat["category"], cat["revenue"]/1e6, color=colors_bar, edgecolor="none", width=0.55)
axes[0].set_ylabel("Revenue ($M)", color="white"); axes[0].set_title("Revenue by Category", color="white", fontweight="bold")
axes[0].tick_params(colors="white"); axes[0].set_xticklabels(cat["category"], rotation=20, ha="right", fontsize=9, color="white")
for sp in axes[0].spines.values(): sp.set_color("#334155")
for bar, val in zip(bars, cat["revenue"]):
    axes[0].text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.02, f"${val/1e6:.1f}M", ha="center", color="white", fontsize=9)
wedges, texts, auts = axes[1].pie(cat["profit"], labels=cat["category"], colors=C[:len(cat)],
    autopct="%1.1f%%", pctdistance=0.82, startangle=90,
    textprops={"color":"white","fontsize":9}, wedgeprops={"edgecolor":"#0f172a","linewidth":2})
for aut in auts: aut.set_color("white"); aut.set_fontsize(8)
axes[1].set_title("Gross Profit Share by Category", color="white", fontweight="bold")
fig.suptitle("Category Performance KPIs", fontsize=14, fontweight="bold", color="white")
plt.tight_layout(); plt.savefig(os.path.join(PLOT,"08_category_revenue_profit.png"), dpi=150, bbox_inches="tight", facecolor=BG); plt.close()
print("[OK] Plot 08: Category Revenue & Profit")

# ── Plot C: Quarterly Revenue Growth ──────────────────────────────
fig, ax = plt.subplots(figsize=(14,5)); fig.patch.set_facecolor(BG); ax.set_facecolor(CARD)
q_rev = quarterly["revenue"]/1e6
q_growth = quarterly["revenue"].pct_change()*100
ax2 = ax.twinx()
bars = ax.bar(range(len(quarterly)), q_rev, color=C[0], alpha=0.7, edgecolor="none", width=0.6)
ax2.plot(range(len(quarterly)), q_growth, color=C[1], lw=2.5, marker="o", markersize=5, label="QoQ Growth %")
ax2.axhline(0, color="#475569", lw=1, linestyle="--")
ax.set_xticks(range(len(quarterly))); ax.set_xticklabels(quarterly["yq"], rotation=30, ha="right", fontsize=9, color="white")
ax.set_ylabel("Revenue ($M)", color=C[0]); ax2.set_ylabel("QoQ Growth (%)", color=C[1])
ax.tick_params(colors="white"); ax2.tick_params(colors="white")
for sp in ax.spines.values(): sp.set_color("#334155")
for sp in ax2.spines.values(): sp.set_color("#334155")
ax2.legend(facecolor=CARD, edgecolor="#334155", labelcolor="white")
ax.set_title("Quarterly Revenue & Growth Rate", fontsize=14, fontweight="bold", color="white")
plt.tight_layout(); plt.savefig(os.path.join(PLOT,"09_quarterly_revenue_growth.png"), dpi=150, bbox_inches="tight", facecolor=BG); plt.close()
print("[OK] Plot 09: Quarterly Revenue Growth")

# ── Plot D: Top 10 Products by Revenue ────────────────────────────
fig, ax = plt.subplots(figsize=(13,7)); fig.patch.set_facecolor(BG); ax.set_facecolor(CARD)
clrs = plt.cm.plasma(np.linspace(0.25,0.85,len(top_products)))
bars = ax.barh(top_products["product_name"], top_products["revenue"]/1e3, color=clrs, edgecolor="none")
ax.set_xlabel("Revenue ($K)", color="white"); ax.set_title("Top 10 Products by Revenue", fontsize=14, fontweight="bold", color="white")
ax.tick_params(colors="white")
for sp in ax.spines.values(): sp.set_color("#334155")
for bar, val in zip(bars, top_products["revenue"]):
    ax.text(bar.get_width()+0.5, bar.get_y()+bar.get_height()/2, f"${val/1e3:.1f}K", va="center", color="white", fontsize=9)
plt.tight_layout(); plt.savefig(os.path.join(PLOT,"10_top_products_revenue.png"), dpi=150, bbox_inches="tight", facecolor=BG); plt.close()
print("[OK] Plot 10: Top Products Revenue")

# ── Plot E: Promo vs Non-Promo KPI ────────────────────────────────
fig, axes = plt.subplots(1,3,figsize=(16,5)); fig.patch.set_facecolor(BG)
for ax in axes: ax.set_facecolor(CARD)
labels = ["No Promo","Promotion"]
for ax, col, title, color in zip(axes,
    ["revenue","units","margin"],
    ["Revenue ($M)","Units Sold","Avg Margin %"],
    [C[0],C[1],C[2]]):
    vals = promo[col]/1e6 if col=="revenue" else promo[col]
    b = ax.bar(labels, vals, color=[color,color], alpha=[0.5,1.0], edgecolor="none", width=0.45)
    ax.set_title(title, color="white", fontweight="bold", fontsize=11)
    ax.tick_params(colors="white")
    for sp in ax.spines.values(): sp.set_color("#334155")
    for bar, v in zip(b, vals):
        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()*1.01, f"{v:.1f}", ha="center", color="white", fontsize=10)
fig.suptitle("Promotion Impact on KPIs", fontsize=14, fontweight="bold", color="white")
plt.tight_layout(); plt.savefig(os.path.join(PLOT,"11_promotion_kpi_impact.png"), dpi=150, bbox_inches="tight", facecolor=BG); plt.close()
print("[OK] Plot 11: Promotion KPI Impact")

# ── Plot F: Competitor Price Gap by Category ───────────────────────
fig, ax = plt.subplots(figsize=(12,5)); fig.patch.set_facecolor(BG); ax.set_facecolor(CARD)
barcolors = [C[1] if v>=0 else C[3] for v in comp_gap["price_advantage"]]
ax.bar(comp_gap["category"], comp_gap["price_advantage"], color=barcolors, edgecolor="none", width=0.5)
ax.axhline(0, color="#94a3b8", lw=1.5, linestyle="--")
ax.set_ylabel("Avg Price Advantage ($)", color="white")
ax.set_title("Competitor Price Gap by Category (+ = We are cheaper)", fontsize=13, fontweight="bold", color="white")
ax.tick_params(colors="white"); ax.set_xticklabels(comp_gap["category"], rotation=20, ha="right", color="white")
for sp in ax.spines.values(): sp.set_color("#334155")
plt.tight_layout(); plt.savefig(os.path.join(PLOT,"12_competitor_price_gap.png"), dpi=150, bbox_inches="tight", facecolor=BG); plt.close()
print("[OK] Plot 12: Competitor Price Gap")

print(f"\n{'='*60}")
print("  KPI SUMMARY")
print(f"{'='*60}")
for k,v in kpis["summary"].items():
    print(f"  {k:35s} {v}")
print("="*60)
