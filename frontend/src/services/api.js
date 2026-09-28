import axios from "axios";

const API_BASE = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pricepilot_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const FALLBACK_PRODUCTS = [
  {
    product_id: "bed1",
    category: "bed_bath_table",
    weight_g: 1050,
    unit_price: 39.24,
    qty_sold: 8,
    total_price: 313.92,
    product_score: 4.0,
    comp_avg_price: 50.83,
    recommended_price: 42.0,
    change_pct: 7.0,
    demand_trend: "Increasing",
    confidence: 88,
  },
  {
    product_id: "health1",
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
    product_id: "computers1",
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
    product_id: "watches1",
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
    product_id: "garden1",
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
    product_id: "cool1",
    category: "cool_stuff",
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
  total_products: 52,
  total_metrics_records: 676,
  avg_unit_price: 88.54,
  total_revenue: 1245890.0,
  opportunities_count: 18,
  avg_margin_uplift: 4.8,
};

export const loginUser = async (email, password) => {
  try {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.access_token) {
      localStorage.setItem("pricepilot_token", res.data.access_token);
      localStorage.setItem("pricepilot_user", JSON.stringify(res.data.user));
      return { success: true, data: res.data };
    }
    throw new Error("No token returned from server");
  } catch (err) {
    const detail = err.response?.data?.detail || err.message || "Login failed";
    return { success: false, error: detail };
  }
};

export const registerUser = async (email, password, fullName, role = "business_user") => {
  try {
    const res = await api.post("/auth/register", {
      email,
      password,
      full_name: fullName,
      role,
    });
    if (res.data?.access_token) {
      localStorage.setItem("pricepilot_token", res.data.access_token);
      localStorage.setItem("pricepilot_user", JSON.stringify(res.data.user));
      return { success: true, data: res.data };
    }
    throw new Error("No token returned from server");
  } catch (err) {
    const detail = err.response?.data?.detail || err.message || "Registration failed";
    return { success: false, error: detail };
  }
};

export const fetchMe = async () => {
  try {
    const token = localStorage.getItem("pricepilot_token");
    if (!token) return { user: null };
    const res = await api.get("/auth/me");
    if (res.data) {
      localStorage.setItem("pricepilot_user", JSON.stringify(res.data));
      return { user: res.data };
    }
    return { user: null };
  } catch (err) {
    localStorage.removeItem("pricepilot_token");
    localStorage.removeItem("pricepilot_user");
    return { user: null };
  }
};

