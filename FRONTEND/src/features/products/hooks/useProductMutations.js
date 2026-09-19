import { useState, useCallback } from 'react';
import { productApi } from '../services/productApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to manage product creation, update, deletion, and variant mutations
 */
export function useProductMutations() {
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState(null);

  const createProduct = useCallback(async (payload) => {
    setIsMutating(true);
    setMutationError(null);
    try {
      const created = await productApi.createProduct(payload);
      return created;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to create product.');
      setMutationError(msg);
      throw new Error(msg);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const updateProduct = useCallback(async (productId, payload) => {
    setIsMutating(true);
    setMutationError(null);
    try {
      const updated = await productApi.updateProduct(productId, payload);
      return updated;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to update product.');
      setMutationError(msg);
      throw new Error(msg);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const deleteProduct = useCallback(async (productId) => {
    setIsMutating(true);
    setMutationError(null);
    try {
      const result = await productApi.deleteProduct(productId);
      return result;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to delete product.');
      setMutationError(msg);
      throw new Error(msg);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const createVariant = useCallback(async (productId, payload) => {
    setIsMutating(true);
    setMutationError(null);
    try {
      const result = await productApi.createProductVariant(productId, payload);
      return result;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to create variant.');
      setMutationError(msg);
      throw new Error(msg);
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    isMutating,
    mutationError,
    createProduct,
    updateProduct,
    deleteProduct,
    createVariant,
  };
}

export default useProductMutations;
