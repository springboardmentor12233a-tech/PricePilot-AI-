from sqlalchemy.orm import configure_mappers

from app.database.base import Base

# ==================================================
# PHASE 1 MODELS
# ==================================================

from app.models.organization import Organization
from app.models.role import Role
from app.models.user_role import user_roles
from app.models.user import User
from app.models.organization_member import OrganizationMember
from app.models.refresh_token import RefreshToken

# ==================================================
# PHASE 2 MODELS
# ==================================================

from app.models.category import Category
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.inventory import Inventory

try:
    configure_mappers()

    print("All models and relationships configured successfully!\n")

    print("Registered tables:")

    for table_name in Base.metadata.tables.keys():
        print(f"- {table_name}")

except Exception as error:
    print("Model configuration failed!\n")
    print(error)