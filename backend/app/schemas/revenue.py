from pydantic import BaseModel


class ElasticityResponse(BaseModel):
    product_id: int
    product_name: str
    elasticity: float
    interpretation: str
    data_points_used: int
    r_squared: float


class RevenueSimulationResponse(BaseModel):
    product_id: int
    product_name: str
    current_price: float
    current_avg_qty: float
    current_revenue: float
    simulated_price: float
    price_change_pct: float
    simulated_qty: float
    simulated_revenue: float
    revenue_change_pct: float


class PriceOptimizationResponse(BaseModel):
    product_id: int
    product_name: str
    current_price: float
    current_revenue: float
    recommended_price: float
    recommended_price_change_pct: float
    expected_revenue: float
    expected_revenue_uplift_pct: float