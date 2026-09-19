import { useState, useEffect, useCallback, useRef } from 'react';
import { productApi } from '../services/productApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to fetch and manage a single product's detailed data
 */
export function useProduct(productId) {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeIdRef = useRef(productId);
  activeIdRef.current = productId;

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null);
      setIsLoading(false);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await productApi.getProduct(productId);
      if (activeIdRef.current === productId) {
        setProduct(data);
        return data;
      }
      return null;
    } catch (err) {
      if (activeIdRef.current === productId) {
        const msg = extractErrorMessage(err, 'Unable to load this product.');
        setError(msg);
      }
      return null;
    } finally {
      if (activeIdRef.current === productId) {
        setIsLoading(false);
      }
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    isLoading,
    error,
    refresh: fetchProduct,
    setProduct,
  };
}

export default useProduct;
