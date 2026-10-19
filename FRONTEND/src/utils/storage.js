/** Centralized browser storage helpers. Access tokens are tab-scoped; refresh tokens stay HttpOnly. */
import { STORAGE_KEYS } from './constants';

export const getAccessToken = () => {
  try { return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || null; } catch { return null; }
};

export const setAccessToken = (token) => {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    else sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch { /* Browser storage can be unavailable in privacy modes. */ }
};

export const removeAccessToken = () => {
  try { sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN); } catch { /* ignore */ }
};

export const getRefreshToken = () => null;
export const setRefreshToken = () => {
  try { localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN); } catch { /* ignore */ }
};
export const removeRefreshToken = () => {
  try { localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN); } catch { /* ignore */ }
};

export const getUser = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

export const setUser = (user) => {
  try {
    if (user) localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch { /* ignore */ }
};

export const removeUser = () => {
  try { localStorage.removeItem(STORAGE_KEYS.USER_DATA); } catch { /* ignore */ }
};

export const getActiveOrgId = () => {
  try { return localStorage.getItem(STORAGE_KEYS.ACTIVE_ORG) || null; } catch { return null; }
};

export const setActiveOrgId = (orgId) => {
  try {
    if (orgId) localStorage.setItem(STORAGE_KEYS.ACTIVE_ORG, String(orgId));
    else localStorage.removeItem(STORAGE_KEYS.ACTIVE_ORG);
  } catch { /* ignore */ }
};

export const getSelectedOrganizationId = getActiveOrgId;
export const setSelectedOrganizationId = setActiveOrgId;
export const removeSelectedOrganizationId = () => {
  try { localStorage.removeItem(STORAGE_KEYS.ACTIVE_ORG); } catch { /* ignore */ }
};

export const clearAuthStorage = () => {
  removeAccessToken();
  removeRefreshToken();
  removeUser();
  removeSelectedOrganizationId();
};