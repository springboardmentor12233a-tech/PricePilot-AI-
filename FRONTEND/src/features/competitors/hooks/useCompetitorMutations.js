import { useState, useCallback } from 'react';
import { competitorApi } from '../services/competitorApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to manage competitor creation, updates, product matches, and price records
 */
export function useCompetitorMutations() {
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState(null);

  const createCompetitor = useCallback(async (payload) => {
    setIsMutating(true);
    setMutationError(null);
    try {
      const created = await competitorApi.createCompetitor(payload);
      return created;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to add competitor.');
      setMutationError(msg);
      throw new Error(msg);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const updateCompetitor = useCallback(async (competitorId, payload) => {
    setIsMutating(true);
    setMutationError(null);
    try {
      const updated = await competitorApi.updateCompetitor(competitorId, payload);
      return updated;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to update competitor.');
      setMutationError(msg);
      throw new Error(msg);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const matchProduct = useCallback(async (payload) => {
    setIsMutating(true);
    setMutationError(null);
    try {
      const result = await competitorApi.matchCompetitorProduct(payload);
      return result;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to match competitor product.');
      setMutationError(msg);
      throw new Error(msg);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const recordCompetitorPrice = useCallback(async (payload) => {
    setIsMutating(true);
    setMutationError(null);
    try {
      const result = await competitorApi.createCompetitorPrice(payload);
      return result;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to record competitor price.');
      setMutationError(msg);
      throw new Error(msg);
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    isMutating,
    mutationError,
    createCompetitor,
    updateCompetitor,
    matchProduct,
    recordCompetitorPrice,
  };
}

export default useCompetitorMutations;
