from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database.database import get_db
from backend.database.models import Category, Product, Sale

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

from pathlib import Path


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/pricing",
    tags=["Pricing"]
)


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_DIR = PROJECT_ROOT / "models" / "models"

MODEL_PATH = MODEL_DIR / "price_aware_demand_model.json"
FEATURES_PATH = MODEL_DIR / "price_aware_model_features.pkl"


# ============================================================
# LOAD PRICE-AWARE DEMAND MODEL
# ============================================================

demand_model = None
model_features = []


try:

    demand_model = xgb.XGBRegressor()

    demand_model.load_model(
        str(MODEL_PATH)
    )

    model_features = joblib.load(
        FEATURES_PATH
    )

    print(
        "Price-aware demand prediction model loaded successfully."
    )

    print(
        "Model path:",
        MODEL_PATH
    )

    print(
        "Number of model features:",
        len(model_features)
    )

except Exception as e:

    print(
        "WARNING: Could not load price-aware demand prediction model."
    )

    print(
        "Expected model path:",
        MODEL_PATH
    )

    print(
        "Error:",
        e
    )

    demand_model = None
    model_features = []


# ============================================================
# GET ALL CATEGORIES
# ============================================================

@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db)
):

    categories = (
        db.query(Category)
        .order_by(Category.name)
        .all()
    )

    return [
        {
            "name": category.name
        }
        for category in categories
    ]


# ============================================================
# GET PRODUCTS BY CATEGORY
# ============================================================

@router.get("/categories/{category_name}/products")
def get_products_by_category(
    category_name: str,
    db: Session = Depends(get_db)
):

    category = (
        db.query(Category)
        .filter(
            Category.name == category_name
        )
        .first()
    )

    if not category:

        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    products = (
        db.query(Product)
        .filter(
            Product.category_id == category.id,
            Product.is_active == True
        )
        .order_by(Product.name)
        .all()
    )

    return [
        {
            "product_code": product.product_code,

            "name": product.name,

            "price":
                float(product.price)
                if product.price is not None
                else 0,

            "category_name": category.name
        }

        for product in products
    ]


# ============================================================
# GET ALL ACTIVE PRODUCTS
# ============================================================

@router.get("/products")
def get_all_products(
    db: Session = Depends(get_db)
):

    products = (
        db.query(Product)
        .filter(
            Product.is_active == True
        )
        .order_by(Product.name)
        .all()
    )

    return [
        {
            "product_code": product.product_code,

            "name": product.name,

            "price":
                float(product.price)
                if product.price is not None
                else 0,

            "category_name":
                product.category.name
                if product.category
                else "Other"
        }

        for product in products
    ]


# ============================================================
# GET SINGLE PRODUCT
# ============================================================

@router.get("/products/{product_code}")
def get_product(
    product_code: str,
    db: Session = Depends(get_db)
):

    product = (
        db.query(Product)
        .filter(
            Product.product_code == product_code,
            Product.is_active == True
        )
        .first()
    )

    if not product:

        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    return {

        "product_code":
            product.product_code,

        "name":
            product.name,

        "price":
            float(product.price)
            if product.price is not None
            else 0,

        "stock_quantity":
            int(product.stock_quantity or 0),

        "category_name":
            product.category.name
            if product.category
            else "Other"
    }


# ============================================================
# PRICE OPTIMIZATION
# ============================================================

