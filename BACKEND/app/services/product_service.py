import uuid
import re
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.schemas.product import (
    InventoryUpdate,
    ProductCreate,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantUpdate,
)


def slugify(text: str) -> str:
    """Generate URL-friendly slug from text."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text


# ==================================================
# CATEGORIES
# ==================================================

def create_category(db: Session, cat_in: CategoryCreate) -> Category:
    """Create a product category."""
    slug = cat_in.slug or slugify(cat_in.name)

    existing = (
        db.query(Category)
        .filter(Category.organization_id == cat_in.organization_id, Category.slug == slug)
        .first()
    )
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    category = Category(
        organization_id=cat_in.organization_id,
        parent_id=cat_in.parent_id,
        name=cat_in.name,
        slug=slug,
        description=cat_in.description,
        is_active=cat_in.is_active,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_categories(db: Session, organization_id: uuid.UUID) -> list[Category]:
    """Get all categories for an organization."""
    return db.query(Category).filter(Category.organization_id == organization_id).all()


# ==================================================
# PRODUCTS
# ==================================================

def create_product(db: Session, prod_in: ProductCreate) -> Product:
    """Create product and automatically create base inventory record."""
    slug = prod_in.slug or slugify(prod_in.name)

    # Check SKU uniqueness within organization
    existing_sku = (
        db.query(Product)
        .filter(Product.organization_id == prod_in.organization_id, Product.sku == prod_in.sku)
        .first()
    )
    if existing_sku:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{prod_in.sku}' already exists in this organization.",
        )

    # Ensure unique slug
    existing_slug = (
        db.query(Product)
        .filter(Product.organization_id == prod_in.organization_id, Product.slug == slug)
        .first()
    )
    if existing_slug:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    product = Product(
        organization_id=prod_in.organization_id,
        category_id=prod_in.category_id,
        name=prod_in.name,
        sku=prod_in.sku,
        slug=slug,
        brand=prod_in.brand,
        description=prod_in.description,
        cost_price=prod_in.cost_price,
        base_price=prod_in.base_price,
        currency=prod_in.currency,
        is_active=prod_in.is_active,
    )
    db.add(product)
    db.flush()

    # Base inventory
    inventory = Inventory(
        product_id=product.id,
        variant_id=None,
        quantity_on_hand=0,
        reserved_quantity=0,
        reorder_level=5,
    )
    db.add(inventory)

    db.commit()
    db.refresh(product)
    return product


def get_products(
    db: Session,
    organization_id: uuid.UUID,
    category_id: uuid.UUID | None = None,
    search: str | None = None,
) -> list[Product]:
    """Query products for an organization."""
    query = db.query(Product).filter(Product.organization_id == organization_id)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))
    return query.all()


def get_product(db: Session, product_id: uuid.UUID) -> Product:
    """Get product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


def update_product(db: Session, product_id: uuid.UUID, prod_in: ProductUpdate) -> Product:
    """Update product details."""
    product = get_product(db, product_id)
    update_data = prod_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: uuid.UUID) -> bool:
    """Delete a product."""
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()
    return True


# ==================================================
# PRODUCT VARIANTS & INVENTORY
# ==================================================

def create_product_variant(
    db: Session, product_id: uuid.UUID, variant_in: ProductVariantCreate
) -> ProductVariant:
    """Create a variant for a product and initialize variant inventory."""
    product = get_product(db, product_id)

    # Check SKU
    existing = (
        db.query(ProductVariant)
        .filter(ProductVariant.product_id == product.id, ProductVariant.sku == variant_in.sku)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Variant SKU '{variant_in.sku}' already exists for this product.",
        )

    variant = ProductVariant(
        product_id=product.id,
        name=variant_in.name,
        sku=variant_in.sku,
        barcode=variant_in.barcode,
        attributes=variant_in.attributes,
        cost_price=variant_in.cost_price,
        price=variant_in.price,
        is_active=True,
    )
    db.add(variant)
    db.flush()

    # Add variant inventory
    inventory = Inventory(
        product_id=product.id,
        variant_id=variant.id,
        quantity_on_hand=0,
        reserved_quantity=0,
        reorder_level=5,
    )
    db.add(inventory)

    db.commit()
    db.refresh(variant)
    return variant


def get_inventory(db: Session, product_id: uuid.UUID, variant_id: uuid.UUID | None = None) -> Inventory:
    """Retrieve inventory record for product or variant."""
    query = db.query(Inventory).filter(Inventory.product_id == product_id)
    if variant_id:
        query = query.filter(Inventory.variant_id == variant_id)
    else:
        query = query.filter(Inventory.variant_id.is_(None))

    inventory = query.first()
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory record not found",
        )
    return inventory


def update_inventory(
    db: Session, product_id: uuid.UUID, inv_in: InventoryUpdate, variant_id: uuid.UUID | None = None
) -> Inventory:
    """Update stock quantities and reorder levels."""
    inventory = get_inventory(db, product_id, variant_id)
    update_data = inv_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            setattr(inventory, field, value)

    db.commit()
    db.refresh(inventory)
    return inventory
