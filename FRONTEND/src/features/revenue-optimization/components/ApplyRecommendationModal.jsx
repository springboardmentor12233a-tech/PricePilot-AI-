import React from 'react';
import { AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import formatCurrency from '../../../utils/formatCurrency';
import { formatCurrencyDelta, formatPercentage } from '../utils/revenueUtils';

export default function ApplyRecommendationModal({
  isOpen,
  onClose,
  onConfirm,
  recommendation,
  product,
  isApplying = false,
}) {
  if (!recommendation) return null;

  const currency = product?.currency || 'INR';
  const currentPrice = recommendation.currentPrice !== null && recommendation.currentPrice !== undefined
    ? recommendation.currentPrice
    : product?.base_price;
  const recommendedPrice = recommendation.recommendedPrice;

  const priceDiff = recommendedPrice !== null && currentPrice !== null
    ? recommendedPrice - currentPrice
    : null;
  const priceDiffPercent = priceDiff !== null && currentPrice > 0
    ? (priceDiff / currentPrice) * 100
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply this pricing recommendation?"
      maxWidth="max-w-md"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            loading={isApplying}
          >
            {isApplying ? 'Applying...' : 'Apply Recommendation'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="flex items-start gap-3 p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-[#1E3A8A]">
          <AlertTriangle className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Authoritative Catalog Update</span>
            Applying this recommendation will send an explicit request to update the product catalog base price on the backend.
          </div>
        </div>

        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
          <div className="text-xs text-[#64748B]">
            Target Product: <strong className="text-[#0F172A]">{product?.name || 'Selected Item'}</strong>
          </div>

          <div className="flex items-center justify-between p-3 bg-white border border-[#CBD5E1] rounded-lg">
            <div>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider block">Current Price</span>
              <span className="text-sm font-semibold text-[#0F172A]">
                {formatCurrency(currentPrice, currency)}
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-[#94A3B8]" />

            <div className="text-right">
              <span className="text-[10px] text-[#2563EB] font-semibold uppercase tracking-wider block">Recommended Price</span>
              <span className="text-base font-bold text-[#2563EB]">
                {formatCurrency(recommendedPrice, currency)}
              </span>
            </div>
          </div>

          {priceDiff !== null && (
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <span className="text-[#64748B]">Catalog Price Adjustment:</span>
              <span className={`font-semibold ${
                priceDiff > 0 ? 'text-[#15803D]' : priceDiff < 0 ? 'text-[#DC2626]' : 'text-[#64748B]'
              }`}>
                {formatCurrencyDelta(priceDiff, currency)}
                {priceDiffPercent !== null && ` (${formatPercentage(priceDiffPercent, true)})`}
              </span>
            </div>
          )}

          {/* Expected Impact metrics if returned by backend */}
          {(recommendation.expectedDemand !== null || recommendation.expectedRevenue !== null || recommendation.expectedProfit !== null) && (
            <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
              <span className="text-[11px] font-semibold text-[#475569] block">Expected Model Impact:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {recommendation.expectedDemand !== null && (
                  <div className="p-2 bg-white rounded-md border border-[#E2E8F0]">
                    <span className="text-[#64748B] block text-[10px]">Expected Demand</span>
                    <span className="font-semibold text-[#0F172A]">
                      {Math.round(recommendation.expectedDemand).toLocaleString()} units
                    </span>
                  </div>
                )}
                {recommendation.expectedRevenue !== null && (
                  <div className="p-2 bg-white rounded-md border border-[#E2E8F0]">
                    <span className="text-[#64748B] block text-[10px]">Expected Revenue</span>
                    <span className="font-semibold text-[#15803D]">
                      {formatCurrency(recommendation.expectedRevenue, currency)}
                    </span>
                  </div>
                )}
                {recommendation.expectedProfit !== null && (
                  <div className="p-2 bg-white rounded-md border border-[#E2E8F0]">
                    <span className="text-[#64748B] block text-[10px]">Expected Profit</span>
                    <span className="font-semibold text-[#16A34A]">
                      {formatCurrency(recommendation.expectedProfit, currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
