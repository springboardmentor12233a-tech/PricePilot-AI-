import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

import pandas as pd
df=pd.read_csv('/content/ecommerce_product_demand.csv')

df.head()

df.info()

df.isnull().sum()

df.dtypes

df['Date'] = pd.to_datetime(df['Date'])

print(df['Category'].unique())
print(df['Sales_Channel'].unique())

df.describe()

df.duplicated().sum()

df['Total_Revenue'] = df['Price'] * df['Demand_Units']
category_summary = df.groupby('Category')[['Demand_Units', 'Total_Revenue']].sum()
print(category_summary)

df.set_index('Date').resample('ME')['Demand_Units'].sum().plot(kind='line', title='Monthly Demand Trend')

plt.figure(figsize=(10, 8))
sns.heatmap(
    df.select_dtypes(include=['float64', 'int64']).corr(),
    annot=True,
    fmt='.2f',
    cmap='coolwarm'
)
plt.title('Feature Correlation Matrix')
plt.show()

df.select_dtypes(include=['float64', 'int64']).corr()['Demand_Units'].sort_values(ascending=False)

df.groupby('Promotion_Flag')['Demand_Units'].mean()

df.groupby('Sales_Channel')['Demand_Units'].sum().plot(kind='bar', color='skyblue', title='Demand by Channel')

df.groupby('Sales_Channel')['Total_Revenue'].sum().plot(kind='pie', autopct='%1.1f%%', title='Revenue Share by Channel')

sns.scatterplot(data=df, x='Discount_Percentage', y='Demand_Units', hue='Promotion_Flag')
plt.title('Discount Percentage vs. Demand Units')
plt.show()
df['Price_Difference']
df['Price_Ratio']
df.groupby('Category')['Return_Rate'].mean().sort_values(ascending=False)

# Compare our price with competitor price

df['Price_Difference'] = (
    df['Price'] - df['Competitor_Price']
).round(2)

df['Price_Ratio'] = (
    df['Price'] / df['Competitor_Price']
).round(4)

df[['Price', 'Competitor_Price', 'Price_Difference', 'Price_Ratio']].head(10)

# 1. Clone the repository
!git clone https://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@github.com/springboardmentor12233a-tech/PricePilot-AI-.git /content/PricePilot-AI-

# 2. Change working directory into the cloned repo
%cd /content/PricePilot-AI-

# 3. Configure Git credentials
!git config --global user.name "srivastava935shreya-create"
!git config --global user.email "srivastava935shreya@gmail.com"

# 4. Switch to your feature branch
!git checkout -b shreya-srivastava || !git checkout shreya-srivastava

# 5. Copy the active notebook from session storage into the repo folder
!cp /content/first_project.ipynb /content/PricePilot-AI-/first_project.ipynb

# 6. Stage, commit, and push
!git add first_project.ipynb
!git commit -m "Add competitor pricing and price elasticity features"
!git push origin shreya-srivastava

import json

# 1. Download the current in-memory notebook directly into the cloned repo folder
!cp /content/drive/MyDrive/Colab\ Notebooks/first_project.ipynb /content/PricePilot-AI-/first_project.ipynb 2>/dev/null || true

# 2. Navigate to repo directory
%cd /content/PricePilot-AI-

# 3. Configure credentials
!git config --global user.name "srivastava935shreya-create"
!git config --global user.email "srivastava935shreya@gmail.com"

# 4. Make sure you are on your branch
!git checkout shreya-srivastava

# 5. Copy the active notebook from session root if needed
!cp -f /content/first_project.ipynb . 2>/dev/null || true

# 6. Commit and Push using your token
!git add first_project.ipynb
!git commit -m "Add competitor price and price elasticity features"
!git push https://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@github.com/springboardmentor12233a-tech/PricePilot-AI-.git shreya-srivastava

# Classify our price position against competitors

df['Price_Position'] = np.where(
    df['Price'] < df['Competitor_Price'],
    'Cheaper',
    np.where(
        df['Price'] > df['Competitor_Price'],
        'More Expensive',
        'Same Price'
    )
)

