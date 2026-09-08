from enum import Enum


class OrganizationMemberRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class UserRoleName(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    PRICING_MANAGER = "pricing_manager"
    ANALYST = "analyst"
    VIEWER = "viewer"


class ProductStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class CompetitorStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class DemandTrend(str, Enum):
    INCREASING = "increasing"
    STABLE = "stable"
    DECREASING = "decreasing"


class RecommendationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"