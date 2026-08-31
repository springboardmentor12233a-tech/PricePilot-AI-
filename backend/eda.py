# ==========================================
# PricePilot AI - Exploratory Data Analysis
# ==========================================

import pandas as pd
import matplotlib.pyplot as plt


# ------------------------------------------
# 1. Load the processed dataset
# ------------------------------------------

df = pd.read_csv("data/processed/clean_sales_data.csv")

print("Dataset loaded successfully!")
print("Shape:", df.shape)


# ------------------------------------------
# 2. Basic Dataset Information
# ------------------------------------------

print("\n===== DATASET INFORMATION =====")
df.info()


# ------------------------------------------
# 3. Statistical Summary
# ------------------------------------------

print("\n===== STATISTICAL SUMMARY =====")
print(df.describe())


# ------------------------------------------
# 4. Missing Values
# ------------------------------------------

print("\n===== MISSING VALUES =====")
print(df.isnull().sum())


# ------------------------------------------
# 5. Duplicate Rows
# ------------------------------------------

print("\n===== DUPLICATE ROWS =====")
print("Duplicates:", df.duplicated().sum())


# ------------------------------------------
# 6. Categorical Analysis
# ------------------------------------------

print("\n===== CATEGORICAL ANALYSIS =====")

print("\nCategories:")
print(df["Category"].value_counts())

print("\nRegions:")
print(df["Region"].value_counts())

print("\nWeather Conditions:")
print(df["Weather Condition"].value_counts())

print("\nSeasonality:")
print(df["Seasonality"].value_counts())


# ------------------------------------------
# 7. Demand Analysis
# ------------------------------------------

print("\n===== DEMAND ANALYSIS =====")

print("\nAverage Demand by Category:")
print(
    df.groupby("Category")["Demand"]
    .mean()
    .sort_values(ascending=False)
)

print("\nAverage Demand by Region:")
print(
    df.groupby("Region")["Demand"]
    .mean()
    .sort_values(ascending=False)
)

print("\nAverage Demand by Weather:")
print(
    df.groupby("Weather Condition")["Demand"]
    .mean()
    .sort_values(ascending=False)
)

print("\nAverage Demand by Seasonality:")
print(
    df.groupby("Seasonality")["Demand"]
    .mean()
    .sort_values(ascending=False)
)


# ------------------------------------------
# 8. Price Analysis
# ------------------------------------------

print("\n===== PRICE ANALYSIS =====")

print("\nAverage Price by Category:")
print(
    df.groupby("Category")["Price"]
    .mean()
    .sort_values(ascending=False)
)

print("\nAverage Price by Region:")
print(
    df.groupby("Region")["Price"]
    .mean()
    .sort_values(ascending=False)
)


# ------------------------------------------
# 9. Discount Analysis
# ------------------------------------------

print("\n===== DISCOUNT ANALYSIS =====")

print("\nAverage Demand by Discount:")
print(
    df.groupby("Discount")["Demand"]
    .mean()
    .sort_index()
)


# ------------------------------------------
# 10. Promotion Analysis
# ------------------------------------------

print("\n===== PROMOTION ANALYSIS =====")

print("\nAverage Demand by Promotion:")
print(
    df.groupby("Promotion")["Demand"]
    .mean()
)


# ------------------------------------------
# 11. Competitor Pricing Analysis
# ------------------------------------------

print("\n===== COMPETITOR PRICING ANALYSIS =====")

print("\nAverage Demand by Competitor Pricing:")
print(
    df.groupby("Competitor Pricing")["Demand"]
    .mean()
    .head(20)
)


# ------------------------------------------
# 12. Price Difference
# ------------------------------------------

df["Price Difference"] = (
    df["Price"] - df["Competitor Pricing"]
)

print("\n===== PRICE DIFFERENCE =====")

print(
    df["Price Difference"].describe()
)


# ------------------------------------------
# 13. Correlation Analysis
# ------------------------------------------

numeric_columns = [
    "Inventory Level",
    "Units Sold",
    "Units Ordered",
    "Price",
    "Discount",
    "Promotion",
    "Competitor Pricing",
    "Epidemic",
    "Demand"
]

correlation = df[numeric_columns].corr()

print("\n===== CORRELATION MATRIX =====")
print(correlation)


# ------------------------------------------
# 14. Correlation with Demand
# ------------------------------------------

print("\n===== CORRELATION WITH DEMAND =====")

demand_correlation = (
    correlation["Demand"]
    .sort_values(ascending=False)
)

print(demand_correlation)


# ------------------------------------------
# 15. Visualization - Price vs Demand
# ------------------------------------------

plt.figure(figsize=(8, 5))

plt.scatter(
    df["Price"],
    df["Demand"],
    alpha=0.3
)

plt.xlabel("Price")
plt.ylabel("Demand")
plt.title("Price vs Demand")

plt.tight_layout()
plt.show()


# ------------------------------------------
# 16. Visualization - Category vs Demand
# ------------------------------------------

plt.figure(figsize=(8, 5))

(
    df.groupby("Category")["Demand"]
    .mean()
    .sort_values()
    .plot(kind="barh")
)

plt.xlabel("Average Demand")
plt.ylabel("Category")
plt.title("Average Demand by Category")

plt.tight_layout()
plt.show()


# ------------------------------------------
# 17. Visualization - Discount vs Demand
# ------------------------------------------

plt.figure(figsize=(8, 5))

(
    df.groupby("Discount")["Demand"]
    .mean()
    .sort_index()
    .plot(kind="bar")
)

plt.xlabel("Discount")
plt.ylabel("Average Demand")
plt.title("Average Demand by Discount")

plt.tight_layout()
plt.show()


# ------------------------------------------
# 18. Visualization - Inventory vs Demand
# ------------------------------------------

plt.figure(figsize=(8, 5))

plt.scatter(
    df["Inventory Level"],
    df["Demand"],
    alpha=0.3
)

plt.xlabel("Inventory Level")
plt.ylabel("Demand")
plt.title("Inventory Level vs Demand")

plt.tight_layout()
plt.show()


# ------------------------------------------
# 19. Final EDA Summary
# ------------------------------------------

print("\n====================================")
print("          EDA SUMMARY")
print("====================================")

print("\nDataset Shape:")
print(df.shape)

print("\nAverage Demand:")
print(df["Demand"].mean())

print("\nAverage Price:")
print(df["Price"].mean())

print("\nAverage Competitor Price:")
print(df["Competitor Pricing"].mean())

print("\nAverage Inventory:")
print(df["Inventory Level"].mean())

print("\nPrice-Demand Correlation:")
print(df["Price"].corr(df["Demand"]))

print("\nCompetitor Price-Demand Correlation:")
print(
    df["Competitor Pricing"].corr(df["Demand"])
)

print("\nInventory-Demand Correlation:")
print(
    df["Inventory Level"].corr(df["Demand"])
)

print("\nEDA completed successfully!")