import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useProduct } from '../../products/hooks/useProduct';
import { useInventory } from '../../inventory/hooks/useInventory';
import { useCompetitorPrices } from '../../competitors/hooks/useCompetitorPrices';
import { revenueApi } from '../services/revenueApi';
import { normalizePredictionResult, normalizeRecommendation } from '../../pricing/utils/pricingHelpers';
import {
  calculateExpectedRevenue,
  calculateGrossProfit,
  calculateGrossMargin,
  calculateRevenueChange,
  calculateProfitChange,
} from '../utils/revenueUtils';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Custom hook for Revenue Optimization & Pricing Simulation
 */
export function useRevenueOptimization(productId, organizationId) {
  // Underlying contextual data
  const {
    product,
    isLoading: isProductLoading,
    error: productError,
    refresh: refreshProduct,
  } = useProduct(productId);

  const {
    inventory,
    isLoading: isInventoryLoading,
    refresh: refreshInventory,
  } = useInventory(productId);

  const {
    prices: competitorPrices,
    isLoading: isCompetitorsLoading,
    refresh: refreshCompetitors,
  } = useCompetitorPrices(productId);

  // Derived competitor benchmark
  const competitorData = useMemo(() => {
    if (!competitorPrices || competitorPrices.length === 0) return null;
    const latest = competitorPrices[0];
    const avg = competitorPrices.reduce(
      (sum, item) => sum + (Number(item.price ?? item.observed_price) || 0),
      0
    ) / competitorPrices.length;

    return {
      latestPrice: latest ? Number(latest.price ?? latest.observed_price) || null : null,
      marketAverage: !isNaN(avg) ? Number(avg.toFixed(2)) : null,
      count: competitorPrices.length,
      observations: competitorPrices,
    };
  }, [competitorPrices]);

  // Current baseline prediction state
  const [baselinePrediction, setBaselinePrediction] = useState(null);
  const [isBaselinePredicting, setIsBaselinePredicting] = useState(false);
  const [baselineError, setBaselineError] = useState(null);

  // Scenarios state
  const [scenarios, setScenarios] = useState([]);
  const activeProductRef = useRef(productId);
  activeProductRef.current = productId;

  // Recommendation state
  const [recommendation, setRecommendation] = useState(null);
  const [isGeneratingRec, setIsGeneratingRec] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Pricing History state
  const [pricingHistory, setPricingHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Reset state on product change
  useEffect(() => {
    setBaselinePrediction(null);
    setBaselineError(null);
    setIsBaselinePredicting(false);
    setScenarios([]);
    setRecommendation(null);
    setRecommendationError(null);
    setIsGeneratingRec(false);
    setApplySuccess(false);
  }, [productId]);

  // Fetch real pricing history when product is selected
  const fetchPricingHistory = useCallback(async () => {
    if (!productId) {
      setPricingHistory([]);
      return;
    }
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await revenueApi.getPricingHistory(productId);
      if (activeProductRef.current === productId) {
        const list = Array.isArray(response)
          ? response
          : (Array.isArray(response?.history) ? response.history : (response?.items || []));
        setPricingHistory(list);
      }
    } catch (err) {
      if (activeProductRef.current === productId) {
        setPricingHistory([]);
        setHistoryError(extractErrorMessage(err, 'Unable to load pricing history.'));
      }
    } finally {
      if (activeProductRef.current === productId) {
        setIsHistoryLoading(false);
      }
    }
  }, [productId]);

  useEffect(() => {
    fetchPricingHistory();
  }, [fetchPricingHistory]);

  // Run baseline prediction for current product price
  const runBaselinePrediction = useCallback(async () => {
    if (!product) return;

    setIsBaselinePredicting(true);
    setBaselineError(null);

    try {
      const payload = {
        product_id: product.id,
        current_price: Number(product.base_price || 0),
      };

      if (competitorData?.latestPrice) {
        payload.competitor_price = Number(competitorData.latestPrice);
      }
      if (product.discount) {
        payload.discount = Number(product.discount);
      }
      if (inventory?.current_stock !== undefined && inventory.current_stock !== null) {
        payload.inventory = Number(inventory.current_stock);
      }

      const res = await revenueApi.predictPriceScenario(payload);
      if (activeProductRef.current === product.id) {
        const normalized = normalizePredictionResult(res);
        setBaselinePrediction(normalized);
      }
    } catch (err) {
      if (activeProductRef.current === product.id) {
        setBaselineError(extractErrorMessage(err, 'Could not retrieve baseline demand prediction.'));
      }
    } finally {
      if (activeProductRef.current === product.id) {
        setIsBaselinePredicting(false);
      }
    }
  }, [product, competitorData, inventory]);

  // Calculate current baseline metrics
  const currentBaseline = useMemo(() => {
    if (!product) return null;

    const currentPrice = product.base_price !== undefined && product.base_price !== null
      ? Number(product.base_price)
      : null;
    const costPrice = product.cost_price !== undefined && product.cost_price !== null && product.cost_price !== ''
      ? Number(product.cost_price)
      : null;
    const discount = product.discount !== undefined && product.discount !== null
      ? Number(product.discount)
      : 0;

    const predictedDemand = baselinePrediction?.predictedDemand ?? null;
    const expectedRevenue = calculateExpectedRevenue(currentPrice, predictedDemand, discount);
    const expectedProfit = calculateGrossProfit(expectedRevenue, costPrice, predictedDemand);
    const grossMargin = calculateGrossMargin(expectedProfit, expectedRevenue);

    return {
      price: currentPrice,
      costPrice,
      discount,
      inventory: inventory?.current_stock ?? null,
      competitorPrice: competitorData?.latestPrice ?? null,
      predictedDemand,
      expectedRevenue,
      expectedProfit,
      grossMargin,
      currency: product.currency || 'INR',
    };
  }, [product, inventory, competitorData, baselinePrediction]);

  // Add a new candidate scenario
  const addScenario = useCallback((scenarioData) => {
    const id = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newScenario = {
      id,
      name: scenarioData.name || `Scenario ${String.fromCharCode(65 + scenarios.length)}`,
      price: Number(scenarioData.price),
      discount: scenarioData.discount !== '' && scenarioData.discount !== undefined ? Number(scenarioData.discount) : 0,
      promotion: Boolean(scenarioData.promotion),
      competitorPrice: scenarioData.competitorPrice !== '' && scenarioData.competitorPrice !== undefined ? Number(scenarioData.competitorPrice) : null,
      inventory: scenarioData.inventory !== '' && scenarioData.inventory !== undefined ? Number(scenarioData.inventory) : null,
      predictedDemand: null,
      expectedRevenue: null,
      expectedProfit: null,
      grossMargin: null,
      revenueChange: { absolute: null, percent: null },
      profitChange: { absolute: null, percent: null },
      isLoading: false,
      error: null,
      predictedAt: null,
    };

    setScenarios((prev) => [...prev, newScenario]);
    return newScenario;
  }, [scenarios.length]);

  // Remove a scenario
  const removeScenario = useCallback((scenarioId) => {
    setScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
  }, []);

  // Update a scenario field
  const updateScenario = useCallback((scenarioId, updates) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === scenarioId ? { ...s, ...updates, predictedDemand: null, expectedRevenue: null, expectedProfit: null } : s))
    );
  }, []);

  // Run real server-side prediction for a specific scenario
  const runScenarioPrediction = useCallback(async (scenarioId) => {
    if (!product) return;

    const target = scenarios.find((s) => s.id === scenarioId);
    if (!target) return;

    setScenarios((prev) =>
      prev.map((s) => (s.id === scenarioId ? { ...s, isLoading: true, error: null } : s))
    );

    try {
      const payload = {
        product_id: product.id,
        current_price: Number(target.price),
      };

      const compPrice = target.competitorPrice !== null
        ? target.competitorPrice
        : (competitorData?.latestPrice ?? null);
      if (compPrice !== null && !isNaN(Number(compPrice))) {
        payload.competitor_price = Number(compPrice);
      }

      if (target.discount !== undefined && target.discount !== null) {
        payload.discount = Number(target.discount);
      }

      if (target.promotion !== undefined) {
        payload.promotion = Boolean(target.promotion);
      }

      const invCount = target.inventory !== null
        ? target.inventory
        : (inventory?.current_stock !== undefined ? Number(inventory.current_stock) : null);
      if (invCount !== null && !isNaN(Number(invCount))) {
        payload.inventory = Number(invCount);
      }

      const response = await revenueApi.predictPriceScenario(payload);
      const normalized = normalizePredictionResult(response);
      const demand = normalized?.predictedDemand ?? null;

      const rev = calculateExpectedRevenue(target.price, demand, target.discount);
      const costPrice = product.cost_price !== undefined && product.cost_price !== null && product.cost_price !== ''
        ? Number(product.cost_price)
        : null;
      const profit = calculateGrossProfit(rev, costPrice, demand);
      const margin = calculateGrossMargin(profit, rev);

      const revChange = calculateRevenueChange(rev, currentBaseline?.expectedRevenue ?? null);
      const profChange = calculateProfitChange(profit, currentBaseline?.expectedProfit ?? null);

      setScenarios((prev) =>
        prev.map((s) => {
          if (s.id === scenarioId) {
            return {
              ...s,
              predictedDemand: demand,
              expectedRevenue: rev,
              expectedProfit: profit,
              grossMargin: margin,
              revenueChange: revChange,
              profitChange: profChange,
              isLoading: false,
              error: null,
              predictedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );
    } catch (err) {
      const errMsg = extractErrorMessage(err, 'Failed to predict demand for this scenario.');
      setScenarios((prev) =>
        prev.map((s) => (s.id === scenarioId ? { ...s, isLoading: false, error: errMsg } : s))
      );
    }
  }, [product, scenarios, competitorData, inventory, currentBaseline]);

  // Recalculate scenario deltas if current baseline changes
  useEffect(() => {
    if (!currentBaseline?.expectedRevenue && !currentBaseline?.expectedProfit) return;

    setScenarios((prev) =>
      prev.map((s) => {
        if (s.expectedRevenue !== null) {
          return {
            ...s,
            revenueChange: calculateRevenueChange(s.expectedRevenue, currentBaseline.expectedRevenue),
            profitChange: calculateProfitChange(s.expectedProfit, currentBaseline.expectedProfit),
          };
        }
        return s;
      })
    );
  }, [currentBaseline?.expectedRevenue, currentBaseline?.expectedProfit]);

  // Run prediction on all pending scenarios
  const runAllScenarios = useCallback(async () => {
    for (const s of scenarios) {
      if (s.predictedDemand === null && !s.isLoading) {
        await runScenarioPrediction(s.id);
      }
    }
  }, [scenarios, runScenarioPrediction]);

  // Generate Recommendation via POST /api/v1/pricing/recommendations
  const generateRecommendation = useCallback(async () => {
    if (!product) return;

    setIsGeneratingRec(true);
    setRecommendationError(null);
    setApplySuccess(false);

    try {
      const payload = {
        product_id: product.id,
        current_price: Number(product.base_price || 0),
      };

      if (competitorData?.latestPrice || competitorData?.marketAverage) {
        payload.competitor_price = Number(competitorData.latestPrice || competitorData.marketAverage);
      }

      if (currentBaseline?.predictedDemand) {
        payload.predicted_demand = Number(currentBaseline.predictedDemand);
      }

      const res = await revenueApi.generateRecommendation(payload);
      let primary = null;
      if (Array.isArray(res)) {
        primary = res[0] ? normalizeRecommendation(res[0]) : null;
      } else if (res && typeof res === 'object') {
        if (Array.isArray(res.recommendations)) {
          primary = res.recommendations[0] ? normalizeRecommendation(res.recommendations[0]) : null;
        } else {
          primary = normalizeRecommendation(res);
        }
      }

      setRecommendation(primary);
      return primary;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to generate recommendation from backend.');
      setRecommendationError(msg);
      throw err;
    } finally {
      setIsGeneratingRec(false);
    }
  }, [product, competitorData, currentBaseline]);

  // Apply recommendation via POST /api/v1/pricing/recommendations/{recommendation_id}/apply
  const applyRecommendation = useCallback(async (recId) => {
    if (!recId) throw new Error('Recommendation ID is required.');

    setIsApplying(true);
    try {
      const res = await revenueApi.applyRecommendation(recId);
      setApplySuccess(true);
      // Update recommendation status locally
      setRecommendation((prev) => (prev ? { ...prev, status: 'APPLIED' } : null));

      // Refresh product data & history
      await Promise.all([
        refreshProduct(),
        fetchPricingHistory(),
      ]);

      return res;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to apply pricing recommendation.');
      throw new Error(msg);
    } finally {
      setIsApplying(false);
    }
  }, [refreshProduct, fetchPricingHistory]);

  // Refresh all underlying data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshProduct(),
      refreshInventory(),
      refreshCompetitors(),
      fetchPricingHistory(),
    ]);
  }, [refreshProduct, refreshInventory, refreshCompetitors, fetchPricingHistory]);

  return {
    product,
    isProductLoading,
    productError,
    inventory,
    isInventoryLoading,
    competitorData,
    isCompetitorsLoading,
    currentBaseline,
    baselinePrediction,
    isBaselinePredicting,
    baselineError,
    runBaselinePrediction,
    scenarios,
    addScenario,
    removeScenario,
    updateScenario,
    runScenarioPrediction,
    runAllScenarios,
    recommendation,
    isGeneratingRec,
    recommendationError,
    generateRecommendation,
    applyRecommendation,
    isApplying,
    applySuccess,
    pricingHistory,
    isHistoryLoading,
    historyError,
    refreshPricingHistory: fetchPricingHistory,
    refreshAll,
  };
}

export default useRevenueOptimization;
