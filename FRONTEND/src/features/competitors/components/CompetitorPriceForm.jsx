import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { validateCompetitorPricePayload } from '../utils/competitorHelpers';
import { useToast } from '../../../hooks/useToast';

export default function CompetitorPriceForm({
  isOpen,
  onClose,
  onSubmit,
  products = [],
  competitors = [],
  initialProductId = '',
  initialCompetitorId = '',
  isLoading = false,
}) {
  const toast = useToast();

  const [formData, setFormData] = useState({
    product_id: initialProductId || '',
    competitor_id: initialCompetitorId || '',
    price: '',
    currency: 'INR',
    source: 'Manual Observation',
    observed_at: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      product_id: initialProductId || (products[0]?.id ? String(products[0].id) : ''),
      competitor_id: initialCompetitorId || (competitors[0]?.id ? String(competitors[0].id) : ''),
      price: '',
      currency: 'INR',
      source: 'Manual Observation',
      observed_at: new Date().toISOString().slice(0, 16),
    });
    setErrors({});
  }, [isOpen, initialProductId, initialCompetitorId, products, competitors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateCompetitorPricePayload(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      product_id: formData.product_id,
      price: Number(formData.price),
      currency: formData.currency,
      ...(formData.competitor_id ? { competitor_id: formData.competitor_id } : {}),
      ...(formData.source.trim() ? { source: formData.source.trim() } : {}),
      observed_at: formData.observed_at ? new Date(formData.observed_at).toISOString() : new Date().toISOString(),
    };

    try {
      await onSubmit(payload);
      toast.success('Competitor price recorded successfully.');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Unable to record competitor price.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Competitor Price"
      description="Document an observed market price point for this catalog product."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Select */}
        <div>
          <label htmlFor="price-form-product" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
            Product <span className="text-[#DC2626]">*</span>
          </label>
          <select
            id="price-form-product"
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
            className="w-full h-10.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
          >
            <option value="">— Select Product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.sku ? `(${p.sku})` : ''}
              </option>
            ))}
          </select>
          {errors.product_id && (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.product_id}</p>
          )}
        </div>

        {/* Competitor Select */}
        <div>
          <label htmlFor="price-form-competitor" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
            Competitor
          </label>
          <select
            id="price-form-competitor"
            name="competitor_id"
            value={formData.competitor_id}
            onChange={handleChange}
            className="w-full h-10.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
          >
            <option value="">— General Market Observation —</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.website ? `(${c.website.replace(/^https?:\/\//, '')})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Price & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Observed Price (₹)"
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={formData.price}
            onChange={handleChange}
            required
            error={errors.price}
            autoFocus
          />

          <Input
            label="Observation Source"
            name="source"
            placeholder="e.g. Amazon Storefront, Store Visit"
            value={formData.source}
            onChange={handleChange}
          />
        </div>

        {/* Observed At Date-time */}
        <div>
          <label htmlFor="price-observed-at" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
            Observation Timestamp
          </label>
          <input
            id="price-observed-at"
            name="observed_at"
            type="datetime-local"
            value={formData.observed_at}
            onChange={handleChange}
            className="w-full h-10.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          />
          <p className="text-[11px] text-[#64748B] mt-1">
            Indicates when this competitor price was publicly visible.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            loadingText="Saving..."
          >
            Record Price
          </Button>
        </div>
      </form>
    </Modal>
  );
}
