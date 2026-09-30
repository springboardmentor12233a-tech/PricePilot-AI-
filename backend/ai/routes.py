from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from openai import OpenAI
import os
import json

from backend.database.database import get_db
from backend.database.models import Product, Sale


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/ai",
    tags=["AI Recommendations"]
)


# ============================================================
# OPENAI CLIENT
# ============================================================

api_key = os.getenv("OPENAI_API_KEY")

client = None

if api_key:
    client = OpenAI(api_key=api_key)


# ============================================================
# AI RECOMMENDATIONS
# ============================================================

@router.get("/recommendations")
def get_ai_recommendations(
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # CHECK API KEY
    # --------------------------------------------------------

    if client is None:

        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured."
        )

    # --------------------------------------------------------
    # BASIC BUSINESS METRICS
    # --------------------------------------------------------

    total_products = (
        db.query(
            func.count(Product.product_code)
        )
        .filter(
            Product.is_active == True
        )
        .scalar()
        or 0
    )

    total_units_sold = (
        db.query(
            func.sum(Sale.quantity)
        )
        .scalar()
        or 0
    )

    total_revenue = (
        db.query(
            func.sum(Sale.revenue)
        )
        .scalar()
        or 0
    )

    total_transactions = (
        db.query(
            func.count(Sale.id)
        )
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # TOP PRODUCTS
    # --------------------------------------------------------

    top_products = (
        db.query(
            Product.name,
            func.sum(
                Sale.quantity
            ).label("units_sold"),
            func.sum(
                Sale.revenue
            ).label("revenue")
        )
        .join(
            Sale,
            Sale.product_code ==
            Product.product_code
        )
        .filter(
            Product.is_active == True
        )
        .group_by(
            Product.name
        )
        .order_by(
            func.sum(
                Sale.revenue
            ).desc()
        )
        .limit(10)
        .all()
    )

    top_product_data = []

    for product in top_products:

        top_product_data.append({
            "product": product.name,
            "units_sold": float(
                product.units_sold or 0
            ),
            "revenue": float(
                product.revenue or 0
            )
        })

    # --------------------------------------------------------
    # LOW STOCK PRODUCTS
    # --------------------------------------------------------

    low_stock_products = (
        db.query(Product)
        .filter(
            Product.is_active == True,
            Product.stock_quantity <= 10
        )
        .order_by(
            Product.stock_quantity.asc()
        )
        .limit(10)
        .all()
    )

    low_stock_data = []

    for product in low_stock_products:

        low_stock_data.append({
            "product": product.name,
            "stock": int(
                product.stock_quantity or 0
            ),
            "price": float(
                product.price or 0
            )
        })

    # --------------------------------------------------------
    # BUSINESS DATA FOR LLM
    # --------------------------------------------------------

    business_data = {

        "total_products":
            int(total_products),

        "total_units_sold":
            float(total_units_sold),

        "total_revenue":
            float(total_revenue),

        "total_transactions":
            int(total_transactions),

        "top_products":
            top_product_data,

        "low_stock_products":
            low_stock_data
    }

    # --------------------------------------------------------
    # AI PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are an AI business intelligence assistant
for a dynamic pricing and revenue optimization
system called PricePilot AI.

Analyze the following business data:

{json.dumps(
    business_data,
    indent=2
)}

Generate useful business recommendations and alerts.

Focus on:

1. Pricing opportunities
2. Demand opportunities
3. Revenue opportunities
4. Low-stock alerts
5. Product performance
6. Inventory concerns
7. General business insights

Do NOT invent numerical facts that are not present
in the provided data.

Return ONLY valid JSON in this exact structure:

{{
    "summary": "Short overall business summary",

    "recommendations": [
        {{
            "type": "pricing",
            "severity": "info",
            "title": "Recommendation title",
            "message": "Recommendation message",
            "reason": "Reason based on the provided data"
        }}
    ],

    "alerts": [
        {{
            "type": "inventory",
            "severity": "warning",
            "title": "Alert title",
            "message": "Alert message",
            "reason": "Reason based on the provided data"
        }}
    ]
}}

Severity must be one of:

"info"
"warning"
"critical"

Recommendation type can be:

"pricing"
"demand"
"revenue"
"product"
"inventory"
"business"

Alert type can be:

"inventory"
"pricing"
"demand"
"revenue"
"product"
"business"

Generate 3 to 5 recommendations
and 2 to 5 alerts when the data supports them.

If there is not enough evidence for an alert,
do not invent one.
"""

    # --------------------------------------------------------
    # CALL EXTERNAL LLM
    # --------------------------------------------------------

    try:

        response = client.responses.create(

            model="gpt-5.6-luna",

            instructions=(
                "You are a business intelligence "
                "assistant. Return only valid JSON."
            ),

            input=prompt,

            temperature=0.2
        )

        ai_text = response.output_text.strip()

    except Exception as e:

        print(
            "AI API ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to generate AI recommendations."
        )

    # --------------------------------------------------------
    # PARSE AI RESPONSE
    # --------------------------------------------------------

    try:

        ai_result = json.loads(
            ai_text
        )

    except json.JSONDecodeError:

        print(
            "INVALID AI RESPONSE:",
            ai_text
        )

        raise HTTPException(
            status_code=500,
            detail="AI returned an invalid response."
        )

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {

        "success": True,

        "model":
            "gpt-5.6-luna",

        "business_metrics": {

            "total_products":
                int(total_products),

            "total_units_sold":
                float(total_units_sold),

            "total_revenue":
                float(total_revenue),

            "total_transactions":
                int(total_transactions)
        },

        "summary":
            ai_result.get(
                "summary",
                ""
            ),

        "recommendations":
            ai_result.get(
                "recommendations",
                []
            ),

        "alerts":
            ai_result.get(
                "alerts",
                []
            )
    }