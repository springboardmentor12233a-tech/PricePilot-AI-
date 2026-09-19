/**
 * PricePilot AI — Price Analysis & Competitive Metrics Engine
 * Factual, mathematical calculations only. Safe against null, zero, NaN, and Infinity.
 */

/**
 * Calculate absolute difference between our price and competitor price
 * Positive: our price is higher
 * Negative: our price is lower
 * Zero: equal
 */
export function calculatePriceDifference(ourPrice, competitorPrice) {
  if (
    ourPrice === null ||
    ourPrice === undefined ||
    competitorPrice === null ||
    competitorPrice === undefined
  ) {
    return null;
  }

  const our = Number(ourPrice);
  const comp = Number(competitorPrice);

  if (isNaN(our) || isNaN(comp)) return null;

  return our - comp;
}

/**
 * Calculate relative percentage difference between our price and competitor price
 * ((ourPrice - competitorPrice) / competitorPrice) * 100
 * Only calculated when competitorPrice > 0
 */
export function calculateRelativePriceDifference(ourPrice, competitorPrice) {
  if (
    ourPrice === null ||
    ourPrice === undefined ||
    competitorPrice === null ||
    competitorPrice === undefined
  ) {
    return null;
  }

  const our = Number(ourPrice);
  const comp = Number(competitorPrice);

  if (isNaN(our) || isNaN(comp) || comp <= 0) return null;

  const diff = ((our - comp) / comp) * 100;
  return Number.isFinite(diff) ? diff : null;
}

/**
 * Calculate Price Index (Our Price / Competitor Price)
 * 1.05 = our price is 5% higher
 * 0.95 = our price is 5% lower
 */
export function calculatePriceIndex(ourPrice, competitorPrice) {
  if (
    ourPrice === null ||
    ourPrice === undefined ||
    competitorPrice === null ||
    competitorPrice === undefined
  ) {
    return null;
  }

  const our = Number(ourPrice);
  const comp = Number(competitorPrice);

  if (isNaN(our) || isNaN(comp) || comp <= 0) return null;

  const index = our / comp;
  return Number.isFinite(index) ? index : null;
}

/**
 * Calculate mean of valid positive competitor prices
 */
export function calculateMarketAverage(competitorPrices) {
  if (!Array.isArray(competitorPrices) || competitorPrices.length === 0) {
    return null;
  }

  const validPrices = competitorPrices
    .map((p) => {
      // Support raw number or object with .price
      const val = typeof p === 'object' && p !== null ? p.price : p;
      return Number(val);
    })
    .filter((val) => !isNaN(val) && Number.isFinite(val) && val > 0);

  if (validPrices.length === 0) return null;

  const sum = validPrices.reduce((acc, curr) => acc + curr, 0);
  return sum / validPrices.length;
}

/**
 * Calculate Market Price Index: Our Price / Market Average Price
 */
export function calculateMarketPriceIndex(ourPrice, marketAverage) {
  if (
    ourPrice === null ||
    ourPrice === undefined ||
    marketAverage === null ||
    marketAverage === undefined
  ) {
    return null;
  }

  const our = Number(ourPrice);
  const avg = Number(marketAverage);

  if (isNaN(our) || isNaN(avg) || avg <= 0) return null;

  const index = our / avg;
  return Number.isFinite(index) ? index : null;
}

/**
 * Calculate Price Gap against Market Average
 * Returns { gap, gapPercentage, isAbove, isBelow, isEqual }
 */
export function calculatePriceGap(ourPrice, marketAverage) {
  const gap = calculatePriceDifference(ourPrice, marketAverage);
  const gapPercentage = calculateRelativePriceDifference(ourPrice, marketAverage);

  if (gap === null || gapPercentage === null) {
    return {
      gap: null,
      gapPercentage: null,
      isAbove: false,
      isBelow: false,
      isEqual: false,
    };
  }

  return {
    gap,
    gapPercentage,
    isAbove: gap > 0,
    isBelow: gap < 0,
    isEqual: gap === 0,
  };
}

/**
 * Determine descriptive competitive market position
 * Tolerance default is 2% (0.02)
 */
export function determineMarketPosition(ourPrice, marketAverage, tolerance = 0.02) {
  if (
    ourPrice === null ||
    ourPrice === undefined ||
    marketAverage === null ||
    marketAverage === undefined
  ) {
    return {
      status: 'unknown',
      label: 'Unknown',
      variant: 'neutral',
      description: 'Insufficient market observation data.',
    };
  }

  const our = Number(ourPrice);
  const avg = Number(marketAverage);

  if (isNaN(our) || isNaN(avg) || avg <= 0) {
    return {
      status: 'unknown',
      label: 'Unknown',
      variant: 'neutral',
      description: 'Insufficient market observation data.',
    };
  }

  const lowerBound = avg * (1 - tolerance);
  const upperBound = avg * (1 + tolerance);

  if (our < lowerBound) {
    return {
      status: 'below_market',
      label: 'Below Market',
      variant: 'info',
      description: 'Our price is below the observed market average.',
    };
  }

  if (our > upperBound) {
    return {
      status: 'above_market',
      label: 'Above Market',
      variant: 'warning',
      description: 'Our price is above the observed market average.',
    };
  }

  return {
    status: 'at_market',
    label: 'At Market',
    variant: 'neutral',
    description: 'Our price is aligned within 2% of the observed market average.',
  };
}

/**
 * Get latest price observation based on actual observed_at timestamp
 */
export function getLatestObservation(observations) {
  if (!Array.isArray(observations) || observations.length === 0) {
    return null;
  }

  const validObs = observations.filter(
    (obs) => obs && obs.price !== undefined && obs.price !== null
  );
  if (validObs.length === 0) return null;

  // Sort descending by observed_at if available
  const sorted = [...validObs].sort((a, b) => {
    const timeA = a.observed_at ? new Date(a.observed_at).getTime() : 0;
    const timeB = b.observed_at ? new Date(b.observed_at).getTime() : 0;
    return timeB - timeA;
  });

  return sorted[0];
}

/**
 * Get price range (lowest, highest, spread) from observations or prices
 */
export function getPriceRange(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { min: null, max: null, spread: null };
  }

  const values = items
    .map((item) => {
      const val = typeof item === 'object' && item !== null ? item.price : item;
      return Number(val);
    })
    .filter((v) => !isNaN(v) && Number.isFinite(v) && v > 0);

  if (values.length === 0) {
    return { min: null, max: null, spread: null };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;

  return { min, max, spread };
}
