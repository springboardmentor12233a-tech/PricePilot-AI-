/**
 * PricePilot AI — Category API Service
 * Interacts directly with the existing FastAPI backend:
 * - GET  /api/v1/categories/organization/{org_id}
 * - POST /api/v1/categories/
 */

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const categoryApi = {
  /**
   * List all categories for an organization
   * GET /api/v1/categories/organization/{org_id}
   */
  getCategories: async (organizationId) => {
    if (!organizationId) throw new Error('Organization ID is required to fetch categories.');
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.BY_ORG(organizationId));
    return response.data;
  },

  /**
   * Alias for backward compatibility
   */
  getCategoriesByOrg: async (organizationId) => {
    return categoryApi.getCategories(organizationId);
  },

  /**
   * Create a new category in the organization
   * POST /api/v1/categories/
   */
  createCategory: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.CATEGORIES.BASE, payload);
    return response.data;
  },
};

export const {
  getCategories,
  getCategoriesByOrg,
  createCategory,
} = categoryApi;

export default categoryApi;