# Count records in each pricing position
print(df['Price_Position'].value_counts())

# Compare average demand
print("\nAverage Demand by Price Position:")
print(
    df.groupby('Price_Position')['Demand_Units']
      .mean()
      .sort_values(ascending=False)
)

import matplotlib.pyplot as plt

# Create price ratio ranges
df['Price_Ratio_Bin'] = pd.cut(
    df['Price_Ratio'],
    bins=[0, 0.75, 0.90, 1.00, 1.10, 1.25, 1.50, float('inf')],
    labels=[
        '<75%',
        '75-90%',
        '90-100%',
        '100-110%',
        '110-125%',
        '125-150%',
        '>150%'
    ]
)

# Calculate average demand for each range
ratio_demand = (
    df.groupby('Price_Ratio_Bin', observed=True)['Demand_Units']
      .mean()
)

print("Average Demand by Price Ratio:")
print(ratio_demand)

# Plot
ratio_demand.plot(kind='bar', figsize=(10, 5))

plt.xlabel("Our Price / Competitor Price")
plt.ylabel("Average Demand")
plt.title("Competitor Price Position vs Demand")
plt.xticks(rotation=0)
plt.tight_layout()
plt.show()

# Price vs Demand

plt.figure(figsize=(10, 6))

plt.scatter(
    df['Price'],
    df['Demand_Units'],
    alpha=0.4
)

plt.xlabel('Our Price')
plt.ylabel('Demand Units')
plt.title('Price vs Demand')

plt.tight_layout()
plt.show()

print(
    "Price-Demand Correlation:",
    df['Price'].corr(df['Demand_Units'])
)

## ML Data Preparation

 In this section, we prepare the dataset for machine learning by defining the target variable, checking for data leakage, selecting relevant features, and preparing categorical and numerical variables.



# Create a separate copy for machine learning
ml_df = df.copy()

# Define the target variable
target = 'Demand_Units'

print("ML dataset shape:", ml_df.shape)
print("Target variable:", target)

### Checking for Data Leakage

Before training the model, we identify variables that may contain information derived from the target variable. Using such variables could artificially increase model performance and result in an unrealistic model.


# Check correlation of all numerical features with the target
numeric_corr = (
    ml_df.select_dtypes(include=['int64', 'float64'])
    .corr()['Demand_Units']
    .sort_values(ascending=False)
)

print(numeric_corr)

# Inspect potentially leakage-prone variables
ml_df[
    ['Demand_Units',
     'Inventory_Turnover_Index',
     'Total_Revenue',
     'Estimated_Revenue']
].head(10)

# Check how strongly Inventory Turnover is related to Demand
print(
    ml_df[['Demand_Units', 'Inventory_Turnover_Index']]
    .corr()
)

# Remove leakage-prone features
leakage_features = [
    'Inventory_Turnover_Index',
    'Total_Revenue',
    'Estimated_Revenue'
]

ml_df = ml_df.drop(columns=leakage_features)

print("Removed:", leakage_features)
print("New dataset shape:", ml_df.shape)

remaining_corr = (
    ml_df.select_dtypes(include=['int64', 'float64'])
    .corr()['Demand_Units']
    .sort_values(ascending=False)
)

print("Correlation with Demand_Units after leakage removal:")
print(remaining_corr)

print("Date data type:", ml_df['Date'].dtype)
print("Minimum date:", ml_df['Date'].min())
print("Maximum date:", ml_df['Date'].max())

print("\nSample dates:")
print(ml_df[['Date', 'Demand_Units']].head())

# Create useful time-based features
ml_df['Year'] = ml_df['Date'].dt.year
ml_df['Quarter'] = ml_df['Date'].dt.quarter
ml_df['DayOfWeek'] = ml_df['Date'].dt.dayofweek

print("Time features created:")
print(['Year', 'Month', 'Quarter', 'DayOfWeek'])

