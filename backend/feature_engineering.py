import pandas as pd

# ------------------------------------------
# 1. Load processed dataset
# ------------------------------------------

df = pd.read_csv(
    "data/processed/clean_sales_data.csv"
)

print("Dataset loaded successfully!")
print("Original Shape:", df.shape)


# ------------------------------------------
# 2. Convert Date to datetime
# ------------------------------------------

df["Date"] = pd.to_datetime(df["Date"])

print("\nDate column converted successfully.")


# ------------------------------------------
# 3. Create Date Features
# ------------------------------------------

df["Year"] = df["Date"].dt.year
df["Month"] = df["Date"].dt.month
df["Day"] = df["Date"].dt.day
df["DayOfWeek"] = df["Date"].dt.dayofweek

print("\nDate features created:")
print("Year")
print("Month")
print("Day")
print("DayOfWeek")


# ------------------------------------------
# 4. Create Pricing Features
# ------------------------------------------

df["Price Difference"] = (
    df["Price"] - df["Competitor Pricing"]
)

# Avoid division by zero
df["Price Ratio"] = (
    df["Price"] / df["Competitor Pricing"].replace(0, pd.NA)
)

print("\nPricing features created:")
print("Price Difference")
print("Price Ratio")


# ------------------------------------------
# 5. Encode Categorical Variables
# ------------------------------------------

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

print("\nCategorical variables encoded successfully.")


# ------------------------------------------
# 6. Convert Boolean Columns to Integer
# ------------------------------------------

boolean_columns = df.select_dtypes(
    include="bool"
).columns

df[boolean_columns] = (
    df[boolean_columns].astype(int)
)

print("\nBoolean columns converted to integers.")


# ------------------------------------------
# 7. Check Missing Values
# ------------------------------------------

print("\nMissing values after feature engineering:")
print(df.isnull().sum().sum())


# ------------------------------------------
# 8. Check Final Dataset
# ------------------------------------------

print("\nFinal Shape:", df.shape)

print("\nFinal Columns:")
print(df.columns.tolist())


# ------------------------------------------
# 9. Save ML-ready Dataset
# ------------------------------------------

df.to_csv(
    "data/processed/ml_ready_data.csv",
    index=False
)

print("\nML-ready dataset saved successfully!")
print(
    "Location: data/processed/ml_ready_data.csv"
)