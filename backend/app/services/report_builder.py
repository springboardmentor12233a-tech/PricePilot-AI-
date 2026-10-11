"""
Executive BI report: aggregates the outputs of the existing modules
(competitor analysis, revenue optimization, demand forecasting) per product
and renders them as CSV or a print-ready HTML page.
"""

import csv
import io
import logging
from datetime import datetime
from html import escape

from sqlalchemy.orm import Session

from app.models.models import Product
from app.services.competitor_analysis import get_competitor_comparison
from app.services.revenue_optimization import compute_elasticity, optimize_price
from app.services.llm_insights import _get_demand_context

logger = logging.getLogger(__name__)


def _r(value, digits=2):
    return round(float(value), digits) if value is not None else None


def _avg(values):
    vals = [v for v in values if v is not None]
    return round(sum(vals) / len(vals), 2) if vals else None


def collect_report_data(db: Session, limit: int = 50) -> dict:
    # Prioritize products from retail_price_optimization or those with forecasts/pricing data
    retail_products = db.query(Product).filter(Product.source_dataset == "retail_price_optimization").order_by(Product.id).limit(limit).all()
    if len(retail_products) < limit:
        other_products = db.query(Product).filter(Product.source_dataset != "retail_price_optimization").order_by(Product.id).limit(limit - len(retail_products)).all()
        products = retail_products + other_products
    else:
        products = retail_products
    rows = []

    for p in products:
        try:
            comp = get_competitor_comparison(db, p.id)
            elas = compute_elasticity(db, p.id)
            opt = optimize_price(db, p.id)
            demand = _get_demand_context(db, p.id)
        except Exception as e:  # one bad product must not kill the whole report
            logger.warning("Report: skipping product %s (%s)", p.id, e)
            continue

        if not (comp or elas or opt or demand):
            continue

        rows.append({
            "product_id": p.id,
            "product": p.name,
            "current_price": _r(opt["current_price"] if opt else (comp or {}).get("our_price")),
            "recommended_price": _r(opt["recommended_price"]) if opt else None,
            "price_change_pct": _r(opt["recommended_price_change_pct"]) if opt else None,
            "revenue_uplift_pct": _r(opt["expected_revenue_uplift_pct"]) if opt else None,
            "elasticity": _r(elas["elasticity"]) if elas else None,
            "elasticity_type": elas["interpretation"] if elas else None,
            "competitor_avg": _r(comp["competitor_avg"]) if comp else None,
            "price_gap_pct": _r(comp["price_gap_pct"]) if comp else None,
            "positioning": comp["positioning"] if comp else None,
            "demand_trend": demand["trend"] if demand else None,
            "forecast_confidence": _r(demand["confidence_score"], 0) if demand else None,
        })

    uplifts = [r["revenue_uplift_pct"] for r in rows]
    changes = [r["price_change_pct"] for r in rows if r["price_change_pct"] is not None]
    gaps = [r["price_gap_pct"] for r in rows]
    trends = [(r["demand_trend"] or "").lower() for r in rows]

    kpis = [
        {"metric": "Products analyzed", "value": len(rows)},
        {"metric": "Avg expected revenue uplift (%)", "value": _avg(uplifts)},
        {"metric": "Products recommended for price increase", "value": sum(1 for c in changes if c > 0)},
        {"metric": "Products recommended for price decrease", "value": sum(1 for c in changes if c < 0)},
        {"metric": "Avg price gap vs competitors (%)", "value": _avg(gaps)},
        {"metric": "Products priced above market", "value": sum(1 for g in gaps if g is not None and g > 0)},
        {"metric": "Products priced below market", "value": sum(1 for g in gaps if g is not None and g < 0)},
        {"metric": "Products with increasing demand", "value": sum(1 for t in trends if "increas" in t)},
        {"metric": "Avg forecast confidence (%)", "value": _avg([r["forecast_confidence"] for r in rows])},
    ]

    optimization = sorted(
        [
            {k: r[k] for k in ("product", "current_price", "recommended_price",
                               "price_change_pct", "revenue_uplift_pct",
                               "elasticity", "elasticity_type")}
            for r in rows if r["recommended_price"] is not None
        ],
        key=lambda r: r["revenue_uplift_pct"] or 0,
        reverse=True,
    )
    competitors = [
        {k: r[k] for k in ("product", "current_price", "competitor_avg",
                           "price_gap_pct", "positioning")}
        for r in rows if r["competitor_avg"] is not None
    ]
    demand_rows = [
        {k: r[k] for k in ("product", "demand_trend", "forecast_confidence")}
        for r in rows if r["demand_trend"] is not None
    ]

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "kpis": kpis,
        "optimization": optimization,
        "competitors": competitors,
        "demand": demand_rows,
    }