print("\nSample:")
print(ml_df[['Date', 'Year', 'Month', 'Quarter', 'DayOfWeek', 'Demand_Units']].head())

# Identify categorical columns
categorical_cols = ml_df.select_dtypes(include=['object']).columns.tolist()

print("Categorical columns:")
print(categorical_cols)

print("\nUnique values in each categorical column:")
for col in categorical_cols:
    print(f"{col}: {ml_df[col].nunique()} unique values")

# Remove Record_ID because it is only a unique row identifier
ml_df = ml_df.drop(columns=['Record_ID'])

print("Record_ID removed.")
print("New dataset shape:", ml_df.shape)

product_counts = ml_df['Product_ID'].value_counts()

print("Number of unique products:", product_counts.nunique())
print("\nProduct frequency summary:")
print(product_counts.describe())

print("\nFirst 10 products and their record counts:")
print(product_counts.head(10))

# Remove high-cardinality Product_ID for the baseline model
ml_df = ml_df.drop(columns=['Product_ID'])

print("Product_ID removed.")
print("Current dataset shape:", ml_df.shape)

print("Current shape:", ml_df.shape)

print("\nCurrent columns:")
for i, col in enumerate(ml_df.columns, start=1):
    print(f"{i}. {col}")

# Remove raw Date because we already extracted useful time features
ml_df = ml_df.drop(columns=['Date'])

print("Raw Date column removed.")
print("Current shape:", ml_df.shape)

# Define features and target
X = ml_df.drop(columns=['Demand_Units'])
y = ml_df['Demand_Units']

print("Features (X) shape:", X.shape)
print("Target (y) shape:", y.shape)

print("\nTarget variable:")
print(y.name)

# Identify categorical and numerical features
categorical_features = X.select_dtypes(include=['object']).columns.tolist()
numerical_features = X.select_dtypes(
    include=['int64', 'float64']
).columns.tolist()

print("Categorical features:")
print(categorical_features)

print("\nNumerical features:")
print(numerical_features)

print("\nNumber of categorical features:", len(categorical_features))
print("Number of numerical features:", len(numerical_features))

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder

# Preprocessing pipeline
preprocessor = ColumnTransformer(
    transformers=[
        (
            'categorical',
            OneHotEncoder(handle_unknown='ignore'),
            categorical_features
        ),
        (
            'numerical',
            'passthrough',
            numerical_features
        )
    ]
)

print("Preprocessing pipeline created successfully.")

print(ml_df['Year'].value_counts().sort_index())

# Time-based train-test split
train_mask = ml_df['Year'] < 2025
test_mask = ml_df['Year'] == 2025

X_train = X[train_mask]
X_test = X[test_mask]

y_train = y[train_mask]
y_test = y[test_mask]

print("Training set:")
print("X_train:", X_train.shape)
print("y_train:", y_train.shape)

print("\nTesting set:")
print("X_test:", X_test.shape)
print("y_test:", y_test.shape)

# Fit preprocessing only on training data
X_train_processed = preprocessor.fit_transform(X_train)

# Apply the same transformation to test data
X_test_processed = preprocessor.transform(X_test)

print("Training data after preprocessing:", X_train_processed.shape)
print("Testing data after preprocessing:", X_test_processed.shape)

from sklearn.linear_model import LinearRegression

# Create the baseline model
linear_model = LinearRegression()

# Train the model
linear_model.fit(X_train_processed, y_train)

print("Linear Regression model trained successfully.")

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

# Make predictions on the test set
y_pred_linear = linear_model.predict(X_test_processed)

# Calculate evaluation metrics
mae_linear = mean_absolute_error(y_test, y_pred_linear)
rmse_linear = np.sqrt(mean_squared_error(y_test, y_pred_linear))
r2_linear = r2_score(y_test, y_pred_linear)

print("Linear Regression Performance")
print("-" * 35)
print(f"MAE  : {mae_linear:.4f}")
print(f"RMSE : {rmse_linear:.4f}")
print(f"R²   : {r2_linear:.4f}")

from sklearn.ensemble import RandomForestRegressor

