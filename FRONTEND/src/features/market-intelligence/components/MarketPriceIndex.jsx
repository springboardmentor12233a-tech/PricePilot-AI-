import React, { useMemo } from 'react';
import Card from '../../../components/Card';
import { calculateMarketPriceIndex } from '../../competitors/utils/priceAnalysis';
import { Gauge } from 'lucide-react';

export default function MarketPriceIndex({ comparisons = [] }) {
  const { index, validCount, diffPercentage } = useMemo(() => {
    const validIndices = comparisons
      .map((c) => {
        if (!c.hasCompetitorData || !c.marketAverage || !c.ourPrice) return null;
        return calculateMarketPriceIndex(c.ourPrice, c.marketAverage);
      })
      .filter((v) => v !== null && !isNaN(v));

    if (validIndices.length === 0) {
      return { index: null, validCount: 0, diffPercentage: null };
    }

    const avgIndex = validIndices.reduce((acc, curr) => acc + curr, 0) / validIndices.length;
    const diffPct = (avgIndex - 1) * 100;

    return {
      index: avgIndex,
      validCount: validIndices.length,
      diffPercentage: diffPct,
    };
  }, [comparisons]);

  return (
    <Card
      title="Market Price Index"
      subtitle="Catalog-wide ratio of our catalog prices against observed competitor averages (Base = 1.00)"
    >
      {index === null ? (
        <div className="py-6 text-center text-xs text-[#64748B]">
          No competitor observations recorded yet to compute Market Price Index.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 shadow-xs">
              <Gauge className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#0F172A]">
                  {index.toFixed(2)}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    diffPercentage > 2
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : diffPercentage < -2
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  {diffPercentage > 0 ? `+${diffPercentage.toFixed(1)}%` : `${diffPercentage.toFixed(1)}%`} vs Market
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                Computed across {validCount} monitored catalog {validCount === 1 ? 'product' : 'products'} with active competitor observations.
              </p>
            </div>
          </div>

          <div className="text-xs text-[#64748B] sm:max-w-xs text-center sm:text-right border-t sm:border-t-0 sm:border-l border-[#E2E8F0] pt-3 sm:pt-0 sm:pl-6">
            <p className="font-medium text-[#0F172A]">Index Interpretation</p>
            <p className="mt-1 leading-relaxed">
              {diffPercentage > 0
                ? `On average, our catalog is priced ${(diffPercentage).toFixed(1)}% higher than observed competitor price points.`
                : diffPercentage < 0
                ? `On average, our catalog is priced ${Math.abs(diffPercentage).toFixed(1)}% lower than observed competitor price points.`
                : 'On average, our catalog pricing matches the observed market average exactly.'}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
