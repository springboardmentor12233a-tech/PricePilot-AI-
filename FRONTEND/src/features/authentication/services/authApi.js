import apiClient, { refreshAccessToken } from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';

export const authApi = {
  async registerUser(payload) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
      email: payload.email, password: payload.password, full_name: payload.full_name,
    });
    return response.data;
  },
  async loginUser(payload) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      email: payload.email, password: payload.password,
    });
    return response.data;
  },
  async verifyLoginOtp(payload) {
    const response = await apiClient.post('/api/v1/auth/verify-otp', payload);
    return response.data;
  },
  async resendLoginOtp(challengeId) {
    const response = await apiClient.post('/api/v1/auth/resend-otp', { challenge_id: challengeId });
    return response.data;
  },
  async refreshSession() {
    return refreshAccessToken();
  },
  async getCurrentUser() {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },
  async logoutCurrent(token) {
    await apiClient.post('/api/v1/auth/logout', {}, {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
    });
  },
  async logoutAll() {
    await apiClient.post('/api/v1/auth/logout-all');
  },
  async getSessions() {
    const response = await apiClient.get('/api/v1/auth/sessions');
    return response.data;
  },
  async revokeSession(sessionId) {
    await apiClient.delete('/api/v1/auth/sessions/' + sessionId);
  },
};

export const {
  registerUser, loginUser, verifyLoginOtp, resendLoginOtp, getCurrentUser,
} = authApi;
export default authApi;