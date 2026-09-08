import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CompetitorProduct(Base):
    __tablename__ = "competitor_products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    competitor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "competitors.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "products.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    sku: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    match_confidence: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

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

    competitor: Mapped["Competitor"] = relationship(
        "Competitor",
        back_populates="matched_products",
    )

    product: Mapped["Product"] = relationship(
        "Product",
    )

    prices: Mapped[list["CompetitorPrice"]] = relationship(
        "CompetitorPrice",
        back_populates="competitor_product",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<CompetitorProduct id={self.id} name={self.name}>"
