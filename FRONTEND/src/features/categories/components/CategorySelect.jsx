import React from 'react';
import { useCategories } from '../hooks/useCategories';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { Tag, Loader2 } from 'lucide-react';

export default function CategorySelect({
  value,
  onChange,
  name = 'category_id',
  label,
  placeholder = 'Select Category',
  allowAll = false,
  allLabel = 'All Categories',
  required = false,
  disabled = false,
  error,
  className = '',
}) {
  const { selectedOrganizationId } = useOrganization();
  const { categories, isLoading } = useCategories(selectedOrganizationId);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-[13px] font-medium text-[#0F172A] mb-1.5"
        >
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value || (allowAll ? 'all' : '')}
          onChange={onChange}
          disabled={disabled || isLoading}
          className={`w-full h-10.5 rounded-lg border bg-white px-3.5 text-sm text-[#0F172A] transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed cursor-pointer ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
              : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
          }`}
        >
          {allowAll ? (
            <option value="all">{allLabel}</option>
          ) : (
            <option value="" disabled>
              {isLoading ? 'Loading categories...' : placeholder}
            </option>
          )}

          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {isLoading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="w-4 h-4 text-[#94A3B8] animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-[#DC2626]">{error}</p>
      )}
    </div>
  );
}
