import React from 'react';
import formatCurrency from '../../../utils/formatCurrency';
import Badge from '../../../components/Badge';
import { History } from 'lucide-react';

export default function PricingHistoryTable({
  history = [],
  currency = 'INR',
  isLoading = false,
  className = '',
}) {
  if (isLoading) {
    return (
      <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs animate-pulse ${className}`}>
        <div className="h-6 bg-slate-200 rounded w-36 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center shadow-xs ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] flex items-center justify-center mx-auto mb-2.5">
          <History className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-[#0F172A]">No Pricing History Records</p>
        <p className="text-[11px] text-[#64748B] mt-0.5">
          Previous price points and applied recommendations for this product will be recorded here.
        </p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs ${className}`}>
      <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Pricing History Log
        </h3>
        <span className="text-xs text-[#64748B]">{history.length} records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#334155]">
          <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Source / Type</th>
              <th className="px-5 py-3">Change Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {history.map((record, index) => {
              const priceVal = record.price !== undefined ? record.price : (record.new_price !== undefined ? record.new_price : record.old_price);
              const dateVal = record.effective_date || record.created_at || record.timestamp || record.date;
              const source = record.source || (record.recommendation_id ? 'Recommendation' : 'Manual Update');
              const note = record.notes || record.reason || record.description || '—';

              return (
                <tr key={record.id || `hist-${index}`} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-5 py-3 font-medium text-[#0F172A] whitespace-nowrap">
                    {formatDate(dateVal)}
                  </td>
                  <td className="px-5 py-3 font-semibold text-[#0F172A] whitespace-nowrap">
                    {formatCurrency(priceVal, currency)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <Badge variant={source.toLowerCase().includes('recommendation') ? 'primary' : 'default'} size="sm">
                      {source}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-[#64748B] max-w-xs truncate">
                    {note}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
