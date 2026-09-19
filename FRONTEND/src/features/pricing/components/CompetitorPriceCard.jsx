import React from 'react';
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import { calculatePriceDifference, calculatePriceDifferencePercent } from '../utils/pricingCalculations';

export default function CompetitorPriceCard({
  product,
  competitorData,
  className = '',
}) {
  const ourPrice = product?.base_price !== undefined && product?.base_price !== null
    ? Number(product.base_price)
    : null;

  const currency = product?.currency || 'INR';

  // competitorData may have latestPrice or marketAverage
  const compPrice = competitorData?.latestPrice || competitorData?.marketAverage || null;
  const count = competitorData?.count || (competitorData?.observations?.length) || 0;

  const diff = calculatePriceDifference(ourPrice, compPrice);
  const diffPercent = calculatePriceDifferencePercent(ourPrice, compPrice);

  const hasData = compPrice !== null && !isNaN(compPrice) && count > 0;

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Observed Competitor Benchmark
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
          <Users className="w-4 h-4" />
        </div>
      </div>

      {hasData ? (
        <>
          <div className="text-2xl font-bold text-[#0F172A] tracking-tight mb-2">
            {formatCurrency(compPrice, currency)}
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
            <span>Observations:</span>
            <span className="font-medium text-[#334155]">{count} recorded</span>
          </div>

          {diff !== null && diffPercent !== null && (
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Price Delta:</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  diff > 0
                    ? 'text-[#B45309]'
                    : diff < 0
                    ? 'text-[#15803D]'
                    : 'text-[#475569]'
                }`}
              >
                {diff > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{formatCurrency(diff, currency)} (+{diffPercent.toFixed(1)}%)
                  </>
                ) : diff < 0 ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    {formatCurrency(diff, currency)} ({diffPercent.toFixed(1)}%)
                  </>
                ) : (
                  <>
                    <Minus className="w-3.5 h-3.5" />
                    Parity with market
                  </>
                )}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="py-2">
          <p className="text-sm font-medium text-[#64748B]">No competitor data</p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Record competitor price observations in the Competitor Intelligence module.
          </p>
        </div>
      )}
    </div>
  );
}
