import { useState, useEffect, useCallback, useRef } from 'react';
import { categoryApi } from '../services/categoryApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to manage categories list and category creation for an organization
 */
export function useCategories(organizationId) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const activeOrgRef = useRef(organizationId);
  activeOrgRef.current = organizationId;

  const fetchCategories = useCallback(async () => {
    if (!organizationId) {
      setCategories([]);
      setIsLoading(false);
      setError(null);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await categoryApi.getCategories(organizationId);
      if (activeOrgRef.current === organizationId) {
        const list = Array.isArray(data) ? data : data?.items || [];
        setCategories(list);
        return list;
      }
      return [];
    } catch (err) {
      if (activeOrgRef.current === organizationId) {
        const msg = extractErrorMessage(err, 'Unable to load categories.');
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
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(async (payload) => {
    setIsCreating(true);
    try {
      const created = await categoryApi.createCategory(payload);
      setCategories((prev) => [...prev, created]);
      return created;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to create category.');
      throw new Error(msg);
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    categories,
    isLoading,
    error,
    isCreating,
    refresh: fetchCategories,
    createCategory,
  };
}

export default useCategories;
