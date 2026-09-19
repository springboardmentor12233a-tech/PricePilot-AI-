/**
 * PricePilot AI — Inventory Helper Utilities
 * Real stock status derived strictly from backend inventory attributes
 */

export function deriveInventoryStatus(inventory) {
  if (!inventory) {
    return {
      status: 'unavailable',
      label: 'Unavailable',
      variant: 'neutral',
    };
  }

  const qty = inventory.quantity_on_hand;
  const reorder = inventory.reorder_level;

  if (qty === undefined || qty === null) {
    return {
      status: 'unavailable',
      label: 'Unavailable',
      variant: 'neutral',
    };
  }

  const numQty = Number(qty);
  const numReorder = reorder !== undefined && reorder !== null ? Number(reorder) : null;

  if (numQty <= 0) {
    return {
      status: 'out_of_stock',
      label: 'Out of Stock',
      variant: 'danger',
    };
  }

  if (numReorder !== null && numQty <= numReorder) {
    return {
      status: 'low_stock',
      label: 'Low Stock',
      variant: 'warning',
    };
  }

  return {
    status: 'healthy',
    label: 'Healthy',
    variant: 'success',
  };
}

export function validateInventoryUpdate(payload) {
  const errors = {};

  if (payload.quantity_on_hand === undefined || payload.quantity_on_hand === '' || isNaN(Number(payload.quantity_on_hand))) {
    errors.quantity_on_hand = 'Quantity on hand must be a valid number.';
  } else if (Number(payload.quantity_on_hand) < 0) {
    errors.quantity_on_hand = 'Quantity on hand cannot be negative.';
  }

  if (payload.reorder_level !== undefined && payload.reorder_level !== '' && !isNaN(Number(payload.reorder_level))) {
    if (Number(payload.reorder_level) < 0) {
      errors.reorder_level = 'Reorder level cannot be negative.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
