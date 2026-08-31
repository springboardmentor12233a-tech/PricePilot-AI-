# Model Training

## Objective

The objective is to develop an initial machine learning model for predicting product demand.

## Target Variable

Demand

## Input Dataset

data/processed/ml_ready_data.csv

## Data Split

The dataset is divided into:

- 80% training data
- 20% testing data

Random state:

42

## Initial Model

Random Forest Regressor

## Evaluation Metrics

The model is evaluated using:

- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- R² Score

## Feature Importance

Feature importance is calculated using the trained Random Forest model to identify influential features for demand prediction.

## Model Output

The trained model is saved as:

models/demand_model.pkl

## Prediction

The trained Random Forest model is saved as:

models/demand_model.pkl

The prediction script loads the saved model and generates demand predictions using the ML-ready feature set.

Prediction script:

backend/predict.py