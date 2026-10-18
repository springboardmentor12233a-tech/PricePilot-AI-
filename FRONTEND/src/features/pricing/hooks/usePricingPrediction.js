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
  const requestControllerRef = useRef(null);
  const requestLockRef = useRef(false);
  const requestSequenceRef = useRef(0);

  // Clear prediction if product changes
  useEffect(() => {
    requestSequenceRef.current += 1;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    requestLockRef.current = false;
    setPrediction(null);
    setError(null);
    setIsLoading(false);
    return () => {
      requestSequenceRef.current += 1;
      requestLockRef.current = false;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
    };
  }, [productId]);

  const reset = useCallback(() => {
    requestSequenceRef.current += 1;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    requestLockRef.current = false;
    setPrediction(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const predict = useCallback(async (payload) => {
    if (!payload?.product_id) {
      throw new Error('Product ID is required to run a prediction.');
    }

    if (requestLockRef.current) return null;
    requestLockRef.current = true;
    const requestSequence = ++requestSequenceRef.current;
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const response = await pricingApi.predictPrice(payload, { signal: controller.signal });
      // Guard against race condition if product changed mid-request
      if (activeProductRef.current === payload.product_id && requestSequenceRef.current === requestSequence) {
        const normalized = normalizePredictionResult(response);
        if (!normalized || normalized.predictedPrice === null) {
          throw new Error('Pricing endpoint did not return a valid recommended price.');
        }
        setPrediction(normalized);
        return normalized;
      }
      return null;
    } catch (err) {
      if (controller.signal.aborted) return null;
      if (activeProductRef.current === payload.product_id && requestSequenceRef.current === requestSequence) {
        const msg = extractErrorMessage(err, 'Unable to generate the pricing prediction.');
        setError(msg);
      }
      throw err;
    } finally {
      if (requestSequenceRef.current === requestSequence) {
        requestLockRef.current = false;
        requestControllerRef.current = null;
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
