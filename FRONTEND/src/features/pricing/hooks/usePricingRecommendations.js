import { useState, useCallback } from 'react';
import { pricingApi } from '../services/pricingApi';
import { normalizeRecommendation } from '../utils/pricingHelpers';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to manage pricing recommendation state and calls to POST /api/v1/pricing/recommendations
 */
export function usePricingRecommendations() {
  const [recommendation, setRecommendation] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setRecommendation(null);
    setRecommendations([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const generateRecommendation = useCallback(async (payload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await pricingApi.createPricingRecommendation(payload);
      let list = [];
      let primary = null;

      if (Array.isArray(response)) {
        list = response.map(normalizeRecommendation);
        primary = list[0] || null;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.recommendations)) {
          list = response.recommendations.map(normalizeRecommendation);
          primary = list[0] || null;
        } else {
          primary = normalizeRecommendation(response);
          list = primary ? [primary] : [];
        }
      }

      setRecommendation(primary);
      setRecommendations(list);
      return primary;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to generate the pricing recommendation.');
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    recommendation,
    recommendations,
    isLoading,
    error,
    generateRecommendation,
    setRecommendation,
    reset,
  };
}

export default usePricingRecommendations;