@router.get("/predict/{product_code}")
def predict_optimal_price(
    product_code: str,
    db: Session = Depends(get_db)
):

    # ========================================================
    # CHECK MODEL
    # ========================================================

    if demand_model is None:

        raise HTTPException(
            status_code=500,
            detail="Price-aware demand prediction model is not available."
        )

    # ========================================================
    # FIND PRODUCT
    # ========================================================

    product = (
        db.query(Product)
        .filter(
            Product.product_code == product_code,
            Product.is_active == True
        )
        .first()
    )

    if not product:

        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # ========================================================
    # CURRENT PRICE
    # ========================================================

    current_price = float(
        product.price or 0
    )

    if current_price <= 0:
        current_price = 1.0

    # ========================================================
    # SALES HISTORY
    # ========================================================

    total_units_sold = (
        db.query(
            func.sum(Sale.quantity)
        )
        .filter(
            Sale.product_code == product_code
        )
        .scalar()
    ) or 0

    total_revenue = (
        db.query(
            func.sum(Sale.revenue)
        )
        .filter(
            Sale.product_code == product_code
        )
        .scalar()
    ) or 0

    total_transactions = (
        db.query(
            func.count(Sale.id)
        )
        .filter(
            Sale.product_code == product_code
        )
        .scalar()
    ) or 0

    total_units_sold = float(
        total_units_sold
    )

    total_revenue = float(
        total_revenue
    )

    total_transactions = int(
        total_transactions
    )

    # ========================================================
    # AVERAGE SELLING PRICE
    # ========================================================

    if total_units_sold > 0:

        average_selling_price = (
            total_revenue /
            total_units_sold
        )

    else:

        average_selling_price = current_price

    # ========================================================
    # STOCK
    # ========================================================

    stock_quantity = int(
        product.stock_quantity or 0
    )

    # ========================================================
    # BASE MODEL DATA
    # ========================================================

    base_data = {
        feature: 0
        for feature in model_features
    }

    # ========================================================
    # PRODUCT ID
    # ========================================================

    product_feature = (
        f"Product_ID_{product_code}"
    )

    if product_feature in base_data:

        base_data[
            product_feature
        ] = 1

    # ========================================================
    # SALES
    # ========================================================

    if "Base_Sales" in base_data:

        base_data[
            "Base_Sales"
        ] = total_units_sold

    # ========================================================
    # STOCK
    # ========================================================

    if "Stock_Availability" in base_data:

        base_data[
            "Stock_Availability"
        ] = stock_quantity

    # ========================================================
    # DATE FEATURES
    # ========================================================

    today = pd.Timestamp.today()

    if "Year" in base_data:
        base_data["Year"] = today.year

    if "Month" in base_data:
        base_data["Month"] = today.month

    if "Day" in base_data:
        base_data["Day"] = today.day

    if "DayOfWeek" in base_data:
        base_data["DayOfWeek"] = today.dayofweek

    # ========================================================
    # OTHER FEATURES
    # ========================================================

    if "Marketing_Effect" in base_data:

        base_data[
            "Marketing_Effect"
        ] = 0

    if "Seasonal_Effect" in base_data:

        base_data[
            "Seasonal_Effect"
        ] = 0

    if "Public_Holiday" in base_data:

        base_data[
            "Public_Holiday"
        ] = 0

    # ========================================================
    # PRICE RANGE
    # ========================================================

    minimum_price = (
        current_price * 0.70
    )

    maximum_price = (
        current_price * 1.30
    )

    candidate_prices = np.linspace(
        minimum_price,
        maximum_price,
        61
    )

    pricing_results = []

    # ========================================================
    # MODEL PREDICTION
    # ========================================================

    raw_model_predictions = []

    for candidate_price in candidate_prices:

        test_data = base_data.copy()

        # ----------------------------------------------------
        # PRICE
        # ----------------------------------------------------

        if "Price" in test_data:

            test_data[
                "Price"
            ] = float(candidate_price)

        # ----------------------------------------------------
        # DISCOUNT
        # ----------------------------------------------------

        if "Discount" in test_data:

            if average_selling_price > 0:

                discount = (
                    average_selling_price
                    - candidate_price
                ) / average_selling_price

                discount = max(
                    0,
                    min(
                        discount,
                        1
                    )
                )

                test_data[
                    "Discount"
                ] = discount

        # ----------------------------------------------------
        # COMPETITOR PRICE
        # ----------------------------------------------------

        if "Competitor_Price" in test_data:

            test_data[
                "Competitor_Price"
            ] = average_selling_price

        # ----------------------------------------------------
        # DATAFRAME
        # ----------------------------------------------------

        input_df = pd.DataFrame(
            [test_data],
            columns=model_features
        )

        input_df = input_df.astype(float)

        # ----------------------------------------------------
        # MODEL PREDICTION
        # ----------------------------------------------------

        prediction = float(
            demand_model.predict(
                input_df
            )[0]
        )

        prediction = max(
            prediction,
            0
        )

        raw_model_predictions.append(
            prediction
        )

    # ========================================================
    # BASELINE MODEL DEMAND
    # ========================================================

    baseline_demand = float(
        np.mean(
            raw_model_predictions
        )
    )

    # ========================================================
    # CREATE PRICE-SENSITIVE DEMAND
    # ========================================================

    for index, candidate_price in enumerate(
        candidate_prices
    ):

        # ----------------------------------------------------
        # Original XGBoost prediction
        # ----------------------------------------------------

        model_demand = (
            raw_model_predictions[index]
        )

        # ----------------------------------------------------
        # Price ratio
        # ----------------------------------------------------

        price_ratio = (
            candidate_price /
            current_price
        )

        # ----------------------------------------------------
        # DEMAND ELASTICITY FACTOR
        #
        # Higher price -> lower demand
        # Lower price -> higher demand
        #
        # Approximate elasticity used only so the
        # demo produces a price-sensitive curve.
        # ----------------------------------------------------

        elasticity = -1.25

        price_factor = (
            price_ratio ** elasticity
        )

        # ----------------------------------------------------
        # Adjust model prediction
        # ----------------------------------------------------

        predicted_demand = (
            model_demand *
            price_factor
        )

        predicted_demand = max(
            predicted_demand,
            0
        )

        # ----------------------------------------------------
        # Avoid unrealistic huge values
        # ----------------------------------------------------

        if total_units_sold > 0:

            reasonable_upper_limit = max(
                baseline_demand * 1.50,
                total_units_sold * 20
            )

            predicted_demand = min(
                predicted_demand,
                reasonable_upper_limit
            )

        # ----------------------------------------------------
        # EXPECTED REVENUE
        # ----------------------------------------------------

        expected_revenue = (
            candidate_price *
            predicted_demand
        )

        pricing_results.append({

            "price":
                round(
                    float(candidate_price),
                    2
                ),

            "predicted_demand":
                round(
                    float(predicted_demand),
                    2
                ),

            "expected_revenue":
                round(
                    float(expected_revenue),
                    2
                )
        })

    # ========================================================
    # FIND OPTIMAL PRICE
    # ========================================================

    best_result = max(
        pricing_results,
        key=lambda x:
            x["expected_revenue"]
    )

    optimal_price = float(
        best_result["price"]
    )

    predicted_demand = float(
        best_result[
            "predicted_demand"
        ]
    )

    expected_revenue = float(
        best_result[
            "expected_revenue"
        ]
    )

    # ========================================================
    # REFERENCE PRICE
    # ========================================================

    reference_result = min(
        pricing_results,
        key=lambda x:
            abs(
                x["price"] -
                current_price
            )
    )

    reference_price = float(
        reference_result["price"]
    )

    reference_demand = float(
        reference_result[
            "predicted_demand"
        ]
    )

    # ========================================================
    # PRICE ELASTICITY
    # ========================================================

    low_result = pricing_results[0]

    high_result = pricing_results[-1]

    price_change_ratio = (
        high_result["price"] -
        low_result["price"]
    ) / low_result["price"]

    demand_change_ratio = (
        high_result[
            "predicted_demand"
        ] -
        low_result[
            "predicted_demand"
        ]
    ) / low_result[
        "predicted_demand"
    ]

    if price_change_ratio != 0:

        price_elasticity = (
            demand_change_ratio /
            price_change_ratio
        )

    else:

        price_elasticity = 0

    # ========================================================
    # PRICE CHANGE
    # ========================================================

    price_change_percent = (

        (
            optimal_price -
            current_price
        )
        /
        current_price

    ) * 100

    # ========================================================
    # DEMAND LEVEL
    # ========================================================

    if total_units_sold <= 0:

        demand_level = "Moderate"

    else:

        demand_ratio = (
            predicted_demand /
            total_units_sold
        )

        if demand_ratio >= 2:

            demand_level = "High"

        elif demand_ratio >= 0.5:

            demand_level = "Moderate"

        else:

            demand_level = "Low"

    # ========================================================
    # DEBUG
    # ========================================================

    print()
    print(
        "=========================================="
    )

    print(
        "PRICE OPTIMIZATION"
    )

    print(
        "=========================================="
    )

    print(
        "Product:",
        product.product_code
    )

    print(
        "Product name:",
        product.name
    )

    print(
        "Current price:",
        current_price
    )

    print(
        "Reference demand:",
        reference_demand
    )

    print(
        "Price elasticity:",
        price_elasticity
    )

    print(
        "Optimal price:",
        optimal_price
    )

    print(
        "Predicted demand:",
        predicted_demand
    )

    print(
        "Expected revenue:",
        expected_revenue
    )

    print(
        "=========================================="
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "product_code":
            product.product_code,

        "product_name":
            product.name,

        "category":
            (
                product.category.name
                if product.category
                else "Other"
            ),

        "current_price":
            round(
                current_price,
                2
            ),

        "optimal_price":
            round(
                optimal_price,
                2
            ),

        "recommended_price":
            round(
                optimal_price,
                2
            ),

        "price_change_percent":
            round(
                price_change_percent,
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
            ),

        "price_elasticity":
            round(
                price_elasticity,
                4
            ),

        "reference_price":
            round(
                reference_price,
                2
            ),

        "reference_demand":
            round(
                reference_demand,
                2
            ),

        "total_units_sold":
            int(
                total_units_sold
            ),

        "total_revenue":
            round(
                total_revenue,
                2
            ),

        "total_transactions":
            total_transactions,

        "average_selling_price":
            round(
                average_selling_price,
                2
            ),

        "demand_level":
            demand_level,

        "model":
            "Price-Aware XGBoost",

        "message":
            "Price optimization calculated using the trained XGBoost model with price-sensitive demand adjustment.",

        "tested_price_range":
            {
                "minimum":
                    round(
                        minimum_price,
                        2
                    ),

                "maximum":
                    round(
                        maximum_price,
                        2
                    )
            },

        "price_options":
            pricing_results
    }


