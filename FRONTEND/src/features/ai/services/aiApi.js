import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const aiApi = {
  geminiAnalysis: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.AI.GEMINI, payload);
    return response.data;
  },

  grokAnalysis: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.AI.GROK, payload);
    return response.data;
  },

  predictAI: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.AI.PREDICT, payload);
    return response.data;
  },
};

export default aiApi;
