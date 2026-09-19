import React from 'react';
import Badge from '../../../components/Badge';

export default function ProductStatusBadge({ isActive }) {
  const active = Boolean(isActive);

  return (
    <Badge variant={active ? 'success' : 'neutral'} size="sm" dot>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}
