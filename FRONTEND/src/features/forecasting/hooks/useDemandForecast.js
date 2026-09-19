import { useState, useEffect, useCallback, useRef } from 'react';
import { useProduct } from '../../products/hooks/useProduct';
import { useInventory } from '../../inventory/hooks/useInventory';
import { useCompetitorPrices } from '../../competitors/hooks/useCompetitorPrices';
import { forecastApi } from '../services/forecastApi';
import { normalizeForecastResult, normalizeSalesHistory } from '../utils/forecastUtils';
import { extractErrorMessage } from '../../../utils/errorHandler';

/**
 * Custom hook to manage demand forecasting state and API interactions.
 * Integrates real product context, inventory signals, and competitive benchmarks.
 */
export function useDemandForecast(productId, organizationId) {
  // Underlying contextual data
  const { product, isLoading: isProductLoading, error: productError, refresh: refreshProduct } = useProduct(productId);
  const { inventory, isLoading: isInventoryLoading, refresh: refreshInventory } = useInventory(productId);
  const { prices: competitorPrices, isLoading: isCompetitorLoading, refresh: refreshCompetitors } = useCompetitorPrices(productId);

  const competitorData = {
    prices: competitorPrices,
    latestPrice: competitorPrices?.length > 0
      ? Number(competitorPrices[0].price ?? competitorPrices[0].observed_price ?? 0) || null
      : null,
    marketAverage: competitorPrices?.length > 0
      ? competitorPrices.reduce((acc, c) => acc + (Number(c.price ?? c.observed_price) || 0), 0) / competitorPrices.length
      : null,
  };

  // Forecasting state
  const [selectedHorizon, setSelectedHorizon] = useState('30d');
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  // Historical Sales Data
  const [historicalSales, setHistoricalSales] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const activeProductRef = useRef(productId);
  activeProductRef.current = productId;

  // Clear forecast when product changes
  useEffect(() => {
    setForecast(null);
    setError(null);
    setStatus('idle');
    setIsLoading(false);
  }, [productId]);

  // Fetch real historical sales for product/organization
  const fetchHistoricalSales = useCallback(async () => {
    if (!productId && !organizationId) {
      setHistoricalSales([]);
      return;
    }

    setIsHistoryLoading(true);
    setHistoryError(null);

    try {
      // First attempt product-specific sales transactions
      let salesData = null;
      try {
        salesData = await forecastApi.getSalesTransactions({ product_id: productId });
      } catch (txErr) {
        // Fallback to organization-level analytics if transaction query fails
        if (organizationId) {
          salesData = await forecastApi.getSalesAnalytics(organizationId, { product_id: productId });
        }
      }

      if (activeProductRef.current === productId) {
        const normalized = normalizeSalesHistory(salesData);
        setHistoricalSales(normalized);
      }
    } catch (err) {
      if (activeProductRef.current === productId) {
        // Graceful handling — sales might not yet have transactions
        setHistoricalSales([]);
        setHistoryError(extractErrorMessage(err, 'Historical sales data not available.'));
      }
    } finally {
      if (activeProductRef.current === productId) {
        setIsHistoryLoading(false);
      }
    }
  }, [productId, organizationId]);

  useEffect(() => {
    if (productId) {
      fetchHistoricalSales();
    } else {
      setHistoricalSales([]);
    }
  }, [productId, fetchHistoricalSales]);

  // Forecast request executor
  const generateForecast = useCallback(async (overrides = {}) => {
    if (!productId) {
      const msg = 'Please select a product before generating a forecast.';
      setError(msg);
      setStatus('error');
      throw new Error(msg);
    }

    // Input Validation
    const rawPrice = overrides.scenarioPrice !== undefined && overrides.scenarioPrice !== ''
      ? Number(overrides.scenarioPrice)
      : Number(product?.base_price);

    if (isNaN(rawPrice) || rawPrice <= 0) {
      const msg = 'A valid target price greater than 0 is required.';
      setError(msg);
      setStatus('error');
      throw new Error(msg);
    }

    if (overrides.discount !== undefined && overrides.discount !== '') {
      const d = Number(overrides.discount);
      if (isNaN(d) || d < 0 || d > 100) {
        const msg = 'Discount must be a valid percentage between 0 and 100.';
        setError(msg);
        setStatus('error');
        throw new Error(msg);
      }
    }

    if (overrides.inventory !== undefined && overrides.inventory !== '') {
      const inv = Number(overrides.inventory);
      if (isNaN(inv) || inv < 0) {
        const msg = 'Inventory level cannot be negative.';
        setError(msg);
        setStatus('error');
        throw new Error(msg);
      }
    }

    if (overrides.competitorPrice !== undefined && overrides.competitorPrice !== '') {
      const cp = Number(overrides.competitorPrice);
      if (isNaN(cp) || cp <= 0) {
        const msg = 'Competitor price must be greater than 0 if provided.';
        setError(msg);
        setStatus('error');
        throw new Error(msg);
      }
    }

    // Construct clean payload strictly matching FastAPI XGBoost schema
    const payload = {
      product_id: productId,
      current_price: rawPrice,
    };

    const competitorPrice = overrides.competitorPrice !== undefined && overrides.competitorPrice !== ''
      ? Number(overrides.competitorPrice)
      : (competitorData?.latestPrice || competitorData?.marketAverage || null);

    if (competitorPrice !== null && !isNaN(Number(competitorPrice))) {
      payload.competitor_price = Number(competitorPrice);
    }

    if (overrides.discount !== undefined && overrides.discount !== '' && !isNaN(Number(overrides.discount))) {
      payload.discount = Number(overrides.discount);
    }

    if (overrides.promotion !== undefined) {
      payload.promotion = Boolean(overrides.promotion);
    }

    const inventoryCount = overrides.inventory !== undefined && overrides.inventory !== ''
      ? Number(overrides.inventory)
      : (inventory?.current_stock !== undefined ? Number(inventory.current_stock) : null);

    if (inventoryCount !== null && !isNaN(inventoryCount)) {
      payload.inventory = inventoryCount;
    }

    setIsLoading(true);
    setError(null);
    setStatus('loading');

    try {
      const response = await forecastApi.predictDemand(payload);
      if (activeProductRef.current === productId) {
        const normalized = normalizeForecastResult(response);
        setForecast(normalized);
        setStatus('success');
        return normalized;
      }
      return null;
    } catch (err) {
      if (activeProductRef.current === productId) {
        const msg = extractErrorMessage(err, 'Demand prediction service is temporarily unavailable.');
        setError(msg);
        setStatus('error');
      }
      throw err;
    } finally {
      if (activeProductRef.current === productId) {
        setIsLoading(false);
      }
    }
  }, [productId, product, inventory, competitorData]);

  const resetForecast = useCallback(() => {
    setForecast(null);
    setError(null);
    setStatus('idle');
    setIsLoading(false);
  }, []);

  const refreshAll = useCallback(() => {
    refreshProduct();
    refreshInventory();
    refreshCompetitors();
    fetchHistoricalSales();
  }, [refreshProduct, refreshInventory, refreshCompetitors, fetchHistoricalSales]);

  return {
    product,
    inventory,
    competitorData,
    isContextLoading: isProductLoading || isInventoryLoading || isCompetitorLoading,
    productError,
    // Forecast state
    forecast,
    isLoading,
    error,
    status,
    selectedHorizon,
    setSelectedHorizon,
    generateForecast,
    resetForecast,
    // Historical sales
    historicalSales,
    isHistoryLoading,
    historyError,
    refreshAll,
  };
}

export default useDemandForecast;
