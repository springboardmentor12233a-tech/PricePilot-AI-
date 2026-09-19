import React from 'react';
import { Info, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import {
  calculatePriceDifferencePercent,
  calculateRevenue,
  calculateGrossProfit,
  calculateMargin,
} from '../utils/pricingCalculations';

export default function PricingInsight({
  product,
  competitorData,
  prediction,
  recommendation,
  className = '',
}) {
  if (!product) return null;

  const currency = product.currency || 'INR';
  const currentPrice = product.base_price;
  const cost = product.cost_price;

  const compPrice = competitorData?.latestPrice || competitorData?.marketAverage;
  const diffPercent = calculatePriceDifferencePercent(currentPrice, compPrice);
  const margin = calculateMargin(currentPrice, cost);

  const insights = [];

  // Insight 1: Competitive benchmark positioning
  if (compPrice && diffPercent !== null) {
    if (diffPercent > 2) {
      insights.push({
        type: 'warning',
        text: `Catalog price is ${Math.abs(diffPercent).toFixed(1)}% above the observed competitor benchmark (${formatCurrency(compPrice, currency)}).`,
      });
    } else if (diffPercent < -2) {
      insights.push({
        type: 'info',
        text: `Catalog price is ${Math.abs(diffPercent).toFixed(1)}% below the observed competitor benchmark (${formatCurrency(compPrice, currency)}).`,
      });
    } else {
      insights.push({
        type: 'neutral',
        text: `Catalog price is aligned within 2% of the observed market benchmark (${formatCurrency(compPrice, currency)}).`,
      });
    }
  }

  // Insight 2: Gross margin
  if (margin !== null) {
    if (margin < 15) {
      insights.push({
        type: 'warning',
        text: `Current gross margin is tight at ${margin.toFixed(1)}% based on unit cost of ${formatCurrency(cost, currency)}.`,
      });
    } else {
      insights.push({
        type: 'neutral',
        text: `Current gross margin is ${margin.toFixed(1)}% over cost basis of ${formatCurrency(cost, currency)}.`,
      });
    }
  }

  // Insight 3: Prediction forecast
  if (prediction && prediction.predictedDemand !== null) {
    insights.push({
      type: 'info',
      text: `Model forecasts demand at ${Math.round(prediction.predictedDemand).toLocaleString()} units for the evaluated scenario price.`,
    });
  }

  // Insight 4: Recommendation impact
  if (recommendation && recommendation.recommendedPrice !== null) {
    const recDiff = calculatePriceDifferencePercent(recommendation.recommendedPrice, currentPrice);
    if (recDiff !== null) {
      insights.push({
        type: 'success',
        text: `AI recommendation proposes a ${recDiff > 0 ? '+' : ''}${recDiff.toFixed(1)}% adjustment to ${formatCurrency(recommendation.recommendedPrice, currency)}.`,
      });
    }
  }

  if (insights.length === 0) return null;

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-[#2563EB]" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Pricing Decision Notes
        </h3>
      </div>

      <div className="space-y-2">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className="text-xs text-[#334155] flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
            <span className="leading-relaxed">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
