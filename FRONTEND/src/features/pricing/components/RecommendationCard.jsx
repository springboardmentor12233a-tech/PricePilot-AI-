import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, DollarSign, BarChart2 } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import Button from '../../../components/Button';
import RecommendationStatusBadge from './RecommendationStatusBadge';
import { calculatePriceDifference, calculatePriceDifferencePercent } from '../utils/pricingCalculations';

export default function RecommendationCard({
  recommendation,
  product,
  onReview,
  className = '',
}) {
  if (!recommendation) return null;

  const currency = product?.currency || 'INR';
  const recPrice = recommendation.recommendedPrice;
  const currentPrice = recommendation.currentPrice !== null ? recommendation.currentPrice : product?.base_price;

  const diff = calculatePriceDifference(recPrice, currentPrice);
  const diffPercent = calculatePriceDifferencePercent(recPrice, currentPrice);
  const isApplied = recommendation.status === 'APPLIED';

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">AI Pricing Recommendation</h3>
            <span className="text-[11px] text-[#64748B]">
              Ref: {recommendation.id || 'Active'}
            </span>
          </div>
        </div>
        <RecommendationStatusBadge status={recommendation.status} />
      </div>

      {/* Recommended Price Display */}
      <div className="my-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
            Recommended Price
          </span>
          <div className="text-3xl font-bold text-[#0F172A] tracking-tight">
            {formatCurrency(recPrice, currency)}
          </div>
        </div>

        {/* Delta relative to Current Price */}
        {diff !== null && diffPercent !== null && (
          <div className="text-xs">
            <span className="text-[#64748B] block">Adjustment:</span>
            <span
              className={`font-semibold text-sm ${
                diff > 0 ? 'text-[#15803D]' : diff < 0 ? 'text-[#B45309]' : 'text-[#475569]'
              }`}
            >
              {diff > 0 ? `+${formatCurrency(diff, currency)} (+${diffPercent.toFixed(1)}%)` : `${formatCurrency(diff, currency)} (${diffPercent.toFixed(1)}%)`}
            </span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 px-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs">
        <div>
          <span className="text-[11px] text-[#64748B] block">Current Baseline</span>
          <span className="font-semibold text-[#0F172A]">
            {formatCurrency(currentPrice, currency)}
          </span>
        </div>

        {recommendation.expectedDemand !== null && (
          <div>
            <span className="text-[11px] text-[#64748B] block">Expected Demand</span>
            <span className="font-semibold text-[#0F172A]">
              {Math.round(recommendation.expectedDemand).toLocaleString()} units
            </span>
          </div>
        )}

        {recommendation.expectedRevenue !== null && (
          <div>
            <span className="text-[11px] text-[#64748B] block">Expected Revenue</span>
            <span className="font-semibold text-[#15803D]">
              {formatCurrency(recommendation.expectedRevenue, currency)}
            </span>
          </div>
        )}

        {recommendation.margin !== null && (
          <div>
            <span className="text-[11px] text-[#64748B] block">Expected Margin</span>
            <span className="font-semibold text-[#0F172A]">
              {recommendation.margin.toFixed(1)}%
            </span>
          </div>
        )}

        {recommendation.confidence !== null && (
          <div>
            <span className="text-[11px] text-[#64748B] block">Confidence</span>
            <span className="font-semibold text-[#2563EB]">
              {recommendation.confidence}%
            </span>
          </div>
        )}
      </div>

      {/* Rationale if present */}
      {recommendation.reason && (
        <p className="mt-4 text-xs text-[#475569] leading-relaxed bg-[#FFFBEB] p-3 rounded-lg border border-[#FDE68A]">
          <strong className="text-[#92400E]">Rationale:</strong> {recommendation.reason}
        </p>
      )}

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
        <span className="text-[11px] text-[#94A3B8]">
          {isApplied ? 'Price updated in catalog' : 'Awaiting manual approval'}
        </span>

        {isApplied ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
            <CheckCircle2 className="w-4 h-4" />
            Applied to Product
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onReview && onReview(recommendation)}
            rightIcon={ArrowRight}
          >
            Review & Apply
          </Button>
        )}
      </div>
    </div>
  );
}
