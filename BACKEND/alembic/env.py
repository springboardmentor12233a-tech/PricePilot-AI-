from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import settings
from app.database.base import Base


# ==================================================
# IMPORT ALL MODELS
# ==================================================
#
# These imports are required so SQLAlchemy registers
# every model inside Base.metadata before Alembic
# performs autogeneration.
#


# -------------------------
# PHASE 1
# -------------------------

from app.models.organization import Organization
from app.models.role import Role
from app.models.user_role import user_roles
from app.models.user import User
from app.models.organization_member import OrganizationMember
from app.models.refresh_token import RefreshToken


# -------------------------
# PHASE 2
# -------------------------

from app.models.category import Category
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.inventory import Inventory


# ==================================================
# ALEMBIC CONFIGURATION
# ==================================================

config = context.config


# Configure logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# Alembic compares PostgreSQL schema
# against SQLAlchemy model metadata
target_metadata = Base.metadata


# ==================================================
# OFFLINE MIGRATIONS
# ==================================================

def run_migrations_offline() -> None:
    """
    Run migrations without connecting directly
    to the database.
    """

    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named",
        },
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ==================================================
# ONLINE MIGRATIONS
# ==================================================

def run_migrations_online() -> None:
    """
    Run migrations using a live database connection.
    """

    connectable = create_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# ==================================================
# RUN MIGRATIONS
# ==================================================

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()