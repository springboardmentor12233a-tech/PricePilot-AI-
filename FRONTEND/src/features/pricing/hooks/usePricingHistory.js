import { useState, useCallback, useEffect, useRef } from 'react';
import { pricingApi } from '../services/pricingApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to retrieve and manage pricing history records for a product
 * Calls GET /api/v1/pricing/history/{product_id}
 */
export function usePricingHistory(productId) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeProductRef = useRef(productId);
  activeProductRef.current = productId;

  const fetchHistory = useCallback(async () => {
    if (!productId) {
      setHistory([]);
      setIsLoading(false);
      setError(null);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await pricingApi.getPricingHistory(productId);
      if (activeProductRef.current === productId) {
        const list = Array.isArray(response)
          ? response
          : (Array.isArray(response?.history) ? response.history : (response?.items || []));
        setHistory(list);
        return list;
      }
      return [];
    } catch (err) {
      if (activeProductRef.current === productId) {
        const msg = extractErrorMessage(err, 'Unable to load pricing history.');
        setError(msg);
      }
      return [];
    } finally {
      if (activeProductRef.current === productId) {
        setIsLoading(false);
      }
    }
  }, [productId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refresh: fetchHistory,
    setHistory,
  };
}

export default usePricingHistory;
