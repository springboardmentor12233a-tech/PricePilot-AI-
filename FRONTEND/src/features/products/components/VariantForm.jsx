import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast } from '../../../hooks/useToast';

export default function VariantForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  productId,
}) {
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    cost_price: '',
    barcode: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {};
    if (!formData.name.trim()) validationErrors.name = 'Variant name is required.';
    if (!formData.sku.trim()) validationErrors.sku = 'Variant SKU is required.';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      ...(formData.barcode.trim() ? { barcode: formData.barcode.trim() } : {}),
      ...(formData.price !== '' ? { price: Number(formData.price) } : {}),
      ...(formData.cost_price !== '' ? { cost_price: Number(formData.cost_price) } : {}),
    };

    try {
      await onSubmit(payload);
      setFormData({ name: '', sku: '', price: '', cost_price: '', barcode: '' });
      setErrors({});
    } catch {
      // Error handled in parent/mutation
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Product Variant"
      description="Create a specific SKU variation (e.g. Size, Color, Model) for this product."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Variant Name"
          name="name"
          placeholder="e.g. Midnight Black / 256GB"
          value={formData.name}
          onChange={handleChange}
          required
          error={errors.name}
          autoFocus
        />

        <Input
          label="Variant SKU"
          name="sku"
          placeholder="e.g. SKU-WH-BLK-256"
          value={formData.sku}
          onChange={handleChange}
          required
          error={errors.sku}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Variant Price (₹)"
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.price}
            onChange={handleChange}
          />

          <Input
            label="Variant Cost (₹)"
            name="cost_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.cost_price}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Barcode / EAN (Optional)"
          name="barcode"
          placeholder="e.g. 012345678905"
          value={formData.barcode}
          onChange={handleChange}
        />

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
            loadingText="Adding variant..."
          >
            Add Variant
          </Button>
        </div>
      </form>
    </Modal>
  );
}
