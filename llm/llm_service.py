import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai


# Find the main project folder
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env
load_dotenv(BASE_DIR / ".env")

# Get Gemini API key
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY was not found in the .env file.")

# Create Gemini client
client = genai.Client(
    api_key=api_key,
    http_options={"api_version": "v1"}
)


def generate_business_insights(business_data):
    prompt = f"""
You are PricePilot AI, a business intelligence assistant for a
dynamic pricing and revenue intelligence system.

Business data:
{business_data}

The user's question is:
{business_data.get("question")}

Important definitions:
Total Revenue is historical revenue from the UCI Online Retail dataset
and is expressed in GBP (£).

Recommended Price is the model's recommended price for a product.

Predicted Demand is the ML model's predicted demand quantity.

Expected Revenue is the estimated revenue for the tested pricing scenario.

Expected Profit is the estimated profit for the tested pricing scenario.

Profit Improvement Percentage compares the estimated profit at the
recommended price with the current-price scenario.

Market Position describes the current price compared with competitors.

Pricing results are model-based estimates and are not guaranteed
real-world outcomes.

Predicted Demand is not the number of orders.

Recommended Price and Average Order Value are different metrics.

Do not assume historical revenue and scenario expected revenue
cover the same period or products.

Answer the user's question directly.

Response rules:
- Keep the answer short.
- Use a maximum of 5 short sentences.
- Use simple business language.
- Use plain text only.
- Do not use markdown.
- Do not use #, *, -, or bullet symbols.
- Do not create headings.
- Do not repeat the question.
- Use £ for GBP values.
- Clearly distinguish historical metrics from model predictions.
- Do not invent missing information.
- Do not make causal claims unless the data supports them.
"""

    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=prompt
    )

    return interaction.output_text

# Test the function
if __name__ == "__main__":

    sample_data = {
        "Total Revenue": 10666684.54,
        "Total Orders": 19960,
        "Total Customers": 4335,
        "Average Order Value": 534.40,
        "Recommended Price": 100,
        "Predicted Demand": 63428,
        "Expected Revenue": 6342655.61
    }

    insights = generate_business_insights(sample_data)

    print("\n===== PRICEPILOT BUSINESS INSIGHTS =====\n")
    print(insights)