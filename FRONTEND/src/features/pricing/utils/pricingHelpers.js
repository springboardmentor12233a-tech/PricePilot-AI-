/**
 * PricePilot AI — Pricing Helpers & Payload Normalization
 * Ensures clean data flow between UI and backend without inventing fake schemas.
 */

/**
 * Builds the payload for POST /api/v1/pricing/predict
 * Includes ONLY supported backend fields.
 */
export function buildPredictionPayload(product, competitorData = null, inventoryData = null, overrides = {}) {
  if (!product) return {};

  const currentPrice = overrides.scenarioPrice !== undefined && overrides.scenarioPrice !== ''
    ? Number(overrides.scenarioPrice)
    : Number(product.base_price);

  const competitorPrice = overrides.competitorPrice !== undefined && overrides.competitorPrice !== ''
    ? Number(overrides.competitorPrice)
    : (competitorData?.latestPrice || competitorData?.marketAverage || null);

  const payload = {
    product_id: product.id,
    current_price: !isNaN(currentPrice) && currentPrice >= 0 ? currentPrice : Number(product.base_price || 0),
  };

  // Add competitor price only if valid number
  if (competitorPrice !== null && competitorPrice !== undefined && !isNaN(Number(competitorPrice))) {
    payload.competitor_price = Number(competitorPrice);
  }

  // Add discount if specified or non-zero
  if (overrides.discount !== undefined && overrides.discount !== '' && !isNaN(Number(overrides.discount))) {
    payload.discount = Number(overrides.discount);
  }

  // Promotion flag
  if (overrides.promotion !== undefined) {
    payload.promotion = Boolean(overrides.promotion);
  }

  // Inventory count if available
  const inventoryCount = overrides.inventory !== undefined && overrides.inventory !== ''
    ? Number(overrides.inventory)
    : (inventoryData?.current_stock !== undefined ? Number(inventoryData.current_stock) : null);

  if (inventoryCount !== null && !isNaN(inventoryCount)) {
    payload.inventory = inventoryCount;
  }

  return payload;
}

/**
 * Normalizes backend response from POST /api/v1/pricing/predict
 * Strictly preserves backend fields. Does NOT fabricate confidence or trend.
 */
export function normalizePredictionResult(data) {
  if (!data || typeof data !== 'object') return null;

  // Demand: predicted_demand or demand
  const predictedDemand = data.predicted_demand !== undefined
    ? Number(data.predicted_demand)
    : (data.demand !== undefined ? Number(data.demand) : null);

  // Predicted price: predicted_price, recommended_price, or optimal_price
  const predictedPrice = data.predicted_price !== undefined
    ? Number(data.predicted_price)
    : (data.recommended_price !== undefined
      ? Number(data.recommended_price)
      : (data.optimal_price !== undefined ? Number(data.optimal_price) : null));

  // Confidence: ONLY if explicitly returned by backend
  // Could be 0.0-1.0 or 0-100
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

  // Scenarios / candidate prices if returned
  const scenarios = Array.isArray(data.scenarios)
    ? data.scenarios
    : (Array.isArray(data.candidate_prices) ? data.candidate_prices : null);

  // Elasticity / reason
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
    scenarios,
    elasticity: elasticity !== null && !isNaN(elasticity) ? elasticity : null,
    reason,
  };
}

/**
 * Normalizes backend response from POST /api/v1/pricing/recommendations
 */
export function normalizeRecommendation(data) {
  if (!data || typeof data !== 'object') return null;

  // Can be a single recommendation or nested under recommendation
  const rec = data.recommendation || data;

  const id = rec.id || rec.recommendation_id || (rec.product_id ? `rec-${rec.product_id}` : null);
  const productId = rec.product_id;

  const recommendedPrice = rec.recommended_price !== undefined
    ? Number(rec.recommended_price)
    : (rec.suggested_price !== undefined
      ? Number(rec.suggested_price)
      : (rec.new_price !== undefined ? Number(rec.new_price) : null));

  const currentPrice = rec.current_price !== undefined
    ? Number(rec.current_price)
    : (rec.old_price !== undefined ? Number(rec.old_price) : null);

  const expectedDemand = rec.expected_demand !== undefined
    ? Number(rec.expected_demand)
    : (rec.predicted_demand !== undefined ? Number(rec.predicted_demand) : null);

  const expectedRevenue = rec.expected_revenue !== undefined
    ? Number(rec.expected_revenue)
    : null;

  const expectedProfit = rec.expected_profit !== undefined
    ? Number(rec.expected_profit)
    : (rec.gross_profit !== undefined ? Number(rec.gross_profit) : null);

  const margin = rec.margin !== undefined
    ? Number(rec.margin)
    : (rec.expected_margin !== undefined ? Number(rec.expected_margin) : null);

  let confidence = null;
  if (rec.confidence !== undefined && rec.confidence !== null && !isNaN(Number(rec.confidence))) {
    const raw = Number(rec.confidence);
    confidence = raw <= 1 && raw > 0 ? Math.round(raw * 100) : Math.round(raw);
  }

  // Exact backend status
  const status = (rec.status || 'PENDING').toUpperCase();

  const reason = rec.reason || rec.rationale || rec.explanation || null;
  const createdAt = rec.created_at || rec.timestamp || null;

  return {
    id,
    productId,
    recommendedPrice: recommendedPrice !== null && !isNaN(recommendedPrice) ? recommendedPrice : null,
    currentPrice: currentPrice !== null && !isNaN(currentPrice) ? currentPrice : null,
    expectedDemand: expectedDemand !== null && !isNaN(expectedDemand) ? expectedDemand : null,
    expectedRevenue: expectedRevenue !== null && !isNaN(expectedRevenue) ? expectedRevenue : null,
    expectedProfit: expectedProfit !== null && !isNaN(expectedProfit) ? expectedProfit : null,
    margin: margin !== null && !isNaN(margin) ? margin : null,
    confidence,
    status,
    reason,
    createdAt,
    raw: rec,
  };
}

/**
 * Return badge variant and label for recommendation status
 */
export function getRecommendationStatusBadgeProps(status = 'PENDING') {
  const norm = String(status || '').toUpperCase();
  switch (norm) {
    case 'APPLIED':
      return { variant: 'success', label: 'Applied', dot: true };
    case 'REJECTED':
      return { variant: 'danger', label: 'Rejected', dot: true };
    case 'EXPIRED':
      return { variant: 'default', label: 'Expired', dot: false };
    case 'PENDING':
    default:
      return { variant: 'warning', label: 'Pending Review', dot: true };
  }
}
