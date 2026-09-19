/**
 * PricePilot AI — Revenue Optimization & Pricing Simulation API Service
 * Reuses existing backend pricing, competitor, and inventory API endpoints:
 * - POST /api/v1/pricing/predict
 * - POST /api/v1/pricing/recommendations
 * - POST /api/v1/pricing/recommendations/{recommendation_id}/apply
 * - GET  /api/v1/pricing/history/{product_id}
 * - GET  /api/v1/competitors/product/{product_id}/prices
 * - GET  /api/v1/products/{product_id}/inventory
 *
 * Does NOT invent fake endpoints or mock metrics.
 */

import { pricingApi } from '../../pricing/services/pricingApi';
import { competitorApi } from '../../competitors/services/competitorApi';
import { inventoryApi } from '../../inventory/services/inventoryApi';

export const revenueApi = {
  /**
   * Run server-side pricing demand prediction for candidate scenario
   */
  predictPriceScenario: async (payload) => {
    return pricingApi.predictPrice(payload);
  },

  /**
   * Request server-side pricing recommendation
   */
  generateRecommendation: async (payload) => {
    return pricingApi.createPricingRecommendation(payload);
  },

  /**
   * Apply approved recommendation
   */
  applyRecommendation: async (recommendationId, payload = {}) => {
    return pricingApi.applyPricingRecommendation(recommendationId, payload);
  },

  /**
   * Retrieve real pricing history
   */
  getPricingHistory: async (productId) => {
    return pricingApi.getPricingHistory(productId);
  },

  /**
   * Retrieve competitor pricing observations for product
   */
  getCompetitorPrices: async (productId) => {
    return competitorApi.getCompetitorPrices(productId);
  },

  /**
   * Retrieve inventory status for product
   */
  getProductInventory: async (productId) => {
    return inventoryApi.getProductInventory(productId);
  },
};

export default revenueApi;
