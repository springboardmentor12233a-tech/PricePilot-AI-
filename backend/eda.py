"""
Exploratory Data Analysis (EDA) script for PricePilot AI.

Run this yourself with:
    python eda.py

It reads the 3 raw datasets from data/raw/, prints key stats to your
terminal, and saves 3 PNG chart images in the same folder as this script.

WHY we're doing this BEFORE building the demand forecasting model
(teaching note): you should never train a model on data you haven't
looked at. This script answers 3 questions for each dataset:
  1. Is anything missing or broken? (missing values, duplicates)
  2. What's the actual shape of the data? (distributions, ranges)
  3. Does it show the patterns we expect? (e.g. does demand actually
     vary by season -- if not, "demand forecasting" has nothing real
     to learn from)
"""

import pandas as pd
import matplotlib
matplotlib.use("Agg")  # renders to file instead of trying to open a window
import matplotlib.pyplot as plt

plt.style.use("seaborn-v0_8-whitegrid")

DATA_DIR = "../data/raw"  # run this script from inside backend/, adjust if needed


def eda_retail_price():
    print("=" * 60)
    print("DATASET 1: retail_price.csv")
    print("=" * 60)

    df = pd.read_csv(f"{DATA_DIR}/retail_price.csv")
    print("Shape:", df.shape)
    missing = df.isnull().sum()
    print("\nMissing values:\n", missing[missing > 0] if missing.sum() > 0 else "None found")
    print("\nunit_price stats:\n", df["unit_price"].describe())
    print("\nProduct categories:", df["product_category_name"].nunique())
    print(df["product_category_name"].value_counts())

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.2))

    axes[0].hist(df["unit_price"], bins=30, color="#2E5FA1", edgecolor="white")
    axes[0].set_title("Unit Price Distribution")
    axes[0].set_xlabel("Unit Price ($)")
    axes[0].set_ylabel("Number of Products")

    df["comp_avg"] = df[["comp_1", "comp_2", "comp_3"]].mean(axis=1)
    axes[1].scatter(df["unit_price"], df["comp_avg"], alpha=0.5, color="#C0392B", s=18)
    lims = [0, max(df["unit_price"].max(), df["comp_avg"].max())]
    axes[1].plot(lims, lims, "k--", alpha=0.4, linewidth=1, label="Equal price line")
    axes[1].set_title("Our Price vs Avg Competitor Price")
    axes[1].set_xlabel("Our Unit Price ($)")
    axes[1].set_ylabel("Avg Competitor Price ($)")
    axes[1].legend()

    plt.tight_layout()
    plt.savefig("eda_retail_price.png", dpi=150)
    plt.close()

    corr = df["unit_price"].corr(df["comp_avg"])
    print(f"\nCorrelation (our price vs competitor avg): {corr:.3f}")
    print("Saved chart: eda_retail_price.png\n")


def eda_favorita():
    print("=" * 60)
    print("DATASET 2: favorita_sales.csv")
    print("=" * 60)

    df = pd.read_csv(f"{DATA_DIR}/favorita_sales.csv")
    if "Unnamed: 17" in df.columns:
        df = df.drop(columns=["Unnamed: 17"])
    df["date"] = pd.to_datetime(df["date"])

    print("Shape:", df.shape)
    missing = df.isnull().sum()
    print("\nMissing values:\n", missing[missing > 0] if missing.sum() > 0 else "None found")
    print("\nsales stats:\n", df["sales"].describe())
    print("\nDate range:", df["date"].min(), "to", df["date"].max())

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.2))

    daily = df.groupby("date")["sales"].sum()
    axes[0].plot(daily.index, daily.values, color="#2E5FA1", linewidth=0.8)
    axes[0].set_title("Total Daily Sales Over Time")
    axes[0].set_xlabel("Date")
    axes[0].set_ylabel("Total Units Sold")
    axes[0].tick_params(axis="x", rotation=30)

    top_families = df.groupby("family")["sales"].sum().sort_values(ascending=False).head(8)
    axes[1].barh(top_families.index[::-1], top_families.values[::-1], color="#2E8B57")
    axes[1].set_title("Top 8 Product Families by Total Sales")
    axes[1].set_xlabel("Total Units Sold")

    plt.tight_layout()
    plt.savefig("eda_favorita.png", dpi=150)
    plt.close()
    print("Saved chart: eda_favorita.png\n")


def eda_online_retail():
    print("=" * 60)
    print("DATASET 3: online_retail_II.xlsx")
    print("=" * 60)

    frames = [
        pd.read_excel(f"{DATA_DIR}/online_retail_II.xlsx", sheet_name=s)
        for s in ["Year 2009-2010", "Year 2010-2011"]
    ]
    df = pd.concat(frames, ignore_index=True)
    print("Raw shape:", df.shape)
    print("\nMissing values:\n", df.isnull().sum())

    df_clean = df[
        (~df["Invoice"].astype(str).str.startswith("C"))
        & (df["Quantity"] > 0)
        & (df["Price"] > 0)
    ].copy()
    print(f"\nAfter removing cancellations/bad rows: {df_clean.shape}")
    print(f"Rows removed: {df.shape[0] - df_clean.shape[0]}")

    df_clean["InvoiceDate"] = pd.to_datetime(df_clean["InvoiceDate"])
    df_clean["Revenue"] = df_clean["Quantity"] * df_clean["Price"]

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.2))

    monthly = df_clean.set_index("InvoiceDate").resample("ME")["Revenue"].sum()
    axes[0].plot(monthly.index, monthly.values, marker="o", color="#2E5FA1", markersize=3)
    axes[0].set_title("Monthly Revenue Trend")
    axes[0].set_xlabel("Month")
    axes[0].set_ylabel("Revenue (£)")
    axes[0].tick_params(axis="x", rotation=30)

    top_countries = (
        df_clean[df_clean["Country"] != "United Kingdom"]
        .groupby("Country")["Revenue"]
        .sum()
        .sort_values(ascending=False)
        .head(8)
    )
    axes[1].barh(top_countries.index[::-1], top_countries.values[::-1], color="#8E44AD")
    axes[1].set_title("Top 8 Non-UK Countries by Revenue")
    axes[1].set_xlabel("Revenue (£)")

    plt.tight_layout()
    plt.savefig("eda_online_retail.png", dpi=150)
    plt.close()

    total_rev = df_clean["Revenue"].sum()
    uk_share = df_clean[df_clean["Country"] == "United Kingdom"]["Revenue"].sum() / total_rev * 100
    print(f"\nTotal revenue: £{total_rev:,.2f}")
    print(f"UK share of revenue: {uk_share:.1f}%")
    print("Saved chart: eda_online_retail.png\n")


if __name__ == "__main__":
    eda_retail_price()
    eda_favorita()
    eda_online_retail()
    print("Done. 3 PNG charts saved in the current folder.")