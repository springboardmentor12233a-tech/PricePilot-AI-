/**
 * PricePilot AI — Competitor API Service
 * Interacts directly with the existing FastAPI backend:
 * - POST /api/v1/competitors/
 * - GET  /api/v1/competitors/organization/{org_id}
 * - PUT  /api/v1/competitors/{competitor_id}
 * - POST /api/v1/competitors/match
 * - POST /api/v1/competitors/prices
 * - GET  /api/v1/competitors/product/{product_id}/prices
 */

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const competitorApi = {
  /**
   * List all competitors for an organization
   * GET /api/v1/competitors/organization/{org_id}
   */
  getCompetitors: async (organizationId) => {
    if (!organizationId) throw new Error('Organization ID is required.');
    const response = await apiClient.get(API_ENDPOINTS.COMPETITORS.BY_ORG(organizationId));
    return response.data;
  },

  /** Alias for backward compatibility */
  getCompetitorsByOrg: async (organizationId) => {
    return competitorApi.getCompetitors(organizationId);
  },

  /**
   * Create a new competitor
   * POST /api/v1/competitors/
   */
  createCompetitor: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.COMPETITORS.BASE, payload);
    return response.data;
  },

  /**
   * Update competitor details
   * PUT /api/v1/competitors/{competitor_id}
   */
  updateCompetitor: async (competitorId, payload) => {
    if (!competitorId) throw new Error('Competitor ID is required.');
    const response = await apiClient.put(API_ENDPOINTS.COMPETITORS.DETAIL(competitorId), payload);
    return response.data;
  },

  /**
   * Match our product with a competitor product
   * POST /api/v1/competitors/match
   */
  matchCompetitorProduct: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.COMPETITORS.MATCH, payload);
    return response.data;
  },

  /**
   * Record a competitor price observation
   * POST /api/v1/competitors/prices
   */
  createCompetitorPrice: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.COMPETITORS.PRICES, payload);
    return response.data;
  },

  /** Alias for backward compatibility */
  recordPrices: async (payload) => {
    return competitorApi.createCompetitorPrice(payload);
  },

  /**
   * Get competitor prices for a specific product
   * GET /api/v1/competitors/product/{product_id}/prices
   */
  getCompetitorPrices: async (productId) => {
    if (!productId) throw new Error('Product ID is required.');
    const response = await apiClient.get(API_ENDPOINTS.COMPETITORS.PRODUCT_PRICES(productId));
    return response.data;
  },

  /** Alias for backward compatibility */
  getProductCompetitorPrices: async (productId) => {
    return competitorApi.getCompetitorPrices(productId);
  },
};

export const {
  getCompetitors,
  getCompetitorsByOrg,
  createCompetitor,
  updateCompetitor,
  matchCompetitorProduct,
  createCompetitorPrice,
  recordPrices,
  getCompetitorPrices,
  getProductCompetitorPrices,
} = competitorApi;

export default competitorApi;