rf_model = RandomForestRegressor(
    n_estimators=200,
    random_state=42,
    n_jobs=-1
)

rf_model.fit(X_train_processed, y_train)

print("Random Forest training completed.")

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

y_pred_rf = rf_model.predict(X_test_processed)

mae_rf = mean_absolute_error(y_test, y_pred_rf)
rmse_rf = np.sqrt(mean_squared_error(y_test, y_pred_rf))
r2_rf = r2_score(y_test, y_pred_rf)

print("Random Forest Performance")
print("-" * 35)
print(f"MAE  : {mae_rf:.4f}")
print(f"RMSE : {rmse_rf:.4f}")
print(f"R²   : {r2_rf:.4f}")

try:
    import xgboost
    print("XGBoost is available.")
    print("Version:", xgboost.__version__)
except ImportError:
    print("XGBoost is not installed.")

from xgboost import XGBRegressor

xgb_model = XGBRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=6,
    random_state=42,
    n_jobs=-1,
    objective='reg:squarederror'
)

xgb_model.fit(X_train_processed, y_train)

print("XGBoost training completed.")

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

y_pred_xgb = xgb_model.predict(X_test_processed)

mae_xgb = mean_absolute_error(y_test, y_pred_xgb)
rmse_xgb = np.sqrt(mean_squared_error(y_test, y_pred_xgb))
r2_xgb = r2_score(y_test, y_pred_xgb)

print("XGBoost Performance")
print("-" * 35)
print(f"MAE  : {mae_xgb:.4f}")
print(f"RMSE : {rmse_xgb:.4f}")
print(f"R²   : {r2_xgb:.4f}")

import pandas as pd
import matplotlib.pyplot as plt

feature_importance = pd.Series(
    xgb_model.feature_importances_,
    index=preprocessor.get_feature_names_out()
).sort_values(ascending=False)

print("Top 15 Features")
print("-" * 40)
print(feature_importance.head(15))

plt.figure(figsize=(10, 6))
feature_importance.head(15).sort_values().plot(kind='barh')
plt.title("Top 15 XGBoost Feature Importances")
plt.xlabel("Importance")
plt.ylabel("Feature")
plt.tight_layout()
plt.show()

plt.figure(figsize=(8, 6))

plt.scatter(y_test, y_pred_xgb, alpha=0.5)

plt.xlabel("Actual Demand")
plt.ylabel("Predicted Demand")
plt.title("Actual vs Predicted Demand - XGBoost")

plt.tight_layout()
plt.show()

print("Training Price Distribution")
print("-" * 35)

print(f"Minimum Price : {X_train['Price'].min():.2f}")
print(f"25th Percentile: {X_train['Price'].quantile(0.25):.2f}")
print(f"Median Price  : {X_train['Price'].median():.2f}")
print(f"75th Percentile: {X_train['Price'].quantile(0.75):.2f}")
print(f"Maximum Price : {X_train['Price'].max():.2f}")

sample = X_test.iloc[0].copy()

print("Sample Product for Pricing Simulation")
print("-" * 40)
print("Category        :", sample["Category"])
print("Region          :", sample["Region"])
print("Sales Channel   :", sample["Sales_Channel"])
print("Current Price   :", round(sample["Price"], 2))
print("Discount        :", sample["Discount_Percentage"])
print("Competitor Price:", round(sample["Competitor_Price"], 2))
print("Promotion Flag  :", sample["Promotion_Flag"])
print("Holiday Flag    :", sample["Holiday_Flag"])
print("Stock Available :", round(sample["Stock_Availability"], 2))
print("Search Interest :", round(sample["Search_Interest"], 2))

current_price = sample["Price"]

candidate_prices = np.round(
    np.arange(current_price * 0.80, current_price * 1.20 + 0.01, current_price * 0.05),
    2
)

print("Candidate Prices")
print("-" * 30)
print(candidate_prices)

pricing_scenarios = []

