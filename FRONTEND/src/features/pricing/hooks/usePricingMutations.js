import { useState, useCallback } from 'react';
import { pricingApi } from '../services/pricingApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook for performing pricing mutations (creating recommendations, applying recommendations)
 */
export function usePricingMutations() {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);

  const createRecommendation = useCallback(async (payload) => {
    setIsMutating(true);
    setError(null);
    try {
      const response = await pricingApi.createPricingRecommendation(payload);
      return response;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to create pricing recommendation.');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const applyRecommendation = useCallback(async (recommendationId, payload = {}) => {
    if (!recommendationId) {
      throw new Error('Recommendation ID is required to apply.');
    }
    setIsMutating(true);
    setError(null);
    try {
      const response = await pricingApi.applyPricingRecommendation(recommendationId, payload);
      return response;
    } catch (err) {
      const msg = extractErrorMessage(
        err,
        'You do not have permission or the system was unable to apply this recommendation.'
      );
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    createRecommendation,
    applyRecommendation,
    isMutating,
    error,
  };
}

export default usePricingMutations;
