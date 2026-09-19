import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../../utils/formatCurrency';
import { LineChart as LineChartIcon } from 'lucide-react';

export default function PriceHistoryChart({
  observations = [],
  ourPrice = null,
  currency = 'INR',
  height = 280,
}) {
  // Process and sort observations chronologically
  const { chartData, competitorKeys } = useMemo(() => {
    if (!Array.isArray(observations) || observations.length === 0) {
      return { chartData: [], competitorKeys: [] };
    }

    const validObs = observations.filter(
      (o) => o && o.price !== undefined && o.price !== null && !isNaN(Number(o.price))
    );

    if (validObs.length === 0) {
      return { chartData: [], competitorKeys: [] };
    }

    // Sort ascending by time
    const sorted = [...validObs].sort((a, b) => {
      const timeA = a.observed_at ? new Date(a.observed_at).getTime() : 0;
      const timeB = b.observed_at ? new Date(b.observed_at).getTime() : 0;
      return timeA - timeB;
    });

    const keySet = new Set();
    const dataPoints = sorted.map((obs) => {
      const compLabel = obs.competitor_name || obs.competitor?.name || 'Competitor Price';
      keySet.add(compLabel);

      const dateStr = obs.observed_at
        ? new Date(obs.observed_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
        : 'Point';

      return {
        date: dateStr,
        fullDate: obs.observed_at ? new Date(obs.observed_at).toLocaleString() : '',
        [compLabel]: Number(obs.price),
        ...(ourPrice !== null ? { 'Our Price': Number(ourPrice) } : {}),
      };
    });

    return {
      chartData: dataPoints,
      competitorKeys: Array.from(keySet),
    };
  }, [observations, ourPrice]);

  if (chartData.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center bg-[#F8FAFC]">
        <LineChartIcon className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
        <p className="text-xs font-semibold text-[#0F172A]">Not enough price observations to display a trend</p>
        <p className="text-[11px] text-[#64748B] mt-0.5 max-w-sm mx-auto">
          At least two price observations with observation timestamps are required to calculate and visualize trend movements.
        </p>
      </div>
    );
  }

  // Restrained professional color palette (blue, slate, indigo, teal)
  const lineColors = ['#2563EB', '#64748B', '#4F46E5', '#0D9488'];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-lg text-xs">
                    <p className="font-semibold text-[#0F172A] mb-1.5 border-b border-[#F1F5F9] pb-1">
                      {payload[0]?.payload?.fullDate || label}
                    </p>
                    <div className="space-y-1">
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 text-[#64748B]">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}:
                          </span>
                          <span className="font-mono font-semibold text-[#0F172A]">
                            {formatCurrency(entry.value, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
          />

          {ourPrice !== null && (
            <Line
              type="monotone"
              dataKey="Our Price"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              name="Our Price"
            />
          )}

          {competitorKeys.map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={lineColors[idx % lineColors.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: lineColors[idx % lineColors.length] }}
              activeDot={{ r: 5 }}
              name={key}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
