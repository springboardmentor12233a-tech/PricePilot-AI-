import uuid
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.sales_record import SalesRecord
from app.schemas.sales import SalesAnalyticsResponse, SalesRecordCreate
from app.services.product_service import get_inventory, get_product


def record_sale(db: Session, sale_in: SalesRecordCreate) -> SalesRecord:
    """
    Record a sale transaction and deduct inventory stock.
    """
    product = get_product(db, sale_in.product_id)

    # Determine unit price if not specified
    unit_price = sale_in.unit_price or product.base_price
    total_amount = Decimal(str(sale_in.quantity)) * unit_price

    # Deduct stock from inventory
    try:
        inventory = get_inventory(db, sale_in.product_id, sale_in.variant_id)
        if inventory.available_quantity < sale_in.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory stock. Available: {inventory.available_quantity}, requested: {sale_in.quantity}",
            )
        inventory.quantity_on_hand -= sale_in.quantity
    except HTTPException as e:
        raise e
    except Exception:
        pass

    record = SalesRecord(
        organization_id=sale_in.organization_id,
        product_id=sale_in.product_id,
        variant_id=sale_in.variant_id,
        quantity=sale_in.quantity,
        unit_price=unit_price,
        total_amount=total_amount,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_sales_analytics(db: Session, organization_id: uuid.UUID) -> SalesAnalyticsResponse:
    """
    Calculate sales analytics (total revenue, order count, units sold, average order value).
    """
    records = (
        db.query(SalesRecord)
        .filter(SalesRecord.organization_id == organization_id)
        .all()
    )

    if not records:
        return SalesAnalyticsResponse(
            total_sales_count=0,
            total_revenue=Decimal("0.00"),
            units_sold=0,
            average_order_value=Decimal("0.00"),
        )

    total_sales_count = len(records)
    total_revenue = Decimal(str(sum(r.total_amount for r in records)))
    units_sold = sum(r.quantity for r in records)
    aov = total_revenue / Decimal(str(total_sales_count)) if total_sales_count > 0 else Decimal("0.00")

    return SalesAnalyticsResponse(
        total_sales_count=total_sales_count,
        total_revenue=Decimal(str(round(total_revenue, 2))),
        units_sold=units_sold,
        average_order_value=Decimal(str(round(aov, 2))),
    )
