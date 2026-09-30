import os
import json
from pathlib import Path
from dotenv import load_dotenv
from google import genai


# ============================================================
# PROJECT PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv(BASE_DIR / ".env")


# ============================================================
# GEMINI API KEY
# ============================================================

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY was not found in the .env file."
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=api_key,
    http_options={
        "api_version": "v1"
    }
)


# ============================================================
# GENERATE BUSINESS INSIGHTS
# ============================================================

def generate_business_insights(business_data):

    # Extract only the information Gemini actually needs
    question = business_data.get(
        "question",
        "Analyze my business performance and identify important recommendations."
    )

    historical_kpis = business_data.get("Historical KPIs", {})
    products = business_data.get("Products", [])
    product_count = business_data.get("Product Count", 0)
    user_role = business_data.get("User Role", "Business Analyst")

    prompt = f"""
You are PricePilot AI, a business intelligence assistant.

Analyze the following business data and answer the user's question.

USER QUESTION:
{question}

BUSINESS ROLE:
{user_role}

HISTORICAL KPIs:
{json.dumps(historical_kpis, default=str)}

PRODUCT DATA:
{json.dumps(products, default=str)}

TOTAL PRODUCTS:
{product_count}

IMPORTANT:
- Historical Revenue is in GBP (£).
- Recommended Price is an ML-based estimate.
- Predicted Demand is predicted quantity, not orders.
- Expected Revenue is a pricing scenario estimate.
- Expected Profit is a pricing scenario estimate.
- Do not mix historical metrics with ML scenario estimates.
- Do not invent missing information.
- Do not make unsupported causal claims.

TASK:

Provide:
1. One short overall business insight.
2. Three to five actionable recommendations.
3. Key factors considered in the analysis.

Recommendations may relate to:
Pricing, Demand, Sales, Inventory, Promotion, Revenue, Product Performance.

RETURN ONLY VALID JSON.

Use exactly this structure:

{{
    "summary": "Short overall business insight",

    "recommendations": [
        {{
            "title": "Recommendation title",
            "description": "Short explanation based on the provided data",
            "priority": "High"
        }}
    ],

    "key_factors": [
        {{
            "name": "Price",
            "importance": "High",
            "reason": "Why this factor matters"
        }},
        {{
            "name": "Demand",
            "importance": "High",
            "reason": "Why this factor matters"
        }},
        {{
            "name": "Sales",
            "importance": "Medium",
            "reason": "Why this factor matters"
        }},
        {{
            "name": "Competition",
            "importance": "Medium",
            "reason": "Why this factor matters"
        }}
    ]
}}

RULES:
- Keep responses concise.
- Use simple business language.
- Do not use markdown.
- Do not create alerts.
- Do not create additional fields.
- Do not invent numerical values.
- Use £ for GBP values.
"""

    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=prompt,
        generation_config={
            "thinking_level": "minimal"
        }
    )

    response_text = interaction.output_text.strip()

    try:

        if response_text.startswith("```json"):
            response_text = response_text[7:]

        elif response_text.startswith("```"):
            response_text = response_text[3:]

        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        return json.loads(response_text)

    except json.JSONDecodeError:

        return {
            "summary": response_text,
            "recommendations": [],
            "key_factors": []
        }