"""
PricePilot AI — Competitor / Market Analysis Engine Module
==========================================================
Provides leakage-safe market and price benchmarking, internal digital-channel
comparison, cross-store price dispersion analysis, category peer pricing,
market position classification, and advisory pricing opportunity signals.
"""

from models.competitor.competitor_analysis_engine import (
    ChannelBenchmarkResult,
    CompetitorAnalysisEngine,
    ExternalCompetitorSchema,
    MarketAnalysisBatchSummary,
    MarketAnalysisRecord,
    MarketPositionResult,
    OpportunitySignalResult,
    PeerBenchmarkResult,
    StoreBenchmarkResult,
)

__all__ = [
    "CompetitorAnalysisEngine",
    "ExternalCompetitorSchema",
    "ChannelBenchmarkResult",
    "StoreBenchmarkResult",
    "PeerBenchmarkResult",
    "MarketPositionResult",
    "OpportunitySignalResult",
    "MarketAnalysisRecord",
    "MarketAnalysisBatchSummary",
]
