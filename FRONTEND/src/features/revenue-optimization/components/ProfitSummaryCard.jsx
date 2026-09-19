import React from 'react';
import { PieChart, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import { formatPercentage, formatCurrencyDelta } from '../utils/revenueUtils';

export default function ProfitSummaryCard({
  currentBaseline,
  scenarios = [],
  product,
  currency = 'INR',
}) {
  const hasCostPrice = product?.cost_price !== undefined && product?.cost_price !== null && product?.cost_price !== '';

  if (!hasCostPrice) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1F5F9] mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">Gross Profit</h3>
              <p className="text-[11px] text-[#64748B]">Profitability & unit margin</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-[#B45309] mb-0.5">Cost Price Unavailable</strong>
              Cost price is unavailable. Revenue can be evaluated, but gross profit cannot be calculated.
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#94A3B8]">
          To unlock profit simulation, specify a valid unit cost price in the catalog.
        </div>
      </div>
    );
  }

  const evaluatedScenarios = scenarios.filter((s) => s.expectedProfit !== null);
  const topProfitScenario = evaluatedScenarios.length > 0
    ? evaluatedScenarios.reduce((max, s) => (s.expectedProfit > max.expectedProfit ? s : max), evaluatedScenarios[0])
    : null;

  const currentProf = currentBaseline?.expectedProfit;
  const topProf = topProfitScenario?.expectedProfit;

  const profitLift = topProf !== null && topProf !== undefined && currentProf !== null && currentProf !== undefined
    ? topProf - currentProf
    : null;

  const profitLiftPercent = profitLift !== null && currentProf !== 0
    ? (profitLift / Math.abs(currentProf)) * 100
    : null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">Gross Profit</h3>
              <p className="text-[11px] text-[#64748B]">Profitability & margin lift</p>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] font-medium">
            Cost: {formatCurrency(product.cost_price, currency)}
          </span>
        </div>

        <div className="space-y-3">
          {/* Baseline Profit & Margin */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Baseline Gross Profit:</span>
            <div className="text-right">
              <span className="font-semibold text-[#0F172A] block">
                {currentProf !== null && currentProf !== undefined
                  ? formatCurrency(currentProf, currency)
                  : 'Not available'}
              </span>
              {currentBaseline?.grossMargin !== null && (
                <span className="text-[10px] text-[#64748B]">
                  Margin: {formatPercentage(currentBaseline.grossMargin)}
                </span>
              )}
            </div>
          </div>

          {/* Top Simulated Profit */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Top Simulated Profit:</span>
            <div className="text-right">
              <span className="font-bold text-[#0F172A] block">
                {topProf !== null && topProf !== undefined ? (
                  formatCurrency(topProf, currency)
                ) : (
                  <span className="text-[#94A3B8] italic font-normal">None evaluated</span>
                )}
              </span>
              {topProfitScenario?.grossMargin !== null && (
                <span className="text-[10px] text-[#16A34A] font-medium">
                  Margin: {formatPercentage(topProfitScenario.grossMargin)}
                </span>
              )}
            </div>
          </div>

          {/* Lift */}
          {profitLift !== null && (
            <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Profit Impact:</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  profitLift > 0
                    ? 'text-[#15803D]'
                    : profitLift < 0
                    ? 'text-[#DC2626]'
                    : 'text-[#64748B]'
                }`}
              >
                {profitLift > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                {profitLift < 0 && <ArrowDownRight className="w-3.5 h-3.5" />}
                {formatCurrencyDelta(profitLift, currency)}
                {profitLiftPercent !== null && (
                  <span className="text-[10px] font-normal">
                    ({formatPercentage(profitLiftPercent, true)})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#94A3B8]">
        {topProfitScenario ? (
          <span>
            Optimal margin scenario:{' '}
            <strong className="text-[#0F172A]">{topProfitScenario.name}</strong> at{' '}
            {formatCurrency(topProfitScenario.price, currency)}
          </span>
        ) : (
          <span>Evaluate candidate pricing to model gross profit yield</span>
        )}
      </div>
    </div>
  );
}
