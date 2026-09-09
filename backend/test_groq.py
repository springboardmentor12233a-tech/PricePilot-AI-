from backend.groq_service import generate_pricing_insight


result = generate_pricing_insight(
    forecasted_demand=109.8,
    inventory_level=195,
    current_price=72.72,
    competitor_price=85.73,
    recommended_price=72.72,
    action="Maintain Price"
)

print("\n========== GROQ AI INSIGHT ==========")
print(result)
print("=====================================")