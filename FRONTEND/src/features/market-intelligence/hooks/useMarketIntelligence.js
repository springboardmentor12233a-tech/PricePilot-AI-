import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useProducts } from '../../products/hooks/useProducts';
import { useCompetitors } from '../../competitors/hooks/useCompetitors';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { marketIntelligenceApi } from '../services/marketIntelligenceApi';
import {
  buildProductMarketComparison,
  detectPricingOpportunities,
} from '../utils/marketHelpers';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Hook to compose multi-source market intelligence data purely from real backend endpoints
 */
export function useMarketIntelligence() {
  const { selectedOrganizationId } = useOrganization();
  const {
    products,
    isLoading: isLoadingProducts,
    error: productsError,
    refresh: refreshProducts,
  } = useProducts(selectedOrganizationId);

  const {
    competitors,
    isLoading: isLoadingCompetitors,
    error: competitorsError,
    refresh: refreshCompetitors,
  } = useCompetitors(selectedOrganizationId);

  const [pricesMap, setPricesMap] = useState({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [pricesError, setPricesError] = useState(null);

  const activeOrgRef = useRef(selectedOrganizationId);
  activeOrgRef.current = selectedOrganizationId;

  const loadPrices = useCallback(async (productList) => {
    if (!productList || productList.length === 0) {
      setPricesMap({});
      return;
    }

    setIsLoadingPrices(true);
    setPricesError(null);

    try {
      const loaded = await marketIntelligenceApi.loadCompetitorPricesForProducts(productList);
      if (activeOrgRef.current === selectedOrganizationId) {
        setPricesMap(loaded);
      }
    } catch (err) {
      if (activeOrgRef.current === selectedOrganizationId) {
        const msg = extractErrorMessage(err, 'Unable to load competitor prices.');
        setPricesError(msg);
      }
    } finally {
      if (activeOrgRef.current === selectedOrganizationId) {
        setIsLoadingPrices(false);
      }
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (products.length > 0) {
      loadPrices(products);
    } else {
      setPricesMap({});
    }
  }, [products, loadPrices]);

  const refreshAll = useCallback(() => {
    setPricesMap({});
    refreshProducts();
    refreshCompetitors();
  }, [refreshProducts, refreshCompetitors]);

  // Build product-level market comparisons
  const comparisons = useMemo(() => {
    return products.map((product) => {
      const observations = pricesMap[product.id] || [];
      return buildProductMarketComparison(product, observations);
    });
  }, [products, pricesMap]);

  // Descriptive opportunities
  const opportunities = useMemo(() => {
    return detectPricingOpportunities(comparisons);
  }, [comparisons]);

  // Overall market statistics
  const summary = useMemo(() => {
    const trackedProducts = comparisons.filter((c) => c.hasCompetitorData);
    const aboveMarket = trackedProducts.filter((c) => c.position.status === 'above_market');
    const belowMarket = trackedProducts.filter((c) => c.position.status === 'below_market');
    const atMarket = trackedProducts.filter((c) => c.position.status === 'at_market');

    let totalObservationsCount = 0;
    Object.values(pricesMap).forEach((obsList) => {
      if (Array.isArray(obsList)) totalObservationsCount += obsList.length;
    });

    return {
      totalProducts: products.length,
      trackedProductsCount: trackedProducts.length,
      activeCompetitorsCount: competitors.filter((c) => c.is_active).length,
      totalCompetitorsCount: competitors.length,
      aboveMarketCount: aboveMarket.length,
      belowMarketCount: belowMarket.length,
      atMarketCount: atMarket.length,
      totalObservationsCount,
    };
  }, [comparisons, products, competitors, pricesMap]);

  return {
    products,
    competitors,
    comparisons,
    opportunities,
    summary,
    pricesMap,
    isLoading: isLoadingProducts || isLoadingCompetitors || isLoadingPrices,
    error: productsError || competitorsError || pricesError,
    refresh: refreshAll,
  };
}

export default useMarketIntelligence;
