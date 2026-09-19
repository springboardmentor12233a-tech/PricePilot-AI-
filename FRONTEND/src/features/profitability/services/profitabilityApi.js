import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const profitabilityApi = {
  getProfitability: async (orgId) => {
    const response = await apiClient.get(API_ENDPOINTS.SALES.ANALYTICS(orgId));
    return response.data;
  },
};

export default profitabilityApi;
