from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
import xgboost as xgb
from llm.llm_service import generate_business_insights
from backend.competitor_analysis import analyze_competitor_prices
from backend.revenue_optimization import (
    calculate_revenue_profit,
    optimize_profit
)

# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="PricePilot AI - Dynamic Pricing & Revenue Intelligence API",
    description="Backend API for demand prediction, price optimization, M5 forecasting, KPI analytics and AI business insights.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "models"
KPI_DIR = BASE_DIR / "kpi"


# ============================================================
# ORIGINAL DEMAND MODEL
# ============================================================

MODEL_PATH = MODEL_DIR / "demand_prediction_model.json"
FEATURES_PATH = MODEL_DIR / "demand_model_features.pkl"

demand_model = xgb.XGBRegressor()
demand_model.load_model(MODEL_PATH)

model_features = joblib.load(FEATURES_PATH)


# ============================================================
# M5 WEEKLY DEMAND MODEL
# ============================================================

M5_MODEL_PATH = MODEL_DIR / "m5_weekly_demand_model.json"
M5_FEATURES_PATH = MODEL_DIR / "m5_weekly_model_features.pkl"

m5_demand_model = xgb.XGBRegressor()
m5_demand_model.load_model(M5_MODEL_PATH)

m5_model_features = joblib.load(M5_FEATURES_PATH)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "PricePilot AI Backend is running",
        "status": "success"
    }


# ============================================================
# ORIGINAL DEMAND PREDICTION
# ============================================================

class DemandInput(BaseModel):
    Product_ID: str
    Base_Sales: float
    Marketing_Campaign: str
    Marketing_Effect: float
    Seasonal_Trend: str
    Seasonal_Effect: float
    Price: float
    Discount: float
    Competitor_Price: float
    Stock_Availability: float
    Public_Holiday: bool
    Year: int
    Month: int
    Day: int
    DayOfWeek: int


@app.post("/predict-demand")
def predict_demand(data: DemandInput):

    input_data = data.model_dump()

    input_df = pd.DataFrame([input_data])

    # Create one-hot encoded columns
    input_df = pd.get_dummies(
        input_df,
        columns=[
            "Product_ID",
            "Marketing_Campaign",
            "Seasonal_Trend"
        ],
        drop_first=True
    )

    # Match training features exactly
    input_df = input_df.reindex(
        columns=model_features,
        fill_value=0
    )

    input_df = input_df.astype(float)

    predicted_demand = demand_model.predict(input_df)[0]

    predicted_demand = max(float(predicted_demand), 0)

    return {
        "predicted_demand": round(predicted_demand, 2)
    }


# ============================================================
# ORIGINAL PRICE OPTIMIZATION
# ============================================================

class PriceOptimizationInput(BaseModel):
    Product_ID: str
    Base_Sales: float
    Marketing_Campaign: str
    Marketing_Effect: float
    Seasonal_Trend: str
    Seasonal_Effect: float
    Price: float
    Discount: float
    Competitor_Price: float
    Stock_Availability: float
    Public_Holiday: bool
    Year: int
    Month: int
    Day: int
    DayOfWeek: int

    min_price: float
    max_price: float
    number_of_prices: int = 15


