import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { DollarSign, BarChart2, AlertCircle } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';

/**
 * Custom Tooltip for Revenue Chart:
 * Displays Price, Expected Revenue, and Predicted Demand
 */
const RevenueCustomTooltip = ({ active, payload, currency = 'INR' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-xl border border-[#334155] text-xs space-y-1.5 min-w-[180px]">
        <div className="font-semibold text-[#94A3B8] pb-1 border-b border-[#334155] flex items-center justify-between">
          <span>{data.scenarioName}</span>
          {data.isBaseline && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#2563EB] text-white">Baseline</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[#94A3B8]">Unit Price:</span>
          <span className="font-bold text-white">
            {formatCurrency(data.price, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#94A3B8]">Expected Revenue:</span>
          <span className="font-bold text-[#60A5FA]">
            {formatCurrency(data.expectedRevenue, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#94A3B8]">Predicted Demand:</span>
          <span className="font-bold text-white">
            {Math.round(data.predictedDemand).toLocaleString()} units
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({
  currentBaseline,
  scenarios = [],
  currency = 'INR',
}) {
  // Assemble only real calculated data points
  const chartData = useMemo(() => {
    const points = [];

    // Add baseline if evaluated
    if (currentBaseline?.price !== null && currentBaseline?.expectedRevenue !== null) {
      points.push({
        scenarioName: 'Current (Baseline)',
        price: currentBaseline.price,
        expectedRevenue: currentBaseline.expectedRevenue,
        predictedDemand: currentBaseline.predictedDemand,
        isBaseline: true,
      });
    }

    // Add evaluated candidate scenarios
    scenarios.forEach((s) => {
      if (s.expectedRevenue !== null && s.price !== null) {
        points.push({
          scenarioName: s.name,
          price: s.price,
          expectedRevenue: s.expectedRevenue,
          predictedDemand: s.predictedDemand,
          isBaseline: false,
        });
      }
    });

    // Sort by price ascending
    return points.sort((a, b) => a.price - b.price);
  }, [currentBaseline, scenarios]);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Revenue by Price Scenario</h3>
            <p className="text-[11px] text-[#64748B]">
              Projected expected revenue across evaluated unit prices
            </p>
          </div>
        </div>

        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F8FAFC] text-[#475569] font-medium border border-[#E2E8F0]">
          {chartData.length} Data Points
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#64748B] bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1]">
          <AlertCircle className="w-8 h-8 text-[#94A3B8] mb-2" />
          <p className="text-xs font-semibold text-[#0F172A]">No revenue simulation points available</p>
          <p className="text-[11px] text-[#94A3B8] max-w-xs mt-1">
            Generate demand predictions on candidate price scenarios to plot the revenue curve.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="price"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => formatCurrency(val, currency)}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `₹${Number(val).toLocaleString()}`}
              />
              <Tooltip content={<RevenueCustomTooltip currency={currency} />} />
              <Bar dataKey="expectedRevenue" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isBaseline ? '#2563EB' : '#3B82F6'}
                    opacity={entry.isBaseline ? 1 : 0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
            Baseline Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" />
            Candidate Scenarios
          </span>
        </div>
        <span>Y: Expected Revenue | X: Candidate Price</span>
      </div>
    </div>
  );
}
