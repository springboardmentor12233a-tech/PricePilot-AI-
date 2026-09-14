"""
PricePilot AI — Milestone 2 Step 9: Gemini LLM API Business Insights Engine
===========================================================================

Connects Google's official Gemini LLM API (google-genai SDK) to the PricePilot AI
pipeline to translate ML predictions (Step 4 Price, Step 6 Demand), price recommendations
(Step 5), trend/confidence evaluations (Step 7), and commercial retail KPIs (Step 8)
into executive-ready commercial business insights and strategic actions.

Architecture:
  Existing ML Models (Steps 4 & 6)
          ↓
  Price Recommendation & Demand Forecasting (Steps 5 & 6)
          ↓
  Trend Engine & KPI Domain Knowledge Layer (Steps 7 & 8)
          ↓
  Gemini API (Step 9 - Structured Context & Controlled Prompt)
          ↓
  Executive Business Explanations & Strategic Recommendations

Security & Key Management:
  - API key read strictly from GEMINI_API_KEY / GOOGLE_API_KEY environment variables.
  - Safe local .env loading via python-dotenv.
  - Zero hardcoding of credentials; secrets never written to logs or artifacts.

Outputs:
  eda/gemini_business_insights.py                             (this module)
  eda/reports/gemini_business_insight_examples.json           (JSON artifact)
  eda/reports/gemini_business_insight_examples.csv            (CSV summary)
  eda/reports/milestone2_step9_gemini_llm_integration_report.md (Milestone report)
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
REPORTS_DIR = ROOT / "eda" / "reports"
KPI_SUMMARY_CSV = REPORTS_DIR / "kpi_summary.csv"
KPI_OVERALL_JSON = REPORTS_DIR / "kpi_overall_summary.json"
OUTPUT_JSON = REPORTS_DIR / "gemini_business_insight_examples.json"
OUTPUT_CSV = REPORTS_DIR / "gemini_business_insight_examples.csv"

REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Load environment variables from .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env", override=False)
    load_dotenv(override=False)
except ImportError:
    pass

# Try importing official Google GenAI SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("gemini_business_insights_step9")

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"


# ---------------------------------------------------------------------------
# Context Builder & Schema
# ---------------------------------------------------------------------------
def build_structured_business_context(row: Union[pd.Series, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Constructs a clean, dense, structured business context dictionary from a
    Step 8 KPI record. Avoids raw dataset bloat and provides clear categorization
    between ML predictions, historical KPI facts, and domain rules.
    """
    def _val(key: str, default: Any = "N/A") -> Any:
        if isinstance(row, dict):
            val = row.get(key, default)
        else:
            val = row.get(key, default) if key in row.index else default
        if pd.isna(val):
            return default
        if isinstance(val, (float, int)):
            return round(float(val), 2)
        return val

    context = {
        "metadata": {
            "item_id": str(_val("item_id")),
            "store_id": int(_val("store_id", 0)),
            "dept_name": str(_val("dept_name")),
            "class_name": str(_val("class_name")),
            "origin_date": str(_val("origin_date")),
        },
        "pricing_layer": {
            "current_reference_price": _val("reference_price"),
            "ml_predicted_clearing_price": _val("predicted_clearing_price"),
            "recommended_price": _val("recommended_price"),
            "price_change_pct": _val("price_change_pct"),
            "price_difference": _val("price_diff"),
            "hist_avg_price": _val("hist_avg_price"),
            "hist_min_price": _val("hist_min_price"),
            "hist_max_price": _val("hist_max_price"),
        },
        "demand_forecast_layer": {
            "forecast_7d_total_units": _val("forecast_7d_total"),
            "forecast_14d_total_units": _val("forecast_14d_total"),
            "forecast_30d_total_units": _val("forecast_30d_total"),
            "forecast_avg_daily_7d": _val("forecast_avg_7d"),
            "projected_change_pct_7d": _val("change_pct_7d"),
            "demand_trend": str(_val("trend")),
            "horizon_consistency": str(_val("direction_consistency")),
            "confidence_score": _val("confidence_score"),
            "confidence_tier": str(_val("confidence_tier")),
        },
        "historical_performance_layer": {
            "hist_total_units_sold": _val("hist_total_units"),
            "hist_avg_daily_demand": _val("hist_avg_daily_demand"),
            "hist_median_daily_demand": _val("hist_median_daily_demand"),
            "hist_max_daily_demand": _val("hist_max_daily_demand"),
            "hist_std_daily_demand": _val("hist_std_daily_demand"),
            "hist_total_revenue": _val("hist_total_revenue"),
            "hist_avg_daily_revenue": _val("hist_avg_daily_revenue"),
            "hist_revenue_per_unit": _val("hist_revenue_per_unit"),
        },
        "promotion_dynamics_layer": {
            "promo_rate_pct": _val("hist_promo_rate_pct"),
            "promo_days_count": _val("hist_promo_days"),
            "avg_discount_pct": _val("hist_avg_discount_pct"),
            "avg_discount_amount": _val("hist_avg_discount_amount"),
            "promo_demand_avg": _val("hist_promo_demand_avg"),
            "non_promo_demand_avg": _val("hist_non_promo_demand_avg"),
            "promo_demand_lift_pct": _val("hist_promo_demand_lift_pct"),
        },
        "domain_rules_layer": {
            "business_priority": str(_val("business_priority")),
            "rule_based_baseline_insight": str(_val("domain_insight")),
        },
    }
    return context


