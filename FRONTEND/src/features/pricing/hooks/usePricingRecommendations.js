import { useState, useCallback, useRef } from 'react';
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
  const requestLockRef = useRef(false);
  const requestSequenceRef = useRef(0);

  const reset = useCallback(() => {
    requestSequenceRef.current += 1;
    requestLockRef.current = false;
    setRecommendation(null);
    setRecommendations([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const generateRecommendation = useCallback(async (payload) => {
    if (requestLockRef.current) return null;
    requestLockRef.current = true;
    const requestSequence = ++requestSequenceRef.current;
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

      if (!primary?.id || !Number.isFinite(primary.recommendedPrice) || primary.recommendedPrice <= 0) {
        throw new Error('Pricing endpoint did not return a valid recommendation.');
      }

      if (requestSequenceRef.current === requestSequence) {
        setRecommendation(primary);
        setRecommendations(list);
      }
      return primary;
    } catch (err) {
      if (requestSequenceRef.current !== requestSequence) return null;
      const msg = extractErrorMessage(err, 'Unable to generate the pricing recommendation.');
      if (requestSequenceRef.current === requestSequence) setError(msg);
      throw err;
    } finally {
      if (requestSequenceRef.current === requestSequence) {
        requestLockRef.current = false;
        setIsLoading(false);
      }
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
