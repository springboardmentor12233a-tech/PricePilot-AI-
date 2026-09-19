import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export default function ProductPricingTable({
  products = [],
  categories = [],
  selectedProductId,
  onSelectProduct,
  currency = 'INR',
}) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter products by local search query
  const searchedProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const name = p.name?.toLowerCase() || '';
      const sku = p.sku?.toLowerCase() || '';
      return name.includes(q) || sku.includes(q);
    });
  }, [products, search]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...searchedProducts];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Special handling for category
      if (sortField === 'category') {
        const catA = categories.find((c) => String(c.id) === String(a.category_id))?.name || a.category?.name || '';
        const catB = categories.find((c) => String(c.id) === String(b.category_id))?.name || b.category?.name || '';
        valA = catA.toLowerCase();
        valB = catB.toLowerCase();
      } else if (sortField === 'name' || sortField === 'sku') {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
      } else {
        // Numeric sort (base_price, cost_price, discount, etc.)
        valA = valA !== null && valA !== undefined ? Number(valA) : -Infinity;
        valB = valB !== null && valB !== undefined ? Number(valB) : -Infinity;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [searchedProducts, sortField, sortDirection, categories]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-[#94A3B8]" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#2563EB]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#2563EB]" />
    );
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A]">Product-Level Pricing Performance</h3>
          <p className="text-[11px] text-[#64748B]">
            Review current catalog prices, unit costs, discounts, and last update timestamps
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#64748B]">
          <Package className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
          <p className="font-semibold text-[#0F172A]">No products are available for analytics.</p>
          <p className="text-[#94A3B8] mt-0.5">Add items to your catalog in the Products workspace.</p>
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#64748B]">
          No products matched your search "{search}".
        </div>
      ) : (
        <>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-[#0F172A]"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-[#0F172A]"
                    onClick={() => handleSort('sku')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>SKU</span>
                      {getSortIcon('sku')}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-[#0F172A]"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      {getSortIcon('category')}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-[#0F172A]"
                    onClick={() => handleSort('base_price')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Current Price</span>
                      {getSortIcon('base_price')}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-[#0F172A]"
                    onClick={() => handleSort('cost_price')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Cost Price</span>
                      {getSortIcon('cost_price')}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-[#0F172A]"
                    onClick={() => handleSort('discount')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Discount</span>
                      {getSortIcon('discount')}
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Unit Margin</th>
                  <th className="py-2.5 px-3">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {paginatedProducts.map((product) => {
                  const isSelected = String(product.id) === String(selectedProductId);
                  const catName =
                    categories.find((c) => String(c.id) === String(product.category_id))?.name ||
                    product.category?.name ||
                    '—';

                  const basePrice =
                    product.base_price !== null && product.base_price !== undefined
                      ? Number(product.base_price)
                      : null;
                  const costPrice =
                    product.cost_price !== null && product.cost_price !== undefined
                      ? Number(product.cost_price)
                      : null;
                  const discount =
                    product.discount !== null && product.discount !== undefined
                      ? Number(product.discount)
                      : 0;

                  let unitMargin = null;
                  if (basePrice !== null && costPrice !== null && basePrice > 0) {
                    unitMargin = ((basePrice - costPrice) / basePrice) * 100;
                  }

                  const dateStr = product.updated_at || product.created_at;

                  return (
                    <tr
                      key={product.id}
                      onClick={() => onSelectProduct(product.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#EFF6FF] text-[#1E3A8A]'
                          : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <td className="py-3 px-3 font-semibold text-[#0F172A]">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                          )}
                          <span className="hover:underline">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#64748B]">
                        {product.sku || '—'}
                      </td>
                      <td className="py-3 px-3 text-[#64748B]">{catName}</td>
                      <td className="py-3 px-3 font-bold font-mono text-[#0F172A]">
                        {basePrice !== null ? formatCurrency(basePrice, currency) : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#64748B]">
                        {costPrice !== null ? formatCurrency(costPrice, currency) : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {discount > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FAF5FF] text-[#9333EA]">
                            {discount}%
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">0%</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {unitMargin !== null ? (
                          <span
                            className={`font-semibold ${
                              unitMargin >= 25
                                ? 'text-[#16A34A]'
                                : unitMargin > 0
                                ? 'text-[#2563EB]'
                                : 'text-[#DC2626]'
                            }`}
                          >
                            {unitMargin.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#64748B] font-mono text-[11px] whitespace-nowrap">
                        {dateStr ? formatDate(dateStr) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9] mt-3">
              <span className="text-[11px] text-[#64748B]">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, sortedProducts.length)} of {sortedProducts.length} items
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-[#0F172A] px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
