import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';
import {
  getAccessToken, setAccessToken, clearAuthStorage, getUser, setUser,
} from '../../../utils/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAccessToken()));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCurrentUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!getAccessToken()) {
        const tokens = await authApi.refreshSession();
        setAccessToken(tokens.access_token);
      }
      const userData = await authApi.getCurrentUser();
      setUserState(userData);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (err) {
      clearAuthStorage();
      setUserState(null);
      setIsAuthenticated(false);
      if (err?.status !== 401) setError(err.message || 'Unable to connect to PricePilot AI backend.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadCurrentUser(); }, [loadCurrentUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthStorage();
      setUserState(null);
      setIsAuthenticated(false);
      setError('Your session has expired. Please sign in again.');
    };
    window.addEventListener('pricepilot:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('pricepilot:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      // Password validation only creates a challenge; protected routes remain closed.
      return await authApi.loginUser(credentials);
    } catch (err) {
      setError(err.message || 'Unable to start sign-in. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (challenge) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.verifyLoginOtp(challenge);
      setAccessToken(response.access_token);
      setUserState(response.user);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.message || 'The verification code is invalid or expired.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendOtp = useCallback((challengeId) => authApi.resendLoginOtp(challengeId), []);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Registration does not authenticate; login still requires email OTP.
      return await authApi.registerUser(userData);
    } catch (err) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    const token = getAccessToken();
    const revocation = token ? authApi.logoutCurrent(token).catch(() => undefined) : Promise.resolve();
    clearAuthStorage();
    setUserState(null);
    setIsAuthenticated(false);
    setError(null);
    return revocation;
  }, []);
  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      clearAuthStorage();
      setUserState(null);
      setIsAuthenticated(false);
      setError(null);
    }
  }, []);

  const value = {
    user, isAuthenticated, isLoading, error, login, verifyOtp, resendOtp,
    register, logout, logoutAll, loadCurrentUser,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within an AuthProvider');
  return context;
}

export default AuthContext;