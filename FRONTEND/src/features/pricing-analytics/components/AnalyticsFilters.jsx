import React from 'react';
import { Filter, RotateCcw, Info } from 'lucide-react';

export default function AnalyticsFilters({
  products = [],
  categories = [],
  competitors = [],
  selectedProductId,
  onSelectProduct,
  selectedCategory,
  onSelectCategory,
  dateRange,
  onChangeDateRange,
  selectedCompetitorId,
  onSelectCompetitor,
  pricingStatus,
  onChangePricingStatus,
  onResetFilters,
}) {
  const isFiltered =
    selectedCategory !== 'all' ||
    dateRange !== 'all' ||
    selectedCompetitorId !== 'all' ||
    pricingStatus !== 'all';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Analytics Scope & Filters</h3>
            <p className="text-[11px] text-[#64748B]">
              Refine pricing metrics across catalog items, categories, and observation windows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
            <Info className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>Filters applied locally to available API data</span>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-4">
        {/* Product Scope */}
        <div>
          <label htmlFor="filter-product" className="block text-xs font-medium text-[#475569] mb-1.5">
            Active Product
          </label>
          <select
            id="filter-product"
            value={selectedProductId || ''}
            onChange={(e) => onSelectProduct(e.target.value || null)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          >
            {products.length === 0 ? (
              <option value="">No products available</option>
            ) : (
              products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku || 'No SKU'})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Category Scope */}
        <div>
          <label htmlFor="filter-category" className="block text-xs font-medium text-[#475569] mb-1.5">
            Category
          </label>
          <select
            id="filter-category"
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Scope */}
        <div>
          <label htmlFor="filter-daterange" className="block text-xs font-medium text-[#475569] mb-1.5">
            Date Window
          </label>
          <select
            id="filter-daterange"
            value={dateRange}
            onChange={(e) => onChangeDateRange(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          >
            <option value="all">All Available Records</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="180d">Last 6 Months</option>
            <option value="365d">Last 12 Months</option>
          </select>
        </div>

        {/* Competitor Scope */}
        <div>
          <label htmlFor="filter-competitor" className="block text-xs font-medium text-[#475569] mb-1.5">
            Competitor
          </label>
          <select
            id="filter-competitor"
            value={selectedCompetitorId}
            onChange={(e) => onSelectCompetitor(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          >
            <option value="all">All Competitors ({competitors.length})</option>
            {competitors.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pricing Status Scope */}
        <div>
          <label htmlFor="filter-pricing-status" className="block text-xs font-medium text-[#475569] mb-1.5">
            Record Status
          </label>
          <select
            id="filter-pricing-status"
            value={pricingStatus}
            onChange={(e) => onChangePricingStatus(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          >
            <option value="all">All Records</option>
            <option value="current">Current Active Price</option>
            <option value="historical">Historical Changes</option>
            <option value="recommended">Recommendation-Related</option>
          </select>
        </div>
      </div>
    </div>
  );
}
