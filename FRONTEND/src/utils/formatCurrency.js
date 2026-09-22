/**
 * PricePilot AI — Enterprise Currency Formatting Utility
 * Centralized Indian Rupee (INR / ₹) standardizer for Business Intelligence & Executive Reports.
 *
 * Rules:
 * - Always use ₹ (Indian Rupee) symbol.
 * - Standard Indian number formatting (lakhs & crores):
 *     ₹4,999
 *     ₹1,25,000
 *     ₹12,50,000
 *     ₹1,25,00,000
 * - Compact representations for high-level KPIs:
 *     ₹12.50 Lakh
 *     ₹2.35 Crore
 * - Exact values for detailed tables, audit logs, and PDF business reports.
 */

/**
 * Formats a number or numeric string to exact Indian Rupee (₹) format.
 * Examples:
 *   formatINR(4999) -> "₹4,999"
 *   formatINR(125000) -> "₹1,25,000"
 *   formatINR(1250000) -> "₹12,50,000"
 *   formatINR(12500000) -> "₹1,25,00,000"
 *   formatINR(1250.75, { decimals: 2 }) -> "₹1,250.75"
 */
export function formatINR(amount, options = {}) {
  const {
    decimals = undefined,
    showSymbol = true,
    compact = false,
  } = options;

  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
    return '—';
  }

  const num = Number(amount);

  if (compact) {
    return formatINRCompact(num, { showSymbol, decimals: decimals ?? 2 });
  }

  const fractionDigits = decimals !== undefined
    ? decimals
    : num % 1 === 0 ? 0 : 2;

  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(num);

    return showSymbol ? `₹${formatted}` : formatted;
  } catch {
    const fallback = num.toLocaleString('en-IN');
    return showSymbol ? `₹${fallback}` : fallback;
  }
}

/**
 * Formats large amounts into executive compact notation (Crore / Lakh / K)
 * Examples:
 *   23500000 -> "₹2.35 Crore"
 *   1250000 -> "₹12.50 Lakh"
 *   45000 -> "₹45.00 K"
 */
export function formatINRCompact(amount, options = {}) {
  const { showSymbol = true, decimals = 2 } = options;

  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
    return '—';
  }

  const num = Math.abs(Number(amount));
  const sign = Number(amount) < 0 ? '-' : '';
  const prefix = showSymbol ? '₹' : '';

  // 1 Crore = 10,000,000 (100 Lakhs)
  if (num >= 10000000) {
    const crores = (num / 10000000).toFixed(decimals);
    return `${sign}${prefix}${crores} Crore`;
  }

  // 1 Lakh = 100,000
  if (num >= 100000) {
    const lakhs = (num / 100000).toFixed(decimals);
    return `${sign}${prefix}${lakhs} Lakh`;
  }

  // 1 Thousand = 1,000
  if (num >= 10000) {
    const k = (num / 1000).toFixed(1);
    return `${sign}${prefix}${k}K`;
  }

  return `${sign}${prefix}${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
  }).format(num)}`;
}

/**
 * Standard Indian localized number without currency symbol
 */
export function formatNumberIN(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(Number(num))) return '—';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(num));
}

/**
 * Drop-in backwards-compatible wrapper for formatCurrency
 */
export function formatCurrency(amount, currency = 'INR', options = {}) {
  // Enforce INR standard across the entire application
  return formatINR(amount, options);
}

export default formatINR;
