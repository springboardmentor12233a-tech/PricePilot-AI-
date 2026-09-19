import React, { useState } from 'react';
import { Plus, AlertCircle, Percent, Boxes, Users, Tag } from 'lucide-react';
import Button from '../../../components/Button';
import { validateScenarioInput } from '../utils/revenueUtils';

export default function ScenarioInput({
  onAddScenario,
  defaultPrice = '',
  defaultDiscount = '',
  defaultCompetitorPrice = '',
  defaultInventory = '',
  currency = 'INR',
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(defaultPrice);
  const [discount, setDiscount] = useState(defaultDiscount);
  const [promotion, setPromotion] = useState(false);
  const [competitorPrice, setCompetitorPrice] = useState(defaultCompetitorPrice);
  const [inventory, setInventory] = useState(defaultInventory);

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    const inputData = {
      price,
      discount,
      competitorPrice,
      inventory,
    };

    const validation = validateScenarioInput(inputData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    onAddScenario({
      name: name.trim() || undefined,
      price: Number(price),
      discount: discount !== '' ? Number(discount) : 0,
      promotion: Boolean(promotion),
      competitorPrice: competitorPrice !== '' ? Number(competitorPrice) : undefined,
      inventory: inventory !== '' ? Number(inventory) : undefined,
    });

    // Reset input fields
    setName('');
    setPrice('');
    setDiscount('');
    setPromotion(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Candidate Price (Required) */}
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1">
            Candidate Price ({currency}) <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0.01"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
              }}
              placeholder="e.g. 479"
              className={`w-full px-3 py-2 text-xs bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] text-[#0F172A] placeholder-[#94A3B8] ${
                errors.price ? 'border-[#EF4444] bg-[#FEF2F2]/30' : 'border-[#CBD5E1]'
              }`}
            />
          </div>
          {errors.price && (
            <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.price}
            </p>
          )}
        </div>

        {/* Scenario Name (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1">
            Scenario Label <span className="text-[11px] text-[#64748B] font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aggressive Discount, High Margin"
            className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] text-[#0F172A] placeholder-[#94A3B8]"
          />
        </div>

        {/* Discount % (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1">
            Discount % <span className="text-[11px] text-[#64748B] font-normal">(Optional, 0-100)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => {
                setDiscount(e.target.value);
                if (errors.discount) setErrors((prev) => ({ ...prev, discount: null }));
              }}
              placeholder="e.g. 10"
              className={`w-full px-3 py-2 text-xs bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] text-[#0F172A] placeholder-[#94A3B8] ${
                errors.discount ? 'border-[#EF4444] bg-[#FEF2F2]/30' : 'border-[#CBD5E1]'
              }`}
            />
          </div>
          {errors.discount && (
            <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.discount}
            </p>
          )}
        </div>

        {/* Competitor Price Override (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1">
            Competitor Benchmark <span className="text-[11px] text-[#64748B] font-normal">(Optional)</span>
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={competitorPrice}
            onChange={(e) => {
              setCompetitorPrice(e.target.value);
              if (errors.competitorPrice) setErrors((prev) => ({ ...prev, competitorPrice: null }));
            }}
            placeholder="Leave empty to use catalog"
            className={`w-full px-3 py-2 text-xs bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] text-[#0F172A] placeholder-[#94A3B8] ${
              errors.competitorPrice ? 'border-[#EF4444] bg-[#FEF2F2]/30' : 'border-[#CBD5E1]'
            }`}
          />
          {errors.competitorPrice && (
            <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.competitorPrice}
            </p>
          )}
        </div>

        {/* Inventory Override (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1">
            Inventory Units <span className="text-[11px] text-[#64748B] font-normal">(Optional)</span>
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={inventory}
            onChange={(e) => {
              setInventory(e.target.value);
              if (errors.inventory) setErrors((prev) => ({ ...prev, inventory: null }));
            }}
            placeholder="Leave empty to use catalog"
            className={`w-full px-3 py-2 text-xs bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] text-[#0F172A] placeholder-[#94A3B8] ${
              errors.inventory ? 'border-[#EF4444] bg-[#FEF2F2]/30' : 'border-[#CBD5E1]'
            }`}
          />
          {errors.inventory && (
            <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.inventory}
            </p>
          )}
        </div>

        {/* Promotion Flag */}
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="promotionToggle"
            checked={promotion}
            onChange={(e) => setPromotion(e.target.checked)}
            className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-[#CBD5E1]"
          />
          <label htmlFor="promotionToggle" className="text-xs font-medium text-[#0F172A] cursor-pointer">
            Active Marketing Campaign / Promotion
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          leftIcon={Plus}
        >
          Add Scenario
        </Button>
      </div>
    </form>
  );
}