for price in candidate_prices:
    scenario = sample.copy()

    # Update price
    scenario["Price"] = price

    # Update price-related engineered features
    scenario["Price_Difference"] = price - scenario["Competitor_Price"]
    scenario["Price_Ratio"] = price / scenario["Competitor_Price"]

    if price < scenario["Competitor_Price"]:
        scenario["Price_Position"] = "Cheaper"
    else:
        scenario["Price_Position"] = "More Expensive"

    pricing_scenarios.append(scenario)

pricing_df = pd.DataFrame(pricing_scenarios)

# Transform using the same preprocessing fitted on training data
pricing_processed = preprocessor.transform(pricing_df)

# Predict demand
predicted_demand = xgb_model.predict(pricing_processed)

# Calculate expected revenue
pricing_results = pd.DataFrame({
    "Candidate_Price": candidate_prices,
    "Predicted_Demand": predicted_demand
})

pricing_results["Expected_Revenue"] = (
    pricing_results["Candidate_Price"] *
    pricing_results["Predicted_Demand"]
)

print(pricing_results.round(2))

plt.figure(figsize=(9, 6))

plt.plot(
    pricing_results["Candidate_Price"],
    pricing_results["Expected_Revenue"],
    marker="o"
)

plt.xlabel("Candidate Price")
plt.ylabel("Expected Revenue")
plt.title("Price vs Expected Revenue")

plt.tight_layout()
plt.show()

max_allowed_price = sample["Competitor_Price"] * 1.20

constrained_results = pricing_results[
    pricing_results["Candidate_Price"] <= max_allowed_price
].copy()

print("Maximum Allowed Price:", round(max_allowed_price, 2))
print("\nConstrained Pricing Results")
print("-" * 45)
print(constrained_results.round(2))

# Generate candidate prices around the competitor price
competitor_price = sample["Competitor_Price"]

candidate_prices_constrained = np.round(
    np.arange(
        competitor_price * 0.80,
        competitor_price * 1.20 + 0.01,
        competitor_price * 0.05
    ),
    2
)

print("Competitor Price:", round(competitor_price, 2))
print("Allowed Price Range:")
print(
    round(competitor_price * 0.80, 2),
    "to",
    round(competitor_price * 1.20, 2)
)

print("\nCandidate Prices:")
print(candidate_prices_constrained)

pricing_scenarios = []

for price in candidate_prices_constrained:
    scenario = sample.copy()

    scenario["Price"] = price

    # Update price-dependent features
    scenario["Price_Difference"] = price - scenario["Competitor_Price"]
    scenario["Price_Ratio"] = price / scenario["Competitor_Price"]

    if price < scenario["Competitor_Price"]:
        scenario["Price_Position"] = "Cheaper"
    else:
        scenario["Price_Position"] = "More Expensive"

    pricing_scenarios.append(scenario)

pricing_df_constrained = pd.DataFrame(pricing_scenarios)

# Apply the same preprocessing used during training
pricing_processed_constrained = preprocessor.transform(
    pricing_df_constrained
)

# Predict demand
predicted_demand_constrained = xgb_model.predict(
    pricing_processed_constrained
)

# Create results table
constrained_results = pd.DataFrame({
    "Candidate_Price": candidate_prices_constrained,
    "Predicted_Demand": predicted_demand_constrained
})

constrained_results["Expected_Revenue"] = (
    constrained_results["Candidate_Price"] *
    constrained_results["Predicted_Demand"]
)

print(constrained_results.round(2))

best_row = constrained_results.loc[
    constrained_results["Expected_Revenue"].idxmax()
]

recommended_price = best_row["Candidate_Price"]
recommended_demand = best_row["Predicted_Demand"]
recommended_revenue = best_row["Expected_Revenue"]

print("PricePilot Recommendation")
print("-" * 40)
print(f"Recommended Price : ₹{recommended_price:.2f}")
print(f"Predicted Demand  : {recommended_demand:.2f} units")
print(f"Expected Revenue  : ₹{recommended_revenue:.2f}")

import matplotlib.pyplot as plt

plt.figure(figsize=(8, 5))

