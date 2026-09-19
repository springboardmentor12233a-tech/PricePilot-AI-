import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

/**
 * DemandTrendCard Component
 * Displays trend direction ONLY when returned by the backend or derived from a multi-point sequence.
 * If single-point prediction without explicit backend trend, clearly communicates unavailablity.
 */
export default function DemandTrendCard({ trend, forecastPoints, className = '' }) {
  // If backend provided a trend string
  let trendLabel = null;
  let trendType = 'neutral'; // 'positive' | 'negative' | 'neutral'

  if (trend && typeof trend === 'string') {
    const t = trend.toLowerCase();
    if (t.includes('increase') || t.includes('up')) {
      trendLabel = 'Increasing';
      trendType = 'positive';
    } else if (t.includes('decrease') || t.includes('down')) {
      trendLabel = 'Decreasing';
      trendType = 'negative';
    } else if (t.includes('stable') || t.includes('flat')) {
      trendLabel = 'Stable';
      trendType = 'neutral';
    } else {
      trendLabel = trend;
      trendType = 'neutral';
    }
  } else if (Array.isArray(forecastPoints) && forecastPoints.length >= 2) {
    const first = Number(forecastPoints[0].demand || forecastPoints[0].value || 0);
    const last = Number(forecastPoints[forecastPoints.length - 1].demand || forecastPoints[forecastPoints.length - 1].value || 0);
    const delta = last - first;
    if (delta > 0.05 * first) {
      trendLabel = 'Increasing';
      trendType = 'positive';
    } else if (delta < -0.05 * first) {
      trendLabel = 'Decreasing';
      trendType = 'negative';
    } else {
      trendLabel = 'Stable';
      trendType = 'neutral';
    }
  }

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Demand Velocity Trend
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
            Directionality
          </span>
        </div>

        {trendLabel ? (
          <div className="flex items-center gap-3 mt-2">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                trendType === 'positive'
                  ? 'bg-[#ECFDF5] text-[#16A34A]'
                  : trendType === 'negative'
                  ? 'bg-[#FEF2F2] text-[#DC2626]'
                  : 'bg-[#F1F5F9] text-[#475569]'
              }`}
            >
              {trendType === 'positive' && <TrendingUp className="w-5 h-5" />}
              {trendType === 'negative' && <TrendingDown className="w-5 h-5" />}
              {trendType === 'neutral' && <Minus className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xl font-bold text-[#0F172A]">{trendLabel}</div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {trendType === 'positive' && 'Projected demand trajectory indicates expansion.'}
                {trendType === 'negative' && 'Projected demand trajectory indicates contraction.'}
                {trendType === 'neutral' && 'Projected demand remains steady across period.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-2 py-1">
            <div className="text-sm font-semibold text-[#64748B]">
              Trend unavailable for a single-point prediction.
            </div>
            <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
              Directional slope calculations require chronological multi-day forecast vectors from the backend.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
        <Info className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
        <span>Derived from actual model responses</span>
      </div>
    </div>
  );
}
