import { formatCurrency } from '../../../utils/formatCurrency';

/**
 * Cleanly format product price
 */
export function formatProductPrice(amount, currency = 'INR') {
  return formatCurrency(amount, currency);
}

/**
 * Derive status badge props from product is_active property
 */
export function getProductStatus(product) {
  if (!product) return { label: 'Inactive', variant: 'neutral', isActive: false };
  const isActive = product.is_active === true;
  return {
    label: isActive ? 'Active' : 'Inactive',
    variant: isActive ? 'success' : 'neutral',
    isActive,
  };
}

/**
 * Filter products in-memory by search term, category, and active status
 */
export function filterProducts(products, { search = '', categoryId = 'all', status = 'all' } = {}) {
  if (!Array.isArray(products)) return [];

  const query = search.trim().toLowerCase();

  return products.filter((product) => {
    // Status Filter
    if (status === 'active' && !product.is_active) return false;
    if (status === 'inactive' && product.is_active) return false;

    // Category Filter
    if (categoryId && categoryId !== 'all') {
      const prodCatId = String(product.category_id || product.category?.id || '');
      if (prodCatId !== String(categoryId)) return false;
    }

    // Search Filter (Product Name, SKU, Brand)
    if (query) {
      const name = (product.name || '').toLowerCase();
      const sku = (product.sku || '').toLowerCase();
      const brand = (product.brand || '').toLowerCase();
      const matches = name.includes(query) || sku.includes(query) || brand.includes(query);
      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Sort products by various criteria
 */
export function sortProducts(products, sortBy = 'created_desc') {
  if (!Array.isArray(products)) return [];
  const sorted = [...products];

  switch (sortBy) {
    case 'name_asc':
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'name_desc':
      return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    case 'price_asc':
      return sorted.sort((a, b) => (Number(a.base_price) || 0) - (Number(b.base_price) || 0));
    case 'price_desc':
      return sorted.sort((a, b) => (Number(b.base_price) || 0) - (Number(a.base_price) || 0));
    case 'sku_asc':
      return sorted.sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));
    case 'created_asc':
      return sorted.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    case 'created_desc':
    default:
      return sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }
}

/**
 * Validate product payload
 */
export function validateProductPayload(payload) {
  const errors = {};

  if (!payload.name || !payload.name.trim()) {
    errors.name = 'Product name is required.';
  }

  if (!payload.sku || !payload.sku.trim()) {
    errors.sku = 'SKU is required.';
  }

  if (payload.base_price !== undefined && payload.base_price !== null && payload.base_price !== '') {
    if (isNaN(Number(payload.base_price)) || Number(payload.base_price) < 0) {
      errors.base_price = 'Base price must be a non-negative number.';
    }
  }

  if (payload.cost_price !== undefined && payload.cost_price !== null && payload.cost_price !== '') {
    if (isNaN(Number(payload.cost_price)) || Number(payload.cost_price) < 0) {
      errors.cost_price = 'Cost price must be a non-negative number.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
