import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import Badge from '../../../components/Badge';

/**
 * PredictionTrendCard
 * Displays ONLY if backend explicitly returns trend:
 * Increasing, Stable, Decreasing.
 * Never invents a trend.
 */
export default function PredictionTrendCard({ trend, className = '' }) {
  let trendConfig = null;

  if (trend && typeof trend === 'string') {
    const t = trend.toLowerCase().trim();
    if (t.includes('increase') || t.includes('up') || t.includes('growth')) {
      trendConfig = {
        label: 'Increasing',
        icon: TrendingUp,
        variant: 'success',
        textClass: 'text-[#15803D]',
        desc: 'Model projects increasing demand momentum under current price conditions.',
      };
    } else if (t.includes('decrease') || t.includes('down') || t.includes('drop')) {
      trendConfig = {
        label: 'Decreasing',
        icon: TrendingDown,
        variant: 'danger',
        textClass: 'text-[#DC2626]',
        desc: 'Model projects contracting demand volume under current price conditions.',
      };
    } else if (t.includes('stable') || t.includes('flat') || t.includes('neutral')) {
      trendConfig = {
        label: 'Stable',
        icon: Minus,
        variant: 'default',
        textClass: 'text-[#475569]',
        desc: 'Model projects stable demand equilibrium under current price conditions.',
      };
    } else {
      trendConfig = {
        label: trend,
        icon: Minus,
        variant: 'default',
        textClass: 'text-[#475569]',
        desc: `Backend reported trend: ${trend}`,
      };
    }
  }

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Demand Trend
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
          {trendConfig ? (
            <trendConfig.icon className={`w-4 h-4 ${trendConfig.textClass}`} />
          ) : (
            <Minus className="w-4 h-4 text-[#94A3B8]" />
          )}
        </div>
      </div>

      {trendConfig ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={trendConfig.variant} size="md" dot>
              {trendConfig.label}
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed pt-2 border-t border-[#F1F5F9]">
            {trendConfig.desc}
          </p>
        </>
      ) : (
        <div className="py-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <Info className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <span>Not provided by model endpoint</span>
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed">
            Directional trend classification was not included in this prediction response.
          </p>
        </div>
      )}
    </div>
  );
}
