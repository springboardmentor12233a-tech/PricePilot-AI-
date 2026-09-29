# PricePilot XGBoost Model Tester

## Files

- `app.py` — Streamlit testing UI
- `pricepilot_xgboost_model.pkl` — your saved model artifact
- `requirements.txt` — dependencies

## Run

1. Put all three files in the same folder.
2. Open a terminal in that folder.
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Start the UI:

```bash
streamlit run app.py
```

5. Open the URL shown by Streamlit, normally:

`http://localhost:8501`

## Important model note

The saved model expects 26 features and its preprocessing pipeline is applied before prediction.

The saved feature list includes `Units Ordered`. If `Units Ordered` is the target variable that the model was supposed to predict, this is target leakage. In that case, retrain the model without `Units Ordered` as an input feature.
