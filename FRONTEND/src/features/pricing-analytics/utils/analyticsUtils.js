/**
 * PricePilot AI — Pricing Analytics Utilities
 * Safe numerical computations, profit/margin calculations, and reporting helpers.
 * Handles null, undefined, NaN, Infinity, and zero denominators safely.
 */

/**
 * Safely compute average of an array of numbers
 */
export function calculateAverage(values) {
  if (!Array.isArray(values) || values.length === 0) return null;

  const validNumbers = values
    .map((v) => (v !== null && v !== undefined && v !== '' ? Number(v) : NaN))
    .filter((n) => !isNaN(n) && isFinite(n));

  if (validNumbers.length === 0) return null;

  const sum = validNumbers.reduce((acc, curr) => acc + curr, 0);
  return sum / validNumbers.length;
}

/**
 * Safely compute sum of an array of numbers
 */
export function calculateSum(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;

  return values
    .map((v) => (v !== null && v !== undefined && v !== '' ? Number(v) : 0))
    .filter((n) => !isNaN(n) && isFinite(n))
    .reduce((acc, curr) => acc + curr, 0);
}

/**
 * Safely compute percentage change: ((current - previous) / previous) * 100
 * Handles zero and invalid denominators safely.
 */
export function calculatePercentageChange(current, previous) {
  if (
    previous === null ||
    previous === undefined ||
    previous === '' ||
    current === null ||
    current === undefined ||
    current === ''
  ) {
    return null;
  }

  const prevNum = Number(previous);
  const currNum = Number(current);

  if (isNaN(prevNum) || isNaN(currNum) || !isFinite(prevNum) || !isFinite(currNum) || prevNum === 0) {
    return null;
  }

  return ((currNum - prevNum) / Math.abs(prevNum)) * 100;
}

/**
 * Calculate Gross Profit: Revenue - Cost of Goods Sold
 * Returns null if cost price or revenue is missing or invalid.
 */
export function calculateGrossProfit(revenue, costOfGoodsSold) {
  if (
    revenue === null ||
    revenue === undefined ||
    revenue === '' ||
    costOfGoodsSold === null ||
    costOfGoodsSold === undefined ||
    costOfGoodsSold === ''
  ) {
    return null;
  }

  const rev = Number(revenue);
  const cogs = Number(costOfGoodsSold);

  if (isNaN(rev) || isNaN(cogs) || !isFinite(rev) || !isFinite(cogs)) {
    return null;
  }

  return rev - cogs;
}

/**
 * Calculate Gross Margin Percentage: (Gross Profit / Revenue) * 100
 * Returns null if revenue is zero or values are invalid.
 */
export function calculateGrossMargin(grossProfit, revenue) {
  if (
    grossProfit === null ||
    grossProfit === undefined ||
    grossProfit === '' ||
    revenue === null ||
    revenue === undefined ||
    revenue === ''
  ) {
    return null;
  }

  const profit = Number(grossProfit);
  const rev = Number(revenue);

  if (isNaN(profit) || isNaN(rev) || !isFinite(profit) || !isFinite(rev) || rev === 0) {
    return null;
  }

  return (profit / rev) * 100;
}

/**
 * Calculate price difference: price1 - price2
 */
export function calculatePriceDifference(price1, price2) {
  if (
    price1 === null ||
    price1 === undefined ||
    price1 === '' ||
    price2 === null ||
    price2 === undefined ||
    price2 === ''
  ) {
    return null;
  }

  const p1 = Number(price1);
  const p2 = Number(price2);

  if (isNaN(p1) || isNaN(p2) || !isFinite(p1) || !isFinite(p2)) {
    return null;
  }

  return p1 - p2;
}

/**
 * Calculate relative price difference percentage: ((price - baselinePrice) / baselinePrice) * 100
 */
export function calculateRelativePriceDifference(price, baselinePrice) {
  return calculatePercentageChange(price, baselinePrice);
}

/**
 * Format a number with safe decimal places
 */
export function formatSafeNumber(value, decimals = 1) {
  if (value === null || value === undefined || value === '' || isNaN(Number(value)) || !isFinite(Number(value))) {
    return '—';
  }
  return Number(value).toFixed(decimals);
}

/**
 * Generate and download CSV with proper quoting and escaping
 */
export function exportToCsv(filename, headers, rows) {
  if (!Array.isArray(headers) || !Array.isArray(rows)) return;

  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map((h) => escapeCell(h.label || h)).join(',');
  const rowLines = rows.map((row) => {
    if (Array.isArray(row)) {
      return row.map(escapeCell).join(',');
    }
    return headers.map((h) => escapeCell(row[h.key])).join(',');
  });

  const csvContent = [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
