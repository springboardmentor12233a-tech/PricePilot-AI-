import React from 'react';
import CategorySelect from '../../categories/components/CategorySelect';
import { Filter, ArrowUpDown } from 'lucide-react';

export default function ProductFilters({
  categoryId,
  onCategoryChange,
  status,
  onStatusChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Category Dropdown Filter */}
      <div className="w-48 shrink-0">
        <CategorySelect
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          allowAll
          allLabel="All Categories"
        />
      </div>

      {/* Status Filter */}
      <div className="w-36 shrink-0">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full h-10.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
          aria-label="Filter by product status"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Sort Option */}
      <div className="w-44 shrink-0">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full h-10.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
          aria-label="Sort products"
        >
          <option value="created_desc">Newest First</option>
          <option value="created_asc">Oldest First</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="price_asc">Price (Low to High)</option>
          <option value="price_desc">Price (High to Low)</option>
        </select>
      </div>
    </div>
  );
}
