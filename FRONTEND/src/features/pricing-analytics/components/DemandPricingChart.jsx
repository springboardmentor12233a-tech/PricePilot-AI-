import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Info } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import AnalyticsEmptyState from './AnalyticsEmptyState';

export default function DemandPricingChart({
  data = [],
  currency = 'INR',
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] animate-pulse text-xs text-[#64748B]">
        Loading sales and pricing scatter points...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AnalyticsEmptyState
        type="info"
        title="No price-to-volume observations available."
        description="Transactions linking realized unit volume with specific price points will populate this relationship graph."
      />
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const pt = payload[0].payload;
      return (
        <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl shadow-md text-xs">
          <p className="font-semibold text-[#0F172A] mb-1">{pt.productName}</p>
          <p className="text-[#2563EB] font-mono">Price: {formatCurrency(pt.price, currency)}</p>
          <p className="text-[#16A34A] font-mono mt-0.5">Units Sold: {pt.unitsSold}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="w-full h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              type="number"
              dataKey="price"
              name="Price"
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickFormatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
            />
            <YAxis
              type="number"
              dataKey="unitsSold"
              name="Units Sold"
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tick={{ fill: '#64748B', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Observations" data={data} fill="#2563EB" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-start gap-2 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11px] text-[#64748B]">
        <Info className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 mt-0.5" />
        <span>Observed relationship only; correlation does not establish causal price elasticity.</span>
      </div>
    </div>
  );
}
