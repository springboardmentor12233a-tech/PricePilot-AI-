"""create competitor pricing and sales tables

Revision ID: 3a0f1b2c3d4e
Revises: 12a0ab5ab2dd
Create Date: 2026-09-05 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a0f1b2c3d4e'
down_revision: Union[str, Sequence[str], None] = '12a0ab5ab2dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Competitors
    op.create_table(
        'competitors',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', name='competitor_status'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_competitors_organization_id'), 'competitors', ['organization_id'], unique=False)

    # Competitor Products
    op.create_table(
        'competitor_products',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('competitor_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=True),
        sa.Column('sku', sa.String(length=100), nullable=True),
        sa.Column('match_confidence', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['competitor_id'], ['competitors.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_competitor_products_competitor_id'), 'competitor_products', ['competitor_id'], unique=False)
    op.create_index(op.f('ix_competitor_products_product_id'), 'competitor_products', ['product_id'], unique=False)

    # Competitor Prices
    op.create_table(
        'competitor_prices',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('competitor_product_id', sa.UUID(), nullable=False),
        sa.Column('price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='INR', nullable=False),
        sa.Column('availability', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('scraped_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['competitor_product_id'], ['competitor_products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_competitor_prices_competitor_product_id'), 'competitor_prices', ['competitor_product_id'], unique=False)

    # Price Histories
    op.create_table(
        'price_histories',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('variant_id', sa.UUID(), nullable=True),
        sa.Column('old_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('new_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('change_reason', sa.String(length=255), nullable=True),
        sa.Column('changed_by_user_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['changed_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_price_histories_product_id'), 'price_histories', ['product_id'], unique=False)
    op.create_index(op.f('ix_price_histories_variant_id'), 'price_histories', ['variant_id'], unique=False)

    # Pricing Recommendations
    op.create_table(
        'pricing_recommendations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('variant_id', sa.UUID(), nullable=True),
        sa.Column('current_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('recommended_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('competitor_avg_price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('demand_factor', sa.Text(), nullable=True),
        sa.Column('recommendation_reason', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', name='recommendation_status'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pricing_recommendations_product_id'), 'pricing_recommendations', ['product_id'], unique=False)
    op.create_index(op.f('ix_pricing_recommendations_variant_id'), 'pricing_recommendations', ['variant_id'], unique=False)

    # Sales Records
    op.create_table(
        'sales_records',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('variant_id', sa.UUID(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('sale_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sales_records_organization_id'), 'sales_records', ['organization_id'], unique=False)
    op.create_index(op.f('ix_sales_records_product_id'), 'sales_records', ['product_id'], unique=False)
    op.create_index(op.f('ix_sales_records_variant_id'), 'sales_records', ['variant_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('sales_records')
    op.drop_table('pricing_recommendations')
    op.drop_table('price_histories')
    op.drop_table('competitor_prices')
    op.drop_table('competitor_products')
    op.drop_table('competitors')
