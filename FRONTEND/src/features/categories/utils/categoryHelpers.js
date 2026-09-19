/**
 * PricePilot AI — Category Helper Utilities
 */

export function validateCategoryPayload(payload) {
  const errors = {};

  if (!payload.name || !payload.name.trim()) {
    errors.name = 'Category name is required.';
  } else if (payload.name.trim().length < 2) {
    errors.name = 'Category name must be at least 2 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Format category list with parent hierarchy if parent_id or nested parents exist
 */
export function formatCategoryName(category, allCategories = []) {
  if (!category) return '—';
  if (!category.parent_id) return category.name;

  const parent = allCategories.find((c) => String(c.id) === String(category.parent_id));
  if (parent) {
    return `${parent.name} / ${category.name}`;
  }
  return category.name;
}
