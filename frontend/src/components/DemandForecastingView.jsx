import React, { useState } from "react";
import {
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  BarChart2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DemandForecastingView({ products, initialProductId }) {
  const [selectedProductId, setSelectedProductId] = useState(
    initialProductId || products[0]?.product_id || "bed_bath_table_1",
  );
  const [horizon, setHorizon] = useState("30_days");

  const selectedProduct =
    products.find((p) => p.product_id === selectedProductId) || products[0];

  // Mock historical & forecasted data curve
  const forecastData = [
    { period: "W-4", historical: 120, forecast: null },
    { period: "W-3", historical: 135, forecast: null },
    { period: "W-2", historical: 128, forecast: null },
    { period: "W-1", historical: 142, forecast: null },
    { period: "Current", historical: 148, forecast: 148 },
    { period: "Day +7", historical: null, forecast: 162 },
    { period: "Day +14", historical: null, forecast: 175 },
    { period: "Day +21", historical: null, forecast: 182 },
    { period: "Day +30", historical: null, forecast: 195 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Demand Intelligence · Multi-Horizon Models</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Demand Forecasting & Seasonal Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Forecast future unit demand using historical transactions, price
            elasticity, holiday indicators, and competitor signals.
          </p>
        </div>

        {/* Product Selector */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <span className="text-slate-500 mr-2">Product:</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-transparent border-none text-slate-200 font-mono font-medium focus:outline-none"
            >
              {products.map((p) => (
                <option
                  key={p.product_id}
                  value={p.product_id}
                  className="bg-slate-900 text-slate-200"
                >
                  {p.product_id} ({p.category})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Forecast Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Demand Trend
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {selectedProduct?.demand_trend || "Increasing Demand"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            +14.2% expected growth next 30 days
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            30-Day Unit Forecast
          </span>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {selectedProduct?.qty_sold
              ? Math.round(selectedProduct.qty_sold * 1.35)
              : "1,250"}{" "}
            Units
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Recommended Inventory:{" "}
            {selectedProduct?.qty_sold
              ? Math.round(selectedProduct.qty_sold * 1.5)
              : "1,500"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Model Confidence Score
          </span>
          <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">
            {selectedProduct?.confidence || 88}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${selectedProduct?.confidence || 88}%` }}
            ></div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Algorithms
          </span>
          <div className="text-sm font-semibold text-slate-300 mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>XGBoost & Prophet Ensembled</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tuned on seasonal indicators
          </p>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Demand Trajectory & Forecast Horizon
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical units sold vs AI multi-step projected demand curve
            </p>
          </div>

          {/* Horizon Selector */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            {["7_days", "14_days", "30_days", "3_months"].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  horizon === h
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {h.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={forecastData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="period"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value) => [
                  value ? `${value} Units` : "—",
                  "Demand",
                ]}
              />
              <Area
                type="monotone"
                dataKey="historical"
                stroke="#94a3b8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHist)"
                name="Historical Units"
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#6366f1"
                strokeWidth={3}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorFore)"
                name="AI Projected Demand"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
