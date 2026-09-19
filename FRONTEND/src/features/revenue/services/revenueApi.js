import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const revenueApi = {
  getSalesAnalytics: async (orgId) => {
    const response = await apiClient.get(API_ENDPOINTS.SALES.ANALYTICS(orgId));
    return response.data;
  },

  recordSale: async (saleData) => {
    const response = await apiClient.post(API_ENDPOINTS.SALES.BASE, saleData);
    return response.data;
  },
};

export default revenueApi;
