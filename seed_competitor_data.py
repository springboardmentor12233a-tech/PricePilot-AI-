from backend.database.database import SessionLocal
from backend.database.models import Product, CompetitorPrice


db = SessionLocal()

try:
    products = db.query(Product).limit(3).all()

    if not products:
        print("No products found in the database.")
    else:
        for product in products:

            competitors = [
                ("Amazon", round(product.price * 1.05, 2)),
                ("Flipkart", round(product.price * 0.98, 2)),
                ("Croma", round(product.price * 1.03, 2)),
            ]

            for competitor_name, price in competitors:

                existing = (
                    db.query(CompetitorPrice)
                    .filter(
                        CompetitorPrice.product_code == product.product_code,
                        CompetitorPrice.competitor_name == competitor_name
                    )
                    .first()
                )

                if not existing:
                    competitor = CompetitorPrice(
                        product_code=product.product_code,
                        competitor_name=competitor_name,
                        price=price
                    )

                    db.add(competitor)

        db.commit()

        print("Competitor data added successfully.")

finally:
    db.close()