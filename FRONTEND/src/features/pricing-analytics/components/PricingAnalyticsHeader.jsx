import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import Button from '../../../components/Button';
import ReportActions from './ReportActions';
import { formatRelativeTime } from '../../../utils/formatDate';

export default function PricingAnalyticsHeader({
  lastUpdated,
  onRefresh,
  isLoading = false,
  filteredProducts = [],
  categories = [],
  summaryMetrics = {},
  selectedProduct = null,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Pricing Analytics</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Analyze pricing performance, revenue trends, competitive positioning, and product-level pricing behavior.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {lastUpdated && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#64748B] bg-[#F1F5F9] px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>Updated {formatRelativeTime(lastUpdated)}</span>
          </div>
        )}

        <Button
          variant="outline"
          size="md"
          leftIcon={RefreshCw}
          onClick={onRefresh}
          disabled={isLoading}
          className={isLoading ? 'animate-spin' : ''}
          aria-label="Refresh analytics data"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>

        <ReportActions
          filteredProducts={filteredProducts}
          categories={categories}
          summaryMetrics={summaryMetrics}
          selectedProduct={selectedProduct}
        />
      </div>
    </div>
  );
}
