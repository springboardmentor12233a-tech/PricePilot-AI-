import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Sparkles, Percent, Tag, ShieldAlert } from 'lucide-react';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
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
  const [scenarioPrice, setScenarioPrice] = useState('');
  const [competitorPrice, setCompetitorPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [promotion, setPromotion] = useState(false);
  const [inventoryOverride, setInventoryOverride] = useState('');
  const [validationError, setValidationError] = useState('');

  // Synchronize initial values when product changes
  useEffect(() => {
    if (product) {
      setScenarioPrice(
        product.base_price !== undefined && product.base_price !== null
          ? String(product.base_price)
          : ''
      );
      setDiscount('0');
      setPromotion(false);
      setInventoryOverride(
        inventory?.current_stock !== undefined && inventory?.current_stock !== null
          ? String(inventory.current_stock)
          : ''
      );
      setValidationError('');
    } else {
      setScenarioPrice('');
      setDiscount('0');
      setPromotion(false);
      setInventoryOverride('');
    }
  }, [product?.id, product?.base_price, inventory?.current_stock]);

  // Synchronize competitor benchmark if available
  useEffect(() => {
    if (competitorData?.latestPrice) {
      setCompetitorPrice(String(competitorData.latestPrice));
    } else if (competitorData?.marketAverage) {
      setCompetitorPrice(String(Math.round(competitorData.marketAverage)));
    } else {
      setCompetitorPrice('');
    }
  }, [competitorData?.latestPrice, competitorData?.marketAverage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!product) {
      setValidationError('Please select a product first.');
      return;
    }

    const priceNum = Number(scenarioPrice);
    if (!scenarioPrice || isNaN(priceNum) || priceNum <= 0) {
      setValidationError('Please enter a valid positive scenario price.');
      return;
    }

    const payload = buildPredictionPayload(product, competitorData, inventory, {
      scenarioPrice,
      competitorPrice: competitorPrice ? Number(competitorPrice) : undefined,
      discount: discount ? Number(discount) : 0,
      promotion,
      inventory: inventoryOverride !== '' ? Number(inventoryOverride) : undefined,
    });

    onSubmit(payload);
  };

  const handleResetForm = () => {
    if (product) {
      setScenarioPrice(String(product.base_price || ''));
      setDiscount('0');
      setPromotion(false);
      setInventoryOverride(
        inventory?.current_stock !== undefined && inventory?.current_stock !== null
          ? String(inventory.current_stock)
          : ''
      );
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
          <h2 className="text-sm font-semibold text-[#0F172A]">Pricing Simulation Parameters</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Test price points and promotional scenarios against the demand model.
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
            Scenario Price ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] font-medium">
              {currency === 'INR' ? '₹' : '$'}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={isLoading || !product}
              value={scenarioPrice}
              onChange={(e) => setScenarioPrice(e.target.value)}
              placeholder="e.g. 1499"
              className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-8 pr-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
          </div>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Current catalog base price: {product?.base_price ? `${currency === 'INR' ? '₹' : '$'}${product.base_price}` : '—'}
          </span>
        </div>

        {/* Competitor Price Benchmark */}
        <div>
          <label className="block text-xs font-semibold text-[#334155] mb-1">
            Competitor Benchmark ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] font-medium">
              {currency === 'INR' ? '₹' : '$'}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={isLoading || !product}
              value={competitorPrice}
              onChange={(e) => setCompetitorPrice(e.target.value)}
              placeholder="e.g. 1399"
              className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-8 pr-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
          </div>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Observed competitor average or reference point
          </span>
        </div>

        {/* Discount */}
        <div>
          <label className="block text-xs font-semibold text-[#334155] mb-1">
            Discount (%)
          </label>
          <div className="relative">
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              disabled={isLoading || !product}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-3 pr-8 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
            <Percent className="w-3.5 h-3.5 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Applicable promotional markdown
          </span>
        </div>

        {/* Inventory Stock Override */}
        <div>
          <label className="block text-xs font-semibold text-[#334155] mb-1">
            Inventory Units (Scenario Override)
          </label>
          <input
            type="number"
            step="1"
            min="0"
            disabled={isLoading || !product}
            value={inventoryOverride}
            onChange={(e) => setInventoryOverride(e.target.value)}
            placeholder={inventory?.current_stock ? String(inventory.current_stock) : 'e.g. 150'}
            className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Current stock: {inventory?.current_stock !== undefined ? `${inventory.current_stock} units` : 'Not recorded'}
          </span>
        </div>

        {/* Promotion Toggle */}
        <div className="flex flex-col justify-center sm:col-span-2">
          <label className="block text-xs font-semibold text-[#334155] mb-2">
            Campaign Status
          </label>
          <label className="inline-flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={promotion}
              disabled={isLoading || !product}
              onChange={(e) => setPromotion(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB] relative"></div>
            <span className="text-xs text-[#334155] font-medium">
              Active Marketing Promotion
            </span>
          </label>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Simulates demand elasticity with promotional advertising
          </span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
        <div className="text-[11px] text-[#64748B]">
          Decision-support forecast computed by backend XGBoost service.
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          disabled={!product}
          leftIcon={Play}
        >
          {isLoading ? 'Analyzing pricing signals…' : 'Run Pricing Prediction'}
        </Button>
      </div>
    </form>
  );
}
