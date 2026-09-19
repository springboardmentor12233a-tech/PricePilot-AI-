import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../authentication/hooks/useAuth';
import { organizationApi } from '../services/organizationApi';
import {
  getSelectedOrganizationId,
  setSelectedOrganizationId,
  removeSelectedOrganizationId,
} from '../../../utils/storage';
import { extractErrorMessage } from '../../../utils/errorHandler';

export const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationIdState] = useState(() =>
    getSelectedOrganizationId()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Derive selectedOrganization object from organizations array & selectedOrganizationId
   */
  const selectedOrganization = useMemo(() => {
    if (!selectedOrganizationId || organizations.length === 0) {
      return null;
    }
    return (
      organizations.find(
        (org) => String(org.id) === String(selectedOrganizationId)
      ) || null
    );
  }, [organizations, selectedOrganizationId]);

  /**
   * Select and persist an organization
   */
  const selectOrganization = useCallback(
    (orgId) => {
      if (!orgId) {
        setSelectedOrganizationIdState(null);
        removeSelectedOrganizationId();
        return;
      }

      setIsSwitching(true);
      const strId = String(orgId);
      setSelectedOrganizationId(strId);
      setSelectedOrganizationIdState(strId);

      // Subtle loading pulse for UX transition
      const timer = setTimeout(() => {
        setIsSwitching(false);
      }, 150);

      return () => clearTimeout(timer);
    },
    []
  );

  /**
   * Fetch organizations from the backend
   */
  const refreshOrganizations = useCallback(async () => {
    if (!isAuthenticated) {
      setOrganizations([]);
      setSelectedOrganizationIdState(null);
      setIsLoading(false);
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await organizationApi.getOrganizations();
      const orgList = Array.isArray(data) ? data : data?.items || [];
      setOrganizations(orgList);

      // Determine organization selection priority:
      // 1. Previously selected valid organization
      // 2. First available organization
      // 3. No organization if user has none
      const storedId = getSelectedOrganizationId();
      const hasStoredMatch = storedId && orgList.some((o) => String(o.id) === String(storedId));

      if (hasStoredMatch) {
        setSelectedOrganizationIdState(String(storedId));
      } else if (orgList.length > 0) {
        const firstId = String(orgList[0].id);
        setSelectedOrganizationId(firstId);
        setSelectedOrganizationIdState(firstId);
      } else {
        removeSelectedOrganizationId();
        setSelectedOrganizationIdState(null);
      }

      return orgList;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to load your organizations.');
      setError(msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Initial load when authentication is verified
   */
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        refreshOrganizations();
      } else {
        setOrganizations([]);
        setSelectedOrganizationIdState(null);
        setIsLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, refreshOrganizations]);

  /**
   * Create organization action
   */
  const createOrganization = useCallback(
    async (payload) => {
      setError(null);
      try {
        const newOrg = await organizationApi.createOrganization(payload);
        if (newOrg && newOrg.id) {
          const newId = String(newOrg.id);
          setOrganizations((prev) => {
            const exists = prev.some((o) => String(o.id) === newId);
            return exists ? prev : [newOrg, ...prev];
          });
          setSelectedOrganizationId(newId);
          setSelectedOrganizationIdState(newId);
        }
        return newOrg;
      } catch (err) {
        const msg = extractErrorMessage(err, 'Failed to create organization.');
        throw new Error(msg);
      }
    },
    []
  );

  /**
   * Add team member action
   */
  const addMember = useCallback(async (orgId, memberData) => {
    try {
      const response = await organizationApi.addOrganizationMember(orgId, memberData);
      return response;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to add member.');
      throw new Error(msg);
    }
  }, []);

  const value = {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    isLoading,
    isSwitching,
    error,
    selectOrganization,
    refreshOrganizations,
    createOrganization,
    addMember,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
}

export default OrganizationContext;
