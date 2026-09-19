/**
 * PricePilot AI — Competitor Helper Utilities
 */

/**
 * Filter competitors in-memory by search string and status
 */
export function filterCompetitors(competitors, { search = '', status = 'all' } = {}) {
  if (!Array.isArray(competitors)) return [];

  const query = search.trim().toLowerCase();

  return competitors.filter((comp) => {
    // Status Filter
    if (status === 'active' && !comp.is_active) return false;
    if (status === 'inactive' && comp.is_active) return false;

    // Search query on name, website, description
    if (query) {
      const name = (comp.name || '').toLowerCase();
      const website = (comp.website || '').toLowerCase();
      const desc = (comp.description || '').toLowerCase();
      const matches = name.includes(query) || website.includes(query) || desc.includes(query);
      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Validate competitor creation and update payloads
 */
export function validateCompetitorPayload(payload) {
  const errors = {};

  if (!payload.name || !payload.name.trim()) {
    errors.name = 'Competitor name is required.';
  } else if (payload.name.trim().length < 2) {
    errors.name = 'Competitor name must be at least 2 characters.';
  }

  if (payload.website && payload.website.trim()) {
    const val = payload.website.trim();
    // Soft validation for website format
    if (!val.includes('.') || val.length < 4) {
      errors.website = 'Please enter a valid website address or domain.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate product matching payload
 */
export function validateMatchPayload(payload) {
  const errors = {};

  if (!payload.product_id) {
    errors.product_id = 'Please select one of your products.';
  }

  if (!payload.competitor_id) {
    errors.competitor_id = 'Please select a competitor.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate competitor price observation payload
 */
export function validateCompetitorPricePayload(payload) {
  const errors = {};

  if (!payload.product_id) {
    errors.product_id = 'Product is required.';
  }

  if (payload.price === undefined || payload.price === null || payload.price === '') {
    errors.price = 'Price is required.';
  } else if (isNaN(Number(payload.price)) || Number(payload.price) <= 0) {
    errors.price = 'Price must be a positive number.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
