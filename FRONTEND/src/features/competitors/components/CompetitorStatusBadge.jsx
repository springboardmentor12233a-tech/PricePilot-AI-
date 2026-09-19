import React from 'react';
import Badge from '../../../components/Badge';

export default function CompetitorStatusBadge({ isActive, size = 'sm' }) {
  const active = Boolean(isActive);

  return (
    <Badge variant={active ? 'success' : 'neutral'} size={size} dot>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}
