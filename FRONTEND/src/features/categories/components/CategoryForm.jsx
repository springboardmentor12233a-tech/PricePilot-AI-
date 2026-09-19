import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useCategories } from '../hooks/useCategories';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { useToast } from '../../../hooks/useToast';
import { validateCategoryPayload } from '../utils/categoryHelpers';

export default function CategoryForm({ isOpen, onClose, onSuccess }) {
  const { selectedOrganizationId } = useOrganization();
  const { categories, createCategory, isCreating } = useCategories(selectedOrganizationId);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrganizationId) {
      toast.error('Please select an active organization first.');
      return;
    }

    const { isValid, errors } = validateCategoryPayload(formData);
    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      organization_id: selectedOrganizationId,
      name: formData.name.trim(),
      ...(formData.description.trim() ? { description: formData.description.trim() } : {}),
      ...(formData.parent_id ? { parent_id: formData.parent_id } : {}),
    };

    try {
      await createCategory(payload);
      toast.success('Category created successfully.');
      setFormData({ name: '', description: '', parent_id: '' });
      setFieldErrors({});
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message || 'Unable to create category.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Category"
      description="Add a new catalog category to group your products."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Category Name"
          name="name"
          placeholder="e.g. Consumer Electronics, Apparel"
          value={formData.name}
          onChange={handleChange}
          required
          error={fieldErrors.name}
          autoFocus
        />

        <div>
          <label
            htmlFor="category-parent-id"
            className="block text-[13px] font-medium text-[#0F172A] mb-1.5"
          >
            Parent Category (Optional)
          </label>
          <select
            id="category-parent-id"
            name="parent_id"
            value={formData.parent_id}
            onChange={handleChange}
            className="w-full h-10.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#0F172A] transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
          >
            <option value="">None (Top-level Category)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="category-description"
            className="block text-[13px] font-medium text-[#0F172A] mb-1.5"
          >
            Description (Optional)
          </label>
          <textarea
            id="category-description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of this category..."
            className="w-full rounded-lg border border-[#E2E8F0] bg-white p-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isCreating}
            loadingText="Creating category..."
          >
            Create Category
          </Button>
        </div>
      </form>
    </Modal>
  );
}