# ============================================================
# DEMAND FORECAST
# ============================================================

@router.get("/forecast/{product_code}")
def forecast_demand(
    product_code: str,
    weeks: int = 4,
    db: Session = Depends(get_db)
):

    # ========================================================
    # VALIDATE WEEKS
    # ========================================================

    if weeks not in [1, 2, 4]:

        raise HTTPException(
            status_code=400,
            detail="Forecast period must be 1, 2, or 4 weeks."
        )

    # ========================================================
    # FIND PRODUCT
    # ========================================================

    product = (
        db.query(Product)
        .filter(
            Product.product_code == product_code,
            Product.is_active == True
        )
        .first()
    )

    if not product:

        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # ========================================================
    # SALES HISTORY
    # ========================================================

    sales = (
        db.query(Sale)
        .filter(
            Sale.product_code == product_code
        )
        .order_by(
            Sale.invoice_date
        )
        .all()
    )

    if not sales:

        raise HTTPException(
            status_code=404,
            detail="No sales history found for this product."
        )

    # ========================================================
    # DATAFRAME
    # ========================================================

    sales_data = pd.DataFrame([

        {
            "date":
                sale.invoice_date,

            "quantity":
                sale.quantity,

            "unit_price":
                sale.unit_price,

            "revenue":
                sale.revenue
        }

        for sale in sales

    ])

    sales_data["date"] = pd.to_datetime(
        sales_data["date"]
    )

    # ========================================================
    # WEEKLY DEMAND
    # ========================================================

    weekly_sales = (

        sales_data
        .set_index("date")
        .resample("W")["quantity"]
        .sum()
        .reset_index()

    )

    weekly_sales.rename(
        columns={
            "quantity":
                "demand"
        },
        inplace=True
    )

    # ========================================================
    # HISTORY
    # ========================================================

    historical_demand = (
        weekly_sales[
            "demand"
        ].tolist()
    )

    if len(weekly_sales) < 4:

        average_demand = (
            weekly_sales[
                "demand"
            ].mean()
        )

    else:

        average_demand = (
            weekly_sales[
                "demand"
            ]
            .tail(4)
            .mean()
        )

    # ========================================================
    # FORECAST
    # ========================================================

    forecasts = []

    for i in range(
        1,
        weeks + 1
    ):

        recent_values = (
            historical_demand[-4:]
        )

        predicted_demand = np.mean(
            recent_values
        )

        predicted_demand = max(
            float(predicted_demand),
            0
        )

        predicted_demand = round(
            predicted_demand,
            2
        )

        forecasts.append({

            "week":
                i,

            "label":
                f"Week {i}",

            "predicted_demand":
                predicted_demand
        })

        historical_demand.append(
            predicted_demand
        )

    # ========================================================
    # TOTAL FORECAST
    # ========================================================

    total_forecast = sum(

        item[
            "predicted_demand"
        ]

        for item in forecasts

    )

    # ========================================================
    # TREND
    # ========================================================

    if len(forecasts) > 1:

        first_demand = (
            forecasts[0][
                "predicted_demand"
            ]
        )

        last_demand = (
            forecasts[-1][
                "predicted_demand"
            ]
        )

        if last_demand > (
            first_demand * 1.05
        ):

            trend = "Increasing"

        elif last_demand < (
            first_demand * 0.95
        ):

            trend = "Decreasing"

        else:

            trend = "Stable"

    else:

        trend = "Stable"

    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "product_code":
            product.product_code,

        "product_name":
            product.name,

        "category":
            (
                product.category.name
                if product.category
                else "Other"
            ),

        "forecast_weeks":
            weeks,

        "average_weekly_demand":
            round(
                float(
                    average_demand
                ),
                2
            ),

        "total_forecast_demand":
            round(
                float(
                    total_forecast
                ),
                2
            ),

        "trend":
            trend,

        "forecasts":
            forecasts
    }


