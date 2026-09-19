/**
 * PricePilot AI — Revenue Optimization & Pricing Simulation Utilities
 * Real business calculations without fake formulas or fabricated metrics.
 */

import formatCurrency from '../../../utils/formatCurrency';

/**
 * Calculate Expected Revenue:
 * Expected Revenue = Candidate Price × Expected Demand × (1 - Discount / 100)
 *
 * @param {number|string} price - Unit candidate price
 * @param {number|string} demand - Predicted units demand
 * @param {number|string} discount - Percentage discount (0-100)
 * @returns {number|null} Expected revenue or null if required values are missing
 */
export function calculateExpectedRevenue(price, demand, discount = 0) {
  if (price === null || price === undefined || price === '' || isNaN(Number(price))) {
    return null;
  }
  if (demand === null || demand === undefined || demand === '' || isNaN(Number(demand))) {
    return null;
  }

  const p = Number(price);
  const d = Number(demand);
  const disc = discount !== null && discount !== undefined && !isNaN(Number(discount))
    ? Math.max(0, Math.min(100, Number(discount)))
    : 0;

  if (p < 0 || d < 0) return null;

  const revenue = p * d * (1 - disc / 100);
  return Number(revenue.toFixed(2));
}

/**
 * Calculate Expected Gross Profit:
 * Expected Gross Profit = Expected Revenue - (Cost Price × Expected Demand)
 *
 * @param {number|null} expectedRevenue - Calculated expected revenue
 * @param {number|string} costPrice - Unit acquisition/production cost
 * @param {number|string} demand - Predicted units demand
 * @returns {number|null} Expected gross profit or null if cost is unavailable
 */
export function calculateGrossProfit(expectedRevenue, costPrice, demand) {
  if (expectedRevenue === null || expectedRevenue === undefined || isNaN(Number(expectedRevenue))) {
    return null;
  }
  if (costPrice === null || costPrice === undefined || costPrice === '' || isNaN(Number(costPrice))) {
    // Cannot calculate without real cost price — do NOT estimate cost
    return null;
  }
  if (demand === null || demand === undefined || demand === '' || isNaN(Number(demand))) {
    return null;
  }

  const cost = Number(costPrice);
  const d = Number(demand);
  if (cost < 0 || d < 0) return null;

  const totalCost = cost * d;
  const profit = Number(expectedRevenue) - totalCost;
  return Number(profit.toFixed(2));
}

/**
 * Calculate Gross Margin %:
 * Margin % = (Expected Gross Profit / Expected Revenue) × 100
 *
 * @param {number|null} expectedProfit - Calculated gross profit
 * @param {number|null} expectedRevenue - Calculated expected revenue
 * @returns {number|null} Gross margin percentage or null
 */
export function calculateGrossMargin(expectedProfit, expectedRevenue) {
  if (expectedProfit === null || expectedProfit === undefined || isNaN(Number(expectedProfit))) {
    return null;
  }
  if (expectedRevenue === null || expectedRevenue === undefined || isNaN(Number(expectedRevenue))) {
    return null;
  }

  const rev = Number(expectedRevenue);
  if (rev <= 0) return null;

  const margin = (Number(expectedProfit) / rev) * 100;
  return Number(margin.toFixed(2));
}

/**
 * Calculate Revenue Change:
 * Absolute and percentage difference compared to baseline current revenue
 *
 * @param {number|null} scenarioRevenue
 * @param {number|null} currentRevenue
 * @returns {{ absolute: number|null, percent: number|null }}
 */
export function calculateRevenueChange(scenarioRevenue, currentRevenue) {
  if (scenarioRevenue === null || currentRevenue === null ||
      isNaN(Number(scenarioRevenue)) || isNaN(Number(currentRevenue))) {
    return { absolute: null, percent: null };
  }

  const sRev = Number(scenarioRevenue);
  const cRev = Number(currentRevenue);

  const diff = sRev - cRev;
  let percent = null;
  if (cRev > 0) {
    percent = (diff / cRev) * 100;
  }

  return {
    absolute: Number(diff.toFixed(2)),
    percent: percent !== null ? Number(percent.toFixed(2)) : null,
  };
}

