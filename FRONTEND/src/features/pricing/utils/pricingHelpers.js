/**
 * PricePilot AI — Pricing Helpers & Payload Normalization
 * Ensures clean data flow between UI and backend without inventing fake schemas.
 */

/**
 * Builds the payload for POST /api/v1/pricing/predict
 * Includes ONLY supported backend fields.
 */
export function buildPredictionPayload(product, { targetMarginPercent = 20 } = {}) {
  if (!product?.id) return {};

  const margin = Number(targetMarginPercent);
  if (!Number.isFinite(margin) || margin < 0) {
    throw new Error('Target margin must be a finite, non-negative number.');
  }

  return {
    product_id: product.id,
    target_margin_percent: margin,
  };
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
  const predictedPrice = data.recommended_price !== undefined
    ? Number(data.recommended_price)
    : (data.predicted_price !== undefined
    ? Number(data.predicted_price)
      : (data.optimal_price !== undefined ? Number(data.optimal_price) : null));

  const currentPrice = data.current_price !== undefined ? Number(data.current_price) : null;
  const competitorAvgPrice = data.competitor_avg_price !== undefined && data.competitor_avg_price !== null
    ? Number(data.competitor_avg_price)
    : null;
  const priceChangePercentage = data.price_change_percentage !== undefined
    ? Number(data.price_change_percentage)
    : null;

  // Confidence: ONLY if explicitly returned by backend
  // Could be 0.0-1.0 or 0-100
  let confidence = null;
  if (data.confidence !== undefined && data.confidence !== null && Number.isFinite(Number(data.confidence))) {
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
    ? Number(data.elasticity ?? data.price_elasticity)
    : null;

  const reason = data.recommendation_reason || data.reason || data.explanation || data.rationale || null;

  return {
    raw: data,
    currentPrice: currentPrice !== null && Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : null,
    predictedDemand: predictedDemand !== null && Number.isFinite(predictedDemand) ? predictedDemand : null,
    predictedPrice: predictedPrice !== null && Number.isFinite(predictedPrice) && predictedPrice > 0 ? predictedPrice : null,
    competitorAvgPrice: competitorAvgPrice !== null && Number.isFinite(competitorAvgPrice) && competitorAvgPrice > 0 ? competitorAvgPrice : null,
    demandFactor: typeof data.demand_factor === 'string' ? data.demand_factor : null,
    priceChangePercentage: priceChangePercentage !== null && Number.isFinite(priceChangePercentage) ? priceChangePercentage : null,
    confidence,
    trend,
    scenarios,
    elasticity: elasticity !== null && Number.isFinite(elasticity) ? elasticity : null,
    reason,
  };
}

/**
 * Maps a real prediction response to the backend recommendation-create schema.
 */
export function buildRecommendationPayload(prediction) {
  if (!prediction || typeof prediction !== 'object' || !prediction.product_id) {
    throw new Error('A product prediction is required to create a recommendation.');
  }

  const currentPrice = Number(prediction.current_price);
  const recommendedPrice = Number(prediction.recommended_price);
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    throw new Error('The prediction did not include a valid current price.');
  }
  if (!Number.isFinite(recommendedPrice) || recommendedPrice <= 0) {
    throw new Error('The prediction did not include a valid recommended price.');
  }

  const payload = {
    product_id: prediction.product_id,
    current_price: prediction.current_price,
    recommended_price: prediction.recommended_price,
  };

  if (prediction.variant_id) payload.variant_id = prediction.variant_id;
  if (prediction.competitor_avg_price !== undefined && prediction.competitor_avg_price !== null) {
    const competitorPrice = Number(prediction.competitor_avg_price);
    if (!Number.isFinite(competitorPrice) || competitorPrice <= 0) {
      throw new Error('The prediction included an invalid competitor average price.');
    }
    payload.competitor_avg_price = prediction.competitor_avg_price;
  }
  if (typeof prediction.demand_factor === 'string') {
    payload.demand_factor = prediction.demand_factor;
  }
  if (typeof prediction.recommendation_reason === 'string') {
    payload.recommendation_reason = prediction.recommendation_reason;
  }

  return payload;
}

/**
 * Normalizes backend response from POST /api/v1/pricing/recommendations
 */
export function normalizeRecommendation(data) {
  if (!data || typeof data !== 'object') return null;

  // Can be a single recommendation or nested under recommendation
  const rec = data.recommendation || data;

  const id = rec.id || rec.recommendation_id || null;
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
  if (rec.confidence !== undefined && rec.confidence !== null && Number.isFinite(Number(rec.confidence))) {
    const raw = Number(rec.confidence);
    confidence = raw <= 1 && raw > 0 ? Math.round(raw * 100) : Math.round(raw);
  }

  // Exact backend status
  const rawStatus = (rec.status || 'PENDING').toUpperCase();
  const status = rawStatus === 'ACCEPTED' ? 'APPLIED' : rawStatus;

  const reason = rec.recommendation_reason || rec.reason || rec.rationale || rec.explanation || null;
  const createdAt = rec.created_at || rec.timestamp || null;

  return {
    id,
    productId,
    recommendedPrice: recommendedPrice !== null && Number.isFinite(recommendedPrice) && recommendedPrice > 0 ? recommendedPrice : null,
    currentPrice: currentPrice !== null && Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : null,
    expectedDemand: expectedDemand !== null && Number.isFinite(expectedDemand) ? expectedDemand : null,
    expectedRevenue: expectedRevenue !== null && Number.isFinite(expectedRevenue) ? expectedRevenue : null,
    expectedProfit: expectedProfit !== null && Number.isFinite(expectedProfit) ? expectedProfit : null,
    margin: margin !== null && Number.isFinite(margin) ? margin : null,
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
