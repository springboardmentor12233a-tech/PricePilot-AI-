import pandas as pd

# Load raw dataset
df = pd.read_csv("data/raw/sales_data.csv")

print("Dataset loaded successfully!")
print("Shape:", df.shape)

# Convert Date column to datetime
df["Date"] = pd.to_datetime(df["Date"])

print("Date column converted successfully!")

# Check missing values
print("\nMissing values:")
print(df.isnull().sum())

# Check duplicate rows
print("\nDuplicate rows:", df.duplicated().sum())

# Save processed dataset
df.to_csv("data/processed/clean_sales_data.csv", index=False)

print("\nProcessed dataset saved successfully!")
print("Location: data/processed/clean_sales_data.csv")

print("\n--- Missing Values ---")
print(df.isnull().sum())

print("\n--- Duplicate Rows ---")
print("Duplicates:", df.duplicated().sum())

print("\n--- Categorical Values ---")

print("Categories:")
print(df["Category"].unique())

print("\nRegions:")
print(df["Region"].unique())

print("\nWeather Conditions:")
print(df["Weather Condition"].unique())

print("\nSeasonality:")
print(df["Seasonality"].unique())

print("\nPromotion values:")
print(df["Promotion"].unique())

print("\nEpidemic values:")
print(df["Epidemic"].unique())

print("\n--- Negative Values Check ---")

print("Negative Inventory:",
      (df["Inventory Level"] < 0).sum())

print("Negative Units Sold:",
      (df["Units Sold"] < 0).sum())

print("Negative Units Ordered:",
      (df["Units Ordered"] < 0).sum())

print("Negative Price:",
      (df["Price"] < 0).sum())

print("Negative Competitor Pricing:",
      (df["Competitor Pricing"] < 0).sum())

print("Negative Demand:",
      (df["Demand"] < 0).sum())

df.to_csv("data/processed/clean_sales_data.csv", index=False)

print("\nProcessed dataset saved successfully!")

processed_df = pd.read_csv("data/processed/clean_sales_data.csv")

print("Processed dataset shape:", processed_df.shape)
print(processed_df.head())