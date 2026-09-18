import axios from "axios";

const API_BASE = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 4000,
});

// Sample fallback dataset matching retail_price.csv schema
export const FALLBACK_PRODUCTS = [
  {
    product_id: "bed_bath_table_1",
    category: "bed_bath_table",
    weight_g: 1050,
    unit_price: 39.99,
    qty_sold: 142,
    total_price: 5678.58,
    product_score: 4.3,
    comp_avg_price: 43.5,
    recommended_price: 42.0,
    change_pct: 5.0,
    demand_trend: "Increasing",
    confidence: 89,
  },
  {
    product_id: "health_beauty_1",
    category: "health_beauty",
    weight_g: 450,
    unit_price: 84.9,
    qty_sold: 95,
    total_price: 8065.5,
    product_score: 4.7,
    comp_avg_price: 79.99,
    recommended_price: 82.5,
    change_pct: -2.8,
    demand_trend: "Stable",
    confidence: 94,
  },
  {
    product_id: "computers_accessories_1",
    category: "computers_accessories",
    weight_g: 820,
    unit_price: 119.0,
    qty_sold: 210,
    total_price: 24990.0,
    product_score: 4.1,
    comp_avg_price: 135.0,
    recommended_price: 128.5,
    change_pct: 8.0,
    demand_trend: "Increasing",
    confidence: 86,
  },
  {
    product_id: "watches_gifts_1",
    category: "watches_gifts",
    weight_g: 320,
    unit_price: 189.9,
    qty_sold: 68,
    total_price: 12913.2,
    product_score: 4.8,
    comp_avg_price: 199.9,
    recommended_price: 195.0,
    change_pct: 2.7,
    demand_trend: "Increasing",
    confidence: 91,
  },
  {
    product_id: "garden_tools_1",
    category: "garden_tools",
    weight_g: 2200,
    unit_price: 49.5,
    qty_sold: 120,
    total_price: 5940.0,
    product_score: 3.9,
    comp_avg_price: 45.0,
    recommended_price: 46.5,
    change_pct: -6.1,
    demand_trend: "Decreasing",
    confidence: 82,
  },
  {
    product_id: "consoles_games_1",
    category: "consoles_games",
    weight_g: 150,
    unit_price: 59.99,
    qty_sold: 340,
    total_price: 20396.6,
    product_score: 4.6,
    comp_avg_price: 64.99,
    recommended_price: 62.5,
    change_pct: 4.2,
    demand_trend: "Increasing",
    confidence: 93,
  },
];

export const FALLBACK_SUMMARY = {
  total_products: 676,
  total_metrics_records: 676,
  avg_unit_price: 88.54,
  total_revenue: 1245890.0,
  opportunities_count: 18,
  avg_margin_uplift: 4.8,
};

export const fetchHealth = async () => {
  try {
    const res = await api.get("/health");
    return { isLive: res.data.status === "ok", details: res.data };
  } catch (err) {
    return { isLive: false, error: err.message };
  }
};

export const fetchProducts = async () => {
  try {
    const res = await api.get("/products");
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, isLive: true };
    }
    return { data: FALLBACK_PRODUCTS, isLive: false };
  } catch (err) {
    return { data: FALLBACK_PRODUCTS, isLive: false };
  }
};

export const fetchProductRecommendation = async (productId) => {
  try {
    const res = await api.get(`/products/${productId}/price-recommendation`);
    return { data: res.data, isLive: true };
  } catch (err) {
    // Generate intelligent dynamic recommendation from fallback
    const item =
      FALLBACK_PRODUCTS.find((p) => p.product_id === productId) ||
      FALLBACK_PRODUCTS[0];
    const diff = item.recommended_price - item.unit_price;
    return {
      data: {
        product_id: item.product_id,
        category: item.category,
        current_price: item.unit_price,
        recommended_price: item.recommended_price,
        change: Number(diff.toFixed(2)),
        change_pct: Number(((diff / item.unit_price) * 100).toFixed(1)),
        competitor_avg_price: item.comp_avg_price,
        as_of: new Date().toISOString().split("T")[0],
        confidence: item.confidence,
        demand_trend: item.demand_trend,
      },
      isLive: false,
    };
  }
};

export const fetchProductHistory = async (productId) => {
  try {
    const res = await api.get(`/products/${productId}/history`);
    if (res.data && res.data.metrics && res.data.metrics.length > 0) {
      return { data: res.data, isLive: true };
    }
    throw new Error("No live history");
  } catch (err) {
    // Simulated 6-month historical & competitor trend
    const basePrice = (
      FALLBACK_PRODUCTS.find((p) => p.product_id === productId) ||
      FALLBACK_PRODUCTS[0]
    ).unit_price;
    const history = [
      {
        month: "Jan",
        price: basePrice * 0.95,
        comp1: basePrice * 0.98,
        comp2: basePrice * 0.94,
        comp3: basePrice * 1.02,
        demand: 110,
      },
      {
        month: "Feb",
        price: basePrice * 0.96,
        comp1: basePrice * 0.97,
        comp2: basePrice * 0.95,
        comp3: basePrice * 1.01,
        demand: 118,
      },
      {
        month: "Mar",
        price: basePrice * 0.98,
        comp1: basePrice * 1.0,
        comp2: basePrice * 0.99,
        comp3: basePrice * 1.04,
        demand: 125,
      },
      {
        month: "Apr",
        price: basePrice * 1.0,
        comp1: basePrice * 1.02,
        comp2: basePrice * 1.01,
        comp3: basePrice * 1.06,
        demand: 135,
      },
      {
        month: "May",
        price: basePrice * 1.02,
        comp1: basePrice * 1.05,
        comp2: basePrice * 1.03,
        comp3: basePrice * 1.08,
        demand: 142,
      },
      {
        month: "Jun",
        price: basePrice,
        comp1: basePrice * 1.06,
        comp2: basePrice * 1.04,
        comp3: basePrice * 1.09,
        demand: 150,
      },
    ];
    return { data: { product_id: productId, trend: history }, isLive: false };
  }
};

export const fetchSummary = async () => {
  try {
    const res = await api.get("/analytics/summary");
    if (res.data && res.data.total_products > 0) {
      return { data: res.data, isLive: true };
    }
    return { data: FALLBACK_SUMMARY, isLive: false };
  } catch (err) {
    return { data: FALLBACK_SUMMARY, isLive: false };
  }
};
