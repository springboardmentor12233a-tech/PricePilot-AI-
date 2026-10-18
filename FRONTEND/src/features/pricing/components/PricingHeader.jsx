import React from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import { RefreshCw, Cpu } from 'lucide-react';

/**
 * PricePilot AI — PricingHeader Component
 * Displays the page title, enterprise subtitle, pricing rule status,
 * and contextual actions (e.g. data refresh).
 */
export default function PricingHeader({
  selectedProduct,
  onRefresh,
  isLoading = false,
  className = '',
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <PageHeader
        title="Pricing Intelligence"
        description="Calculate price recommendations from saved cost, inventory, and competitor data."
        badge="Enterprise Decision Support"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#475569]"
              title="Deterministic cost, compatible competitor price, and inventory rules"
            >
              <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="font-medium text-[#0F172A]">Backend Pricing Rules</span>
            </div>

            {selectedProduct && onRefresh && (
              <Button
                variant="outline"
                size="md"
                leftIcon={RefreshCw}
                disabled={isLoading}
                onClick={onRefresh}
                className="h-9 text-xs font-medium"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
}
