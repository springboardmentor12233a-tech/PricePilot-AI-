import axios from 'axios';
import { getAccessToken, setAccessToken, clearAuthStorage } from './storage';
import { extractErrorMessage } from './errorHandler';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const getEffectiveBaseUrl = () => {
  if (!rawBaseUrl) return '';
  if (
    typeof window !== 'undefined' &&
    (rawBaseUrl.includes('127.0.0.1:8000') || rawBaseUrl.includes('localhost:8000')) &&
    window.location.port !== '8000'
  ) return '';
  return rawBaseUrl.replace(/\/+$/, '');
};
const baseURL = getEffectiveBaseUrl();

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

const readCookie = (name) => {
  if (typeof document === 'undefined') return '';
  const prefix = name + '=';
  const entry = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : '';
};

let refreshPromise = null;
export const refreshAccessToken = async () => {
  if (!refreshPromise) {
    const csrf = readCookie('pricepilot_csrf');
    refreshPromise = axios.post(
      baseURL + '/api/v1/auth/refresh',
      {},
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        timeout: 15000,
      }
    ).then((response) => {
      setAccessToken(response.data.access_token);
      return response.data;
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && typeof token === 'string' && token.trim()) {
    config.headers.Authorization = 'Bearer ' + token.trim();
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const requestUrl = config?.url || '';
    const isAuthFlow = [
      '/auth/login', '/auth/register', '/auth/token', '/auth/verify-otp',
      '/auth/resend-otp', '/auth/refresh',
    ].some((path) => requestUrl.includes(path));

    if (error?.response?.status === 401 && !isAuthFlow && config && !config._retry) {
      config._retry = true;
      try {
        const tokens = await refreshAccessToken();
        config.headers = config.headers || {};
        config.headers.Authorization = 'Bearer ' + tokens.access_token;
        return apiClient(config);
      } catch {
        clearAuthStorage();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pricepilot:unauthorized'));
        }
      }
    } else if (error?.response?.status === 401 && !isAuthFlow) {
      clearAuthStorage();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pricepilot:unauthorized'));
      }
    }

    return Promise.reject({
      status: error?.response?.status || null,
      message: extractErrorMessage(error),
      originalError: error,
    });
  }
);

export default apiClient;