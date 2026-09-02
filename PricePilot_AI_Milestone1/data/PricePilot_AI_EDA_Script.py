"""
PricePilot AI - Complete Exploratory Data Analysis (EDA) Script
Integrates 4 Kaggle datasets:
1. Amazon Product Pricing (MSRP, Taxonomy)
2. Retail Price Optimization (Competitor Pricing, Elasticity)
3. Favorita Store Sales (Daily Time-Series Demand, Seasonality)
4. Olist E-commerce (Multi-Channel Orders, Logistics)
"""

import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_CSV = os.path.join(DATA_DIR, "processed", "integrated_pricing_demand_dataset.csv")
PLOTS_DIR = os.path.join(DATA_DIR, "plots")
os.makedirs(PLOTS_DIR, exist_ok=True)

print("=" * 70)
print(" PricePilot AI: 4-Kaggle Dataset EDA & Financial Analysis Engine ")
print("=" * 70)

# Load data
df = pd.read_csv(PROCESSED_CSV)
df["date"] = pd.to_datetime(df["date"])

print(f"\n[1] DATASET OVERVIEW:")
print(f" - Total Time-Series Records: {len(df):,}")
print(f" - Total Features: {len(df.columns)}")
print(f" - Unique SKUs: {df['product_id'].nunique()}")
print(f" - Date Range: {df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}")
print(f" - Total Portfolio Revenue: ${df['revenue'].sum():,.2f}")
print(f" - Total Units Sold: {df['units_sold'].sum():,}")
print(f" - Total Gross Profit: ${df['gross_profit'].sum():,.2f}")
print(f" - Average Profit Margin: {df['profit_margin_pct'].mean():.2f}%")

print("\n[2] CATEGORY FINANCIAL SUMMARY:")
cat_summary = df.groupby("category").agg({
    "revenue": "sum",
    "gross_profit": "sum",
    "units_sold": "sum",
    "profit_margin_pct": "mean",
    "current_price": "mean"
}).round(2)
cat_summary.columns = ["Total Revenue ($)", "Gross Profit ($)", "Units Sold", "Mean Margin (%)", "Avg Price ($)"]
print(cat_summary.sort_values(by="Total Revenue ($)", ascending=False).to_string())

print("\n[3] PRICE ELASTICITY COEFFICIENTS (Log-Log Regression):")
elasticity_list = []
for pid in df["product_id"].unique():
    sub = df[(df["product_id"] == pid) & (df["units_sold"] > 0)]
    log_p = np.log(sub["current_price"])
    log_q = np.log(sub["units_sold"])
    slope, intercept, r_val, p_val, std_err = stats.linregress(log_p, log_q)
    elasticity_list.append({
        "SKU": pid,
        "Category": sub["category"].iloc[0],
        "Elasticity": round(slope, 2),
        "R2": round(r_val**2, 3),
        "Sensitivity": "Highly Elastic" if abs(slope) > 2.0 else ("Elastic" if abs(slope) > 1.5 else "Inelastic")
    })
df_elas = pd.DataFrame(elasticity_list).sort_values(by="Elasticity")
print(df_elas.to_string(index=False))

print("\n[4] PROMOTIONAL & SEASONAL DEMAND LIFTS:")
p_lift = df.groupby("is_promotion")["units_sold"].mean()
h_lift = df.groupby("is_holiday")["units_sold"].mean()
print(f" - Promo Active Lift: +{((p_lift[1]-p_lift[0])/p_lift[0])*100:.1f}%")
print(f" - Holiday Lift: +{((h_lift[1]-h_lift[0])/h_lift[0])*100:.1f}%")

print("\n[5] GENERATING VISUAL EDA PLOTS...")
# Plot 1: Elasticity
fig, ax = plt.subplots(figsize=(10, 6), dpi=200)
for cat in df["category"].unique():
    sub = df[df["category"] == cat]
    sns.regplot(data=sub, x="current_price", y="units_sold", scatter_kws={"alpha": 0.35}, line_kws={"linewidth": 2}, label=cat, ax=ax)
ax.set_title("Price vs. Daily Demand Elasticity Curves by Category", fontweight="bold")
ax.set_xlabel("Price ($)")
ax.set_ylabel("Units Sold")
ax.legend()
fig.savefig(os.path.join(PLOTS_DIR, "01_price_vs_demand_elasticity.png"), bbox_inches="tight")
plt.close()

# Plot 2: Competitors
fig, ax = plt.subplots(figsize=(10, 5), dpi=200)
sns.histplot(df["price_diff_vs_comp_avg"], kde=True, color="#059669", ax=ax, bins=30)
ax.axvline(0, color="red", linestyle="--", label="Market Parity")
ax.set_title("Price Difference Distribution ($) vs Market Average", fontweight="bold")
ax.set_xlabel("Price Difference ($)")
ax.legend()
fig.savefig(os.path.join(PLOTS_DIR, "02_competitor_price_benchmarks.png"), bbox_inches="tight")
plt.close()

print(" -> Plots saved in:", PLOTS_DIR)
print("=" * 70)
print(" [SUCCESS] EDA Execution Completed Successfully! ")
print("=" * 70)
