import { useState, useEffect, useCallback, useRef } from 'react';
import { inventoryApi } from '../services/inventoryApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to manage inventory for a specific product
 */
export function useInventory(productId) {
  const [inventory, setInventory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const activeIdRef = useRef(productId);
  activeIdRef.current = productId;

  const fetchInventory = useCallback(async () => {
    if (!productId) {
      setInventory(null);
      setIsLoading(false);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await inventoryApi.getProductInventory(productId);
      if (activeIdRef.current === productId) {
        setInventory(data);
        return data;
      }
      return null;
    } catch (err) {
      if (activeIdRef.current === productId) {
        const msg = extractErrorMessage(err, 'Unable to load inventory.');
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
    fetchInventory();
  }, [fetchInventory]);

  const updateInventory = useCallback(async (payload) => {
    if (!productId) throw new Error('Product ID is required.');
    setIsUpdating(true);
    try {
      const updated = await inventoryApi.updateProductInventory(productId, payload);
      setInventory(updated);
      return updated;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to update inventory.');
      throw new Error(msg);
    } finally {
      setIsUpdating(false);
    }
  }, [productId]);

  return {
    inventory,
    isLoading,
    error,
    isUpdating,
    refresh: fetchInventory,
    updateInventory,
    setInventory,
  };
}

export default useInventory;
