import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import OrganizationForm from './OrganizationForm';
import { useOrganization } from '../hooks/useOrganization';
import { useToast } from '../../../hooks/useToast';
import { AlertCircle } from 'lucide-react';

export default function CreateOrganizationModal({ isOpen, onClose, onSuccess }) {
  const { createOrganization } = useOrganization();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setApiError('');
    try {
      const created = await createOrganization(payload);
      toast.success('Organization created successfully.');
      if (onSuccess) onSuccess(created);
      if (onClose) onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to create organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setApiError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Organization"
      description="Set up a workspace for your pricing intelligence operations."
      size="md"
    >
      {apiError && (
        <div
          role="alert"
          className="mb-4 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Creation Error</p>
            <p className="mt-0.5 text-[#B91C1C]">{apiError}</p>
          </div>
        </div>
      )}

      <OrganizationForm
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
        submitLabel="Create Organization"
      />
    </Modal>
  );
}
