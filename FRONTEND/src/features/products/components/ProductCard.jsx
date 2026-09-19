import React from 'react';
import ProductStatusBadge from './ProductStatusBadge';
import ProductActions from './ProductActions';
import { formatCurrency } from '../../../utils/formatCurrency';
import { Package } from 'lucide-react';

export default function ProductCard({
  product,
  categoryName = '—',
  onView,
  onEdit,
  onDelete,
}) {
  if (!product) return null;

  return (
    <div
      onClick={() => onView(product.id)}
      className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-[#CBD5E1] transition-all duration-200 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name || 'Product'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Package className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                {product.name || '—'}
              </h3>
              <p className="font-mono text-xs text-[#64748B] mt-0.5">
                SKU: {product.sku || '—'}
              </p>
            </div>
          </div>

          <ProductStatusBadge isActive={product.is_active} />
        </div>

        {product.description && (
          <p className="mt-3 text-xs text-[#64748B] line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-[#F1F5F9] grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[11px] text-[#94A3B8] block">Category</span>
            <span className="font-medium text-[#0F172A] line-clamp-1">
              {categoryName}
            </span>
          </div>

          {product.brand && (
            <div>
              <span className="text-[11px] text-[#94A3B8] block">Brand</span>
              <span className="font-medium text-[#0F172A] line-clamp-1">
                {product.brand}
              </span>
            </div>
          )}

          <div>
            <span className="text-[11px] text-[#94A3B8] block">Base Price</span>
            <span className="font-semibold font-mono text-[#0F172A]">
              {formatCurrency(product.base_price, product.currency)}
            </span>
          </div>

          {product.cost_price !== undefined && product.cost_price !== null && (
            <div>
              <span className="text-[11px] text-[#94A3B8] block">Cost Price</span>
              <span className="font-mono text-[#64748B]">
                {formatCurrency(product.cost_price, product.currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
        <span className="text-[11px] font-mono text-[#94A3B8]">
          ID: {product.id}
        </span>
        <ProductActions
          onView={() => onView(product.id)}
          onEdit={() => onEdit(product)}
          onDelete={() => onDelete(product)}
          size="sm"
        />
      </div>
    </div>
  );
}
