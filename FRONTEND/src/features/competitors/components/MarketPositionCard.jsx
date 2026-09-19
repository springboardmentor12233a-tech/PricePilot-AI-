import React from 'react';
import Card from '../../../components/Card';
import CompetitivePositionBadge from './CompetitivePositionBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import {
  calculateMarketAverage,
  determineMarketPosition,
  getPriceRange,
} from '../utils/priceAnalysis';

export default function MarketPositionCard({
  ourPrice = null,
  observations = [],
  currency = 'INR',
}) {
  const marketAverage = calculateMarketAverage(observations);
  const position = determineMarketPosition(ourPrice, marketAverage);
  const range = getPriceRange(observations);

  const hasData = ourPrice !== null && marketAverage !== null && range.min !== null;

  return (
    <Card
      title="Market Positioning"
      subtitle="Descriptive distribution of observed market price points"
      headerAction={hasData ? <CompetitivePositionBadge position={position} /> : null}
    >
      {!hasData ? (
        <div className="py-6 text-center text-xs text-[#64748B]">
          No competitor observations available to calculate market positioning.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#F8FAFC]">
              <span className="text-[11px] text-[#64748B] block">Lowest Observed</span>
              <span className="text-sm font-bold font-mono text-[#0F172A] mt-0.5 block">
                {formatCurrency(range.min, currency)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <span className="text-[11px] text-[#2563EB] font-medium block">Market Average</span>
              <span className="text-sm font-bold font-mono text-[#2563EB] mt-0.5 block">
                {formatCurrency(marketAverage, currency)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC]">
              <span className="text-[11px] text-[#64748B] block">Highest Observed</span>
              <span className="text-sm font-bold font-mono text-[#0F172A] mt-0.5 block">
                {formatCurrency(range.max, currency)}
              </span>
            </div>
          </div>

          {/* Range Spread Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1.5">
              <span>Market Spread: {formatCurrency(range.spread, currency)}</span>
              <span>Our Position: {position.label}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden relative">
              <div
                className={`h-full rounded-full ${
                  position.status === 'below_market'
                    ? 'bg-blue-500'
                    : position.status === 'above_market'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: range.spread > 0 && ourPrice >= range.min
                    ? `${Math.min(100, Math.max(5, ((ourPrice - range.min) / range.spread) * 100))}%`
                    : '50%',
                }}
              />
            </div>
          </div>

          <p className="text-xs text-[#64748B] leading-relaxed">
            {position.description}
          </p>
        </div>
      )}
    </Card>
  );
}
