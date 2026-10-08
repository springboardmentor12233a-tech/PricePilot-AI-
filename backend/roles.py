from enum import Enum


class Role(str, Enum):
    ADMIN = "ADMIN"
    PRICING_MANAGER = "PRICING_MANAGER"
    ML_MANAGER = "ML_MANAGER"
    SELLER = "SELLER"
    CUSTOMER = "CUSTOMER"

