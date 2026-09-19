import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import formatCurrency from '../../../utils/formatCurrency';
import AnalyticsEmptyState from './AnalyticsEmptyState';

export default function PriceHistoryChart({
  data = [],
  currency = 'INR',
  isLoading = false,
  productName = 'Selected Product',
}) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] animate-pulse text-xs text-[#64748B]">
        Loading pricing history observations...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AnalyticsEmptyState
        type="default"
        title="No pricing history is available for this product."
        description="Historical revisions, price adjustments, and approved recommendation records will appear chronologically here."
      />
    );
  }

  const hasCompetitorData = data.some((d) => d.competitorPrice !== null && d.competitorPrice !== undefined);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl shadow-md text-xs">
          <p className="font-semibold text-[#0F172A] mb-1">{label}</p>
          {item.productPrice !== null && (
            <p className="text-[#2563EB] font-mono font-medium">
              Product Price: {formatCurrency(item.productPrice, currency)}
            </p>
          )}
          {item.competitorPrice !== null && item.competitorPrice !== undefined && (
            <p className="text-[#D97706] font-mono font-medium mt-0.5">
              Competitor Benchmark: {formatCurrency(item.competitorPrice, currency)}
            </p>
          )}
          {item.source && (
            <p className="text-[#64748B] text-[10px] mt-1 italic">Source: {item.source}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            tick={{ fill: '#64748B', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickFormatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
          />
          <Line
            type="monotone"
            dataKey="productPrice"
            name="Product Price"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#2563EB' }}
            activeDot={{ r: 6 }}
          />
          {hasCompetitorData && (
            <Line
              type="monotone"
              dataKey="competitorPrice"
              name="Competitor Price"
              stroke="#D97706"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#D97706' }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
