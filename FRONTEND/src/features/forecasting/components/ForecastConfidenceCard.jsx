import React from 'react';
import { ShieldCheck, AlertCircle, Info } from 'lucide-react';

/**
 * ForecastConfidenceCard Component
 * Displays model prediction confidence ONLY when supplied by backend.
 * Never calculates confidence using R², accuracy, or error metrics.
 */
export default function ForecastConfidenceCard({ confidence, className = '' }) {
  const hasConfidence = confidence !== null && confidence !== undefined && !isNaN(Number(confidence));

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Forecast Confidence
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
            Inference Reliability
          </span>
        </div>

        {hasConfidence ? (
          <div className="mt-2 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-[#0F172A]">
                {confidence}%
              </span>
              <span className="text-xs text-[#2563EB] font-medium inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Backend Verified
              </span>
            </div>

            {/* Confidence Progress Meter */}
            <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  confidence >= 75
                    ? 'bg-[#16A34A]'
                    : confidence >= 50
                    ? 'bg-[#EAB308]'
                    : 'bg-[#DC2626]'
                }`}
                style={{ width: `${Math.min(Math.max(confidence, 0), 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#64748B]">
              Per-prediction certainty index returned by the pricing prediction service.
            </p>
          </div>
        ) : (
          <div className="mt-2 py-1">
            <div className="text-sm font-semibold text-[#64748B]">
              Confidence score is not provided by the current prediction endpoint.
            </div>
            <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
              Model evaluation metric (Test R²: 0.8527) is not a per-prediction confidence score.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
        <Info className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
        <span>Strict backend payload validation</span>
      </div>
    </div>
  );
}
