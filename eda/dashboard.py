"""
PricePilot AI — Dynamic Pricing & Revenue Intelligence Dashboard
================================================================

An interactive, enterprise-grade decision support platform that unifies:
1. Executive Portfolio Overview (Revenue, Volume, Average Price & Forecast Confidence)
2. Price Optimization (Baseline Reference, ML Predicted & Recommended Target Prices)
3. Multi-Horizon Demand Forecasting (7-Day, 14-Day, 30-Day Projections & Velocity)
4. Demand Trend & Forecast Reliability (Trajectory Classification & Multi-Horizon Agreement)
5. Business Performance & Commercial KPIs (Demand, Pricing, Promotion & Revenue Metrics)
6. AI Business Insights & Executive Synthesis (Gemini LLM Business Directives)
7. Product Deep Dive (Consolidated SKU-level Intelligence)

Architecture:
  - Framework: Streamlit + Plotly Express / Graph Objects
  - Caching: @st.cache_data for sub-second dataset initialization
  - Data Source: Pre-computed reports (eda/reports/kpi_summary.csv,
                 kpi_overall_summary.json, demand_trend_summary.json,
                 gemini_business_insight_examples.json)
  - Zero ML Model Mutations | Zero Raw Dataset Dependencies | Safe Key Management
"""

from __future__ import annotations

