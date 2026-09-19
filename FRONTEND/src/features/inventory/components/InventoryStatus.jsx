import React from 'react';
import Badge from '../../../components/Badge';
import { deriveInventoryStatus } from '../utils/inventoryHelpers';

export default function InventoryStatus({ inventory, size = 'sm' }) {
  const statusInfo = deriveInventoryStatus(inventory);

  return (
    <Badge variant={statusInfo.variant} size={size} dot>
      {statusInfo.label}
    </Badge>
  );
}
