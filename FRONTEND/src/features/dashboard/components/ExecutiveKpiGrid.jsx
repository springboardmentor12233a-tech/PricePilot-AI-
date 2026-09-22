import React from 'react';
import {
  IndianRupee,
  Tag,
  Percent,
  PieChart,
  Package,
  Users2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { formatINR } from '../../../utils/formatCurrency';

export default function ExecutiveKpiGrid({
  summaryMetrics = {},
  products = [],
  competitorCoverage = null,
  recommendations = [],
  latestDemandPrediction = null,
}) {
  // Pending recommendations count
  const pendingCount = recommendations.filter(
    (r) => (r.status || '').toUpperCase() === 'PENDING'
  ).length;

  const kpis = [
    {
      id: 'kpi-revenue',
      title: 'Revenue',
      value:
        summaryMetrics?.totalRevenue !== null && summaryMetrics?.totalRevenue !== undefined
          ? formatINR(summaryMetrics.totalRevenue)
          : 'Not available',
      icon: IndianRupee,
      description: 'Total recorded catalog revenue',
    },
    {
      id: 'kpi-avg-price',
      title: 'Average Price',
      value:
        summaryMetrics?.averagePrice !== null && summaryMetrics?.averagePrice !== undefined
          ? formatINR(summaryMetrics.averagePrice)
          : 'Not available',
      icon: Tag,
      description: 'Mean catalog base price',
    },
    {
      id: 'kpi-avg-discount',
      title: 'Average Discount',
      value:
        summaryMetrics?.averageDiscount !== null && summaryMetrics?.averageDiscount !== undefined
          ? `${summaryMetrics.averageDiscount.toFixed(1)}%`
          : 'Not available',
      icon: Percent,
      description: 'Observed active catalog promotions',
    },
    {
      id: 'kpi-gross-margin',
      title: 'Gross Margin',
      value:
        summaryMetrics?.averageGrossMargin !== null && summaryMetrics?.averageGrossMargin !== undefined
          ? `${summaryMetrics.averageGrossMargin.toFixed(1)}%`
          : 'Not available',
      icon: PieChart,
      description: 'Requires cost price data',
    },
    {
      id: 'kpi-products',
      title: 'Products',
      value: Array.isArray(products) && products.length > 0 ? products.length : (Array.isArray(products) && products.length === 0 ? '0' : 'Not available'),
      icon: Package,
      description: 'Catalog items in active workspace',
    },
    {
      id: 'kpi-competitor-coverage',
      title: 'Competitor Coverage',
      value: competitorCoverage !== null ? `${competitorCoverage}%` : 'Not available',
      icon: Users2,
      description: 'Products with matched competitor prices',
    },
    {
      id: 'kpi-pending-recommendations',
      title: 'Pending Recommendations',
      value: Array.isArray(recommendations) && recommendations.length > 0 ? pendingCount : 'Not available',
      icon: Sparkles,
      description: 'Pricing proposals awaiting human review',
    },
    {
      id: 'kpi-predicted-demand',
      title: 'Predicted Demand',
      value: latestDemandPrediction !== null ? `${latestDemandPrediction} units` : 'Not available',
      icon: TrendingUp,
      description: 'Latest XGBoost demand point prediction',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isUnavailable = kpi.value === 'Not available';

        return (
          <div
            key={kpi.id}
            id={kpi.id}
            className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl p-5 shadow-xs transition-all duration-150 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  {kpi.title}
                </p>
                <p
                  className={`mt-2 text-2xl font-bold tracking-tight ${
                    isUnavailable ? 'text-[#94A3B8] text-lg font-medium' : 'text-[#0F172A]'
                  }`}
                >
                  {kpi.value}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
              <p className="text-[11px] text-[#64748B] leading-tight">
                {kpi.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
