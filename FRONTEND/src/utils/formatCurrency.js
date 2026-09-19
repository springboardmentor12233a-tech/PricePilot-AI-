/**
 * PricePilot AI — Currency Formatting Utility
 * Consistent currency formatting supporting INR (default) and standard locales
 */

export function formatCurrency(amount, currency = 'INR') {
  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
    return '—';
  }

  const num = Number(amount);

  try {
    // If currency is INR (or default), format as Indian Rupee
    if (currency === 'INR' || !currency) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
        minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      }).format(num);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    }).format(num);
  } catch {
    // Graceful fallback
    return `₹${num.toLocaleString('en-IN')}`;
  }
}

export default formatCurrency;
