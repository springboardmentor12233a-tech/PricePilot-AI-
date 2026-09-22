import React from 'react';
import { TrendingUp, IndianRupee, Wallet } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import { calculateRevenue, calculateGrossProfit } from '../utils/pricingCalculations';

/**
 * PredictedDemandCard
 * Displays:
 * - Predicted demand (e.g. 124 units)
 * - Expected revenue (price * predicted demand)
 * - Expected gross profit (if cost price is known)
 * Shows units clearly.
 */
export default function PredictedDemandCard({
  predictedDemand,
  price,
  costPrice,
  currency = 'INR',
  className = '',
}) {
  const hasDemand = predictedDemand !== null && predictedDemand !== undefined && !isNaN(Number(predictedDemand));
  const demandNum = hasDemand ? Number(predictedDemand) : null;

  const expectedRevenue = hasDemand && price ? calculateRevenue(price, demandNum) : null;
  const expectedProfit = hasDemand && price && costPrice ? calculateGrossProfit(price, costPrice, demandNum) : null;

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Predicted Demand
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>

      <div className="text-2xl font-bold text-[#0F172A] tracking-tight mb-3">
        {hasDemand ? `${Math.round(demandNum).toLocaleString()} units` : '—'}
      </div>

      <div className="space-y-2 pt-3 border-t border-[#F1F5F9] text-xs">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-[#64748B]" />
            Expected Revenue:
          </span>
          <span className="font-semibold text-[#0F172A]">
            {expectedRevenue !== null ? formatCurrency(expectedRevenue, currency) : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-[#64748B]" />
            Expected Gross Profit:
          </span>
          <span className="font-semibold text-[#15803D]">
            {expectedProfit !== null ? formatCurrency(expectedProfit, currency) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
