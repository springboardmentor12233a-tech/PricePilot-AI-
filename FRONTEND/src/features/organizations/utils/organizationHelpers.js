/**
 * PricePilot AI — Organization Helper Utilities
 */

/**
 * Cleanly format ISO timestamp to human-readable date
 * e.g. "Sep 18, 2026" or "Never"
 */
export function formatOrgDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Generate a clean URL-friendly slug from organization name
 */
export function generateSlug(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Determine status label and badge variant for an organization
 * Supports boolean `is_active` or string `status`
 */
export function getOrgStatus(org) {
  if (!org) return { label: 'Inactive', variant: 'neutral', isActive: false };
  const isActive = org.is_active === true || org.status === 'active';
  return {
    label: isActive ? 'Active' : 'Inactive',
    variant: isActive ? 'success' : 'neutral',
    isActive,
  };
}

/**
 * Minimal payload validation aligned strictly with backend requirements
 */
export function validateOrgPayload(payload) {
  const errors = {};
  if (!payload.name || !payload.name.trim()) {
    errors.name = 'Organization name is required.';
  } else if (payload.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
