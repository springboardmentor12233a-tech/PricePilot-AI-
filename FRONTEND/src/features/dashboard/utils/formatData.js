/**
 * PricePilot AI — Dashboard Data Formatting Utilities
 */

import { formatCurrency, formatPercentage } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export const formatMetricValue = (value, type = 'number') => {
  if (value === null || value === undefined) return '—';

  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value, { showSign: true });
    case 'compact-currency':
      return formatCurrency(value, 'USD', { compact: true });
    default:
      return Number(value).toLocaleString();
  }
};

export const sanitizeDashboardSummary = (summary) => {
  if (!summary) return null;
  return {
    totalRevenue: summary.total_revenue ?? null,
    averageMargin: summary.average_margin ?? null,
    trackedProducts: summary.tracked_products ?? null,
    competitorMatches: summary.competitor_matches ?? null,
    pendingRecommendations: summary.pending_recommendations ?? null,
    lastUpdated: summary.last_updated ? formatDate(summary.last_updated, 'medium') : null,
  };
};
