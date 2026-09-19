/**
 * PricePilot AI — Demand Forecasting API Service
 * Interacts directly with existing FastAPI backend:
 * - POST /api/v1/pricing/predict (Server-side XGBoost demand prediction model)
 * - POST /api/v2/ai/predict (AI v2 demand estimation)
 * - GET  /api/v1/sales/analytics/{organization_id} (Sales analytics history)
 * - GET  /api/v1/sales/ (Transaction-level sales records)
 */

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const forecastApi = {
  /**
   * Request demand prediction from the server-side XGBoost model
   * POST /api/v1/pricing/predict
   */
  getForecast: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.PRICING.PREDICT, payload);
    return response.data;
  },

  /**
   * Alias for demand prediction
   */
  predictDemand: async (payload) => {
    return forecastApi.getForecast(payload);
  },

  /**
   * AI v2 demand prediction endpoint
   * POST /api/v2/ai/predict
   */
  predictAiDemand: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.AI.PREDICT, payload);
    return response.data;
  },

  /**
   * Fetch historical sales analytics for organization / product
   * GET /api/v1/sales/analytics/{organization_id}
   */
  getSalesAnalytics: async (organizationId, params = {}) => {
    if (!organizationId) throw new Error('Organization ID is required to fetch sales analytics.');
    const response = await apiClient.get(API_ENDPOINTS.SALES.ANALYTICS(organizationId), { params });
    return response.data;
  },

  /**
   * Fetch historical sales transactions list
   * GET /api/v1/sales/
   */
  getSalesTransactions: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.SALES.BASE, { params });
    return response.data;
  },
};

export default forecastApi;
