/**
 * PricePilot AI — API Client Foundation
 * Centralized Axios instance with request and response interceptors.
 * Directly communicates with existing FastAPI backend at VITE_API_BASE_URL.
 */

import axios from 'axios';
import { getAccessToken, clearAuthStorage } from './storage';
import { extractErrorMessage } from './errorHandler';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
// Ensure no trailing slash on the base URL. If in browser preview and pointing to local port 8000, fallback to same-origin.
const getEffectiveBaseUrl = () => {
  if (!rawBaseUrl) return '';
  if (
    typeof window !== 'undefined' &&
    (rawBaseUrl.includes('127.0.0.1:8000') || rawBaseUrl.includes('localhost:8000')) &&
    window.location.port !== '8000'
  ) {
    return '';
  }
  return rawBaseUrl.replace(/\/+$/, '');
};

const baseURL = getEffectiveBaseUrl();

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

/**
 * Request interceptor:
 * Automatically attaches Authorization header ONLY when a valid token exists.
 * Never sends "Bearer undefined" or "Bearer null".
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && typeof token === 'string' && token.trim() !== '') {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor:
 * Handles 401, 403, 404, 422, 500 and network errors cleanly.
 * Dispatches a custom event on 401 ONLY for protected requests (not for /auth/login itself).
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error?.config?.url || '';
    const isAuthLoginRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    // 401 Unauthorized handling for protected requests
    if (error?.response?.status === 401 && !isAuthLoginRequest) {
      clearAuthStorage();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pricepilot:unauthorized'));
      }
    }

    const cleanMessage = extractErrorMessage(error);
    const formattedError = {
      status: error?.response?.status || null,
      message: cleanMessage,
      originalError: error,
    };

    return Promise.reject(formattedError);
  }
);

export default apiClient;
