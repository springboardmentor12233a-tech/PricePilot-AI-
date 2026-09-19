import React from 'react';
import { BarChart2, TrendingUp, TrendingDown, Minus, ShieldCheck } from 'lucide-react';
import Badge from '../../../components/Badge';

export default function DemandPredictionCard({
  prediction,
  isLoading = false,
  className = '',
}) {
  const predictedDemand = prediction?.predictedDemand;
  const confidence = prediction?.confidence;
  const trend = prediction?.trend;

  const renderTrendIcon = () => {
    if (trend === 'increasing') return <TrendingUp className="w-3.5 h-3.5 text-[#15803D]" />;
    if (trend === 'decreasing') return <TrendingDown className="w-3.5 h-3.5 text-[#B91C1C]" />;
    return <Minus className="w-3.5 h-3.5 text-[#64748B]" />;
  };

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Predicted Demand
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
          <BarChart2 className="w-4 h-4" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-2 space-y-2 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-28" />
          <div className="h-4 bg-slate-100 rounded w-40" />
        </div>
      ) : predictedDemand !== null && predictedDemand !== undefined ? (
        <>
          <div className="text-2xl font-bold text-[#0F172A] tracking-tight mb-2 flex items-baseline gap-1.5">
            <span>{Math.round(predictedDemand).toLocaleString()}</span>
            <span className="text-sm font-normal text-[#64748B]">units</span>
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] space-y-1.5">
            {/* Display confidence ONLY if backend provided it */}
            {confidence !== null && confidence !== undefined && (
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                  Model Confidence:
                </span>
                <span className="font-semibold text-[#0F172A]">{confidence}%</span>
              </div>
            )}

            {/* Display trend ONLY if backend provided it */}
            {trend && (
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Demand Trend:</span>
                <span className="font-medium capitalize text-[#0F172A] flex items-center gap-1">
                  {renderTrendIcon()}
                  {trend}
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="py-2">
          <p className="text-sm font-medium text-[#64748B]">Not predicted yet</p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Run a prediction simulation to calculate forecasted demand.
          </p>
        </div>
      )}
    </div>
  );
}
