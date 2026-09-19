import React from 'react';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import { formatPercentage, formatCurrencyDelta } from '../utils/revenueUtils';

export default function RevenueSummaryCard({
  currentBaseline,
  scenarios = [],
  currency = 'INR',
}) {
  const evaluatedScenarios = scenarios.filter((s) => s.expectedRevenue !== null);

  // Find scenario with highest expected revenue
  const topRevenueScenario = evaluatedScenarios.length > 0
    ? evaluatedScenarios.reduce((max, s) => (s.expectedRevenue > max.expectedRevenue ? s : max), evaluatedScenarios[0])
    : null;

  const currentRev = currentBaseline?.expectedRevenue;
  const topRev = topRevenueScenario?.expectedRevenue;

  const revenueLift = topRev !== null && topRev !== undefined && currentRev !== null && currentRev !== undefined
    ? topRev - currentRev
    : null;

  const revenueLiftPercent = revenueLift !== null && currentRev > 0
    ? (revenueLift / currentRev) * 100
    : null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">Revenue Impact</h3>
              <p className="text-[11px] text-[#64748B]">Expected revenue by scenario</p>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] font-medium">
            {evaluatedScenarios.length} Evaluated
          </span>
        </div>

        <div className="space-y-3">
          {/* Baseline Revenue */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Baseline Revenue:</span>
            <span className="font-semibold text-[#0F172A]">
              {currentRev !== null && currentRev !== undefined
                ? formatCurrency(currentRev, currency)
                : 'Not available'}
            </span>
          </div>

          {/* Top Simulated Revenue */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Top Simulated Revenue:</span>
            <span className="font-bold text-[#0F172A]">
              {topRev !== null && topRev !== undefined ? (
                formatCurrency(topRev, currency)
              ) : (
                <span className="text-[#94A3B8] italic font-normal">None evaluated</span>
              )}
            </span>
          </div>

          {/* Lift */}
          {revenueLift !== null && (
            <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Potential Delta:</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  revenueLift > 0
                    ? 'text-[#15803D]'
                    : revenueLift < 0
                    ? 'text-[#DC2626]'
                    : 'text-[#64748B]'
                }`}
              >
                {revenueLift > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                {revenueLift < 0 && <ArrowDownRight className="w-3.5 h-3.5" />}
                {formatCurrencyDelta(revenueLift, currency)}
                {revenueLiftPercent !== null && (
                  <span className="text-[10px] font-normal">
                    ({formatPercentage(revenueLiftPercent, true)})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#94A3B8]">
        {topRevenueScenario ? (
          <span>
            Peak revenue model:{' '}
            <strong className="text-[#0F172A]">{topRevenueScenario.name}</strong> at{' '}
            {formatCurrency(topRevenueScenario.price, currency)}
          </span>
        ) : (
          <span>Simulate candidate prices to identify potential revenue curves</span>
        )}
      </div>
    </div>
  );
}
