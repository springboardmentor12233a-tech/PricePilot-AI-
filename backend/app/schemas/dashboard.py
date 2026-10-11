from pydantic import BaseModel


class RevenueSummary(BaseModel):
    total_revenue: float
    total_units_sold: int
    average_order_value: float
    products_tracked: int


class TopProduct(BaseModel):
    product_id: int
    product_name: str
    total_revenue: float
    total_units_sold: int


class PricingPerformanceSummary(BaseModel):
    total_products_with_pricing: int
    average_unit_price: float
    products_overpriced: int   # from competitor analysis
    products_underpriced: int
    products_competitive: int


class ForecastSummary(BaseModel):
    products_with_forecasts: int
    average_confidence_score: float
    increasing_trend_count: int
    stable_trend_count: int
    decreasing_trend_count: int


class RevenueByMonth(BaseModel):
    period: str      # e.g. "2016-08"
    revenue: float


class RevenueByCategory(BaseModel):
    category: str
    revenue: float


class DashboardOverview(BaseModel):
    """
    One combined endpoint pulling a snapshot from every module --
    this is the actual 'Pricing Analytics Dashboard' the PDF asks for.
    """
    revenue: RevenueSummary
    top_products: list[TopProduct]
    pricing_performance: PricingPerformanceSummary
    forecast_summary: ForecastSummary
    revenue_by_month: list[RevenueByMonth] = []
    revenue_by_category: list[RevenueByCategory] = []