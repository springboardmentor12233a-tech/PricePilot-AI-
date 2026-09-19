import React from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import formatCurrency from '../../../utils/formatCurrency';
import RecommendationStatusBadge from './RecommendationStatusBadge';
import { calculatePriceDifference, calculatePriceDifferencePercent } from '../utils/pricingCalculations';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function RecommendationDetails({
  isOpen,
  onClose,
  recommendation,
  product,
  onProceedToApply,
}) {
  if (!recommendation) return null;

  const currency = product?.currency || 'INR';
  const recPrice = recommendation.recommendedPrice;
  const currentPrice = recommendation.currentPrice !== null ? recommendation.currentPrice : product?.base_price;
  const isApplied = recommendation.status === 'APPLIED';

  const diff = calculatePriceDifference(recPrice, currentPrice);
  const diffPercent = calculatePriceDifferencePercent(recPrice, currentPrice);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pricing Recommendation Details"
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {!isApplied && onProceedToApply && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onProceedToApply(recommendation);
              }}
              rightIcon={ArrowRight}
            >
              Apply This Recommendation
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
          <div>
            <span className="text-[11px] text-[#64748B] block">Product</span>
            <span className="text-xs font-semibold text-[#0F172A]">{product?.name || 'Selected Product'}</span>
          </div>
          <RecommendationStatusBadge status={recommendation.status} />
        </div>

        {/* Price Comparison Block */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-white rounded-xl border border-[#E2E8F0]">
          <div>
            <span className="text-xs text-[#64748B] block mb-0.5">Current Base Price</span>
            <span className="text-xl font-bold text-[#0F172A]">
              {formatCurrency(currentPrice, currency)}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#64748B] block mb-0.5">Recommended Price</span>
            <span className="text-xl font-bold text-[#2563EB]">
              {formatCurrency(recPrice, currency)}
            </span>
          </div>
        </div>

        {diff !== null && diffPercent !== null && (
          <div className="text-xs text-[#475569] flex items-center justify-between px-1">
            <span>Net Price Shift:</span>
            <span className={`font-semibold ${diff > 0 ? 'text-[#15803D]' : 'text-[#B45309]'}`}>
              {diff > 0 ? `+${formatCurrency(diff, currency)} (+${diffPercent.toFixed(1)}%)` : `${formatCurrency(diff, currency)} (${diffPercent.toFixed(1)}%)`}
            </span>
          </div>
        )}

        {/* Expected Business Impact */}
        <div className="space-y-2 border-t border-[#F1F5F9] pt-3">
          <span className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider block">
            Expected Outcomes
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {recommendation.expectedDemand !== null && (
              <div className="p-2.5 bg-[#F8FAFC] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Expected Demand</span>
                <span className="font-semibold text-[#0F172A]">
                  {Math.round(recommendation.expectedDemand).toLocaleString()} units
                </span>
              </div>
            )}

            {recommendation.expectedRevenue !== null && (
              <div className="p-2.5 bg-[#F8FAFC] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Expected Revenue</span>
                <span className="font-semibold text-[#15803D]">
                  {formatCurrency(recommendation.expectedRevenue, currency)}
                </span>
              </div>
            )}

            {recommendation.expectedProfit !== null && (
              <div className="p-2.5 bg-[#F8FAFC] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Expected Gross Profit</span>
                <span className="font-semibold text-[#0F172A]">
                  {formatCurrency(recommendation.expectedProfit, currency)}
                </span>
              </div>
            )}

            {recommendation.margin !== null && (
              <div className="p-2.5 bg-[#F8FAFC] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Expected Margin</span>
                <span className="font-semibold text-[#0F172A]">
                  {recommendation.margin.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Confidence (if returned) */}
        {recommendation.confidence !== null && (
          <div className="flex items-center gap-2 text-xs text-[#0F172A] bg-[#EFF6FF] border border-[#BFDBFE] p-3 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>Algorithm Confidence Score: <strong>{recommendation.confidence}%</strong></span>
          </div>
        )}

        {/* Rationale */}
        {recommendation.reason && (
          <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] leading-relaxed">
            <strong>Rationale:</strong> {recommendation.reason}
          </div>
        )}
      </div>
    </Modal>
  );
}
