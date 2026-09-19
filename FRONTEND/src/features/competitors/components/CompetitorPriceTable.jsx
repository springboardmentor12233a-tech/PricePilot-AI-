import React from 'react';
import { formatCurrency } from '../../../utils/formatCurrency';
import { calculatePriceDifference, calculateRelativePriceDifference } from '../utils/priceAnalysis';
import { Building2, Calendar, Tag } from 'lucide-react';

export default function CompetitorPriceTable({
  prices = [],
  ourPrice = null,
  competitors = [],
}) {
  const competitorMap = React.useMemo(() => {
    return new Map(competitors.map((c) => [String(c.id), c.name]));
  }, [competitors]);

  if (!Array.isArray(prices) || prices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center bg-[#F8FAFC]">
        <Tag className="w-7 h-7 text-[#94A3B8] mx-auto mb-2" />
        <p className="text-xs font-semibold text-[#0F172A]">No competitor price observations recorded</p>
        <p className="text-[11px] text-[#64748B] mt-0.5">
          Record competitor price observations to analyze price gaps and market averages.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="w-full text-left text-xs text-[#0F172A]">
        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
          <tr>
            <th scope="col" className="py-2.5 pl-4 pr-3">Competitor</th>
            <th scope="col" className="py-2.5 px-3 text-right">Observed Price</th>
            {ourPrice !== null && (
              <th scope="col" className="py-2.5 px-3 text-right">Variance vs Ours</th>
            )}
            <th scope="col" className="py-2.5 px-3">Observed At</th>
            <th scope="col" className="py-2.5 pl-3 pr-4">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5F9]">
          {prices.map((obs, idx) => {
            const compName =
              obs.competitor_name ||
              (obs.competitor_id ? competitorMap.get(String(obs.competitor_id)) : null) ||
              obs.competitor?.name ||
              'Market Observation';

            const diff = ourPrice !== null ? calculatePriceDifference(ourPrice, obs.price) : null;
            const relDiff = ourPrice !== null ? calculateRelativePriceDifference(ourPrice, obs.price) : null;

            return (
              <tr key={obs.id || idx} className="hover:bg-[#F8FAFC]">
                <td className="py-2.5 pl-4 pr-3 font-medium text-[#0F172A]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>{compName}</span>
                  </div>
                </td>

                <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#0F172A]">
                  {formatCurrency(obs.price, obs.currency)}
                </td>

                {ourPrice !== null && (
                  <td className="py-2.5 px-3 text-right font-mono">
                    {diff !== null ? (
                      <span
                        className={
                          diff > 0
                            ? 'text-amber-600 font-medium'
                            : diff < 0
                            ? 'text-emerald-600 font-medium'
                            : 'text-[#64748B]'
                        }
                      >
                        {diff > 0 ? '+' : ''}
                        {formatCurrency(diff)} ({relDiff !== null ? (relDiff > 0 ? `+${relDiff.toFixed(1)}%` : `${relDiff.toFixed(1)}%`) : '—'})
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                )}

                <td className="py-2.5 px-3 text-[#64748B] whitespace-nowrap">
                  {obs.observed_at ? (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#94A3B8]" />
                      {new Date(obs.observed_at).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>

                <td className="py-2.5 pl-3 pr-4 text-[#64748B]">
                  {obs.source || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
