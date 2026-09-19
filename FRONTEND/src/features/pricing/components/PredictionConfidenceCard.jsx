import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

/**
 * PredictionConfidenceCard
 * Displays ONLY if backend explicitly returns confidence score.
 * Never converts R² or invents mock confidence percentages.
 * If confidence is absent, informs the user clearly and honestly.
 */
export default function PredictionConfidenceCard({ confidence, className = '' }) {
  const hasConfidence = confidence !== null && confidence !== undefined && !isNaN(Number(confidence));
  const confValue = hasConfidence ? Math.round(Number(confidence)) : null;

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Prediction Confidence
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>

      {hasConfidence ? (
        <>
          <div className="text-2xl font-bold text-[#0F172A] tracking-tight mb-2">
            {confValue}%
          </div>
          <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                confValue >= 80 ? 'bg-[#15803D]' : confValue >= 60 ? 'bg-[#2563EB]' : 'bg-[#D97706]'
              }`}
              style={{ width: `${Math.min(Math.max(confValue, 0), 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-[#64748B]">
            Computed confidence returned directly by the prediction model endpoint.
          </p>
        </>
      ) : (
        <div className="py-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <Info className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <span>Not provided by model endpoint</span>
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed">
            Confidence intervals are not returned by the current model endpoint for this forecast.
          </p>
        </div>
      )}
    </div>
  );
}
