from backend.database.database import SessionLocal
from backend.database.models import Product, CompetitorPrice

db = SessionLocal()

try:
    products = (
        db.query(Product)
        .filter(Product.is_active == True)
        .all()
    )

    print(f"Active products found: {len(products)}")

    added = 0

    for product in products:

        # Skip products that already have competitor prices
        existing = (
            db.query(CompetitorPrice)
            .filter(
                CompetitorPrice.product_code == product.product_code
            )
            .first()
        )

        if existing:
            continue

        # Create three competitor reference prices
        current_price = float(product.price)

        competitors = [
            ("Competitor A", round(current_price * 0.95, 2)),
            ("Competitor B", round(current_price * 1.03, 2)),
            ("Competitor C", round(current_price * 1.08, 2)),
        ]

        for name, price in competitors:

            db.add(
                CompetitorPrice(
                    product_code=product.product_code,
                    competitor_name=name,
                    competitor_price=price
                )
            )

        added += 1

        if added % 100 == 0:
            print(f"Processed: {added}")

    db.commit()

    print("--------------------------------")
    print("Competitor prices populated")
    print(f"Products processed: {added}")
    print("--------------------------------")

finally:
    db.close()