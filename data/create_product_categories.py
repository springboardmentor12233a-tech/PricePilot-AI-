import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.database.database import SessionLocal
from backend.database.models import Category, Product


CATEGORIES = {
    "Home & Decor": [
        "HEART",
        "HOLDER",
        "CUSHION",
        "CANDLE",
        "MIRROR",
        "FRAME",
        "ORNAMENT",
        "DECORATION",
        "SIGN",
        "CLOCK",
    ],

    "Kitchen & Dining": [
        "MUG",
        "CUP",
        "PLATE",
        "BOWL",
        "SPOON",
        "FORK",
        "KNIFE",
        "KITCHEN",
        "TEA",
        "COFFEE",
        "JUG",
        "GLASS",
    ],

    "Toys": [
        "TOY",
        "GAME",
        "DOLL",
        "CHILDREN",
        "PUZZLE",
        "PLAY",
    ],

    "Stationery": [
        "PEN",
        "PENCIL",
        "NOTEBOOK",
        "PAPER",
        "CARD",
        "BOOK",
        "RULER",
        "WRITING",
    ],

    "Fashion": [
        "T-SHIRT",
        "SHIRT",
        "DRESS",
        "APRON",
        "BAG",
        "PURSE",
        "HAT",
        "SOCK",
        "SCARF",
    ],

    "Jewelry & Accessories": [
        "NECKLACE",
        "BRACELET",
        "EARRING",
        "RING",
        "JEWEL",
        "HAIR",
        "ACCESSORY",
    ],

    "Garden": [
        "GARDEN",
        "PLANT",
        "FLOWER",
        "POT",
        "BIRD",
        "GARDENING",
    ],

    "Lighting": [
        "LIGHT",
        "LAMP",
        "LANTERN",
        "CANDLE",
        "T-LIGHT",
    ],

    "Seasonal": [
        "CHRISTMAS",
        "EASTER",
        "HALLOWEEN",
        "VALENTINE",
        "XMAS",
        "SEASONAL",
    ],
}


def get_category(product_name):
    name = product_name.upper()

    for category_name, keywords in CATEGORIES.items():
        for keyword in keywords:
            if keyword in name:
                return category_name

    return "Other"


db = SessionLocal()

try:
    # Create categories
    category_objects = {}

    for category_name in list(CATEGORIES.keys()) + ["Other"]:
        category = (
            db.query(Category)
            .filter(Category.name == category_name)
            .first()
        )

        if not category:
            category = Category(
                name=category_name,
                description=f"{category_name} products"
            )
            db.add(category)
            db.flush()

        category_objects[category_name] = category

    # Assign products
    products = db.query(Product).all()

    counts = {}

    for product in products:
        category_name = get_category(product.name)

        product.category_id = category_objects[category_name].id

        counts[category_name] = counts.get(category_name, 0) + 1

    db.commit()

    print("\n==============================")
    print("CATEGORY ASSIGNMENT COMPLETED")
    print("==============================")

    for category_name, count in sorted(
        counts.items(),
        key=lambda x: x[1],
        reverse=True
    ):
        print(f"{category_name}: {count}")

finally:
    db.close()