# ---------------------------------------------------------------------------
# Prompt Engineering
# ---------------------------------------------------------------------------
SYSTEM_INSTRUCTION = """You are a Senior Retail Pricing & Revenue Optimization Executive Analyst for PricePilot AI.
Your role is to translate machine learning predictions, demand forecasts, and commercial retail KPIs into concise, high-impact business explanations and actionable merchandising recommendations.

CRITICAL OPERATING RULES:
1. STRICT FACTUAL FIDELITY: You must NEVER invent or hallucinate numerical figures. Reference only the numbers provided in the input context. If a metric is missing or "N/A", explicitly state that the information is unavailable rather than guessing.
2. SOURCE SEPARATION: Clearly distinguish between:
   - [ML Predictions]: Machine learning predicted clearing price, 7/14/30-day demand forecasts, confidence scores.
   - [KPI Facts]: Historical prices, promo rates, historical units sold, realized revenue, promo lifts.
   - [LLM Strategic Insights]: Your business interpretation, commercial risk analysis, and strategic recommendations.
3. TONE & STYLE: Professional, analytical, executive-level, clear, and actionable. Avoid generic filler.

You must respond in valid JSON format matching this exact schema:
{
  "executive_summary": "High-level 2-sentence executive summary of the item's pricing and demand posture.",
  "pricing_rationale": "Detailed explanation of why the recommended price makes commercial sense relative to the reference price and ML predicted clearing price.",
  "demand_and_forecast_insights": "Interpretation of the 7d/14d/30d demand forecast trajectory, trend classification, and confidence level.",
  "promotional_and_historical_analysis": "Assessment of promotional sensitivity, discount lift effectiveness, and historical demand velocity.",
  "commercial_risks": "Specific commercial risks (e.g. margin erosion, stockout risk, price resistance, demand slump, cannibalization).",
  "actionable_recommendations": [
    "Priority Action 1 with concrete operational step",
    "Priority Action 2 with concrete operational step",
    "Priority Action 3 with concrete operational step"
  ]
}
"""


def construct_prompt(context: Dict[str, Any]) -> str:
    """Builds the user prompt payload containing structured context."""
    return f"""Please analyze the following commercial retail KPI and ML prediction profile for an individual item-store SKU and provide your executive business insight report.

INPUT CONTEXT:
{json.dumps(context, indent=2, ensure_ascii=False, default=str)}

Generate your analysis strictly as a valid JSON object matching the required schema. Do not include markdown code fence formatting outside the JSON if possible, or provide standard parseable JSON."""


