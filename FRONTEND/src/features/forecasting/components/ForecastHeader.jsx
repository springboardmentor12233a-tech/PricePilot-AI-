import React from 'react';
import { RefreshCw, Cpu, Layers } from 'lucide-react';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';

/**
 * ForecastHeader Component
 * Displays the page title, model deployment metadata, and refresh action.
 */
export default function ForecastHeader({
  selectedProduct,
  isLoading = false,
  onRefresh,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Demand Forecasting
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            <Cpu className="w-3 h-3" />
            ML Inference
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
          Predict demand, identify trends, and understand the factors influencing product demand using server-side models.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        {/* Model Evaluation Metric Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#475569]">
          <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>XGBoost Regressor</span>
          <span className="text-[#CBD5E1]">•</span>
          <span className="font-mono text-[11px] font-medium text-[#0F172A]">Test R²: 0.8527</span>
        </div>

        {selectedProduct && onRefresh && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            disabled={isLoading}
            onClick={onRefresh}
            className="text-xs font-medium"
            title="Refresh product context and sales history"
          >
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
}
