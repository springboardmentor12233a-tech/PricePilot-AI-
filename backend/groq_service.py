import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY is not configured in .env")

client = Groq(api_key=api_key)


def generate_pricing_insight(
    forecasted_demand,
    inventory_level,
    current_price,
    competitor_price,
    recommended_price,
    action
):

    prompt = f"""
You are an AI business pricing assistant for PricePilot AI.

Analyze the following retail pricing information:

Forecasted Demand: {forecasted_demand}
Inventory Level: {inventory_level}
Current Price: {current_price}
Competitor Price: {competitor_price}
Recommended Price: {recommended_price}
Pricing Action: {action}

Provide a short business insight explaining:
1. Demand situation
2. Inventory situation
3. Price comparison
4. Why the recommended pricing action makes sense

Keep the response concise and practical.
Do not invent additional data.
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
        max_tokens=250
    )

    return response.choices[0].message.content