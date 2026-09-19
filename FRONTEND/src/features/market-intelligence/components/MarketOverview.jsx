import React from 'react';
import Card from '../../../components/Card';
import { Users2, Package, Tag, TrendingUp, TrendingDown } from 'lucide-react';

export default function MarketOverview({ summary = {} }) {
  const {
    totalProducts = 0,
    trackedProductsCount = 0,
    activeCompetitorsCount = 0,
    totalCompetitorsCount = 0,
    aboveMarketCount = 0,
    belowMarketCount = 0,
    atMarketCount = 0,
    totalObservationsCount = 0,
  } = summary;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Active Competitors */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center justify-between text-[#64748B] mb-2">
          <span className="text-xs font-medium">Competitors</span>
          <Users2 className="w-4 h-4 text-[#2563EB]" />
        </div>
        <span className="text-xl font-bold font-mono text-[#0F172A] block">
          {totalCompetitorsCount > 0 ? activeCompetitorsCount : '0'}
        </span>
        <span className="text-[11px] text-[#64748B] mt-0.5 block">
          {totalCompetitorsCount > 0
            ? `${activeCompetitorsCount} of ${totalCompetitorsCount} active`
            : 'No competitors added'}
        </span>
      </div>

      {/* Products Tracked */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center justify-between text-[#64748B] mb-2">
          <span className="text-xs font-medium">Products Monitored</span>
          <Package className="w-4 h-4 text-[#2563EB]" />
        </div>
        <span className="text-xl font-bold font-mono text-[#0F172A] block">
          {trackedProductsCount}
        </span>
        <span className="text-[11px] text-[#64748B] mt-0.5 block">
          {totalProducts > 0 ? `${trackedProductsCount} of ${totalProducts} in catalog` : 'No catalog products'}
        </span>
      </div>

      {/* Total Observations */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center justify-between text-[#64748B] mb-2">
          <span className="text-xs font-medium">Price Points</span>
          <Tag className="w-4 h-4 text-[#64748B]" />
        </div>
        <span className="text-xl font-bold font-mono text-[#0F172A] block">
          {totalObservationsCount}
        </span>
        <span className="text-[11px] text-[#64748B] mt-0.5 block">
          Recorded observations
        </span>
      </div>

      {/* Above Market */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center justify-between text-[#64748B] mb-2">
          <span className="text-xs font-medium">Above Market</span>
          <TrendingUp className="w-4 h-4 text-amber-600" />
        </div>
        <span className="text-xl font-bold font-mono text-amber-600 block">
          {aboveMarketCount}
        </span>
        <span className="text-[11px] text-[#64748B] mt-0.5 block">
          Price &gt; 2% over market
        </span>
      </div>

      {/* Below Market */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-[#64748B] mb-2">
          <span className="text-xs font-medium">Below Market</span>
          <TrendingDown className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="text-xl font-bold font-mono text-emerald-600 block">
          {belowMarketCount}
        </span>
        <span className="text-[11px] text-[#64748B] mt-0.5 block">
          Price &lt; 2% under market
        </span>
      </div>
    </div>
  );
}
