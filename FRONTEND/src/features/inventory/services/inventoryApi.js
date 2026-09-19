/**
 * PricePilot AI — Inventory API Service
 * Interacts directly with the existing FastAPI backend:
 * - GET /api/v1/products/{product_id}/inventory
 * - PUT /api/v1/products/{product_id}/inventory
 */

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const inventoryApi = {
  /**
   * Retrieve inventory position for a product
   * GET /api/v1/products/{product_id}/inventory
   */
  getProductInventory: async (productId) => {
    if (!productId) throw new Error('Product ID is required.');
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.INVENTORY(productId));
    return response.data;
  },

  /**
   * Alias for backward compatibility
   */
  getInventory: async (productId) => {
    return inventoryApi.getProductInventory(productId);
  },

  /**
   * Update inventory parameters for a product
   * PUT /api/v1/products/{product_id}/inventory
   */
  updateProductInventory: async (productId, payload) => {
    if (!productId) throw new Error('Product ID is required.');
    const response = await apiClient.put(API_ENDPOINTS.PRODUCTS.INVENTORY(productId), payload);
    return response.data;
  },

  /**
   * Alias for backward compatibility
   */
  updateInventory: async (productId, payload) => {
    return inventoryApi.updateProductInventory(productId, payload);
  },
};

export const {
  getProductInventory,
  getInventory,
  updateProductInventory,
  updateInventory,
} = inventoryApi;

export default inventoryApi;
