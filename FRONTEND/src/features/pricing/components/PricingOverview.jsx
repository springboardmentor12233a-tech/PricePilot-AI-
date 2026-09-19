import React from 'react';
import CurrentPriceCard from './CurrentPriceCard';
import CostPriceCard from './CostPriceCard';
import CompetitorPriceCard from './CompetitorPriceCard';
import InventoryContextCard from './InventoryContextCard';
import MarketPositionCard from './MarketPositionCard';

/**
 * PricingOverview Component
 * Enterprise 5-pillar overview grid:
 * 1. Current Price Card (Catalog base price & margin)
 * 2. Cost Price Card (Unit cost & baseline margin)
 * 3. Competitor Price Card (Benchmark & delta)
 * 4. Inventory Context Card (Stock & reorder health)
 * 5. Market Position Card (Descriptive observation)
 */
export default function PricingOverview({
  product,
  inventory,
  competitorData,
  className = '',
}) {
  if (!product) return null;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
      <CurrentPriceCard product={product} />
      <CostPriceCard product={product} />
      <CompetitorPriceCard product={product} competitorData={competitorData} />
      <InventoryContextCard inventory={inventory} />
      <MarketPositionCard product={product} competitorData={competitorData} />
    </div>
  );
}
