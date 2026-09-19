import React, { useMemo } from 'react';
import Card from '../../../components/Card';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function PriceGapCard({ comparisons = [] }) {
  const stats = useMemo(() => {
    const tracked = comparisons.filter(
      (c) => c.hasCompetitorData && c.gap !== null && !isNaN(c.gap)
    );

    if (tracked.length === 0) {
      return { count: 0, avgGap: null, maxAbove: null, maxBelow: null };
    }

    const totalGap = tracked.reduce((acc, c) => acc + c.gap, 0);
    const avgGap = totalGap / tracked.length;

    let maxAbove = null;
    let maxBelow = null;

    tracked.forEach((c) => {
      if (c.gap > 0 && (!maxAbove || c.gap > maxAbove.gap)) {
        maxAbove = c;
      }
      if (c.gap < 0 && (!maxBelow || c.gap < maxBelow.gap)) {
        maxBelow = c;
      }
    });

    return {
      count: tracked.length,
      avgGap,
      maxAbove,
      maxBelow,
    };
  }, [comparisons]);

  return (
    <Card
      title="Price Gap Analysis"
      subtitle="Variance metrics between catalog prices and observed market averages"
    >
      {stats.count === 0 ? (
        <div className="py-6 text-center text-xs text-[#64748B]">
          No price gap metrics available yet. Record competitor prices to begin tracking price gaps.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Average Gap */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] block">Average Catalog Gap</span>
            <span
              className={`text-base font-bold font-mono mt-1 block ${
                stats.avgGap > 0
                  ? 'text-amber-600'
                  : stats.avgGap < 0
                  ? 'text-emerald-600'
                  : 'text-[#0F172A]'
              }`}
            >
              {stats.avgGap > 0 ? '+' : ''}
              {formatCurrency(stats.avgGap)}
            </span>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">
              Across {stats.count} observed {stats.count === 1 ? 'product' : 'products'}
            </span>
          </div>

          {/* Highest Variance Above */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] block">Widest Premium Gap</span>
            {stats.maxAbove ? (
              <>
                <span className="text-base font-bold font-mono text-amber-600 mt-1 block">
                  +{formatCurrency(stats.maxAbove.gap)} (+{stats.maxAbove.gapPercentage.toFixed(1)}%)
                </span>
                <span className="text-[11px] text-[#64748B] mt-0.5 block truncate">
                  {stats.maxAbove.product.name}
                </span>
              </>
            ) : (
              <span className="text-xs text-[#64748B] mt-1 block">None above market</span>
            )}
          </div>

          {/* Widest Discount Below */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] block">Widest Value Gap</span>
            {stats.maxBelow ? (
              <>
                <span className="text-base font-bold font-mono text-emerald-600 mt-1 block">
                  {formatCurrency(stats.maxBelow.gap)} ({stats.maxBelow.gapPercentage.toFixed(1)}%)
                </span>
                <span className="text-[11px] text-[#64748B] mt-0.5 block truncate">
                  {stats.maxBelow.product.name}
                </span>
              </>
            ) : (
              <span className="text-xs text-[#64748B] mt-1 block">None below market</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
