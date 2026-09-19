import React from 'react';
import InventoryStatus from './InventoryStatus';
import Button from '../../../components/Button';
import { Package, Edit3, Loader2 } from 'lucide-react';

export default function InventoryCard({
  product,
  inventory,
  isLoading,
  onUpdateStock,
  onViewProduct,
}) {
  if (!product) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onViewProduct(product.id)}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#0F172A] hover:text-[#2563EB] line-clamp-1">
                {product.name || '—'}
              </h4>
              <p className="font-mono text-xs text-[#64748B]">SKU: {product.sku || '—'}</p>
            </div>
          </div>

          <div>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#94A3B8]" />
            ) : (
              <InventoryStatus inventory={inventory} />
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F1F5F9] grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-[#F8FAFC]">
            <span className="text-[10px] text-[#64748B] block">On Hand</span>
            <span className="font-bold font-mono text-[#0F172A] block mt-0.5">
              {isLoading
                ? '—'
                : inventory?.quantity_on_hand !== undefined && inventory?.quantity_on_hand !== null
                ? inventory.quantity_on_hand
                : '—'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#F8FAFC]">
            <span className="text-[10px] text-[#64748B] block">Reserved</span>
            <span className="font-mono text-[#64748B] block mt-0.5">
              {isLoading
                ? '—'
                : inventory?.reserved_quantity !== undefined && inventory?.reserved_quantity !== null
                ? inventory.reserved_quantity
                : '—'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#F8FAFC]">
            <span className="text-[10px] text-[#64748B] block">Reorder</span>
            <span className="font-mono text-[#64748B] block mt-0.5">
              {isLoading
                ? '—'
                : inventory?.reorder_level !== undefined && inventory?.reorder_level !== null
                ? inventory.reorder_level
                : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          leftIcon={Edit3}
          onClick={() => onUpdateStock(product, inventory)}
        >
          Update Stock
        </Button>
      </div>
    </div>
  );
}
