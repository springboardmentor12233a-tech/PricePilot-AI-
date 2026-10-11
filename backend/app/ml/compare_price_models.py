
import numpy as np
import pandas as pd
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
import joblib
from pathlib import Path

from app.core.database import SessionLocal
from app.ml.train_price_prediction import build_training_dataframe, engineer_features

MODEL_DIR = Path(__file__).resolve().parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

# 3 x 4 x 3 = 36 combinations. Kept deliberately modest -- with only ~676
# rows, a huge grid mostly just measures noise, not real differences.
PARAM_GRID = {
    "n_estimators": [100, 200, 300],
    "max_depth": [3, 4, 5, 6],
    "learning_rate": [0.03, 0.05, 0.1],
}


def run_comparison(df: pd.DataFrame) -> dict:
    """
    Pure function, no DB access -- takes an already feature-engineered
    dataframe (same shape train_price_prediction.py works with) and
    returns the comparison table + winning model. Kept separate from
    train() below so this logic is testable without a database.
    """
    feature_cols = [c for c in df.columns if c not in ("product_id", "price")]
    X = df[feature_cols]
    y = df["price"]

    # Same 80/20 split as the original script (same random_state=42, so
    # this comparison is measured on the identical held-out set the
    # original single-model script reported its R2=0.992 on).
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    grid = GridSearchCV(
        estimator=XGBRegressor(random_state=42),
        param_grid=PARAM_GRID,
        scoring={"r2": "r2", "mae": "neg_mean_absolute_error"},
        refit="r2",  # after scoring both metrics, pick the winner by R2
        cv=5,
        n_jobs=-1,
    )
    grid.fit(X_train, y_train)

    results = pd.DataFrame(grid.cv_results_)
    comparison = results[
        ["params", "mean_test_r2", "std_test_r2", "mean_test_mae"]
    ].copy()
    # neg_mean_absolute_error is negative by sklearn convention (so that
    # "higher is better" holds for every scorer) -- flip the sign back to
    # a normal, readable dollar amount.
    comparison["mean_test_mae"] = -comparison["mean_test_mae"]
    comparison = comparison.rename(columns={"mean_test_mae": "mean_test_mae_dollars"})
    comparison = comparison.sort_values("mean_test_r2", ascending=False).reset_index(drop=True)

    best_model = grid.best_estimator_
    preds = best_model.predict(X_test)
    test_mae = mean_absolute_error(y_test, preds)
    test_rmse = np.sqrt(mean_squared_error(y_test, preds))
    test_r2 = r2_score(y_test, preds)

    return {
        "comparison_table": comparison,
        "best_params": grid.best_params_,
        "best_model": best_model,
        "feature_cols": feature_cols,
        "test_mae": test_mae,
        "test_rmse": test_rmse,
        "test_r2": test_r2,
    }


def train():
    db = SessionLocal()
    try:
        raw_df = build_training_dataframe(db)
        print(f"Loaded {len(raw_df)} training rows from database.")
        df = engineer_features(raw_df)

        n_combos = 1
        for v in PARAM_GRID.values():
            n_combos *= len(v)

        result = run_comparison(df)

        print("\n" + "=" * 72)
        print(f"Tested {n_combos} parameter combinations, 5-fold CV each ({n_combos * 5} fits)")
        print("Top 5 by cross-validated R2:")
        print(result["comparison_table"].head(5).to_string(index=False))
        print(f"\nBest params: {result['best_params']}")
        print(
            f"Held-out test set -> MAE: {result['test_mae']:.2f}   "
            f"RMSE: {result['test_rmse']:.2f}   R2: {result['test_r2']:.3f}"
        )
        print("=" * 72)

        comparison_path = MODEL_DIR / "price_model_comparison.csv"
        result["comparison_table"].to_csv(comparison_path, index=False)
        print(f"\nFull comparison table -> {comparison_path}  (screenshot/paste this for your slide)")

        # Same bundle shape as the original script -- predict_price.py
        # doesn't know or care that this came from a grid search.
        joblib.dump(
            {"model": result["best_model"], "feature_cols": result["feature_cols"]},
            MODEL_DIR / "price_prediction_model.pkl",
        )
        print(
            f"Winning model -> {MODEL_DIR / 'price_prediction_model.pkl'} "
            "(same format predict_price.py already reads, no other changes needed)"
        )

    finally:
        db.close()


if __name__ == "__main__":
    train()