import React, { useState, useMemo } from 'react';
import CompetitivePositionBadge from '../../competitors/components/CompetitivePositionBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { Package, Search, PlusCircle, Link2 } from 'lucide-react';
import Button from '../../../components/Button';

export default function CompetitivePriceTable({
  comparisons = [],
  onRecordPrice,
  onMatchProduct,
}) {
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');

  const filtered = useMemo(() => {
    return comparisons.filter((c) => {
      if (!c || !c.product) return false;

      // Position filter
      if (positionFilter === 'above' && c.position.status !== 'above_market') return false;
      if (positionFilter === 'below' && c.position.status !== 'below_market') return false;
      if (positionFilter === 'at' && c.position.status !== 'at_market') return false;
      if (positionFilter === 'untracked' && c.hasCompetitorData) return false;

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const name = (c.product.name || '').toLowerCase();
        const sku = (c.product.sku || '').toLowerCase();
        if (!name.includes(query) && !sku.includes(query)) return false;
      }

      return true;
    });
  }, [comparisons, search, positionFilter]);

  return (
    <div className="space-y-3">
      {/* Search & Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog products..."
            className="w-full h-9.5 pl-8 pr-3 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="h-9.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
            aria-label="Filter by market position"
          >
            <option value="all">All Positions</option>
            <option value="above">Above Market</option>
            <option value="below">Below Market</option>
            <option value="at">At Market</option>
            <option value="untracked">Untracked</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
        <table className="w-full text-left text-xs text-[#0F172A]">
          <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
            <tr>
              <th scope="col" className="py-3 pl-4 pr-3">Product</th>
              <th scope="col" className="py-3 px-3 text-right">Our Price</th>
              <th scope="col" className="py-3 px-3 text-right">Market Avg</th>
              <th scope="col" className="py-3 px-3 text-right">Price Gap (₹)</th>
              <th scope="col" className="py-3 px-3 text-right">Gap %</th>
              <th scope="col" className="py-3 px-3 text-center">Position</th>
              <th scope="col" className="py-3 px-3 text-center">Observations</th>
              <th scope="col" className="py-3 pl-3 pr-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-[#64748B]">
                  No products matched the filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const { product, ourPrice, marketAverage, gap, gapPercentage, position, observationCount } = item;

                return (
                  <tr key={product.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    {/* Product Name */}
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-[#0F172A] line-clamp-1">
                            {product.name}
                          </span>
                          <span className="text-[11px] font-mono text-[#94A3B8]">
                            SKU: {product.sku || '—'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Our Price */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[#0F172A]">
                      {ourPrice !== null ? formatCurrency(ourPrice, product.currency) : '—'}
                    </td>

                    {/* Market Average */}
                    <td className="py-3 px-3 text-right font-mono text-[#0F172A]">
                      {marketAverage !== null ? formatCurrency(marketAverage, product.currency) : '—'}
                    </td>

                    {/* Gap */}
                    <td className="py-3 px-3 text-right font-mono">
                      {gap !== null ? (
                        <span
                          className={
                            gap > 0
                              ? 'text-amber-600 font-semibold'
                              : gap < 0
                              ? 'text-emerald-600 font-semibold'
                              : 'text-[#64748B]'
                          }
                        >
                          {gap > 0 ? '+' : ''}
                          {formatCurrency(gap, product.currency)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Gap % */}
                    <td className="py-3 px-3 text-right font-mono">
                      {gapPercentage !== null ? (
                        <span
                          className={
                            gapPercentage > 0
                              ? 'text-amber-600 font-semibold'
                              : gapPercentage < 0
                              ? 'text-emerald-600 font-semibold'
                              : 'text-[#64748B]'
                          }
                        >
                          {gapPercentage > 0 ? '+' : ''}
                          {gapPercentage.toFixed(1)}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Position Badge */}
                    <td className="py-3 px-3 text-center">
                      <CompetitivePositionBadge position={position} />
                    </td>

                    {/* Observation Count */}
                    <td className="py-3 px-3 text-center font-mono text-xs text-[#64748B]">
                      {observationCount}
                    </td>

                    {/* Action */}
                    <td className="py-3 pl-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onRecordPrice && (
                          <button
                            type="button"
                            onClick={() => onRecordPrice(product.id)}
                            className="p-1.5 rounded-lg text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Record competitor price observation"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        )}
                        {onMatchProduct && (
                          <button
                            type="button"
                            onClick={() => onMatchProduct(product.id)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors cursor-pointer"
                            title="Match with competitor product"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
