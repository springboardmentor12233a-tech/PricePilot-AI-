from fastapi import FastAPI, HTTPException
import joblib
import pandas as pd
import os
import numpy as np
from dotenv import load_dotenv
from google import genai
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from pathlib import Path
load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

app = FastAPI(title="PricePilot AI")

model = joblib.load("eda/pricepilot_model.pkl")

@app.get("/")
def home():
    return {"message": "PricePilot AI Backend is running!"}

@app.post("/predict")
def predict(data: dict):
    input_df = pd.DataFrame([data])

    input_df = input_df.reindex(
        columns=model.feature_names_in_,
        fill_value=0
    )

    prediction = model.predict(input_df)[0]

    return {
        "predicted_weekly_sales": float(prediction)
    }
@app.post("/forecast")
def forecast_demand(data: dict):

    current_sales = float(data["current_sales"])

    # Simple trend-based forecasting
    short_term = current_sales * 7
    medium_term = current_sales * 30
    long_term = current_sales * 90

    # Basic trend estimation
    if "previous_sales" in data:
        previous_sales = float(data["previous_sales"])

        if previous_sales > 0:
            growth_rate = (current_sales - previous_sales) / previous_sales
        else:
            growth_rate = 0
    else:
        growth_rate = 0

    # Limit extreme growth values
    growth_rate = max(min(growth_rate, 0.30), -0.30)

    short_term *= (1 + growth_rate)
    medium_term *= (1 + growth_rate)
    long_term *= (1 + growth_rate)

    # Confidence based on trend stability
    confidence = max(60, min(95, 85 - abs(growth_rate) * 50))

    if growth_rate > 0.05:
        trend = "Increasing"
    elif growth_rate < -0.05:
        trend = "Decreasing"
    else:
        trend = "Stable"

    return {
        "short_term_forecast": round(short_term),
        "medium_term_forecast": round(medium_term),
        "long_term_forecast": round(long_term),
        "confidence": round(confidence, 2),
        "trend": trend
    }
@app.post("/recommend-price")
def recommend_price(data: dict):

    base_price = data["base_price"]
    predicted_sales = data["predicted_sales"]
    target_sales = data["target_sales"]

    if predicted_sales > target_sales * 1.2:
        recommended_price = base_price * 1.10
        action = "Increase price"

    elif predicted_sales < target_sales * 0.8:
        recommended_price = base_price * 0.90
        action = "Decrease price"

    else:
        recommended_price = base_price
        action = "Keep price"

    return {
        "recommended_price": round(recommended_price, 2),
        "action": action
    }
@app.get("/kpis")
def get_kpis():
    return {
        "model_r2_score": 0.9744,
        "model_mae": 1445.45,
        "model_rmse": 3657.06,
        "status": "Model performing well"
    }
