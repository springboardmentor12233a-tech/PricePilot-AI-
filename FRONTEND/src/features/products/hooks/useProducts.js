import { useState, useEffect, useCallback, useRef } from 'react';
import { productApi } from '../services/productApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to manage products list for an active organization
 */
export function useProducts(organizationId) {
  const [products, setProducts] = useState([]);
  const [productsOrganizationId, setProductsOrganizationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorOrganizationId, setErrorOrganizationId] = useState(null);

  // Track latest organizationId to prevent race conditions
  const activeOrgRef = useRef(organizationId);
  const effectOrganizationRef = useRef(undefined);
  activeOrgRef.current = organizationId;

  const fetchProducts = useCallback(async () => {
    if (!organizationId) {
      setProducts([]);
      setProductsOrganizationId(null);
      setIsLoading(false);
      setError(null);
      setErrorOrganizationId(null);
      return [];
    }

    setIsLoading(true);
    setError(null);
    setErrorOrganizationId(null);

    try {
      const data = await productApi.getProducts(organizationId);
      // Guard against stale response if organization changed mid-flight
      if (activeOrgRef.current === organizationId) {
        const list = Array.isArray(data) ? data : data?.items || [];
        setProducts(list);
        setProductsOrganizationId(organizationId);
        return list;
      }
      return [];
    } catch (err) {
      if (activeOrgRef.current === organizationId) {
        const msg = extractErrorMessage(err, 'Unable to load products.');
        setProducts([]);
        setProductsOrganizationId(null);
        setError(msg);
        setErrorOrganizationId(organizationId);
      }
      return [];
    } finally {
      if (activeOrgRef.current === organizationId) {
        setIsLoading(false);
      }
    }
  }, [organizationId]);

  useEffect(() => {
    if (effectOrganizationRef.current === organizationId) return;
    effectOrganizationRef.current = organizationId;
    fetchProducts();
  }, [organizationId, fetchProducts]);

  const productsMatchOrganization = String(productsOrganizationId) === String(organizationId);
  const errorMatchesOrganization = String(errorOrganizationId) === String(organizationId);

  return {
    products: productsMatchOrganization ? products : [],
    isLoading: isLoading || (Boolean(organizationId) && !productsMatchOrganization && !errorMatchesOrganization),
    error: errorMatchesOrganization ? error : null,
    refresh: fetchProducts,
    setProducts,
  };
}

export default useProducts;
