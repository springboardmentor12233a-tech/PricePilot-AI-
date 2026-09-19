import React from 'react';
import { formatCurrency } from '../../../utils/formatCurrency';
import Button from '../../../components/Button';
import { Plus, Layers } from 'lucide-react';

export default function VariantTable({ variants = [], onAddVariant }) {
  const hasVariants = Array.isArray(variants) && variants.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[#0F172A]">Product Variants</h4>
          <p className="text-xs text-[#64748B]">
            Specific SKU configurations, models, or packaging units.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Plus}
          onClick={onAddVariant}
        >
          Add Variant
        </Button>
      </div>

      {!hasVariants ? (
        <div className="rounded-xl border border-dashed border-[#E2E8F0] p-6 text-center bg-[#F8FAFC]">
          <Layers className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
          <p className="text-xs font-medium text-[#0F172A]">No variants created yet</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Add SKU variants if this product has multiple sizes, colors, or specifications.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
          <table className="w-full text-left text-xs text-[#0F172A]">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="py-2.5 pl-4 pr-3">Variant</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 pl-3 pr-4">Barcode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {variants.map((variant, idx) => (
                <tr key={variant.id || idx} className="hover:bg-[#F8FAFC]">
                  <td className="py-2.5 pl-4 pr-3 font-medium text-[#0F172A]">
                    {variant.name || '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#64748B]">
                    {variant.sku || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">
                    {formatCurrency(variant.price)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#64748B]">
                    {formatCurrency(variant.cost_price)}
                  </td>
                  <td className="py-2.5 pl-3 pr-4 font-mono text-[#64748B]">
                    {variant.barcode || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
