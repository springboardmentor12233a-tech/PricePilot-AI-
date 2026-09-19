/**
 * PricePilot AI — Product API Service
 * Interacts directly with the existing FastAPI backend:
 * - GET    /api/v1/products/organization/{org_id}
 * - GET    /api/v1/products/{product_id}
 * - POST   /api/v1/products/
 * - PUT    /api/v1/products/{product_id}
 * - DELETE /api/v1/products/{product_id}
 * - POST   /api/v1/products/{product_id}/variants
 */

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const productApi = {
  /**
   * List all products for an organization
   * GET /api/v1/products/organization/{org_id}
   */
  getProducts: async (organizationId) => {
    if (!organizationId) throw new Error('Organization ID is required to fetch products.');
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BY_ORG(organizationId));
    return response.data;
  },

  /**
   * Alias for backward compatibility
   */
  getProductsByOrg: async (organizationId) => {
    return productApi.getProducts(organizationId);
  },

  /**
   * Retrieve product details by product ID
   * GET /api/v1/products/{product_id}
   */
  getProduct: async (productId) => {
    if (!productId) throw new Error('Product ID is required.');
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.DETAIL(productId));
    return response.data;
  },

  /**
   * Alias for backward compatibility
   */
  getProductById: async (productId) => {
    return productApi.getProduct(productId);
  },

  /**
   * Create a new product in the organization
   * POST /api/v1/products/
   */
  createProduct: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.BASE, payload);
    return response.data;
  },

  /**
   * Update an existing product
   * PUT /api/v1/products/{product_id}
   */
  updateProduct: async (productId, payload) => {
    if (!productId) throw new Error('Product ID is required.');
    const response = await apiClient.put(API_ENDPOINTS.PRODUCTS.DETAIL(productId), payload);
    return response.data;
  },

  /**
   * Delete a product
   * DELETE /api/v1/products/{product_id}
   */
  deleteProduct: async (productId) => {
    if (!productId) throw new Error('Product ID is required.');
    const response = await apiClient.delete(API_ENDPOINTS.PRODUCTS.DETAIL(productId));
    return response.data;
  },

  /**
   * Create a variant for a product
   * POST /api/v1/products/{product_id}/variants
   */
  createProductVariant: async (productId, payload) => {
    if (!productId) throw new Error('Product ID is required.');
    const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.VARIANTS(productId), payload);
    return response.data;
  },

  /**
   * Alias for backward compatibility
   */
  addVariant: async (productId, payload) => {
    return productApi.createProductVariant(productId, payload);
  },
};

export const {
  getProducts,
  getProductsByOrg,
  getProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductVariant,
  addVariant,
} = productApi;

export default productApi;
