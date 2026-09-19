import React, { useState, useMemo } from 'react';
import { Package, Search, ChevronDown, Check, AlertCircle, Tag, Layers } from 'lucide-react';
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
      const brand = (p.brand || '').toLowerCase();
      return name.includes(q) || sku.includes(q) || cat.includes(q) || brand.includes(q);
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

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full bg-white border border-[#E2E8F0] rounded-2xl p-4 transition-all duration-150 text-left shadow-xs flex items-center justify-between gap-4 cursor-pointer hover:border-[#CBD5E1] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/20 ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          {selectedProduct ? (
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-[#0F172A] truncate">
                  {selectedProduct.name}
                </span>
                {selectedProduct.brand && (
                  <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[11px] font-medium text-[#475569]">
                    {selectedProduct.brand}
                  </span>
                )}
                {(selectedProduct.category?.name || selectedProduct.category_id) && (
                  <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[11px] font-medium text-[#2563EB]">
                    {selectedProduct.category?.name || selectedProduct.category_id}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5">
                {selectedProduct.sku && (
                  <span className="font-mono text-[11px]">SKU: {selectedProduct.sku}</span>
                )}
                <span>•</span>
                <span>
                  Base Price:{' '}
                  <strong className="text-[#0F172A] font-semibold">
                    {formatCurrency(selectedProduct.base_price, selectedProduct.currency || 'INR')}
                  </strong>
                </span>
              </div>
            </div>
          ) : (
            <div>
              <span className="font-medium text-sm text-[#64748B]">Select a product to simulate pricing...</span>
              <span className="block text-xs text-[#94A3B8]">Choose from {products?.length || 0} catalog items</span>
            </div>
          )}
        </div>

        <ChevronDown
          className={`w-5 h-5 text-[#64748B] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-3 border-b border-[#F1F5F9] bg-[#F8FAFC]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, SKU, brand, or category..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] text-[#0F172A] placeholder-[#94A3B8]"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#F1F5F9]">
              {filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#64748B]">
                  No products found matching "{searchQuery}"
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProduct(p);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#EFF6FF]/70' : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#0F172A] truncate">
                            {p.name}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#2563EB] shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64748B] flex-wrap">
                          {p.sku && <span className="font-mono">SKU: {p.sku}</span>}
                          {p.brand && <span>• {p.brand}</span>}
                          {(p.category?.name || p.category_id) && (
                            <span>• {p.category?.name || p.category_id}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#0F172A] block">
                          {formatCurrency(p.base_price, p.currency || 'INR')}
                        </span>
                        {p.cost_price ? (
                          <span className="text-[10px] text-[#64748B]">
                            Cost: {formatCurrency(p.cost_price, p.currency || 'INR')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#94A3B8] italic">
                            Cost unavailable
                          </span>
                        )}
                      </div>
                    </div>
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
