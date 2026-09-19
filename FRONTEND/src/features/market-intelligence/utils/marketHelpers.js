/**
 * PricePilot AI — Market Intelligence Helpers & Opportunity Foundation
 * Purely factual, mathematical calculations & descriptive attention flags.
 */

import {
  calculateMarketAverage,
  calculatePriceGap,
  determineMarketPosition,
  getPriceRange,
  getLatestObservation,
} from '../../competitors/utils/priceAnalysis';

/**
 * Compose product data with loaded competitor prices into a structured comparison record
 */
export function buildProductMarketComparison(product, observations = []) {
  if (!product) return null;

  const ourPrice = product.base_price !== undefined && product.base_price !== null
    ? Number(product.base_price)
    : null;

  const validObservations = Array.isArray(observations)
    ? observations.filter((obs) => obs && obs.price !== undefined && obs.price !== null && !isNaN(Number(obs.price)))
    : [];

  const marketAverage = calculateMarketAverage(validObservations);
  const gapInfo = calculatePriceGap(ourPrice, marketAverage);
  const positionInfo = determineMarketPosition(ourPrice, marketAverage);
  const rangeInfo = getPriceRange(validObservations);
  const latestObs = getLatestObservation(validObservations);

  return {
    product,
    ourPrice,
    observations: validObservations,
    observationCount: validObservations.length,
    marketAverage,
    gap: gapInfo.gap,
    gapPercentage: gapInfo.gapPercentage,
    position: positionInfo,
    lowestCompetitorPrice: rangeInfo.min,
    highestCompetitorPrice: rangeInfo.max,
    spread: rangeInfo.spread,
    latestObservation: latestObs,
    hasCompetitorData: validObservations.length > 0,
  };
}

/**
 * Detect products that require pricing attention based on descriptive market deviations.
 * Strictly avoids automated algorithmic optimization or claims of guaranteed outcome.
 */
export function detectPricingOpportunities(comparisons = []) {
  if (!Array.isArray(comparisons)) return [];

  const opportunities = [];

  comparisons.forEach((comp) => {
    if (!comp || !comp.product) return;

    const { product, ourPrice, marketAverage, gapPercentage, position, observationCount, spread } = comp;

    // Case 1: Substantially above observed market average (> 5%)
    if (marketAverage && gapPercentage !== null && gapPercentage > 5) {
      opportunities.push({
        id: `above-${product.id}`,
        productId: product.id,
        productName: product.name,
        type: 'above_market',
        badgeLabel: 'Above Market',
        badgeVariant: 'warning',
        title: 'High Market Variance',
        message: `Our price is ${Math.abs(gapPercentage).toFixed(1)}% above the observed market average.`,
        actionLabel: 'Review pricing',
        gapPercentage,
        ourPrice,
        marketAverage,
      });
    }

    // Case 2: Substantially below observed market average (< -5%)
    else if (marketAverage && gapPercentage !== null && gapPercentage < -5) {
      opportunities.push({
        id: `below-${product.id}`,
        productId: product.id,
        productName: product.name,
        type: 'below_market',
        badgeLabel: 'Below Market',
        badgeVariant: 'info',
        title: 'Below Market Spread',
        message: `Our price is ${Math.abs(gapPercentage).toFixed(1)}% below the observed market average.`,
        actionLabel: 'Review pricing',
        gapPercentage,
        ourPrice,
        marketAverage,
      });
    }

    // Case 3: Wide spread across competitors (> 20% spread)
    else if (marketAverage && spread && spread > marketAverage * 0.2) {
      opportunities.push({
        id: `spread-${product.id}`,
        productId: product.id,
        productName: product.name,
        type: 'wide_spread',
        badgeLabel: 'Wide Spread',
        badgeVariant: 'neutral',
        title: 'Competitor Price Dispersion',
        message: `Observed competitor prices range widely between ₹${comp.lowestCompetitorPrice} and ₹${comp.highestCompetitorPrice}.`,
        actionLabel: 'Review pricing',
        gapPercentage: gapPercentage || 0,
        ourPrice,
        marketAverage,
      });
    }

    // Case 4: No competitor observations recorded yet
    else if (observationCount === 0) {
      opportunities.push({
        id: `missing-${product.id}`,
        productId: product.id,
        productName: product.name,
        type: 'untracked',
        badgeLabel: 'Unmonitored',
        badgeVariant: 'neutral',
        title: 'Missing Competitor Observations',
        message: 'No competitor prices have been recorded for this product yet.',
        actionLabel: 'Record Price',
        gapPercentage: null,
        ourPrice,
        marketAverage: null,
      });
    }
  });

  return opportunities;
}
