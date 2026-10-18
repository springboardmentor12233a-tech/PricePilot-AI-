# PricePilot XGBoost Model Tester

The Streamlit tester loads the canonical fitted artifact from:

ML_MODEL/model_training/saved_models/pricepilot_xgboost_model.pkl

Keep the tester and ML_MODEL directories in the same repository layout. The model predicts Demand from 25 product, pricing, inventory, competitor, promotion, and calendar inputs. Units Ordered is not a model input.

## Run

From the repository root, install the tester requirements and launch the app:

    pip install -r pricepilot_model_tester/requirements.txt
    streamlit run pricepilot_model_tester/app.py

The application applies the saved preprocessing pipeline before inference.

The verified chronological holdout metrics are MAE 14.7932, RMSE 20.7713, and R-squared 0.7861 on 11,400 rows. They describe this evaluation split, not individual prediction confidence.
