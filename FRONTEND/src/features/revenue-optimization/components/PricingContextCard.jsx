import React from 'react';
import { Tag, IndianRupee, Boxes, Users, Sparkles, AlertCircle, TrendingUp, Play } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import Skeleton from '../../../components/Skeleton';
import Button from '../../../components/Button';

export default function PricingContextCard({
  product,
  inventory,
  competitorData,
  baselinePrediction,
  isBaselinePredicting = false,
  onRunBaselinePrediction,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
        <Skeleton width="40%" height="20px" className="mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height="60px" className="rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!product) return null;

  const currency = product.currency || 'INR';

  // 1. Current Price
  const currentPriceDisplay = product.base_price !== undefined && product.base_price !== null && product.base_price !== ''
    ? formatCurrency(product.base_price, currency)
    : 'Not available';

  // 2. Cost Price
  const costPriceDisplay = product.cost_price !== undefined && product.cost_price !== null && product.cost_price !== ''
    ? formatCurrency(product.cost_price, currency)
    : 'Not available';

  // 3. Competitor Price
  const competitorPriceDisplay = competitorData?.latestPrice !== null && competitorData?.latestPrice !== undefined
    ? formatCurrency(competitorData.latestPrice, currency)
    : (competitorData?.marketAverage ? formatCurrency(competitorData.marketAverage, currency) : 'Not available');

  // 4. Current Discount
  const discountDisplay = product.discount !== undefined && product.discount !== null && product.discount !== ''
    ? `${Number(product.discount)}%`
    : 'Not available';

  // 5. Inventory
  const inventoryDisplay = inventory?.current_stock !== undefined && inventory?.current_stock !== null
    ? `${Number(inventory.current_stock).toLocaleString()} units`
    : 'Not available';

  // 6. Current Predicted Demand
  const predictedDemandVal = baselinePrediction?.predictedDemand;
  const hasPredictedDemand = predictedDemandVal !== null && predictedDemandVal !== undefined;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9] mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Current Pricing Context</h2>
            <p className="text-[11px] text-[#64748B]">Observed baseline catalog and market signals</p>
          </div>
        </div>

        {!hasPredictedDemand && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRunBaselinePrediction}
            loading={isBaselinePredicting}
            leftIcon={Play}
          >
            Predict Baseline Demand
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Current Price */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-[11px] font-medium text-[#64748B] block mb-1">Current Price</span>
          <span className="text-sm font-bold text-[#0F172A] block truncate">
            {currentPriceDisplay}
          </span>
        </div>

        {/* Cost Price */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-[11px] font-medium text-[#64748B] block mb-1">Cost Price</span>
          <span className={`text-sm font-semibold block truncate ${
            costPriceDisplay === 'Not available' ? 'text-[#94A3B8] italic text-xs' : 'text-[#0F172A]'
          }`}>
            {costPriceDisplay}
          </span>
        </div>

        {/* Competitor Price */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-[11px] font-medium text-[#64748B] block mb-1">Competitor Price</span>
          <span className={`text-sm font-semibold block truncate ${
            competitorPriceDisplay === 'Not available' ? 'text-[#94A3B8] italic text-xs' : 'text-[#0F172A]'
          }`}>
            {competitorPriceDisplay}
          </span>
        </div>

        {/* Discount */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-[11px] font-medium text-[#64748B] block mb-1">Current Discount</span>
          <span className={`text-sm font-semibold block truncate ${
            discountDisplay === 'Not available' ? 'text-[#94A3B8] italic text-xs' : 'text-[#0F172A]'
          }`}>
            {discountDisplay}
          </span>
        </div>

        {/* Inventory */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-[11px] font-medium text-[#64748B] block mb-1">Inventory</span>
          <span className={`text-sm font-semibold block truncate ${
            inventoryDisplay === 'Not available' ? 'text-[#94A3B8] italic text-xs' : 'text-[#0F172A]'
          }`}>
            {inventoryDisplay}
          </span>
        </div>

        {/* Predicted Demand */}
        <div className="p-3 bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-[#1E40AF]">Predicted Demand</span>
            <Sparkles className="w-3 h-3 text-[#2563EB]" />
          </div>
          {isBaselinePredicting ? (
            <span className="text-xs text-[#2563EB] animate-pulse">Running ML...</span>
          ) : hasPredictedDemand ? (
            <span className="text-sm font-bold text-[#1E40AF] block truncate">
              {Math.round(predictedDemandVal).toLocaleString()} units
            </span>
          ) : (
            <span className="text-xs text-[#64748B] italic block truncate">
              Not evaluated
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
