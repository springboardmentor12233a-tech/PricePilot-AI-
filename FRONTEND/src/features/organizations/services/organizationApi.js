/**
 * PricePilot AI — Organization API Service
 * Interacts directly with the existing FastAPI backend:
 * - GET  /api/v1/organizations/
 * - GET  /api/v1/organizations/{org_id}
 * - POST /api/v1/organizations/
 * - POST /api/v1/organizations/{org_id}/members
 */

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const organizationApi = {
  /**
   * Retrieve all organizations for the authenticated user
   * GET /api/v1/organizations/
   */
  getOrganizations: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ORGANIZATIONS.BASE);
    return response.data;
  },

  /**
   * Retrieve organization details by organization ID
   * GET /api/v1/organizations/{org_id}
   * @param {string|number} organizationId
   */
  getOrganization: async (organizationId) => {
    const response = await apiClient.get(API_ENDPOINTS.ORGANIZATIONS.DETAIL(organizationId));
    return response.data;
  },

  /**
   * Alias for getOrganization
   */
  getOrganizationById: async (organizationId) => {
    return organizationApi.getOrganization(organizationId);
  },

  /**
   * Create a new organization workspace
   * POST /api/v1/organizations/
   * @param {Object} payload - { name, slug, description, logo_url }
   */
  createOrganization: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.ORGANIZATIONS.BASE, payload);
    return response.data;
  },

  /**
   * Add a member to the specified organization
   * POST /api/v1/organizations/{org_id}/members
   * @param {string|number} organizationId
   * @param {Object} payload - { user_id, role }
   */
  addOrganizationMember: async (organizationId, payload) => {
    const response = await apiClient.post(
      API_ENDPOINTS.ORGANIZATIONS.MEMBERS(organizationId),
      payload
    );
    return response.data;
  },

  /**
   * Alias for addOrganizationMember
   */
  addMember: async (organizationId, payload) => {
    return organizationApi.addOrganizationMember(organizationId, payload);
  },
};

export const {
  getOrganizations,
  getOrganization,
  getOrganizationById,
  createOrganization,
  addOrganizationMember,
  addMember,
} = organizationApi;

export default organizationApi;
