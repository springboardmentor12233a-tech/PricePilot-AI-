import { useState, useEffect, useCallback, useRef } from 'react';
import { inventoryApi } from '../services/inventoryApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to manage inventory for a specific product
 */
export function useInventory(productId) {
  const [inventory, setInventory] = useState(null);
  const [inventoryProductId, setInventoryProductId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorProductId, setErrorProductId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const activeIdRef = useRef(productId);
  activeIdRef.current = productId;

  const fetchInventory = useCallback(async () => {
    if (!productId) {
      setInventory(null);
      setInventoryProductId(null);
      setIsLoading(false);
      setError(null);
      setErrorProductId(null);
      return null;
    }

    setIsLoading(true);
    setError(null);
    setErrorProductId(null);

    try {
      const data = await inventoryApi.getProductInventory(productId);
      if (activeIdRef.current === productId) {
        setInventory(data);
        setInventoryProductId(productId);
        return data;
      }
      return null;
    } catch (err) {
      if (activeIdRef.current === productId) {
        const msg = extractErrorMessage(err, 'Unable to load inventory.');
        setInventory(null);
        setInventoryProductId(null);
        setError(msg);
        setErrorProductId(productId);
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
      setInventoryProductId(productId);
      return updated;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to update inventory.');
      throw new Error(msg);
    } finally {
      setIsUpdating(false);
    }
  }, [productId]);

  return {
    inventory: String(inventoryProductId) === String(productId) ? inventory : null,
    isLoading: isLoading || (Boolean(productId)
      && String(inventoryProductId) !== String(productId)
      && String(errorProductId) !== String(productId)),
    error: String(errorProductId) === String(productId) ? error : null,
    isUpdating,
    refresh: fetchInventory,
    updateInventory,
    setInventory,
  };
}

export default useInventory;
