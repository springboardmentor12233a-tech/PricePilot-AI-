
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

# =========================================================
# 1. Load ML-ready dataset
# =========================================================

df = pd.read_csv(
    "data/processed/ml_ready_data.csv"
)

print("Dataset loaded successfully!")
print("Shape:", df.shape)

# Check missing values
print("\nMissing values:", df.isnull().sum().sum())


# =========================================================
# 2. Separate target variable
# =========================================================

y = df["Demand"]


# =========================================================
# 3. Prepare features
# =========================================================

X = df.drop(
    columns=["Demand", "Date"],
    errors="ignore"
)

# Convert Store ID and Product ID to numerical categories
X["Store ID"] = X["Store ID"].astype("category").cat.codes
X["Product ID"] = X["Product ID"].astype("category").cat.codes

# Convert boolean columns to integers
X = X.astype(int)

print("\nFeatures shape:", X.shape)
print("Target shape:", y.shape)


# =========================================================
# 4. Check non-numeric columns
# =========================================================

print("\nNon-numeric columns:")

print(
    X.select_dtypes(
        exclude="number"
    ).columns.tolist()
)


# =========================================================
# 5. Train/Test Split
# =========================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("\nTraining data:", X_train.shape)
print("Testing data:", X_test.shape)


# =========================================================
# 6. MODEL A - Baseline Model
# =========================================================

print("\n================================")
print("MODEL A - BASELINE")
print("================================")

model_a = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

print("\nTraining Model A...")

model_a.fit(
    X_train,
    y_train
)

print("Model A training completed!")

# Predictions
pred_a = model_a.predict(X_test)

# Evaluation
mae_a = mean_absolute_error(
    y_test,
    pred_a
)

rmse_a = mean_squared_error(
    y_test,
    pred_a
) ** 0.5

r2_a = r2_score(
    y_test,
    pred_a
)

print("\nModel A Evaluation:")

print("MAE:", mae_a)
print("RMSE:", rmse_a)
print("R² Score:", r2_a)


# =========================================================
# 7. MODEL A - Feature Importance
# =========================================================

importance_a = pd.Series(
    model_a.feature_importances_,
    index=X.columns
)

importance_a = importance_a.sort_values(
    ascending=False
)

print("\nTop 15 Model A Features:")

print(
    importance_a.head(15)
)


# =========================================================
# 8. MODEL B - Remove Units Sold
# =========================================================

print("\n================================")
print("MODEL B - WITHOUT UNITS SOLD")
print("================================")

X_no_sales = X.drop(
    columns=["Units Sold"],
    errors="ignore"
)

print(
    "\nModel B Features:",
    X_no_sales.shape
)


# =========================================================
# 9. Train/Test Split for Model B
# =========================================================

X_train_b, X_test_b, y_train_b, y_test_b = train_test_split(
    X_no_sales,
    y,
    test_size=0.2,
    random_state=42
)

print(
    "Model B Training data:",
    X_train_b.shape
)

print(
    "Model B Testing data:",
    X_test_b.shape
)


# =========================================================
# 10. Train Model B
# =========================================================

model_b = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

print("\nTraining Model B...")

model_b.fit(
    X_train_b,
    y_train_b
)

print("Model B training completed!")


# =========================================================
# 11. Model B Predictions
# =========================================================

pred_b = model_b.predict(
    X_test_b
)


# =========================================================
# 12. Model B Evaluation
# =========================================================

mae_b = mean_absolute_error(
    y_test_b,
    pred_b
)

rmse_b = mean_squared_error(
    y_test_b,
    pred_b
) ** 0.5

r2_b = r2_score(
    y_test_b,
    pred_b
)

print("\nModel B Evaluation:")

print("MAE:", mae_b)
print("RMSE:", rmse_b)
print("R² Score:", r2_b)


# =========================================================
# 13. Model B Feature Importance
# =========================================================

importance_b = pd.Series(
    model_b.feature_importances_,
    index=X_no_sales.columns
)

importance_b = importance_b.sort_values(
    ascending=False
)

print("\nTop 15 Model B Features:")

print(
    importance_b.head(15)
)


# =========================================================
# 14. MODEL COMPARISON
# =========================================================

print("\n================================")
print("MODEL COMPARISON")
print("================================")

print("\nModel A - Baseline")
print("MAE:", mae_a)
print("RMSE:", rmse_a)
print("R² Score:", r2_a)

print("\nModel B - Without Units Sold")
print("MAE:", mae_b)
print("RMSE:", rmse_b)
print("R² Score:", r2_b)


# =========================================================
# 15. Select Model
# =========================================================

print("\n================================")
print("MODEL SELECTION")
print("================================")

if r2_b >= r2_a:
    selected_model = model_b
    selected_model_name = "Model B"
else:
    selected_model = model_a
    selected_model_name = "Model A"

print(
    "Selected model:",
    selected_model_name
)


# =========================================================
# 16. Save Selected Model
# =========================================================

joblib.dump(
    selected_model,
    "models/demand_model.pkl"
)

print("\nSelected model saved successfully!")

print(
    "Location: models/demand_model.pkl"
)