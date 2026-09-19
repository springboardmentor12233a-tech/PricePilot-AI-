import React, { useState } from 'react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import InventoryStatus from './InventoryStatus';
import InventoryUpdateModal from './InventoryUpdateModal';
import { useInventory } from '../hooks/useInventory';
import { Boxes, Edit3, RefreshCw, AlertCircle } from 'lucide-react';

export default function InventorySummary({ productId, productName }) {
  const { inventory, isLoading, error, refresh, updateInventory, isUpdating } = useInventory(productId);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  return (
    <>
      <Card
        title="Inventory & Stock Health"
        subtitle="Physical warehouse position & reorder thresholds"
        headerAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={refresh}
              disabled={isLoading}
              className={isLoading ? 'animate-spin' : ''}
              title="Refresh inventory"
            />
            <Button
              variant="outline"
              size="sm"
              leftIcon={Edit3}
              onClick={() => setIsUpdateModalOpen(true)}
            >
              Update Stock
            </Button>
          </div>
        }
      >
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-[#64748B] text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB] mb-2" />
            <span>Loading inventory levels...</span>
          </div>
        ) : error ? (
          <div className="py-6 px-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Inventory data unavailable</p>
              <p className="mt-0.5 text-amber-700">{error}</p>
            </div>
          </div>
        ) : !inventory ? (
          <div className="py-8 text-center bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0] p-6">
            <Boxes className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
            <p className="text-xs font-medium text-[#0F172A]">No inventory information is currently available</p>
            <p className="text-[11px] text-[#64748B] mt-0.5 mb-3">
              Set initial stock quantities to monitor inventory health and dynamic price elasticity.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUpdateModalOpen(true)}
            >
              Initialize Stock
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <span className="text-xs text-[#64748B]">Current Health Status</span>
              <InventoryStatus inventory={inventory} size="md" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
                <span className="text-[11px] text-[#64748B] block">On Hand</span>
                <span className="text-base font-bold font-mono text-[#0F172A] mt-0.5 block">
                  {inventory.quantity_on_hand !== undefined && inventory.quantity_on_hand !== null
                    ? inventory.quantity_on_hand
                    : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
                <span className="text-[11px] text-[#64748B] block">Reserved</span>
                <span className="text-base font-bold font-mono text-[#0F172A] mt-0.5 block">
                  {inventory.reserved_quantity !== undefined && inventory.reserved_quantity !== null
                    ? inventory.reserved_quantity
                    : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
                <span className="text-[11px] text-[#64748B] block">Reorder Level</span>
                <span className="text-base font-bold font-mono text-[#0F172A] mt-0.5 block">
                  {inventory.reorder_level !== undefined && inventory.reorder_level !== null
                    ? inventory.reorder_level
                    : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
                <span className="text-[11px] text-[#64748B] block">Reorder Batch</span>
                <span className="text-base font-bold font-mono text-[#0F172A] mt-0.5 block">
                  {inventory.reorder_quantity !== undefined && inventory.reorder_quantity !== null
                    ? inventory.reorder_quantity
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <InventoryUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSubmit={updateInventory}
        currentInventory={inventory}
        productName={productName}
        isLoading={isUpdating}
      />
    </>
  );
}
