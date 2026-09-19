import React from 'react';
import { formatCurrency } from '../../../utils/formatCurrency';
import { Calendar, Building2, Tag } from 'lucide-react';

export default function PriceHistoryTable({ observations = [] }) {
  if (!Array.isArray(observations) || observations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center bg-[#F8FAFC]">
        <Tag className="w-7 h-7 text-[#94A3B8] mx-auto mb-2" />
        <p className="text-xs font-semibold text-[#0F172A]">No price history observations available</p>
        <p className="text-[11px] text-[#64748B] mt-0.5">
          Observations recorded over time will appear here to illustrate historical price changes.
        </p>
      </div>
    );
  }

  // Sort descending by date
  const sorted = [...observations].sort((a, b) => {
    const timeA = a.observed_at ? new Date(a.observed_at).getTime() : 0;
    const timeB = b.observed_at ? new Date(b.observed_at).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="w-full text-left text-xs text-[#0F172A]">
        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
          <tr>
            <th scope="col" className="py-2.5 pl-4 pr-3">Competitor / Entity</th>
            <th scope="col" className="py-2.5 px-3 text-right">Recorded Price</th>
            <th scope="col" className="py-2.5 px-3">Observed Date & Time</th>
            <th scope="col" className="py-2.5 pl-3 pr-4">Channel / Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5F9]">
          {sorted.map((item, idx) => (
            <tr key={item.id || idx} className="hover:bg-[#F8FAFC]">
              <td className="py-2.5 pl-4 pr-3 font-medium text-[#0F172A]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{item.competitor_name || item.competitor?.name || 'Market Listing'}</span>
                </div>
              </td>

              <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#0F172A]">
                {formatCurrency(item.price, item.currency)}
              </td>

              <td className="py-2.5 px-3 text-[#64748B] whitespace-nowrap">
                {item.observed_at ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#94A3B8]" />
                    {new Date(item.observed_at).toLocaleString([], {
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
                {item.source || 'Manual Observation'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
