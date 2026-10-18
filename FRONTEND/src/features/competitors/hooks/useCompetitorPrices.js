import { useState, useEffect, useCallback, useRef } from 'react';
import { competitorApi } from '../services/competitorApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to fetch and manage competitor price observations for a product
 */
export function useCompetitorPrices(productId) {
  const [prices, setPrices] = useState([]);
  const [pricesProductId, setPricesProductId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorProductId, setErrorProductId] = useState(null);

  const activeIdRef = useRef(productId);
  activeIdRef.current = productId;

  const fetchPrices = useCallback(async () => {
    if (!productId) {
      setPrices([]);
      setPricesProductId(null);
      setIsLoading(false);
      setError(null);
      setErrorProductId(null);
      return [];
    }

    setIsLoading(true);
    setError(null);
    setErrorProductId(null);

    try {
      const data = await competitorApi.getCompetitorPrices(productId);
      if (activeIdRef.current === productId) {
        const list = Array.isArray(data) ? data : data?.items || [];
        setPrices(list);
        setPricesProductId(productId);
        return list;
      }
      return [];
    } catch (err) {
      if (activeIdRef.current === productId) {
        // The shared API client wraps HTTP errors; 404 can mean no recorded observations.
        const status = err?.status || err?.response?.status || err?.originalError?.response?.status;
        if (status === 404) {
          setPrices([]);
          setPricesProductId(productId);
          setError(null);
        } else {
          const msg = extractErrorMessage(err, 'Unable to load competitor prices.');
          setPrices([]);
          setPricesProductId(null);
          setError(msg);
          setErrorProductId(productId);
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
    prices: String(pricesProductId) === String(productId) ? prices : [],
    isLoading: isLoading || (Boolean(productId)
      && String(pricesProductId) !== String(productId)
      && String(errorProductId) !== String(productId)),
    error: String(errorProductId) === String(productId) ? error : null,
    refresh: fetchPrices,
    setPrices,
  };
}

export default useCompetitorPrices;
