import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import CategorySelect from '../../categories/components/CategorySelect';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { validateProductPayload } from '../utils/productHelpers';
import { useToast } from '../../../hooks/useToast';

export default function ProductForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) {
  const isEdit = Boolean(initialData?.id);
  const { selectedOrganizationId } = useOrganization();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    brand: '',
    category_id: '',
    description: '',
    cost_price: '',
    base_price: '',
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        brand: initialData.brand || '',
        category_id: initialData.category_id || initialData.category?.id || '',
        description: initialData.description || '',
        cost_price: initialData.cost_price !== undefined && initialData.cost_price !== null ? String(initialData.cost_price) : '',
        base_price: initialData.base_price !== undefined && initialData.base_price !== null ? String(initialData.base_price) : '',
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        brand: '',
        category_id: '',
        description: '',
        cost_price: '',
        base_price: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrganizationId && !isEdit) {
      toast.error('Please select an active organization first.');
      return;
    }

    const { isValid, errors: validationErrors } = validateProductPayload(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    // Build payload strictly adhering to backend product schema
    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      ...(formData.brand.trim() ? { brand: formData.brand.trim() } : {}),
      ...(formData.description.trim() ? { description: formData.description.trim() } : {}),
      ...(formData.category_id ? { category_id: formData.category_id } : {}),
      ...(formData.cost_price !== '' ? { cost_price: Number(formData.cost_price) } : {}),
      ...(formData.base_price !== '' ? { base_price: Number(formData.base_price) } : {}),
      is_active: Boolean(formData.is_active),
    };

    // On create, attach organization_id from selectedOrganizationId
    if (!isEdit && selectedOrganizationId) {
      payload.organization_id = selectedOrganizationId;
    }

    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'Add Product'}
      description={
        isEdit
          ? 'Update product catalog information, pricing, and status.'
          : 'Define a new product item in your organization catalog.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Two-column grid for Name & SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            name="name"
            placeholder="e.g. Ultra Wireless Headphones"
            value={formData.name}
            onChange={handleChange}
            required
            error={errors.name}
            autoFocus
          />

          <Input
            label="SKU (Stock Keeping Unit)"
            name="sku"
            placeholder="e.g. SKU-WH-1000"
            value={formData.sku}
            onChange={handleChange}
            required
            error={errors.sku}
          />
        </div>

        {/* Brand & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Brand"
            name="brand"
            placeholder="e.g. Sony, Apple, Acme"
            value={formData.brand}
            onChange={handleChange}
          />

          <CategorySelect
            label="Category"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            placeholder="Select a category"
            error={errors.category_id}
          />
        </div>

        {/* Pricing Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Cost Price (₹)"
            name="cost_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.cost_price}
            onChange={handleChange}
            error={errors.cost_price}
          />

          <Input
            label="Base Price (₹)"
            name="base_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.base_price}
            onChange={handleChange}
            error={errors.base_price}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="product-description"
            className="block text-[13px] font-medium text-[#0F172A] mb-1.5"
          >
            Description
          </label>
          <textarea
            id="product-description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Technical details, key features, or catalog notes..."
            className="w-full rounded-lg border border-[#E2E8F0] bg-white p-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 resize-none"
          />
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
          <div>
            <label htmlFor="product-is-active" className="text-sm font-semibold text-[#0F172A] block cursor-pointer">
              Active Status
            </label>
            <p className="text-xs text-[#64748B] mt-0.5">
              Active products are available for pricing algorithms, competitor tracking, and sales.
            </p>
          </div>
          <input
            id="product-is-active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-5 h-5 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
          />
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
            loadingText={isEdit ? 'Saving...' : 'Creating product...'}
          >
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