@app.post("/optimize-price")
def optimize_price(data: PriceOptimizationInput):

    input_data = data.model_dump()

    min_price = input_data.pop("min_price")
    max_price = input_data.pop("max_price")
    number_of_prices = input_data.pop("number_of_prices")

    if min_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="min_price must be greater than 0"
        )

    if max_price <= min_price:
        raise HTTPException(
            status_code=400,
            detail="max_price must be greater than min_price"
        )

    if number_of_prices < 2:
        raise HTTPException(
            status_code=400,
            detail="number_of_prices must be at least 2"
        )

    candidate_prices = np.linspace(
        min_price,
        max_price,
        number_of_prices
    )

    results = []

    for price in candidate_prices:

        test_data = input_data.copy()

        test_data["Price"] = float(price)

        test_df = pd.DataFrame([test_data])

        test_df = pd.get_dummies(
            test_df,
            columns=[
                "Product_ID",
                "Marketing_Campaign",
                "Seasonal_Trend"
            ],
            drop_first=True
        )

        test_df = test_df.reindex(
            columns=model_features,
            fill_value=0
        )

        test_df = test_df.astype(float)

        predicted_demand = demand_model.predict(test_df)[0]

        predicted_demand = max(
            float(predicted_demand),
            0
        )

        expected_revenue = (
            float(price) * predicted_demand
        )

        results.append({
            "price": round(float(price), 2),
            "predicted_demand": round(
                predicted_demand,
                2
            ),
            "expected_revenue": round(
                expected_revenue,
                2
            )
        })

    best_result = max(
        results,
        key=lambda x: x["expected_revenue"]
    )

    return {
        "recommended_price": best_result["price"],
        "predicted_demand": best_result["predicted_demand"],
        "expected_revenue": best_result["expected_revenue"],
        "price_analysis": results
    }


# ============================================================
# M5 WEEKLY DEMAND PREDICTION
# ============================================================

class M5DemandInput(BaseModel):
    item_id: str
    dept_id: str
    cat_id: str

    avg_price: float
    min_price: float
    max_price: float

    sales_lag_1: float
    sales_lag_2: float
    sales_lag_4: float
    rolling_sales_4: float

    price_change: float
    price_change_pct: float

    month: int
    year: int
    week_of_year: int
    quarter: int

    has_event: int
    snap: int


@app.post("/predict-weekly-demand")
def predict_weekly_demand(data: M5DemandInput):

    input_data = data.model_dump()

    input_df = pd.DataFrame([input_data])

    # --------------------------------------------------------
    # Create the exact item_id dummy columns used in training
    # --------------------------------------------------------

    item_columns = [
        feature
        for feature in m5_model_features
        if feature.startswith("item_id_")
    ]

    for column in item_columns:

        item_value = column.replace(
            "item_id_",
            ""
        )

        input_df[column] = (
            input_df["item_id"] == item_value
        ).astype(int)

    # --------------------------------------------------------
    # dept_id and cat_id were not present as model features
    # because the selected M5 training data contained the same
    # department/category.
    # --------------------------------------------------------

    input_df = input_df.drop(
        columns=[
            "item_id",
            "dept_id",
            "cat_id"
        ]
    )

    # --------------------------------------------------------
    # EXACT SAME FEATURES AND ORDER AS TRAINING
    # --------------------------------------------------------

    input_df = input_df.reindex(
        columns=m5_model_features,
        fill_value=0
    )

    input_df = input_df.astype(float)

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    predicted_demand = m5_demand_model.predict(
        input_df
    )[0]

    # Demand cannot be negative
    predicted_demand = max(
        float(predicted_demand),
        0
    )

    return {
        "predicted_weekly_demand": round(
            predicted_demand,
            2
        )
    }
# ============================================================
# M5 WEEKLY PRICE OPTIMIZATION
# ============================================================

class M5PriceOptimizationInput(BaseModel):
    item_id: str
    dept_id: str
    cat_id: str

    avg_price: float
    min_price: float
    max_price: float

    sales_lag_1: float
    sales_lag_2: float
    sales_lag_4: float
    rolling_sales_4: float

    price_change: float
    price_change_pct: float

    month: int
    year: int
    week_of_year: int
    quarter: int

    has_event: int
    snap: int

    min_candidate_price: float
    max_candidate_price: float
    number_of_prices: int = 10

