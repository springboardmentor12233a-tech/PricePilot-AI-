import axios, { AxiosInstance } from "axios";

// Create base Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: "", // Next.js rewrites forward /api to http://localhost:8000/api
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Interceptor to inject JWT Bearer token on every outgoing request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      sessionStorage.getItem("pricepilot_token") || localStorage.getItem("pricepilot_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor to handle authentication expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        sessionStorage.removeItem("pricepilot_token");
        sessionStorage.removeItem("pricepilot_user");
        localStorage.removeItem("pricepilot_token");
        localStorage.removeItem("pricepilot_user");
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(error);
  }
);

// --- API Service Methods ---

export const api = {
  // Auth & RBAC
  auth: {
    signup: async (data: { name: string; email: string; password: string; role?: string }) => {
      const res = await apiClient.post("/api/auth/signup", data);
      return res.data;
    },
    login: async (email: string, password: string) => {
      const res = await apiClient.post("/api/auth/login", { email, password });
      return res.data;
    },
    me: async () => {
      const res = await apiClient.get("/api/auth/me");
      return res.data;
    },
    listUsers: async () => {
      const res = await apiClient.get("/api/users");
      return res.data;
    },
    registerUser: async (data: { email: string; password: string; full_name?: string; role: string }) => {
      const res = await apiClient.post("/api/auth/register", data);
      return res.data;
    },
    updateRole: async (userId: number, role: string) => {
      const res = await apiClient.patch(`/api/users/${userId}/role`, { role });
      return res.data;
    },
    updateStatus: async (userId: number, isActive: boolean) => {
      const res = await apiClient.patch(`/api/users/${userId}/status`, { is_active: isActive });
      return res.data;
    },
    deleteUser: async (userId: number) => {
      const res = await apiClient.delete(`/api/users/${userId}`);
      return res.data;
    },
    forgotPassword: async (email: string) => {
      const res = await apiClient.post("/api/auth/forgot-password", { email });
      return res.data;
    },
    resetPassword: async (token: string, newPassword: string) => {
      const res = await apiClient.post("/api/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      return res.data;
    },
  },

  // Products CRUD
  products: {
    list: async (params?: { category?: string; search?: string; days?: number }) => {
      const res = await apiClient.get("/api/products", { params });
      return res.data;
    },
    get: async (id: string, days?: number) => {
      const res = await apiClient.get(`/api/products/${id}`, { params: { days } });
      return res.data;
    },
    create: async (data: any) => {
      const res = await apiClient.post("/api/products", data);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const res = await apiClient.put(`/api/products/${id}`, data);
      return res.data;
    },
    delete: async (id: string) => {
      const res = await apiClient.delete(`/api/products/${id}`);
      return res.data;
    },
    recordSale: async (id: string, qty: number = 1) => {
      const res = await apiClient.patch(`/api/products/${id}/sell`, null, { params: { qty } });
      return res.data;
    },
  },

  // Pricing & Simulation
  pricing: {
    getKPI: async (days: number = 30) => {
      const res = await apiClient.get("/api/pricing/summary", { params: { days } });
      return res.data;
    },
    getSweep: async (productId: string) => {
      const res = await apiClient.get(`/api/pricing/sweep/${productId}`);
      return res.data;
    },
    optimize: async (productId: string, customPrice: number) => {
      const res = await apiClient.post("/api/pricing/optimize", {
        product_id: productId,
        custom_price: customPrice,
      });
      return res.data;
    },
    getHistory: async (days: number = 30) => {
      const res = await apiClient.get("/api/pricing/history", { params: { days } });
      return res.data;
    },
  },

  // Demand Forecasting
  forecast: {
    getAll: async (horizon: string = "30d") => {
      const res = await apiClient.get("/api/forecast/all", { params: { horizon } });
      return res.data;
    },
    getProduct: async (productId: string, horizon: string = "30d") => {
      const res = await apiClient.get(`/api/forecast/${productId}`, { params: { horizon } });
      return res.data;
    },
  },

  // AI Insights & Chat
  insight: {
    list: async () => {
      const res = await apiClient.get("/api/insight");
      return res.data;
    },
    getProduct: async (productId: string) => {
      const res = await apiClient.get(`/api/insight/product/${productId}`);
      return res.data;
    },
    chat: async (question: string, contextProductId?: string) => {
      const res = await apiClient.post("/api/insight/chat", {
        question,
        context_product_id: contextProductId,
      });
      return res.data;
    },
  },

  // Proactive Alerts
  alerts: {
    list: async () => {
      const res = await apiClient.get("/api/alerts");
      return res.data;
    },
    dismiss: async (alertId: string) => {
      const res = await apiClient.post(`/api/alerts/${alertId}/dismiss`);
      return res.data;
    },
  },

  // Business Intelligence Reports
  reports: {
    downloadSummary: async (format: "pdf" | "csv" | "excel" = "pdf") => {
      const res = await apiClient.get(`/api/reports/summary?format=${format}`, {
        responseType: "blob",
      });
      return res.data;
    },
    downloadCsv: async () => {
      const res = await apiClient.get("/api/reports/export-csv", {
        responseType: "blob",
      });
      return res.data;
    },
    downloadPriceComparisonPdf: async (productId: string) => {
      const res = await apiClient.get(`/api/reports/price-comparison/${productId}`, {
        responseType: "blob",
      });
      return res.data;
    },
  },

  // Governance & Audit
  audit: {
    list: async (limit: number = 50) => {
      const res = await apiClient.get("/api/audit-logs", { params: { limit } });
      return res.data;
    },
  },

  // Model Governance
  models: {
    getStatus: async () => {
      const res = await apiClient.get("/api/model/status");
      return res.data;
    },
    refresh: async () => {
      const res = await apiClient.post("/api/model/refresh");
      return res.data;
    },
  },

  // Exploratory Data Analysis
  eda: {
    getData: async () => {
      const res = await apiClient.get("/api/eda/data");
      return res.data;
    },
  },
};

export default apiClient;