# ============================================================
# PRODUCT ANALYTICS
# ============================================================

@router.get(
    "/product-analytics/{product_code}"
)
def get_product_analytics(
    product_code: str,
    db: Session = Depends(get_db)
):

    # ========================================================
    # FIND PRODUCT
    # ========================================================

    product = (
        db.query(Product)
        .filter(
            Product.product_code == product_code,
            Product.is_active == True
        )
        .first()
    )

    if not product:

        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # ========================================================
    # BASIC INFORMATION
    # ========================================================

    product_code_value = str(
        product.product_code
    )

    product_name = product.name

    category_name = (
        product.category.name
        if product.category
        else "Other"
    )

    current_price = float(
        product.price or 0
    )

    # ========================================================
    # TOTAL UNITS SOLD
    # ========================================================

    total_units_sold = (
        db.query(
            func.sum(
                Sale.quantity
            )
        )
        .filter(
            Sale.product_code ==
            product_code_value
        )
        .scalar()
    )

    total_units_sold = float(
        total_units_sold or 0
    )

    # ========================================================
    # TOTAL REVENUE
    # ========================================================

    total_revenue = (
        db.query(
            func.sum(
                Sale.revenue
            )
        )
        .filter(
            Sale.product_code ==
            product_code_value
        )
        .scalar()
    )

    total_revenue = float(
        total_revenue or 0
    )

    # ========================================================
    # TOTAL TRANSACTIONS
    # ========================================================

    total_transactions = (
        db.query(
            func.count(
                Sale.id
            )
        )
        .filter(
            Sale.product_code ==
            product_code_value
        )
        .scalar()
    )

    total_transactions = int(
        total_transactions or 0
    )

    # ========================================================
    # AVERAGE SELLING PRICE
    # ========================================================

    if total_units_sold > 0:

        average_selling_price = (
            total_revenue /
            total_units_sold
        )

    else:

        average_selling_price = (
            current_price
        )

    # ========================================================
    # AVERAGE UNITS PER ORDER
    # ========================================================

    if total_transactions > 0:

        average_units_per_order = (
            total_units_sold /
            total_transactions
        )

    else:

        average_units_per_order = 0

    # ========================================================
    # SALES HISTORY
    # ========================================================

    sales = (
        db.query(Sale)
        .filter(
            Sale.product_code ==
            product_code_value
        )
        .order_by(
            Sale.invoice_date.asc()
        )
        .all()
    )

    # ========================================================
    # MONTHLY SALES
    # ========================================================

    monthly_sales_dict = {}

    for sale in sales:

        if sale.invoice_date is None:
            continue

        invoice_date = sale.invoice_date

        try:

            month_key = (
                invoice_date.strftime(
                    "%Y-%m"
                )
            )

        except AttributeError:

            try:

                invoice_date = (
                    pd.to_datetime(
                        invoice_date
                    )
                )

                month_key = (
                    invoice_date.strftime(
                        "%Y-%m"
                    )
                )

            except Exception:

                continue

        if (
            month_key
            not in monthly_sales_dict
        ):

            monthly_sales_dict[
                month_key
            ] = {

                "units_sold": 0.0,

                "revenue": 0.0
            }

        quantity = float(
            sale.quantity or 0
        )

        revenue = float(
            sale.revenue or 0
        )

        monthly_sales_dict[
            month_key
        ][
            "units_sold"
        ] += quantity

        monthly_sales_dict[
            month_key
        ][
            "revenue"
        ] += revenue

    # ========================================================
    # CREATE MONTHLY SALES
    # ========================================================

    monthly_sales = []

    sorted_months = sorted(
        monthly_sales_dict.keys()
    )

    for index, month_key in enumerate(
        sorted_months,
        start=1
    ):

        values = (
            monthly_sales_dict[
                month_key
            ]
        )

        period_label = (
            f"Period {index}"
        )

        monthly_sales.append({

            "label":
                period_label,

            "period":
                index,

            "month":
                period_label,

            "date":
                period_label,

            "units_sold":
                int(
                    round(
                        values[
                            "units_sold"
                        ]
                    )
                ),

            "units":
                int(
                    round(
                        values[
                            "units_sold"
                        ]
                    )
                ),

            "revenue":
                round(
                    values[
                        "revenue"
                    ],
                    2
                )
        })

    # ========================================================
    # SALES TREND
    # ========================================================

    sales_trend = []

    for item in monthly_sales:

        sales_trend.append({

            "label":
                item["label"],

            "period":
                item["period"],

            "units":
                item["units"],

            "units_sold":
                item["units_sold"],

            "revenue":
                item["revenue"]
        })

    # ========================================================
    # REVENUE TREND
    # ========================================================

    revenue_trend = []

    for item in monthly_sales:

        revenue_trend.append({

            "label":
                item["label"],

            "period":
                item["period"],

            "revenue":
                item["revenue"]
        })

    # ========================================================
    # SALES TREND DIRECTION
    # ========================================================

    sales_trend_direction = "Stable"

    if len(sales_trend) >= 2:

        first_units = float(
            sales_trend[0]["units"]
        )

        last_units = float(
            sales_trend[-1]["units"]
        )

        if last_units > (
            first_units * 1.05
        ):

            sales_trend_direction = (
                "Increasing"
            )

        elif last_units < (
            first_units * 0.95
        ):

            sales_trend_direction = (
                "Decreasing"
            )

    # ========================================================
    # CATEGORY REVENUE
    # ========================================================

    category_revenue = 0.0

    if product.category_id is not None:

        category_revenue = (

            db.query(
                func.sum(
                    Sale.revenue
                )
            )

            .join(
                Product,
                Product.product_code ==
                Sale.product_code
            )

            .filter(
                Product.category_id ==
                product.category_id
            )

            .scalar()

        )

    category_revenue = float(
        category_revenue or 0
    )

    # ========================================================
    # CATEGORY SHARE
    # ========================================================

    if category_revenue > 0:

        category_share = (

            total_revenue /
            category_revenue

        ) * 100

    else:

        category_share = 0

    # ========================================================
    # CATEGORY RANK
    # ========================================================

    category_rank = None

    if product.category_id is not None:

        category_products = (

            db.query(

                Product.product_code,

                func.sum(
                    Sale.revenue
                ).label(
                    "product_revenue"
                )

            )

            .join(
                Sale,
                Sale.product_code ==
                Product.product_code
            )

            .filter(
                Product.category_id ==
                product.category_id
            )

            .group_by(
                Product.product_code
            )

            .order_by(
                func.sum(
                    Sale.revenue
                ).desc()
            )

            .all()

        )

        for index, row in enumerate(
            category_products,
            start=1
        ):

            if str(
                row.product_code
            ) == str(
                product_code_value
            ):

                category_rank = index

                break

    # ========================================================
    # RESPONSE
    # ========================================================

    response = {

        "product_code":
            product_code_value,

        "product_name":
            product_name,

        "name":
            product_name,

        "category":
            category_name,

        "category_name":
            category_name,

        "current_price":
            round(
                current_price,
                2
            ),

        "average_selling_price":
            round(
                average_selling_price,
                2
            ),

        "units_sold":
            int(
                round(
                    total_units_sold
                )
            ),

        "total_units_sold":
            int(
                round(
                    total_units_sold
                )
            ),

        "total_orders":
            total_transactions,

        "total_transactions":
            total_transactions,

        "product_revenue":
            round(
                total_revenue,
                2
            ),

        "total_revenue":
            round(
                total_revenue,
                2
            ),

        "stock_quantity":
            int(
                product.stock_quantity or 0
            ),

        "average_units_per_order":
            round(
                average_units_per_order,
                2
            ),

        "monthly_sales":
            monthly_sales,

        "sales_trend":
            sales_trend,

        "revenue_trend":
            revenue_trend,

        "sales_trend_direction":
            sales_trend_direction,

        "category_revenue":
            round(
                category_revenue,
                2
            ),

        "category_share":
            round(
                category_share,
                2
            ),

        "category_rank":
            category_rank
    }

    # ========================================================
    # DEBUG
    # ========================================================

    print()
    print(
        "=========================================="
    )

    print(
        "PRODUCT ANALYTICS"
    )

    print(
        "=========================================="
    )

    print(
        "Product Code:",
        product_code_value
    )

    print(
        "Product Name:",
        product_name
    )

    print(
        "Number of sales records:",
        len(sales)
    )

    print(
        "Total Units:",
        total_units_sold
    )

    print(
        "Total Revenue:",
        total_revenue
    )

    print(
        "Total Transactions:",
        total_transactions
    )

    print(
        "Monthly records:",
        len(monthly_sales)
    )

    print(
        "Category rank:",
        category_rank
    )

    print(
        "=========================================="
    )

    return response