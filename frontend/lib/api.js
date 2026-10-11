const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function authHeaders() {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("pricepilot_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function redirectToLoginIfNeeded(status) {
  if (status !== 401 || typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path === "/login" || path === "/register") return;
  window.localStorage.removeItem("pricepilot_token");
  window.location.href = "/login";
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`API ${res.status}: ${path}`);
    err.status = res.status;
    err.body = body;
    redirectToLoginIfNeeded(res.status);
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

// Downloads a generated report (CSV/HTML) with the JWT and saves it in the browser
async function downloadReport(type, format) {
  const res = await fetch(
    `${BASE_URL}/api/v1/reports/download?type=${type}&format=${format}`,
    { headers: authHeaders() }
  );
  if (!res.ok) {
    const msg =
      res.status === 401
        ? "Session expired. Please log in again."
        : `Report generation failed (HTTP ${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = /filename="?([^";]+)"?/.exec(disposition);
  const filename = match ? match[1] : `pricepilot_${type}.${format}`;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  // --- Auth -------------------------------------------------------------
  // POST /api/auth/login -- OAuth2PasswordRequestForm, so form-encoded with
  // "username" (= email) and "password". Returns { access_token, ... }.
  login: (email, password) => {
    const body = new URLSearchParams({ username: email, password }).toString();
    return request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  },
  register: ({ email, password, full_name, role }) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name, role }),
    }),
  me: () => request("/api/auth/me"),

  // --- Products / catalog -------------------------------------------------
  // GET /api/forecasting/products -> [{ product_id: int, name: str }]
  forecastableProducts: () => request("/api/forecasting/products"),

  // --- Price prediction -----------------------------------------------------
  // POST /api/pricing/predict
  // body: { category, freight_price, lag_price, qty, customers, product_score,
  //         comp_1, comp_2, comp_3, month } -> { predicted_price, model_used }
  predictPrice: (payload) =>
    request("/api/pricing/predict", { method: "POST", body: JSON.stringify(payload) }),

  // --- Demand forecasting ---------------------------------------------------
  // GET /api/forecasting/{product_id}
  // -> { product_id, product_name, forecasts: [{ horizon, predicted_units, trend, confidence_score, model_used, generated_at }] }
  productForecast: (productId) => request(`/api/forecasting/${parseInt(productId, 10)}`),

  // --- Competitor / revenue ---------------------------------------------------
  competitorOpportunities: () => request("/api/competitor/opportunities"),
  competitorComparison: (productId) => request(`/api/competitor/${parseInt(productId, 10)}`),

  revenueElasticity: (productId) => request(`/api/revenue/elasticity/${parseInt(productId, 10)}`),
  revenueSimulate: (productId, priceChangePct) =>
    request(`/api/revenue/simulate/${parseInt(productId, 10)}?price_change_pct=${parseFloat(priceChangePct)}`),
  revenueOptimize: (productId) => request(`/api/revenue/optimize/${parseInt(productId, 10)}`),

  // --- AI pricing insights ----------------------------------------------------
  // GET /api/insights/{product_id} -> { product_id, product_name, narrative, based_on }
  productInsight: (productId) => request(`/api/insights/${parseInt(productId, 10)}`),

  // --- AI chatbot ---------------------------------------------------------------
  // POST /api/v1/ai/ask -> { response, model }   (auth required)
  aiAsk: ({ message, history = [], product_id = null }) =>
    request("/api/v1/ai/ask", {
      method: "POST",
      body: JSON.stringify({ message, history, product_id }),
    }),

  // --- BI reports ---------------------------------------------------------------
  // GET /api/v1/reports/download?type=...&format=csv|html  (auth required)
  downloadReport,

  // --- Dashboard KPIs -------------------------------------------------------------
  // GET /api/dashboard/overview (auth required) -> DashboardOverview
  dashboardOverview: () => request("/api/dashboard/overview"),
};

export { BASE_URL };