# ---------------------------------------------------------------------------
# Gemini API Engine Wrapper
# ---------------------------------------------------------------------------
class GeminiBusinessInsightsEngine:
    """
    Wraps Google's official Gemini GenAI API client to generate executive
    business insights from PricePilot AI pipeline contexts.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
    ):
        # Refresh environment from .env in case it was created/updated at runtime
        try:
            from dotenv import load_dotenv
            load_dotenv(ROOT / ".env", override=False)
            load_dotenv(override=False)
        except Exception:
            pass

        # Detect model name dynamically
        env_model = os.getenv("GEMINI_MODEL")
        if env_model:
            env_model = env_model.strip().strip("'\"")
        self.model_name = model_name or env_model or DEFAULT_GEMINI_MODEL

        # Detect API key from argument or environment variables
        raw_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if raw_key:
            raw_key = raw_key.strip().strip("'\"")

        self.api_key: Optional[str] = None
        self.client: Optional[Any] = None
        self.is_configured: bool = False

        if not GENAI_AVAILABLE:
            log.warning("google-genai package is not installed. LLM integration will run in mock/fallback mode.")
            return

        if raw_key and raw_key not in ("your_gemini_api_key_here", "None", ""):
            self.api_key = raw_key
            try:
                self.client = genai.Client(api_key=self.api_key)
                self.is_configured = True
                log.info("Gemini GenAI client successfully configured with model: %s", self.model_name)
            except Exception as e:
                sanitized_msg = self._sanitize_error(str(e))
                log.error("Failed to initialize Gemini Client: %s", sanitized_msg)
                self.client = None
                self.is_configured = False
        else:
            log.info("No live GEMINI_API_KEY detected in environment. Operating in dry-run/mock mode.")

    @staticmethod
    def _sanitize_error(msg: str) -> str:
        """Removes potential API keys, secrets, or tokens from error messages."""
        if not msg:
            return ""
        import re
        sanitized = str(msg)
        sanitized = re.sub(r'AIza[0-9A-Za-z\-_]{16,}', '[REDACTED_API_KEY]', sanitized)
        sanitized = re.sub(r'(key|token|api_key|secret|password)=([a-zA-Z0-9_\-]+)', r'\1=[REDACTED]', sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r'Bearer\s+[a-zA-Z0-9_\-\.]+', 'Bearer [REDACTED]', sanitized, flags=re.IGNORECASE)
        return sanitized

    def generate_business_insight(
        self,
        context: Dict[str, Any],
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """
        Generates business insights for a single structured item-store context.
        Returns a rich response dictionary with status, timestamps, and structured insights.
        """
        meta = context.get("metadata", {})
        item_id = meta.get("item_id", "UNKNOWN")
        store_id = meta.get("store_id", 0)

        response_payload: Dict[str, Any] = {
            "item_id": item_id,
            "store_id": store_id,
            "dept_name": meta.get("dept_name", "UNKNOWN"),
            "class_name": meta.get("class_name", "UNKNOWN"),
            "model_used": self.model_name,
            "api_status": "PENDING",
            "generation_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "insights": {},
            "raw_response": None,
            "error_message": None,
        }

        # 1. Fallback / Offline / Dry-Run generation when API key is unavailable
        if not self.is_configured or self.client is None:
            response_payload["api_status"] = "OFFLINE_FALLBACK"
            response_payload["insights"] = self._generate_rule_based_fallback_insight(context)
            response_payload["error_message"] = "Live Gemini API call not executed because GEMINI_API_KEY was not available."
            return response_payload

        # 2. Live API Call using google-genai SDK
        try:
            user_prompt = construct_prompt(context)
            config = types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=temperature,
                response_mime_type="application/json",
            )
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=config,
            )

            response_payload["api_status"] = "SUCCESS"
            raw_text = response.text or ""
            response_payload["raw_response"] = raw_text

            # Parse JSON output from Gemini
            try:
                # Clean up if markdown code fences were returned
                cleaned_text = raw_text.strip()
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text[7:]
                if cleaned_text.startswith("```"):
                    cleaned_text = cleaned_text[3:]
                if cleaned_text.endswith("```"):
                    cleaned_text = cleaned_text[:-3]
                parsed_json = json.loads(cleaned_text.strip())
                response_payload["insights"] = parsed_json
            except Exception as parse_err:
                log.warning("Could not parse JSON response directly; wrapping raw text: %s", str(parse_err))
                response_payload["insights"] = {
                    "executive_summary": raw_text[:300],
                    "pricing_rationale": raw_text,
                    "demand_and_forecast_insights": "Parsed from unstructured LLM output.",
                    "promotional_and_historical_analysis": "Parsed from unstructured LLM output.",
                    "commercial_risks": "See pricing rationale.",
                    "actionable_recommendations": [context.get("domain_rules_layer", {}).get("rule_based_baseline_insight", "Review SKU")],
                }

        except Exception as e:
            sanitized_err = self._sanitize_error(str(e))
            log.error("Gemini API call failed for item %s store %s: %s", item_id, store_id, sanitized_err)
            response_payload["api_status"] = "API_ERROR"
            response_payload["error_message"] = sanitized_err
            response_payload["insights"] = self._generate_rule_based_fallback_insight(context)

        return response_payload

    def _generate_rule_based_fallback_insight(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Constructs a structured, deterministic fallback insight using existing Step 8
        KPI and domain knowledge rules when the live Gemini API is offline.
        """
        p_layer = context.get("pricing_layer", {})
        d_layer = context.get("demand_forecast_layer", {})
        h_layer = context.get("historical_performance_layer", {})
        promo_layer = context.get("promotion_dynamics_layer", {})
        rule_layer = context.get("domain_rules_layer", {})

        ref_p = p_layer.get("current_reference_price", "N/A")
        rec_p = p_layer.get("recommended_price", "N/A")
        pred_p = p_layer.get("ml_predicted_clearing_price", "N/A")
        chg_pct = p_layer.get("price_change_pct", 0.0)

        trend = d_layer.get("demand_trend", "STABLE")
        f7 = d_layer.get("forecast_7d_total_units", "N/A")
        f30 = d_layer.get("forecast_30d_total_units", "N/A")
        conf_score = d_layer.get("confidence_score", "N/A")
        conf_tier = d_layer.get("confidence_tier", "HIGH")

        priority = rule_layer.get("business_priority", "STANDARD_MONITORING")

        # Pricing rationale
        if chg_pct > 0:
            p_action = f"increase price by +{chg_pct}% from ${ref_p} to ${rec_p} (ML clearing estimate: ${pred_p})"
        elif chg_pct < 0:
            p_action = f"reduce price by {chg_pct}% from ${ref_p} to ${rec_p} (ML clearing estimate: ${pred_p})"
        else:
            p_action = f"maintain current price at ${ref_p} (in full alignment with ML clearing price ${pred_p})"

        # Executive summary
        exec_summary = (
            f"Item exhibits a {trend.lower()} demand trajectory (7d forecast: {f7} units, 30d forecast: {f30} units). "
            f"Recommendation is to {p_action} under commercial priority [{priority}]."
        )

        # Rationale
        p_rationale = (
            f"[ML Prediction]: Random Forest price clearing model estimates optimal equilibrium at ${pred_p}. "
            f"[KPI Fact]: Current reference price is ${ref_p} (historical range: ${p_layer.get('hist_min_price')}-${p_layer.get('hist_max_price')}). "
            f"[LLM Insight]: Recommended price of ${rec_p} ({chg_pct:+.1f}%) aligns with ML valuation while respecting commercial boundaries."
        )

        # Demand insights
        d_insight = (
            f"[ML Prediction]: LightGBM demand model forecasts {f7} units over next 7 days and {f30} units over 30 days. "
            f"[KPI Fact]: Multi-horizon consistency is {d_layer.get('horizon_consistency')} with heuristic confidence score of {conf_score}/100 ({conf_tier} tier). "
            f"[LLM Insight]: Trajectory is {trend.lower()}; supply chain planning should calibrate inventory against projected demand velocity."
        )

        # Promo & Historical
        promo_insight = (
            f"[KPI Fact]: Historical promo exposure is {promo_layer.get('promo_rate_pct')}% with average discount depth {promo_layer.get('avg_discount_pct')}%. "
            f"Promotional lift is observed at {promo_layer.get('promo_demand_lift_pct')}%. "
            f"[LLM Insight]: Total historical revenue realized stands at ${h_layer.get('hist_total_revenue')} across {h_layer.get('hist_total_units_sold')} units."
        )

        # Commercial risks
        if trend == "DECREASING" and chg_pct > 0:
            risks = "Risk of accelerating demand decline if price is raised during a contractionary demand phase."
        elif trend == "DECREASING" and chg_pct <= 0:
            risks = "Margin erosion risk from markdown; verify inventory aging before aggressive clearance."
        elif trend == "INCREASING":
            risks = "Stockout risk if inventory replenishment fails to meet increasing demand momentum."
        else:
            risks = "Low commercial risk; ensure regular monitoring of competitor pricing and basket attachment."

        # Recommendations
        actions = [
            f"Implement commercial priority directive: {priority}",
            f"Adjust store inventory target to match {trend.lower()} 7d forecast ({f7} units)",
            f"Execute pricing adjustment: {p_action}",
        ]

        return {
            "executive_summary": exec_summary,
            "pricing_rationale": p_rationale,
            "demand_and_forecast_insights": d_insight,
            "promotional_and_historical_analysis": promo_insight,
            "commercial_risks": risks,
            "actionable_recommendations": actions,
        }