SECTIONS = [
    ("kpis", "Key Performance Indicators"),
    ("optimization", "Revenue Optimization"),
    ("competitors", "Competitor Analysis"),
    ("demand", "Demand Outlook"),
]

# Which sections each report type includes, plus its title
REPORT_TYPES = {
    "full": ("Executive BI Report", ["kpis", "optimization", "competitors", "demand"]),
    "pricing_performance": ("Pricing Performance Report", ["kpis", "optimization"]),
    "category_profitability": ("Profitability Report", ["kpis", "optimization"]),
    "competitor_benchmark": ("Competitor Benchmark Report", ["kpis", "competitors"]),
    "demand_summary": ("Demand Forecast Summary", ["kpis", "demand"]),
}


def _selected(report_type: str):
    title, keys = REPORT_TYPES.get(report_type, REPORT_TYPES["full"])
    return title, [(k, t) for k, t in SECTIONS if k in keys]


def build_csv(data: dict, report_type: str = "full") -> str:
    title, sections = _selected(report_type)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow([f"PricePilot AI - {title}"])
    w.writerow(["Generated", data["generated_at"]])
    for key, section_title in sections:
        rows = data[key]
        w.writerow([])
        w.writerow([section_title.upper()])
        if rows:
            w.writerow(list(rows[0].keys()))
            for r in rows:
                w.writerow(["" if v is None else v for v in r.values()])
        else:
            w.writerow(["No data"])
    return "\ufeff" + buf.getvalue()  # BOM so Excel reads UTF-8 correctly


def _table(rows: list[dict]) -> str:
    if not rows:
        return "<p class='muted'>No data available.</p>"
    head = "".join(f"<th>{escape(k.replace('_', ' ').title())}</th>" for k in rows[0])
    body = "".join(
        "<tr>" + "".join(f"<td>{escape('-' if v is None else str(v))}</td>" for v in r.values()) + "</tr>"
        for r in rows
    )
    return f"<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>"


def build_html(data: dict, report_type: str = "full") -> str:
    title, sections = _selected(report_type)
    cards = "".join(
        f"<div class='card'><div class='val'>{escape('-' if k['value'] is None else str(k['value']))}</div>"
        f"<div class='lbl'>{escape(k['metric'])}</div></div>"
        for k in data["kpis"]
    )
    tables = "".join(
        f"<h2>{section_title}</h2>{_table(data[key])}"
        for key, section_title in sections if key != "kpis"
    )
    return f"""<!doctype html><html><head><meta charset="utf-8">
<title>PricePilot AI - {escape(title)}</title>
<style>
 body{{font-family:Arial,sans-serif;margin:40px;color:#1f2937}}
 h1{{color:#4f46e5;margin-bottom:0}} .muted{{color:#6b7280}}
 h2{{margin-top:34px;border-bottom:2px solid #e5e7eb;padding-bottom:4px}}
 .grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}}
 .card{{border:1px solid #e5e7eb;border-radius:10px;padding:14px;background:#eef2ff}}
 .val{{font-size:26px;font-weight:700;color:#4338ca}} .lbl{{font-size:12px;color:#4b5563}}
 table{{border-collapse:collapse;width:100%;margin-top:8px;font-size:13px}}
 th,td{{border:1px solid #e5e7eb;padding:6px 8px;text-align:left}}
 th{{background:#eef2ff}}
 @media print{{body{{margin:16px}} .card{{break-inside:avoid}}}}
</style></head><body>
<h1>PricePilot AI - {escape(title)}</h1>
<p class="muted">Generated: {escape(data["generated_at"])}</p>
<h2>Key Performance Indicators</h2><div class="grid">{cards}</div>
{tables}
</body></html>"""