/**
 * PricePilot AI — usePricingAnalytics Hook
 * Orchestrates data retrieval, transparent local filtering, metric calculations,
 * and chart dataset preparation from existing backend APIs.
 *
 * Adheres strictly to NO FAKE DATA policy:
 * Returns null or empty sets when underlying data is absent.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { pricingAnalyticsApi } from '../services/pricingAnalyticsApi';
import {
  calculateAverage,
  calculateSum,
  calculatePercentageChange,
  calculateGrossProfit,
  calculateGrossMargin,
  calculatePriceDifference,
} from '../utils/analyticsUtils';
import { extractErrorMessage } from '../../../utils/errorHandler';

export function usePricingAnalytics(organizationId, initialProductId = null) {
  // Primary datasets
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [salesAnalytics, setSalesAnalytics] = useState(null);

  // Selected Product & its related observations
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [pricingHistory, setPricingHistory] = useState([]);
  const [competitorPrices, setCompetitorPrices] = useState([]);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isCompetitorLoading, setIsCompetitorLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // 'all', '7d', '30d', '90d', '180d', '365d'
  const [selectedCompetitorId, setSelectedCompetitorId] = useState('all');
  const [pricingStatus, setPricingStatus] = useState('all'); // 'all', 'current', 'historical', 'recommended'
  const [searchQuery, setSearchQuery] = useState('');

  // Keep track of active org to prevent race conditions
  const activeOrgRef = useRef(organizationId);
  activeOrgRef.current = organizationId;

  /**
   * Fetch primary organization catalog and sales analytics
   */
  const fetchOrganizationData = useCallback(async () => {
    if (!organizationId) {
      setProducts([]);
      setCategories([]);
      setCompetitors([]);
      setSalesAnalytics(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [productsRes, categoriesRes, competitorsRes, salesRes] = await Promise.all([
        pricingAnalyticsApi.getProducts(organizationId).catch((err) => {
          console.warn('Failed to load products:', err);
          return [];
        }),
        pricingAnalyticsApi.getCategories(organizationId).catch(() => []),
        pricingAnalyticsApi.getCompetitors(organizationId).catch(() => []),
        pricingAnalyticsApi.getSalesAnalytics(organizationId).catch((err) => {
          console.warn('Sales analytics unavailable:', err);
          return null;
        }),
      ]);

      if (activeOrgRef.current === organizationId) {
        const prodList = Array.isArray(productsRes)
          ? productsRes
          : productsRes?.items || [];
        const catList = Array.isArray(categoriesRes)
          ? categoriesRes
          : categoriesRes?.items || [];
        const compList = Array.isArray(competitorsRes)
          ? competitorsRes
          : competitorsRes?.items || [];

        setProducts(prodList);
        setCategories(catList);
        setCompetitors(compList);
        setSalesAnalytics(salesRes);
        setLastUpdated(new Date().toISOString());

        // Default to first product if none selected yet
        if (!selectedProductId && prodList.length > 0) {
          setSelectedProductId(prodList[0].id);
        }
      }
    } catch (err) {
      if (activeOrgRef.current === organizationId) {
        setError(extractErrorMessage(err, 'Unable to load organization analytics data.'));
      }
    } finally {
      if (activeOrgRef.current === organizationId) {
        setIsLoading(false);
      }
    }
  }, [organizationId, selectedProductId]);

  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);

  /**
   * Fetch product-specific pricing history and competitor price observations
   */
  useEffect(() => {
    if (!selectedProductId) {
      setPricingHistory([]);
      setCompetitorPrices([]);
      return;
    }

    let isMounted = true;
    setIsHistoryLoading(true);
    setIsCompetitorLoading(true);
    setHistoryError(null);

    Promise.all([
      pricingAnalyticsApi.getPricingHistory(selectedProductId).catch((err) => {
        console.warn('Failed to load pricing history:', err);
        return [];
      }),
      pricingAnalyticsApi.getCompetitorPrices(selectedProductId).catch((err) => {
        console.warn('Failed to load competitor prices:', err);
        return [];
      }),
    ])
      .then(([historyRes, compRes]) => {
        if (!isMounted) return;
        const histList = Array.isArray(historyRes)
          ? historyRes
          : Array.isArray(historyRes?.history)
          ? historyRes.history
          : historyRes?.items || [];

        const compList = Array.isArray(compRes)
          ? compRes
          : Array.isArray(compRes?.prices)
          ? compRes.prices
          : compRes?.items || [];

        setPricingHistory(histList);
        setCompetitorPrices(compList);
      })
      .catch((err) => {
        if (!isMounted) return;
        setHistoryError(extractErrorMessage(err, 'Failed to load product pricing observations.'));
      })
      .finally(() => {
        if (!isMounted) return;
        setIsHistoryLoading(false);
        setIsCompetitorLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProductId]);

  // Derived Selected Product Object
  const selectedProduct = useMemo(() => {
    if (!selectedProductId || products.length === 0) return null;
    return products.find((p) => String(p.id) === String(selectedProductId)) || null;
  }, [selectedProductId, products]);

  /**
   * Date Range Boundary Filter
   */
  const dateRangeThreshold = useMemo(() => {
    if (dateRange === 'all') return null;
    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '365d': 365,
    }[dateRange];

    if (!days) return null;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }, [dateRange]);

  /**
   * Filtered Products List
   */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const catId = p.category_id || p.category?.id;
        if (String(catId) !== String(selectedCategory)) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesSku = p.sku?.toLowerCase().includes(q);
        if (!matchesName && !matchesSku) return false;
      }

      // Date range filter on product creation/update if applicable
      if (dateRangeThreshold) {
        const prodDate = p.updated_at || p.created_at;
        if (prodDate && new Date(prodDate) < dateRangeThreshold) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery, dateRangeThreshold]);

  /**
   * Filtered Pricing History for Selected Product
   */
  const filteredPricingHistory = useMemo(() => {
    if (!Array.isArray(pricingHistory)) return [];

    return pricingHistory
      .filter((record) => {
        // Date range filter
        if (dateRangeThreshold) {
          const d = record.created_at || record.timestamp || record.date;
          if (d && new Date(d) < dateRangeThreshold) return false;
        }

        // Status filter
        if (pricingStatus !== 'all') {
          const status = (record.status || '').toLowerCase();
          const source = (record.source || '').toLowerCase();
          if (pricingStatus === 'current' && status !== 'active') return false;
          if (pricingStatus === 'historical' && status === 'active') return false;
          if (
            pricingStatus === 'recommended' &&
            !record.recommendation_id &&
            !source.includes('recommend')
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.created_at || a.timestamp || a.date || 0);
        const db = new Date(b.created_at || b.timestamp || b.date || 0);
        return da - db; // Chronological
      });
  }, [pricingHistory, dateRangeThreshold, pricingStatus]);

  /**
   * Filtered Competitor Prices for Selected Product
   */
  const filteredCompetitorPrices = useMemo(() => {
    if (!Array.isArray(competitorPrices)) return [];

    return competitorPrices.filter((cp) => {
      // Competitor ID filter
      if (selectedCompetitorId !== 'all') {
        const cId = cp.competitor_id || cp.competitor?.id;
        if (String(cId) !== String(selectedCompetitorId)) return false;
      }

      // Date filter
      if (dateRangeThreshold) {
        const d = cp.observed_at || cp.timestamp || cp.created_at;
        if (d && new Date(d) < dateRangeThreshold) return false;
      }

      return true;
    });
  }, [competitorPrices, selectedCompetitorId, dateRangeThreshold]);

  /**
   * KPI / Summary Calculations
   */
  const summaryMetrics = useMemo(() => {
    const productsCount = filteredProducts.length;

    // Prices
    const prices = filteredProducts
      .map((p) => (p.base_price !== null && p.base_price !== undefined ? Number(p.base_price) : null))
      .filter((p) => p !== null && !isNaN(p));
    const averagePrice = calculateAverage(prices);

    // Discounts
    const discounts = filteredProducts
      .map((p) => (p.discount !== null && p.discount !== undefined ? Number(p.discount) : null))
      .filter((d) => d !== null && !isNaN(d));
    const averageDiscount = discounts.length > 0 ? calculateAverage(discounts) : null;

    // Competitor Prices
    const compObsPrices = filteredCompetitorPrices
      .map((cp) => (cp.price !== null && cp.price !== undefined ? Number(cp.price) : null))
      .filter((p) => p !== null && !isNaN(p));
    const averageCompetitorPrice = compObsPrices.length > 0 ? calculateAverage(compObsPrices) : null;

    // Revenue: from sales analytics if available
    let totalRevenue = null;
    if (salesAnalytics && typeof salesAnalytics === 'object') {
      if (salesAnalytics.total_revenue !== undefined && salesAnalytics.total_revenue !== null) {
        totalRevenue = Number(salesAnalytics.total_revenue);
      } else if (salesAnalytics.revenue !== undefined && salesAnalytics.revenue !== null) {
        totalRevenue = Number(salesAnalytics.revenue);
      }
    }

    // Cost & Profitability:
    // Only calculate if real cost price and sales/units or revenue are available
    let totalGrossProfit = null;
    let averageGrossMargin = null;

    if (totalRevenue !== null && selectedProduct?.cost_price !== undefined && selectedProduct?.cost_price !== null) {
      const unitsSold = salesAnalytics?.total_sales || salesAnalytics?.units_sold || null;
      if (unitsSold !== null) {
        const cogs = Number(selectedProduct.cost_price) * Number(unitsSold);
        totalGrossProfit = calculateGrossProfit(totalRevenue, cogs);
        averageGrossMargin = calculateGrossMargin(totalGrossProfit, totalRevenue);
      }
    }

    // Price change: from selected product's earliest vs latest history observation
    let priceChangePct = null;
    if (filteredPricingHistory.length >= 2) {
      const first = filteredPricingHistory[0];
      const last = filteredPricingHistory[filteredPricingHistory.length - 1];
      const p1 = first.price ?? first.new_price ?? first.recommended_price;
      const p2 = last.price ?? last.new_price ?? last.recommended_price;
      priceChangePct = calculatePercentageChange(p2, p1);
    }

    return {
      productsCount,
      averagePrice,
      averageDiscount,
      averageCompetitorPrice,
      totalRevenue,
      totalGrossProfit,
      averageGrossMargin,
      priceChangePct,
      currency: selectedProduct?.currency || 'INR',
    };
  }, [
    filteredProducts,
    filteredCompetitorPrices,
    filteredPricingHistory,
    salesAnalytics,
    selectedProduct,
  ]);

  /**
   * Revenue Performance Chart Data (Line/Area)
   * Uses real sales analytics data points
   */
  const revenueChartData = useMemo(() => {
    if (!salesAnalytics) return [];

    const trend =
      salesAnalytics.sales_trend ||
      salesAnalytics.daily_sales ||
      salesAnalytics.revenue_by_date ||
      salesAnalytics.timeline ||
      [];

    if (!Array.isArray(trend) || trend.length === 0) {
      // If salesAnalytics only has an aggregate total_revenue
      if (salesAnalytics.total_revenue !== undefined && salesAnalytics.total_revenue !== null) {
        return [
          {
            date: 'Aggregate Period',
            revenue: Number(salesAnalytics.total_revenue),
            isAggregate: true,
          },
        ];
      }
      return [];
    }

    return trend.map((point) => {
      const dateStr = point.date || point.timestamp || point.period || 'Unknown';
      const revenue = point.revenue !== undefined ? Number(point.revenue) : Number(point.amount || 0);
      const units = point.units !== undefined ? Number(point.units) : (point.sales !== undefined ? Number(point.sales) : null);

      return {
        date: dateStr,
        revenue: isNaN(revenue) ? 0 : revenue,
        units: units !== null && !isNaN(units) ? units : null,
      };
    });
  }, [salesAnalytics]);

  /**
   * Price History Chart Data (Line)
   * Chronological price observations for the selected product
   */
  const priceHistoryChartData = useMemo(() => {
    if (!filteredPricingHistory || filteredPricingHistory.length === 0) {
      // If no history, but product has current price, provide single point
      if (selectedProduct && selectedProduct.base_price !== undefined) {
        return [
          {
            date: 'Current',
            productPrice: Number(selectedProduct.base_price),
            competitorPrice: filteredCompetitorPrices[0]?.price ? Number(filteredCompetitorPrices[0].price) : null,
          },
        ];
      }
      return [];
    }

    // Map chronological history records
    return filteredPricingHistory.map((rec, index) => {
      const dateRaw = rec.created_at || rec.timestamp || rec.date;
      const dateLabel = dateRaw
        ? new Date(dateRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `Record ${index + 1}`;

      const price = rec.price ?? rec.new_price ?? rec.recommended_price;

      // Check if there is a competitor observation near this date
      let compPrice = null;
      if (dateRaw && filteredCompetitorPrices.length > 0) {
        const recDate = new Date(dateRaw).toDateString();
        const matchedComp = filteredCompetitorPrices.find((cp) => {
          const cpDate = new Date(cp.observed_at || cp.timestamp || cp.created_at).toDateString();
          return cpDate === recDate;
        });
        if (matchedComp) compPrice = Number(matchedComp.price);
      }

      return {
        date: dateLabel,
        productPrice: price !== null && price !== undefined ? Number(price) : null,
        competitorPrice: compPrice,
        source: rec.source || 'Catalog Update',
      };
    });
  }, [filteredPricingHistory, selectedProduct, filteredCompetitorPrices]);

  /**
   * Demand vs Price Scatter Data
   * Price vs Units Sold / Demand
   */
  const demandVsPriceData = useMemo(() => {
    const points = [];

    // From sales analytics products if returned
    if (salesAnalytics && Array.isArray(salesAnalytics.products)) {
      salesAnalytics.products.forEach((sp) => {
        const price = sp.price ?? sp.current_price ?? sp.base_price;
        const units = sp.units_sold ?? sp.units ?? sp.demand;
        if (price !== undefined && units !== undefined && !isNaN(Number(price)) && !isNaN(Number(units))) {
          points.push({
            price: Number(price),
            unitsSold: Number(units),
            productName: sp.name || sp.product_name || `Product ${sp.id || ''}`,
          });
        }
      });
    }

    // From pricing history records if demand or units sold is tracked
    filteredPricingHistory.forEach((rec) => {
      const price = rec.price ?? rec.new_price;
      const demand = rec.demand ?? rec.units_sold ?? rec.predicted_demand;
      if (price !== undefined && demand !== undefined && !isNaN(Number(price)) && !isNaN(Number(demand))) {
        points.push({
          price: Number(price),
          unitsSold: Number(demand),
          productName: selectedProduct?.name || 'Selected Item',
        });
      }
    });

    return points;
  }, [salesAnalytics, filteredPricingHistory, selectedProduct]);

  /**
   * Competitor Positioning Data
   * Our Price vs Competitor Prices
   */
  const competitorPositionData = useMemo(() => {
    if (!selectedProduct || filteredCompetitorPrices.length === 0) {
      return [];
    }

    const ourPrice = Number(selectedProduct.base_price || 0);

    return filteredCompetitorPrices.map((cp) => {
      const compPrice = Number(cp.price || 0);
      const diff = calculatePriceDifference(ourPrice, compPrice);
      const diffPct = calculatePercentageChange(ourPrice, compPrice);

      let position = 'Equal';
      if (diff > 0) position = 'Above competitor';
      else if (diff < 0) position = 'Below competitor';

      const competitorObj = competitors.find((c) => String(c.id) === String(cp.competitor_id || cp.competitor?.id));
      const compName = cp.competitor_name || competitorObj?.name || `Competitor ${cp.competitor_id || ''}`;

      return {
        competitorName: compName,
        ourPrice,
        competitorPrice: compPrice,
        priceDifference: diff,
        percentageDifference: diffPct,
        position,
        observedAt: cp.observed_at || cp.timestamp || cp.created_at,
      };
    });
  }, [selectedProduct, filteredCompetitorPrices, competitors]);

  /**
   * Discount Analysis Data (Grouped Brackets)
   * Derived from real product catalog discounts
   */
  const discountAnalysisData = useMemo(() => {
    const bins = [
      { label: '0–5%', min: 0, max: 5, count: 0, totalPrice: 0 },
      { label: '6–10%', min: 6, max: 10, count: 0, totalPrice: 0 },
      { label: '11–15%', min: 11, max: 15, count: 0, totalPrice: 0 },
      { label: '16–20%', min: 16, max: 20, count: 0, totalPrice: 0 },
      { label: '21%+', min: 21, max: 100, count: 0, totalPrice: 0 },
    ];

    let hasDiscounts = false;

    filteredProducts.forEach((p) => {
      const discount = p.discount !== undefined && p.discount !== null ? Number(p.discount) : 0;
      const price = Number(p.base_price || 0);

      if (discount > 0) hasDiscounts = true;

      const targetBin = bins.find((b) => discount >= b.min && discount <= b.max);
      if (targetBin) {
        targetBin.count += 1;
        targetBin.totalPrice += price;
      }
    });

    if (!hasDiscounts) return [];

    return bins.map((b) => ({
      discountBracket: b.label,
      productCount: b.count,
      averagePrice: b.count > 0 ? b.totalPrice / b.count : 0,
    }));
  }, [filteredProducts]);

  /**
   * Recommendation Activity Analytics
   */
  const recommendationStats = useMemo(() => {
    // Count recommendations recorded in pricing history
    const recRecords = pricingHistory.filter(
      (r) => r.recommendation_id || (r.source && r.source.toLowerCase().includes('recommend'))
    );

    const appliedCount = recRecords.filter(
      (r) => (r.status || '').toLowerCase() === 'applied' || (r.status || '').toLowerCase() === 'active'
    ).length;

    return {
      hasRecommendationData: recRecords.length > 0,
      totalRecommendations: recRecords.length,
      appliedRecommendations: appliedCount,
      pendingRecommendations: recRecords.filter((r) => (r.status || '').toLowerCase() === 'pending').length,
    };
  }, [pricingHistory]);

  /**
   * Descriptive Insights (Observational statements strictly derived from real data)
   */
  const insights = useMemo(() => {
    const list = [];

    // Latest price observation
    if (selectedProduct && selectedProduct.base_price !== undefined) {
      list.push({
        type: 'price',
        text: `Product price was ₹${Number(selectedProduct.base_price).toLocaleString('en-IN')} on the latest available observation.`,
      });
    }

    // Average discount
    if (summaryMetrics.averageDiscount !== null) {
      list.push({
        type: 'discount',
        text: `Average discount across filtered catalog is ${summaryMetrics.averageDiscount.toFixed(1)}%.`,
      });
    }

    // Latest competitor comparison
    if (competitorPositionData.length > 0) {
      const latestComp = competitorPositionData[0];
      const diffVal = Math.abs(latestComp.priceDifference);
      const formattedDiff = `₹${diffVal.toLocaleString('en-IN')}`;
      if (latestComp.priceDifference > 0) {
        list.push({
          type: 'competitor',
          text: `Current price is ${formattedDiff} above the latest observation for ${latestComp.competitorName}.`,
        });
      } else if (latestComp.priceDifference < 0) {
        list.push({
          type: 'competitor',
          text: `Current price is ${formattedDiff} below the latest observation for ${latestComp.competitorName}.`,
        });
      } else {
        list.push({
          type: 'competitor',
          text: `Current price is identical to the latest observation for ${latestComp.competitorName}.`,
        });
      }
    }

    // Price change trend
    if (summaryMetrics.priceChangePct !== null) {
      const direction = summaryMetrics.priceChangePct >= 0 ? 'increased' : 'decreased';
      list.push({
        type: 'trend',
        text: `Observed product price ${direction} by ${Math.abs(summaryMetrics.priceChangePct).toFixed(1)}% across recorded history.`,
      });
    }

    // Sales/revenue insight
    if (summaryMetrics.totalRevenue !== null) {
      list.push({
        type: 'revenue',
        text: `Total tracked gross revenue across organization sales stream is ₹${summaryMetrics.totalRevenue.toLocaleString('en-IN')}.`,
      });
    }

    return list;
  }, [selectedProduct, summaryMetrics, competitorPositionData]);

  return {
    // Primary Data
    products,
    filteredProducts,
    categories,
    competitors,
    salesAnalytics,
    selectedProductId,
    setSelectedProductId,
    selectedProduct,
    pricingHistory: filteredPricingHistory,
    rawPricingHistory: pricingHistory,
    competitorPrices: filteredCompetitorPrices,

    // Loading & Error States
    isLoading,
    isHistoryLoading,
    isCompetitorLoading,
    error,
    historyError,
    lastUpdated,
    refresh: fetchOrganizationData,

    // Filters
    selectedCategory,
    setSelectedCategory,
    dateRange,
    setDateRange,
    selectedCompetitorId,
    setSelectedCompetitorId,
    pricingStatus,
    setPricingStatus,
    searchQuery,
    setSearchQuery,

    // Metrics & Datasets
    summaryMetrics,
    revenueChartData,
    priceHistoryChartData,
    demandVsPriceData,
    competitorPositionData,
    discountAnalysisData,
    recommendationStats,
    insights,
  };
}

export default usePricingAnalytics;
