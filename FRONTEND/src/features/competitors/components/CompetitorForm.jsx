import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { validateCompetitorPayload } from '../utils/competitorHelpers';
import { useToast } from '../../../hooks/useToast';

export default function CompetitorForm({
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
    website: '',
    description: '',
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        website: initialData.website || '',
        description: initialData.description || '',
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
    } else {
      setFormData({
        name: '',
        website: '',
        description: '',
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
      toast.error('Please select an active organization workspace.');
      return;
    }

    const { isValid, errors: validationErrors } = validateCompetitorPayload(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      ...(formData.website.trim() ? { website: formData.website.trim() } : {}),
      ...(formData.description.trim() ? { description: formData.description.trim() } : {}),
      is_active: Boolean(formData.is_active),
    };

    if (!isEdit && selectedOrganizationId) {
      payload.organization_id = selectedOrganizationId;
    }

    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Competitor' : 'Add Competitor'}
      description={
        isEdit
          ? 'Update competitor profile information and tracking status.'
          : 'Register a competitor domain or merchant to monitor catalog pricing.'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Competitor Name"
          name="name"
          placeholder="e.g. Amazon, BestBuy, Flipkart, Acme Retail"
          value={formData.name}
          onChange={handleChange}
          required
          error={errors.name}
          autoFocus
        />

        <Input
          label="Website Domain (Optional)"
          name="website"
          placeholder="e.g. amazon.in or https://bestbuy.com"
          value={formData.website}
          onChange={handleChange}
          error={errors.website}
        />

        <div>
          <label
            htmlFor="competitor-description"
            className="block text-[13px] font-medium text-[#0F172A] mb-1.5"
          >
            Description (Optional)
          </label>
          <textarea
            id="competitor-description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Market position notes, geographic focus, store profile..."
            className="w-full rounded-lg border border-[#E2E8F0] bg-white p-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 resize-none"
          />
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
          <div>
            <label htmlFor="competitor-is-active" className="text-sm font-semibold text-[#0F172A] block cursor-pointer">
              Active Monitoring
            </label>
            <p className="text-xs text-[#64748B] mt-0.5">
              Active competitors are included in market average index and pricing comparisons.
            </p>
          </div>
          <input
            id="competitor-is-active"
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
            loadingText={isEdit ? 'Saving...' : 'Adding competitor...'}
          >
            {isEdit ? 'Save Changes' : 'Add Competitor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
