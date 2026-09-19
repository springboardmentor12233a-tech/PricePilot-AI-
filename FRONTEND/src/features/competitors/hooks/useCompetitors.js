import { useState, useEffect, useCallback, useRef } from 'react';
import { competitorApi } from '../services/competitorApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to manage competitors list for an active organization
 */
export function useCompetitors(organizationId) {
  const [competitors, setCompetitors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeOrgRef = useRef(organizationId);
  activeOrgRef.current = organizationId;

  const fetchCompetitors = useCallback(async () => {
    if (!organizationId) {
      setCompetitors([]);
      setIsLoading(false);
      setError(null);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await competitorApi.getCompetitors(organizationId);
      if (activeOrgRef.current === organizationId) {
        const list = Array.isArray(data) ? data : data?.items || [];
        setCompetitors(list);
        return list;
      }
      return [];
    } catch (err) {
      if (activeOrgRef.current === organizationId) {
        const msg = extractErrorMessage(err, 'Unable to load competitors.');
        setError(msg);
      }
      return [];
    } finally {
      if (activeOrgRef.current === organizationId) {
        setIsLoading(false);
      }
    }
  }, [organizationId]);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  return {
    competitors,
    isLoading,
    error,
    refresh: fetchCompetitors,
    setCompetitors,
  };
}

export default useCompetitors;