plt.plot(
    constrained_results["Candidate_Price"],
    constrained_results["Expected_Revenue"],
    marker="o"
)

plt.axvline(
    recommended_price,
    linestyle="--",
    label=f"Recommended Price = ₹{recommended_price:.2f}"
)

plt.xlabel("Candidate Price (₹)")
plt.ylabel("Expected Revenue (₹)")
plt.title("PricePilot: Price vs Expected Revenue")
plt.legend()
plt.grid(True)

plt.show()

print("Current Price:", current_price)
print("Discount Percentage:", sample["Discount_Percentage"])
print("Competitor Price:", sample["Competitor_Price"])

def recommend_price(sample_row):
    sample = sample_row.copy()

    competitor_price = sample["Competitor_Price"]

    min_price = competitor_price * 0.80
    max_price = competitor_price * 1.20

    candidate_prices = np.linspace(
        min_price,
        max_price,
        9
    )

    results = []

    for price in candidate_prices:

        scenario = sample.copy()

        scenario["Price"] = price
        scenario["Price_Difference"] = price - competitor_price
        scenario["Price_Ratio"] = price / competitor_price

        if price < competitor_price:
            scenario["Price_Position"] = "Cheaper"
        else:
            scenario["Price_Position"] = "More Expensive"

        scenario_df = pd.DataFrame([scenario])

        scenario_processed = preprocessor.transform(scenario_df)

        predicted_demand = xgb_model.predict(
            scenario_processed
        )[0]

        expected_revenue = price * predicted_demand

        results.append({
            "Candidate_Price": round(price, 2),
            "Predicted_Demand": round(predicted_demand, 2),
            "Expected_Revenue": round(expected_revenue, 2)
        })

    results_df = pd.DataFrame(results)

    best = results_df.loc[
        results_df["Expected_Revenue"].idxmax()
    ]

    return best, results_df

best_price, pricing_results = recommend_price(X_test.iloc[0])

print("PricePilot Recommendation")
print("-" * 40)
print(f"Recommended Price : ₹{best_price['Candidate_Price']:.2f}")
print(f"Predicted Demand  : {best_price['Predicted_Demand']:.2f} units")
print(f"Expected Revenue  : ₹{best_price['Expected_Revenue']:.2f}")

test_samples = X_test.iloc[:10]

recommendations = []

for idx, row in test_samples.iterrows():

    best, _ = recommend_price(row)

    recommendations.append({
        "Row": idx,
        "Recommended_Price": best["Candidate_Price"],
        "Predicted_Demand": best["Predicted_Demand"],
        "Expected_Revenue": best["Expected_Revenue"]
    })

recommendations_df = pd.DataFrame(recommendations)

recommendations_df

check = X_test.iloc[:10][
    ["Category", "Price", "Competitor_Price"]
].copy()

check["Recommended_Price"] = recommendations_df["Recommended_Price"].values

check["Max_Allowed_Price"] = (
    check["Competitor_Price"] * 1.20
)

check["Within_Constraint"] = (
    check["Recommended_Price"] <= check["Max_Allowed_Price"]
)

check

comparison = pd.DataFrame({
    "Actual_Demand": y_test.values,
    "Predicted_Demand": xgb_model.predict(X_test_processed)
})

comparison["Absolute_Error"] = (
    comparison["Actual_Demand"] -
    comparison["Predicted_Demand"]
).abs()

comparison.head(10)

import joblib

joblib.dump(xgb_model, "pricepilot_xgb_model.pkl")

print("XGBoost model saved successfully.")

joblib.dump(preprocessor, "pricepilot_preprocessor.pkl")

print("Preprocessor saved successfully.")

loaded_model = joblib.load("pricepilot_xgb_model.pkl")
loaded_preprocessor = joblib.load("pricepilot_preprocessor.pkl")

print("Model loaded:", type(loaded_model).__name__)
print("Preprocessor loaded:", type(loaded_preprocessor).__name__)

print("Categorical Features:")
print(categorical_features)

