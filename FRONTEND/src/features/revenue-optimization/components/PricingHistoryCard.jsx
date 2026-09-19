import React from 'react';
import { History, AlertCircle } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export default function PricingHistoryCard({
  history = [],
  product,
  isLoading = false,
  error = null,
}) {
  const currency = product?.currency || 'INR';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Pricing History</h3>
            <p className="text-[11px] text-[#64748B]">
              Recorded price changes and recommendations applied to this item
            </p>
          </div>
        </div>

        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] font-medium">
          {history.length} Record{history.length === 1 ? '' : 's'}
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-[#64748B] animate-pulse">
          Loading pricing history...
        </div>
      ) : error ? (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{error}</span>
        </div>
      ) : history.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1]">
          <History className="w-6 h-6 text-[#94A3B8] mx-auto mb-1.5" />
          <p className="font-medium text-[#0F172A]">No pricing history is available for this product.</p>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">
            Previous catalog revisions or approved recommendations will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Price</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {history.map((record, index) => {
                const dateStr = record.created_at || record.timestamp || record.date;
                const formattedDate = dateStr ? formatDate(dateStr) : '—';
                const price = record.price ?? record.new_price ?? record.recommended_price;
                const source = record.source || record.change_reason || (record.recommendation_id ? 'AI Recommendation' : 'Manual Update');
                const status = (record.status || 'ACTIVE').toUpperCase();

                return (
                  <tr key={record.id || index} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-3 text-[#0F172A] whitespace-nowrap font-mono text-[11px]">
                      {formattedDate}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#0F172A]">
                      {price !== null && price !== undefined ? formatCurrency(price, currency) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B] capitalize">
                      {source}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        status === 'APPLIED' || status === 'ACTIVE'
                          ? 'bg-[#DCFCE7] text-[#16A34A]'
                          : 'bg-[#F1F5F9] text-[#475569]'
                      }`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
