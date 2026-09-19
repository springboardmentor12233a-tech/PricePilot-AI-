import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const profileApi = {
  getUsers: async () => {
    const response = await apiClient.get(API_ENDPOINTS.USERS.BASE);
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await apiClient.get(API_ENDPOINTS.USERS.DETAIL(userId));
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await apiClient.put(API_ENDPOINTS.USERS.DETAIL(userId), userData);
    return response.data;
  },
};

export default profileApi;