print("\nNumerical Features:")
print(numerical_features)

print("\nTotal Features Expected:", len(categorical_features) + len(numerical_features))

print("Training data shape:", X_train.shape)
print("Test data shape:", X_test.shape)

print("Processed training shape:", X_train_processed.shape)
print("Processed test shape:", X_test_processed.shape)

print("Target training shape:", y_train.shape)
print("Target test shape:", y_test.shape)

print("Model Performance on 2025 Test Data")
print("=" * 45)

print(f"Linear Regression : R² = {linear_r2:.4f}, MAE = {linear_mae:.4f}, RMSE = {linear_rmse:.4f}")
print(f"Random Forest     : R² = {rf_r2:.4f}, MAE = {rf_mae:.4f}, RMSE = {rf_rmse:.4f}")
print(f"XGBoost           : R² = {xgb_r2:.4f}, MAE = {xgb_mae:.4f}, RMSE = {xgb_rmse:.4f}")

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

# Predictions from the three models
linear_pred = linear_model.predict(X_test_processed)
rf_pred = rf_model.predict(X_test_processed)
xgb_pred = xgb_model.predict(X_test_processed)

print("Model Performance on 2025 Test Data")
print("=" * 45)

print("\nLinear Regression")
print("MAE :", mean_absolute_error(y_test, linear_pred))
print("RMSE:", np.sqrt(mean_squared_error(y_test, linear_pred)))
print("R²  :", r2_score(y_test, linear_pred))

print("\nRandom Forest")
print("MAE :", mean_absolute_error(y_test, rf_pred))
print("RMSE:", np.sqrt(mean_squared_error(y_test, rf_pred)))
print("R²  :", r2_score(y_test, rf_pred))

print("\nXGBoost")
print("MAE :", mean_absolute_error(y_test, xgb_pred))
print("RMSE:", np.sqrt(mean_squared_error(y_test, xgb_pred)))
print("R²  :", r2_score(y_test, xgb_pred))

import joblib

joblib.dump(xgb_model, "pricepilot_xgb_model.pkl")
joblib.dump(preprocessor, "pricepilot_preprocessor.pkl")

print("XGBoost model saved successfully.")
print("Preprocessor saved successfully.")

sample = X_test.iloc[0].copy()

print("PricePilot Pricing Scenario")
print("=" * 40)

print("Category          :", sample["Category"])
print("Region            :", sample["Region"])
print("Sales Channel     :", sample["Sales_Channel"])
print("Current Price     : ₹", sample["Price"])
print("Competitor Price  : ₹", sample["Competitor_Price"])
print("Discount          :", sample["Discount_Percentage"], "%")
print("Promotion         :", sample["Promotion_Flag"])
print("Holiday           :", sample["Holiday_Flag"])
print("Stock Availability:", sample["Stock_Availability"], "%")
print("Search Interest   :", sample["Search_Interest"])

import numpy as np

competitor_price = sample["Competitor_Price"]

min_price = competitor_price * 0.80
max_price = competitor_price * 1.20

candidate_prices = np.linspace(
    min_price,
    max_price,
    9
)

print("PricePilot Candidate Prices")
print("=" * 40)
print("Competitor Price :", f"₹{competitor_price:.2f}")
print("Minimum Price    :", f"₹{min_price:.2f}")
print("Maximum Price    :", f"₹{max_price:.2f}")
print("\nCandidate Prices:")

for price in candidate_prices:
    print(f"₹{price:.2f}")

pricing_results = []

for price in candidate_prices:

    scenario = sample.copy()

    # Change only the price-related values
    scenario["Price"] = price
    scenario["Price_Difference"] = price - competitor_price
    scenario["Price_Ratio"] = price / competitor_price

    if price < competitor_price:
        scenario["Price_Position"] = "Cheaper"
    else:
        scenario["Price_Position"] = "More Expensive"

    # Convert to DataFrame
    scenario_df = pd.DataFrame([scenario])

    # Apply the same preprocessing used during training
    scenario_processed = preprocessor.transform(scenario_df)

    # Predict demand
    predicted_demand = xgb_model.predict(
        scenario_processed
    )[0]

    # Estimate revenue
    expected_revenue = price * predicted_demand

    pricing_results.append({
        "Candidate_Price": round(price, 2),
        "Predicted_Demand": round(predicted_demand, 2),
        "Expected_Revenue": round(expected_revenue, 2)
    })

