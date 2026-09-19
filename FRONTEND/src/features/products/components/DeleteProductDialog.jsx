import React from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import { AlertTriangle } from 'lucide-react';

export default function DeleteProductDialog({
  isOpen,
  onClose,
  onConfirm,
  productName = 'this product',
  isLoading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product?"
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">
              Delete "{productName}"
            </p>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              This action cannot be undone. Are you sure you want to continue?
            </p>
          </div>
        </div>

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
            type="button"
            variant="danger"
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="Deleting..."
          >
            Delete Product
          </Button>
        </div>
      </div>
    </Modal>
  );
}
