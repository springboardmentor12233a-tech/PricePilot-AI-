from pydantic import BaseModel
from datetime import datetime


class CompetitorPricePoint(BaseModel):
    """One competitor's price at one point in time."""
    competitor_name: str
    price: float
    recorded_at: datetime


class CompetitorComparisonResponse(BaseModel):
    """
    Full competitor picture for ONE product: our current price, each
    competitor's latest price, and derived comparison metrics.
    """
    product_id: int
    product_name: str
    our_price: float
    competitor_prices: list[CompetitorPricePoint]
    competitor_avg: float
    competitor_min: float
    competitor_max: float
    price_gap_pct: float  # positive = we're priced ABOVE competitors, negative = BELOW
    positioning: str      # "Premium" | "Competitive" | "Discount"


class PricingOpportunity(BaseModel):
    """One product where our price meaningfully diverges from competitors."""
    product_id: int
    product_name: str
    our_price: float
    competitor_avg: float
    gap_pct: float
    opportunity_type: str   # "Overpriced" | "Underpriced"
    recommendation: str