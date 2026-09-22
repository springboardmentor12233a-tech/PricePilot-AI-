/**
 * PricePilot AI — Enterprise Report Export Utilities
 * Generates formatted multi-page PDF documents and clean CSV files.
 * Adheres strictly to INR (₹) currency formatting and Asia/Kolkata timestamps.
 */
import { jsPDF } from 'jspdf';
import { formatINR, formatINRCompact, formatNumberIN } from '../../../utils/formatCurrency';
import { formatIST, getDocumentTimestamps } from '../../../utils/formatDate';
import { generateEnterprise13PagePdf } from '../services/enterprisePdfReportGenerator';

export { generateEnterprise13PagePdf };

/**
 * Clean CSV string generator
 */
export function generateCsvString(headers, rows) {
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Triggers browser download of a CSV file
 */
export function downloadCsv(filename, headers, rows) {
  const csvContent = generateCsvString(headers, rows);
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

/**
 * Downloads a Simulation Scenario Analysis CSV
 */
export function downloadSimulationCsv(product, scenarios = [], currentBaseline = {}) {
  const headers = [
    'Scenario Name',
    'Product Name',
    'SKU',
    'Price (INR)',
    'Price Variance %',
    'Predicted Demand (Units)',
    'Demand Change %',
    'Expected Revenue (INR)',
    'Revenue Change %',
    'Expected Profit (INR)',
    'Gross Margin %',
    'Competitor Benchmark Price (INR)',
    'Competitor Gap %',
    'Status / Recommendation',
    'Generated At (IST)',
  ];

  const nowIST = formatIST(new Date(), 'full');
  const baselinePrice = currentBaseline?.price || product?.base_price || 0;
  const baselineDemand = currentBaseline?.predictedDemand || 0;
  const baselineRevenue = currentBaseline?.expectedRevenue || 0;
  const baselineProfit = currentBaseline?.expectedProfit || 0;
  const compPrice = currentBaseline?.competitorPrice || 'N/A';

  const rows = [];

  // Add baseline / current row
  rows.push([
    'Current Active Baseline',
    product?.name || 'Selected Product',
    product?.sku || 'N/A',
    formatINR(baselinePrice),
    '0.0%',
    baselineDemand,
    '0.0%',
    formatINR(baselineRevenue),
    '0.0%',
    formatINR(baselineProfit),
    `${currentBaseline?.grossMargin !== null && currentBaseline?.grossMargin !== undefined ? currentBaseline.grossMargin.toFixed(1) : 0}%`,
    compPrice !== 'N/A' ? formatINR(compPrice) : 'N/A',
    compPrice !== 'N/A' && baselinePrice
      ? `${(((compPrice - baselinePrice) / baselinePrice) * 100).toFixed(1)}%`
      : 'N/A',
    'Current Active Price',
    nowIST,
  ]);

  // Add scenario rows
  scenarios.forEach((sc) => {
    const priceDiffPct = baselinePrice
      ? `${(((sc.price - baselinePrice) / baselinePrice) * 100).toFixed(1)}%`
      : '0.0%';
    const demandDiffPct = baselineDemand && sc.predictedDemand
      ? `${(((sc.predictedDemand - baselineDemand) / baselineDemand) * 100).toFixed(1)}%`
      : 'N/A';
    const revDiffPct = sc.revenueChange?.percent !== null && sc.revenueChange?.percent !== undefined
      ? `${sc.revenueChange.percent > 0 ? '+' : ''}${sc.revenueChange.percent.toFixed(1)}%`
      : 'N/A';
    const marginStr = sc.grossMargin !== null && sc.grossMargin !== undefined
      ? `${sc.grossMargin.toFixed(1)}%`
      : 'N/A';

    rows.push([
      sc.name,
      product?.name || 'Selected Product',
      product?.sku || 'N/A',
      formatINR(sc.price),
      priceDiffPct,
      sc.predictedDemand ?? 'Pending',
      demandDiffPct,
      sc.expectedRevenue ? formatINR(sc.expectedRevenue) : 'Pending',
      revDiffPct,
      sc.expectedProfit ? formatINR(sc.expectedProfit) : 'Pending',
      marginStr,
      sc.competitorPrice ? formatINR(sc.competitorPrice) : (compPrice !== 'N/A' ? formatINR(compPrice) : 'N/A'),
      sc.competitorPrice && sc.price
        ? `${(((sc.competitorPrice - sc.price) / sc.price) * 100).toFixed(1)}%`
        : 'N/A',
      sc.isRecommended ? 'Optimal Recommendation' : 'Simulated Scenario',
      sc.predictedAt ? formatIST(sc.predictedAt, 'full') : nowIST,
    ]);
  });

  const filename = `PricePilot_Simulation_${product?.sku || 'SKU'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(filename, headers, rows);
}

/**
 * Downloads Competitor Price Matrix CSV
 */
export function downloadCompetitorCsv(comparisons = [], competitors = []) {
  const headers = [
    'Product Name',
    'Product SKU',
    'Category',
    'Our Price (INR)',
    'Market Average Price (INR)',
    'Lowest Competitor Price (INR)',
    'Highest Competitor Price (INR)',
    'Price Gap (INR)',
    'Price Gap (%)',
    'Market Position',
    'Competitor Observations Count',
    'Last Observed Date (IST)',
  ];

  const rows = comparisons.map((c) => {
    const p = c.product || {};
    return [
      p.name || 'Unnamed Product',
      p.sku || 'N/A',
      p.category || 'General',
      c.ourPrice ? formatINR(c.ourPrice) : 'N/A',
      c.marketAverage ? formatINR(c.marketAverage) : 'N/A',
      c.lowestCompetitorPrice ? formatINR(c.lowestCompetitorPrice) : 'N/A',
      c.highestCompetitorPrice ? formatINR(c.highestCompetitorPrice) : 'N/A',
      c.gap !== null && c.gap !== undefined ? formatINR(c.gap) : 'N/A',
      c.gapPercentage !== null && c.gapPercentage !== undefined ? `${c.gapPercentage.toFixed(1)}%` : 'N/A',
      c.position?.label || 'Unranked',
      c.observationCount || 0,
      c.latestObservation?.date ? formatIST(c.latestObservation.date, 'full') : 'N/A',
    ];
  });

  const filename = `PricePilot_Competitor_Intelligence_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(filename, headers, rows);
}

/**
 * Generates an Enterprise Executive Business PDF Report.
 * Defaults to the complete 13-page structure if requested, or generates custom targeted briefing.
 */
export async function generateExecutivePdfReport(reportData = {}) {
  const { isComplete13Page = true } = reportData;

  // Use the 13-page enterprise generator for full executive briefings
  if (isComplete13Page) {
    return generateEnterprise13PagePdf(reportData);
  }

  // Fallback to targeted briefing
  return generateEnterprise13PagePdf(reportData);
}

/**
 * Triggers Browser Print with formatted styling
 */
export function triggerBrowserPrint() {
  window.print();
}
