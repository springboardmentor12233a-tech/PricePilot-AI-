from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from pydantic import BaseModel
from sqlalchemy.orm import Session

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

from pathlib import Path


# ============================================================
# PROJECT IMPORTS
# ============================================================

from llm.llm_service import generate_business_insights

from backend.competitor_analysis import analyze_competitor_prices

from backend.revenue_optimization import (
    calculate_revenue_profit,
    optimize_profit
)

from backend.database.database import get_db

from backend.database.models import User

from backend.auth.auth import (
    register_user,
    login_user
)

from backend.auth.security import (
    decode_access_token
)

from backend.auth.dependencies import (
    get_current_user,
    require_role
)

from backend.kpi.kpi import router as kpi_router

from backend.pricing.routes import router as pricing_router

from backend.products.products import router as products_router


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="PricePilot AI - Dynamic Pricing & Revenue Intelligence API",
    description=(
        "Backend API for demand prediction, "
        "price optimization, KPI analytics "
        "and AI business insights."
    ),
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(kpi_router)
app.include_router(products_router)
app.include_router(pricing_router)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "models"

KPI_DIR = BASE_DIR / "kpi"


# ============================================================
# DEMAND MODEL
# ============================================================
#
# IMPORTANT:
# We are now using the UCI/regular demand prediction model.
#
# DO NOT use:
#     demand_prediction_model.pkl
#
# DO NOT use:
#     M5 model
#
# Use:
#     demand_prediction_model.json
#     demand_model_features.pkl
#
# ============================================================

MODEL_PATH = MODEL_DIR / "demand_prediction_model.json"

FEATURES_PATH = MODEL_DIR / "demand_model_features.pkl"


demand_model = None
model_features = []


try:

    demand_model = xgb.XGBRegressor()

    demand_model.load_model(
        MODEL_PATH
    )

    model_features = joblib.load(
        FEATURES_PATH
    )

    print(
        "Demand prediction model loaded successfully."
    )

    print(
        "Number of model features:",
        len(model_features)
    )

except Exception as e:

    print(
        "WARNING: Could not load demand prediction model."
    )

    print(e)

    demand_model = None
    model_features = []


# ============================================================
# AUTHENTICATION
# ============================================================

security = HTTPBearer()


# ============================================================
# REGISTER
# ============================================================

class RegisterRequest(BaseModel):

    username: str

    email: str

    password: str

    role: str


@app.post("/auth/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):

    # Public users cannot create Admin accounts

    if request.role == "Admin":

        raise HTTPException(
            status_code=403,
            detail=(
                "Admin accounts cannot be created "
                "through public registration"
            )
        )

    user, error = register_user(

        db=db,

        username=request.username,

        email=request.email,

        password=request.password,

        role_name=request.role
    )

    if error:

        raise HTTPException(
            status_code=400,
            detail=error
        )

    return {

        "message":
            "User registered successfully",

        "user_id":
            user.id,

        "username":
            user.username,

        "role":
            user.role.name
    }


# ============================================================
# LOGIN
# ============================================================

class LoginRequest(BaseModel):

    email: str

    password: str


@app.post("/auth/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    result = login_user(

        db=db,

        email=request.email,

        password=request.password
    )

    if not result:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return result


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/auth/me")
def get_current_user_info(

    credentials: HTTPAuthorizationCredentials =
        Depends(security),

    db: Session = Depends(get_db)
):

    token = credentials.credentials

    payload = decode_access_token(token)

    if not payload:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")

    if not user_id:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = (
        db.query(User)
        .filter(User.id == int(user_id))
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {

        "id":
            user.id,

        "username":
            user.username,

        "email":
            user.email,

        "role":
            user.role.name
    }


# ============================================================
# ROLE TEST - USER
# ============================================================

@app.get("/test/user")
def test_user_access(

    current_user: User =
        Depends(get_current_user)
):

    return {

        "message":
            "User access granted",

        "username":
            current_user.username,

        "role":
            current_user.role.name
    }


# ============================================================
# ROLE TEST - BUSINESS ANALYST
# ============================================================

@app.get("/test/analyst")
def test_analyst_access(

    current_user: User =
        Depends(
            require_role("Business Analyst")
        )
):

    return {

        "message":
            "Business Analyst access granted",

        "username":
            current_user.username,

        "role":
            current_user.role.name
    }


# ============================================================
# ROLE TEST - ADMIN
# ============================================================

@app.get("/test/admin")
def test_admin_access(

    current_user: User =
        Depends(
            require_role("Admin")
        )
):

    return {

        "message":
            "Admin access granted",

        "username":
            current_user.username,

        "role":
            current_user.role.name
    }


# ============================================================
# DEMAND INPUT
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


# ============================================================
# DEMAND PREDICTION
# ============================================================

@app.post("/predict-demand")
def predict_demand(
    data: DemandInput
):

    if demand_model is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Demand prediction model is not available. "
                "Check models/demand_prediction_model.json"
            )
        )

    input_data = data.model_dump()

    input_df = pd.DataFrame(
        [input_data]
    )

    # One-hot encoding

    input_df = pd.get_dummies(

        input_df,

        columns=[
            "Product_ID",
            "Marketing_Campaign",
            "Seasonal_Trend"
        ],

        drop_first=True
    )

    # Match training features

    input_df = input_df.reindex(

        columns=model_features,

        fill_value=0
    )

    input_df = input_df.astype(float)

    predicted_demand = (
        demand_model.predict(
            input_df
        )[0]
    )

    predicted_demand = max(
        float(predicted_demand),
        0
    )

    return {

        "predicted_demand":
            round(
                predicted_demand,
                2
            )
    }


