import { useState, useCallback, useEffect, useRef } from 'react';
import { pricingApi } from '../services/pricingApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to retrieve and manage pricing history records for a product
 * Calls GET /api/v1/pricing/history/{product_id}
 */
export function usePricingHistory(productId) {
  const [history, setHistory] = useState([]);
  const [historyProductId, setHistoryProductId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorProductId, setErrorProductId] = useState(null);

  const activeProductRef = useRef(productId);
  activeProductRef.current = productId;

  const fetchHistory = useCallback(async () => {
    if (!productId) {
      setHistory([]);
      setHistoryProductId(null);
      setIsLoading(false);
      setError(null);
      setErrorProductId(null);
      return [];
    }

    setIsLoading(true);
    setError(null);
    setErrorProductId(null);

    try {
      const response = await pricingApi.getPricingHistory(productId);
      if (activeProductRef.current === productId) {
        const list = Array.isArray(response)
          ? response
          : (Array.isArray(response?.history) ? response.history : (response?.items || []));
        setHistory(list);
        setHistoryProductId(productId);
        return list;
      }
      return [];
    } catch (err) {
      if (activeProductRef.current === productId) {
        const msg = extractErrorMessage(err, 'Unable to load pricing history.');
        setHistory([]);
        setHistoryProductId(null);
        setError(msg);
        setErrorProductId(productId);
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
    history: String(historyProductId) === String(productId) ? history : [],
    isLoading: isLoading || (Boolean(productId)
      && String(historyProductId) !== String(productId)
      && String(errorProductId) !== String(productId)),
    error: String(errorProductId) === String(productId) ? error : null,
    refresh: fetchHistory,
    setHistory,
  };
}

export default usePricingHistory;
