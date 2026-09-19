import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable ConfirmDialog Component built on Modal
 * Used for confirming dangerous or critical operations
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            variant === 'danger'
              ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
              : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
          }`}
        >
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-[#475569] leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
