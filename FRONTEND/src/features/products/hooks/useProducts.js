import { useState, useEffect, useCallback, useRef } from 'react';
import { productApi } from '../services/productApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to manage products list for an active organization
 */
export function useProducts(organizationId) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track latest organizationId to prevent race conditions
  const activeOrgRef = useRef(organizationId);
  activeOrgRef.current = organizationId;

  const fetchProducts = useCallback(async () => {
    if (!organizationId) {
      setProducts([]);
      setIsLoading(false);
      setError(null);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await productApi.getProducts(organizationId);
      // Guard against stale response if organization changed mid-flight
      if (activeOrgRef.current === organizationId) {
        const list = Array.isArray(data) ? data : data?.items || [];
        setProducts(list);
        return list;
      }
      return [];
    } catch (err) {
      if (activeOrgRef.current === organizationId) {
        const msg = extractErrorMessage(err, 'Unable to load products.');
        setError(msg);
      }
      return [];
    } finally {
      if (activeOrgRef.current === organizationId) {
        setIsLoading(false);
      }
    }
  }, [organizationId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    refresh: fetchProducts,
    setProducts,
  };
}

export default useProducts;
