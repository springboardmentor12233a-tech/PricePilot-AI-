import React from 'react';
import Card from '../../../components/Card';
import RevenueTrendChart from './RevenueTrendChart';
import { DollarSign } from 'lucide-react';

export default function RevenuePerformanceCard({
  revenueChartData = [],
  currency = 'INR',
  isLoading = false,
  totalRevenue = null,
}) {
  return (
    <Card
      title="Revenue Performance"
      subtitle="Historical realized sales revenue timeline from sales ingestion analytics"
      action={
        totalRevenue !== null && (
          <div className="flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-1 rounded-lg text-xs font-semibold text-[#2563EB]">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Tracked Gross Revenue</span>
          </div>
        )
      }
    >
      <RevenueTrendChart
        data={revenueChartData}
        currency={currency}
        isLoading={isLoading}
      />
    </Card>
  );
}
