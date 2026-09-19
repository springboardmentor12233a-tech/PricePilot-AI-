import React from 'react';
import { RefreshCw, Calculator, ShieldCheck } from 'lucide-react';
import Button from '../../../components/Button';

export default function RevenueOptimizationHeader({
  onRefresh,
  isLoading = false,
  lastUpdated,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Revenue Optimization
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[#64748B]">
                Simulate pricing scenarios and understand their potential revenue and profitability impact.
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                <ShieldCheck className="w-3 h-3" />
                Server-Side ML Model
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {lastUpdated && (
          <span className="text-[11px] text-[#94A3B8] hidden sm:inline">
            Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          loading={isLoading}
          leftIcon={RefreshCw}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
