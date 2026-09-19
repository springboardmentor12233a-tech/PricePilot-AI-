/**
 * PricePilot AI — Market Intelligence Service Layer
 * COMPOSES real backend data from products and competitor prices.
 * Strictly avoids inventing unbacked /api/v1/market-intelligence routes.
 */

import { competitorApi } from '../../competitors/services/competitorApi';

export const marketIntelligenceApi = {
  /**
   * Concurrently fetch competitor prices for a list of products with controlled concurrency
   * to avoid overwhelming the backend.
   *
   * @param {Array<{id: string|number}>} products
   * @param {number} concurrency
   * @returns {Promise<Record<string, Array<any>>>} map of productId -> prices
   */
  loadCompetitorPricesForProducts: async (products, concurrency = 4) => {
    if (!Array.isArray(products) || products.length === 0) {
      return {};
    }

    const resultMap = {};

    for (let i = 0; i < products.length; i += concurrency) {
      const batch = products.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (product) => {
          try {
            const data = await competitorApi.getCompetitorPrices(product.id);
            resultMap[product.id] = Array.isArray(data) ? data : data?.items || [];
          } catch {
            // 404 or error returns empty array for this product
            resultMap[product.id] = [];
          }
        })
      );
    }

    return resultMap;
  },
};

export default marketIntelligenceApi;
