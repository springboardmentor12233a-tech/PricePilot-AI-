"""
PricePilot AI — Milestone 3
BI Report generation and download endpoints
"""
import io
import csv
import json
from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from ...models.user import User, UserRole
from ...services.auth_service import require_roles

router = APIRouter(prefix="/api/v3/reports", tags=["reports-v3"])

_analyst_plus = require_roles(UserRole.admin, UserRole.analyst)

PRODUCT_DATA = [
    {"Product": "UltraView 4K Monitor",   "Category": "Electronics",     "Price": 245.50, "Cost": 137.0, "CompAvg": 258.90, "Margin%": 44.2, "DailyDemand": 38.2, "AnnualRev": 3390000, "Status": "Optimal"},
    {"Product": "Aura Pro Headphones",    "Category": "Electronics",     "Price": 187.50, "Cost": 110.5, "CompAvg": 196.43, "Margin%": 41.1, "DailyDemand": 40.7, "AnnualRev": 2790000, "Status": "Raise Price"},
    {"Product": "SmartHome Hub Pro",      "Category": "Electronics",     "Price": 132.00, "Cost": 63.0,  "CompAvg": 138.50, "Margin%": 52.3, "DailyDemand": 35.1, "AnnualRev": 1690000, "Status": "Optimal"},
    {"Product": "ThermoComfort Cooler",   "Category": "Electronics",     "Price": 89.99,  "Cost": 46.1,  "CompAvg": 94.20,  "Margin%": 48.7, "DailyDemand": 42.0, "AnnualRev": 1380000, "Status": "Optimal"},
    {"Product": "LuxeDream Mattress",     "Category": "Home & Kitchen",  "Price": 189.00, "Cost": 84.8,  "CompAvg": 198.75, "Margin%": 55.2, "DailyDemand": 28.4, "AnnualRev": 1960000, "Status": "Raise Price"},
    {"Product": "ChefMaster Blender",     "Category": "Home & Kitchen",  "Price": 98.50,  "Cost": 46.2,  "CompAvg": 103.20, "Margin%": 53.1, "DailyDemand": 37.6, "AnnualRev": 1350000, "Status": "Optimal"},
    {"Product": "AquaPure Filter",        "Category": "Home & Kitchen",  "Price": 67.00,  "Cost": 27.8,  "CompAvg": 71.80,  "Margin%": 58.4, "DailyDemand": 44.2, "AnnualRev": 1080000, "Status": "Optimal"},
    {"Product": "FlexFit Yoga Mat",       "Category": "Sports & Outdoors","Price": 45.00, "Cost": 18.0,  "CompAvg": 48.90,  "Margin%": 60.0, "DailyDemand": 49.8, "AnnualRev": 820000,  "Status": "Optimal"},
    {"Product": "ProRunner Shoes",        "Category": "Sports & Outdoors","Price": 142.00,"Cost": 75.0,  "CompAvg": 149.50, "Margin%": 47.2, "DailyDemand": 33.9, "AnnualRev": 1760000, "Status": "Raise Price"},
    {"Product": "HydroPeak Bottle",       "Category": "Sports & Outdoors","Price": 35.00, "Cost": 12.0,  "CompAvg": 37.80,  "Margin%": 65.7, "DailyDemand": 58.3, "AnnualRev": 745000,  "Status": "Optimal"},
    {"Product": "UrbanEdge Jacket",       "Category": "Apparel",         "Price": 89.00,  "Cost": 38.0,  "CompAvg": 93.40,  "Margin%": 57.3, "DailyDemand": 43.7, "AnnualRev": 1420000, "Status": "Optimal"},
    {"Product": "ClassicFit Jeans",       "Category": "Apparel",         "Price": 68.00,  "Cost": 30.0,  "CompAvg": 71.20,  "Margin%": 55.9, "DailyDemand": 46.2, "AnnualRev": 1150000, "Status": "Optimal"},
    {"Product": "GlowUp Serum",           "Category": "Health & Beauty", "Price": 55.00,  "Cost": 19.5,  "CompAvg": 57.50,  "Margin%": 64.5, "DailyDemand": 41.5, "AnnualRev": 834000,  "Status": "Optimal"},
    {"Product": "VitalBoost Vitamins",    "Category": "Health & Beauty", "Price": 38.00,  "Cost": 12.0,  "CompAvg": 40.20,  "Margin%": 68.4, "DailyDemand": 52.7, "AnnualRev": 732000,  "Status": "Optimal"},
    {"Product": "ZenAroma Diffuser",      "Category": "Health & Beauty", "Price": 28.00,  "Cost": 11.2,  "CompAvg": 29.80,  "Margin%": 60.2, "DailyDemand": 44.8, "AnnualRev": 458000,  "Status": "Optimal"},
]


@router.get("/download/csv")
def download_csv(current_user: User = Depends(_analyst_plus)):
    """Download product KPIs as CSV. Analyst+ only."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(PRODUCT_DATA[0].keys()))
    writer.writeheader()
    writer.writerows(PRODUCT_DATA)
    output.seek(0)
    filename = f"pricepilot_report_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/download/json")
def download_json(current_user: User = Depends(_analyst_plus)):
    """Download full report as JSON."""
    report = {
        "generated_at": datetime.now().isoformat(),
        "generated_by": current_user.email,
        "summary": {
            "total_revenue": 28245979,
            "gross_profit": 13511274,
            "avg_margin_pct": 54.89,
            "total_units": 293345,
            "products_count": 15,
        },
        "products": PRODUCT_DATA,
        "ml_models": {
            "price_model": {"name": "LightGBM", "r2": 1.0000, "rmse": 0.45, "target": "price"},
            "demand_model": {"name": "XGBoost",  "r2": 0.9050, "mae": 5.07,  "target": "demand"},
        },
        "recommendations": [
            "Raise price for Aura Pro Headphones by $5-7 (currently $8.93 below competitor avg)",
            "Raise price for ProRunner Shoes by $5 (currently $7.50 below competitor avg)",
            "Raise price for LuxeDream Mattress by $9 (premium category supports higher price)",
        ]
    }
    filename = f"pricepilot_full_report_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    return StreamingResponse(
        io.BytesIO(json.dumps(report, indent=2).encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