@app.post("/optimize-weekly-price")
def optimize_weekly_price(data: M5PriceOptimizationInput):

    input_data = data.model_dump()

    # Get price optimization settings
    min_candidate_price = input_data.pop(
        "min_candidate_price"
    )

    max_candidate_price = input_data.pop(
        "max_candidate_price"
    )

    number_of_prices = input_data.pop(
        "number_of_prices"
    )

    # Validate price range
    if min_candidate_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="min_candidate_price must be greater than 0"
        )

    if max_candidate_price <= min_candidate_price:
        raise HTTPException(
            status_code=400,
            detail="max_candidate_price must be greater than min_candidate_price"
        )

    if number_of_prices < 2:
        raise HTTPException(
            status_code=400,
            detail="number_of_prices must be at least 2"
        )

    # Generate candidate prices
    candidate_prices = np.linspace(
        min_candidate_price,
        max_candidate_price,
        number_of_prices
    )

    results = []

    # Test every candidate price
    for candidate_price in candidate_prices:

        test_data = input_data.copy()

        # For a pricing scenario, assume the candidate
        # price becomes the current weekly price.
        test_data["avg_price"] = float(candidate_price)
        test_data["min_price"] = float(candidate_price)
        test_data["max_price"] = float(candidate_price)

        # Recalculate current price-change features
        test_data["price_change"] = (
            float(candidate_price)
            - (
                float(data.avg_price)
                - float(data.price_change)
            )
        )

        previous_price = (
            float(data.avg_price)
            - float(data.price_change)
        )

        if previous_price != 0:
            test_data["price_change_pct"] = (
                test_data["price_change"]
                / previous_price
            ) * 100
        else:
            test_data["price_change_pct"] = 0

        input_df = pd.DataFrame([test_data])

        # Create item_id dummy columns
        item_columns = [
            feature
            for feature in m5_model_features
            if feature.startswith("item_id_")
        ]

        for column in item_columns:

            item_value = column.replace(
                "item_id_",
                ""
            )

            input_df[column] = (
                input_df["item_id"] == item_value
            ).astype(int)

        # Remove categorical columns
        input_df = input_df.drop(
            columns=[
                "item_id",
                "dept_id",
                "cat_id"
            ]
        )

        # Match exact training features
        input_df = input_df.reindex(
            columns=m5_model_features,
            fill_value=0
        )

        input_df = input_df.astype(float)

        # Predict demand
        predicted_demand = (
            m5_demand_model.predict(input_df)[0]
        )

        predicted_demand = max(
            float(predicted_demand),
            0
        )

        # Calculate expected weekly revenue
        expected_revenue = (
            float(candidate_price)
            * predicted_demand
        )

        results.append({
            "price": round(
                float(candidate_price),
                2
            ),
            "predicted_weekly_demand": round(
                predicted_demand,
                2
            ),
            "expected_weekly_revenue": round(
                expected_revenue,
                2
            )
        })

    # Find price with maximum expected revenue
    best_result = max(
        results,
        key=lambda x: x["expected_weekly_revenue"]
    )

    return {
        "recommended_weekly_price": best_result["price"],
        "predicted_weekly_demand": best_result[
            "predicted_weekly_demand"
        ],
        "expected_weekly_revenue": best_result[
            "expected_weekly_revenue"
        ],
        "price_analysis": results
    }

# ============================================================
# M5 DEMAND FORECASTING
# ============================================================

class M5ForecastInput(BaseModel):
    item_id: str
    dept_id: str
    cat_id: str

    avg_price: float
    min_price: float
    max_price: float

    sales_lag_1: float
    sales_lag_2: float
    sales_lag_4: float
    rolling_sales_4: float

    price_change: float
    price_change_pct: float

    month: int
    year: int
    week_of_year: int
    quarter: int

    has_event: int
    snap: int

    forecast_weeks: int = 1

