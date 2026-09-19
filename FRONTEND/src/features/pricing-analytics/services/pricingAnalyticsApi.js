/**
 * PricePilot AI — Pricing Analytics API Service
 * Composes existing API services from products, competitors, pricing, sales, and categories.
 * Does NOT invent fake endpoints or mock schemas.
 */

import { productApi } from '../../products/services/productApi';
import { competitorApi } from '../../competitors/services/competitorApi';
import { pricingApi } from '../../pricing/services/pricingApi';
import { revenueApi } from '../../revenue/services/revenueApi';
import { categoryApi } from '../../categories/services/categoryApi';

export const pricingAnalyticsApi = {
  /**
   * Retrieve products for active organization
   * GET /api/v1/products/organization/{org_id}
   */
  getProducts: async (organizationId) => {
    return productApi.getProducts(organizationId);
  },

  /**
   * Retrieve product detail
   * GET /api/v1/products/{product_id}
   */
  getProduct: async (productId) => {
    return productApi.getProduct(productId);
  },

  /**
   * Retrieve categories for active organization
   * GET /api/v1/categories/organization/{org_id}
   */
  getCategories: async (organizationId) => {
    try {
      return await categoryApi.getCategories(organizationId);
    } catch {
      return [];
    }
  },

  /**
   * Retrieve competitors for active organization
   * GET /api/v1/competitors/organization/{org_id}
   */
  getCompetitors: async (organizationId) => {
    try {
      return await competitorApi.getCompetitors(organizationId);
    } catch {
      return [];
    }
  },

  /**
   * Retrieve competitor price observations for a product
   * GET /api/v1/competitors/product/{product_id}/prices
   */
  getCompetitorPrices: async (productId) => {
    try {
      return await competitorApi.getCompetitorPrices(productId);
    } catch (err) {
      if (err?.response?.status === 404) return [];
      throw err;
    }
  },

  /**
   * Retrieve pricing history records for a product
   * GET /api/v1/pricing/history/{product_id}
   */
  getPricingHistory: async (productId) => {
    try {
      return await pricingApi.getPricingHistory(productId);
    } catch (err) {
      if (err?.response?.status === 404) return [];
      throw err;
    }
  },

  /**
   * Retrieve sales analytics for an organization
   * GET /api/v1/sales/analytics/{organization_id}
   * Returns null gracefully if no sales data exists yet (e.g. 404)
   */
  getSalesAnalytics: async (organizationId) => {
    try {
      const data = await revenueApi.getSalesAnalytics(organizationId);
      return data;
    } catch (err) {
      if (err?.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Query ML demand prediction for candidate price
   * POST /api/v1/pricing/predict
   */
  predictPrice: async (payload) => {
    return pricingApi.predictPrice(payload);
  },
};

export default pricingAnalyticsApi;