# ============================================================
# PRICE OPTIMIZATION
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
def optimize_price(
    data: PriceOptimizationInput
):

    if demand_model is None:

        raise HTTPException(
            status_code=500,
            detail="Demand prediction model is not available."
        )

    input_data = data.model_dump()

    min_price = input_data.pop(
        "min_price"
    )

    max_price = input_data.pop(
        "max_price"
    )

    number_of_prices = input_data.pop(
        "number_of_prices"
    )

    if min_price <= 0:

        raise HTTPException(
            status_code=400,
            detail="min_price must be greater than 0"
        )

    if max_price <= min_price:

        raise HTTPException(
            status_code=400,
            detail=(
                "max_price must be greater "
                "than min_price"
            )
        )

    if number_of_prices < 2:

        raise HTTPException(
            status_code=400,
            detail=(
                "number_of_prices must be "
                "at least 2"
            )
        )

    candidate_prices = np.linspace(

        min_price,

        max_price,

        number_of_prices
    )

    results = []

    for price in candidate_prices:

        test_data = input_data.copy()

        test_data["Price"] = float(
            price
        )

        test_df = pd.DataFrame(
            [test_data]
        )

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

        predicted_demand = (
            demand_model.predict(
                test_df
            )[0]
        )

        predicted_demand = max(
            float(predicted_demand),
            0
        )

        expected_revenue = (
            float(price)
            * predicted_demand
        )

        results.append({

            "price":
                round(
                    float(price),
                    2
                ),

            "predicted_demand":
                round(
                    predicted_demand,
                    2
                ),

            "expected_revenue":
                round(
                    expected_revenue,
                    2
                )
        })

    best_result = max(

        results,

        key=lambda x:
            x["expected_revenue"]
    )

    return {

        "recommended_price":
            best_result["price"],

        "predicted_demand":
            best_result["predicted_demand"],

        "expected_revenue":
            best_result["expected_revenue"],

        "price_analysis":
            results
    }


# ============================================================
# COMPETITOR ANALYSIS
# ============================================================

class CompetitorAnalysisInput(BaseModel):

    product_id: str

    current_price: float

    competitor_prices: list[float]


