import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, X, ShieldAlert, DollarSign } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import Button from '../../../components/Button';
import ApplyRecommendationModal from './ApplyRecommendationModal';
import { formatPercentage, formatCurrencyDelta } from '../utils/revenueUtils';

export default function PricingRecommendationCard({
  recommendation,
  product,
  isGenerating = false,
  error = null,
  onGenerate,
  onApply,
  isApplying = false,
  applySuccess = false,
  onDismiss,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currency = product?.currency || 'INR';

  const handleConfirmApply = async () => {
    if (!recommendation?.id) return;
    try {
      await onApply(recommendation.id);
      setIsModalOpen(false);
    } catch {
      // Error handled by parent hook
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0F172A]">Pricing Recommendation</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  Backend AI Model
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Distinct from manual scenarios — generated server-side
              </p>
            </div>
          </div>

          {recommendation && (
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                recommendation.status === 'APPLIED' || applySuccess
                  ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
                  : 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
              }`}>
                {recommendation.status === 'APPLIED' || applySuccess ? 'APPLIED' : (recommendation.status || 'PENDING')}
              </span>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-[#94A3B8] hover:text-[#64748B] p-1 rounded-md"
                  title="Dismiss recommendation"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error notice if present */}
        {error && (
          <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-start gap-2.5 text-xs text-[#991B1B]">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Body content */}
        {!recommendation ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-[#64748B]">
              Generate a pricing recommendation to see the model's suggested price.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={onGenerate}
              loading={isGenerating}
              leftIcon={Sparkles}
            >
              {isGenerating ? 'Generating Recommendation...' : 'Generate Recommendation'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Recommended Price Display */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
                  Recommended Price
                </span>
                <div className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  {recommendation.recommendedPrice !== null && recommendation.recommendedPrice !== undefined
                    ? formatCurrency(recommendation.recommendedPrice, currency)
                    : 'Not available'}
                </div>
              </div>

              {recommendation.currentPrice !== null && recommendation.recommendedPrice !== null && (
                <div className="text-xs">
                  <span className="text-[#64748B] block">Relative to Current:</span>
                  <span className={`font-semibold ${
                    recommendation.recommendedPrice > recommendation.currentPrice
                      ? 'text-[#15803D]'
                      : recommendation.recommendedPrice < recommendation.currentPrice
                      ? 'text-[#DC2626]'
                      : 'text-[#64748B]'
                  }`}>
                    {formatCurrencyDelta(recommendation.recommendedPrice - recommendation.currentPrice, currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Metrics grid — only display returned fields! */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {recommendation.expectedDemand !== null && (
                <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl">
                  <span className="text-[10px] text-[#64748B] block">Expected Demand</span>
                  <span className="font-semibold text-[#0F172A] text-xs">
                    {Math.round(recommendation.expectedDemand).toLocaleString()} units
                  </span>
                </div>
              )}

              {recommendation.expectedRevenue !== null && (
                <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl">
                  <span className="text-[10px] text-[#64748B] block">Expected Revenue</span>
                  <span className="font-semibold text-[#15803D] text-xs">
                    {formatCurrency(recommendation.expectedRevenue, currency)}
                  </span>
                </div>
              )}

              {recommendation.expectedProfit !== null && (
                <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl">
                  <span className="text-[10px] text-[#64748B] block">Expected Profit</span>
                  <span className="font-semibold text-[#16A34A] text-xs">
                    {formatCurrency(recommendation.expectedProfit, currency)}
                  </span>
                </div>
              )}

              {recommendation.margin !== null && (
                <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl">
                  <span className="text-[10px] text-[#64748B] block">Expected Margin</span>
                  <span className="font-semibold text-[#0F172A] text-xs">
                    {formatPercentage(recommendation.margin)}
                  </span>
                </div>
              )}

              {recommendation.confidence !== null && (
                <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl">
                  <span className="text-[10px] text-[#64748B] block">Confidence</span>
                  <span className="font-semibold text-[#2563EB] text-xs">
                    {recommendation.confidence}%
                  </span>
                </div>
              )}
            </div>

            {/* Reasoning / Rationale if returned */}
            {recommendation.reason && (
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
                <strong className="block font-semibold mb-0.5 text-[#B45309]">Model Reasoning:</strong>
                {recommendation.reason}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Human Review & Actions Footer */}
      {recommendation && (
        <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-[#64748B]">
            {recommendation.status === 'APPLIED' || applySuccess
              ? 'Catalog price successfully updated'
              : 'Requires explicit human approval before catalog execution'}
          </span>

          {recommendation.status === 'APPLIED' || applySuccess ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16A34A]">
              <CheckCircle2 className="w-4 h-4" />
              Applied to Product
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {onDismiss && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                disabled={!recommendation.id}
                rightIcon={ArrowRight}
              >
                Review Recommendation
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ApplyRecommendationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmApply}
        recommendation={recommendation}
        product={product}
        isApplying={isApplying}
      />
    </div>
  );
}
