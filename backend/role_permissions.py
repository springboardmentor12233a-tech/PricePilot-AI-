from backend.roles import Role
from backend.permissions import Permission


ROLE_PERMISSIONS = {

    Role.ADMIN: {
        Permission.USERS_VIEW,
        Permission.USERS_CREATE,
        Permission.USERS_UPDATE,

        Permission.PRICING_VIEW,

        Permission.MODELS_VIEW,

        Permission.PRODUCTS_VIEW,
        Permission.PRODUCTS_UPDATE,

        Permission.REPORTS_VIEW,
        Permission.REPORTS_GENERATE,

        Permission.SETTINGS_VIEW,
        Permission.SETTINGS_UPDATE,
        Permission.AUDIT_LOGS_VIEW,
    },

    Role.PRICING_MANAGER: {
        Permission.PRICING_VIEW,
        Permission.PRICING_UPDATE,

        Permission.PRODUCTS_VIEW,

        Permission.REPORTS_VIEW,
        Permission.REPORTS_GENERATE,

        Permission.SETTINGS_VIEW,
    },

    Role.ML_MANAGER: {
        Permission.MODELS_VIEW,
        Permission.MODELS_UPDATE,

        Permission.PRODUCTS_VIEW,

        Permission.REPORTS_VIEW,
        Permission.REPORTS_GENERATE,
    },

    Role.SELLER: {
        Permission.PRICING_VIEW,

        Permission.PRODUCTS_VIEW,

        Permission.REPORTS_VIEW,
    },

    Role.CUSTOMER: {
        Permission.PRODUCTS_VIEW,
        Permission.PRICING_VIEW,
    },
}