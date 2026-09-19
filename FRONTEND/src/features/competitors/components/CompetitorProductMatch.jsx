import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { validateMatchPayload } from '../utils/competitorHelpers';
import { useToast } from '../../../hooks/useToast';

export default function CompetitorProductMatch({
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
    competitor_sku: '',
    product_url: '',
  });

  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    setFormData({
      product_id: initialProductId || (products[0]?.id ? String(products[0].id) : ''),
      competitor_id: initialCompetitorId || (competitors[0]?.id ? String(competitors[0].id) : ''),
      competitor_sku: '',
      product_url: '',
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

    const { isValid, errors: validationErrors } = validateMatchPayload(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      product_id: formData.product_id,
      competitor_id: formData.competitor_id,
      ...(formData.competitor_sku.trim() ? { competitor_sku: formData.competitor_sku.trim() } : {}),
      ...(formData.product_url.trim() ? { product_url: formData.product_url.trim() } : {}),
    };

    try {
      await onSubmit(payload);
      toast.success('Competitor product matched successfully.');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Unable to match competitor product.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Match Competitor Product"
      description="Pair a product from your catalog with a competitor's listing to track relative price movements."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Select Our Product */}
        <div>
          <label htmlFor="match-product-id" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
            Select Our Catalog Product <span className="text-[#DC2626]">*</span>
          </label>
          <select
            id="match-product-id"
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
            className="w-full h-10.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
          >
            <option value="">— Select Catalog Product —</option>
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

        {/* Select Competitor */}
        <div>
          <label htmlFor="match-competitor-id" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
            Select Competitor <span className="text-[#DC2626]">*</span>
          </label>
          <select
            id="match-competitor-id"
            name="competitor_id"
            value={formData.competitor_id}
            onChange={handleChange}
            className="w-full h-10.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
          >
            <option value="">— Select Competitor —</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.website ? `(${c.website.replace(/^https?:\/\//, '')})` : ''}
              </option>
            ))}
          </select>
          {errors.competitor_id && (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.competitor_id}</p>
          )}
        </div>

        {/* Competitor SKU */}
        <Input
          label="Competitor SKU / Product ID (Optional)"
          name="competitor_sku"
          placeholder="e.g. B08N5WRWNW or SKU-9921"
          value={formData.competitor_sku}
          onChange={handleChange}
        />

        {/* Competitor Listing URL */}
        <Input
          label="Competitor Product URL (Optional)"
          name="product_url"
          placeholder="e.g. https://amazon.in/dp/B08N5WRWNW"
          value={formData.product_url}
          onChange={handleChange}
        />

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
            loadingText="Matching..."
          >
            Match Product
          </Button>
        </div>
      </form>
    </Modal>
  );
}
