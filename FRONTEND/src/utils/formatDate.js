/**
 * PricePilot AI — Date & Timestamp Formatting Utility
 * Enforces Asia/Kolkata (IST) display standard for enterprise reports and audit logs.
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats a date string or timestamp in Asia/Kolkata (IST)
 * @param {string|number|Date} dateInput
 * @param {'full'|'medium'|'short'|'time'|'date'|'iso'|'audit'} format
 */
export const formatIST = (dateInput, format = 'medium') => {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  try {
    switch (format) {
      case 'full':
        // e.g. "21 September 2026, 08:44 PM IST"
        return `${new Intl.DateTimeFormat('en-IN', {
          timeZone: IST_TIMEZONE,
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(date)} IST`;

      case 'medium':
        // e.g. "21 Sep 2026, 08:44 PM IST"
        return `${new Intl.DateTimeFormat('en-IN', {
          timeZone: IST_TIMEZONE,
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(date)} IST`;

      case 'date':
        // e.g. "21 Sep 2026"
        return new Intl.DateTimeFormat('en-IN', {
          timeZone: IST_TIMEZONE,
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(date);

      case 'time':
        // e.g. "08:44 PM IST"
        return `${new Intl.DateTimeFormat('en-IN', {
          timeZone: IST_TIMEZONE,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(date)} IST`;

      case 'short':
        // e.g. "21 Sep"
        return new Intl.DateTimeFormat('en-IN', {
          timeZone: IST_TIMEZONE,
          day: 'numeric',
          month: 'short',
        }).format(date);

      case 'audit':
        // e.g. "2026-09-21 20:44:12 IST"
        return `${new Intl.DateTimeFormat('en-IN', {
          timeZone: IST_TIMEZONE,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(date)} IST`;

      case 'iso':
        return date.toISOString();

      default:
        return `${new Intl.DateTimeFormat('en-IN', {
          timeZone: IST_TIMEZONE,
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(date)}`;
    }
  } catch {
    return date.toLocaleDateString('en-IN');
  }
};

/**
 * Standard date formatting utility (defaults to IST)
 */
export const formatDate = (dateInput, format = 'medium') => {
  return formatIST(dateInput, format);
};

/**
 * Relative time formatting (e.g. "5m ago", "2h ago")
 */
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

  return formatIST(date, 'date');
};

/**
 * Generates an authoritative document control timestamp pair
 */
export const getDocumentTimestamps = (dataTimestamp) => {
  const generatedAt = new Date();
  const dataAsOf = dataTimestamp ? new Date(dataTimestamp) : new Date(Date.now() - 2 * 60 * 1000);

  return {
    generated_at: generatedAt.toISOString(),
    data_as_of: dataAsOf.toISOString(),
    displayGeneratedAt: formatIST(generatedAt, 'full'),
    displayDataAsOf: formatIST(dataAsOf, 'full'),
    displayGeneratedTime: formatIST(generatedAt, 'time'),
  };
};

export default formatDate;