import html
import json
import os
import sys
import textwrap
from pathlib import Path
from typing import Any, Dict, Optional

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# Set page configuration - must be first Streamlit command
st.set_page_config(
    page_title="PricePilot AI — Dynamic Pricing & Revenue Intelligence",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# Path Resolution & Environment Loading
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent
REPORTS_DIR = ROOT_DIR / "eda" / "reports"
KPI_SUMMARY_CSV = REPORTS_DIR / "kpi_summary.csv"
KPI_OVERALL_JSON = REPORTS_DIR / "kpi_overall_summary.json"
DEMAND_TREND_JSON = REPORTS_DIR / "demand_trend_summary.json"
PRICE_EXAMPLES_CSV = REPORTS_DIR / "price_recommendation_examples.csv"
DEMAND_EXAMPLES_CSV = REPORTS_DIR / "demand_forecast_examples.csv"
GEMINI_EXAMPLES_JSON = REPORTS_DIR / "gemini_business_insight_examples.json"
GEMINI_EXAMPLES_CSV = REPORTS_DIR / "gemini_business_insight_examples.csv"

# Load environment variables from .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT_DIR / ".env", override=False)
    load_dotenv(override=False)
except ImportError:
    pass

# Optional import of Gemini Engine for live generation if key is present
try:
    if str(ROOT_DIR) not in sys.path:
        sys.path.insert(0, str(ROOT_DIR))
    from eda.gemini_business_insights import (
        GeminiBusinessInsightsEngine,
        build_structured_business_context,
    )
    GEMINI_MODULE_AVAILABLE = True
except Exception:
    GEMINI_MODULE_AVAILABLE = False


# ---------------------------------------------------------------------------
# Display-Only Category, Department & Enum Mappings
# ---------------------------------------------------------------------------
DEPT_DISPLAY_MAP: Dict[str, str] = {
    "Unknown": "Unknown Department",
    "АВТОТОВАРЫ": "Automotive Supplies",
    "АКСЕССУАРЫ ДЛЯ КУРЕНИЯ": "Smoking Accessories",
    "БЕЛАЯ РЫБА МОРСКАЯ": "White Sea Fish",
    "БЕЛАЯ РЫБА МОРСКАЯ ОХЛАЖДЕННАЯ": "Chilled White Sea Fish",
    "БЕЛАЯ РЫБА РЕЧНАЯ ОХЛАЖДЕННАЯ": "Chilled Freshwater Fish",
    "БУМАЖНО-ВАТНАЯ ПРОДУКЦИЯ": "Paper & Cotton Products",
    "БУРГЕРЫ": "Burgers & Sandwiches",
    "БУТЕРБРОДЫ": "Sandwiches & Wraps",
    "БЫСТРЫЙ ПЕРЕКУС": "Quick Snacks",
    "ВАРЕНЬЕ,МЁД": "Jams & Honey",
    "ВИНО": "Wine",
    "ВОДА": "Bottled Water",
    "ВОДКА,НАСТОЙКИ": "Spirits & Liqueurs",
    "ВОК": "Wok & Asian Prepared Meals",
    "ВСПОМОГАТЕЛЬНАЯ ГРУППА": "Auxiliary & General Merchandise",
    "ВТОРЫЕ БЛЮДА": "Main Courses & Entrees",
    "ГЛОБАЛЬНЫЙ КАТАЛОГ": "General Catalog",
    "ГОРЯЧИЕ БУТЕРБРОДЫ": "Hot Sandwiches",
    "ГОТОВЫЕ БЛЮДА": "Prepared Ready Meals",
    "ГРИБЫ": "Fresh Mushrooms",
    "ГРИБЫ ЗАМОРОЖЕННЫЕ": "Frozen Mushrooms",
    "ГРИЛЬ": "Grill & BBQ Meats",
    "ДЕТСКИЕ МОЛОЧНЫЕ ПРОДУКТЫ": "Baby & Toddler Dairy",
    "ДЕТСКИЙ МИР": "Kids & Baby Care",
    "ДЕТСКОЕ ПИТАНИЕ": "Baby Food",
    "ДИЕТИЧЕСКОЕ ПИТАНИЕ": "Dietary & Health Food",
    "ДОМАШНЯЯ КУХНЯ": "Home Style Deli",
    "ЗАВТРАКИ": "Breakfast Foods & Cereals",
    "ЗЕЛЕНЬ СВЕЖАЯ": "Fresh Herbs & Greens",
    "ЗОЖ": "Healthy Lifestyle & Organic",
    "ЗООТОВАРЫ": "Pet Supplies",
    "ИЗДЕЛИЯ ИЗ ТЕСТА": "Pastry & Dough Products",
    "ИКРА БЕЛКОВАЯ": "Protein Caviar Alternative",
    "ИКРА ЛОСОСЕВАЯ": "Salmon Red Caviar",
    "ИКРА РЕЧНЫХ И МОРСКИХ РЫБ": "Fish Caviar & Roe",
    "ИКРА РЫБ ОСЕТРОВЫХ ПОРОД": "Sturgeon Black Caviar",
    "ИНГРЕДИЕНТЫ ДЛЯ ЭТНИЧЕСКОЙ КУХНИ": "Ethnic Cuisine Ingredients",
    "ИНФОРМАЦИОННЫЕ ТОВАРЫ": "Publications & Media",
    "КАКАО,ШОКОЛАД": "Cocoa & Hot Chocolate",
    "КАФЕ": "Cafe & Ready Beverages",
    "КВАС": "Kvass & Traditional Drinks",
    "КЕТЧУПЫ,СОУСЫ НА ТОМАТНОЙ ОСНОВЕ": "Ketchup & Tomato Sauces",
    "КОЛБАСЫ ВАРЕНЫЕ": "Boiled Sausages & Bologna",
    "КОЛБАСЫ КОПЧЕНЫЕ.СЫРОВЯЛЕНЫЕ": "Smoked & Cured Sausages",
    "КОНСЕРВЫ ГРИБНЫЕ": "Canned Mushrooms",
    "КОНСЕРВЫ МОЛОЧНЫЕ": "Condensed & Canned Milk",
    "КОНСЕРВЫ МЯСНЫЕ": "Canned Meat & Poultry",
    "КОНСЕРВЫ ОВОЩНЫЕ": "Canned Vegetables",
    "КОНСЕРВЫ РЫБНЫЕ": "Canned Fish & Seafood",
    "КОНСЕРВЫ ФРУКТОВЫЕ,ЯГОДНЫЕ": "Canned Fruits & Berries",
    "КОНФЕТЫ": "Candies & Confectionery",
    "КОНЬЯК": "Cognac & Brandy",
    "КОРЖИ И ТАРТАЛЕТКИ": "Pie Crusts & Tartlets",
    "КОРМА ДЛЯ КОШЕК": "Cat Food",
    "КОРМА ДЛЯ СОБАК": "Dog Food",
    "КОФЕ": "Coffee & Espresso",
    "КРАСНАЯ РЫБА": "Salmon & Trout (Red Fish)",
    "КРАСНАЯ РЫБА ОХЛАЖДЕННАЯ": "Chilled Salmon & Trout",
    "КРЕВЕТКИ": "Shrimp & Prawns",
    "КРЕПКИЕ АЛКОГОЛЬНЫЕ НАПИТКИ": "Hard Liquors & Spirits",
    "КРУПЫ И ЗЕРНОВЫЕ": "Grains, Rice & Cereals",
    "ЛАКОМСТВА ДЛЯ ЖИВОТНЫХ": "Pet Treats",
    "ЛИМОНАДЫ": "Sodas & Lemonades",
    "МАЙОНЕЗ,СОУСЫ НА МАЙОНЕЗНОЙ ОСНОВЕ": "Mayonnaise & Creamy Sauces",
    "МАКАРОННЫЕ ИЗДЕЛИЯ": "Pasta & Noodles",
    "МАНГАЛ": "Barbecue & Grill Items",
    "МАСЛО И МАРГАРИН": "Butter & Margarine",
    "МАСЛО ОЛИВКОВОЕ": "Olive Oil",
    "МАСЛО ПОДСОЛНЕЧНОЕ": "Sunflower Oil",
    "МАСЛО ПРОЧЕЕ": "Specialty Cooking Oils",
    "МОЛОКО": "Milk & Dairy Drinks",
    "МОРЕПРОДУКТЫ": "Fresh & Frozen Seafood",
    "МОРОЖЕНОЕ И ЗАМОРОЖЕННЫЕ ДЕСЕРТЫ": "Ice Cream & Frozen Desserts",
    "МУКА": "Flour & Baking Mixes",
    "МЯСНЫЕ ДЕЛИКАТЕСЫ": "Deli Meats & Cold Cuts",
    "МЯСНЫЕ П/Ф": "Meat Semi-Finished Cuts",
    "НАБОРЫ КОНФЕТ": "Chocolate & Candy Gift Sets",
    "НАПОЛНИТЕЛИ": "Pet Litter & Bedding",
    "НЕСЛАДКИЕ МУЧНЫЕ ИЗДЕЛИЯ": "Savory Bakery & Flatbreads",
    "ОВОЩИ": "Fresh Vegetables",
    "ОВОЩИ ЗАМОРОЖЕННЫЕ": "Frozen Vegetables",
    "ОРЕХИ": "Nuts & Dried Seeds",
    "ОСВЕЖИТЕЛИ,ИНСЕКТИЦИДЫ": "Air Fresheners & Household Care",
    "ОСТРЫЕ СОУСЫ": "Hot Sauces & Condiments",
    "ПЕЛЬМЕНИ,МАНТЫ,ХИНКАЛИ": "Dumplings & Pierogis",
    "ПЕРВЫЕ БЛЮДА": "Soups & Broths",
    "ПЕРСОНАЛЬНЫЙ УХОД": "Personal Care & Hygiene",
    "ПИВО": "Beer & Cider",
    "ПИРОГИ": "Pies & Tarts",
    "ПИРОЖНЫЕ": "Pastries & Cakes",
    "ПИЦЦА": "Fresh Ready Pizza",
    "ПИЦЦА ПОЛУФАБРИКАТ": "Frozen Pizza Preps",
    "ПОЛУФАБРИКАТЫ": "Prepared Frozen Foods",
    "ПОНЧИКИ": "Donuts & Sweet Pastries",
    "ПРЕСЕРВЫ.ПАШТЕТЫ": "Preserves, Pates & Spreads",
    "ПРИКАССА": "Checkout Impulses & Gum",
    "ПРОДУКТЫ ИЗ СУРИМИ": "Surimi & Crab Sticks",
    "ПРОДУКЦИЯ БЫСТРОГО ПРИГОТОВЛЕНИЯ": "Instant Foods & Noodles",
    "ПРОЧИЕ СОУСЫ": "Specialty Sauces & Dressings",
    "ПТИЦА": "Poultry & Chicken",
    "РАСТИТЕЛЬНЫЕ МОЛОЧНЫЕ ПРОДУКТЫ": "Plant-Based Dairy Alternatives",
    "РЫБА ГОРЯЧЕГО КОПЧЕНИЯ": "Hot Smoked Fish",
    "РЫБА СВЕЖАЯ НЕ ИСПОЛЬЗОВАТЬ": "Fresh Fish (Archive)",
    "РЫБА СОЛЕНАЯ": "Salted & Cured Fish",
    "РЫБА ХОЛОДНОГО КОПЧЕНИЯ": "Cold Smoked Fish",
    "РЫБКА К ПИВУ": "Dried Fish Beer Snacks",
    "РЫБНАЯ КУЛИНАРИЯ": "Prepared Seafood Deli",
    "РЫБНЫЕ ПОЛУФАБРИКАТЫ": "Seafood Semi-Finished",
    "РЫБНЫЕ ПОЛУФАБРИКАТЫ ОХЛАЖДЕННЫЕ": "Chilled Seafood Semi-Finished",
    "САЛАТЫ": "Fresh Prepared Salads",
    "САХАР": "Sugar & Sweeteners",
    "СВЕЖЕЕ МЯСО": "Fresh Meat & Pork/Beef",
    "СДОБА": "Sweet Breads & Buns",
    "СЕМЕЧКИ": "Sunflower & Pumpkin Seeds",
    "СИРОПЫ": "Syrups & Toppings",
    "СЛАБОАЛКОГОЛЬНЫЕ НАПИТКИ": "Low Alcohol Beverages",
    "СЛАДКИЕ МУЧНЫЕ ИЗДЕЛИЯ": "Sweet Bakery & Cookies",
    "СЛАДОСТИ": "Sweets & Confections",
    "СЛИВКИ": "Cream & Half-and-Half",
    "СЛОЙКА": "Puff Pastries & Croissants",
    "СНЕКИ": "Snacks & Crisps",
    "СОВРЕМЕННАЯ МОЛОЧНАЯ КАТЕГОРИЯ": "Modern Yogurt & Dairy Snacks",
    "СОКИ": "Fruit Juices",
    "СОКИ,МОРСЫ,НАПИТКИ": "Juices, Fruit Drinks & Nectars",
    "СОЛЕНИЯ": "Pickles & Fermented Goods",
    "СОЛЬ": "Table & Sea Salt",
    "СОПУТСТВУЮЩИЕ ТОВАРЫ ДЛЯ СТИРКИ": "Laundry Accessories",
    "СОСИСКИ.САРДЕЛЬКИ.ШПИКАЧКИ": "Wieners, Frankfurters & Sausages",
    "СОУСЫ ДЛЯ ЭТНИЧЕСКОЙ КУХНИ И ПАСТЫ": "Ethnic Cooking & Pasta Sauces",
    "СПЕЦИИ,ПРИПРАВА": "Spices & Seasonings",
    "СПОРТИВНОЕ ПИТАНИЕ": "Sports Nutrition & Protein",
    "СРЕДСТВА ДЛЯ СТИРКИ": "Laundry Detergents",
    "СУХАРИКИ": "Croutons & Bread Bites",
    "СУХИЕ КОМПОНЕНТЫ": "Baking Ingredients & Dry Mixes",
    "СУХОФРУКТЫ": "Dried Fruits",
    "СУШИ": "Sushi & Japanese Deli",
    "СЫРЫ ВЕСОВЫЕ": "Bulk & Service Cheeses",
    "СЫРЫ ШТУЧНЫЕ": "Packaged Cheeses",
    "ТАБАЧНЫЕ ИЗДЕЛИЯ": "Tobacco Products",
    "ТЕСТО": "Chilled & Frozen Dough",
    "ТОВАРЫ ДЛЯ ДОМА": "Home Goods & Utilities",
    "ТОВАРЫ ДЛЯ ЛИЧНОГО ПОЛЬЗОВАНИЯ": "Personal Care Essentials",
    "ТОВАРЫ ДЛЯ ПРАЗДНИКА": "Party & Celebration Supplies",
    "ТОВАРЫ ДЛЯ УБОРКИ": "Cleaning Supplies & Mops",
    "ТОВАРЫ ДЛЯ ШКОЛЫ И ОФИСА": "School & Office Supplies",
    "ТОРТЫ": "Cakes & Celebration Desserts",
    "ТОРТЫ И ПИРОЖНЫЕ": "Cakes & Pastries",
    "ТРАДИЦИОННЫЕ МОЛОЧНЫЕ ПРОДУКТЫ": "Traditional Dairy (Kefir, Sour Cream)",
    "УКСУС": "Vinegars & Dressing Acids",
    "ФРУКТОВЫЕ САЛАТЫ": "Fresh Fruit Bowls & Salads",
    "ФРУКТЫ": "Fresh Fruits",
    "ФУНКЦИОНАЛЬНЫЕ НАПИТКИ": "Functional & Vitamin Drinks",
    "ХЛЕБ": "Fresh Bread & Baguettes",
    "ХОЛОДНЫЕ ЗАКУСКИ": "Cold Appetizers & Charcuterie",
    "ЦВЕТЫ": "Fresh Cut & Potted Flowers",
    "ЧАЙ": "Tea & Herbal Infusions",
    "ЧАЙ ХОЛОДНЫЙ": "Iced Tea & Cold Brews",
    "ЧИПСЫ": "Potato & Corn Chips",
    "ЧИСТЯЩИЕ,МОЮЩИЕ СРЕДСТВА": "Dish & Surface Cleaners",
    "ШАУРМА": "Shawarma & Street Food",
    "ШОКОЛАД,ШОКОЛАДНАЯ ПАСТА": "Chocolate Bars & Spreads",
    "ЭНЕРГЕТИКИ": "Energy Drinks",
    "ЭТНИЧЕСКИЕ МАКАРОННЫЕ ИЗДЕЛИЯ": "Ethnic Noodles & Rice Pastas",
    "ЭТНИЧЕСКИЕ СНЭКИ И ВОДОРОСЛИ": "Seaweed & Asian Snacks",
    "ЯГОДЫ ЗАМОРОЖЕННЫЕ": "Frozen Berries",
    "ЯЙЦО": "Fresh Eggs",
}

CLASS_DISPLAY_MAP: Dict[str, str] = {
    "Unknown": "Unknown Class",
    "ДЛЯ ДЕТЕЙ И ВЗРОСЛЫХ": "All-Ages / Family Care",
    "ОТЕЧЕСТВЕННОЕ": "Domestic Brand",
    "СИГАРЕТЫ": "Cigarettes",
    "ПЕЧЕНЬЕ": "Cookies & Biscuits",
    "ЙОГУРТЫ": "Yogurts",
    "МЕЛКОШТУЧНОЕ": "Small Pastries & Bites",
    "ПАУЧИ ДЛЯ КОШЕК": "Cat Food Pouches",
    "ШОКОЛАД": "Chocolate Bars",
    "БУМАЖНАЯ ПРОДУКЦИЯ": "Paper Goods",
    "НЕКОЛОСОДЕРЖАЩИЕ": "Non-Spike Grain Crops",
    "СЫРЫ ПОЛУТВЕРДЫЕ": "Semi-Hard Cheeses",
    "КАРТОФЕЛЬНЫЕ": "Potato Chips",
    "ВИНА ТИХИЕ": "Still Wines",
    "КОЛОСОДЕРЖАЩИЕ": "Spike Grain Crops",
    "МАКАРОННЫЕ ИЗДЕЛИЯ ГРУППЫ А": "Durum Wheat Pasta (Group A)",
    "КИСЛОМОЛОЧНЫЕ ПРОДУКТЫ": "Cultured Dairy Products",
    "КОНФЕТЫ ШОКОЛАДНЫЕ": "Chocolate Candies",
    "ЖЕВАТЕЛЬНАЯ РЕЗИНКА": "Chewing Gum",
    "КРУПЫ В МЯГКОЙ УПАКОВКЕ": "Pouch Cereals & Grains",
    "ЧЁРНЫЙ": "Black Tea / Dark Blend",
    "НЕКОРНЕПЛОДЫ": "Non-Root Vegetables",
    "КОНФЕТЫ ДЕТСКИЕ С ИГРУШКАМИ": "Kids Candies with Toys",
    "ВОДКА": "Vodka",
    "ТВОРОГ": "Cottage Cheese / Curd",
    "ХЛЕБ БЕЛЫЙ": "White Bread",
    "МАЙОНЕЗ": "Mayonnaise",
    "МАРМЕЛАД,ЗЕФИР,ПАСТИЛА,СУФЛЕ": "Marshmallows, Marmalade & Souffle",
    "ТВОРОЖКИ": "Curd Desserts & Snack Pots",
    "ДЛЯ ГОТОВЫХ БЛЮД": "Ready Meal Containers",
    "КОФЕ РАСТВОРИМЫЙ": "Instant Coffee",
    "КОНФЕТЫ": "Candies",
    "ЭНЕРГЕТИКИ": "Energy Drinks",
    "ПЮРЕ": "Fruit & Vegetable Puree",
    "ПОСУДА": "Tableware & Utensils",
    "МЯСНЫЕ ДЕЛИКАТЕСЫ ВАРЕНО-КОПЧЕНЫЕ,СЫРОВЯЛЕНЫЕ,СЫРОКОПЧЕНЫЕ": "Smoked & Cured Meat Cuts",
    "НАПИТКИ": "Beverages",
    "ФАСОВАННЫЕ": "Pre-Packaged",
    "ДЕТСКИЕ ПРОДУКТЫ ДО 3-Х ЛЕТ": "Infant Products (Under 3 Years)",
    "МОЛОКО ПАСТЕРИЗОВАННОЕ": "Pasteurized Milk",
    "ДЛЯ ВАННЫ И ДУША": "Bath & Shower Care",
    "ЛАПША БЫСТРОГО ПРИГОТОВЛЕНИЯ": "Instant Noodles & Ramen",
    "МОНОСПЕЦИИ": "Single Spices & Herbs",
    "ВИНА ИГРИСТЫЕ": "Sparkling Wines & Champagne",
    "ЛИЦЕНЗИОННОЕ": "Licensed / Specialty Brands",
    "ШОКОЛАД,ШОКОЛАДНЫЕ ЯЙЦА": "Chocolate Eggs & Novelties",
    "НЕГАЗ.": "Still / Non-Carbonated",
    "ХЛЕБЦЫ": "Crispbreads & Crackers",
    "ПОДСОЛНЕЧНИКА": "Sunflower Seed Products",
    "КОРНЕПЛОДЫ": "Root Vegetables (Carrots, Potatoes, Beets)",
    "ИМПОРТНОЕ": "Imported Goods",
    "СЫРЫ ПЛАВЛЕНЫЕ": "Processed Cheeses",
    "СОСИСКИ": "Sausages & Frankfurters",
    "СЫРЫ РАССОЛЬНЫЕ": "Brined Cheeses (Feta, Sulguni)",
    "ЛЕЧЕБНО-СТОЛОВАЯ": "Mineral Table Water",
    "СЫРКИ": "Glazed Curd Bars",
    "ПРЕДМЕТЫ ЖЕНСКОЙ ГИГИЕНЫ": "Feminine Hygiene",
    "СЛОЙКА": "Puff Pastry Items",
    "СЫРЫ ПРЕМИАЛЬНЫЙ БЛОК": "Premium Block Cheeses",
    "КОЛБАСА СЫРОКОПЧЕНАЯ": "Dry-Cured Sausages",
    "КЕТЧУПЫ": "Ketchups",
    "КОЛБАСА ВАРЕНАЯ": "Boiled Sausages",
    "ГИГИЕНА ПОЛОСТИ РТА": "Oral Care & Dental",
    "ШТУЧНЫЕ": "Single Item Packs",
    "ВОСТОЧНЫЕ СЛАДОСТИ": "Oriental Sweets (Halva, Baklava)",
    "КОСТОЧКОВЫЕ": "Stone Fruits (Peaches, Cherries, Plums)",
    "МОЛОЧНЫЕ КОКТЕЙЛИ": "Milkshakes & Flavored Dairy",
    "СМЕТАНА": "Sour Cream",
    "ВАФЛИ": "Wafers & Waffles",
    "БАТОНЧИКИ": "Snack & Protein Bars",
    "САЛАТЫ ВЕС.": "Bulk Prepared Salads",
    "КУРЫ ОХЛАЖДЕННЫЕ": "Chilled Chicken Poultry",
    "ФАРШИ КОТЛЕТЫ": "Minced Meat & Patties",
    "ПЕЛЬМЕНИ": "Dumplings (Pelmeni)",
    "МАСЛО СЛИВОЧНОЕ": "Butter",
    "КАШИ": "Porridge & Hot Cereals",
    "СЛИВКИ": "Cream",
    "СНЕКИ ИЗ РЫБЫ И МОРЕПРОДУКТОВ": "Seafood & Dried Fish Snacks",
    "ХЛЕБ ЗЕРНОВОЙ": "Multigrain & Whole Wheat Bread",
    "СОУСЫ НА МАЙОНЕЗНОЙ ОСНОВЕ": "Mayonnaise-Based Sauces",
    "КАФЕ": "Cafe Counter",
    "ХЛОПЬЯ": "Breakfast Flakes & Oats",
    "СО ВКУСОВЫМИ ДОБАВКАМИ": "Flavored Varieties",
    "РАФИНИРОВАННОЕ": "Refined Oil",
    "ЗЕЛЕНЬ": "Fresh Green Herbs",
    "КРАСНАЯ РЫБА": "Salmon & Trout",
    "ПЕРВЫЕ БЛЮДА": "Soups & Broths",
    "СУШИ ШТУЧНЫЕ": "Individual Sushi Items",
    "ГОТОВЫЕ ЗАВТРАКИ": "Ready-to-Eat Breakfasts",
    "ПРЕСЕРВЫ РЫБНЫЕ": "Seafood Preserves",
    "СТИКИ ТАБАЧНЫЕ": "Tobacco Heating Sticks",
    "ПОМОЩЬ ПИЩЕВАРЕНИЮ": "Digestive Health & Probiotics",
    "ХЛЕБ НАЦИОНАЛЬНЫЙ": "Artisan & Traditional Flatbreads",
    "ВЕСОВЫЕ": "Bulk / Weighted Goods",
    "ХЛЕБ РЖАНОЙ": "Rye Bread",
    "БЕЛАЯ РЫБА": "White Fish",
    "СЫРЫ ТВОРОЖНЫЕ": "Cream & Curd Cheeses",
    "ПРЯНИКИ": "Gingerbread & Spice Cookies",
    "ГАЗ": "Carbonated / Sparkling",
}

PRIORITY_DISPLAY_MAP: Dict[str, str] = {
    "HUMAN_COMMERCIAL_REVIEW": "Human Commercial Review",
    "PRICE_INCREASE_OPPORTUNITY": "Price Increase Opportunity",
    "PRICE_REDUCTION_RECOMMENDED": "Price Reduction Recommended",
    "PRICING_MARKDOWN_REVIEW": "Pricing Markdown Review",
    "PROMOTIONAL_STIMULATION_REVIEW": "Promotional Stimulation Review",
    "STABLE_CORE_OPERATIONS": "Stable Core Operations",
    "STANDARD_MONITORING": "Standard Monitoring",
    "STOCK_REPLENISHMENT_PRIORITY": "Stock Replenishment Priority",
}

TREND_DISPLAY_MAP: Dict[str, str] = {
    "INCREASING": "Increasing",
    "STABLE": "Stable",
    "DECREASING": "Decreasing",
}

CONF_DISPLAY_MAP: Dict[str, str] = {
    "HIGH": "High",
    "MEDIUM": "Medium",
    "LOW": "Low",
}

CONSISTENCY_DISPLAY_MAP: Dict[str, str] = {
    "FULL_CONSISTENCY": "Full Consistency",
    "PARTIAL_CONSISTENCY": "Partial Consistency",
    "DIVERGENT": "Divergent",
}


def get_dept_display(dept_val: str) -> str:
    """Returns business-friendly English department label without altering data."""
    if not dept_val or str(dept_val).strip() in ("", "nan", "None", "Unknown"):
        return "Unknown Department"
    val = str(dept_val).strip()
    return DEPT_DISPLAY_MAP.get(val, f"Department: {val}")


def get_class_display(class_val: str) -> str:
    """Returns business-friendly English class label or neutral indicator."""
    if not class_val or str(class_val).strip() in ("", "nan", "None", "Unknown"):
        return "General Class"
    val = str(class_val).strip()
    if val in CLASS_DISPLAY_MAP:
        return CLASS_DISPLAY_MAP[val]
    # Check if non-English
    if any(ord(c) > 127 for c in val):
        return f"Original Category: {val}"
    return val.replace("_", " ").title()


def format_priority_display(prio_val: str) -> str:
    """Formats technical priority enum into clean title case."""
    if not prio_val:
        return "Standard Review"
    return PRIORITY_DISPLAY_MAP.get(str(prio_val), str(prio_val).replace("_", " ").title())


def format_trend_display(trend_val: str) -> str:
    """Formats trend enum into clean title case."""
    if not trend_val:
        return "Stable"
    return TREND_DISPLAY_MAP.get(str(trend_val), str(trend_val).capitalize())


def format_conf_display(conf_val: str) -> str:
    """Formats confidence tier enum into clean title case."""
    if not conf_val:
        return "Standard"
    return CONF_DISPLAY_MAP.get(str(conf_val), str(conf_val).capitalize())


def format_consistency_display(cons_val: str) -> str:
    """Formats consistency enum into clean title case."""
    if not cons_val:
        return "Standard Consistency"
    return CONSISTENCY_DISPLAY_MAP.get(str(cons_val), str(cons_val).replace("_", " ").title())


# ---------------------------------------------------------------------------
# Custom CSS Styling (Executive Theme, Dark Slate & Jade Palette)
# ---------------------------------------------------------------------------
CUSTOM_CSS = """
<style>
    /* Main container styling */
    .main .block-container {
        padding-top: 1.25rem;
        padding-bottom: 2rem;
        max-width: 96%;
    }
    
    /* Header hero styling */
    .hero-banner {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d9488 100%);
        padding: 1.5rem 2rem;
        border-radius: 12px;
        color: #ffffff;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .hero-title {
        font-size: 1.85rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        margin-bottom: 0.35rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .hero-badge {
        font-size: 0.85rem;
        background: rgba(255, 255, 255, 0.18);
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 500;
        letter-spacing: 0.02em;
    }
    .hero-subtitle {
        font-size: 0.96rem;
        color: #cbd5e1;
        font-weight: 400;
        line-height: 1.45;
    }
    
    /* Executive Metric Card styling */
    .kpi-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1.1rem 1.25rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        height: 100%;
    }
    .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }
    .kpi-label {
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #64748b;
        margin-bottom: 0.35rem;
    }
    .kpi-value {
        font-size: 1.6rem;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.2;
    }
    .kpi-subtext {
        font-size: 0.78rem;
        color: #0d9488;
        font-weight: 500;
        margin-top: 0.3rem;
    }
    
    /* Badges */
    .badge-increasing {
        background-color: #dcfce7;
        color: #166534;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.82rem;
        display: inline-block;
    }
    .badge-stable {
        background-color: #fef9c3;
        color: #854d0e;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.82rem;
        display: inline-block;
    }
    .badge-decreasing {
        background-color: #fee2e2;
        color: #991b1b;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.82rem;
        display: inline-block;
    }
    .badge-high-conf {
        background-color: #e0f2fe;
        color: #0369a1;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.82rem;
        display: inline-block;
    }
    
    /* Gemini Insight Card */
    .gemini-card {
        background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid #cbd5e1;
        border-left: 5px solid #4f46e5;
        border-radius: 10px;
        padding: 1.35rem;
        margin-top: 0.85rem;
        margin-bottom: 1rem;
    }
    .gemini-header {
        font-size: 1.05rem;
        font-weight: 700;
        color: #3730a3;
        margin-bottom: 0.65rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .gemini-section-title {
        font-size: 0.88rem;
        font-weight: 700;
        color: #1e293b;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-top: 0.85rem;
        margin-bottom: 0.25rem;
    }
    .gemini-text {
        font-size: 0.93rem;
        color: #334155;
        line-height: 1.55;
    }
    
    /* Directive & Rationale Banners */
    .rec-box {
        padding: 1.1rem 1.25rem;
        border-radius: 8px;
        background-color: #f0fdf4;
        border: 1px solid #86efac;
        margin-bottom: 1.25rem;
        line-height: 1.5;
    }
    .directive-box {
        background-color: #f8fafc;
        border-left: 4px solid #0284c7;
        padding: 1.1rem 1.25rem;
        border-radius: 6px;
        margin-bottom: 1.25rem;
        line-height: 1.5;
    }
    
    /* Section dividers and headings */
    .section-title {
        font-size: 1.35rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .section-desc {
        font-size: 0.92rem;
        color: #64748b;
        margin-bottom: 1.2rem;
    }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Data Loading & Caching
# ---------------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def load_kpi_summary_data() -> pd.DataFrame:
    """Loads the complete KPI summary dataset (12,773 observations)."""
    if not KPI_SUMMARY_CSV.exists():
        st.error(f"KPI Summary CSV not found at {KPI_SUMMARY_CSV}. Please run extract_kpis.py first.")
        return pd.DataFrame()
    df = pd.read_csv(KPI_SUMMARY_CSV)
    df["store_id"] = df["store_id"].astype(str)
    df["item_id"] = df["item_id"].astype(str)
    if "dept_name" in df.columns:
        df["dept_name"] = df["dept_name"].fillna("Unknown").astype(str)
    if "class_name" in df.columns:
        df["class_name"] = df["class_name"].fillna("Unknown").astype(str)
    # Add presentation display columns (without overwriting underlying data)
    df["dept_display"] = df["dept_name"].map(get_dept_display)
    df["class_display"] = df["class_name"].map(get_class_display)
    df["priority_display"] = df["business_priority"].map(format_priority_display)
    df["trend_display"] = df["trend"].map(format_trend_display)
    df["conf_display"] = df["confidence_tier"].map(format_conf_display)
    return df


@st.cache_data(show_spinner=False)
def load_macro_kpis() -> Dict[str, Any]:
    """Loads macro overall KPI JSON."""
    if KPI_OVERALL_JSON.exists():
        with open(KPI_OVERALL_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


@st.cache_data(show_spinner=False)
def load_macro_trends() -> Dict[str, Any]:
    """Loads macro demand trend summary JSON."""
    if DEMAND_TREND_JSON.exists():
        with open(DEMAND_TREND_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


@st.cache_data(show_spinner=False)
def load_gemini_examples() -> Dict[str, Any]:
    """Loads pre-generated Gemini business insights JSON and indexes by item_id."""
    if GEMINI_EXAMPLES_JSON.exists():
        with open(GEMINI_EXAMPLES_JSON, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return {str(item.get("item_id")): item for item in data}
            elif isinstance(data, dict):
                return data
    return {}


# ---------------------------------------------------------------------------
# Main Application Header
# ---------------------------------------------------------------------------
st.markdown(
    """
    <div class="hero-banner">
        <div class="hero-title">
            <span>✈️ PRICEPILOT AI</span>
            <span class="hero-badge">Dynamic Pricing & Revenue Intelligence</span>
        </div>
        <div class="hero-subtitle">
            AI-powered pricing, demand forecasting, KPI analytics, and business insights.
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# Load data
with st.spinner("Initializing PricePilot AI Intelligence Engine..."):
    df_kpi = load_kpi_summary_data()
    macro_kpis = load_macro_kpis()
    macro_trends = load_macro_trends()
    gemini_examples_dict = load_gemini_examples()

if df_kpi.empty:
    st.warning("⚠️ No data loaded. Ensure `eda/reports/kpi_summary.csv` exists.")
    st.stop()


# ---------------------------------------------------------------------------
# Sidebar Filters & Control Panel
# ---------------------------------------------------------------------------
st.sidebar.markdown("### 🎛️ Dashboard Filters")

# Filter: Store Selection
all_stores = sorted(df_kpi["store_id"].unique().tolist())
selected_stores = st.sidebar.multiselect("Store", options=all_stores, default=all_stores)

# Filter: Department (Display English mapped names while filtering underlying keys)
dept_options_raw = sorted(df_kpi["dept_name"].unique().tolist())
dept_display_options = ["All Departments"] + [get_dept_display(d) for d in dept_options_raw]
dept_raw_to_display = {d: get_dept_display(d) for d in dept_options_raw}
dept_display_to_raw = {get_dept_display(d): d for d in dept_options_raw}

selected_dept_display = st.sidebar.selectbox("Department", options=dept_display_options)

# Filter: Trend
trend_raw_options = ["All Trends", "INCREASING", "STABLE", "DECREASING"]
trend_display_map = {"All Trends": "All Trends", "INCREASING": "Increasing", "STABLE": "Stable", "DECREASING": "Decreasing"}
trend_display_to_raw = {v: k for k, v in trend_display_map.items()}
selected_trend_display = st.sidebar.selectbox("Demand Trend", options=list(trend_display_to_raw.keys()))

# Filter: Confidence Level
conf_raw_options = ["All Tiers", "HIGH", "MEDIUM", "LOW"]
conf_display_map = {"All Tiers": "All Confidence Levels", "HIGH": "High Confidence", "MEDIUM": "Medium Confidence", "LOW": "Low Confidence"}
conf_display_to_raw = {v: k for k, v in conf_display_map.items()}
selected_conf_display = st.sidebar.selectbox("Confidence Level", options=list(conf_display_to_raw.keys()))

# Filter: Commercial Priority
prio_raw_options = sorted(df_kpi["business_priority"].dropna().unique().tolist())
prio_display_options = ["All Priorities"] + [format_priority_display(p) for p in prio_raw_options]
prio_display_to_raw = {format_priority_display(p): p for p in prio_raw_options}
selected_prio_display = st.sidebar.selectbox("Commercial Priority", options=prio_display_options)

# Apply filters to working DataFrame
filtered_df = df_kpi.copy()
if selected_stores:
    filtered_df = filtered_df[filtered_df["store_id"].isin(selected_stores)]
if selected_dept_display != "All Departments":
    raw_dept = dept_display_to_raw[selected_dept_display]
    filtered_df = filtered_df[filtered_df["dept_name"] == raw_dept]
if selected_trend_display != "All Trends":
    raw_trend = trend_display_to_raw[selected_trend_display]
    filtered_df = filtered_df[filtered_df["trend"] == raw_trend]
if selected_conf_display != "All Confidence Levels":
    raw_conf = conf_display_to_raw[selected_conf_display]
    filtered_df = filtered_df[filtered_df["confidence_tier"] == raw_conf]
if selected_prio_display != "All Priorities":
    raw_prio = prio_display_to_raw[selected_prio_display]
    filtered_df = filtered_df[filtered_df["business_priority"] == raw_prio]

# Product SKU Selector for Focused Analysis
st.sidebar.markdown("---")
st.sidebar.markdown("### 🔍 Product Deep Dive")

available_items = filtered_df["item_id"].unique().tolist()
if not available_items:
    st.sidebar.warning("No items match current filters.")
    selected_item = df_kpi["item_id"].iloc[0]
else:
    # Prefer items with Gemini examples for rich demo if present
    gemini_keys = [k for k in gemini_examples_dict.keys() if k in available_items]
    default_idx = available_items.index(gemini_keys[0]) if gemini_keys else 0
    selected_item = st.sidebar.selectbox(
        "Product SKU",
        options=available_items,
        index=default_idx,
    )

# Selected item data row
item_rows = filtered_df[filtered_df["item_id"] == selected_item]
if item_rows.empty:
    item_rows = df_kpi[df_kpi["item_id"] == selected_item]
item_row = item_rows.iloc[0]

# Display SKU metadata badge in sidebar
st.sidebar.info(
    f"**SKU:** `{item_row['item_id']}`\n\n"
    f"**Store:** Store {item_row['store_id']}\n\n"
    f"**Department:** {get_dept_display(item_row['dept_name'])}\n\n"
    f"**Class:** {get_class_display(item_row['class_name'])}\n\n"
    f"**Priority:** {format_priority_display(item_row['business_priority'])}"
)


# ---------------------------------------------------------------------------
# Business Information Hierarchy — Navigation Tabs
# ---------------------------------------------------------------------------
tab_overview, tab_pricing, tab_forecast, tab_kpi, tab_gemini, tab_sku = st.tabs([
    "📊 Executive Overview",
    "🏷️ Price Optimization",
    "📈 Demand Forecast",
    "💼 Business Performance",
    "🤖 AI Business Insights",
    "🔍 Product Deep Dive",
])


# ===========================================================================
# SECTION 1 — EXECUTIVE OVERVIEW
# ===========================================================================
with tab_overview:
    st.markdown('<div class="section-title">📊 Executive Overview</div>', unsafe_allow_html=True)
    st.markdown(
        f'<div class="section-desc">Portfolio performance metrics aggregated across <b>{len(filtered_df):,}</b> active product-store combinations.</div>',
        unsafe_allow_html=True,
    )

    # Calculate segment or macro metrics
    total_rev = filtered_df["hist_total_revenue"].sum()
    total_units = filtered_df["hist_total_units"].sum()
    avg_price = filtered_df["reference_price"].mean()
    avg_rec_price = filtered_df["recommended_price"].mean()
    avg_price_change = filtered_df["price_change_pct"].mean()
    avg_confidence = filtered_df["confidence_score"].mean()

    # Top KPI Cards Grid (Section 1 Required 5 Metrics)
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Total Revenue</div>
                <div class="kpi-value">${total_rev:,.0f}</div>
                <div class="kpi-subtext">Portfolio realized revenue</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Total Units Sold</div>
                <div class="kpi-value">{total_units:,.0f}</div>
                <div class="kpi-subtext">Historical volume</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col3:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Average Reference Price</div>
                <div class="kpi-value">${avg_price:.2f}</div>
                <div class="kpi-subtext">Baseline price level</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col4:
        delta_color = "#0d9488" if avg_price_change >= 0 else "#dc2626"
        sign = "+" if avg_price_change >= 0 else ""
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Average Recommended Price</div>
                <div class="kpi-value">${avg_rec_price:.2f}</div>
                <div class="kpi-subtext" style="color: {delta_color};">{sign}{avg_price_change:.2f}% avg recommended delta</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col5:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Forecast Confidence</div>
                <div class="kpi-value">{avg_confidence:.1f}/100</div>
                <div class="kpi-subtext">Portfolio reliability score</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # Charts Row 1: Commercial Priority Breakdown & Demand Trend Distribution
    c_left, c_right = st.columns(2)
    with c_left:
        st.markdown("#### Commercial Action Priority Breakdown")
        prio_df = filtered_df["priority_display"].value_counts().reset_index()
        prio_df.columns = ["Commercial Priority", "Product Count"]
        fig_prio = px.bar(
            prio_df,
            x="Product Count",
            y="Commercial Priority",
            orientation="h",
            color="Commercial Priority",
            color_discrete_sequence=px.colors.qualitative.Bold,
            title="Portfolio Distribution by Commercial Priority",
        )
        fig_prio.update_layout(height=340, showlegend=False, margin=dict(l=10, r=10, t=40, b=10))
        st.plotly_chart(fig_prio, use_container_width=True)

    with c_right:
        st.markdown("#### Demand Trend Distribution")
        trend_df = filtered_df["trend_display"].value_counts().reset_index()
        trend_df.columns = ["Demand Trend", "Count"]
        color_map = {"Increasing": "#16a34a", "Stable": "#eab308", "Decreasing": "#dc2626"}
        fig_trend = px.pie(
            trend_df,
            values="Count",
            names="Demand Trend",
            color="Demand Trend",
            color_discrete_map=color_map,
            hole=0.45,
            title="Demand Trend Trajectory Distribution",
        )
        fig_trend.update_layout(height=340, margin=dict(l=10, r=10, t=40, b=10))
        st.plotly_chart(fig_trend, use_container_width=True)

    # Charts Row 2: Department Demand vs Price Landscape
    st.markdown("#### Department Demand vs Price Landscape")
    dept_agg = (
        filtered_df.groupby("dept_display")
        .agg(
            product_count=("item_id", "count"),
            avg_price=("reference_price", "mean"),
            avg_rec_price=("recommended_price", "mean"),
            avg_daily_demand=("hist_avg_daily_demand", "mean"),
            total_forecast_30d=("forecast_30d_total", "sum"),
            avg_confidence=("confidence_score", "mean"),
        )
        .reset_index()
    )
    fig_bubble = px.scatter(
        dept_agg,
        x="avg_price",
        y="avg_daily_demand",
        size="product_count",
        color="avg_confidence",
        hover_name="dept_display",
        labels={
            "avg_price": "Average Reference Price ($)",
            "avg_daily_demand": "Average Daily Demand (Units)",
            "product_count": "Active Products",
            "avg_confidence": "Confidence Score (0-100)",
            "dept_display": "Department",
        },
        color_continuous_scale="Viridis",
        title="Department Landscape: Demand Velocity vs Price Level (Bubble Size = Product Count)",
    )
    fig_bubble.update_layout(height=360, margin=dict(l=10, r=10, t=40, b=10))
    st.plotly_chart(fig_bubble, use_container_width=True)


# ===========================================================================
# SECTION 2 — PRICE OPTIMIZATION
# ===========================================================================
with tab_pricing:
    st.markdown('<div class="section-title">🏷️ Price Optimization</div>', unsafe_allow_html=True)
    st.markdown(
        f'<div class="section-desc">Price recommendation analysis for <b>Product {item_row["item_id"]}</b> | '
        f'Store {item_row["store_id"]} | {get_dept_display(item_row["dept_name"])} | {get_class_display(item_row["class_name"])}</div>',
        unsafe_allow_html=True,
    )

    # Key Price Metrics
    p_col1, p_col2, p_col3, p_col4 = st.columns(4)
    with p_col1:
        st.metric(
            label="Reference Price",
            value=f"${item_row['reference_price']:.2f}",
            help="Pre-transaction baseline pricing benchmark.",
        )
    with p_col2:
        pred_p = item_row["predicted_clearing_price"]
        pred_delta = pred_p - item_row["reference_price"]
        st.metric(
            label="ML Predicted Price",
            value=f"${pred_p:.2f}",
            delta=f"{pred_delta:+.2f} ({pred_delta / max(item_row['reference_price'], 0.01) * 100:+.1f}%)",
            help="Estimated equilibrium transaction clearing price from price regression model.",
        )
    with p_col3:
        rec_p = item_row["recommended_price"]
        rec_delta_pct = item_row["price_change_pct"]
        st.metric(
            label="Recommended Price",
            value=f"${rec_p:.2f}",
            delta=f"{rec_delta_pct:+.1f}% vs Reference",
            delta_color="normal" if rec_delta_pct >= 0 else "inverse",
            help="Candidate price recommendation bounded within safety guardrails (±20%).",
        )
    with p_col4:
        gap = abs(rec_p - pred_p)
        st.metric(
            label="Price Change %",
            value=f"{rec_delta_pct:+.1f}%",
            delta=f"${rec_p - item_row['reference_price']:+.2f} net delta",
            help="Percentage adjustment from baseline reference price.",
        )

    # Explanation Box
    st.markdown(
        f"""
        <div class="rec-box">
            <b>💡 Price Recommendation Rationale:</b><br>
            The machine learning model predicted a market clearing price of <b>${pred_p:.2f}</b> under 
            {'active promotional discount' if item_row.get('hist_promo_rate_pct', 0) > 20 else 'standard catalog pricing'}.
            The price recommendation engine evaluated discrete candidate price points within a ±20% safety boundary 
            and selected <b>${rec_p:.2f}</b> ({rec_delta_pct:+.1f}% adjustment) to maintain commercial elasticity guardrails.<br>
            <span style="font-size: 0.82rem; color: #475569; margin-top: 4px; display: inline-block;">
                *Note: Recommended prices are generated from the existing price recommendation engine.
            </span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Visual Comparison Bar Chart & Gauge
    pc_left, pc_right = st.columns([3, 2])
    with pc_left:
        st.markdown("#### Reference vs Predicted vs Recommended Price")
        price_compare_df = pd.DataFrame({
            "Price Type": [
                "Reference Baseline Price",
                "Historical Average Price",
                "ML Predicted Price",
                "Recommended Price",
            ],
            "Price ($)": [
                item_row["reference_price"],
                item_row["hist_avg_price"],
                item_row["predicted_clearing_price"],
                item_row["recommended_price"],
            ],
            "Category": ["Baseline", "Historical", "Prediction", "Recommendation"],
        })
        fig_pbar = px.bar(
            price_compare_df,
            x="Price Type",
            y="Price ($)",
            color="Category",
            text="Price ($)",
            color_discrete_map={
                "Baseline": "#64748b",
                "Historical": "#94a3b8",
                "Prediction": "#3b82f6",
                "Recommendation": "#10b981",
            },
            title=f"Price Benchmark Comparison for Product {item_row['item_id']}",
        )
        fig_pbar.update_traces(texttemplate="$%{text:.2f}", textposition="outside")
        fig_pbar.update_layout(height=360, showlegend=False, margin=dict(l=10, r=10, t=40, b=10))
        st.plotly_chart(fig_pbar, use_container_width=True)

    with pc_right:
        st.markdown("#### Historical Price Range & Boundaries")
        fig_gauge = go.Figure(
            go.Indicator(
                mode="gauge+number+delta",
                value=item_row["recommended_price"],
                title={"text": "Recommended vs Historical ($)", "font": {"size": 15}},
                delta={"reference": item_row["reference_price"], "increasing": {"color": "#16a34a"}, "decreasing": {"color": "#dc2626"}},
                gauge={
                    "axis": {"range": [max(0, item_row["hist_min_price"] * 0.8), max(item_row["hist_max_price"] * 1.2, item_row["recommended_price"] * 1.2)]},
                    "bar": {"color": "#4f46e5"},
                    "steps": [
                        {"range": [0, item_row["hist_min_price"]], "color": "#f1f5f9"},
                        {"range": [item_row["hist_min_price"], item_row["hist_max_price"]], "color": "#e2e8f0"},
                    ],
                    "threshold": {
                        "line": {"color": "#ef4444", "width": 4},
                        "thickness": 0.75,
                        "value": item_row["predicted_clearing_price"],
                    },
                },
            )
        )
        fig_gauge.update_layout(height=360, margin=dict(l=20, r=20, t=40, b=20))
        st.plotly_chart(fig_gauge, use_container_width=True)

    # Department-Wide Recommended Price Delta Distribution
    st.markdown("#### Department-Wide Price Adjustment Distribution")
    dept_skus = df_kpi[df_kpi["dept_name"] == item_row["dept_name"]].copy()
    fig_hist = px.histogram(
        dept_skus,
        x="price_change_pct",
        nbins=25,
        color="trend_display",
        color_discrete_map={"Increasing": "#16a34a", "Stable": "#eab308", "Decreasing": "#dc2626"},
        title=f"Price Adjustments in '{get_dept_display(item_row['dept_name'])}' (Count: {len(dept_skus):,} Products)",
        labels={"price_change_pct": "Recommended Price Change (%)", "count": "Product Count", "trend_display": "Demand Trend"},
    )
    fig_hist.update_layout(height=300, margin=dict(l=10, r=10, t=40, b=10))
    st.plotly_chart(fig_hist, use_container_width=True)


# ===========================================================================
# SECTION 3 — DEMAND FORECAST
# ===========================================================================
with tab_forecast:
    st.markdown('<div class="section-title">📈 Demand Forecast</div>', unsafe_allow_html=True)
    st.markdown(
        f'<div class="section-desc">Multi-horizon volume forecast and demand velocity for <b>Product {item_row["item_id"]}</b> | '
        f'Store {item_row["store_id"]} | Evaluation Date: <code>{item_row["origin_date"]}</code></div>',
        unsafe_allow_html=True,
    )

    # Multi-Horizon Forecast Cards (Section 5 Required Metrics)
    f_col1, f_col2, f_col3, f_col4 = st.columns(4)
    with f_col1:
        st.metric(
            label="Historical 7-Day Avg Daily",
            value=f"{item_row['hist_avg_daily_demand']:.2f} units",
            help="Average daily historical sales volume pre-test.",
        )
    with f_col2:
        f7_delta = item_row["change_pct_7d"]
        st.metric(
            label="7-Day Demand Forecast",
            value=f"{item_row['forecast_7d_total']:.1f} units",
            delta=f"{f7_delta:+.1f}% vs baseline",
            help="7-day forward cumulative demand forecast.",
        )
    with f_col3:
        st.metric(
            label="14-Day Demand Forecast",
            value=f"{item_row['forecast_14d_total']:.1f} units",
            delta=f"{item_row['forecast_14d_total'] / 14:.2f} units/day",
            help="14-day forward cumulative demand forecast.",
        )
    with f_col4:
        st.metric(
            label="30-Day Demand Forecast",
            value=f"{item_row['forecast_30d_total']:.1f} units",
            delta=f"{item_row['forecast_30d_total'] / 30:.2f} units/day",
            help="30-day forward cumulative demand forecast.",
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # Trend & Confidence Highlights
    t_col1, t_col2, t_col3, t_col4 = st.columns(4)
    trend_val = item_row["trend"]
    with t_col1:
        if trend_val == "INCREASING":
            badge_html = '<span class="badge-increasing">🟢 Increasing</span>'
        elif trend_val == "STABLE":
            badge_html = '<span class="badge-stable">🟡 Stable</span>'
        else:
            badge_html = '<span class="badge-decreasing">🔴 Decreasing</span>'
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Demand Trend</div>
                <div style="margin-top: 6px;">{badge_html}</div>
                <div class="kpi-subtext" style="color:#64748b;">Forward trajectory direction</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with t_col2:
        conf_score = item_row["confidence_score"]
        conf_tier = format_conf_display(item_row["confidence_tier"])
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Forecast Confidence</div>
                <div class="kpi-value">{conf_score:.1f} <span style="font-size: 0.9rem; font-weight: normal; color: #64748b;">/ 100</span></div>
                <div class="kpi-subtext">Tier: <b>{conf_tier}</b></div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with t_col3:
        consistency = format_consistency_display(item_row["direction_consistency"])
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Forecast Agreement</div>
                <div class="kpi-value" style="font-size: 1.2rem;">{consistency}</div>
                <div class="kpi-subtext">7d vs 14d vs 30d alignment</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with t_col4:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Trajectory Delta</div>
                <div class="kpi-value">{item_row['change_pct_7d']:+.1f}%</div>
                <div class="kpi-subtext">7d forecast vs historical baseline</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # Trajectory Line Chart & Pace Benchmark
    fc_left, fc_right = st.columns([3, 2])
    with fc_left:
        st.markdown("#### Cumulative Demand Projection Across Horizons")
        horizons_df = pd.DataFrame({
            "Horizon": ["Origin (Day 0)", "7-Day Forward", "14-Day Forward", "30-Day Forward"],
            "Forecast Cumulative (Units)": [
                0.0,
                item_row["forecast_7d_total"],
                item_row["forecast_14d_total"],
                item_row["forecast_30d_total"],
            ],
            "Baseline Cumulative (Units)": [
                0.0,
                item_row["hist_avg_daily_demand"] * 7,
                item_row["hist_avg_daily_demand"] * 14,
                item_row["hist_avg_daily_demand"] * 30,
            ],
        })
        fig_traj = go.Figure()
        fig_traj.add_trace(
            go.Scatter(
                x=horizons_df["Horizon"],
                y=horizons_df["Forecast Cumulative (Units)"],
                mode="lines+markers+text",
                name="Demand Forecast",
                text=[f"{v:.1f}" for v in horizons_df["Forecast Cumulative (Units)"]],
                textposition="top center",
                line=dict(color="#3b82f6", width=3),
                marker=dict(size=8),
            )
        )
        fig_traj.add_trace(
            go.Scatter(
                x=horizons_df["Horizon"],
                y=horizons_df["Baseline Cumulative (Units)"],
                mode="lines+markers",
                name="Historical Baseline Pace",
                line=dict(color="#94a3b8", width=2, dash="dash"),
                marker=dict(size=6),
            )
        )
        fig_traj.update_layout(
            title="Forecasted Cumulative Demand vs Historical Pace",
            yaxis_title="Total Units",
            height=360,
            margin=dict(l=10, r=10, t=40, b=10),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        )
        st.plotly_chart(fig_traj, use_container_width=True)

    with fc_right:
        st.markdown("#### Daily Demand Velocity Benchmark")
        daily_pace_df = pd.DataFrame({
            "Metric": ["Hist Mean", "Hist Median", "Hist Peak", "7d Forecast Rate", "30d Forecast Rate"],
            "Units / Day": [
                item_row["hist_avg_daily_demand"],
                item_row["hist_median_daily_demand"],
                item_row["hist_max_daily_demand"],
                item_row["forecast_avg_7d"],
                item_row["forecast_30d_total"] / 30.0,
            ],
            "Type": ["Historical", "Historical", "Historical Peak", "Forecast", "Forecast"],
        })
        fig_pace = px.bar(
            daily_pace_df,
            x="Metric",
            y="Units / Day",
            color="Type",
            text="Units / Day",
            color_discrete_map={"Historical": "#94a3b8", "Historical Peak": "#f59e0b", "Forecast": "#3b82f6"},
            title="Daily Demand Velocity Comparison (Units/Day)",
        )
        fig_pace.update_traces(texttemplate="%{text:.2f}", textposition="outside")
        fig_pace.update_layout(height=360, showlegend=False, margin=dict(l=10, r=10, t=40, b=10))
        st.plotly_chart(fig_pace, use_container_width=True)

    # Reliability & Consistency Breakdown Row
    tr_c1, tr_c2 = st.columns(2)
    with tr_c1:
        st.markdown("#### Forecast Confidence Distribution")
        fig_conf_hist = px.histogram(
            filtered_df,
            x="confidence_score",
            nbins=20,
            color="conf_display",
            color_discrete_map={"High": "#0284c7", "Medium": "#f59e0b", "Low": "#ef4444"},
            title="Portfolio Distribution of Reliability Scores (0–100)",
            labels={"confidence_score": "Confidence Score", "count": "Product Count", "conf_display": "Confidence Tier"},
        )
        fig_conf_hist.update_layout(height=330, margin=dict(l=10, r=10, t=40, b=10))
        st.plotly_chart(fig_conf_hist, use_container_width=True)

    with tr_c2:
        st.markdown("#### Horizon Forecast Agreement by Trend")
        filtered_df["cons_display"] = filtered_df["direction_consistency"].map(format_consistency_display)
        cons_trend_df = (
            filtered_df.groupby(["trend_display", "cons_display"])
            .size()
            .reset_index(name="count")
        )
        fig_cons_bar = px.bar(
            cons_trend_df,
            x="trend_display",
            y="count",
            color="cons_display",
            barmode="group",
            color_discrete_map={
                "Full Consistency": "#10b981",
                "Partial Consistency": "#f59e0b",
                "Divergent": "#ef4444",
            },
            title="Horizon Alignment Breakdown by Demand Trend",
            labels={"trend_display": "Demand Trend", "count": "Product Count", "cons_display": "Agreement"},
        )
        fig_cons_bar.update_layout(height=330, margin=dict(l=10, r=10, t=40, b=10))
        st.plotly_chart(fig_cons_bar, use_container_width=True)


# ===========================================================================
# SECTION 4 — BUSINESS PERFORMANCE
# ===========================================================================
with tab_kpi:
    st.markdown('<div class="section-title">💼 Business Performance</div>', unsafe_allow_html=True)
    st.markdown(
        f'<div class="section-desc">Commercial KPIs and strategic domain directives for <b>Product {item_row["item_id"]}</b> | '
        f'Store {item_row["store_id"]} | Priority: <b>{format_priority_display(item_row["business_priority"])}</b></div>',
        unsafe_allow_html=True,
    )

    # Domain Strategy Directive Box
    st.markdown(
        f"""
        <div class="directive-box">
            <b style="color: #0369a1; font-size: 0.95rem;">📋 Strategic Action Directive:</b><br>
            <span style="color: #334155; font-size: 0.92rem;">{item_row['domain_insight']}</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # 4 Organized Business KPI Groups (Section 6 Requirements)
    k_col1, k_col2, k_col3, k_col4 = st.columns(4)
    with k_col1:
        st.markdown("#### 📦 Demand KPIs")
        st.write(f"• **Historical Volume:** `{item_row['hist_total_units']:,.0f}` units")
        st.write(f"• **Avg Daily Demand:** `{item_row['hist_avg_daily_demand']:.2f}` units/day")
        st.write(f"• **Median Daily Demand:** `{item_row['hist_median_daily_demand']:.2f}` units/day")
        st.write(f"• **Peak Daily Demand:** `{item_row['hist_max_daily_demand']:.0f}` units")
        st.write(f"• **Demand Volatility (Std):** `{item_row['hist_std_daily_demand']:.2f}`")

    with k_col2:
        st.markdown("#### 🏷️ Pricing KPIs")
        st.write(f"• **Reference Price:** `${item_row['reference_price']:.2f}`")
        st.write(f"• **Recommended Price:** `${item_row['recommended_price']:.2f}`")
        st.write(f"• **Recommended Delta:** `{item_row['price_change_pct']:+.1f}%`")
        st.write(f"• **Historical Avg Price:** `${item_row['hist_avg_price']:.2f}`")
        st.write(f"• **Historical Range:** `${item_row['hist_min_price']:.2f} – ${item_row['hist_max_price']:.2f}`")

    with k_col3:
        st.markdown("#### 🎁 Promotion KPIs")
        st.write(f"• **Promo Exposure Rate:** `{item_row['hist_promo_rate_pct']:.1f}%`")
        st.write(f"• **Promo Days Count:** `{item_row['hist_promo_days']:.0f}` days")
        st.write(f"• **Avg Discount Depth:** `{item_row['hist_avg_discount_pct']:.1f}%`")
        st.write(f"• **Promo Daily Avg:** `{item_row['hist_promo_demand_avg']:.2f}` units")
        st.write(f"• **Non-Promo Daily Avg:** `{item_row['hist_non_promo_demand_avg']:.2f}` units")
        st.write(f"• **Observed Promo Lift:** `{item_row['hist_promo_demand_lift_pct']:+.1f}%`")

    with k_col4:
        st.markdown("#### 💰 Revenue KPIs")
        st.write(f"• **Realized Revenue:** `${item_row['hist_total_revenue']:,.2f}`")
        st.write(f"• **Avg Daily Revenue:** `${item_row['hist_avg_daily_revenue']:.2f}` / day")
        st.write(f"• **Revenue Per Unit:** `${item_row['hist_revenue_per_unit']:.2f}` / unit")
        st.write(f"• **30-Day Forward Revenue Est.:** `${item_row['forecast_30d_total'] * item_row['recommended_price']:,.2f}`")

    # Commercial Priority Matrix by Department Chart
    st.markdown("---")
    st.markdown("#### Commercial Priority Allocation across Top Departments")
    prio_dept_df = (
        filtered_df.groupby(["dept_display", "priority_display"])
        .size()
        .reset_index(name="count")
    )
    # Take top 10 departments by product volume
    top_depts = filtered_df["dept_display"].value_counts().head(10).index.tolist()
    prio_dept_top = prio_dept_df[prio_dept_df["dept_display"].isin(top_depts)]
    fig_dept_prio = px.bar(
        prio_dept_top,
        x="dept_display",
        y="count",
        color="priority_display",
        title="Top 10 Departments: Commercial Priority Mix",
        labels={"dept_display": "Department", "count": "Product Count", "priority_display": "Commercial Priority"},
    )
    fig_dept_prio.update_layout(height=360, margin=dict(l=10, r=10, t=40, b=10))
    st.plotly_chart(fig_dept_prio, use_container_width=True)


# ===========================================================================
# SECTION 5 — AI BUSINESS INSIGHTS
# ===========================================================================
with tab_gemini:
    st.markdown('<div class="section-title">🤖 AI Business Insights</div>', unsafe_allow_html=True)
    st.markdown(
        f'<div class="section-desc">Synthesizes predictive models, price candidate evaluations, and commercial KPIs '
        f'into executive-ready narratives for <b>Product {item_row["item_id"]}</b>.</div>',
        unsafe_allow_html=True,
    )

    # Check if pre-computed insight exists for selected SKU
    sku_id = item_row["item_id"]
    existing_insight: Optional[Dict[str, Any]] = None
    if str(sku_id) in gemini_examples_dict:
        existing_insight = gemini_examples_dict[str(sku_id)]

    # Live Key Status Check & Fallback Indicator
    # Refresh environment variables in case .env was added/updated
    try:
        from dotenv import load_dotenv
        load_dotenv(ROOT_DIR / ".env", override=False)
        load_dotenv(override=False)
    except Exception:
        pass

    api_key_env = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key_env:
        api_key_env = api_key_env.strip().strip("'\"")
    has_live_key = bool(api_key_env and api_key_env not in ("your_gemini_api_key_here", "None", ""))
    configured_model = (os.getenv("GEMINI_MODEL") or "gemini-2.5-flash").strip().strip("'\"")

    col_stat1, col_stat2 = st.columns([3, 1])
    with col_stat1:
        if has_live_key:
            st.success(f"🟢 **Live Gemini API Connected:** System is configured with live credentials (Model: `{configured_model}`).")
        else:
            st.info("ℹ️ **Offline Insight Mode:** Displaying verified pre-computed AI business synthesis. (Zero live API key required).")

    with col_stat2:
        generate_btn = st.button("⚡ Generate / Refresh", use_container_width=True)

    # Determine insight to display
    display_insight: Optional[Dict[str, Any]] = existing_insight

    if generate_btn:
        if GEMINI_MODULE_AVAILABLE:
            with st.spinner("Generating AI Business Insights..."):
                engine = GeminiBusinessInsightsEngine()
                ctx = build_structured_business_context(item_row)
                res = engine.generate_business_insight(ctx)
                display_insight = res
                st.session_state[f"gemini_insight_{sku_id}"] = res
                if res.get("api_status") == "SUCCESS":
                    st.success("✨ Live Gemini Business Insights generated successfully!")
                elif res.get("api_status") == "API_ERROR":
                    err_msg = res.get("error_message", "Unknown error occurred during API request.")
                    st.warning(f"⚠️ Live Gemini API call returned an error (fallback insights loaded): {err_msg}")
        else:
            st.warning("Insights generation module unavailable in current environment.")

    # Check session state for cached live generation
    if f"gemini_insight_{sku_id}" in st.session_state:
        display_insight = st.session_state[f"gemini_insight_{sku_id}"]

    # Render Insight Sections (Section 7 Requirements)
    if display_insight:
        status_tag = display_insight.get("api_status", "PRECOMPUTED_INSIGHT")
        model_tag = display_insight.get("model_used", configured_model)
        
        # Handle nested or flattened insight dictionary
        insights_data = display_insight.get("insights", display_insight)
        if not isinstance(insights_data, dict):
            insights_data = {}
        
        exec_summary = insights_data.get("executive_summary", display_insight.get("executive_summary", "N/A"))
        price_rationale = insights_data.get("pricing_rationale", display_insight.get("pricing_rationale", "N/A"))
        demand_insights = insights_data.get("demand_and_forecast_insights", display_insight.get("demand_and_forecast_insights", "N/A"))
        promo_analysis = insights_data.get("promotional_and_historical_analysis", display_insight.get("promotional_and_historical_analysis", "N/A"))
        risks = insights_data.get("commercial_risks", display_insight.get("commercial_risks", "N/A"))
        actions = insights_data.get("actionable_recommendations", display_insight.get("actionable_recommendations", []))
        
        card_html = textwrap.dedent(f"""<div class="gemini-card">
<div class="gemini-header">
<span>✨ Executive AI Briefing: Product {html.escape(str(item_row['item_id']))}</span>
<span style="font-size: 0.8rem; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
Source: {html.escape(str(status_tag))} | Model: {html.escape(str(model_tag))}
</span>
</div>
<div class="gemini-section-title">📌 Executive Summary</div>
<div class="gemini-text">{html.escape(str(exec_summary))}</div>
<div class="gemini-section-title">🏷️ Pricing Rationale</div>
<div class="gemini-text">{html.escape(str(price_rationale))}</div>
<div class="gemini-section-title">📈 Demand Interpretation</div>
<div class="gemini-text">{html.escape(str(demand_insights))}</div>
<div class="gemini-section-title">📊 Promotional &amp; Historical Profile</div>
<div class="gemini-text">{html.escape(str(promo_analysis))}</div>
<div class="gemini-section-title">⚠️ Business Risks</div>
<div class="gemini-text" style="color: #991b1b;">{html.escape(str(risks))}</div>
</div>""").strip()
        
        st.markdown(card_html, unsafe_allow_html=True)

        # Recommended Actions Directives List
        st.markdown("#### 🎯 Recommended Actions")
        if isinstance(actions, list):
            for i, act in enumerate(actions, 1):
                st.markdown(f"**{i}.** {act}")
        else:
            st.write(actions)

    else:
        # Fallback synthesis based on domain rules if SKU was not in pre-computed examples
        fallback_card_html = textwrap.dedent(f"""<div class="gemini-card">
<div class="gemini-header">
<span>✨ Strategic Business Briefing: Product {html.escape(str(item_row['item_id']))}</span>
<span style="font-size: 0.8rem; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
Source: DOMAIN_SYNTHESIS
</span>
</div>
<div class="gemini-section-title">📌 Executive Summary</div>
<div class="gemini-text">
Product <b>{html.escape(str(item_row['item_id']))}</b> in <b>{html.escape(str(get_dept_display(item_row['dept_name'])))}</b> exhibits an <b>{html.escape(str(format_trend_display(item_row['trend'])))}</b> demand trajectory 
(7d forecast: <b>{item_row['forecast_7d_total']:.1f}</b> units, 30d forecast: <b>{item_row['forecast_30d_total']:.1f}</b> units) with <b>{html.escape(str(format_conf_display(item_row['confidence_tier'])))}</b> confidence ({item_row['confidence_score']:.1f}/100).
Recommendation is to adjust price by <b>{item_row['price_change_pct']:+.1f}%</b> to <b>${item_row['recommended_price']:.2f}</b> under priority <b>[{html.escape(str(format_priority_display(item_row['business_priority'])))}]</b>.
</div>
<div class="gemini-section-title">🏷️ Pricing &amp; Demand Directives</div>
<div class="gemini-text">{html.escape(str(item_row['domain_insight']))}</div>
</div>""").strip()
        
        st.markdown(fallback_card_html, unsafe_allow_html=True)
        st.info("💡 Click **Generate / Refresh** above with a configured GEMINI_API_KEY to produce live synthesis for this specific product.")


# ===========================================================================
# SECTION 6 — PRODUCT DEEP DIVE
# ===========================================================================
with tab_sku:
    st.markdown('<div class="section-title">🔍 Product Deep Dive</div>', unsafe_allow_html=True)
    st.markdown(
        f'<div class="section-desc">Consolidated single-product view uniting price recommendations, demand forecasts, '
        f'commercial KPIs, and strategic directives for <b>Product {item_row["item_id"]}</b>.</div>',
        unsafe_allow_html=True,
    )

    # Product Metadata Banner
    sku_col1, sku_col2, sku_col3, sku_col4 = st.columns(4)
    with sku_col1:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Product Identifier</div>
                <div class="kpi-value" style="font-size: 1.3rem;">SKU {item_row['item_id']}</div>
                <div class="kpi-subtext">Store {item_row['store_id']}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with sku_col2:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Category Hierarchy</div>
                <div style="font-weight: 700; color: #0f172a; font-size: 1.05rem; margin-top: 4px;">{get_dept_display(item_row['dept_name'])}</div>
                <div class="kpi-subtext" style="color: #64748b;">Class: {get_class_display(item_row['class_name'])}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with sku_col3:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Pricing Action</div>
                <div class="kpi-value">${item_row['recommended_price']:.2f}</div>
                <div class="kpi-subtext">{item_row['price_change_pct']:+.1f}% vs baseline (${item_row['reference_price']:.2f})</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with sku_col4:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Demand Outlook</div>
                <div class="kpi-value">{item_row['forecast_30d_total']:.1f} <span style="font-size: 0.85rem; font-weight: normal;">units (30d)</span></div>
                <div class="kpi-subtext">Trend: <b>{format_trend_display(item_row['trend'])}</b> | Conf: <b>{item_row['confidence_score']:.0f}/100</b></div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # Detailed SKU Grid
    sku_c1, sku_c2 = st.columns(2)
    with sku_c1:
        st.markdown("#### 🏷️ Price Intelligence Breakdown")
        sku_price_df = pd.DataFrame({
            "Metric": ["Reference Baseline", "Historical Avg", "ML Predicted Clearing", "Recommended Target", "Historical Min", "Historical Max"],
            "Value ($)": [
                item_row["reference_price"],
                item_row["hist_avg_price"],
                item_row["predicted_clearing_price"],
                item_row["recommended_price"],
                item_row["hist_min_price"],
                item_row["hist_max_price"],
            ]
        })
        st.dataframe(sku_price_df.style.format({"Value ($)": "${:.2f}"}), use_container_width=True, hide_index=True)

    with sku_c2:
        st.markdown("#### 📈 Multi-Horizon Forecast Breakdown")
        sku_fc_df = pd.DataFrame({
            "Horizon": ["Historical Daily Avg", "7-Day Forward Total", "14-Day Forward Total", "30-Day Forward Total", "Forecast Daily Rate (7d)"],
            "Units": [
                f"{item_row['hist_avg_daily_demand']:.2f} units/day",
                f"{item_row['forecast_7d_total']:.1f} units",
                f"{item_row['forecast_14d_total']:.1f} units",
                f"{item_row['forecast_30d_total']:.1f} units",
                f"{item_row['forecast_avg_7d']:.2f} units/day",
            ]
        })
        st.dataframe(sku_fc_df, use_container_width=True, hide_index=True)


# ---------------------------------------------------------------------------
# Footer & Integrity Disclaimers
# ---------------------------------------------------------------------------
st.markdown("---")
st.markdown(
    """
    <div style="text-align: center; color: #64748b; font-size: 0.82rem; padding: 1rem;">
        <b>PricePilot AI</b> • Dynamic Pricing & Revenue Intelligence • 
        <i>Zero Data Mutation Guarantee: Predictions, recommendations, forecasts, and KPIs are consumed read-only.</i>
    </div>
    """,
    unsafe_allow_html=True,
)
