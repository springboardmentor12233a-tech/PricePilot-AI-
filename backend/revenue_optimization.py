import numpy as np
import pandas as pd

def calculate_revenue_profit(
    price: float,
    predicted_demand: float,
    cost_per_unit: float
):
    if price <= 0:
        raise ValueError("Price must be greater than 0")

    if predicted_demand < 0:
        raise ValueError("Predicted demand cannot be negative")

    if cost_per_unit < 0:
        raise ValueError("Cost per unit cannot be negative")

    revenue = price * predicted_demand

    total_cost = cost_per_unit * predicted_demand

    profit = revenue - total_cost

    if revenue > 0:
        profit_margin = (profit / revenue) * 100
    else:
        profit_margin = 0

    return {
        "price": round(price, 2),
        "predicted_demand": round(predicted_demand, 2),
        "cost_per_unit": round(cost_per_unit, 2),
        "revenue": round(revenue, 2),
        "total_cost": round(total_cost, 2),
        "profit": round(profit, 2),
        "profit_margin": round(profit_margin, 2)
    }

def optimize_profit(
    current_price: float,
    cost_per_unit: float,
    min_price: float,
    max_price: float,
    number_of_prices: int,
    demand_model,
    model_features,
    base_input: dict
):
    if current_price <= 0:
        raise ValueError("Current price must be greater than 0")

    if cost_per_unit < 0:
        raise ValueError("Cost per unit cannot be negative")

    if min_price <= 0:
        raise ValueError("Minimum price must be greater than 0")

    if max_price < min_price:
        raise ValueError("Maximum price must be greater than or equal to minimum price")

    if number_of_prices < 2:
        raise ValueError("Number of prices must be at least 2")

    candidate_prices = np.linspace(
        min_price,
        max_price,
        number_of_prices
    )

    price_analysis = []

    for candidate_price in candidate_prices:

        input_data = base_input.copy()

        input_data["Price"] = float(candidate_price)

        input_df = pd.DataFrame([input_data])

        input_df = pd.get_dummies(
            input_df,
            columns=[
                "Product_ID",
                "Marketing_Campaign",
                "Seasonal_Trend"
            ],
            drop_first=True
        )

        input_df = input_df.reindex(
            columns=model_features,
            fill_value=0
        )

        input_df = input_df.astype(float)

        predicted_demand = demand_model.predict(input_df)[0]

        predicted_demand = max(float(predicted_demand), 0)

        expected_revenue = candidate_price * predicted_demand

        expected_cost = cost_per_unit * predicted_demand

        expected_profit = expected_revenue - expected_cost

        price_analysis.append({
            "price": round(float(candidate_price), 2),
            "predicted_demand": round(predicted_demand, 2),
            "expected_revenue": round(float(expected_revenue), 2),
            "expected_cost": round(float(expected_cost), 2),
            "expected_profit": round(float(expected_profit), 2)
        })

    best_option = max(
        price_analysis,
        key=lambda x: x["expected_profit"]
    )

    price_change_percentage = (
    (best_option["price"] - current_price) / current_price
     ) * 100

    current_option = min(price_analysis,
    key=lambda x: abs(x["price"] - current_price)
    )

    profit_improvement_percentage = (
    (best_option["expected_profit"] - current_option["expected_profit"])
    / current_option["expected_profit"]
    )  * 100 if current_option["expected_profit"] > 0 else 0

    return {
    "current_price": round(current_price, 2),
    "recommended_price": best_option["price"],
    "price_change_percentage": round(price_change_percentage, 2),
    "predicted_demand": best_option["predicted_demand"],
    "expected_revenue": best_option["expected_revenue"],
    "expected_cost": best_option["expected_cost"],
    "expected_profit": best_option["expected_profit"],
    "profit_improvement_percentage": round(profit_improvement_percentage, 2),
    "price_analysis": price_analysis
    }