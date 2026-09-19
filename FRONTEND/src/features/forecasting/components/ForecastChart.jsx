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
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { LineChart as LineChartIcon, Info, HelpCircle } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

/**
 * Custom Tooltip for Chart
 */
const CustomTooltip = ({ active, payload, label, currency = 'INR' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-lg border border-[#334155] text-xs space-y-1.5 min-w-[160px]">
        <div className="text-[11px] font-semibold text-[#94A3B8] pb-1 border-b border-[#334155]">
          {label}
        </div>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5" style={{ color: item.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}:
            </span>
            <span className="font-mono font-bold">
              {item.value !== null && item.value !== undefined ? `${Math.round(item.value).toLocaleString()} units` : '—'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * ForecastChart Component
 * Renders actual sales and model demand curves.
 * If only a point prediction is provided by the server, renders a clean point comparison
 * instead of generating fake time-series data.
 */
export default function ForecastChart({
  historicalSales = [],
  forecast = null,
  product = null,
  className = '',
}) {
  const currency = product?.currency || 'INR';

  // Check if we have multi-period forecast points
  const hasMultiPeriodForecast =
    forecast?.forecastPoints &&
    Array.isArray(forecast.forecastPoints) &&
    forecast.forecastPoints.length > 1;

  // Check if we have real historical sales data
  const hasHistoricalSales =
    historicalSales && Array.isArray(historicalSales) && historicalSales.length > 0;

  // Scenario A: Real multi-period forecast exists
  if (hasMultiPeriodForecast) {
    const chartData = [];

    // Add historical sales
    if (hasHistoricalSales) {
      historicalSales.forEach((s) => {
        chartData.push({
          date: s.date ? formatDate(s.date, 'short') : 'Past',
          historicalDemand: s.unitsSold !== null ? s.unitsSold : null,
          forecastDemand: null,
        });
      });
    }

    // Add forecast points
    forecast.forecastPoints.forEach((p, idx) => {
      chartData.push({
        date: p.date ? formatDate(p.date, 'short') : `Period ${idx + 1}`,
        historicalDemand: null,
        forecastDemand: p.demand !== undefined ? p.demand : p.value,
      });
    });

    return (
      <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Demand Forecast Trajectory
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Historical units sold compared with multi-period model forecast sequence.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB]">
            Multi-Period Time Series
          </span>
        </div>

        <div className="h-[350px] w-full pt-2">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="historicalDemand"
                name="Historical Demand"
                stroke="#64748B"
                strokeWidth={2}
                dot={{ r: 3, fill: '#64748B' }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecastDemand"
                name="Forecast Demand"
                stroke="#2563EB"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#2563EB' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Scenario B: Point prediction with or without historical sales comparison
  const predictedUnits = forecast?.predictedDemand;
  const testedPrice = forecast?.predictedPrice !== null ? forecast?.predictedPrice : product?.base_price;

  // Compute average historical units sold if historical data exists
  let avgHistoricalUnits = null;
  if (hasHistoricalSales) {
    const validSales = historicalSales.filter((s) => s.unitsSold !== null && !isNaN(s.unitsSold));
    if (validSales.length > 0) {
      const sum = validSales.reduce((acc, s) => acc + s.unitsSold, 0);
      avgHistoricalUnits = Math.round(sum / validSales.length);
    }
  }

  // Comparison bar chart data if both exist, or single point card
  const comparisonData = [];
  if (avgHistoricalUnits !== null) {
    comparisonData.push({
      category: 'Historical Average',
      units: avgHistoricalUnits,
      color: '#64748B',
      type: 'Observed Data',
    });
  }
  if (predictedUnits !== null && predictedUnits !== undefined) {
    comparisonData.push({
      category: 'Predicted Demand',
      units: Math.round(predictedUnits),
      color: '#2563EB',
      type: 'Model Prediction',
    });
  }

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A]">
            Demand Prediction Analysis
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Model inference output evaluated for price point {formatCurrency(testedPrice, currency)}.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
          Point Demand Inference
        </span>
      </div>

      {comparisonData.length > 0 ? (
        <div className="space-y-4">
          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={comparisonData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                barSize={56}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="category" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val, name, item) => [`${val.toLocaleString()} units`, item.payload.type]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    border: '1px solid #334155',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="units" radius={[8, 8, 0, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Transparent Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-[#0F172A] font-semibold">Point Prediction Display:</strong> The connected FastAPI model outputs single-point demand elasticity estimates for the supplied price context. Time-series multi-day forecast curves will automatically render above when chronological sequence endpoints are deployed.
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-2.5">
            <LineChartIcon className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-[#0F172A]">
            Awaiting Prediction or Historical Sales
          </h4>
          <p className="text-xs text-[#64748B] max-w-md mt-1">
            Run a prediction using the scenario controls above or connect historical sales transactions to inspect demand velocity.
          </p>
        </div>
      )}
    </div>
  );
}