/**
 * Calculate Profit Change:
 * Absolute and percentage difference compared to baseline current profit
 *
 * @param {number|null} scenarioProfit
 * @param {number|null} currentProfit
 * @returns {{ absolute: number|null, percent: number|null }}
 */
export function calculateProfitChange(scenarioProfit, currentProfit) {
  if (scenarioProfit === null || currentProfit === null ||
      isNaN(Number(scenarioProfit)) || isNaN(Number(currentProfit))) {
    return { absolute: null, percent: null };
  }

  const sProf = Number(scenarioProfit);
  const cProf = Number(currentProfit);

  const diff = sProf - cProf;
  let percent = null;
  if (cProf !== 0) {
    percent = (diff / Math.abs(cProf)) * 100;
  }

  return {
    absolute: Number(diff.toFixed(2)),
    percent: percent !== null ? Number(percent.toFixed(2)) : null,
  };
}

/**
 * Format percentage with positive/negative indicator
 *
 * @param {number|null} value
 * @param {boolean} showSign
 * @returns {string}
 */
export function formatPercentage(value, showSign = false) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '—';
  }
  const num = Number(value);
  const formatted = `${Math.abs(num).toFixed(1)}%`;
  if (showSign) {
    if (num > 0) return `+${formatted}`;
    if (num < 0) return `-${formatted}`;
  }
  return formatted;
}

/**
 * Format delta currency with +/- sign
 *
 * @param {number|null} amount
 * @param {string} currency
 * @returns {string}
 */
export function formatCurrencyDelta(amount, currency = 'INR') {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '—';
  }
  const num = Number(amount);
  const base = formatCurrency(Math.abs(num), currency);
  if (num > 0) return `+${base}`;
  if (num < 0) return `-${base}`;
  return base;
}

/**
 * Validate candidate pricing scenario input
 *
 * @param {object} input
 * @returns {{ isValid: boolean, errors: object }}
 */
export function validateScenarioInput(input) {
  const errors = {};

  // Price validation: must be numeric and > 0
  if (input.price === undefined || input.price === null || String(input.price).trim() === '') {
    errors.price = 'Candidate price is required.';
  } else {
    const p = Number(input.price);
    if (isNaN(p)) {
      errors.price = 'Price must be a valid number.';
    } else if (p <= 0) {
      errors.price = 'Price must be greater than zero.';
    } else if (!isFinite(p)) {
      errors.price = 'Price cannot be infinite.';
    }
  }

  // Discount validation: optional, but if given must be 0-100
  if (input.discount !== undefined && input.discount !== null && String(input.discount).trim() !== '') {
    const d = Number(input.discount);
    if (isNaN(d)) {
      errors.discount = 'Discount must be a number.';
    } else if (d < 0 || d > 100) {
      errors.discount = 'Discount must be between 0% and 100%.';
    }
  }

  // Inventory validation: optional, must be >= 0
  if (input.inventory !== undefined && input.inventory !== null && String(input.inventory).trim() !== '') {
    const inv = Number(input.inventory);
    if (isNaN(inv)) {
      errors.inventory = 'Inventory must be a number.';
    } else if (inv < 0) {
      errors.inventory = 'Inventory cannot be negative.';
    }
  }

  // Competitor price validation: optional, must be >= 0
  if (input.competitorPrice !== undefined && input.competitorPrice !== null && String(input.competitorPrice).trim() !== '') {
    const cp = Number(input.competitorPrice);
    if (isNaN(cp)) {
      errors.competitorPrice = 'Competitor price must be a number.';
    } else if (cp < 0) {
      errors.competitorPrice = 'Competitor price cannot be negative.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
