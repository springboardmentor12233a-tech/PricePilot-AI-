import React from 'react';
import { Layers, Package, Tag, Archive, Users, DollarSign } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';

export default function PricingContextCard({
  product,
  inventory,
  competitorData,
  className = '',
}) {
  if (!product) return null;

  const currency = product.currency || 'INR';

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Product Context Baseline
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* SKU & Category */}
        <div className="space-y-1">
          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">SKU / Category</span>
          <div className="text-xs font-medium text-[#0F172A] truncate">
            {product.sku || 'No SKU'}
          </div>
          <div className="text-[11px] text-[#64748B] truncate">
            {product.category?.name || product.category_id || 'Uncategorized'}
          </div>
        </div>

        {/* Base Price */}
        <div className="space-y-1">
          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">Base Price</span>
          <div className="text-xs font-semibold text-[#0F172A]">
            {formatCurrency(product.base_price, currency)}
          </div>
          <div className="text-[11px] text-[#64748B]">
            Cost: {product.cost_price ? formatCurrency(product.cost_price, currency) : 'N/A'}
          </div>
        </div>

        {/* Inventory Stock */}
        <div className="space-y-1">
          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">Inventory</span>
          <div className="text-xs font-semibold text-[#0F172A]">
            {inventory?.current_stock !== undefined && inventory?.current_stock !== null
              ? `${inventory.current_stock} units`
              : 'Unknown'}
          </div>
          {inventory?.minimum_stock !== undefined && (
            <div className="text-[11px] text-[#64748B]">
              Min: {inventory.minimum_stock} units
            </div>
          )}
        </div>

        {/* Competitor Price Benchmark */}
        <div className="space-y-1">
          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">Market Benchmark</span>
          <div className="text-xs font-semibold text-[#0F172A]">
            {competitorData?.latestPrice
              ? formatCurrency(competitorData.latestPrice, currency)
              : competitorData?.marketAverage
              ? `${formatCurrency(competitorData.marketAverage, currency)} (avg)`
              : 'None recorded'}
          </div>
          <div className="text-[11px] text-[#64748B]">
            {competitorData?.observations?.length || 0} observations
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">Catalog Status</span>
          <div className="text-xs font-semibold text-[#0F172A]">
            {product.is_active ? (
              <span className="text-[#15803D]">Active Catalog</span>
            ) : (
              <span className="text-[#94A3B8]">Inactive</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
