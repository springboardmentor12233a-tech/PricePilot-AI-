import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import formatCurrency from '../../../utils/formatCurrency';
import { TrendingUp } from 'lucide-react';

export default function PricingHistoryChart({
  history = [],
  currency = 'INR',
  className = '',
}) {
  const chartData = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) return [];

    // Sort ascending by date
    const sorted = [...history].sort((a, b) => {
      const dateA = new Date(a.effective_date || a.created_at || a.timestamp || a.date || 0).getTime();
      const dateB = new Date(b.effective_date || b.created_at || b.timestamp || b.date || 0).getTime();
      return dateA - dateB;
    });

    return sorted.map((item, idx) => {
      const d = item.effective_date || item.created_at || item.timestamp || item.date;
      let label = `Pt ${idx + 1}`;
      if (d) {
        try {
          label = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
          label = String(d);
        }
      }

      const price = item.price !== undefined
        ? Number(item.price)
        : (item.new_price !== undefined ? Number(item.new_price) : Number(item.old_price));

      return {
        dateLabel: label,
        price: !isNaN(price) ? price : 0,
        fullDate: d,
        source: item.source || (item.recommendation_id ? 'Recommendation' : 'Direct Catalog'),
      };
    });
  }, [history]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center shadow-xs ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] flex items-center justify-center mx-auto mb-2">
          <TrendingUp className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-[#0F172A]">Historical Trend Not Available</p>
        <p className="text-[11px] text-[#64748B] mt-0.5">
          Pricing history points will appear here as catalog updates occur.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Price Trajectory Over Time
          </h3>
          <p className="text-[11px] text-[#94A3B8]">
            Historical price levels recorded for this product
          </p>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
              tickFormatter={(val) => (currency === 'INR' ? `₹${val}` : `$${val}`)}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-xl shadow-md text-xs">
                      <div className="text-[11px] text-[#64748B] mb-0.5">{data.dateLabel}</div>
                      <div className="font-bold text-[#0F172A]">
                        {formatCurrency(data.price, currency)}
                      </div>
                      <div className="text-[10px] text-[#2563EB] mt-0.5">
                        Source: {data.source}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#1D4ED8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
