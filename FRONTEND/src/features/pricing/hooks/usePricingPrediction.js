import { useState, useCallback, useEffect, useRef } from 'react';
import { pricingApi } from '../services/pricingApi';
import { normalizePredictionResult } from '../utils/pricingHelpers';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to manage pricing prediction state and calls to POST /api/v1/pricing/predict
 * Automatically clears previous predictions when productId changes.
 */
export function usePricingPrediction(productId) {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeProductRef = useRef(productId);
  activeProductRef.current = productId;

  // Clear prediction if product changes
  useEffect(() => {
    setPrediction(null);
    setError(null);
    setIsLoading(false);
  }, [productId]);

  const reset = useCallback(() => {
    setPrediction(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const predict = useCallback(async (payload) => {
    if (!payload?.product_id) {
      throw new Error('Product ID is required to run a prediction.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await pricingApi.predictPrice(payload);
      // Guard against race condition if product changed mid-request
      if (activeProductRef.current === payload.product_id) {
        const normalized = normalizePredictionResult(response);
        setPrediction(normalized);
        return normalized;
      }
      return null;
    } catch (err) {
      if (activeProductRef.current === payload.product_id) {
        const msg = extractErrorMessage(err, 'Unable to generate the pricing prediction.');
        setError(msg);
      }
      throw err;
    } finally {
      if (activeProductRef.current === payload.product_id) {
        setIsLoading(false);
      }
    }
  }, []);

  return {
    prediction,
    isLoading,
    error,
    predict,
    reset,
  };
}

export default usePricingPrediction;