@app.post("/ask")
def ask(data: dict):
    """Answer either the initial recommendation explanation or a user's chatbot question."""
    predicted = data.get("predicted_sales")
    base_price = data.get("base_price")
    target = data.get("target_sales")
    recommended = data.get("recommended_price")
    action = data.get("action")
    question = str(data.get("question") or "").strip()
    product_name = str(data.get("product_name") or "the selected product")
    market_average = data.get("market_average")
    profit = data.get("profit")
    margin = data.get("profit_margin")

    context = f"""
Product: {product_name}
Predicted weekly sales: {predicted}
Target sales: {target}
Current price: {base_price}
Recommended price: {recommended}
Pricing action: {action}
Market average price: {market_average}
Profit: {profit}
Profit margin: {margin}%
"""

    if question:
        prompt = f"""You are PricePilot AI, a business pricing assistant.
Answer the user's question using ONLY the analysis context below. Be concise, practical and clear.
Do not invent values. If a value is missing, say it is not available.

ANALYSIS CONTEXT:
{context}

USER QUESTION:
{question}
"""
    else:
        prompt = f"""You are PricePilot AI, a dynamic pricing assistant.
Using the analysis context below, explain the pricing recommendation in simple business language.
Mention the relationship between predicted demand, target demand and current price.
Do not invent values.

ANALYSIS CONTEXT:
{context}
"""

    try:
        if not os.getenv("GEMINI_API_KEY"):
            raise RuntimeError("GEMINI_API_KEY is not configured")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        answer = (response.text or "").strip()
        if not answer:
            raise RuntimeError("Gemini returned an empty response")
    except Exception:
        # Keep the assistant useful even when the optional Gemini service is unavailable.
        # This fallback answers from the real analysis values instead of exposing an
        # implementation/provider error to the user.
        q = question.lower()
        if question:
            if "recommend" in q or "price" in q:
                answer = (
                    f"For {product_name}, the model predicts {float(predicted):,.0f} weekly sales "
                    f"against a target of {float(target):,.0f}. The current price is ₹{float(base_price):,.2f}, "
                    f"and the calculated action is {action} at a recommended price of ₹{float(recommended):,.2f}."
                )
            elif "demand" in q or "sales" in q or "forecast" in q:
                answer = (
                    f"The current demand prediction is {float(predicted):,.0f} units per week versus a target "
                    f"of {float(target):,.0f}. A higher prediction than the target means the model is seeing stronger "
                    "demand under the supplied conditions."
                )
            elif "profit" in q or "margin" in q:
                profit_text = "not available" if profit is None else f"₹{float(profit):,.2f}"
                margin_text = "not available" if margin is None else f"{float(margin):.2f}%"
                answer = (
                    f"The current analysis shows profit of {profit_text} with a profit margin of {margin_text}. "
                    "Profit is calculated from revenue minus total cost, while margin expresses profit as a percentage of revenue."
                )
            elif "competitor" in q or "market" in q:
                market_text = "not available" if market_average is None else f"₹{float(market_average):,.2f}"
                answer = (
                    f"The current market average is {market_text}. Your entered price is ₹{float(base_price):,.2f}. "
                    "Use the competitor section to compare each competitor's price and the percentage difference."
                )
            else:
                answer = (
                    f"For {product_name}, the current analysis predicts {float(predicted):,.0f} weekly sales versus "
                    f"a target of {float(target):,.0f}. The current price is ₹{float(base_price):,.2f}, "
                    f"the recommended price is ₹{float(recommended):,.2f}, and the pricing action is {action}."
                )
        else:
            answer = (
                f"The model predicts {float(predicted):,.0f} weekly sales versus a target of {float(target):,.0f}. "
                f"The current price is ₹{float(base_price):,.2f}, and the pricing action is {action} "
                f"with a calculated price of ₹{float(recommended):,.2f}."
            )

    return {"answer": answer, "recommendation": answer}

@app.post("/forecast")
def forecast_demand(data: dict):
    current_sales = float(data["current_sales"])
    previous_sales = float(data.get("previous_sales", current_sales))

    growth = (current_sales - previous_sales) / previous_sales if previous_sales else 0

    short_term = current_sales * 7 * (1 + growth)
    medium_term = current_sales * 30 * (1 + growth)
    long_term = current_sales * 90 * (1 + growth)

    confidence = max(60, min(95, 85 - abs(growth) * 50))

    if growth > 0.05:
        trend = "Increasing"
    elif growth < -0.05:
        trend = "Decreasing"
    else:
        trend = "Stable"

    return {
        "short_term_forecast": round(short_term),
        "medium_term_forecast": round(medium_term),
        "long_term_forecast": round(long_term),
        "confidence": round(confidence, 2),
        "trend": trend
    }
@app.post("/competitor-analysis")
def competitor_analysis(data: dict):
    our_price = float(data["our_price"])
    competitors = data["competitors"]

    prices = [float(c["price"]) for c in competitors]
    market_avg = sum(prices) / len(prices)
    difference = our_price - market_avg
    difference_percent = (difference / market_avg) * 100

    return {
        "our_price": our_price,
        "market_average": round(market_avg, 2),
        "price_difference": round(difference, 2),
        "difference_percent": round(difference_percent, 2),
        "competitors": competitors
    }