@app.post("/forecast-weekly-demand")
def forecast_weekly_demand(data: M5ForecastInput):

    # --------------------------------------------------------
    # Validate forecast horizon
    # --------------------------------------------------------

    if data.forecast_weeks not in [1, 2, 4]:
        raise HTTPException(
            status_code=400,
            detail="forecast_weeks must be 1, 2, or 4"
        )

    # Keep original input values
    current_data = data.model_dump()

    forecast_weeks = current_data.pop(
        "forecast_weeks"
    )

    weekly_forecasts = []

    # --------------------------------------------------------
    # Generate one prediction at a time
    # --------------------------------------------------------

    for week in range(1, forecast_weeks + 1):

        input_df = pd.DataFrame(
            [current_data]
        )

        # ----------------------------------------------------
        # Create item_id dummy variables
        # ----------------------------------------------------

        item_columns = [
            feature
            for feature in m5_model_features
            if feature.startswith("item_id_")
        ]

        for column in item_columns:

            item_value = column.replace(
                "item_id_",
                ""
            )

            input_df[column] = (
                input_df["item_id"] == item_value
            ).astype(int)

        # ----------------------------------------------------
        # Remove categorical columns
        # ----------------------------------------------------

        input_df = input_df.drop(
            columns=[
                "item_id",
                "dept_id",
                "cat_id"
            ]
        )

        # ----------------------------------------------------
        # Match exact model features
        # ----------------------------------------------------

        input_df = input_df.reindex(
            columns=m5_model_features,
            fill_value=0
        )

        input_df = input_df.astype(float)

        # ----------------------------------------------------
        # Predict demand for this week
        # ----------------------------------------------------

        predicted_demand = (
            m5_demand_model.predict(
                input_df
            )[0]
        )

        predicted_demand = max(
            float(predicted_demand),
            0
        )

        weekly_forecasts.append({
            "week": week,
            "predicted_demand": round(
                predicted_demand,
                2
            )
        })

        # ----------------------------------------------------
        # Update lag features for the next week
        # ----------------------------------------------------

        current_data["sales_lag_4"] = (
            current_data["sales_lag_2"]
        )

        current_data["sales_lag_2"] = (
            current_data["sales_lag_1"]
        )

        current_data["sales_lag_1"] = (
            predicted_demand
        )

        # Update rolling demand estimate
        current_data["rolling_sales_4"] = (
            (
                current_data["rolling_sales_4"] * 3
                + predicted_demand
            ) / 4
        )

        # Move the calendar approximately one week
        current_data["week_of_year"] = (
            current_data["week_of_year"] + 1
        )

        if current_data["week_of_year"] > 52:

            current_data["week_of_year"] = 1

            current_data["year"] = (
                current_data["year"] + 1
            )

        # Update month approximately when week crosses
        # a month boundary
        if current_data["week_of_year"] in [1, 5, 9, 13, 18, 22, 26, 31, 35, 39, 44, 48]:

            current_data["month"] = min(
                current_data["month"] + 1,
                12
            )

            current_data["quarter"] = (
                (current_data["month"] - 1) // 3
            ) + 1

    # --------------------------------------------------------
    # Calculate total forecast
    # --------------------------------------------------------

    total_forecast_demand = sum(
        item["predicted_demand"]
        for item in weekly_forecasts
    )

    # --------------------------------------------------------
    # Determine trend
    # --------------------------------------------------------

    first_demand = weekly_forecasts[0][
        "predicted_demand"
    ]

    last_demand = weekly_forecasts[-1][
        "predicted_demand"
    ]

    if last_demand > first_demand * 1.05:

        trend = "Increasing"

    elif last_demand < first_demand * 0.95:

        trend = "Decreasing"

    else:

        trend = "Stable"

    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return {
        "forecast_days": forecast_weeks * 7,
        "forecast_weeks": forecast_weeks,
        "predicted_weekly_demand": round(
            first_demand,
            2
        ),
        "forecasted_demand": round(
            total_forecast_demand,
            2
        ),
        "trend": trend,
        "weekly_forecast": weekly_forecasts
    }

# ============================================================
# COMPETITOR ANALYSIS
# ============================================================

class CompetitorAnalysisInput(BaseModel):
    product_id: str
    current_price: float
    competitor_prices: list[float]


