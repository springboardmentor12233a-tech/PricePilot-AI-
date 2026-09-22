import React from 'react';
import {
  IndianRupee,
  TrendingUp,
  Percent,
  Users2,
  PieChart,
  Activity,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';

export default function AnalyticsSummaryCards({
  summaryMetrics = {},
  selectedProduct = null,
}) {
  const {
    productsCount = 0,
    averagePrice = null,
    averageDiscount = null,
    averageCompetitorPrice = null,
    totalRevenue = null,
    totalGrossProfit = null,
    averageGrossMargin = null,
    priceChangePct = null,
    currency = 'INR',
  } = summaryMetrics;

  const hasCost = selectedProduct?.cost_price !== undefined && selectedProduct?.cost_price !== null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Revenue */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#64748B]">Total Revenue</span>
          <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-[#0F172A]">
            {totalRevenue !== null ? formatCurrency(totalRevenue, currency) : 'Not available'}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            {totalRevenue !== null ? 'Realized gross sales from API' : 'Awaiting sales stream data'}
          </p>
        </div>
      </div>

      {/* 2. Average Price */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#64748B]">Average Catalog Price</span>
          <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-[#0F172A]">
            {averagePrice !== null ? formatCurrency(averagePrice, currency) : 'Not available'}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            {productsCount > 0 ? `Across ${productsCount} active products` : 'No active products'}
          </p>
        </div>
      </div>

      {/* 3. Average Discount */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#64748B]">Average Discount</span>
          <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-[#0F172A]">
            {averageDiscount !== null ? `${averageDiscount.toFixed(1)}%` : 'Not available'}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            {averageDiscount !== null ? 'Observed promotional discount rate' : 'No discounts recorded'}
          </p>
        </div>
      </div>

      {/* 4. Average Competitor Price */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#64748B]">Avg Competitor Benchmark</span>
          <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center">
            <Users2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-[#0F172A]">
            {averageCompetitorPrice !== null ? formatCurrency(averageCompetitorPrice, currency) : 'Not available'}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            {averageCompetitorPrice !== null ? 'Direct market competitor observations' : 'No competitor observations'}
          </p>
        </div>
      </div>

      {/* 5. Gross Profit */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#64748B]">Gross Profit</span>
          <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-[#0F172A]">
            {totalGrossProfit !== null ? formatCurrency(totalGrossProfit, currency) : 'Not available'}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            {totalGrossProfit !== null
              ? 'Revenue minus cost of goods sold'
              : !hasCost
              ? 'Cost price is unavailable'
              : 'Requires sales transaction data'}
          </p>
        </div>
      </div>

      {/* 6. Gross Margin */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#64748B]">Gross Margin</span>
          <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-[#0F172A]">
            {averageGrossMargin !== null ? `${averageGrossMargin.toFixed(1)}%` : 'Not available'}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            {averageGrossMargin !== null ? 'Contribution margin percentage' : 'Requires revenue & cost price'}
          </p>
        </div>
      </div>

      {/* 7. Price Change */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#64748B]">Observed Price Change</span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              priceChangePct !== null && priceChangePct >= 0
                ? 'bg-[#EFF6FF] text-[#2563EB]'
                : 'bg-[#FEF2F2] text-[#DC2626]'
            }`}
          >
            {priceChangePct !== null && priceChangePct >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-[#0F172A]">
            {priceChangePct !== null
              ? `${priceChangePct >= 0 ? '+' : ''}${priceChangePct.toFixed(1)}%`
              : 'Not available'}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            {priceChangePct !== null
              ? 'Earliest to latest recorded revision'
              : 'Requires multiple pricing records'}
          </p>
        </div>
      </div>

      {/* 8. Products Analyzed */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#64748B]">Products Analyzed</span>
          <div className="w-8 h-8 rounded-xl bg-[#F8FAFC] text-[#475569] flex items-center justify-center border border-[#E2E8F0]">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-[#0F172A]">{productsCount}</div>
          <p className="text-[11px] text-[#64748B] mt-1">Active items in filtered scope</p>
        </div>
      </div>
    </div>
  );
}
