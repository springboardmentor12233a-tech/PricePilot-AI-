import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Inventory(Base):
    __tablename__ = "inventory"

    # ==================================================
    # DATABASE CONSTRAINTS AND INDEXES
    # ==================================================

    __table_args__ = (
        # Stock cannot be negative
        CheckConstraint(
            "quantity_on_hand >= 0",
            name="ck_inventory_quantity_on_hand_non_negative",
        ),

        # Reserved stock cannot be negative
        CheckConstraint(
            "reserved_quantity >= 0",
            name="ck_inventory_reserved_quantity_non_negative",
        ),

        # Reserved stock cannot exceed available stock
        CheckConstraint(
            "reserved_quantity <= quantity_on_hand",
            name="ck_inventory_reserved_not_greater_than_stock",
        ),

        # Reorder level cannot be negative
        CheckConstraint(
            "reorder_level >= 0",
            name="ck_inventory_reorder_level_non_negative",
        ),

        # Reorder quantity, when provided, cannot be negative
        CheckConstraint(
            "reorder_quantity IS NULL OR reorder_quantity >= 0",
            name="ck_inventory_reorder_quantity_non_negative",
        ),

        # Only one inventory record per variant
        Index(
            "uq_inventory_variant",
            "variant_id",
            unique=True,
            sqlite_where=text("variant_id IS NOT NULL"),
            postgresql_where=text("variant_id IS NOT NULL"),
        ),

        # Only one product-level inventory record
        # when the inventory is not associated with a variant
        Index(
            "uq_inventory_product_without_variant",
            "product_id",
            unique=True,
            sqlite_where=text("variant_id IS NULL"),
            postgresql_where=text("variant_id IS NULL"),
        ),
    )

    # ==================================================
    # PRIMARY KEY
    # ==================================================

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ==================================================
    # FOREIGN KEYS
    # ==================================================

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "products.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    variant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "product_variants.id",
            ondelete="CASCADE",
        ),
        nullable=True,
        index=True,
    )

    # ==================================================
    # STOCK QUANTITIES
    # ==================================================

    quantity_on_hand: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    reserved_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    reorder_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    reorder_quantity: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # ==================================================
    # TIMESTAMPS
    # ==================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ==================================================
    # RELATIONSHIPS
    # ==================================================

    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="inventory_items",
    )

    variant: Mapped["ProductVariant | None"] = relationship(
        "ProductVariant",
        back_populates="inventory_items",
    )

    # ==================================================
    # COMPUTED PROPERTIES
    # ==================================================

    @property
    def available_quantity(self) -> int:
        return self.quantity_on_hand - self.reserved_quantity

    @property
    def is_low_stock(self) -> bool:
        return self.available_quantity <= self.reorder_level

    # ==================================================
    # REPRESENTATION
    # ==================================================

    def __repr__(self) -> str:
        return (
            f"<Inventory "
            f"id={self.id} "
            f"product_id={self.product_id} "
            f"variant_id={self.variant_id} "
            f"quantity_on_hand={self.quantity_on_hand} "
            f"reserved_quantity={self.reserved_quantity}>"
        )