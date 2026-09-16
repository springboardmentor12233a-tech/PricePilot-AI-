from statistics import mean


def analyze_competitor_prices(
    current_price: float,
    competitor_prices: list[float]
):
    # Validate current price
    if current_price <= 0:
        raise ValueError("Current price must be greater than 0")

    # Validate competitor prices
    if not competitor_prices:
        raise ValueError("At least one competitor price is required")

    if any(price <= 0 for price in competitor_prices):
        raise ValueError("All competitor prices must be greater than 0")

    average_competitor_price = mean(competitor_prices)
    minimum_competitor_price = min(competitor_prices)
    maximum_competitor_price = max(competitor_prices)

    price_difference = current_price - average_competitor_price

    price_gap_percentage = (
        price_difference / average_competitor_price
    ) * 100

    if price_gap_percentage < -5:
        market_position = "Below Market"
        recommendation = "Price can potentially be increased"

    elif price_gap_percentage > 5:
        market_position = "Above Market"
        recommendation = "Consider reducing the price"

    else:
        market_position = "At Market"
        recommendation = "Current price is competitive"

    competitor_comparison = []

    for index, competitor_price in enumerate(competitor_prices, start=1):

        difference = current_price - competitor_price

        difference_percentage = (
            difference / competitor_price
        ) * 100

        if difference_percentage > 0:
            comparison = "Higher than competitor"

        elif difference_percentage < 0:
            comparison = "Lower than competitor"

        else:
            comparison = "Same as competitor"

        competitor_comparison.append({
            "competitor": f"Competitor {index}",
            "price": round(competitor_price, 2),
            "price_difference": round(difference, 2),
            "price_difference_percentage": round(
                difference_percentage, 2
            ),
            "comparison": comparison
        })

    return {
        "current_price": round(current_price, 2),
        "average_competitor_price": round(
            average_competitor_price, 2
        ),
        "minimum_competitor_price": round(
            minimum_competitor_price, 2
        ),
        "maximum_competitor_price": round(
            maximum_competitor_price, 2
        ),
        "price_difference": round(price_difference, 2),
        "price_gap_percentage": round(
            price_gap_percentage, 2
        ),
        "market_position": market_position,
        "recommendation": recommendation,
        "competitor_comparison": competitor_comparison
    }