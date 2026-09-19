/**
 * PricePilot AI — Authentication API Service
 * Directly interacts with the existing FastAPI backend endpoints:
 * - POST /api/v1/auth/register
 * - POST /api/v1/auth/login
 * - GET  /api/v1/auth/me
 * - POST /api/v1/auth/token
 */

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const authApi = {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   * @param {Object} payload - { email, password, full_name }
   */
  async registerUser(payload) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name,
    });
    return response.data;
  },

  /**
   * Login user to receive access_token and refresh_token
   * POST /api/v1/auth/login
   * @param {Object} payload - { email, password }
   */
  async loginUser(payload) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      email: payload.email,
      password: payload.password,
    });
    return response.data;
  },

  /**
   * Retrieve current authenticated user profile
   * GET /api/v1/auth/me
   * Requires Authorization: Bearer <ACCESS_TOKEN> attached by apiClient
   */
  async getCurrentUser() {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },

  /**
   * Existing FastAPI token endpoint
   * POST /api/v1/auth/token
   */
  async tokenLogin(formData) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.TOKEN, formData);
    return response.data;
  },
};

// Also export individual functions for direct imports
export const { registerUser, loginUser, getCurrentUser, tokenLogin } = authApi;

export default authApi;
