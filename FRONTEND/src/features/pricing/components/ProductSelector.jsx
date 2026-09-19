import React, { useState, useMemo } from 'react';
import { Package, Search, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { useProducts } from '../../products/hooks/useProducts';
import formatCurrency from '../../../utils/formatCurrency';
import Skeleton from '../../../components/Skeleton';

export default function ProductSelector({
  organizationId,
  selectedProductId,
  onSelectProduct,
  disabled = false,
}) {
  const { products, isLoading, error, refresh } = useProducts(organizationId);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedProduct = useMemo(() => {
    return products?.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const cat = (p.category?.name || p.category_id || '').toLowerCase();
      return name.includes(q) || sku.includes(q) || cat.includes(q);
    });
  }, [products, searchQuery]);

  if (isLoading && !products?.length) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width="40px" height="40px" />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height="16px" />
            <Skeleton width="60%" height="12px" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
          <span className="text-sm text-[#991B1B]">{error}</span>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="text-xs font-semibold text-[#DC2626] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs text-center">
        <p className="text-sm text-[#64748B]">No products found in this organization.</p>
        <p className="text-xs text-[#94A3B8] mt-1">
          Add products in the Catalog before running pricing predictions.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
        Target Product
      </label>

      {/* Selector Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white border rounded-xl px-4 py-3 text-left flex items-center justify-between transition-all duration-150 shadow-xs ${
          isOpen ? 'border-[#2563EB] ring-2 ring-[#2563EB]/10' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            {selectedProduct ? (
              <>
                <div className="font-medium text-sm text-[#0F172A] truncate">
                  {selectedProduct.name}
                </div>
                <div className="text-xs text-[#64748B] flex items-center gap-2 truncate">
                  {selectedProduct.sku && <span>SKU: {selectedProduct.sku}</span>}
                  {selectedProduct.category?.name && (
                    <>
                      <span>•</span>
                      <span>{selectedProduct.category.name}</span>
                    </>
                  )}
                  {selectedProduct.base_price !== undefined && selectedProduct.base_price !== null && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-[#0F172A]">
                        {formatCurrency(selectedProduct.base_price, selectedProduct.currency)}
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <span className="text-sm text-[#94A3B8]">Select a product to analyze...</span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden max-h-80 flex flex-col animate-in fade-in zoom-in-95 duration-100">
            {/* Search Input within Dropdown */}
            <div className="p-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, SKU, or category..."
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto divide-y divide-[#F1F5F9] py-1">
              {filteredProducts.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#64748B]">
                  No matching products found
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectProduct(p);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-[#F8FAFC] transition-colors ${
                        isSelected ? 'bg-[#EFF6FF]' : ''
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="font-medium text-xs text-[#0F172A] truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[#64748B] flex items-center gap-2 mt-0.5 truncate">
                          {p.sku && <span>SKU: {p.sku}</span>}
                          {p.category?.name && (
                            <>
                              <span>•</span>
                              <span>{p.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {p.base_price !== undefined && p.base_price !== null && (
                          <span className="text-xs font-semibold text-[#0F172A]">
                            {formatCurrency(p.base_price, p.currency)}
                          </span>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-[#2563EB]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
