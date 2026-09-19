import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePricingAnalytics } from '../../pricing-analytics/hooks/usePricingAnalytics';
import { recommendationApi } from '../../recommendations/services/recommendationApi';
import { forecastApi } from '../../forecasting/services/forecastApi';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Custom hook for the Executive Dashboard.
 * Consolidates real data from pricing analytics, recommendations, and forecast APIs.
 * Strictly adheres to NO FAKE DATA policy:
 * Returns null or "Not available" when underlying records are not present.
 */
export function useExecutiveDashboard(organizationId) {
  const pricingAnalytics = usePricingAnalytics(organizationId);

  const [recommendations, setRecommendations] = useState([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState(null);

  const [latestDemandPrediction, setLatestDemandPrediction] = useState(null);
  const [isDemandLoading, setIsDemandLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  // Fetch real recommendations for active organization products if available
  const fetchRecommendations = useCallback(async () => {
    if (!organizationId) {
      setRecommendations([]);
      return;
    }

    setIsRecommendationsLoading(true);
    setRecommendationsError(null);

    try {
      // Query recommendation endpoint with empty filter to fetch current recommendations
      const res = await recommendationApi.getRecommendations({ organization_id: organizationId });
      const recList = Array.isArray(res) ? res : res?.recommendations || res?.items || [];
      setRecommendations(recList);
    } catch (err) {
      // Backend might return 404 or 422 if no recommendations generated yet
      setRecommendations([]);
      setRecommendationsError(extractErrorMessage(err, 'Recommendation analytics are unavailable from the current API.'));
    } finally {
      setIsRecommendationsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Derive products requiring attention from REAL catalog data
  const productsRequiringAttention = useMemo(() => {
    const products = pricingAnalytics.products || [];
    if (!products || products.length === 0) return [];

    const attentionList = [];

    for (const product of products) {
      const issues = [];

      // 1. Low Inventory check
      const stock = product.inventory_count ?? product.stock_quantity ?? product.inventory?.stock_quantity;
      if (stock !== undefined && stock !== null && Number(stock) <= 10) {
        issues.push({
          type: 'LOW_INVENTORY',
          label: 'Low Inventory',
          detail: `${stock} unit(s) remaining in stock`,
          severity: 'warning',
        });
      }

      // 2. Missing Cost Price check
      const costPrice = product.cost_price ?? product.cost;
      if (costPrice === null || costPrice === undefined || Number(costPrice) <= 0) {
        issues.push({
          type: 'MISSING_COST',
          label: 'Missing Cost Price',
          detail: 'Cost price not set; gross profit cannot be calculated',
          severity: 'neutral',
        });
      }

      // 3. Competitor Data Missing check
      const hasCompetitorPrice = product.competitor_price || product.competitor_count > 0;
      if (!hasCompetitorPrice) {
        issues.push({
          type: 'COMPETITOR_MISSING',
          label: 'Competitor Data Missing',
          detail: 'No matched competitor pricing observations on record',
          severity: 'neutral',
        });
      }

      // 4. Large Price Difference (if competitor price is known)
      if (product.competitor_price && product.base_price) {
        const diffPercent = Math.abs(
          ((Number(product.base_price) - Number(product.competitor_price)) / Number(product.competitor_price)) * 100
        );
        if (diffPercent > 20) {
          issues.push({
            type: 'LARGE_PRICE_DIFF',
            label: 'High Price Variance',
            detail: `${diffPercent.toFixed(1)}% variance vs competitor benchmark`,
            severity: 'warning',
          });
        }
      }

      if (issues.length > 0) {
        attentionList.push({
          product,
          issues,
        });
      }
    }

    return attentionList;
  }, [pricingAnalytics.products]);

  // Calculate competitor coverage
  const competitorCoverage = useMemo(() => {
    const products = pricingAnalytics.products || [];
    if (products.length === 0) return null;

    const matched = products.filter((p) => p.competitor_price || p.competitor_count > 0).length;
    return Math.round((matched / products.length) * 100);
  }, [pricingAnalytics.products]);

  // Refresh all dashboard data
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([
        pricingAnalytics.refresh(),
        fetchRecommendations(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, pricingAnalytics, fetchRecommendations]);

  return {
    ...pricingAnalytics,
    recommendations,
    isRecommendationsLoading,
    recommendationsError,
    productsRequiringAttention,
    competitorCoverage,
    latestDemandPrediction,
    isDemandLoading,
    refreshDashboard: handleRefresh,
    isRefreshing: refreshing || pricingAnalytics.isLoading,
  };
}
