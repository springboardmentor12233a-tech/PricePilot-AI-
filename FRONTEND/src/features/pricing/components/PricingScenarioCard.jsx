import React from 'react';
import formatCurrency from '../../../utils/formatCurrency';
import { calculateRevenue } from '../utils/pricingCalculations';

export default function PricingScenarioCard({
  scenario,
  currency = 'INR',
  className = '',
}) {
  if (!scenario) return null;

  const price = scenario.price !== undefined ? scenario.price : scenario.target_price;
  const demand = scenario.demand !== undefined ? scenario.demand : scenario.predicted_demand;
  const revenue = scenario.revenue !== undefined ? scenario.revenue : calculateRevenue(price, demand);

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs ${className}`}>
      <div className="text-xs text-[#64748B] mb-1">Scenario Price</div>
      <div className="text-lg font-bold text-[#0F172A] mb-2">
        {formatCurrency(price, currency)}
      </div>
      <div className="flex items-center justify-between text-xs text-[#475569] pt-2 border-t border-[#F1F5F9]">
        <span>Demand:</span>
        <span className="font-semibold">{demand !== undefined ? `${Math.round(demand)} u` : '—'}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-[#15803D] mt-1">
        <span>Revenue:</span>
        <span className="font-bold">{formatCurrency(revenue, currency)}</span>
      </div>
    </div>
  );
}
