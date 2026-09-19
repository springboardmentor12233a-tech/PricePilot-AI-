import React from 'react';
import Card from '../../../components/Card';

export default function MarketPosition({ summary = {} }) {
  const {
    totalProducts = 0,
    aboveMarketCount = 0,
    belowMarketCount = 0,
    atMarketCount = 0,
    trackedProductsCount = 0,
  } = summary;

  const untrackedCount = Math.max(0, totalProducts - trackedProductsCount);

  const abovePct = totalProducts > 0 ? (aboveMarketCount / totalProducts) * 100 : 0;
  const atPct = totalProducts > 0 ? (atMarketCount / totalProducts) * 100 : 0;
  const belowPct = totalProducts > 0 ? (belowMarketCount / totalProducts) * 100 : 0;
  const untrackedPct = totalProducts > 0 ? (untrackedCount / totalProducts) * 100 : 0;

  return (
    <Card
      title="Catalog Positioning Distribution"
      subtitle="Proportion of catalog products aligned, above, or below observed market pricing"
    >
      <div className="space-y-4">
        {/* Multi-segment Progress Bar */}
        <div className="w-full h-3 rounded-full bg-[#E2E8F0] overflow-hidden flex">
          {abovePct > 0 && (
            <div
              style={{ width: `${abovePct}%` }}
              className="bg-amber-500 h-full"
              title={`Above Market: ${aboveMarketCount}`}
            />
          )}
          {atPct > 0 && (
            <div
              style={{ width: `${atPct}%` }}
              className="bg-slate-400 h-full"
              title={`At Market: ${atMarketCount}`}
            />
          )}
          {belowPct > 0 && (
            <div
              style={{ width: `${belowPct}%` }}
              className="bg-emerald-500 h-full"
              title={`Below Market: ${belowMarketCount}`}
            />
          )}
          {untrackedPct > 0 && (
            <div
              style={{ width: `${untrackedPct}%` }}
              className="bg-slate-200 h-full"
              title={`Untracked: ${untrackedCount}`}
            />
          )}
        </div>

        {/* Legend & Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Above Market */}
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Above Market
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-bold font-mono text-amber-900">{aboveMarketCount}</span>
              <span className="text-[11px] text-amber-700 font-mono">({abovePct.toFixed(0)}%)</span>
            </div>
          </div>

          {/* At Market */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              At Market
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-bold font-mono text-slate-900">{atMarketCount}</span>
              <span className="text-[11px] text-slate-600 font-mono">({atPct.toFixed(0)}%)</span>
            </div>
          </div>

          {/* Below Market */}
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Below Market
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-bold font-mono text-emerald-900">{belowMarketCount}</span>
              <span className="text-[11px] text-emerald-700 font-mono">({belowPct.toFixed(0)}%)</span>
            </div>
          </div>

          {/* Untracked */}
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="flex items-center gap-1.5 text-[#64748B] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Untracked
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-bold font-mono text-[#0F172A]">{untrackedCount}</span>
              <span className="text-[11px] text-[#64748B] font-mono">({untrackedPct.toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
