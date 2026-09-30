from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from backend.database.database import get_db
from backend.database.models import (Sale, Product , Category, CompetitorPrice)
from backend.auth.dependencies import require_role


router = APIRouter(
    prefix="/kpi",
    tags=["KPI"]
)


@router.get("/summary")
def get_kpi_summary(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(
            "Admin",
            "Business Analyst",
            "User"
        )
    )
):
    # Total revenue
    total_revenue = (
        db.query(func.sum(Sale.revenue))
        .scalar()
    ) or 0

    # Total sales transactions
    total_sales = (
        db.query(func.count(Sale.id))
        .scalar()
    ) or 0

    # Total units sold
    total_units = (
        db.query(func.sum(Sale.quantity))
        .scalar()
    ) or 0

    # Total products
    total_products = (
        db.query(func.count(Product.id))
        .scalar()
    ) or 0

    # Unique invoices
    unique_invoices = (
        db.query(func.count(func.distinct(Sale.invoice_no)))
        .scalar()
    ) or 0

    # Average order value
    average_order_value = (
        total_revenue / unique_invoices
        if unique_invoices > 0
        else 0
    )

    return {
        "total_revenue": round(total_revenue, 2),
        "total_sales": total_sales,
        "total_units_sold": total_units,
        "total_products": total_products,
        "unique_orders": unique_invoices,
        "average_order_value": round(
            average_order_value,
            2
        )
    }
@router.get("/revenue-trend")
def get_revenue_trend(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(
            "Admin",
            "Business Analyst",
            "User"
        )
    )
):
    results = (
        db.query(
            func.date(Sale.invoice_date).label("date"),
            func.sum(Sale.revenue).label("revenue")
        )
        .group_by(func.date(Sale.invoice_date))
        .order_by(func.date(Sale.invoice_date))
        .all()
    )

    return [
        {
            "date": str(row.date),
            "revenue": round(float(row.revenue), 2)
        }
        for row in results
    ]
@router.get("/top-products")
def get_top_products(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(
            "Admin",
            "Business Analyst",
            "User"
        )
    )
):
    results = (
        db.query(
            Product.id,
            Product.name,
            Product.product_code,
            func.sum(Sale.quantity).label("units_sold"),
            func.sum(Sale.revenue).label("revenue")
        )
        .join(
            Sale,
            Sale.product_code == Product.product_code
        )
        .group_by(
            Product.id,
            Product.name,
            Product.product_code
        )
        .order_by(
            func.sum(Sale.revenue).desc()
        )
        .limit(10)
        .all()
    )

    return [
        {
            "product_id": row.id,
            "product_code": row.product_code,
            "product_name": row.name,
            "units_sold": int(row.units_sold),
            "revenue": round(float(row.revenue), 2)
        }
        for row in results
    ]
@router.get("/category-revenue")
def get_category_revenue(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(
            "Admin",
            "Business Analyst",
            "User"
        )
    )
):
    results = (
        db.query(
            Product.category_id,
            Category.name.label("category_name"),
            func.sum(Sale.revenue).label("revenue"),
            func.sum(Sale.quantity).label("units_sold")
        )
        .join(
            Sale,
            Sale.product_code == Product.product_code
        )
        .join(
            Category,
            Product.category_id == Category.id
        )
        .group_by(
            Product.category_id,
            Category.name
        )
        .order_by(
            func.sum(Sale.revenue).desc()
        )
        .all()
    )

    return [
        {
            "category_id": row.category_id,
            "category_name": row.category_name,
            "revenue": round(float(row.revenue), 2),
            "units_sold": int(row.units_sold)
        }
        for row in results
    ]

# ============================================================
# COMPETITOR ANALYSIS
# ============================================================
def analyze_competitor_prices(
    current_price: float,
    competitor_prices: list[float]
):
    if not competitor_prices:
        return {
            "current_price": current_price,
            "average_competitor_price": None,
            "lowest_competitor_price": None,
            "highest_competitor_price": None,
            "price_difference": None,
            "price_difference_percent": None,
            "position": "No competitor data"
        }

    average_price = sum(competitor_prices) / len(competitor_prices)
    lowest_price = min(competitor_prices)
    highest_price = max(competitor_prices)

    difference = current_price - average_price

    difference_percent = (
        (difference / average_price) * 100
        if average_price != 0
        else 0
    )

    if current_price < lowest_price:
        position = "Below competitors"
    elif current_price > highest_price:
        position = "Above competitors"
    else:
        position = "Within competitor range"

    return {
        "current_price": round(current_price, 2),
        "average_competitor_price": round(average_price, 2),
        "lowest_competitor_price": round(lowest_price, 2),
        "highest_competitor_price": round(highest_price, 2),
        "price_difference": round(difference, 2),
        "price_difference_percent": round(difference_percent, 2),
        "position": position
    }
@router.get("/competitor-analysis/{product_code}")
def get_competitor_analysis(
    product_code: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(
            "Admin",
            "Business Analyst",
            "User"
        )
    )
):
    # Find product
    product = (
        db.query(Product)
        .filter(
            Product.product_code == product_code
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Get competitor prices
    competitor_prices = (
        db.query(CompetitorPrice)
        .filter(
            CompetitorPrice.product_code
            == product.product_code
        )
        .all()
    )

    if not competitor_prices:
        raise HTTPException(
            status_code=404,
            detail="No competitor prices available for this product"
        )

    prices = [
        float(item.competitor_price)
        for item in competitor_prices
    ]

    # Run competitor analysis
    result = analyze_competitor_prices(
        current_price=float(product.price),
        competitor_prices=prices
    )

    # Add product information
    result["product_code"] = product.product_code
    result["product_name"] = product.name

    # Add competitor names
    result["competitors"] = [
        {
            "competitor": item.competitor_name,
            "price": round(
                float(item.competitor_price),
                2
            )
        }
        for item in competitor_prices
    ]

    return result