# ---------------------------------------------------------------------------
# High-Level Reusable API Function
# ---------------------------------------------------------------------------
def generate_business_insight(
    context: Dict[str, Any],
    api_key: Optional[str] = None,
    model_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Reusable convenience function to generate business insights for a single
    structured KPI/model context.
    """
    engine = GeminiBusinessInsightsEngine(api_key=api_key, model_name=model_name)
    return engine.generate_business_insight(context)


# ---------------------------------------------------------------------------
# Batch Processing & Report Generation
# ---------------------------------------------------------------------------
def load_kpi_dataset(path: Path = KPI_SUMMARY_CSV) -> pd.DataFrame:
    """Loads Step 8 KPI summary dataset."""
    if not path.exists():
        raise FileNotFoundError(f"KPI summary dataset not found at {path}. Run Step 8 first.")
    log.info("Loading Step 8 KPI dataset from %s...", path)
    return pd.read_csv(path, encoding="utf-8")


def select_representative_kpi_records(kpi_df: pd.DataFrame, num_samples: int = 8) -> pd.DataFrame:
    """
    Selects a diverse set of representative item-store records across key
    business priorities (Markdown Review, Replenishment Priority, Promo Stimulation,
    Price Increase, Stable Core, Divergent Trend, etc.).
    """
    priority_col = "business_priority"
    selected_indices = []

    # Pick 1 representative from each major priority class
    if priority_col in kpi_df.columns:
        for priority in kpi_df[priority_col].unique():
            subset = kpi_df[kpi_df[priority_col] == priority]
            if len(subset) > 0:
                selected_indices.append(subset.index[0])

    # If we need more samples or have specific interest profiles
    if len(selected_indices) < num_samples:
        remaining = [i for i in kpi_df.index if i not in selected_indices]
        step = max(1, len(remaining) // (num_samples - len(selected_indices)))
        selected_indices.extend(remaining[::step][:num_samples - len(selected_indices)])

    return kpi_df.loc[selected_indices[:num_samples]].copy().reset_index(drop=True)


def run_pipeline(
    num_samples: int = 8,
    model_name: str = DEFAULT_GEMINI_MODEL,
    dry_run: bool = False,
) -> Tuple[List[Dict[str, Any]], pd.DataFrame]:
    """
    Runs the Step 9 Gemini Business Insights pipeline:
      1. Loads Step 8 KPI dataset.
      2. Selects diverse representative SKU profiles.
      3. Builds structured business contexts.
      4. Invokes Gemini API (or safe fallback if uncredentialed / dry-run).
      5. Formats and exports JSON and CSV reports.
    """
    t0 = time.time()
    log.info("=" * 70)
    log.info("PricePilot AI — Milestone 2 Step 9: Gemini LLM Business Insights Engine")
    log.info("=" * 70)

    # 1. Load data
    kpi_df = load_kpi_dataset(KPI_SUMMARY_CSV)
    log.info("Total available KPI records: %d", len(kpi_df))

    # 2. Select representative records
    sample_df = select_representative_kpi_records(kpi_df, num_samples=num_samples)
    log.info("Selected %d representative SKU profiles for insight generation.", len(sample_df))

    # 3. Initialize Engine
    engine = GeminiBusinessInsightsEngine(model_name=model_name)
    if dry_run:
        engine.is_configured = False
        log.info("Dry-run requested; forcing deterministic offline synthesis mode.")

    # 4. Generate insights for all sample SKU profiles
    results: List[Dict[str, Any]] = []
    csv_rows: List[Dict[str, Any]] = []

    for idx, row in sample_df.iterrows():
        context = build_structured_business_context(row)
        item_id = context["metadata"]["item_id"]
        store_id = context["metadata"]["store_id"]
        priority = context["domain_rules_layer"]["business_priority"]

        log.info(
            "Generating insight for SKU [%d/%d]: item=%s, store=%d, priority=%s...",
            idx + 1,
            len(sample_df),
            item_id,
            store_id,
            priority,
        )

        insight_res = engine.generate_business_insight(context)
        insight_res["input_context"] = context
        results.append(insight_res)

        # Flatten for CSV export
        insights_data = insight_res.get("insights", {})
        rec_actions = insights_data.get("actionable_recommendations", [])
        if isinstance(rec_actions, list):
            rec_actions_str = " | ".join(str(a) for a in rec_actions)
        else:
            rec_actions_str = str(rec_actions)

        csv_rows.append({
            "item_id": item_id,
            "store_id": store_id,
            "dept_name": context["metadata"]["dept_name"],
            "class_name": context["metadata"]["class_name"],
            "business_priority": priority,
            "current_reference_price": context["pricing_layer"]["current_reference_price"],
            "recommended_price": context["pricing_layer"]["recommended_price"],
            "price_change_pct": context["pricing_layer"]["price_change_pct"],
            "demand_trend": context["demand_forecast_layer"]["demand_trend"],
            "forecast_7d_total": context["demand_forecast_layer"]["forecast_7d_total_units"],
            "forecast_30d_total": context["demand_forecast_layer"]["forecast_30d_total_units"],
            "confidence_score": context["demand_forecast_layer"]["confidence_score"],
            "confidence_tier": context["demand_forecast_layer"]["confidence_tier"],
            "api_status": insight_res.get("api_status"),
            "model_used": insight_res.get("model_used"),
            "executive_summary": insights_data.get("executive_summary", ""),
            "pricing_rationale": insights_data.get("pricing_rationale", ""),
            "demand_and_forecast_insights": insights_data.get("demand_and_forecast_insights", ""),
            "promotional_and_historical_analysis": insights_data.get("promotional_and_historical_analysis", ""),
            "commercial_risks": insights_data.get("commercial_risks", ""),
            "actionable_recommendations": rec_actions_str,
            "generation_timestamp": insight_res.get("generation_timestamp"),
        })

    # 5. Export JSON artifact
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    log.info("Saved %d insight examples to JSON: %s", len(results), OUTPUT_JSON)

    # 6. Export CSV artifact
    res_df = pd.DataFrame(csv_rows)
    res_df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")
    log.info("Saved %d insight examples to CSV: %s", len(res_df), OUTPUT_CSV)

    elapsed = time.time() - t0
    log.info("Step 9 Gemini Business Insights pipeline completed in %.2f seconds.", elapsed)

    return results, res_df


# ---------------------------------------------------------------------------
# CLI Entrypoint
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="PricePilot AI - Step 9 Gemini Business Insights Engine")
    parser.add_argument("--samples", type=int, default=8, help="Number of representative SKU profiles to process")
    parser.add_argument("--model", type=str, default=DEFAULT_GEMINI_MODEL, help="Gemini model name")
    parser.add_argument("--dry-run", action="store_true", help="Force offline fallback mode without live API calls")
    args = parser.parse_args()

    run_pipeline(
        num_samples=args.samples,
        model_name=args.model,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