@app.post("/profitability")
def profitability(data: dict):
    price = float(data["price"])
    cost = float(data["cost"])
    units = float(data["units_sold"])

    revenue = price * units
    total_cost = cost * units
    profit = revenue - total_cost
    margin = (profit / revenue * 100) if revenue else 0

    return {
        "revenue": round(revenue, 2),
        "cost": round(total_cost, 2),
        "profit": round(profit, 2),
        "profit_margin": round(margin, 2)
    }
@app.get("/market-intelligence")
def market_intelligence():
    return {
        "insights": [
            "Competitor prices should be monitored regularly.",
            "Products priced above the market average may need price adjustment.",
            "High-demand products provide opportunities for price optimization.",
            "Profit margin should be considered along with competitor pricing."
        ]
    }
@app.post("/pricing-strategy")
def pricing_strategy(data: dict):
    our_price = float(data["our_price"])
    market_avg = float(data["market_average"])
    demand = float(data["predicted_sales"])
    target = float(data["target_sales"])

    if our_price > market_avg * 1.05 and demand < target:
        action = "Decrease price"
        recommended_price = market_avg

    elif our_price < market_avg * 0.95 and demand > target:
        action = "Increase price"
        recommended_price = market_avg

    else:
        action = "Keep price"
        recommended_price = our_price

    return {
        "action": action,
        "recommended_price": round(recommended_price, 2)
    }
@app.get("/executive-dashboard")
def executive_dashboard():
    return {
        "revenue": 1250000,
        "cost": 820000,
        "profit": 430000,
        "profit_margin": 34.4,
        "market_status": "Competitive",
        "demand_trend": "Increasing",
        "pricing_opportunities": 3
    }
@app.get("/health")
def health():
    return {
        "app": "PricePilot AI",
        "status": "Backend is running"
    } 
# =========================================================
# CHART DATA
# =========================================================

@app.post("/chart-data")
def chart_data(data: dict):

    predicted_sales = float(data["predicted_sales"])
    recommended_price = float(data["recommended_price"])

    forecast = data.get("forecast", {})
    profitability = data.get("profitability", {})
    competitor = data.get("competitor", {})

    return {
        "sales_chart": {
            "predicted_sales": predicted_sales,
            "target_sales": float(data.get("target_sales", 0))
        },

        "forecast_chart": {
            "short_term": forecast.get("short_term_forecast", 0),
            "medium_term": forecast.get("medium_term_forecast", 0),
            "long_term": forecast.get("long_term_forecast", 0)
        },

        "profitability_chart": {
            "revenue": profitability.get("revenue", 0),
            "cost": profitability.get("cost", 0),
            "profit": profitability.get("profit", 0),
            "profit_margin": profitability.get("profit_margin", 0)
        },

        "competitor_chart": {
            "our_price": competitor.get("our_price", 0),
            "market_average": competitor.get("market_average", 0),
            "competitors": competitor.get("competitors", [])
        },

        "recommended_price": recommended_price
    }


# =========================================================
# DOWNLOAD BUSINESS REPORT
# =========================================================


