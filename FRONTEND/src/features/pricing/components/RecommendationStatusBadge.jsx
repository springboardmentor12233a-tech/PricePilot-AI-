import React from 'react';
import Badge from '../../../components/Badge';
import { getRecommendationStatusBadgeProps } from '../utils/pricingHelpers';

export default function RecommendationStatusBadge({ status, className = '' }) {
  const { variant, label, dot } = getRecommendationStatusBadgeProps(status);

  return (
    <Badge variant={variant} dot={dot} size="sm" className={className}>
      {label}
    </Badge>
  );
}
