import React from 'react';
import { Tag, IndianRupee, Users2, Boxes, Sparkles, Layers } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';

/**
 * ForecastContextCard Component
 * Displays available product-level context metrics:
 * - Current Catalog Price
 * - Unit Acquisition Cost
 * - Benchmark Competitor Price
 * - Inventory On-Hand
 * - Category / Brand
 * Only shows real values, never invents placeholder statistics.
 */
export default function ForecastContextCard({
  product,
  inventory,
  competitorData,
  className = '',
}) {
  if (!product) return null;

  const currency = product?.currency || 'INR';
  const competitorPrice = competitorData?.latestPrice || competitorData?.marketAverage;
  const currentStock = inventory?.current_stock;
  const reorderPoint = inventory?.reorder_point;

  const contextItems = [
    {
      label: 'Catalog Base Price',
      value: product.base_price !== null && product.base_price !== undefined
        ? formatCurrency(product.base_price, currency)
        : '—',
      icon: IndianRupee,
      tone: 'text-[#0F172A]',
    },
    {
      label: 'Unit Cost Price',
      value: product.cost_price !== null && product.cost_price !== undefined
        ? formatCurrency(product.cost_price, currency)
        : 'Not configured',
      icon: Tag,
      tone: 'text-[#64748B]',
    },
    {
      label: 'Competitor Benchmark',
      value: competitorPrice !== null && competitorPrice !== undefined
        ? formatCurrency(competitorPrice, currency)
        : 'No match tracked',
      icon: Users2,
      tone: competitorPrice ? 'text-[#2563EB]' : 'text-[#94A3B8]',
    },
    {
      label: 'Available Stock',
      value: currentStock !== null && currentStock !== undefined
        ? `${Number(currentStock).toLocaleString()} units`
        : '—',
      icon: Boxes,
      tone: currentStock !== null && currentStock <= (reorderPoint || 0) ? 'text-[#DC2626]' : 'text-[#0F172A]',
    },
    {
      label: 'Product Category',
      value: product.category?.name || product.category_id || 'General',
      icon: Layers,
      tone: 'text-[#475569]',
    },
    {
      label: 'SKU Identifier',
      value: product.sku || '—',
      icon: Tag,
      tone: 'text-[#64748B] font-mono',
    },
  ];

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A]">
            Product Baseline Signals
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Operational attributes fed into model elasticity calculations.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F1F5F9] text-[#475569]">
          Catalog Signals
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {contextItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mb-1">
                <Icon className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              <div className={`text-sm font-semibold truncate ${item.tone}`}>
                {item.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
