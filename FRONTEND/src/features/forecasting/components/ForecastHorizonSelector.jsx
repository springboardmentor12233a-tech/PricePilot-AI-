import React from 'react';
import { Calendar, Info } from 'lucide-react';
import { FORECAST_HORIZONS } from '../utils/forecastUtils';

/**
 * ForecastHorizonSelector Component
 * Provides standard horizon tabs (7d, 14d, 30d, 3m, 6m, 12m)
 * with explicit technical note regarding point prediction capability.
 */
export default function ForecastHorizonSelector({
  selectedHorizon = '30d',
  onSelectHorizon,
  disabled = false,
}) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2563EB]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
            Forecast Horizon
          </span>
        </div>
        <span className="text-[11px] text-[#64748B]">
          Scenario timeframe for elasticity & velocity estimation
        </span>
      </div>

      {/* Segmented Horizon Pills */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {FORECAST_HORIZONS.map((h) => {
          const isSelected = selectedHorizon === h.id;
          return (
            <button
              key={h.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectHorizon && onSelectHorizon(h.id)}
              className={`px-3 py-2 rounded-xl text-center transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                  : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-xs font-bold leading-tight">{h.label}</div>
              <div
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isSelected ? 'text-blue-100' : 'text-[#94A3B8]'
                }`}
              >
                {h.category}
              </div>
            </button>
          );
        })}
      </div>

      {/* Honest Technical Capability Banner */}
      <div className="flex items-start gap-2 pt-1 text-[11px] text-[#64748B] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
        <Info className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#0F172A] font-semibold">Model Capability:</strong> Current server endpoint provides point demand prediction for the tested product context. Multi-period chronological forecast curves will populate automatically when multi-day time-series endpoints are active.
        </p>
      </div>
    </div>
  );
}
