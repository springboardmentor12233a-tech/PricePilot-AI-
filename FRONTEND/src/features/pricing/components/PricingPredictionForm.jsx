import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, ShieldAlert } from 'lucide-react';
import Button from '../../../components/Button';
import formatCurrency from '../../../utils/formatCurrency';
import { buildPredictionPayload } from '../utils/pricingHelpers';

export default function PricingPredictionForm({
  product,
  competitorData,
  inventory,
  onSubmit,
  onReset,
  isLoading = false,
  className = '',
}) {
  const [targetMarginPercent, setTargetMarginPercent] = useState('20');
  const [validationError, setValidationError] = useState('');
  const costPrice = product?.cost_price === null || product?.cost_price === undefined
    ? null
    : Number(product.cost_price);
  const hasValidCost = costPrice !== null && Number.isFinite(costPrice) && costPrice > 0;

  // Synchronize initial values when product changes
  useEffect(() => {
    if (product) {
      setTargetMarginPercent('20');
      setValidationError('');
    } else {
      setTargetMarginPercent('20');
      setValidationError('');
    }
  }, [product?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!product) {
      setValidationError('Please select a product first.');
      return;
    }
    if (!hasValidCost) {
      setValidationError('A valid unit cost is required by the backend pricing rules.');
      return;
    }

    const margin = Number(targetMarginPercent);
    if (!targetMarginPercent || !Number.isFinite(margin) || margin < 0) {
      setValidationError('Please enter a finite, non-negative target margin.');
      return;
    }

    const payload = buildPredictionPayload(product, { targetMarginPercent: margin });

    onSubmit(payload);
  };

  const handleResetForm = () => {
    if (product) {
      setTargetMarginPercent('20');
    }
    setValidationError('');
    if (onReset) onReset();
  };

  const currency = product?.currency || 'INR';

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">Pricing Analysis Parameters</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Set a target margin for the existing cost, competitor, and inventory pricing rules.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetForm}
          disabled={isLoading || !product}
          className="text-xs text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Parameters
        </button>
      </div>

      {validationError && (
        <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-xs text-[#991B1B]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Scenario Price */}
        <div>
          <label className="block text-xs font-semibold text-[#334155] mb-1">
            Target Margin (%)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              disabled={isLoading || !product}
              value={targetMarginPercent}
              onChange={(e) => setTargetMarginPercent(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
          </div>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Current catalog price: {product?.base_price !== null && product?.base_price !== undefined ? formatCurrency(product.base_price, currency) : 'Unavailable'}
          </span>
        </div>

        {/* Competitor Price Benchmark */}
        <div>
          <label className="block text-xs font-semibold text-[#334155] mb-1">
            Observed Competitor Benchmark
          </label>
          <div className="relative">
            <div className="w-full bg-slate-50 border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A]">
              {competitorData?.marketAverage || competitorData?.latestPrice
                ? formatCurrency(competitorData.marketAverage || competitorData.latestPrice, currency)
                : 'Unavailable'}
            </div>
          </div>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Recorded observations only; no value is substituted when unavailable.
          </span>
        </div>

        {/* Discount */}
        <div>
          <label className="block text-xs font-semibold text-[#334155] mb-1">
            Cost Price
          </label>
          <div className="relative">
            <div className="w-full bg-slate-50 border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A]">
              {product?.cost_price !== null && product?.cost_price !== undefined
                ? formatCurrency(product.cost_price, currency)
                : 'Unavailable'}
            </div>
          </div>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            A valid cost is required to calculate a price recommendation.
          </span>
        </div>

        {/* Inventory Stock Override */}
        <div>
          <label className="block text-xs font-semibold text-[#334155] mb-1">
            Available Inventory
          </label>
          <div className="w-full bg-slate-50 border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A]">
            {inventory?.available_quantity ?? inventory?.current_stock ?? 'Unavailable'}
          </div>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Available units from the organization inventory record.
          </span>
        </div>

        {/* Promotion Toggle */}
        <div className="flex flex-col justify-center sm:col-span-2">
          <label className="block text-xs font-semibold text-[#334155] mb-2">
            Calculation Method
          </label>
          <span className="text-xs text-[#334155] font-medium">
            Deterministic backend rules; no ML demand forecast is returned.
          </span>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Uses stored cost, compatible competitor prices, and inventory when available.
          </span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
        <div className="text-[11px] text-[#64748B]">
          Analysis uses the selected product’s saved database values.
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          disabled={!product || !hasValidCost || isLoading}
          leftIcon={Play}
        >
          {isLoading ? 'Analyzing pricing signals…' : 'Run Pricing Analysis'}
        </Button>
      </div>
    </form>
  );
}
