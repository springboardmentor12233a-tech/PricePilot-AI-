import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearAuthStorage,
  getUser,
  setUser,
} from '../../../utils/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAccessToken()));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load or refresh the current user profile from GET /api/v1/auth/me
   */
  const loadCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUserState(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userData = await authApi.getCurrentUser();
      setUserState(userData);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (err) {
      // If 401, token is invalid or expired
      if (err.status === 401) {
        clearAuthStorage();
        setUserState(null);
        setIsAuthenticated(false);
      } else {
        // Network or server error — do not immediately discard token to allow retry
        setError(err.message || 'Unable to connect to PricePilot AI backend.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Application Startup: Validate existing stored session against backend
   */
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      loadCurrentUser();
    } else {
      setIsLoading(false);
      setIsAuthenticated(false);
      setUserState(null);
    }
  }, [loadCurrentUser]);

  /**
   * Listen for global 401 unauthorized events from apiClient
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthStorage();
      setUserState(null);
      setIsAuthenticated(false);
      setError('Your session has expired. Please sign in again.');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pricepilot:unauthorized', handleUnauthorized);
      return () => window.removeEventListener('pricepilot:unauthorized', handleUnauthorized);
    }
  }, []);

  /**
   * Login with email and password
   * POST /api/v1/auth/login
   * Expects response: { access_token, refresh_token, token_type }
   */
  const login = useCallback(
    async (credentials) => {
      setIsLoading(true);
      setError(null);
      try {
        const responseData = await authApi.loginUser(credentials);
        const { access_token, refresh_token } = responseData;

        if (!access_token) {
          throw new Error('Authentication failed: No access token received from backend.');
        }

        // 1. Store tokens using storage abstraction
        setAccessToken(access_token);
        if (refresh_token) {
          setRefreshToken(refresh_token);
        }

        // 2. Set authenticated state
        setIsAuthenticated(true);

        // 3. Fetch current user from /api/v1/auth/me
        let profileData = null;
        try {
          profileData = await authApi.getCurrentUser();
        } catch {
          // If /auth/me temporarily fails or returns minimal info, construct basic session
          profileData = {
            email: credentials.email,
            full_name: credentials.email.split('@')[0],
          };
        }

        setUserState(profileData);
        setUser(profileData);
        return { tokens: responseData, user: profileData };
      } catch (err) {
        clearAuthStorage();
        setIsAuthenticated(false);
        setUserState(null);
        setError(err.message || 'Invalid email or password.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Register with full_name, email, and password
   * POST /api/v1/auth/register
   * Sends JSON: { full_name, email, password }
   */
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const responseData = await authApi.registerUser(userData);

      // Check if backend returned tokens upon registration
      if (responseData?.access_token) {
        setAccessToken(responseData.access_token);
        if (responseData.refresh_token) {
          setRefreshToken(responseData.refresh_token);
        }
        setIsAuthenticated(true);
        try {
          const profile = await authApi.getCurrentUser();
          setUserState(profile);
          setUser(profile);
        } catch {
          // Keep response data
        }
      }

      return responseData;
    } catch (err) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout: Clears access token, refresh token, user state, and resets auth status
   */
  const logout = useCallback(() => {
    clearAuthStorage();
    setUserState(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
