import { useState, useCallback } from 'react';
import { inventoryApi } from '../services/inventoryApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to manage standalone inventory mutations
 */
export function useInventoryMutation() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const updateInventory = useCallback(async (productId, payload) => {
    setIsUpdating(true);
    setError(null);
    try {
      const result = await inventoryApi.updateProductInventory(productId, payload);
      return result;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to update inventory.');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    updateInventory,
    isUpdating,
    error,
  };
}

export default useInventoryMutation;
