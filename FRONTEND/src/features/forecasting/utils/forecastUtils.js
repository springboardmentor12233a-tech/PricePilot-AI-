/**
 * PricePilot AI — Demand Forecasting Utilities
 * Strict mathematical calculations, safe API parsing, and horizon definitions.
 * Policy: Never generates mock/synthetic data. Preserves raw backend values.
 */

import formatCurrency from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

/**
 * Standard enterprise forecast horizons
 */
export const FORECAST_HORIZONS = [
  { id: '7d', label: '7 Days', category: 'Short-term', days: 7 },
  { id: '14d', label: '14 Days', category: 'Short-term', days: 14 },
  { id: '30d', label: '30 Days', category: 'Short-term', days: 30 },
  { id: '3m', label: '3 Months', category: 'Medium-term', days: 90 },
  { id: '6m', label: '6 Months', category: 'Medium-term', days: 180 },
  { id: '12m', label: '12 Months', category: 'Long-term', days: 365 },
];

/**
 * Normalizes backend response from POST /api/v1/pricing/predict
 * Strictly preserves backend fields. Does NOT fabricate confidence or trend.
 */
export function normalizeForecastResult(data) {
  if (!data || typeof data !== 'object') return null;

  // Predicted Demand: predicted_demand or demand
  const predictedDemand = data.predicted_demand !== undefined
    ? Number(data.predicted_demand)
    : (data.demand !== undefined ? Number(data.demand) : null);

  // Evaluated Price: predicted_price or recommended_price or scenario price
  const predictedPrice = data.predicted_price !== undefined
    ? Number(data.predicted_price)
    : (data.recommended_price !== undefined
      ? Number(data.recommended_price)
      : (data.price !== undefined ? Number(data.price) : null));

  // Confidence: ONLY if explicitly returned by backend (never substitute R² or accuracy)
  let confidence = null;
  if (data.confidence !== undefined && data.confidence !== null && !isNaN(Number(data.confidence))) {
    const rawConf = Number(data.confidence);
    confidence = rawConf <= 1 && rawConf > 0 ? Math.round(rawConf * 100) : Math.round(rawConf);
  }

  // Trend: ONLY if explicitly returned by backend
  let trend = null;
  if (data.trend && typeof data.trend === 'string') {
    const t = data.trend.toLowerCase();
    if (t.includes('increase') || t.includes('up')) trend = 'increasing';
    else if (t.includes('decrease') || t.includes('down')) trend = 'decreasing';
    else if (t.includes('stable') || t.includes('flat')) trend = 'stable';
    else trend = data.trend;
  }

  // Multi-period time-series sequence if returned
  const forecastPoints = Array.isArray(data.forecast)
    ? data.forecast
    : (Array.isArray(data.points) ? data.points : null);

  const elasticity = data.elasticity !== undefined || data.price_elasticity !== undefined
    ? Number(data.elasticity || data.price_elasticity)
    : null;

  const reason = data.reason || data.explanation || data.rationale || null;

  return {
    raw: data,
    predictedDemand: predictedDemand !== null && !isNaN(predictedDemand) ? predictedDemand : null,
    predictedPrice: predictedPrice !== null && !isNaN(predictedPrice) ? predictedPrice : null,
    confidence,
    trend,
    forecastPoints,
    elasticity: elasticity !== null && !isNaN(elasticity) ? elasticity : null,
    reason,
    isPointPrediction: !forecastPoints || forecastPoints.length <= 1,
  };
}

/**
 * Safe calculation of expected revenue (Price × Demand)
 */
export function calculateExpectedRevenue(price, demand) {
  if (price === null || price === undefined || demand === null || demand === undefined) return null;
  const p = Number(price);
  const d = Number(demand);
  if (isNaN(p) || isNaN(d) || p < 0 || d < 0) return null;
  return p * d;
}

/**
 * Safe calculation of expected gross profit ((Price - Cost) × Demand)
 */
export function calculateExpectedGrossProfit(price, cost, demand) {
  if (
    price === null || price === undefined ||
    cost === null || cost === undefined ||
    demand === null || demand === undefined
  ) return null;
  const p = Number(price);
  const c = Number(cost);
  const d = Number(demand);
  if (isNaN(p) || isNaN(c) || isNaN(d)) return null;
  return (p - c) * d;
}

/**
 * Formats units for display
 */
export function formatDemandUnits(units) {
  if (units === null || units === undefined || isNaN(Number(units))) {
    return '—';
  }
  const rounded = Math.round(Number(units));
  return `${rounded.toLocaleString()} units`;
}

/**
 * Normalizes historical sales records from backend API
 */
export function normalizeSalesHistory(salesData) {
  if (!salesData) return [];
  const list = Array.isArray(salesData)
    ? salesData
    : (Array.isArray(salesData.items) ? salesData.items : (Array.isArray(salesData.sales) ? salesData.sales : []));

  return list.map((item, idx) => ({
    id: item.id || `sale-${idx}`,
    date: item.date || item.created_at || item.transaction_date || null,
    unitsSold: item.units_sold !== undefined ? Number(item.units_sold) : (item.quantity !== undefined ? Number(item.quantity) : null),
    revenue: item.revenue !== undefined ? Number(item.revenue) : (item.total_amount !== undefined ? Number(item.total_amount) : null),
    unitPrice: item.unit_price !== undefined ? Number(item.unit_price) : (item.price !== undefined ? Number(item.price) : null),
    discount: item.discount !== undefined ? Number(item.discount) : null,
    promotion: item.promotion !== undefined ? Boolean(item.promotion) : false,
  }));
}
