import React from 'react';
import { IndianRupee, ShieldAlert } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import { calculateGrossMargin } from '../utils/pricingCalculations';

/**
 * CostPriceCard
 * Displays the real unit cost price for the product if available.
 * Does not calculate cost from unrelated fields.
 */
export default function CostPriceCard({ product, className = '' }) {
  const costPrice =
    product?.cost_price !== undefined && product?.cost_price !== null
      ? Number(product.cost_price)
      : null;

  const basePrice =
    product?.base_price !== undefined && product?.base_price !== null
      ? Number(product.base_price)
      : null;

  const currency = product?.currency || 'INR';
  const hasCost = costPrice !== null && !isNaN(costPrice);
  const margin = hasCost && basePrice !== null ? calculateGrossMargin(basePrice, costPrice) : null;

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Cost Price
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
          <IndianRupee className="w-4 h-4" />
        </div>
      </div>

      <div className="text-2xl font-bold text-[#0F172A] tracking-tight mb-2">
        {hasCost ? formatCurrency(costPrice, currency) : '—'}
      </div>

      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
        <span>Status:</span>
        <span className="font-medium text-[#334155]">
          {hasCost ? 'Unit Cost Recorded' : 'Not Provided'}
        </span>
      </div>

      {margin !== null && (
        <div className="mt-1 flex items-center justify-between text-xs text-[#64748B]">
          <span>Gross Margin:</span>
          <span className={`font-semibold ${margin >= 20 ? 'text-[#15803D]' : 'text-[#B45309]'}`}>
            {margin.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
