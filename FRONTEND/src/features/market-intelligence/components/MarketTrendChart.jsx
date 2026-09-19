import React, { useMemo } from 'react';
import Card from '../../../components/Card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../../utils/formatCurrency';
import { BarChart3 } from 'lucide-react';

export default function MarketTrendChart({ comparisons = [], height = 300 }) {
  const chartData = useMemo(() => {
    const tracked = comparisons
      .filter((c) => c.hasCompetitorData && c.ourPrice !== null && c.marketAverage !== null)
      .slice(0, 8); // Top 8 for clean visual spacing

    return tracked.map((c) => ({
      name: c.product.name.length > 14 ? `${c.product.name.slice(0, 12)}...` : c.product.name,
      fullName: c.product.name,
      'Our Price': Number(c.ourPrice),
      'Market Average': Number(c.marketAverage.toFixed(2)),
    }));
  }, [comparisons]);

  return (
    <Card
      title="Catalog vs Market Price Comparison"
      subtitle="Side-by-side pricing distribution for monitored catalog products"
    >
      {chartData.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#64748B]">
          <BarChart3 className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
          <p className="font-semibold text-[#0F172A]">Not enough price observations to display a trend</p>
          <p className="mt-0.5 text-[11px]">
            Record competitor price points across your catalog products to compare prices.
          </p>
        </div>
      ) : (
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-lg text-xs">
                        <p className="font-semibold text-[#0F172A] mb-1.5 border-b border-[#F1F5F9] pb-1">
                          {item.fullName}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-[#64748B]">
                              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                              Our Price:
                            </span>
                            <span className="font-mono font-semibold text-[#0F172A]">
                              {formatCurrency(item['Our Price'])}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-[#64748B]">
                              <span className="w-2 h-2 rounded-full bg-[#64748B]" />
                              Market Average:
                            </span>
                            <span className="font-mono font-semibold text-[#0F172A]">
                              {formatCurrency(item['Market Average'])}
                            </span>
                          </div>
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
              <Bar dataKey="Our Price" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Market Average" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
