import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import formatCurrency from '../../../utils/formatCurrency';
import AnalyticsEmptyState from './AnalyticsEmptyState';

export default function RevenueTrendChart({
  data = [],
  currency = 'INR',
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] animate-pulse text-xs text-[#64748B]">
        Loading sales revenue trend...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AnalyticsEmptyState
        type="database"
        title="No sales data is available for the selected period."
        description="Connect your sales channel or push transaction events to GET /api/v1/sales/analytics/{organization_id} to populate real revenue trends."
      />
    );
  }

  // If only aggregate period is available
  if (data.length === 1 && data[0].isAggregate) {
    return (
      <div className="p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-center text-center">
        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
          Aggregated Sales Revenue
        </span>
        <span className="text-3xl font-extrabold text-[#0F172A] mt-2 font-mono">
          {formatCurrency(data[0].revenue, currency)}
        </span>
        <p className="text-xs text-[#64748B] mt-2 max-w-md">
          The connected API returns an aggregated sales total rather than daily timestamps. Breakdown by day will activate when daily sales records are streamed.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl shadow-md text-xs">
          <p className="font-semibold text-[#0F172A] mb-1">{label}</p>
          <p className="text-[#2563EB] font-mono font-medium">
            Revenue: {formatCurrency(point.revenue, currency)}
          </p>
          {point.units !== null && point.units !== undefined && (
            <p className="text-[#64748B] font-mono mt-0.5">Units Sold: {point.units}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#2563EB"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            name="Revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
