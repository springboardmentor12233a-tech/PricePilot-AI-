/**
 * PricePilot AI — Date Formatting Utility
 */

export const formatDate = (dateInput, format = 'medium') => {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  switch (format) {
    case 'short':
      // e.g. "Oct 12"
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    case 'medium':
      // e.g. "Oct 12, 2026"
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    case 'full':
      // e.g. "October 12, 2026, 3:45 PM"
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    case 'time':
      return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
    case 'iso':
      return date.toISOString().split('T')[0];
    default:
      return date.toLocaleDateString();
  }
};

export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date, 'medium');
};
