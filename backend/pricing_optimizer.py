def recommend_price(
    current_price,
    competitor_price,
    predicted_demand,
    inventory_level
):

    recommended_price = current_price

    # High demand + low inventory
    if predicted_demand > 120 and inventory_level < 200:
        recommended_price = current_price * 1.05

    # Low demand + high inventory
    elif predicted_demand < 80 and inventory_level > 300:
        recommended_price = current_price * 0.95

    # Our price is higher than competitor
    elif current_price > competitor_price:
        recommended_price = competitor_price

    return round(recommended_price, 2)
price = recommend_price(
    current_price=70,
    competitor_price=68,
    predicted_demand=130,
    inventory_level=150
)

print("Recommended Price:", price)
test_cases = [
    {
        "current_price": 70,
        "competitor_price": 68,
        "predicted_demand": 130,
        "inventory_level": 150
    },
    {
        "current_price": 70,
        "competitor_price": 72,
        "predicted_demand": 60,
        "inventory_level": 400
    },
    {
        "current_price": 70,
        "competitor_price": 70,
        "predicted_demand": 100,
        "inventory_level": 250
    }
]

for case in test_cases:

    price = recommend_price(**case)

    print(
        "Current Price:",
        case["current_price"]
    )

    print(
        "Recommended Price:",
        price
    )

    print("--------------------")

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