/**
 * PricePilot AI — Application Constants
 */

export const APP_CONFIG = {
  name: 'PricePilot AI',
  tagline: 'Smarter Pricing. Higher Profits. Powered by AI.',
  version: '1.0.0',
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pricepilot_access_token',
  REFRESH_TOKEN: 'pricepilot_refresh_token',
  USER_DATA: 'pricepilot_user_data',
  ACTIVE_ORG: 'pricepilot_active_org_id',
};

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    ME: '/api/v1/auth/me',
  },
  // Users
  USERS: {
    BASE: '/api/v1/users/',
    DETAIL: (userId) => `/api/v1/users/${userId}`,
  },
  // Organizations
  ORGANIZATIONS: {
    BASE: '/api/v1/organizations/',
    DETAIL: (orgId) => `/api/v1/organizations/${orgId}`,
    MEMBERS: (orgId) => `/api/v1/organizations/${orgId}/members`,
  },
  // Categories
  CATEGORIES: {
    BASE: '/api/v1/categories/',
    BY_ORG: (orgId) => `/api/v1/categories/organization/${orgId}`,
  },
  // Products
  PRODUCTS: {
    BASE: '/api/v1/products/',
    BY_ORG: (orgId) => `/api/v1/products/organization/${orgId}`,
    DETAIL: (productId) => `/api/v1/products/${productId}`,
    VARIANTS: (productId) => `/api/v1/products/${productId}/variants`,
    INVENTORY: (productId) => `/api/v1/products/${productId}/inventory`,
  },
  // Competitors
  COMPETITORS: {
    BASE: '/api/v1/competitors/',
    BY_ORG: (orgId) => `/api/v1/competitors/organization/${orgId}`,
    DETAIL: (competitorId) => `/api/v1/competitors/${competitorId}`,
    MATCH: '/api/v1/competitors/match',
    PRICES: '/api/v1/competitors/prices',
    PRODUCT_PRICES: (productId) => `/api/v1/competitors/product/${productId}/prices`,
  },
  // Pricing
  PRICING: {
    PREDICT: '/api/v1/pricing/predict',
    RECOMMENDATIONS: '/api/v1/pricing/recommendations',
    APPLY_RECOMMENDATION: (recommendationId) => `/api/v1/pricing/recommendations/${recommendationId}/apply`,
    HISTORY: (productId) => `/api/v1/pricing/history/${productId}`,
  },
  // Sales
  SALES: {
    BASE: '/api/v1/sales/',
    ANALYTICS: (orgId) => `/api/v1/sales/analytics/${orgId}`,
  },
  // AI
  AI: {
    GEMINI: '/api/v2/ai/gemini',
    GROK: '/api/v2/ai/grok',
    PREDICT: '/api/v2/ai/predict',
  },
  // System
  SYSTEM: {
    HEALTH: '/health',
    ROOT: '/',
  },
};
