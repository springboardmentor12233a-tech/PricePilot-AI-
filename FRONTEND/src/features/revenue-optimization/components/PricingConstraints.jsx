import React from 'react';
import { SlidersHorizontal, AlertCircle, Info, Lock } from 'lucide-react';

export default function PricingConstraints({
  constraints = null,
}) {
  const isConfigured = Boolean(constraints && Object.keys(constraints).length > 0);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Pricing Constraints</h3>
            <p className="text-[11px] text-[#64748B]">
              Boundaries and safety guardrails for pricing recommendations
            </p>
          </div>
        </div>

        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] font-medium flex items-center gap-1">
          <Lock className="w-3 h-3" />
          System Rules
        </span>
      </div>

      {!isConfigured ? (
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3 text-xs text-[#475569]">
          <Info className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-[#0F172A] block">
              Pricing constraints are not currently configured through the connected API.
            </span>
            <p className="text-[#64748B] leading-relaxed">
              When configured on the backend service, parameters such as Minimum Floor Price, Maximum Ceiling Price, Maximum Allowable Discount, and Minimum Gross Margin guardrails will be enforced directly during recommendation evaluation.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block">Minimum Price</span>
            <span className="font-semibold text-[#0F172A]">{constraints.minPrice || 'None'}</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block">Maximum Price</span>
            <span className="font-semibold text-[#0F172A]">{constraints.maxPrice || 'None'}</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block">Max Discount</span>
            <span className="font-semibold text-[#0F172A]">{constraints.maxDiscount || 'None'}</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block">Min Margin</span>
            <span className="font-semibold text-[#0F172A]">{constraints.minMargin || 'None'}</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block">Competitor Floor</span>
            <span className="font-semibold text-[#0F172A]">{constraints.competitorFloor || 'None'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