pricing_results = pd.DataFrame(pricing_results)

print(pricing_results)

best_price = pricing_results.loc[
    pricing_results["Expected_Revenue"].idxmax()
]

recommended_price = best_price["Candidate_Price"]

print("PricePilot Recommendation")
print("=" * 40)
print(f"Recommended Price : ₹{recommended_price:.2f}")
print(f"Predicted Demand  : {best_price['Predicted_Demand']:.2f} units")
print(f"Expected Revenue  : ₹{best_price['Expected_Revenue']:.2f}")

print("PricePilot Revenue Check")
print("=" * 40)

check = df[[
    "Price",
    "Discount_Percentage",
    "Demand_Units",
    "Estimated_Revenue"
]].head(10).copy()

check["Price_x_Demand"] = (
    check["Price"] * check["Demand_Units"]
)

check["Discounted_Revenue"] = (
    check["Price"]
    * (1 - check["Discount_Percentage"] / 100)
    * check["Demand_Units"]
)

print(check)

pricing_results["Expected_Revenue"] = (
    pricing_results["Candidate_Price"]
    * pricing_results["Predicted_Demand"]
    * (1 - sample["Discount_Percentage"] / 100)
)

pricing_results["Expected_Revenue"] = pricing_results[
    "Expected_Revenue"
].round(2)

print(pricing_results)

best_price = pricing_results.loc[
    pricing_results["Expected_Revenue"].idxmax()
]

recommended_price = best_price["Candidate_Price"]

print("Final PricePilot Recommendation")
print("=" * 45)
print(f"Current Price     : ₹{sample['Price']:.2f}")
print(f"Competitor Price  : ₹{sample['Competitor_Price']:.2f}")
print(f"Recommended Price : ₹{recommended_price:.2f}")
print(f"Predicted Demand  : {best_price['Predicted_Demand']:.2f} units")
print(f"Expected Revenue  : ₹{best_price['Expected_Revenue']:.2f}")

test_samples = X_test.iloc[:10].copy()

recommendations = []

for index, sample_row in test_samples.iterrows():

    competitor_price = sample_row["Competitor_Price"]

    min_price = competitor_price * 0.80
    max_price = competitor_price * 1.20

    candidate_prices = np.linspace(
        min_price,
        max_price,
        9
    )

    best_revenue = -np.inf
    best_price = None
    best_demand = None

    for price in candidate_prices:

        scenario = sample_row.copy()

        scenario["Price"] = price
        scenario["Price_Difference"] = price - competitor_price
        scenario["Price_Ratio"] = price / competitor_price

        if price < competitor_price:
            scenario["Price_Position"] = "Cheaper"
        else:
            scenario["Price_Position"] = "More Expensive"

        scenario_df = pd.DataFrame([scenario])
        scenario_processed = preprocessor.transform(scenario_df)

        predicted_demand = xgb_model.predict(
            scenario_processed
        )[0]

        expected_revenue = (
            price
            * predicted_demand
            * (1 - sample_row["Discount_Percentage"] / 100)
        )

        if expected_revenue > best_revenue:
            best_revenue = expected_revenue
            best_price = price
            best_demand = predicted_demand

    recommendations.append({
        "Row": index,
        "Category": sample_row["Category"],
        "Current_Price": round(sample_row["Price"], 2),
        "Competitor_Price": round(competitor_price, 2),
        "Recommended_Price": round(best_price, 2),
        "Predicted_Demand": round(best_demand, 2),
        "Expected_Revenue": round(best_revenue, 2)
    })

recommendations_df = pd.DataFrame(recommendations)

print(recommendations_df)