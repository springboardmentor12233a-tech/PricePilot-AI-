import React from 'react';
import Card from '../../../components/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Reusable StatCard component for Dashboard & Metrics
 */
export default function StatCard({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral', // 'positive' | 'negative' | 'neutral'
  icon: Icon,
  badgeText,
  className = '',
  loading = false,
}) {
  if (loading) {
    return (
      <Card className={`p-6 animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="w-8 h-8 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-20" />
      </Card>
    );
  }

  const changeColors = {
    positive: 'text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]',
    negative: 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]',
    neutral: 'text-[#64748B] bg-[#F1F5F9] border-[#E2E8F0]',
  };

  const ChangeIcon =
    changeType === 'positive' ? TrendingUp : changeType === 'negative' ? TrendingDown : Minus;

  return (
    <Card className={`hover:border-[#CBD5E1] transition-all duration-150 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#64748B]">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              {value !== undefined && value !== null ? value : '—'}
            </span>
          </div>
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>

      {(change || subtitle || badgeText) && (
        <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
          {change ? (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium text-[11px] ${
                changeColors[changeType] || changeColors.neutral
              }`}
            >
              <ChangeIcon className="w-3 h-3" />
              {change}
            </span>
          ) : (
            <span />
          )}

          {subtitle && <span className="text-[#94A3B8]">{subtitle}</span>}
          {badgeText && (
            <span className="text-[11px] text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
