import pandas as pd

# Load processed dataset
df = pd.read_csv("data/processed/clean_sales_data.csv")

print("Dataset loaded successfully!")
print("Original Shape:", df.shape)

# Convert Date to datetime
df["Date"] = pd.to_datetime(df["Date"])

# -------------------------------
# 1. Create Date Features
# -------------------------------

df["Year"] = df["Date"].dt.year
df["Month"] = df["Date"].dt.month
df["Day"] = df["Date"].dt.day
df["DayOfWeek"] = df["Date"].dt.dayofweek

print("\nDate features created:")
print("Year, Month, Day, DayOfWeek")

# -------------------------------
# 2. Create Pricing Features
# -------------------------------

df["Price Difference"] = (
    df["Price"] - df["Competitor Pricing"]
)

df["Price Ratio"] = (
    df["Price"] / df["Competitor Pricing"]
)

print("\nPricing features created:")
print("Price Difference")
print("Price Ratio")

# -------------------------------
# 3. Encode Categorical Columns
# -------------------------------

categorical_columns = [
    "Category",
    "Region",
    "Weather Condition",
    "Seasonality"
]

df = pd.get_dummies(
    df,
    columns=categorical_columns,
    drop_first=True
)

print("\nCategorical variables encoded.")

# -------------------------------
# 4. Check Result
# -------------------------------

print("\nFinal Shape:", df.shape)

print("\nFinal Columns:")
print(df.columns.tolist())

# -------------------------------
# 5. Save ML-ready Dataset
# -------------------------------

df.to_csv(
    "data/processed/ml_ready_data.csv",
    index=False
)

print("\nML-ready dataset saved successfully!")
print("Location: data/processed/ml_ready_data.csv")