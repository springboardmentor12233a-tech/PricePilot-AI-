import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import Badge from '../../../components/Badge';

/**
 * InventoryContextCard
 * Displays actual available inventory and stock status from real inventory data.
 * Does not invent turnover, days remaining, or stock value unless backend returns them.
 */
export default function InventoryContextCard({ inventory, className = '' }) {
  const stock =
    inventory?.current_stock !== undefined && inventory?.current_stock !== null
      ? Number(inventory.current_stock)
      : null;

  const minStock =
    inventory?.min_stock_level !== undefined && inventory?.min_stock_level !== null
      ? Number(inventory.min_stock_level)
      : null;

  const reorderPoint =
    inventory?.reorder_point !== undefined && inventory?.reorder_point !== null
      ? Number(inventory.reorder_point)
      : minStock;

  // Determine real status
  let statusBadge = { variant: 'default', label: 'Unknown' };
  if (stock !== null) {
    if (stock <= 0) {
      statusBadge = { variant: 'danger', label: 'Out of Stock' };
    } else if (reorderPoint !== null && stock <= reorderPoint) {
      statusBadge = { variant: 'warning', label: 'Low Stock' };
    } else {
      statusBadge = { variant: 'success', label: 'In Stock' };
    }
  }

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Inventory Level
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
          <Layers className="w-4 h-4" />
        </div>
      </div>

      <div className="text-2xl font-bold text-[#0F172A] tracking-tight mb-2">
        {stock !== null ? `${stock.toLocaleString()} units` : '—'}
      </div>

      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
        <span>Stock Status:</span>
        <Badge variant={statusBadge.variant} size="sm" dot>
          {statusBadge.label}
        </Badge>
      </div>

      {reorderPoint !== null && (
        <div className="mt-1.5 flex items-center justify-between text-xs text-[#64748B]">
          <span>Reorder Threshold:</span>
          <span className="font-medium text-[#334155]">
            {reorderPoint.toLocaleString()} units
          </span>
        </div>
      )}
    </div>
  );
}
