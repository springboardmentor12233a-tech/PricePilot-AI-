import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import formatCurrency from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import AnalyticsEmptyState from './AnalyticsEmptyState';

export default function CompetitorPositionChart({
  data = [],
  currency = 'INR',
  isLoading = false,
  productName = 'Selected Product',
}) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] animate-pulse text-xs text-[#64748B]">
        Loading competitor price benchmarks...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AnalyticsEmptyState
        type="warning"
        title="No competitor pricing data is available."
        description="Add competitors in the Competitors module or link competitor product URLs to observe relative positioning."
      />
    );
  }

  // Format dataset for Recharts Bar comparison
  const chartDataset = data.map((d) => ({
    name: d.competitorName,
    'Our Price': d.ourPrice,
    'Competitor Price': d.competitorPrice,
    diff: d.priceDifference,
    position: d.position,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl shadow-md text-xs">
          <p className="font-semibold text-[#0F172A] mb-1">{label}</p>
          <p className="text-[#2563EB] font-mono">Our Price: {formatCurrency(item['Our Price'], currency)}</p>
          <p className="text-[#D97706] font-mono">Competitor Price: {formatCurrency(item['Competitor Price'], currency)}</p>
          <div className="mt-1.5 pt-1.5 border-t border-[#F1F5F9] flex items-center justify-between gap-4">
            <span className="text-[#64748B]">Relative Position:</span>
            <span className="font-semibold text-[#0F172A]">{item.position}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[11px] text-[#64748B] mt-0.5">
            <span>Price Difference:</span>
            <span className="font-mono">
              {item.diff > 0 ? `+${formatCurrency(item.diff, currency)}` : formatCurrency(item.diff, currency)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartDataset} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="name"
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
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
            />
            <Bar dataKey="Our Price" fill="#2563EB" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Competitor Price" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Observation Table of Competitors */}
      <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0]">
            <tr>
              <th className="py-2.5 px-3">Competitor</th>
              <th className="py-2.5 px-3">Our Price</th>
              <th className="py-2.5 px-3">Competitor Price</th>
              <th className="py-2.5 px-3">Price Difference</th>
              <th className="py-2.5 px-3">Relative Position</th>
              <th className="py-2.5 px-3">Observed Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-2.5 px-3 font-medium text-[#0F172A]">{row.competitorName}</td>
                <td className="py-2.5 px-3 font-mono text-[#2563EB]">{formatCurrency(row.ourPrice, currency)}</td>
                <td className="py-2.5 px-3 font-mono text-[#D97706]">{formatCurrency(row.competitorPrice, currency)}</td>
                <td className="py-2.5 px-3 font-mono text-[#0F172A]">
                  {row.priceDifference > 0 ? `+${formatCurrency(row.priceDifference, currency)}` : formatCurrency(row.priceDifference, currency)}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      row.position === 'Below competitor'
                        ? 'bg-[#DCFCE7] text-[#16A34A]'
                        : row.position === 'Above competitor'
                        ? 'bg-[#FEF3C7] text-[#D97706]'
                        : 'bg-[#F1F5F9] text-[#475569]'
                    }`}
                  >
                    {row.position}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-[#64748B] font-mono text-[11px]">
                  {row.observedAt ? formatDate(row.observedAt) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
