import React from 'react';
import Card from '../../../components/Card';
import CompetitivePositionBadge from './CompetitivePositionBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import {
  calculatePriceDifference,
  calculateRelativePriceDifference,
  determineMarketPosition,
  calculateMarketAverage,
} from '../utils/priceAnalysis';

export default function PriceComparisonCard({
  productName = 'Product',
  ourPrice = null,
  competitorPrices = [],
  currency = 'INR',
}) {
  const marketAverage = calculateMarketAverage(competitorPrices);
  const position = determineMarketPosition(ourPrice, marketAverage);
  const diff = calculatePriceDifference(ourPrice, marketAverage);
  const relDiff = calculateRelativePriceDifference(ourPrice, marketAverage);

  const hasData = ourPrice !== null && marketAverage !== null;

  return (
    <Card
      title="Price Comparison"
      subtitle={`Competitive positioning vs observed market average for ${productName}`}
      headerAction={hasData ? <CompetitivePositionBadge position={position} /> : null}
    >
      {!hasData ? (
        <div className="py-6 text-center text-xs text-[#64748B]">
          Insufficient price data to compute market comparison. Record competitor prices to see price gaps.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
              <span className="text-[11px] text-[#64748B] block">Our Catalog Price</span>
              <span className="text-base font-bold font-mono text-[#0F172A] mt-1 block">
                {formatCurrency(ourPrice, currency)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
              <span className="text-[11px] text-[#64748B] block">Market Average</span>
              <span className="text-base font-bold font-mono text-[#0F172A] mt-1 block">
                {formatCurrency(marketAverage, currency)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
              <span className="text-[11px] text-[#64748B] block">Price Gap</span>
              <span
                className={`text-base font-bold font-mono mt-1 block ${
                  diff > 0 ? 'text-amber-600' : diff < 0 ? 'text-emerald-600' : 'text-[#64748B]'
                }`}
              >
                {diff > 0 ? '+' : ''}
                {formatCurrency(diff, currency)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
              <span className="text-[11px] text-[#64748B] block">Relative Variance</span>
              <span
                className={`text-base font-bold font-mono mt-1 block ${
                  relDiff > 0 ? 'text-amber-600' : relDiff < 0 ? 'text-emerald-600' : 'text-[#64748B]'
                }`}
              >
                {relDiff > 0 ? '+' : ''}
                {relDiff.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-[#1E293B]">
            <p className="font-medium text-[#2563EB]">
              {diff > 0
                ? `Our price is ${relDiff.toFixed(1)}% higher than the observed market average.`
                : diff < 0
                ? `Our price is ${Math.abs(relDiff).toFixed(1)}% lower than the observed market average.`
                : 'Our price is exactly aligned with the observed market average.'}
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Based on {competitorPrices.length} recorded competitor {competitorPrices.length === 1 ? 'observation' : 'observations'}.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