@app.post("/competitor-analysis")
def competitor_analysis(data: CompetitorAnalysisInput):

    try:
        result = analyze_competitor_prices(
            current_price=data.current_price,
            competitor_prices=data.competitor_prices
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    result["product_id"] = data.product_id

    return result

# ============================================================
# REVENUE AND PROFITABILITY
# ============================================================

class RevenueProfitInput(BaseModel):
    price: float
    predicted_demand: float
    cost_per_unit: float


@app.post("/revenue-profit")
def revenue_profit(data: RevenueProfitInput):

    try:
        result = calculate_revenue_profit(
            price=data.price,
            predicted_demand=data.predicted_demand,
            cost_per_unit=data.cost_per_unit
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    return result

# ============================================================
# PROFIT OPTIMIZATION
# ============================================================

class PriceOptimizationInput(BaseModel):
    Product_ID: str
    Base_Sales: float
    Marketing_Campaign: str
    Marketing_Effect: float
    Seasonal_Trend: str
    Seasonal_Effect: float
    Price: float
    Discount: float
    Competitor_Price: float
    Stock_Availability: float
    Public_Holiday: bool
    Year: int
    Month: int
    Day: int
    DayOfWeek: int

class ProfitOptimizationInput(BaseModel):
    Product_ID: str
    current_price: float
    cost_per_unit: float
    min_price: float
    max_price: float
    number_of_prices: int = 10

    Base_Sales: float
    Marketing_Campaign: str
    Marketing_Effect: float
    Seasonal_Trend: str
    Seasonal_Effect: float
    Discount: float
    Competitor_Price: float
    Stock_Availability: float
    Public_Holiday: int

    Year: int
    Month: int
    Day: int
    DayOfWeek: int


@app.post("/optimize-profit")
def profit_optimization(data: ProfitOptimizationInput):

    base_input = {
        "Product_ID": data.Product_ID,
        "Base_Sales": data.Base_Sales,
        "Marketing_Campaign": data.Marketing_Campaign,
        "Marketing_Effect": data.Marketing_Effect,
        "Seasonal_Trend": data.Seasonal_Trend,
        "Seasonal_Effect": data.Seasonal_Effect,
        "Price": data.current_price,
        "Discount": data.Discount,
        "Competitor_Price": data.Competitor_Price,
        "Stock_Availability": data.Stock_Availability,
        "Public_Holiday": data.Public_Holiday,
        "Year": data.Year,
        "Month": data.Month,
        "Day": data.Day,
        "DayOfWeek": data.DayOfWeek
    }

    try:
        result = optimize_profit(
            current_price=data.current_price,
            cost_per_unit=data.cost_per_unit,
            min_price=data.min_price,
            max_price=data.max_price,
            number_of_prices=data.number_of_prices,
            demand_model=demand_model,
            model_features=model_features,
            base_input=base_input
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    return result

class PricingRecommendationInput(BaseModel):
    Product_ID: str
    current_price: float
    cost_per_unit: float
    min_price: float
    max_price: float
    number_of_prices: int = 10

    Base_Sales: float
    Marketing_Campaign: str
    Marketing_Effect: float
    Seasonal_Trend: str
    Seasonal_Effect: float
    Discount: float
    competitor_prices: list[float]
    Stock_Availability: float
    Public_Holiday: int

    Year: int
    Month: int
    Day: int
    DayOfWeek: int


@app.post("/pricing-recommendation")
def pricing_recommendation(data: PricingRecommendationInput):

    base_input = {
        "Product_ID": data.Product_ID,
        "Base_Sales": data.Base_Sales,
        "Marketing_Campaign": data.Marketing_Campaign,
        "Marketing_Effect": data.Marketing_Effect,
        "Seasonal_Trend": data.Seasonal_Trend,
        "Seasonal_Effect": data.Seasonal_Effect,
        "Price": data.current_price,
        "Discount": data.Discount,
        "Competitor_Price": data.competitor_prices[0],
        "Stock_Availability": data.Stock_Availability,
        "Public_Holiday": data.Public_Holiday,
        "Year": data.Year,
        "Month": data.Month,
        "Day": data.Day,
        "DayOfWeek": data.DayOfWeek
    }

    try:
        profit_result = optimize_profit(
            current_price=data.current_price,
            cost_per_unit=data.cost_per_unit,
            min_price=data.min_price,
            max_price=data.max_price,
            number_of_prices=data.number_of_prices,
            demand_model=demand_model,
            model_features=model_features,
            base_input=base_input
        )

        competitor_result = analyze_competitor_prices(
            current_price=data.current_price,
            competitor_prices=data.competitor_prices
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    return {
        "product_id": data.Product_ID,
        "current_price": data.current_price,
        "recommended_price": profit_result["recommended_price"],
        "price_change_percentage": profit_result["price_change_percentage"],
        "predicted_demand": profit_result["predicted_demand"],
        "expected_revenue": profit_result["expected_revenue"],
        "expected_profit": profit_result["expected_profit"],
        "profit_improvement_percentage": profit_result[
            "profit_improvement_percentage"
        ],
        "market_position": competitor_result["market_position"],
        "competitor_recommendation": competitor_result["recommendation"],
        "price_analysis": profit_result["price_analysis"]
    }

class ProfitabilitySummaryInput(BaseModel):
    current_price: float
    recommended_price: float
    predicted_demand: float
    cost_per_unit: float


@app.post("/profitability-summary")
def profitability_summary(data: ProfitabilitySummaryInput):

    current_revenue = data.current_price * data.predicted_demand
    recommended_revenue = data.recommended_price * data.predicted_demand

    total_cost = data.cost_per_unit * data.predicted_demand

    current_profit = current_revenue - total_cost
    recommended_profit = recommended_revenue - total_cost

    current_margin = (
        (current_profit / current_revenue) * 100
        if current_revenue > 0 else 0
    )

    recommended_margin = (
        (recommended_profit / recommended_revenue) * 100
        if recommended_revenue > 0 else 0
    )

    profit_improvement = recommended_profit - current_profit

    profit_improvement_percentage = (
        (profit_improvement / current_profit) * 100
        if current_profit > 0 else 0
    )

    return {
        "current_price": round(data.current_price, 2),
        "recommended_price": round(data.recommended_price, 2),
        "predicted_demand": round(data.predicted_demand, 2),

        "current_revenue": round(current_revenue, 2),
        "recommended_revenue": round(recommended_revenue, 2),

        "total_cost": round(total_cost, 2),

        "current_profit": round(current_profit, 2),
        "recommended_profit": round(recommended_profit, 2),

        "current_profit_margin": round(current_margin, 2),
        "recommended_profit_margin": round(recommended_margin, 2),

        "profit_improvement": round(profit_improvement, 2),
        "profit_improvement_percentage": round(
            profit_improvement_percentage, 2
        )
    }

class RevenueProfitabilityInput(BaseModel):
    price: float
    predicted_demand: float
    cost_per_unit: float


@app.post("/revenue-profitability")
def revenue_profitability(data: RevenueProfitabilityInput):

    try:
        result = calculate_revenue_profit(
            price=data.price,
            predicted_demand=data.predicted_demand,
            cost_per_unit=data.cost_per_unit
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    return result

# ============================================================
# KPI - OVERALL
# ============================================================

@app.get("/kpis")
def get_kpis():

    try:

        monthly_file = KPI_DIR / "monthly_sales_kpis.csv"

        if not monthly_file.exists():
            raise HTTPException(
                status_code=404,
                detail="KPI files not found"
            )

        monthly_df = pd.read_csv(monthly_file)

        total_revenue = monthly_df["Revenue"].sum()

        total_orders = monthly_df["Orders"].sum()

        total_quantity = monthly_df["Quantity_Sold"].sum()

        average_order_value = (
            total_revenue / total_orders
            if total_orders > 0
            else 0
        )

        return {
            "total_revenue": round(
                float(total_revenue),
                2
            ),
            "total_orders": int(
                total_orders
            ),
            "total_quantity": int(
                total_quantity
            ),
            "average_order_value": round(
                float(average_order_value),
                2
            )
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# MONTHLY REVENUE
# ============================================================

@app.get("/kpis/monthly-revenue")
def get_monthly_revenue():

    try:

        file_path = (
            KPI_DIR /
            "monthly_sales_kpis.csv"
        )

        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail="KPI file not found"
            )

        df = pd.read_csv(file_path)

        # Replace missing values with JSON-safe None
        df = df.astype(object).where(
            pd.notnull(df),
            None
        )

        return df.to_dict(
            orient="records"
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
# ============================================================
# TOP PRODUCTS BY REVENUE
# ============================================================

@app.get("/kpis/top-products")
def get_top_products():

    try:

        file_path = (
            KPI_DIR /
            "top_product_revenue.csv"
        )

        df = pd.read_csv(file_path)

        df = df.where(
            pd.notnull(df),
            None
        )

        return df.to_dict(
            orient="records"
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# TOP CUSTOMERS
# ============================================================

@app.get("/kpis/top-customers")
def get_top_customers():

    try:

        file_path = (
            KPI_DIR /
            "top_customers.csv"
        )

        df = pd.read_csv(file_path)

        df = df.where(
            pd.notnull(df),
            None
        )

        return df.to_dict(
            orient="records"
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# COUNTRY REVENUE
# ============================================================

@app.get("/kpis/country-revenue")
def get_country_revenue():

    try:

        file_path = (
            KPI_DIR /
            "country_revenue.csv"
        )

        df = pd.read_csv(file_path)

        df = df.where(
            pd.notnull(df),
            None
        )

        return df.to_dict(
            orient="records"
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# DASHBOARD KPI SUMMARY
# ============================================================

@app.get("/dashboard/kpis")
def dashboard_kpis():

    try:

        file_path = (
            KPI_DIR /
            "monthly_sales_kpis.csv"
        )

        df = pd.read_csv(file_path)

        total_revenue = df["Revenue"].sum()

        total_orders = df["Orders"].sum()

        total_quantity = df["Quantity_Sold"].sum()

        average_order_value = (
            total_revenue / total_orders
            if total_orders > 0
            else 0
        )

        return {
            "total_revenue": round(
                float(total_revenue),
                2
            ),
            "total_orders": int(
                total_orders
            ),
            "total_quantity": int(
                total_quantity
            ),
            "average_order_value": round(
                float(average_order_value),
                2
            )
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# LLM BUSINESS INSIGHTS
# ============================================================

class LLMInsightInput(BaseModel):
    total_revenue: float
    average_order_value: float
    recommended_price: float
    predicted_demand: float
    expected_revenue: float


@app.post("/llm/business-insights")
def business_insights(data: dict):

    business_data = {
        "question": data.get("question"),
        
        "Historical KPIs": {
            "Total Revenue": data.get("total_revenue"),
            "Total Orders": data.get("total_orders"),
            "Average Order Value": data.get("average_order_value")
        },

        "Pricing Recommendation": {
            "Product ID": data.get("product_id"),
            "Current Price": data.get("current_price"),
            "Recommended Price": data.get("recommended_price"),
            "Price Change Percentage": data.get("price_change_percentage"),
            "Predicted Demand": data.get("predicted_demand"),
            "Expected Revenue": data.get("expected_revenue"),
            "Expected Profit": data.get("expected_profit"),
            "Profit Improvement Percentage": data.get(
                "profit_improvement_percentage"
            )
        },

        "Competitor Analysis": {
            "Market Position": data.get("market_position"),
            "Competitor Recommendation": data.get(
                "competitor_recommendation"
            )
        }
    }

    return generate_business_insights(business_data)