import React from 'react';
import formatCurrency from '../../../utils/formatCurrency';
import { calculateRevenue, calculateGrossProfit } from '../utils/pricingCalculations';

export default function PriceScenarioTable({
  scenarios = [],
  product,
  currency = 'INR',
  className = '',
}) {
  if (!scenarios || scenarios.length === 0) {
    return null;
  }

  const cost = product?.cost_price;

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs ${className}`}>
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Candidate Pricing Scenarios
        </h3>
        <p className="text-[11px] text-[#94A3B8]">
          Comparative elasticity scenarios evaluated by the backend model
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#334155]">
          <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
            <tr>
              <th className="px-5 py-3">Price Point</th>
              <th className="px-5 py-3">Predicted Demand</th>
              <th className="px-5 py-3">Expected Revenue</th>
              <th className="px-5 py-3">Expected Gross Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {scenarios.map((sc, idx) => {
              const price = sc.price !== undefined ? sc.price : sc.target_price;
              const demand = sc.demand !== undefined ? sc.demand : sc.predicted_demand;
              const revenue = sc.revenue !== undefined ? sc.revenue : calculateRevenue(price, demand);
              const profit = sc.profit !== undefined ? sc.profit : calculateGrossProfit(price, cost, demand);

              return (
                <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-5 py-3 font-bold text-[#0F172A]">
                    {formatCurrency(price, currency)}
                  </td>
                  <td className="px-5 py-3 font-medium text-[#334155]">
                    {demand !== null && demand !== undefined ? `${Math.round(demand).toLocaleString()} units` : '—'}
                  </td>
                  <td className="px-5 py-3 font-semibold text-[#15803D]">
                    {formatCurrency(revenue, currency)}
                  </td>
                  <td className="px-5 py-3 font-medium text-[#0F172A]">
                    {profit !== null ? formatCurrency(profit, currency) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
