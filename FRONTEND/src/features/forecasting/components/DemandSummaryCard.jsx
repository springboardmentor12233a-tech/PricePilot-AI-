import React from 'react';
import { Package, DollarSign, TrendingUp, ShieldCheck, Calendar, Layers } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import {
  formatDemandUnits,
  calculateExpectedRevenue,
  calculateExpectedGrossProfit,
} from '../utils/forecastUtils';

/**
 * DemandSummaryCard Component
 * Displays the core forecasted metrics returned by the backend ML model:
 * 1. Forecasted Demand
 * 2. Tested Price Point
 * 3. Expected Revenue (Price × Forecasted Demand)
 * 4. Expected Gross Profit ((Price - Cost) × Forecasted Demand)
 */
export default function DemandSummaryCard({
  forecast,
  product,
  selectedHorizon = '30d',
  className = '',
}) {
  if (!forecast) return null;

  const currency = product?.currency || 'INR';
  const demand = forecast.predictedDemand;
  const price = forecast.predictedPrice !== null ? forecast.predictedPrice : product?.base_price;
  const cost = product?.cost_price;

  const revenue = calculateExpectedRevenue(price, demand);
  const profit = calculateExpectedGrossProfit(price, cost, demand);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 4-Pillar Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Forecasted Demand */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Forecasted Demand
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB]">
              Model Output
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {formatDemandUnits(demand)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[#94A3B8]" />
            <span>Horizon: {selectedHorizon.toUpperCase()}</span>
          </div>
        </div>

        {/* Tested Price Point */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Evaluated Unit Price
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F1F5F9] text-[#475569]">
              Scenario Price
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {price !== null && price !== undefined ? formatCurrency(price, currency) : '—'}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            Target per-unit transaction price
          </div>
        </div>

        {/* Expected Revenue */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Projected Revenue
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#ECFDF5] text-[#16A34A]">
              Price × Demand
            </span>
          </div>
          <div className="text-2xl font-bold text-[#15803D] tracking-tight">
            {revenue !== null ? formatCurrency(revenue, currency) : '—'}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            {demand !== null ? `${Math.round(demand)} units × unit price` : 'Awaiting demand'}
          </div>
        </div>

        {/* Expected Gross Profit */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Projected Gross Profit
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
              Contribution
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {profit !== null ? formatCurrency(profit, currency) : '—'}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            {cost ? `Unit cost: ${formatCurrency(cost, currency)}` : 'Unit cost not defined'}
          </div>
        </div>
      </div>
    </div>
  );
}
