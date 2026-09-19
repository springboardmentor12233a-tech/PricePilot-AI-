import React from 'react';
import { Users2, ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import { formatPercentage, formatCurrencyDelta } from '../utils/revenueUtils';

export default function CompetitorContextCard({
  product,
  competitorData,
  isLoading = false,
}) {
  if (!product) return null;

  const currency = product?.currency || 'INR';
  const currentPrice = product?.base_price !== undefined ? Number(product.base_price) : null;
  const compPrice = competitorData?.latestPrice;

  const diff = compPrice !== null && compPrice !== undefined && currentPrice !== null
    ? currentPrice - compPrice
    : null;

  const diffPercent = diff !== null && compPrice > 0
    ? (diff / compPrice) * 100
    : null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Users2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Competitor Benchmark Context</h3>
            <p className="text-[11px] text-[#64748B]">Market position relative to external price points</p>
          </div>
        </div>

        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] font-medium">
          {competitorData?.count || 0} Observation{competitorData?.count === 1 ? '' : 's'}
        </span>
      </div>

      {compPrice === null || compPrice === undefined ? (
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center text-xs text-[#64748B]">
          <AlertCircle className="w-4 h-4 text-[#94A3B8] mx-auto mb-1" />
          No competitor benchmark prices recorded for this product.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block mb-1">Our Current Price</span>
            <span className="text-sm font-bold text-[#0F172A]">
              {currentPrice !== null ? formatCurrency(currentPrice, currency) : '—'}
            </span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block mb-1">Competitor Benchmark</span>
            <span className="text-sm font-bold text-[#2563EB]">
              {formatCurrency(compPrice, currency)}
            </span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block mb-1">Price Difference</span>
            <span className={`text-sm font-semibold flex items-center gap-1 ${
              diff > 0 ? 'text-[#DC2626]' : diff < 0 ? 'text-[#15803D]' : 'text-[#475569]'
            }`}>
              {diff > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
              {diff < 0 && <ArrowDownRight className="w-3.5 h-3.5" />}
              {diff === 0 && <Minus className="w-3.5 h-3.5" />}
              {formatCurrencyDelta(diff, currency)}
            </span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block mb-1">Relative Position</span>
            <span className="text-xs font-semibold text-[#0F172A]">
              {diff > 0 ? (
                <span className="text-[#DC2626]">
                  {formatPercentage(diffPercent, true)} higher
                </span>
              ) : diff < 0 ? (
                <span className="text-[#15803D]">
                  {formatPercentage(diffPercent, true)} lower
                </span>
              ) : (
                <span className="text-[#475569]">Parity with competitor</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
