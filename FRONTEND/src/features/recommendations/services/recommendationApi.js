import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const recommendationApi = {
  getRecommendations: async (filterData) => {
    const response = await apiClient.post(API_ENDPOINTS.PRICING.RECOMMENDATIONS, filterData || {});
    return response.data;
  },

  applyRecommendation: async (recommendationId) => {
    const response = await apiClient.post(API_ENDPOINTS.PRICING.APPLY_RECOMMENDATION(recommendationId));
    return response.data;
  },
};

export default recommendationApi;
