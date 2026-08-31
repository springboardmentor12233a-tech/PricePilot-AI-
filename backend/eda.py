#Load the processed dataset

import pandas as pd

df = pd.read_csv("data/processed/clean_sales_data.csv")

print("Dataset loaded successfully!")
print("Shape:", df.shape)
df = pd.read_csv("data/processed/clean_sales_data.csv")

# Basic EDA

print("\nDataset Information:")
print(df.info())

print("\nStatistical Summary:")
print(df.describe())

print("\nMissing Values:")
print(df.isnull().sum())

print("\nDuplicate Rows:")
print(df.duplicated().sum())

# Analyze categories

print("\nCategories:")
print(df["Category"].value_counts())

print("\nRegions:")
print(df["Region"].value_counts())

print("\nWeather Conditions:")
print(df["Weather Condition"].value_counts())

print("\nSeasonality:")
print(df["Seasonality"].value_counts())

# Analyze demand

print("\nAverage Demand by Category:")
print(df.groupby("Category")["Demand"].mean())

print("\nAverage Demand by Region:")
print(df.groupby("Region")["Demand"].mean())

print("\nAverage Demand by Weather:")
print(df.groupby("Weather Condition")["Demand"].mean())

print("\nAverage Demand by Seasonality:")
print(df.groupby("Seasonality")["Demand"].mean())

# Analyze price

print("\nAverage Price by Category:")
print(df.groupby("Category")["Price"].mean())

print("\nAverage Price by Region:")
print(df.groupby("Region")["Price"].mean())

# Analyze discounts and promotions

print("\nAverage Demand by Discount:")
print(df.groupby("Discount")["Demand"].mean())

# Analyze competitor pricing

print("\nAverage Demand by Promotion:")
print(df.groupby("Promotion")["Demand"].mean())
print("\nAverage Demand by Competitor Pricing:")
print(
    df.groupby("Competitor Pricing")["Demand"].mean().head(20)
)

# Create correlation analysis

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

print("\nCorrelation Matrix:")
print(correlation)

# Create your first visualization

import matplotlib.pyplot as plt

plt.figure(figsize=(8, 5))

plt.scatter(df["Price"], df["Demand"], alpha=0.3)

plt.xlabel("Price")
plt.ylabel("Demand")
plt.title("Price vs Demand")

plt.show()

# Create another graph

plt.figure(figsize=(8, 5))

df.groupby("Category")["Demand"].mean().plot(kind="bar")

plt.xlabel("Category")
plt.ylabel("Average Demand")
plt.title("Average Demand by Category")

plt.tight_layout()
plt.show()

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

print("\nCorrelation with Demand:")
print(
    df[numeric_columns]
    .corr()["Demand"]
    .sort_values(ascending=False)
)

# Price vs Demand

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

# Competitor Pricing vs Your Price

df["Price Difference"] = (
    df["Price"] - df["Competitor Pricing"]
)
print("\nPrice Difference Statistics:")
print(df["Price Difference"].describe())

# Discount vs Demand

print("\nAverage Demand by Discount:")
print(
    df.groupby("Discount")["Demand"]
    .mean()
    .sort_index()
)
plt.figure(figsize=(8, 5))

df.groupby("Discount")["Demand"].mean().plot(kind="bar")

plt.xlabel("Discount")
plt.ylabel("Average Demand")
plt.title("Average Demand by Discount")

plt.tight_layout()
plt.show()

# Promotion vs Demand

print("\nAverage Demand by Promotion:")
print(
    df.groupby("Promotion")["Demand"]
    .mean()
)
print("\nAverage Demand by Promotion:")
print(
    df.groupby("Promotion")["Demand"]
    .mean()
)

# Category vs Demand

print("\nAverage Demand by Category:")
print(
    df.groupby("Category")["Demand"]
    .mean()
    .sort_values(ascending=False)
)
plt.figure(figsize=(8, 5))

df.groupby("Category")["Demand"].mean().sort_values().plot(kind="barh")

plt.xlabel("Average Demand")
plt.ylabel("Category")
plt.title("Average Demand by Category")

plt.tight_layout()
plt.show()

# Region vs Demand

print("\nAverage Demand by Region:")
print(
    df.groupby("Region")["Demand"]
    .mean()
    .sort_values(ascending=False)
)

# Seasonality vs Demand

print("\nAverage Demand by Seasonality:")
print(
    df.groupby("Seasonality")["Demand"]
    .mean()
    .sort_values(ascending=False)
)

# Inventory vs Demand

print("\nInventory and Demand Correlation:")

print(
    df["Inventory Level"].corr(df["Demand"])
)
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

print("\n===== EDA SUMMARY =====")

print("Dataset Shape:", df.shape)

print(
    "Average Demand:",
    df["Demand"].mean()
)

print(
    "Average Price:",
    df["Price"].mean()
)

print(
    "Average Competitor Price:",
    df["Competitor Pricing"].mean()
)

print(
    "Average Inventory:",
    df["Inventory Level"].mean()
)

print(
    "Price-Demand Correlation:",
    df["Price"].corr(df["Demand"])
)

print(
    "Competitor Price-Demand Correlation:",
    df["Competitor Pricing"].corr(df["Demand"])
)

print(
    "Inventory-Demand Correlation:",
    df["Inventory Level"].corr(df["Demand"])
)