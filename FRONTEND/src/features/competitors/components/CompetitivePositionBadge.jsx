import React from 'react';
import Badge from '../../../components/Badge';

export default function CompetitivePositionBadge({ position, size = 'sm' }) {
  const status = typeof position === 'object' && position !== null ? position.status : position;
  const label = typeof position === 'object' && position !== null ? position.label : position;

  let variant = 'neutral';
  let displayLabel = label || 'At Market';

  switch (status) {
    case 'below_market':
      variant = 'info';
      displayLabel = 'Below Market';
      break;
    case 'above_market':
      variant = 'warning';
      displayLabel = 'Above Market';
      break;
    case 'at_market':
      variant = 'neutral';
      displayLabel = 'At Market';
      break;
    default:
      variant = 'neutral';
      displayLabel = label || 'Unknown';
      break;
  }

  return (
    <Badge variant={variant} size={size} dot>
      {displayLabel}
    </Badge>
  );
}
