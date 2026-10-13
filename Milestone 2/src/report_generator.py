"""
report_generator.py
--------------------
Thin orchestration layer used by the "Generate Business Report" button.

It takes the CURRENTLY FILTERED dataframes (respecting whatever date /
category / product / channel / brand filters are active in the dashboard),
builds the full KPI report with kpi_engine, attaches the ML metrics, and
asks groq_service to turn that into a written report.

Kept separate from groq_service.py so the report logic (which KPIs go into
a report) is easy to change without touching the raw Groq plumbing.
"""

from __future__ import annotations

from src import kpi_engine
from src import groq_service


def generate_business_report(sales_master, funnel, competitor, ml_metrics: dict | None = None) -> str:
    """
    sales_master / funnel / competitor: already filtered dataframes
    (output of kpi_engine.apply_filters).
    """
    kpi_report = kpi_engine.full_kpi_report(sales_master, funnel, competitor)
    return groq_service.generate_report(kpi_report, ml_metrics)


def answer_question(question: str, sales_master, funnel, competitor,
                     ml_metrics: dict | None = None, latest_prediction: float | None = None) -> str:
    """Used by the 'Ask AI' chat box in the dashboard."""
    kpi_report = kpi_engine.full_kpi_report(sales_master, funnel, competitor)
    return groq_service.ask_ai(question, kpi_report, ml_metrics, latest_prediction)
