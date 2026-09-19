import React, { useState } from 'react';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { Building2, Link2, FileText, AlertCircle } from 'lucide-react';
import { generateSlug, validateOrgPayload } from '../utils/organizationHelpers';

export default function OrganizationForm({
  initialValues = { name: '', slug: '', description: '', logo_url: '' },
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Create Organization',
}) {
  const [formData, setFormData] = useState({
    name: initialValues.name || '',
    slug: initialValues.slug || '',
    description: initialValues.description || '',
    logo_url: initialValues.logo_url || '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [autoSlug, setAutoSlug] = useState(!initialValues.slug);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: autoSlug ? generateSlug(val) : prev.slug,
    }));
    if (formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleSlugChange = (e) => {
    setAutoSlug(false);
    setFormData((prev) => ({
      ...prev,
      slug: generateSlug(e.target.value),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { isValid, errors } = validateOrgPayload(formData);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
    };
    if (formData.slug.trim()) payload.slug = formData.slug.trim();
    if (formData.description.trim()) payload.description = formData.description.trim();
    if (formData.logo_url && formData.logo_url.trim()) payload.logo_url = formData.logo_url.trim();

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Organization Name"
        name="name"
        type="text"
        placeholder="e.g. Acme Retail Inc."
        value={formData.name}
        onChange={handleNameChange}
        error={formErrors.name}
        leftIcon={Building2}
        disabled={isSubmitting}
        required
      />

      <Input
        label="Slug"
        name="slug"
        type="text"
        placeholder="acme-retail"
        value={formData.slug}
        onChange={handleSlugChange}
        error={formErrors.slug}
        helperText="URL-safe identifier for your workspace"
        leftIcon={Link2}
        disabled={isSubmitting}
      />

      <div>
        <label
          htmlFor="org-description"
          className="block text-[13px] font-medium text-[#0F172A] mb-1.5"
        >
          Description
        </label>
        <textarea
          id="org-description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="Brief description of this business workspace..."
          className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-all duration-150 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
