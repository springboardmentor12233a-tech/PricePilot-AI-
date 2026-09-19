import React from 'react';
import { Play, Trash2, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, Sparkles, HelpCircle } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import { formatPercentage, formatCurrencyDelta } from '../utils/revenueUtils';
import Button from '../../../components/Button';

export default function ScenarioComparison({
  currentBaseline,
  scenarios = [],
  product,
  onRunScenario,
  onRemoveScenario,
  isEvaluating = false,
}) {
  const currency = product?.currency || 'INR';
  const hasCostPrice = product?.cost_price !== undefined && product?.cost_price !== null && product?.cost_price !== '';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
      <div className="p-5 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">Scenario Comparison Ledger</h2>
          <p className="text-[11px] text-[#64748B]">
            Side-by-side evaluation of current baseline against tested candidate price points
          </p>
        </div>

        {!hasCostPrice && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Gross profit unavailable — product cost price is not available.</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
            <tr>
              <th className="py-3 px-4">Scenario</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Predicted Demand</th>
              <th className="py-3 px-4">Expected Revenue</th>
              <th className="py-3 px-4">Gross Profit</th>
              <th className="py-3 px-4">Gross Margin</th>
              <th className="py-3 px-4">Revenue Change</th>
              <th className="py-3 px-4">Profit Change</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {/* 1. Baseline Row */}
            <tr className="bg-[#EFF6FF]/40 font-medium">
              <td className="py-3.5 px-4 text-[#0F172A]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  <strong className="font-semibold text-xs">Current (Baseline)</strong>
                </div>
              </td>
              <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                {currentBaseline?.price !== null
                  ? formatCurrency(currentBaseline.price, currency)
                  : 'Not available'}
              </td>
              <td className="py-3.5 px-4 text-[#0F172A]">
                {currentBaseline?.predictedDemand !== null ? (
                  `${Math.round(currentBaseline.predictedDemand).toLocaleString()} units`
                ) : (
                  <span className="text-[#94A3B8] italic">Not evaluated</span>
                )}
              </td>
              <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                {currentBaseline?.expectedRevenue !== null ? (
                  formatCurrency(currentBaseline.expectedRevenue, currency)
                ) : (
                  <span className="text-[#94A3B8] italic">Not available</span>
                )}
              </td>
              <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                {!hasCostPrice ? (
                  <span className="text-[#94A3B8] italic text-[11px]">Cost unavailable</span>
                ) : currentBaseline?.expectedProfit !== null ? (
                  formatCurrency(currentBaseline.expectedProfit, currency)
                ) : (
                  <span className="text-[#94A3B8] italic">Not available</span>
                )}
              </td>
              <td className="py-3.5 px-4 text-[#0F172A]">
                {currentBaseline?.grossMargin !== null ? (
                  formatPercentage(currentBaseline.grossMargin)
                ) : (
                  <span className="text-[#94A3B8] italic">Not available</span>
                )}
              </td>
              <td className="py-3.5 px-4 text-[#64748B]">
                <span className="text-[#94A3B8] italic">Baseline</span>
              </td>
              <td className="py-3.5 px-4 text-[#64748B]">
                <span className="text-[#94A3B8] italic">Baseline</span>
              </td>
              <td className="py-3.5 px-4 text-right">
                <span className="text-[11px] text-[#64748B]">Active Catalog</span>
              </td>
            </tr>

            {/* 2. Candidate Scenario Rows */}
            {scenarios.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-8 text-center text-[#64748B]">
                  <p className="text-xs">No candidate scenarios created yet.</p>
                  <p className="text-[11px] text-[#94A3B8] mt-1">
                    Use the Scenario Builder above to add test prices and simulate outcomes.
                  </p>
                </td>
              </tr>
            ) : (
              scenarios.map((scenario, index) => {
                const isEvaluated = scenario.predictedDemand !== null;
                const hasRevChange = scenario.revenueChange?.absolute !== null;
                const hasProfChange = scenario.profitChange?.absolute !== null;

                return (
                  <tr key={scenario.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-xs text-[#0F172A] block">
                          {scenario.name || `Scenario ${String.fromCharCode(65 + index)}`}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[#64748B] mt-0.5">
                          {scenario.discount > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-[#F1F5F9]">
                              {scenario.discount}% disc
                            </span>
                          )}
                          {scenario.promotion && (
                            <span className="px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB]">
                              Promo
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                      {formatCurrency(scenario.price, currency)}
                    </td>

                    <td className="py-3.5 px-4">
                      {scenario.isLoading ? (
                        <span className="text-[#2563EB] animate-pulse">Calculating...</span>
                      ) : isEvaluated ? (
                        <span className="font-medium text-[#0F172A]">
                          {Math.round(scenario.predictedDemand).toLocaleString()} units
                        </span>
                      ) : (
                        <span className="text-[#94A3B8] italic">Pending</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                      {isEvaluated && scenario.expectedRevenue !== null ? (
                        formatCurrency(scenario.expectedRevenue, currency)
                      ) : (
                        <span className="text-[#94A3B8] italic">Not available</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                      {!hasCostPrice ? (
                        <span className="text-[#94A3B8] italic text-[11px]">Cost unavailable</span>
                      ) : isEvaluated && scenario.expectedProfit !== null ? (
                        formatCurrency(scenario.expectedProfit, currency)
                      ) : (
                        <span className="text-[#94A3B8] italic">Not available</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#0F172A]">
                      {isEvaluated && scenario.grossMargin !== null ? (
                        formatPercentage(scenario.grossMargin)
                      ) : (
                        <span className="text-[#94A3B8] italic">Not available</span>
                      )}
                    </td>

                    {/* Revenue Change vs Current */}
                    <td className="py-3.5 px-4">
                      {isEvaluated && hasRevChange ? (
                        <div className={`font-semibold flex items-center gap-1 ${
                          scenario.revenueChange.absolute > 0
                            ? 'text-[#15803D]'
                            : scenario.revenueChange.absolute < 0
                            ? 'text-[#DC2626]'
                            : 'text-[#64748B]'
                        }`}>
                          {scenario.revenueChange.absolute > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {scenario.revenueChange.absolute < 0 && <ArrowDownRight className="w-3.5 h-3.5" />}
                          {scenario.revenueChange.absolute === 0 && <Minus className="w-3.5 h-3.5" />}
                          <span>
                            {formatCurrencyDelta(scenario.revenueChange.absolute, currency)}
                            {scenario.revenueChange.percent !== null && (
                              <span className="text-[10px] font-normal ml-1">
                                ({formatPercentage(scenario.revenueChange.percent, true)})
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#94A3B8] italic">Not available</span>
                      )}
                    </td>

                    {/* Profit Change vs Current */}
                    <td className="py-3.5 px-4">
                      {!hasCostPrice ? (
                        <span className="text-[#94A3B8] italic text-[11px]">Cost unavailable</span>
                      ) : isEvaluated && hasProfChange ? (
                        <div className={`font-semibold flex items-center gap-1 ${
                          scenario.profitChange.absolute > 0
                            ? 'text-[#15803D]'
                            : scenario.profitChange.absolute < 0
                            ? 'text-[#DC2626]'
                            : 'text-[#64748B]'
                        }`}>
                          {scenario.profitChange.absolute > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {scenario.profitChange.absolute < 0 && <ArrowDownRight className="w-3.5 h-3.5" />}
                          {scenario.profitChange.absolute === 0 && <Minus className="w-3.5 h-3.5" />}
                          <span>
                            {formatCurrencyDelta(scenario.profitChange.absolute, currency)}
                            {scenario.profitChange.percent !== null && (
                              <span className="text-[10px] font-normal ml-1">
                                ({formatPercentage(scenario.profitChange.percent, true)})
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#94A3B8] italic">Not available</span>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onRunScenario(scenario.id)}
                          loading={scenario.isLoading}
                          title="Run demand prediction"
                        >
                          <Play className="w-3.5 h-3.5 text-[#2563EB]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onRemoveScenario(scenario.id)}
                          title="Remove scenario"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#DC2626]" />
                        </Button>
                      </div>
                      {scenario.error && (
                        <div className="text-[10px] text-[#DC2626] mt-1 text-right truncate">
                          {scenario.error}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
