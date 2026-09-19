import React from 'react';
import { Sparkles, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PricingInsights({
  insights = [],
  recommendationStats = {},
}) {
  const {
    hasRecommendationData = false,
    totalRecommendations = 0,
    appliedRecommendations = 0,
  } = recommendationStats;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Pricing Observations & Audit Summary</h3>
            <p className="text-[11px] text-[#64748B]">
              Transparent summary derived strictly from current catalog and observation feeds
            </p>
          </div>
        </div>
      </div>

      {/* Observation Insights List */}
      <div className="space-y-2.5">
        {insights.length === 0 ? (
          <p className="text-xs text-[#64748B] italic py-2">
            No specific observations derived for current filter criteria.
          </p>
        ) : (
          insights.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{item.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Recommendation Activity Section */}
      <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#0F172A]">Recommendation Tracking</span>
          {hasRecommendationData ? (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#16A34A] font-semibold">
              {appliedRecommendations} Applied / {totalRecommendations} Generated
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#64748B] font-medium">
              API Status
            </span>
          )}
        </div>

        <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
          {hasRecommendationData
            ? `${appliedRecommendations} dynamic pricing recommendation(s) have been verified and applied to catalog history.`
            : 'Recommendation analytics are unavailable from the current API.'}
        </p>
      </div>

      {/* Observational Disclaimer Notice */}
      <div className="flex items-start gap-2 p-3 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl text-[11px] text-[#475569]">
        <Info className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Observation Disclaimer:</strong> Analytics describe observed relationships in the available data and do not establish causal effects. Correlation does not imply pricing elasticity causation.
        </span>
      </div>
    </div>
  );
}
