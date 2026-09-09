import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# Load dataset
df = pd.read_csv("data/processed/ml_ready_data.csv")

print("Dataset loaded successfully!")
print("Shape:", df.shape)


# Target
y = df["Demand"]

# Features
X = df.drop(
    columns=["Demand", "Date"],
    errors="ignore"
)

# Encode Store ID and Product ID
X["Store ID"] = X["Store ID"].astype("category").cat.codes
X["Product ID"] = X["Product ID"].astype("category").cat.codes

X = X.astype(int)

print("Features:", X.shape)
print("Target:", y.shape)


# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("\nTraining data:", X_train.shape)
print("Testing data:", X_test.shape)


# ==================================================
# MODEL 1 - RANDOM FOREST
# ==================================================

print("\n===================================")
print("Random Forest GridSearchCV")
print("===================================")

rf = RandomForestRegressor(
    random_state=42,
    n_jobs=-1
)

rf_params = {
    "n_estimators": [100, 200],
    "max_depth": [None, 10, 20],
    "min_samples_split": [2, 5]
}

rf_grid = GridSearchCV(
    estimator=rf,
    param_grid=rf_params,
    cv=3,
    scoring="neg_mean_absolute_error",
    n_jobs=-1,
    verbose=1
)

rf_grid.fit(X_train, y_train)

best_rf = rf_grid.best_estimator_

rf_pred = best_rf.predict(X_test)

rf_mae = mean_absolute_error(y_test, rf_pred)
rf_rmse = mean_squared_error(y_test, rf_pred) ** 0.5
rf_r2 = r2_score(y_test, rf_pred)

print("\nBest Random Forest Parameters:")
print(rf_grid.best_params_)

print("\nRandom Forest Results:")
print("MAE:", rf_mae)
print("RMSE:", rf_rmse)
print("R2 Score:", rf_r2)


# ==================================================
# MODEL 2 - GRADIENT BOOSTING
# ==================================================

print("\n===================================")
print("Gradient Boosting GridSearchCV")
print("===================================")

gb = GradientBoostingRegressor(
    random_state=42
)

gb_params = {
    "n_estimators": [100, 200],
    "learning_rate": [0.05, 0.1],
    "max_depth": [2, 3, 5]
}

gb_grid = GridSearchCV(
    estimator=gb,
    param_grid=gb_params,
    cv=3,
    scoring="neg_mean_absolute_error",
    n_jobs=-1,
    verbose=1
)

gb_grid.fit(X_train, y_train)

best_gb = gb_grid.best_estimator_

gb_pred = best_gb.predict(X_test)

gb_mae = mean_absolute_error(y_test, gb_pred)
gb_rmse = mean_squared_error(y_test, gb_pred) ** 0.5
gb_r2 = r2_score(y_test, gb_pred)

print("\nBest Gradient Boosting Parameters:")
print(gb_grid.best_params_)

print("\nGradient Boosting Results:")
print("MAE:", gb_mae)
print("RMSE:", gb_rmse)
print("R2 Score:", gb_r2)


# ==================================================
# MODEL COMPARISON
# ==================================================

print("\n===================================")
print("FINAL MODEL COMPARISON")
print("===================================")

print("\nRandom Forest")
print("MAE:", rf_mae)
print("RMSE:", rf_rmse)
print("R2:", rf_r2)

print("\nGradient Boosting")
print("MAE:", gb_mae)
print("RMSE:", gb_rmse)
print("R2:", gb_r2)


# Select model based on R2
if gb_r2 > rf_r2:
    best_model = best_gb
    best_model_name = "Gradient Boosting"
    best_r2 = gb_r2
else:
    best_model = best_rf
    best_model_name = "Random Forest"
    best_r2 = rf_r2


print("\n===================================")
print("BEST MODEL")
print("===================================")

print("Selected Model:", best_model_name)
print("R2 Score:", best_r2)


# Save best model
joblib.dump(
    best_model,
    "models/best_demand_model.pkl"
)

print("\nBest model saved successfully!")
print("Location: models/best_demand_model.pkl")