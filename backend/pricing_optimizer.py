def recommend_price(
    current_price,
    competitor_price,
    predicted_demand,
    inventory_level
):

    recommended_price = current_price

    if predicted_demand > 120 and inventory_level < 200:
        recommended_price = current_price * 1.05

    elif predicted_demand < 80 and inventory_level > 300:
        recommended_price = current_price * 0.95

    elif current_price > competitor_price:
        recommended_price = competitor_price

    return round(recommended_price, 2)