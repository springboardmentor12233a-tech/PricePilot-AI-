"""
PricePilot AI — Backend API Schemas
====================================
Pydantic data models for API requests, responses, and structured diagnostics.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Common & Health Schemas
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str = Field(..., description="Application health status", json_schema_extra={"example": "healthy"})
    app_name: str = Field(..., description="Application name", json_schema_extra={"example": "PricePilot AI Backend"})
    version: str = Field(..., description="API Version", json_schema_extra={"example": "1.0.0"})
    environment: str = Field(..., description="Environment name", json_schema_extra={"example": "development"})
    timestamp: str = Field(..., description="UTC timestamp", json_schema_extra={"example": "2026-09-19T19:45:00Z"})


# ---------------------------------------------------------------------------
# Pricing Schemas
# ---------------------------------------------------------------------------
class CandidatePriceEvaluation(BaseModel):
    candidate_price: float
    percentage_from_ref: float
    discrepancy_from_model: float
    alignment_score: float
    is_recommended: bool


class PricingResponse(BaseModel):
    item_id: str
    store_id: int
    date: Optional[str] = None
    dept_name: Optional[str] = None
    class_name: Optional[str] = None
    is_on_promo: int = 0
    reference_price: float
    reference_source: str
    predicted_clearing_price: float
    recommended_price: float
    price_change_pct: float
    alignment_score: float
    candidate_range: List[float]
    candidate_step: float
    num_candidates_evaluated: int
    recommendation_reason: str
    candidates_summary: List[CandidatePriceEvaluation] = []
    metadata: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Demand Schemas
# ---------------------------------------------------------------------------
class DailyForecastItem(BaseModel):
    date: str
    day_offset: int
    predicted_quantity: float


class DemandResponse(BaseModel):
    item_id: str
    store_id: int
    horizon: int
    forecast_dates: List[str]
    daily_forecasts: List[DailyForecastItem]
    aggregate_forecast: float
    historical_avg_7d: float
    forecast_avg_7d: float
    trend_change_pct: float
    trend_classification: str
    multi_horizon_consistency: str
    confidence_score: float
    confidence_grade: str
    confidence_rationale: str


# ---------------------------------------------------------------------------
# Revenue Optimization Schemas
# ---------------------------------------------------------------------------
class CandidateRevenueItem(BaseModel):
    candidate_price: float
    percentage_from_ref: float
    predicted_daily_demand: float
    expected_daily_revenue: float
    revenue_lift_vs_ref_pct: float
    revenue_lift_vs_rec_pct: float
    is_revenue_optimal: bool
    is_clearing_recommended: bool


class RevenueResponse(BaseModel):
    item_id: str
    store_id: int
    date: Optional[str] = None
    dept_name: Optional[str] = None
    class_name: Optional[str] = None
    reference_price: float
    reference_source: str
    reference_expected_demand: float
    reference_expected_revenue: float
    predicted_clearing_price: float
    clearing_recommended_price: float
    clearing_expected_demand: float
    clearing_expected_revenue: float
    optimal_revenue_price: float
    optimal_expected_demand: float
    optimal_expected_revenue: float
    optimal_price_change_pct_from_ref: float
    optimal_price_change_pct_from_rec: float
    optimal_revenue_lift_pct_vs_ref: float
    optimal_revenue_lift_pct_vs_rec: float
    optimal_demand_change_pct_vs_ref: float
    candidate_range: List[float]
    num_candidates_evaluated: int
    optimization_rationale: str
    candidates_summary: List[CandidateRevenueItem] = []


# ---------------------------------------------------------------------------
# Competitor & Market Analysis Schemas
# ---------------------------------------------------------------------------
class ChannelBenchmarkSchema(BaseModel):
    has_online_listing: bool
    online_price: Optional[float] = None
    channel_price_diff: Optional[float] = None
    channel_price_diff_pct: Optional[float] = None
    channel_price_index: Optional[float] = None
    channel_alignment_status: str


class StoreBenchmarkSchema(BaseModel):
    store_count: int
    store_min_price: float
    store_max_price: float
    store_median_price: float
    store_mean_price: float
    store_price_range: float
    store_price_dispersion_pct: float
    store_vs_median_diff: float
    store_vs_median_pct: float


class PeerBenchmarkSchema(BaseModel):
    peer_group_level: str
    peer_count: int
    peer_min_price: float
    peer_max_price: float
    peer_median_price: float
    peer_mean_price: float
    peer_percentile_rank: float
    peer_median_diff: float
    peer_median_diff_pct: float


class MarketPositionSchema(BaseModel):
    market_position: str
    position_tier: str
    low_threshold_pct: float
    high_threshold_pct: float
    position_rationale: str


class OpportunitySignalSchema(BaseModel):
    opportunity_signal: str
    signal_priority: str
    opportunity_rationale: str
    review_suggested_action: str


class CompetitorResponse(BaseModel):
    item_id: str
    store_id: int
    date: str
    store_price: float
    dept_name: str
    class_name: str
    subclass_name: str
    is_on_promo: int
    quantity: float
    internal_digital_channel: ChannelBenchmarkSchema
    cross_store_dispersion: StoreBenchmarkSchema
    category_peer_benchmark: PeerBenchmarkSchema
    market_position: MarketPositionSchema
    pricing_opportunity: OpportunitySignalSchema
    external_competitor_available: bool = False
    external_competitor_price: Optional[float] = None
    external_competitor_index: Optional[float] = None
    notice: str = "Internal digital channel and category peer benchmarks. No external competitor prices fabricated."


# ---------------------------------------------------------------------------
# Gemini Business Insights Schemas
# ---------------------------------------------------------------------------
class InsightResponse(BaseModel):
    item_id: str
    store_id: int
    executive_summary: str
    pricing_rationale: str
    demand_and_forecast_insights: str
    promotional_and_historical_analysis: str
    commercial_risks: str
    actionable_recommendations: List[str]
    source_model: str
    is_live_gemini: bool
    status: str = "success"
    source: str = "OFFLINE_FALLBACK"


# ---------------------------------------------------------------------------
# Dashboard Summary Schemas
# ---------------------------------------------------------------------------
class RevenueKPISummary(BaseModel):
    total_realized_revenue: float
    avg_daily_revenue: float
    revenue_per_unit: float
    estimated_revenue_lift_potential_pct: float


class DemandKPISummary(BaseModel):
    total_units_sold: float
    avg_daily_units: float
    demand_increasing_pct: float
    demand_stable_pct: float
    demand_decreasing_pct: float


class PricingKPISummary(BaseModel):
    avg_reference_price: float
    avg_recommended_price: float
    avg_price_change_pct: float
    channel_parity_rate_pct: float


class MarketPositionBreakdown(BaseModel):
    below_peer_benchmark_count: int
    near_peer_benchmark_count: int
    above_peer_benchmark_count: int
    below_peer_pct: float
    near_peer_pct: float
    above_peer_pct: float


class OpportunitySignalBreakdown(BaseModel):
    headroom_review_count: int
    premium_margin_review_count: int
    channel_disparity_review_count: int
    promo_depth_review_count: int
    aligned_stable_count: int


class DashboardSummaryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    total_evaluated_records: int
    unique_items_count: int
    unique_stores_count: int
    date_range_start: str
    date_range_end: str
    revenue_kpis: RevenueKPISummary
    demand_kpis: DemandKPISummary
    pricing_kpis: PricingKPISummary
    market_position_summary: MarketPositionBreakdown
    opportunity_summary: OpportunitySignalBreakdown
    high_priority_action_count: int
    status: str = "success"
    revenue_trend: Optional[List[Dict[str, Any]]] = None
    sales_trend: Optional[List[Dict[str, Any]]] = None
    price_comparison_trend: Optional[List[Dict[str, Any]]] = None
    demand_forecast_trend: Optional[List[Dict[str, Any]]] = None
    category_performance: Optional[List[Dict[str, Any]]] = None
    data_source: Optional[str] = Field(default="LIVE_API", serialization_alias="_dataSource")
    is_mock: Optional[bool] = Field(default=False, serialization_alias="_isMock")



class ProductPerformanceItem(BaseModel):
    sku: str
    name: str
    category: str
    storeId: int
    currentPrice: float
    recommendedPrice: float
    predictedPrice: float
    unitsSold: int
    revenue: float
    avgDemand: float
    forecastDemand: float
    forecastConfidence: float
    demandTrend: str
    revenueOpportunity: float
    revenueOpportunityPct: float
    priority: str
    marketPosition: str
    channelParityStatus: str = "PARITY"


# ---------------------------------------------------------------------------
# BI Report Schemas
# ---------------------------------------------------------------------------
class BIReportDateRange(BaseModel):
    start: str
    end: str


class BIReportProductKPIs(BaseModel):
    referencePrice: float
    recommendedPrice: float
    clearingPrice: float
    unitsSold: int
    revenue: float
    forecastConfidence: float
    revenueLift: float


class BIReportDemandForecast(BaseModel):
    horizon7d: int
    horizon14d: int
    horizon30d: int
    trend: str
    risk: str


class BIReportRevenueOptimization(BaseModel):
    optimalPrice: float
    expectedRevenue: float
    liftPercentage: float


class BIReportMarketBenchmark(BaseModel):
    channelIndex: float
    storeDispersion: float
    marketPosition: str


class BIReportKeyAction(BaseModel):
    action: str
    owner: str
    deadline: str
    priority: str


class BIReportResponse(BaseModel):
    reportId: str
    title: str
    generatedDate: str
    author: str
    sku: str
    storeId: int
    dateRange: BIReportDateRange
    executiveSummary: str
    productKpis: BIReportProductKPIs
    pricingAnalysis: str
    demandForecastSummary: BIReportDemandForecast
    revenueOptimizationSummary: BIReportRevenueOptimization
    marketBenchmarkSummary: BIReportMarketBenchmark
    aiRecommendations: List[str]
    alerts: List[str]
    keyActions: List[BIReportKeyAction]
    _dataSource: Optional[str] = "LIVE_API"
class AlertItem(BaseModel):
    id: str
    type: str  # PRICE_ALERT, DEMAND_ALERT, CONFIDENCE_ALERT, REVENUE_ALERT, MARKET_ALERT, PROMOTION_ALERT, AI_RECOMMENDATION
    severity: str  # HIGH, MEDIUM, LOW, CRITICAL
    title: str
    message: str
    explanation: str
    recommendation: str
    recommendedAction: str
    item_id: str
    productId: str
    productName: str
    store_id: int
    category: str  # Demand, Pricing, Revenue, Market, AI
    metric_name: Optional[str] = None
    metric_value: Optional[float] = None
    threshold: Optional[float] = None
    ai_source: Optional[str] = "RULE_BASED"
    timestamp: str
    created_at: str
    isRead: bool = False


class AlertsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    alerts: List[AlertItem]
    total: int
    generated_at: str
    source: str = "LIVE_RADAR_SERVICE"
    data_source: Optional[str] = Field(default="LIVE_API", serialization_alias="_dataSource")
    is_mock: Optional[bool] = Field(default=False, serialization_alias="_isMock")


class PriceDistributionItem(BaseModel):
    range: str
    count: int
    color: str
    percentage: Optional[float] = None


class CategoryPerformanceItem(BaseModel):
    category: str
    revenue: float
    units: int
    marginLift: float


class StorePerformanceItem(BaseModel):
    store: str
    store_id: int
    revenue: float
    units: int
    parity: float


class PriceDemandScatterItem(BaseModel):
    price: float
    demand: float
    name: str
    sku: Optional[str] = None


class CorrelationMatrixRow(BaseModel):
    feature: str
    vsDemand: float
    vsRevenue: float
    vsPromo: float


class FeatureImportanceItem(BaseModel):
    feature: str
    importance_gain: float
    importance_split: int


class ModelPerformanceItem(BaseModel):
    task: str
    model: str
    split: str
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2: Optional[float] = None


class EDAAnalyticsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    total_records: int
    price_distribution: List[PriceDistributionItem]
    category_performance: List[CategoryPerformanceItem]
    store_performance: List[StorePerformanceItem]
    price_vs_demand_scatter: List[PriceDemandScatterItem]
    correlation_matrix: List[CorrelationMatrixRow]
    feature_importance: List[FeatureImportanceItem]
    model_performance: List[ModelPerformanceItem]
    generated_at: str
    source: str = "EDA_MODEL_ARTIFACTS"
    data_source: Optional[str] = Field(default="LIVE_API", serialization_alias="_dataSource")
    is_mock: Optional[bool] = Field(default=False, serialization_alias="_isMock")


# ---------------------------------------------------------------------------
# AI Chat Schemas
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User query for PricePilot AI")
    sku: Optional[str] = Field(default=None, description="Target product SKU for SKU-specific context")
    store_id: Optional[int] = Field(default=None, description="Target store ID for store-specific context")


class ChatResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    answer: str = Field(..., description="Assistant response based on real PricePilot data and ML metrics")
    source: str = Field(..., description="LIVE or OFFLINE_FALLBACK")
    model: str = Field(default="gemini-3.8-flash", description="Model name or architecture")
    sku: Optional[str] = None
    store_id: Optional[int] = None
    data_source: Optional[str] = Field(default="LIVE_API", serialization_alias="_dataSource")
    is_mock: Optional[bool] = Field(default=False, serialization_alias="_isMock")





