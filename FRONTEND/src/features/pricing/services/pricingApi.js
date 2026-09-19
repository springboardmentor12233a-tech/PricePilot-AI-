/**
 * PricePilot AI — Pricing API Service
 * Interacts directly with the existing FastAPI backend:
 * - POST /api/v1/pricing/predict
 * - POST /api/v1/pricing/recommendations
 * - POST /api/v1/pricing/recommendations/{recommendation_id}/apply
 * - GET  /api/v1/pricing/history/{product_id}
 */

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const pricingApi = {
  /**
   * Run pricing demand prediction
   * POST /api/v1/pricing/predict
   */
  predictPrice: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.PRICING.PREDICT, payload);
    return response.data;
  },

  predictPricing: async (payload) => {
    return pricingApi.predictPrice(payload);
  },

  /**
   * Create or generate a pricing recommendation
   * POST /api/v1/pricing/recommendations
   */
  createPricingRecommendation: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.PRICING.RECOMMENDATIONS, payload);
    return response.data;
  },

  /**
   * Alias for backward compatibility
   */
  getRecommendations: async (payload) => {
    return pricingApi.createPricingRecommendation(payload);
  },

  /**
   * Apply a pricing recommendation
   * POST /api/v1/pricing/recommendations/{recommendation_id}/apply
   */
  applyPricingRecommendation: async (recommendationId, payload = {}) => {
    if (!recommendationId) throw new Error('Recommendation ID is required to apply.');
    const response = await apiClient.post(
      API_ENDPOINTS.PRICING.APPLY_RECOMMENDATION(recommendationId),
      payload
    );
    return response.data;
  },

  /**
   * Alias for backward compatibility
   */
  applyRecommendation: async (recommendationId, payload = {}) => {
    return pricingApi.applyPricingRecommendation(recommendationId, payload);
  },

  /**
   * Retrieve historical pricing records for a product
   * GET /api/v1/pricing/history/{product_id}
   */
  getPricingHistory: async (productId) => {
    if (!productId) throw new Error('Product ID is required to fetch pricing history.');
    const response = await apiClient.get(API_ENDPOINTS.PRICING.HISTORY(productId));
    return response.data;
  },
};

export const {
  predictPrice,
  predictPricing,
  createPricingRecommendation,
  getRecommendations,
  applyPricingRecommendation,
  applyRecommendation,
  getPricingHistory,
} = pricingApi;

export default pricingApi;
