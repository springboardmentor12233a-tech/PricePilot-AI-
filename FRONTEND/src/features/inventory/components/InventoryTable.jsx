import React from 'react';
import InventoryStatus from './InventoryStatus';
import Button from '../../../components/Button';
import { Package, Edit3, Loader2 } from 'lucide-react';

export default function InventoryTable({
  items = [],
  onUpdateStock,
  onViewProduct,
}) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
      <table className="w-full text-left text-sm text-[#0F172A]">
        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
          <tr>
            <th scope="col" className="py-3.5 pl-5 pr-3">Product</th>
            <th scope="col" className="py-3.5 px-3">SKU</th>
            <th scope="col" className="py-3.5 px-3 text-right">On Hand</th>
            <th scope="col" className="py-3.5 px-3 text-right">Reserved</th>
            <th scope="col" className="py-3.5 px-3 text-right">Reorder Level</th>
            <th scope="col" className="py-3.5 px-3 text-center">Status</th>
            <th scope="col" className="py-3.5 pl-3 pr-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5F9]">
          {items.map(({ product, inventory, isLoading }) => (
            <tr
              key={product.id}
              className="hover:bg-[#F8FAFC]/80 transition-colors group"
            >
              {/* Product */}
              <td className="py-3.5 pl-5 pr-3">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => onViewProduct(product.id)}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Package className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                      {product.name || '—'}
                    </p>
                    {product.brand && (
                      <p className="text-[11px] text-[#64748B] line-clamp-1">
                        {product.brand}
                      </p>
                    )}
                  </div>
                </div>
              </td>

              {/* SKU */}
              <td className="py-3.5 px-3 font-mono text-xs text-[#64748B]">
                {product.sku || '—'}
              </td>

              {/* On Hand */}
              <td className="py-3.5 px-3 text-right font-mono text-xs font-semibold text-[#0F172A]">
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#94A3B8] inline" />
                ) : inventory?.quantity_on_hand !== undefined && inventory?.quantity_on_hand !== null ? (
                  inventory.quantity_on_hand
                ) : (
                  '—'
                )}
              </td>

              {/* Reserved */}
              <td className="py-3.5 px-3 text-right font-mono text-xs text-[#64748B]">
                {isLoading ? (
                  '—'
                ) : inventory?.reserved_quantity !== undefined && inventory?.reserved_quantity !== null ? (
                  inventory.reserved_quantity
                ) : (
                  '—'
                )}
              </td>

              {/* Reorder Level */}
              <td className="py-3.5 px-3 text-right font-mono text-xs text-[#64748B]">
                {isLoading ? (
                  '—'
                ) : inventory?.reorder_level !== undefined && inventory?.reorder_level !== null ? (
                  inventory.reorder_level
                ) : (
                  '—'
                )}
              </td>

              {/* Status */}
              <td className="py-3.5 px-3 text-center">
                {isLoading ? (
                  <span className="text-[11px] text-[#94A3B8]">Loading...</span>
                ) : (
                  <InventoryStatus inventory={inventory} />
                )}
              </td>

              {/* Actions */}
              <td className="py-3.5 pl-3 pr-5 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Edit3}
                  onClick={() => onUpdateStock(product, inventory)}
                >
                  Update
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
