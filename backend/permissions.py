from enum import Enum


class Permission(str, Enum):
    USERS_VIEW = "users:view"
    USERS_CREATE = "users:create"
    USERS_UPDATE = "users:update"

    PRICING_VIEW = "pricing:view"
    PRICING_UPDATE = "pricing:update"

    MODELS_VIEW = "models:view"
    MODELS_UPDATE = "models:update"

    PRODUCTS_VIEW = "products:view"
    PRODUCTS_UPDATE = "products:update"

    REPORTS_VIEW = "reports:view"
    REPORTS_GENERATE = "reports:generate"

    SETTINGS_VIEW = "settings:view"
    SETTINGS_UPDATE = "settings:update"
    AUDIT_LOGS_VIEW = "audit_logs:view"