export const logoutUser = () => {
  localStorage.removeItem("pricepilot_token");
  localStorage.removeItem("pricepilot_user");
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

export const applyPriceUpdate = async (productId, newPrice, notes = "") => {
  try {
    const res = await api.post(`/products/${productId}/apply-price`, {
      new_price: newPrice,
      notes,
    });
    return { success: true, data: res.data };
  } catch (err) {
    const detail = err.response?.data?.detail || err.message || "Failed to apply price";
    return { success: false, error: detail };
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
    const basePrice = (
      FALLBACK_PRODUCTS.find((p) => p.product_id === productId) ||
      FALLBACK_PRODUCTS[0]
    ).unit_price;
    const history = [
      { month: "Jan", price: basePrice * 0.95, comp1: basePrice * 0.98, comp2: basePrice * 0.94, comp3: basePrice * 1.02, demand: 110 },
      { month: "Feb", price: basePrice * 0.96, comp1: basePrice * 0.97, comp2: basePrice * 0.95, comp3: basePrice * 1.01, demand: 118 },
      { month: "Mar", price: basePrice * 0.98, comp1: basePrice * 1.0, comp2: basePrice * 0.99, comp3: basePrice * 1.04, demand: 125 },
      { month: "Apr", price: basePrice * 1.0, comp1: basePrice * 1.02, comp2: basePrice * 1.01, comp3: basePrice * 1.06, demand: 135 },
      { month: "May", price: basePrice * 1.02, comp1: basePrice * 1.05, comp2: basePrice * 1.03, comp3: basePrice * 1.08, demand: 142 },
      { month: "Jun", price: basePrice, comp1: basePrice * 1.06, comp2: basePrice * 1.04, comp3: basePrice * 1.09, demand: 150 },
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

export const fetchDemandForecast = async (productId, customPrice = null) => {
  try {
    const url = customPrice !== null
      ? `/forecast/demand/${productId}?price=${customPrice}`
      : `/forecast/demand/${productId}`;
    const res = await api.get(url);
    if (res.data && res.data.horizons) {
      return { data: res.data, isLive: true };
    }
    throw new Error("Invalid forecast payload");
  } catch (err) {
    const item = FALLBACK_PRODUCTS.find((p) => p.product_id === productId) || FALLBACK_PRODUCTS[0];
    const basePrice = customPrice !== null ? Number(customPrice) : item.unit_price;
    const baseQty = item.qty_sold || 140;

    const q30d = Math.round(baseQty * (item.demand_trend === "Increasing" ? 1.08 : 0.94));
    const q7d = Math.round(q30d * (7 / 30));
    const q14d = Math.round(q30d * (14 / 30));
    const q3m = Math.round(q30d * 3 * 1.04);
    const q6m = Math.round(q30d * 6 * 1.07);
    const q12m = Math.round(q30d * 12 * 1.12);

    const simPoints = [];
    let bestRev = 0;
    let optPrice = basePrice;
    [-0.3, -0.2, -0.1, -0.05, 0, 0.05, 0.1, 0.2, 0.3].forEach((pct) => {
      const p = Number((basePrice * (1 + pct)).toFixed(2));
      const q = Math.round(q30d * (1 - pct * 1.25));
      const rev = Number((p * q).toFixed(2));
      simPoints.push({
        price: p,
        demand: q,
        expected_revenue: rev,
        price_multiplier: 1 + pct,
        is_current: pct === 0,
      });
      if (rev > bestRev) {
        bestRev = rev;
        optPrice = p;
      }
    });

    return {
      data: {
        product_id: item.product_id,
        category: item.category,
        current_price: basePrice,
        competitor_avg_price: item.comp_avg_price,
        historical_avg_qty: baseQty,
        recent_3m_avg_qty: Math.round(baseQty * 0.98),
        growth_rate_pct: item.demand_trend === "Increasing" ? 8.4 : -4.2,
        demand_trend: item.demand_trend,
        trend_sentiment: item.demand_trend === "Increasing" ? "positive" : "negative",
        confidence_pct: item.confidence,
        horizons: {
          "7_days": { qty: q7d, revenue: Number((q7d * basePrice).toFixed(2)) },
          "14_days": { qty: q14d, revenue: Number((q14d * basePrice).toFixed(2)) },
          "30_days": { qty: q30d, revenue: Number((q30d * basePrice).toFixed(2)) },
          "3_months": { qty: q3m, revenue: Number((q3m * basePrice).toFixed(2)) },
          "6_months": { qty: q6m, revenue: Number((q6m * basePrice).toFixed(2)) },
          "12_months": { qty: q12m, revenue: Number((q12m * basePrice).toFixed(2)) },
        },
        confidence_interval: {
          lower: Math.round(q30d * 0.85),
          forecast: q30d,
          upper: Math.round(q30d * 1.15),
        },
        elasticity: {
          coefficient: -1.25,
          type: "Elastic",
          description: "High demand sensitivity: Price changes induce noticeable volume shifts.",
          optimal_revenue_price: optPrice,
          potential_revenue_gain_pct: 6.8,
        },
        revenue_simulation_curve: simPoints,
        chart_series: [
          { period: "Month -4", actual_demand: Math.round(baseQty * 0.9), forecast_demand: null, ci_upper: null, ci_lower: null, unit_price: basePrice },
          { period: "Month -3", actual_demand: Math.round(baseQty * 0.94), forecast_demand: null, ci_upper: null, ci_lower: null, unit_price: basePrice },
          { period: "Month -2", actual_demand: Math.round(baseQty * 0.98), forecast_demand: null, ci_upper: null, ci_lower: null, unit_price: basePrice },
          { period: "Month -1", actual_demand: baseQty, forecast_demand: null, ci_upper: null, ci_lower: null, unit_price: basePrice },
          { period: "Current", actual_demand: baseQty, forecast_demand: baseQty, ci_upper: baseQty, ci_lower: baseQty, unit_price: basePrice },
          { period: "Next 7 Days", actual_demand: null, forecast_demand: q7d, ci_upper: Math.round(q7d * 1.15), ci_lower: Math.round(q7d * 0.85), unit_price: basePrice },
          { period: "Next 14 Days", actual_demand: null, forecast_demand: q14d, ci_upper: Math.round(q14d * 1.15), ci_lower: Math.round(q14d * 0.85), unit_price: basePrice },
          { period: "Next 30 Days", actual_demand: null, forecast_demand: q30d, ci_upper: Math.round(q30d * 1.15), ci_lower: Math.round(q30d * 0.85), unit_price: basePrice },
        ],
        model_champion: "RandomForest",
      },
      isLive: false,
    };
  }
};

export const fetchCompetitorInsights = async () => {
  try {
    const res = await api.get("/analytics/competitors");
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, isLive: true };
    }
    throw new Error("No live competitor data");
  } catch (err) {
    const fallbackInsights = FALLBACK_PRODUCTS.map((p) => {
      const ourPrice = p.unit_price;
      const compAvg = p.comp_avg_price;
      const priceIndex = Number(((ourPrice / compAvg) * 100).toFixed(1));
      const stance = priceIndex > 105 ? "Premium to Market" : priceIndex < 95 ? "Value / Undercutting" : "Competitive Parity";
      const stanceColor = priceIndex > 105 ? "rose" : priceIndex < 95 ? "emerald" : "indigo";

      return {
        product_id: p.product_id,
        category: p.category,
        our_price: ourPrice,
        our_score: p.product_score,
        our_freight: 12.5,
        comp_avg_price: compAvg,
        comp_min_price: Number((compAvg * 0.92).toFixed(2)),
        comp_max_price: Number((compAvg * 1.10).toFixed(2)),
        comp_avg_score: 4.2,
        comp_avg_freight: 14.0,
        price_index: priceIndex,
        market_stance: stance,
        stance_color: stanceColor,
        competitors: {
          comp_1: { price: Number((compAvg * 0.96).toFixed(2)), score: 4.1, freight: 12.0 },
          comp_2: { price: compAvg, score: 4.3, freight: 14.5 },
          comp_3: { price: Number((compAvg * 1.05).toFixed(2)), score: 4.2, freight: 15.0 },
        },
        opportunity: {
          type: "opportunity",
          tag: "Margin Opportunity",
          badge: "Margin Uplift Opportunity",
          headline: `Rating advantage (${p.product_score}★)`,
          action: "Increase price by 5% – 8%",
          explanation: "Premium perception allows capturing higher margin without demand degradation."
        },
        as_of: new Date().toISOString().split("T")[0],
      };
    });
    return { data: fallbackInsights, isLive: false };
  }
};

export const fetchCompetitorDetail = async (productId) => {
  try {
    const res = await api.get(`/analytics/competitors/${productId}`);
    if (res.data && res.data.competitors) {
      return { data: res.data, isLive: true };
    }
    throw new Error("No live competitor detail");
  } catch (err) {
    const p = FALLBACK_PRODUCTS.find((item) => item.product_id === productId) || FALLBACK_PRODUCTS[0];
    const ourPrice = p.unit_price;
    const compAvg = p.comp_avg_price;
    const priceIndex = Number(((ourPrice / compAvg) * 100).toFixed(1));

    return {
      data: {
        product_id: p.product_id,
        category: p.category,
        our_price: ourPrice,
        our_score: p.product_score,
        our_freight: 12.5,
        comp_avg_price: compAvg,
        comp_min_price: Number((compAvg * 0.92).toFixed(2)),
        comp_max_price: Number((compAvg * 1.08).toFixed(2)),
        comp_avg_score: 4.2,
        comp_avg_freight: 14.0,
        price_index: priceIndex,
        market_stance: priceIndex > 105 ? "Premium to Market" : priceIndex < 95 ? "Value / Undercutting" : "Competitive Parity",
        stance_description: "Positioned relative to local 3-rival category cluster.",
        competitors: [
          {
            competitor_id: "Competitor 1",
            competitor_num: 1,
            price: Number((compAvg * 0.95).toFixed(2)),
            score: 4.1,
            freight: 11.5,
            price_difference: Number((compAvg * 0.95 - ourPrice).toFixed(2)),
            price_diff_pct: Number((((compAvg * 0.95 - ourPrice) / ourPrice) * 100).toFixed(1)),
            is_cheaper_than_us: compAvg * 0.95 < ourPrice,
            score_advantage: Number((p.product_score - 4.1).toFixed(1)),
          },
          {
            competitor_id: "Competitor 2",
            competitor_num: 2,
            price: compAvg,
            score: 4.3,
            freight: 14.0,
            price_difference: Number((compAvg - ourPrice).toFixed(2)),
            price_diff_pct: Number((((compAvg - ourPrice) / ourPrice) * 100).toFixed(1)),
            is_cheaper_than_us: compAvg < ourPrice,
            score_advantage: Number((p.product_score - 4.3).toFixed(1)),
          },
          {
            competitor_id: "Competitor 3",
            competitor_num: 3,
            price: Number((compAvg * 1.06).toFixed(2)),
            score: 4.2,
            freight: 15.5,
            price_difference: Number((compAvg * 1.06 - ourPrice).toFixed(2)),
            price_diff_pct: Number((((compAvg * 1.06 - ourPrice) / ourPrice) * 100).toFixed(1)),
            is_cheaper_than_us: compAvg * 1.06 < ourPrice,
            score_advantage: Number((p.product_score - 4.2).toFixed(1)),
          },
        ],
        opportunity: {
          type: "opportunity",
          tag: "Underpriced Premium",
          badge: "Margin Uplift Opportunity",
          headline: `Rating advantage (${p.product_score}★ vs 4.2★)`,
          action: "Increase price by 5% – 8%",
          explanation: "Premium perception allows capturing higher margin without demand degradation."
        },
        historical_trend: [
          { period: "Jan", our_price: ourPrice * 0.96, comp_1: compAvg * 0.93, comp_2: compAvg * 0.98, comp_3: compAvg * 1.02, comp_avg: compAvg * 0.97, demand: 110 },
          { period: "Feb", our_price: ourPrice * 0.97, comp_1: compAvg * 0.94, comp_2: compAvg * 0.99, comp_3: compAvg * 1.03, comp_avg: compAvg * 0.98, demand: 120 },
          { period: "Mar", our_price: ourPrice * 0.99, comp_1: compAvg * 0.95, comp_2: compAvg * 1.00, comp_3: compAvg * 1.04, comp_avg: compAvg * 0.99, demand: 130 },
          { period: "Apr", our_price: ourPrice, comp_1: compAvg * 0.96, comp_2: compAvg * 1.01, comp_3: compAvg * 1.05, comp_avg: compAvg, demand: 140 },
          { period: "May", our_price: ourPrice * 1.02, comp_1: compAvg * 0.97, comp_2: compAvg * 1.02, comp_3: compAvg * 1.06, comp_avg: compAvg * 1.01, demand: 145 },
          { period: "Jun", our_price: ourPrice, comp_1: compAvg * 0.95, comp_2: compAvg, comp_3: compAvg * 1.06, comp_avg: compAvg, demand: 148 },
        ],
        as_of: new Date().toISOString().split("T")[0],
      },
      isLive: false,
    };
  }
};
