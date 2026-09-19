import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Percent, ArrowRight, TrendingUp, Scale, AlertCircle } from 'lucide-react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function ExecutivePricingOverview({
  summaryMetrics = {},
  products = [],
  currency = 'INR',
}) {
  const navigate = useNavigate();

  const avgPrice = summaryMetrics.averagePrice;
  const avgDiscount = summaryMetrics.averageDiscount;
  const avgPriceChange = summaryMetrics.averagePriceChange;
  const competitorBenchmark = summaryMetrics.competitorBenchmarkPrice;

  // Calculate price difference if both avgPrice and competitorBenchmark exist
  let competitorDiffPercent = null;
  if (avgPrice && competitorBenchmark) {
    competitorDiffPercent = ((avgPrice - competitorBenchmark) / competitorBenchmark) * 100;
  }

  return (
    <Card
      title="Pricing Performance"
      subtitle="Catalog price distributions and competitive alignment"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/pricing')}
          rightIcon={ArrowRight}
          className="text-xs text-[#2563EB]"
        >
          Pricing Intelligence
        </Button>
      }
    >
      <div className="space-y-4 pt-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[11px] font-medium text-[#64748B] block">Current Average Price</span>
            <span className="text-base sm:text-lg font-bold text-[#0F172A] mt-1 block">
              {avgPrice !== null && avgPrice !== undefined ? formatCurrency(avgPrice, currency) : 'Not available'}
            </span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[11px] font-medium text-[#64748B] block">Average Discount</span>
            <span className="text-base sm:text-lg font-bold text-[#0F172A] mt-1 block">
              {avgDiscount !== null && avgDiscount !== undefined ? `${avgDiscount.toFixed(1)}%` : 'Not available'}
            </span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[11px] font-medium text-[#64748B] block">Observed Price Changes</span>
            <span className="text-base sm:text-lg font-bold text-[#0F172A] mt-1 block">
              {avgPriceChange !== null && avgPriceChange !== undefined
                ? `${avgPriceChange > 0 ? '+' : ''}${avgPriceChange.toFixed(1)}%`
                : 'Not available'}
            </span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[11px] font-medium text-[#64748B] block">Competitor Difference</span>
            <span className="text-base sm:text-lg font-bold text-[#0F172A] mt-1 block">
              {competitorDiffPercent !== null
                ? `${competitorDiffPercent > 0 ? '+' : ''}${competitorDiffPercent.toFixed(1)}%`
                : 'Not available'}
            </span>
          </div>
        </div>

        {/* Product Price Range Distribution */}
        {products && products.length > 0 ? (
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
              <span>Lowest Listed Base Price</span>
              <span>Highest Listed Base Price</span>
            </div>
            {(() => {
              const prices = products.map((p) => Number(p.base_price || 0)).filter((p) => p > 0);
              if (prices.length === 0) return <p className="text-xs text-[#94A3B8]">No prices defined</p>;
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              return (
                <div>
                  <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden flex">
                    <div className="bg-[#2563EB] h-full w-full rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A] mt-1.5 font-mono">
                    <span>{formatCurrency(min, currency)}</span>
                    <span>{formatCurrency(max, currency)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            Catalog products not yet loaded or empty.
          </div>
        )}
      </div>
    </Card>
  );
}
