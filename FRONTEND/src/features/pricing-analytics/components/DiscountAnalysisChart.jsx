import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import formatCurrency from '../../../utils/formatCurrency';
import AnalyticsEmptyState from './AnalyticsEmptyState';

export default function DiscountAnalysisChart({
  data = [],
  currency = 'INR',
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] animate-pulse text-xs text-[#64748B]">
        Loading discount analysis...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AnalyticsEmptyState
        type="default"
        title="Discount data is not available."
        description="Configure percentage or fixed promotional discounts on catalog products to view bracket distribution."
      />
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl shadow-md text-xs">
          <p className="font-semibold text-[#0F172A] mb-1">Discount Bracket: {label}</p>
          <p className="text-[#9333EA] font-mono">Products in Tier: {item.productCount}</p>
          {item.averagePrice > 0 && (
            <p className="text-[#64748B] font-mono mt-0.5">
              Average Base Price: {formatCurrency(item.averagePrice, currency)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="discountBracket"
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            tick={{ fill: '#64748B', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            tick={{ fill: '#64748B', fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="productCount"
            name="Products Count"
            fill="#9333EA"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
