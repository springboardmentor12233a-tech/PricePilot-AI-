/**
 * PricePilot AI — Pricing Business Calculations Engine
 * Purely mathematical business calculations derived from real values.
 * NOT ML predictions. Handles null, undefined, zero, NaN, and Infinity safely.
 */

/**
 * Calculate expected revenue from price and demand
 * @param {number|string} price
 * @param {number|string} demand
 * @returns {number|null}
 */
export function calculateRevenue(price, demand) {
  if (
    price === null ||
    price === undefined ||
    price === '' ||
    demand === null ||
    demand === undefined ||
    demand === ''
  ) {
    return null;
  }

  const p = Number(price);
  const d = Number(demand);

  if (isNaN(p) || isNaN(d) || !Number.isFinite(p) || !Number.isFinite(d)) {
    return null;
  }

  if (p < 0 || d < 0) {
    return null;
  }

  return p * d;
}

/**
 * Calculate expected gross profit: (price - cost) * demand
 * Only calculates if all three values are available and valid.
 * @param {number|string} price
 * @param {number|string} cost
 * @param {number|string} demand
 * @returns {number|null}
 */
export function calculateGrossProfit(price, cost, demand) {
  if (
    price === null ||
    price === undefined ||
    price === '' ||
    cost === null ||
    cost === undefined ||
    cost === '' ||
    demand === null ||
    demand === undefined ||
    demand === ''
  ) {
    return null;
  }

  const p = Number(price);
  const c = Number(cost);
  const d = Number(demand);

  if (
    isNaN(p) ||
    isNaN(c) ||
    isNaN(d) ||
    !Number.isFinite(p) ||
    !Number.isFinite(c) ||
    !Number.isFinite(d)
  ) {
    return null;
  }

  if (p < 0 || c < 0 || d < 0) {
    return null;
  }

  return (p - c) * d;
}

/**
 * Calculate gross margin percentage: ((price - cost) / price) * 100
 * Handles price <= 0 and missing cost safely.
 * @param {number|string} price
 * @param {number|string} cost
 * @returns {number|null}
 */
export function calculateMargin(price, cost) {
  if (
    price === null ||
    price === undefined ||
    price === '' ||
    cost === null ||
    cost === undefined ||
    cost === ''
  ) {
    return null;
  }

  const p = Number(price);
  const c = Number(cost);

  if (isNaN(p) || isNaN(c) || !Number.isFinite(p) || !Number.isFinite(c)) {
    return null;
  }

  if (p <= 0 || c < 0) {
    return null;
  }

  const margin = ((p - c) / p) * 100;
  return Number.isFinite(margin) ? margin : null;
}

/**
 * Alias for calculateMargin
 */
export const calculateGrossMargin = calculateMargin;

/**
 * Calculate absolute difference between price and competitor price
 * @param {number|string} price
 * @param {number|string} competitorPrice
 * @returns {number|null}
 */
export function calculatePriceDifference(price, competitorPrice) {
  if (
    price === null ||
    price === undefined ||
    price === '' ||
    competitorPrice === null ||
    competitorPrice === undefined ||
    competitorPrice === ''
  ) {
    return null;
  }

  const p = Number(price);
  const cp = Number(competitorPrice);

  if (isNaN(p) || isNaN(cp) || !Number.isFinite(p) || !Number.isFinite(cp)) {
    return null;
  }

  return p - cp;
}

/**
 * Calculate relative percentage difference against competitor price
 * ((price - competitorPrice) / competitorPrice) * 100
 * @param {number|string} price
 * @param {number|string} competitorPrice
 * @returns {number|null}
 */
export function calculatePriceDifferencePercent(price, competitorPrice) {
  if (
    price === null ||
    price === undefined ||
    price === '' ||
    competitorPrice === null ||
    competitorPrice === undefined ||
    competitorPrice === ''
  ) {
    return null;
  }

  const p = Number(price);
  const cp = Number(competitorPrice);

  if (
    isNaN(p) ||
    isNaN(cp) ||
    !Number.isFinite(p) ||
    !Number.isFinite(cp) ||
    cp <= 0
  ) {
    return null;
  }

  const diffPercent = ((p - cp) / cp) * 100;
  return Number.isFinite(diffPercent) ? diffPercent : null;
}
