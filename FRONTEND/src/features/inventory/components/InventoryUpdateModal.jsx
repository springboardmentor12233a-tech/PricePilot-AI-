import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { validateInventoryUpdate } from '../utils/inventoryHelpers';
import { useToast } from '../../../hooks/useToast';

export default function InventoryUpdateModal({
  isOpen,
  onClose,
  onSubmit,
  currentInventory = null,
  productName = 'Product',
  isLoading = false,
}) {
  const toast = useToast();

  const [formData, setFormData] = useState({
    quantity_on_hand: '',
    reserved_quantity: '',
    reorder_level: '',
    reorder_quantity: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentInventory) {
      setFormData({
        quantity_on_hand:
          currentInventory.quantity_on_hand !== undefined && currentInventory.quantity_on_hand !== null
            ? String(currentInventory.quantity_on_hand)
            : '0',
        reserved_quantity:
          currentInventory.reserved_quantity !== undefined && currentInventory.reserved_quantity !== null
            ? String(currentInventory.reserved_quantity)
            : '0',
        reorder_level:
          currentInventory.reorder_level !== undefined && currentInventory.reorder_level !== null
            ? String(currentInventory.reorder_level)
            : '',
        reorder_quantity:
          currentInventory.reorder_quantity !== undefined && currentInventory.reorder_quantity !== null
            ? String(currentInventory.reorder_quantity)
            : '',
      });
    } else {
      setFormData({
        quantity_on_hand: '0',
        reserved_quantity: '0',
        reorder_level: '',
        reorder_quantity: '',
      });
    }
    setErrors({});
  }, [currentInventory, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateInventoryUpdate(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      quantity_on_hand: Number(formData.quantity_on_hand),
      ...(formData.reserved_quantity !== '' ? { reserved_quantity: Number(formData.reserved_quantity) } : {}),
      ...(formData.reorder_level !== '' ? { reorder_level: Number(formData.reorder_level) } : {}),
      ...(formData.reorder_quantity !== '' ? { reorder_quantity: Number(formData.reorder_quantity) } : {}),
    };

    try {
      await onSubmit(payload);
      toast.success('Inventory updated successfully.');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Unable to update inventory.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Inventory"
      description={`Adjust physical stock and reorder parameters for ${productName}.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Quantity on Hand"
            name="quantity_on_hand"
            type="number"
            min="0"
            step="1"
            value={formData.quantity_on_hand}
            onChange={handleChange}
            required
            error={errors.quantity_on_hand}
            autoFocus
          />

          <Input
            label="Reserved Quantity"
            name="reserved_quantity"
            type="number"
            min="0"
            step="1"
            value={formData.reserved_quantity}
            onChange={handleChange}
            error={errors.reserved_quantity}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Reorder Threshold"
            name="reorder_level"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 10"
            value={formData.reorder_level}
            onChange={handleChange}
            error={errors.reorder_level}
          />

          <Input
            label="Reorder Batch Qty"
            name="reorder_quantity"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 50"
            value={formData.reorder_quantity}
            onChange={handleChange}
            error={errors.reorder_quantity}
          />
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
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            loadingText="Updating..."
          >
            Update Inventory
          </Button>
        </div>
      </form>
    </Modal>
  );
}
