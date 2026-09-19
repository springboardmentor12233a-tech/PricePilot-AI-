/**
 * PricePilot AI — Centralized Storage Utility
 * Encapsulates localStorage access to prevent direct access scattering.
 */

import { STORAGE_KEYS } from './constants';

export const getAccessToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || null;
  } catch {
    return null;
  }
};

export const setAccessToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
  } catch (error) {
    console.warn('Storage write failed:', error);
  }
};

export const removeAccessToken = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.warn('Storage removal failed:', error);
  }
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || null;
  } catch {
    return null;
  }
};

export const setRefreshToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  } catch (error) {
    console.warn('Storage write failed:', error);
  }
};

export const removeRefreshToken = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.warn('Storage removal failed:', error);
  }
};

export const getUser = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  } catch (error) {
    console.warn('Storage write failed:', error);
  }
};

export const removeUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.warn('Storage removal failed:', error);
  }
};

export const getActiveOrgId = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ORG) || null;
  } catch {
    return null;
  }
};

export const setActiveOrgId = (orgId) => {
  try {
    if (orgId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ORG, String(orgId));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ORG);
    }
  } catch (error) {
    console.warn('Storage write failed:', error);
  }
};

export const getSelectedOrganizationId = () => {
  return getActiveOrgId();
};

export const setSelectedOrganizationId = (id) => {
  setActiveOrgId(id);
};

export const removeSelectedOrganizationId = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ORG);
  } catch (error) {
    console.warn('Storage removal failed:', error);
  }
};

export const clearAuthStorage = () => {
  removeAccessToken();
  removeRefreshToken();
  removeUser();
  removeSelectedOrganizationId();
};
