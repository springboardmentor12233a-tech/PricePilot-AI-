import React from 'react';
import { Calendar, Tag, DollarSign, Percent, AlertCircle } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import Skeleton from '../../../components/Skeleton';

/**
 * HistoricalDemandTable Component
 * Displays real historical sales records from backend sales analytics.
 * Strictly labels historical observed transactions as "Units Sold", not "Demand".
 */
export default function HistoricalDemandTable({
  sales = [],
  currency = 'INR',
  isLoading = false,
  className = '',
}) {
  if (isLoading) {
    return (
      <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-3 ${className}`}>
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <Skeleton width="180px" height="18px" />
          <Skeleton width="80px" height="14px" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height="40px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F8FAFC]/50">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A]">
            Historical Sales Activity
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Observed transaction velocity from registered sales channel events.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F1F5F9] text-[#475569] self-start sm:self-auto">
          {sales.length} Records Observed
        </span>
      </div>

      {sales.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8] flex items-center justify-center mx-auto mb-2.5">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-[#475569]">
            No historical demand data is available for this product.
          </p>
          <p className="text-[11px] text-[#94A3B8] max-w-sm mx-auto mt-1">
            Recorded sales transactions via POST /api/v1/sales/ or order synchronization will appear in this ledger.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider bg-[#F8FAFC]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Units Sold</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-center">Discount</th>
                <th className="py-3 px-4 text-center">Promotion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4 text-[#0F172A] font-medium whitespace-nowrap">
                    {formatDate(sale.date, 'medium')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-[#0F172A] whitespace-nowrap">
                    {sale.unitsSold !== null && sale.unitsSold !== undefined
                      ? Math.round(sale.unitsSold).toLocaleString()
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-right text-[#475569] whitespace-nowrap">
                    {sale.unitPrice !== null && sale.unitPrice !== undefined
                      ? formatCurrency(sale.unitPrice, currency)
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-[#15803D] whitespace-nowrap">
                    {sale.revenue !== null && sale.revenue !== undefined
                      ? formatCurrency(sale.revenue, currency)
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-center text-[#64748B] whitespace-nowrap">
                    {sale.discount !== null && sale.discount !== undefined
                      ? `${sale.discount}%`
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {sale.promotion ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#ECFDF5] text-[#16A34A]">
                        Active
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