@app.post("/competitor-analysis")
def competitor_analysis(
    data: CompetitorAnalysisInput
):

    try:

        result = analyze_competitor_prices(

            current_price=
                data.current_price,

            competitor_prices=
                data.competitor_prices
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
def revenue_profit(
    data: RevenueProfitInput
):

    try:

        result = calculate_revenue_profit(

            price=data.price,

            predicted_demand=
                data.predicted_demand,

            cost_per_unit=
                data.cost_per_unit
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
def profit_optimization(
    data: ProfitOptimizationInput
):

    if demand_model is None:

        raise HTTPException(
            status_code=500,
            detail="Demand prediction model is not available."
        )

    base_input = {

        "Product_ID":
            data.Product_ID,

        "Base_Sales":
            data.Base_Sales,

        "Marketing_Campaign":
            data.Marketing_Campaign,

        "Marketing_Effect":
            data.Marketing_Effect,

        "Seasonal_Trend":
            data.Seasonal_Trend,

        "Seasonal_Effect":
            data.Seasonal_Effect,

        "Price":
            data.current_price,

        "Discount":
            data.Discount,

        "Competitor_Price":
            data.Competitor_Price,

        "Stock_Availability":
            data.Stock_Availability,

        "Public_Holiday":
            data.Public_Holiday,

        "Year":
            data.Year,

        "Month":
            data.Month,

        "Day":
            data.Day,

        "DayOfWeek":
            data.DayOfWeek
    }

    try:

        result = optimize_profit(

            current_price=
                data.current_price,

            cost_per_unit=
                data.cost_per_unit,

            min_price=
                data.min_price,

            max_price=
                data.max_price,

            number_of_prices=
                data.number_of_prices,

            demand_model=
                demand_model,

            model_features=
                model_features,

            base_input=
                base_input
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    return result


# ============================================================
# PRICING RECOMMENDATION
# ============================================================

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
def pricing_recommendation(
    data: PricingRecommendationInput
):

    if demand_model is None:

        raise HTTPException(
            status_code=500,
            detail="Demand prediction model is not available."
        )

    if not data.competitor_prices:

        raise HTTPException(
            status_code=400,
            detail="At least one competitor price is required."
        )

    base_input = {

        "Product_ID":
            data.Product_ID,

        "Base_Sales":
            data.Base_Sales,

        "Marketing_Campaign":
            data.Marketing_Campaign,

        "Marketing_Effect":
            data.Marketing_Effect,

        "Seasonal_Trend":
            data.Seasonal_Trend,

        "Seasonal_Effect":
            data.Seasonal_Effect,

        "Price":
            data.current_price,

        "Discount":
            data.Discount,

        "Competitor_Price":
            data.competitor_prices[0],

        "Stock_Availability":
            data.Stock_Availability,

        "Public_Holiday":
            data.Public_Holiday,

        "Year":
            data.Year,

        "Month":
            data.Month,

        "Day":
            data.Day,

        "DayOfWeek":
            data.DayOfWeek
    }

    try:

        profit_result = optimize_profit(

            current_price=
                data.current_price,

            cost_per_unit=
                data.cost_per_unit,

            min_price=
                data.min_price,

            max_price=
                data.max_price,

            number_of_prices=
                data.number_of_prices,

            demand_model=
                demand_model,

            model_features=
                model_features,

            base_input=
                base_input
        )

        competitor_result = (
            analyze_competitor_prices(

                current_price=
                    data.current_price,

                competitor_prices=
                    data.competitor_prices
            )
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    return {

        "product_id":
            data.Product_ID,

        "current_price":
            data.current_price,

        "recommended_price":
            profit_result[
                "recommended_price"
            ],

        "price_change_percentage":
            profit_result[
                "price_change_percentage"
            ],

        "predicted_demand":
            profit_result[
                "predicted_demand"
            ],

        "expected_revenue":
            profit_result[
                "expected_revenue"
            ],

        "expected_profit":
            profit_result[
                "expected_profit"
            ],

        "profit_improvement_percentage":
            profit_result[
                "profit_improvement_percentage"
            ],

        "market_position":
            competitor_result[
                "market_position"
            ],

        "competitor_recommendation":
            competitor_result[
                "recommendation"
            ],

        "price_analysis":
            profit_result[
                "price_analysis"
            ]
    }


# ============================================================
# PROFITABILITY SUMMARY
# ============================================================

class ProfitabilitySummaryInput(BaseModel):

    current_price: float

    recommended_price: float

    predicted_demand: float

    cost_per_unit: float


@app.post("/profitability-summary")
def profitability_summary(
    data: ProfitabilitySummaryInput
):

    current_revenue = (
        data.current_price
        * data.predicted_demand
    )

    recommended_revenue = (
        data.recommended_price
        * data.predicted_demand
    )

    total_cost = (
        data.cost_per_unit
        * data.predicted_demand
    )

    current_profit = (
        current_revenue
        - total_cost
    )

    recommended_profit = (
        recommended_revenue
        - total_cost
    )

    current_margin = (

        (current_profit / current_revenue)
        * 100

        if current_revenue > 0
        else 0
    )

    recommended_margin = (

        (recommended_profit / recommended_revenue)
        * 100

        if recommended_revenue > 0
        else 0
    )

    profit_improvement = (
        recommended_profit
        - current_profit
    )

    profit_improvement_percentage = (

        (profit_improvement / current_profit)
        * 100

        if current_profit > 0
        else 0
    )

    return {

        "current_price":
            round(
                data.current_price,
                2
            ),

        "recommended_price":
            round(
                data.recommended_price,
                2
            ),

        "predicted_demand":
            round(
                data.predicted_demand,
                2
            ),

        "current_revenue":
            round(
                current_revenue,
                2
            ),

        "recommended_revenue":
            round(
                recommended_revenue,
                2
            ),

        "total_cost":
            round(
                total_cost,
                2
            ),

        "current_profit":
            round(
                current_profit,
                2
            ),

        "recommended_profit":
            round(
                recommended_profit,
                2
            ),

        "current_profit_margin":
            round(
                current_margin,
                2
            ),

        "recommended_profit_margin":
            round(
                recommended_margin,
                2
            ),

        "profit_improvement":
            round(
                profit_improvement,
                2
            ),

        "profit_improvement_percentage":
            round(
                profit_improvement_percentage,
                2
            )
    }


# ============================================================
# REVENUE PROFITABILITY
# ============================================================

class RevenueProfitabilityInput(BaseModel):

    price: float

    predicted_demand: float

    cost_per_unit: float


@app.post("/revenue-profitability")
def revenue_profitability(
    data: RevenueProfitabilityInput
):

    try:

        result = calculate_revenue_profit(

            price=data.price,

            predicted_demand=
                data.predicted_demand,

            cost_per_unit=
                data.cost_per_unit
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

        monthly_file = (
            KPI_DIR /
            "monthly_sales_kpis.csv"
        )

        if not monthly_file.exists():

            raise HTTPException(
                status_code=404,
                detail="KPI files not found"
            )

        monthly_df = pd.read_csv(
            monthly_file
        )

        total_revenue = (
            monthly_df["Revenue"].sum()
        )

        total_orders = (
            monthly_df["Orders"].sum()
        )

        total_quantity = (
            monthly_df["Quantity_Sold"].sum()
        )

        average_order_value = (

            total_revenue / total_orders

            if total_orders > 0
            else 0
        )

        return {

            "total_revenue":
                round(
                    float(total_revenue),
                    2
                ),

            "total_orders":
                int(total_orders),

            "total_quantity":
                int(total_quantity),

            "average_order_value":
                round(
                    float(
                        average_order_value
                    ),
                    2
                )
        }

    except HTTPException:

        raise

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

        df = pd.read_csv(
            file_path
        )

        df = df.astype(object).where(
            pd.notnull(df),
            None
        )

        return df.to_dict(
            orient="records"
        )

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# TOP PRODUCTS
# ============================================================

@app.get("/kpis/top-products")
def get_top_products():

    try:

        file_path = (
            KPI_DIR /
            "top_product_revenue.csv"
        )

        if not file_path.exists():

            raise HTTPException(
                status_code=404,
                detail="Top products KPI file not found"
            )

        df = pd.read_csv(
            file_path
        )

        df = df.where(
            pd.notnull(df),
            None
        )

        return df.to_dict(
            orient="records"
        )

    except HTTPException:

        raise

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

        if not file_path.exists():

            raise HTTPException(
                status_code=404,
                detail="Top customers KPI file not found"
            )

        df = pd.read_csv(
            file_path
        )

        df = df.where(
            pd.notnull(df),
            None
        )

        return df.to_dict(
            orient="records"
        )

    except HTTPException:

        raise

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

        if not file_path.exists():

            raise HTTPException(
                status_code=404,
                detail="Country revenue KPI file not found"
            )

        df = pd.read_csv(
            file_path
        )

        df = df.where(
            pd.notnull(df),
            None
        )

        return df.to_dict(
            orient="records"
        )

    except HTTPException:

        raise

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

        if not file_path.exists():

            raise HTTPException(
                status_code=404,
                detail="KPI file not found"
            )

        df = pd.read_csv(
            file_path
        )

        total_revenue = (
            df["Revenue"].sum()
        )

        total_orders = (
            df["Orders"].sum()
        )

        total_quantity = (
            df["Quantity_Sold"].sum()
        )

        average_order_value = (

            total_revenue / total_orders

            if total_orders > 0
            else 0
        )

        return {

            "total_revenue":
                round(
                    float(total_revenue),
                    2
                ),

            "total_orders":
                int(total_orders),

            "total_quantity":
                int(total_quantity),

            "average_order_value":
                round(
                    float(
                        average_order_value
                    ),
                    2
                )
        }

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# LLM BUSINESS INSIGHTS
# ============================================================

@app.post("/llm/business-insights")
def business_insights(
    data: dict
):

    try:

        business_data = {

            "question":
                data.get("question"),

            # ------------------------------------------------
            # HISTORICAL KPIs
            # ------------------------------------------------

            "Historical KPIs": {

                "Total Revenue":
                    data.get(
                        "total_revenue",
                        0
                    ),

                "Total Orders":
                    data.get(
                        "total_orders",
                        0
                    ),

                "Average Order Value":
                    data.get(
                        "average_order_value",
                        0
                    )
            },

            # ------------------------------------------------
            # ALL PRODUCTS
            # ------------------------------------------------

            "Products":
                data.get(
                    "products",
                    []
                ),

            "Product Count":
                data.get(
                    "product_count",
                    0
                ),

            # ------------------------------------------------
            # USER ROLE
            # ------------------------------------------------

            "User Role":
                data.get(
                    "user_role"
                )
        }

        # ----------------------------------------------------
        # SEND DATA TO GEMINI / LLM
        # ----------------------------------------------------

        result = generate_business_insights(
            business_data
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {

        "message":
            "PricePilot AI API is running",

        "version":
            "1.0.0",

        "demand_model":
            (
                "loaded"
                if demand_model is not None
                else "not loaded"
            )
    }