from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.competitors import router as competitors_router
from app.routes.organizations import router as organizations_router
from app.routes.pricing import router as pricing_router
from app.routes.products import router as products_router
from app.routes.sales import router as sales_router
from app.routes.users import router as users_router

__all__ = [
    "auth_router",
    "users_router",
    "organizations_router",
    "categories_router",
    "products_router",
    "competitors_router",
    "pricing_router",
    "sales_router",
]
