# models/ folder

Put the two files your Point 1 Colab notebook produces here:

1. `best_sales_prediction_model.pkl`  — the trained model (already required by your project).
2. `model_metrics.json` — a small JSON file with the winning model's name and metrics, e.g.:

```json
{
  "best_model_name": "Random Forest",
  "mae": 123.45,
  "rmse": 234.56,
  "r2": 0.87
}
```

If `model_metrics.json` doesn't exist yet, add the snippet from the end of
`src/ml_prediction.py` (variable `COLAB_SAVE_SNIPPET`) to the bottom of your
Point 1 Colab notebook, run it once, and download both files here.

The dashboard and AI assistant work fine without these files too — the
"Predict Sales" tab and "How accurate is the model?" answers will simply
say the model isn't available yet.
