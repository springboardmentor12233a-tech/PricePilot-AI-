import { useState, useEffect, useCallback, useRef } from 'react';
import { competitorApi } from '../services/competitorApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to fetch and manage competitor price observations for a product
 */
export function useCompetitorPrices(productId) {
  const [prices, setPrices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeIdRef = useRef(productId);
  activeIdRef.current = productId;

  const fetchPrices = useCallback(async () => {
    if (!productId) {
      setPrices([]);
      setIsLoading(false);
      setError(null);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await competitorApi.getCompetitorPrices(productId);
      if (activeIdRef.current === productId) {
        const list = Array.isArray(data) ? data : data?.items || [];
        setPrices(list);
        return list;
      }
      return [];
    } catch (err) {
      if (activeIdRef.current === productId) {
        // 404 can mean no observations yet recorded for this product
        if (err?.response?.status === 404) {
          setPrices([]);
          setError(null);
        } else {
          const msg = extractErrorMessage(err, 'Unable to load competitor prices.');
          setError(msg);
        }
      }
      return [];
    } finally {
      if (activeIdRef.current === productId) {
        setIsLoading(false);
      }
    }
  }, [productId]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return {
    prices,
    isLoading,
    error,
    refresh: fetchPrices,
    setPrices,
  };
}

export default useCompetitorPrices;
