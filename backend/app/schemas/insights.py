from typing import Any

from pydantic import BaseModel


class PricingInsightResponse(BaseModel):
    """
    based_on is intentionally a loose dict, not nested Pydantic models --
    it's just a pass-through of dicts your OTHER services already built
    and validated (get_competitor_comparison, compute_elasticity,
    optimize_price). Re-declaring their exact shapes here would be a
    second copy of the same schema that could quietly drift out of sync.
    """
    product_id: int
    product_name: str
    narrative: str
    based_on: dict[str, Any]