@app.post("/download-report")
def download_report(data: dict):
    """Generate a polished multi-page Unicode-safe PricePilot business report."""
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.colors import HexColor, white
    from reportlab.graphics.shapes import Drawing, String
    from reportlab.graphics.charts.barcharts import VerticalBarChart

    report_dir = Path("reports")
    report_dir.mkdir(exist_ok=True)
    report_path = report_dir / "PricePilot_Business_Report.pdf"

    font_candidates = [
        Path("C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/dejavu/DejaVuSans.ttf"),
    ]
    bold_candidates = [
        Path("C:/Windows/Fonts/segoeuib.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        Path("/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"),
    ]
    font = next((p for p in font_candidates if p.exists()), None)
    bold = next((p for p in bold_candidates if p.exists()), None)
    if not font or not bold:
        raise HTTPException(status_code=500, detail="A Unicode font with ₹ support is unavailable for PDF generation.")
    pdfmetrics.registerFont(TTFont("PricePilotSans", font))
    pdfmetrics.registerFont(TTFont("PricePilotSansBold", bold))

    def text(v, fallback="Not available"):
        if v is None or v == "":
            return fallback
        return str(v).replace("**", "").replace("__", "")

    def number(v):
        try:
            return float(v)
        except Exception:
            return 0.0

    def money(v):
        if v is None or v == "":
            return "Not available"
        return f"₹{number(v):,.2f}"

    C = {
        "ink": HexColor("#403445"), "muted": HexColor("#756A78"),
        "line": HexColor("#E7DEE6"), "soft": HexColor("#FBF8FA"),
        "coral": HexColor("#D87972"), "mint": HexColor("#719689"),
        "violet": HexColor("#76658C"), "pink": HexColor("#A65E78"),
        "lav": HexColor("#F1EAF5"), "green": HexColor("#EDF5F1"),
    }
    styles = getSampleStyleSheet()
    title = ParagraphStyle("ppTitle", fontName="PricePilotSansBold", fontSize=24, leading=29, textColor=C["ink"], spaceAfter=4)
    subtitle = ParagraphStyle("ppSub", fontName="PricePilotSans", fontSize=10, leading=14, textColor=C["muted"], spaceAfter=16)
    h1 = ParagraphStyle("ppH1", fontName="PricePilotSansBold", fontSize=16, leading=20, textColor=C["ink"], spaceBefore=4, spaceAfter=9)
    h2 = ParagraphStyle("ppH2", fontName="PricePilotSansBold", fontSize=11, leading=14, textColor=C["ink"], spaceBefore=5, spaceAfter=5)
    body = ParagraphStyle("ppBody", fontName="PricePilotSans", fontSize=9.2, leading=14, textColor=C["ink"], spaceAfter=7)
    small = ParagraphStyle("ppSmall", fontName="PricePilotSans", fontSize=7.8, leading=11, textColor=C["muted"], spaceAfter=4)

    product = text(data.get("product_name"))
    store = text(data.get("store"))
    category = text(data.get("category"))
    dept = text(data.get("department"))
    predicted = number(data.get("predicted_sales"))
    target = number(data.get("target_sales"))
    current = number(data.get("current_price"))
    recommended = data.get("recommended_price")
    action = text(data.get("action"))
    strategy = data.get("strategy") or {}
    forecast = data.get("forecast") or {}
    profitability = data.get("profitability") or {}
    competitor = data.get("competitor") or {}
    explanation = text(data.get("explanation"), "No AI explanation available.")

    revenue = number(profitability.get("revenue"))
    cost = number(profitability.get("total_cost", profitability.get("cost")))
    profit = number(profitability.get("profit"))
    margin = number(profitability.get("profit_margin"))
    short_fc = number(forecast.get("short_term_forecast"))
    med_fc = number(forecast.get("medium_term_forecast"))
    long_fc = number(forecast.get("long_term_forecast"))

    story = [
        Paragraph("PricePilot AI", title),
        Paragraph("Business Pricing & Revenue Intelligence Report", subtitle)
    ]

    info = Table([
        ["PRODUCT", product], ["STORE", store], ["CATEGORY", category], ["DEPARTMENT", dept]
    ], colWidths=[95,395])
    info.setStyle(TableStyle([
        ("FONTNAME",(0,0),(0,-1),"PricePilotSansBold"),
        ("FONTNAME",(1,0),(1,-1),"PricePilotSans"),
        ("BACKGROUND",(0,0),(-1,-1),C["soft"]),
        ("BOX",(0,0),(-1,-1),0.6,C["line"]),
        ("INNERGRID",(0,0),(-1,-1),0.3,C["line"]),
        ("TEXTCOLOR",(0,0),(-1,-1),C["ink"]),
        ("FONTSIZE",(0,0),(-1,-1),9),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
    ]))
    story += [info, Spacer(1,16), Paragraph("Executive Summary", h1)]

    cards = Table([
        ["PREDICTED WEEKLY SALES","CURRENT PRICE","RECOMMENDED PRICE","PROFIT MARGIN"],
        [f"{predicted:,.0f} units",money(current),money(recommended),f"{margin:.2f}%"]
    ], colWidths=[122.5]*4, rowHeights=[22,34])
    cards.setStyle(TableStyle([
        ("FONTNAME",(0,0),(-1,0),"PricePilotSansBold"),
        ("FONTNAME",(0,1),(-1,1),"PricePilotSansBold"),
        ("FONTSIZE",(0,0),(-1,0),7.2),("FONTSIZE",(0,1),(-1,1),12),
        ("TEXTCOLOR",(0,0),(-1,0),C["muted"]),("TEXTCOLOR",(0,1),(-1,1),C["ink"]),
        ("BACKGROUND",(0,0),(-1,-1),C["lav"]),
        ("GRID",(0,0),(-1,-1),0.4,C["line"]),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ]))
    story += [
        cards, Spacer(1,14),
        Paragraph(
            f"The current analysis predicts <b>{predicted:,.0f} units</b> per week against a target of "
            f"<b>{target:,.0f} units</b>. The pricing action is <b>{action}</b>, with a calculated "
            f"recommended price of <b>{money(recommended)}</b>.",
            body
        ),
        Paragraph("All figures in this report are generated from the current PricePilot analysis inputs and backend results.", small),
        PageBreak()
    ]

    # Pricing
    story += [Paragraph("01  Pricing Intelligence", title),
              Paragraph("Pricing decision, demand alignment and strategy rationale", subtitle)]
    rows = [
        ["Metric","Value"],
        ["Predicted weekly sales",f"{predicted:,.0f} units"],
        ["Target sales",f"{target:,.0f} units"],
        ["Current price",money(current)],
        ["Recommended price",money(recommended)],
        ["Pricing action",action],
    ]
    t=Table(rows,colWidths=[245,245],repeatRows=1)
    t.setStyle(TableStyle([
        ("FONTNAME",(0,0),(-1,0),"PricePilotSansBold"),("FONTNAME",(0,1),(-1,-1),"PricePilotSans"),
        ("BACKGROUND",(0,0),(-1,0),C["coral"]),("TEXTCOLOR",(0,0),(-1,0),white),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[white,C["soft"]]),("GRID",(0,0),(-1,-1),0.4,C["line"]),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)
    ]))
    story += [t,Spacer(1,12),Paragraph("Pricing Strategy",h2)]
    strategy_name=text(strategy.get("strategy") or strategy.get("action") or action)
    story += [Paragraph(f"<b>{strategy_name}</b>",body)]
    reason=strategy.get("reason") or strategy.get("explanation")
    if reason:
        story += [Paragraph(text(reason),body)]
    story += [Paragraph("Price Position Comparison",h2)]

    d=Drawing(500,205)
    ch=VerticalBarChart()
    ch.x=55; ch.y=42; ch.width=405; ch.height=125
    ch.data=[[current,number(recommended),number(competitor.get("market_average"))]]
    ch.categoryAxis.categoryNames=["Current","Recommended","Market avg"]
    ch.valueAxis.valueMin=0
    ch.valueAxis.valueMax=max(current,number(recommended),number(competitor.get("market_average")),1)*1.25
    ch.categoryAxis.labels.fontName="PricePilotSans"; ch.categoryAxis.labels.fontSize=8
    ch.valueAxis.labels.fontName="PricePilotSans"; ch.valueAxis.labels.fontSize=7
    ch.bars[0].fillColor=C["coral"]
    d.add(ch)
    d.add(String(55,185,"Current vs recommended vs market price",fontName="PricePilotSansBold",fontSize=10,fillColor=C["ink"]))
    story += [d, PageBreak()]

    # Market
    story += [Paragraph("02  Market & Competitor Intelligence",title),
              Paragraph("Benchmark your price against the supplied competitor inputs",subtitle)]
    comps=competitor.get("competitors") or []
    rows=[["Benchmark","Price"]]+[[text(x.get("name")),money(x.get("price"))] for x in comps]
    rows += [["Your price",money(competitor.get("our_price",current))],
             ["Market average",money(competitor.get("market_average"))]]
    t=Table(rows,colWidths=[245,245],repeatRows=1)
    t.setStyle(TableStyle([
        ("FONTNAME",(0,0),(-1,0),"PricePilotSansBold"),("FONTNAME",(0,1),(-1,-1),"PricePilotSans"),
        ("BACKGROUND",(0,0),(-1,0),C["violet"]),("TEXTCOLOR",(0,0),(-1,0),white),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[white,C["soft"]]),("GRID",(0,0),(-1,-1),0.4,C["line"]),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)
    ]))
    story += [t,Spacer(1,10)]
    diff=competitor.get("difference_percent")
    if diff is not None:
        story += [Paragraph(f"<b>Market position:</b> Your price differs from the market average by {number(diff):.2f}%.",body)]
    labels=["Your price"]+[text(x.get("name")) for x in comps]
    vals=[number(competitor.get("our_price",current))]+[number(x.get("price")) for x in comps]
    if vals:
        d=Drawing(500,220); ch=VerticalBarChart(); ch.x=55; ch.y=45; ch.width=405; ch.height=135
        ch.data=[vals]; ch.categoryAxis.categoryNames=labels; ch.valueAxis.valueMin=0; ch.valueAxis.valueMax=max(vals+[1])*1.25
        ch.categoryAxis.labels.fontName="PricePilotSans"; ch.categoryAxis.labels.fontSize=8; ch.valueAxis.labels.fontName="PricePilotSans"; ch.valueAxis.labels.fontSize=7
        ch.bars[0].fillColor=C["mint"]; d.add(ch); d.add(String(55,198,"Competitor Price Benchmark",fontName="PricePilotSansBold",fontSize=10,fillColor=C["ink"]))
        story += [d]
    story += [PageBreak()]

    # Forecast
    story += [Paragraph("03  Demand Forecast",title),
              Paragraph("Short-, medium- and long-term demand outlook",subtitle)]
    rows=[["Period","Forecast"],["Short term",f"{short_fc:,.0f} units"],["Medium term",f"{med_fc:,.0f} units"],
          ["Long term",f"{long_fc:,.0f} units"],["Confidence",f"{text(forecast.get('confidence'))}%"],
          ["Trend",text(forecast.get("trend"))]]
    t=Table(rows,colWidths=[245,245],repeatRows=1)
    t.setStyle(TableStyle([
        ("FONTNAME",(0,0),(-1,0),"PricePilotSansBold"),("FONTNAME",(0,1),(-1,-1),"PricePilotSans"),
        ("BACKGROUND",(0,0),(-1,0),C["mint"]),("TEXTCOLOR",(0,0),(-1,0),white),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[white,C["green"]]),("GRID",(0,0),(-1,-1),0.4,C["line"]),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)
    ]))
    story += [t,Spacer(1,10)]
    d=Drawing(500,220); ch=VerticalBarChart(); ch.x=55; ch.y=45; ch.width=405; ch.height=135
    ch.data=[[short_fc,med_fc,long_fc]]; ch.categoryAxis.categoryNames=["Short term","Medium term","Long term"]
    ch.valueAxis.valueMin=0; ch.valueAxis.valueMax=max(short_fc,med_fc,long_fc,1)*1.2
    ch.categoryAxis.labels.fontName="PricePilotSans"; ch.categoryAxis.labels.fontSize=8; ch.valueAxis.labels.fontName="PricePilotSans"; ch.valueAxis.labels.fontSize=7
    ch.bars[0].fillColor=C["mint"]; d.add(ch); d.add(String(55,198,"Forecasted Demand",fontName="PricePilotSansBold",fontSize=10,fillColor=C["ink"]))
    story += [d,Spacer(1,8),Paragraph("The forecast values represent the demand trajectory produced by the current analysis inputs. Confidence and trend should be interpreted together with the forecast values.",body),PageBreak()]

    # Profitability
    story += [Paragraph("04  Profitability",title),
              Paragraph("Revenue, cost and profit composition",subtitle)]
    rows=[["Metric","Value"],["Revenue",money(revenue)],["Total cost",money(cost)],["Profit",money(profit)],["Profit margin",f"{margin:.2f}%"]]
    t=Table(rows,colWidths=[245,245],repeatRows=1)
    t.setStyle(TableStyle([
        ("FONTNAME",(0,0),(-1,0),"PricePilotSansBold"),("FONTNAME",(0,1),(-1,-1),"PricePilotSans"),
        ("BACKGROUND",(0,0),(-1,0),C["pink"]),("TEXTCOLOR",(0,0),(-1,0),white),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[white,C["soft"]]),("GRID",(0,0),(-1,-1),0.4,C["line"]),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)
    ]))
    story += [t,Spacer(1,10)]
    d=Drawing(500,205); ch=VerticalBarChart(); ch.x=55; ch.y=42; ch.width=405; ch.height=125
    ch.data=[[revenue,cost,profit]]; ch.categoryAxis.categoryNames=["Revenue","Cost","Profit"]; ch.valueAxis.valueMin=0; ch.valueAxis.valueMax=max(revenue,cost,profit,1)*1.2
    ch.categoryAxis.labels.fontName="PricePilotSans"; ch.categoryAxis.labels.fontSize=8; ch.valueAxis.labels.fontName="PricePilotSans"; ch.valueAxis.labels.fontSize=7
    ch.bars[0].fillColor=C["pink"]; d.add(ch); d.add(String(55,185,"Profitability Composition",fontName="PricePilotSansBold",fontSize=10,fillColor=C["ink"]))
    story += [d,Spacer(1,8),Paragraph("Revenue = price × units sold. Total cost = cost per unit × units sold. Profit = revenue − total cost. Profit margin expresses profit as a percentage of revenue.",body),PageBreak()]

    # AI insight
    story += [Paragraph("05  AI Business Insight",title),
              Paragraph("Interpretation of the current pricing analysis",subtitle)]
    box=Table([["AI INSIGHT"],[Paragraph(explanation,body)]],colWidths=[490])
    box.setStyle(TableStyle([
        ("FONTNAME",(0,0),(-1,0),"PricePilotSansBold"),("FONTSIZE",(0,0),(-1,0),8),
        ("BACKGROUND",(0,0),(-1,0),C["lav"]),("BACKGROUND",(0,1),(-1,-1),C["soft"]),
        ("BOX",(0,0),(-1,-1),0.6,C["line"]),("LEFTPADDING",(0,0),(-1,-1),14),
        ("RIGHTPADDING",(0,0),(-1,-1),14),("TOPPADDING",(0,0),(-1,-1),11),("BOTTOMPADDING",(0,0),(-1,-1),11)
    ]))
    story += [box,Spacer(1,18),Paragraph("Key Takeaways",h2),
              Paragraph(f"• Pricing action: {action}<br/>• Predicted demand: {predicted:,.0f} units/week<br/>• Target demand: {target:,.0f} units/week<br/>• Profit margin: {margin:.2f}%"
                        + (f"<br/>• Market difference: {number(diff):.2f}%" if diff is not None else ""), body),
              Spacer(1,18),Paragraph("Report Note",h2),
              Paragraph("This report is generated from the values returned by PricePilot AI for the selected product and analysis session.",small)]

    def footer(c, doc):
        c.saveState()
        c.setStrokeColor(C["line"]); c.line(42,34,553,34)
        c.setFont("PricePilotSans",7.5); c.setFillColor(C["muted"])
        c.drawString(42,21,"PricePilot AI  •  Business Pricing & Revenue Intelligence")
        c.drawRightString(553,21,f"Page {doc.page}")
        c.restoreState()

    doc=SimpleDocTemplate(str(report_path),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=44,bottomMargin=48,
                          title="PricePilot AI Business Report",author="PricePilot AI")
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    return FileResponse(path=str(report_path),media_type="application/pdf",filename="PricePilot_Business_Report.pdf")
