import React, { useState, useMemo } from 'react';
import { Package, Search, ChevronDown, Check, AlertCircle, Tag, Layers } from 'lucide-react';
import { useProducts } from '../../products/hooks/useProducts';
import formatCurrency from '../../../utils/formatCurrency';
import Skeleton from '../../../components/Skeleton';

/**
 * ProductSelector Component
 * Product selection panel with search, displaying SKU, category, and catalog base price.
 */
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
      {/* Selector Trigger Button */}
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
                {selectedProduct.sku && (
                  <span className="font-mono text-[11px] text-[#64748B]">
                    SKU: {selectedProduct.sku}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5">
                <span>
                  Catalog Base Price:{' '}
                  <strong className="text-[#0F172A] font-semibold">
                    {formatCurrency(selectedProduct.base_price, selectedProduct.currency || 'INR')}
                  </strong>
                </span>
                {selectedProduct.category?.name && (
                  <>
                    <span className="text-[#CBD5E1]">•</span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-[#94A3B8]" />
                      {selectedProduct.category.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              <span className="text-sm font-medium text-[#64748B]">
                Select a product from catalog to forecast demand...
              </span>
              <span className="block text-xs text-[#94A3B8]">
                {products?.length ? `${products.length} products available in organization` : 'No products found'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#2563EB] font-medium hidden sm:inline">
            {selectedProduct ? 'Change Product' : 'Choose Product'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#E2E8F0] rounded-2xl shadow-lg z-30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Search Input */}
            <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search products by title, SKU, brand, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  autoFocus
                />
              </div>
            </div>

            {/* Product List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-[#F1F5F9]">
              {filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#64748B]">
                  No matching products found. Try adjusting your search query.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onSelectProduct(p.id);
                        setIsOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectProduct(p.id);
                          setIsOpen(false);
                        }
                      }}
                      className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium truncate ${
                              isSelected ? 'text-[#2563EB]' : 'text-[#0F172A]'
                            }`}
                          >
                            {p.name}
                          </span>
                          {p.sku && (
                            <span className="font-mono text-[11px] text-[#64748B] shrink-0">
                              {p.sku}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5">
                          <span>
                            Base: {formatCurrency(p.base_price, p.currency || 'INR')}
                          </span>
                          {p.brand && (
                            <>
                              <span className="text-[#CBD5E1]">•</span>
                              <span>{p.brand}</span>
                            </>
                          )}
                          {p.category?.name && (
                            <>
                              <span className="text-[#CBD5E1]">•</span>
                              <span>{p.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                      )}
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
