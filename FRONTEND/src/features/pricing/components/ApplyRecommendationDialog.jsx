import React from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import formatCurrency from '../../../utils/formatCurrency';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { calculatePriceDifference, calculatePriceDifferencePercent } from '../utils/pricingCalculations';

export default function ApplyRecommendationDialog({
  isOpen,
  onClose,
  onConfirm,
  recommendation,
  product,
  isApplying = false,
}) {
  if (!recommendation) return null;

  const currency = product?.currency || 'INR';
  const currentPrice = recommendation.currentPrice !== null ? recommendation.currentPrice : product?.base_price;
  const newPrice = recommendation.recommendedPrice;

  const diff = calculatePriceDifference(newPrice, currentPrice);
  const diffPercent = calculatePriceDifferencePercent(newPrice, currentPrice);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Pricing Recommendation"
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isApplying}>
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
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
          <AlertTriangle className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="text-xs text-[#1E3A8A] leading-relaxed">
            Review the proposed pricing change before applying it to the product catalog. Once confirmed, this will execute an authoritative price update on the backend service.
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="text-xs text-[#64748B]">
            Target Product: <strong className="text-[#0F172A]">{product?.name || 'Selected Product'}</strong>
          </div>

          <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#64748B] block">Current Price</span>
              <span className="text-sm font-semibold text-[#0F172A]">
                {formatCurrency(currentPrice, currency)}
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-[#94A3B8]" />

            <div className="text-right">
              <span className="text-[11px] text-[#64748B] block">New Target Price</span>
              <span className="text-sm font-bold text-[#2563EB]">
                {formatCurrency(newPrice, currency)}
              </span>
            </div>
          </div>

          {diff !== null && diffPercent !== null && (
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-[#64748B]">Net Catalog Adjustment:</span>
              <span
                className={`font-semibold ${
                  diff > 0 ? 'text-[#15803D]' : diff < 0 ? 'text-[#B45309]' : 'text-[#475569]'
                }`}
              >
                {diff > 0 ? `+${formatCurrency(diff, currency)} (+${diffPercent.toFixed(1)}%)` : `${formatCurrency(diff, currency)} (${diffPercent.toFixed(1)}%)`}
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
