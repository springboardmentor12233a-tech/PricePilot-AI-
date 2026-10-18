import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPredictionPayload,
  normalizePredictionResult,
  normalizeRecommendation,
} from './pricingHelpers.js';

test('pricing request uses the backend schema and actual product ID', () => {
  const payload = buildPredictionPayload(
    { id: 'product-uuid', base_price: '80.00' },
    { targetMarginPercent: 25 },
  );

  assert.deepEqual(payload, {
    product_id: 'product-uuid',
    target_margin_percent: 25,
  });
});

test('pricing response maps actual rule output without inventing demand or confidence', () => {
  const result = normalizePredictionResult({
    product_id: 'product-uuid',
    current_price: '80.00',
    recommended_price: '86.40',
    competitor_avg_price: null,
    demand_factor: 'stable',
    recommendation_reason: 'Cost-plus margin strategy',
    price_change_percentage: 8,
  });

  assert.equal(result.currentPrice, 80);
  assert.equal(result.predictedPrice, 86.4);
  assert.equal(result.competitorAvgPrice, null);
  assert.equal(result.predictedDemand, null);
  assert.equal(result.confidence, null);
  assert.equal(result.elasticity, null);
  assert.equal(result.reason, 'Cost-plus margin strategy');
});

test('non-finite model-like fields are treated as unavailable', () => {
  const result = normalizePredictionResult({
    recommended_price: '90.00',
    predicted_demand: Number.POSITIVE_INFINITY,
    confidence: Number.NaN,
    elasticity: Number.POSITIVE_INFINITY,
  });

  assert.equal(result.predictedDemand, null);
  assert.equal(result.confidence, null);
  assert.equal(result.elasticity, null);
});

test('recommendation normalization uses backend ID and accepted status', () => {
  const recommendation = normalizeRecommendation({
    id: 'recommendation-uuid',
    product_id: 'product-uuid',
    current_price: '80.00',
    recommended_price: '84.00',
    recommendation_reason: 'Cost-plus margin strategy',
    status: 'accepted',
  });

  assert.equal(recommendation.id, 'recommendation-uuid');
  assert.equal(recommendation.status, 'APPLIED');
  assert.equal(recommendation.reason, 'Cost-plus margin strategy');
  assert.equal(normalizeRecommendation({ product_id: 'product-uuid' }).id, null);
});
