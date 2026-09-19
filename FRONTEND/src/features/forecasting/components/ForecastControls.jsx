import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  DollarSign,
  Users2,
  Percent,
  Boxes,
  Tag,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import Button from '../../../components/Button';
import formatCurrency from '../../../utils/formatCurrency';

/**
 * ForecastControls Component
 * Controls for inputting scenario assumptions, validating values,
 * and dispatching demand forecasting requests to the server-side XGBoost model.
 */
export default function ForecastControls({
  product,
  inventory,
  competitorData,
  selectedHorizon,
  isLoading = false,
  status = 'idle',
  onGenerateForecast,
  onReset,
}) {
  const currency = product?.currency || 'INR';

  // Input states
  const [scenarioPrice, setScenarioPrice] = useState('');
  const [competitorPrice, setCompetitorPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [promotion, setPromotion] = useState(false);
  const [inventoryOverride, setInventoryOverride] = useState('');

  // Inline Validation Errors
  const [errors, setErrors] = useState({});

  // Populate inputs when product or signals change
  useEffect(() => {
    if (product) {
      setScenarioPrice(product.base_price !== null && product.base_price !== undefined ? String(product.base_price) : '');
      const compVal = competitorData?.latestPrice || competitorData?.marketAverage;
      setCompetitorPrice(compVal !== null && compVal !== undefined ? String(compVal) : '');
      setDiscount('');
      setPromotion(false);
      setInventoryOverride(
        inventory?.current_stock !== null && inventory?.current_stock !== undefined
          ? String(inventory.current_stock)
          : ''
      );
      setErrors({});
    }
  }, [product, competitorData, inventory]);

  const validate = () => {
    const newErrors = {};

    if (!scenarioPrice || isNaN(Number(scenarioPrice)) || Number(scenarioPrice) <= 0) {
      newErrors.scenarioPrice = 'Price must be a valid number greater than 0';
    }

    if (discount !== '' && (isNaN(Number(discount)) || Number(discount) < 0 || Number(discount) > 100)) {
      newErrors.discount = 'Discount must be a percentage between 0 and 100';
    }

    if (competitorPrice !== '' && (isNaN(Number(competitorPrice)) || Number(competitorPrice) <= 0)) {
      newErrors.competitorPrice = 'Competitor price must be greater than 0';
    }

    if (inventoryOverride !== '' && (isNaN(Number(inventoryOverride)) || Number(inventoryOverride) < 0)) {
      newErrors.inventoryOverride = 'Inventory cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validate()) return;

    onGenerateForecast({
      scenarioPrice: scenarioPrice !== '' ? Number(scenarioPrice) : undefined,
      competitorPrice: competitorPrice !== '' ? Number(competitorPrice) : undefined,
      discount: discount !== '' ? Number(discount) : undefined,
      promotion,
      inventory: inventoryOverride !== '' ? Number(inventoryOverride) : undefined,
      horizon: selectedHorizon,
    });
  };

  const handleReset = () => {
    if (product) {
      setScenarioPrice(String(product.base_price || ''));
      const compVal = competitorData?.latestPrice || competitorData?.marketAverage;
      setCompetitorPrice(compVal !== null && compVal !== undefined ? String(compVal) : '');
      setDiscount('');
      setPromotion(false);
      setInventoryOverride(
        inventory?.current_stock !== null && inventory?.current_stock !== undefined
          ? String(inventory.current_stock)
          : ''
      );
      setErrors({});
    }
    if (onReset) onReset();
  };

  // Button text based on status state
  let buttonText = 'Generate Forecast';
  if (isLoading) buttonText = 'Generating Forecast...';
  else if (status === 'success') buttonText = 'Forecast Updated';
  else if (status === 'error') buttonText = 'Unable to generate forecast';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A]">
            Prediction Context & Scenario Inputs
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure price elasticity and market scenario factors for model evaluation.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading || !product}
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer disabled:opacity-50"
          title="Reset to catalog baselines"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Target Price */}
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              Tested Price ({currency}) <span className="text-[#DC2626]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#94A3B8]">
                {currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={scenarioPrice}
                onChange={(e) => {
                  setScenarioPrice(e.target.value);
                  if (errors.scenarioPrice) setErrors((prev) => ({ ...prev, scenarioPrice: null }));
                }}
                disabled={isLoading || !product}
                className={`w-full pl-8 pr-3 py-2 text-xs bg-white border rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:ring-1 ${
                  errors.scenarioPrice
                    ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
                    : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]'
                }`}
              />
            </div>
            {errors.scenarioPrice && (
              <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.scenarioPrice}
              </p>
            )}
          </div>

          {/* Competitor Price Benchmark */}
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              Competitor Benchmark ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#94A3B8]">
                {currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="Auto-detected or enter"
                value={competitorPrice}
                onChange={(e) => {
                  setCompetitorPrice(e.target.value);
                  if (errors.competitorPrice) setErrors((prev) => ({ ...prev, competitorPrice: null }));
                }}
                disabled={isLoading || !product}
                className={`w-full pl-8 pr-3 py-2 text-xs bg-white border rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:ring-1 ${
                  errors.competitorPrice
                    ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
                    : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]'
                }`}
              />
            </div>
            {errors.competitorPrice && (
              <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.competitorPrice}
              </p>
            )}
          </div>

          {/* Promotional Discount % */}
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              Promotional Discount (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                placeholder="0"
                value={discount}
                onChange={(e) => {
                  setDiscount(e.target.value);
                  if (errors.discount) setErrors((prev) => ({ ...prev, discount: null }));
                }}
                disabled={isLoading || !product}
                className={`w-full pl-3 pr-8 py-2 text-xs bg-white border rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:ring-1 ${
                  errors.discount
                    ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
                    : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#94A3B8]">
                %
              </span>
            </div>
            {errors.discount && (
              <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.discount}
              </p>
            )}
          </div>

          {/* Inventory Level Override */}
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              Inventory On-Hand
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                placeholder="Available units"
                value={inventoryOverride}
                onChange={(e) => {
                  setInventoryOverride(e.target.value);
                  if (errors.inventoryOverride) setErrors((prev) => ({ ...prev, inventoryOverride: null }));
                }}
                disabled={isLoading || !product}
                className={`w-full pl-3 pr-3 py-2 text-xs bg-white border rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:ring-1 ${
                  errors.inventoryOverride
                    ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
                    : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]'
                }`}
              />
            </div>
            {errors.inventoryOverride && (
              <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.inventoryOverride}
              </p>
            )}
          </div>
        </div>

        {/* Promotion Toggle & Submit Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#F1F5F9]">
          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={promotion}
              onChange={(e) => setPromotion(e.target.checked)}
              disabled={isLoading || !product}
              className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
            />
            <span className="text-xs font-medium text-[#0F172A]">
              Active Marketing Promotion Campaign
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            disabled={!product || isLoading}
            leftIcon={Sparkles}
            className="w-full sm:w-auto font-medium shadow-xs"
          >
            {buttonText}
          </Button>
        </div>
      </form>
    </div>
  );
}
