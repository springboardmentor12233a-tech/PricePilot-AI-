import React, { useState, useEffect } from "react";
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
  Sliders,
  ShieldCheck,
  RefreshCw,
  Target,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchDemandForecast } from "../services/api";

export default function DemandForecastingView({
  products = [],
  initialProductId,
}) {
  const [selectedProductId, setSelectedProductId] = useState(
    initialProductId || products[0]?.product_id || "bed1",
  );
  const [activeHorizon, setActiveHorizon] = useState("30_days");
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customPrice, setCustomPrice] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const loadForecast = async (productId, price = null) => {
    setLoading(true);
    const res = await fetchDemandForecast(productId, price);
    if (res.data) {
      setForecast(res.data);
      setIsLive(res.isLive);
      if (price === null) {
        setCustomPrice(res.data.current_price);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedProductId) {
      loadForecast(selectedProductId, null);
    }
  }, [selectedProductId]);

  const handlePriceChange = (newP) => {
    setCustomPrice(Number(newP));
    loadForecast(selectedProductId, Number(newP));
  };

  const horizonLabels = {
    "7_days": "7 Days (Flash)",
    "14_days": "14 Days (Sprint)",
    "30_days": "30 Days (1 Month)",
    "3_months": "3 Months (Quarterly)",
    "6_months": "6 Months (Mid-Year)",
    "12_months": "12 Months (Annual)",
  };

  const currentHorizonData = forecast?.horizons?.[activeHorizon] || {
    qty: 0,
    revenue: 0,
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Demand Intelligence · Multi-Horizon Models</span>
            {isLive && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                Live Model
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Multi-Horizon Demand Forecasting & Elasticity
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Forecast future sales volume across 6 distinct time horizons with
            statistical 95% confidence bounds, price elasticity curves, and
            revenue optimization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500"
          >
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_id} ({p.category?.replace(/_/g, " ")})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-900/40 border border-slate-800 rounded-3xl">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <span className="text-xs">
            Computing multi-horizon demand inference...
          </span>
        </div>
      ) : forecast ? (
        <>
          <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            {Object.keys(horizonLabels).map((hKey) => (
              <button
                key={hKey}
                onClick={() => setActiveHorizon(hKey)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeHorizon === hKey
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {horizonLabels[hKey]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Target Projection ({horizonLabels[activeHorizon]})
              </span>
              <div className="text-2xl font-black text-white font-mono mt-2 flex items-center gap-2">
                <span>{currentHorizonData.qty}</span>
                <span className="text-xs font-normal text-slate-400">
                  units
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Projected Revenue: $
                {currentHorizonData.revenue?.toLocaleString()}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                95% Confidence Interval (30d)
              </span>
              <div className="text-xl font-bold text-cyan-400 font-mono mt-2">
                [{forecast.confidence_interval?.lower} —{" "}
                {forecast.confidence_interval?.upper}]
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Model confidence: {forecast.confidence_pct}% (
                {forecast.model_champion})
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Price Elasticity (E_d)
              </span>
              <div className="text-xl font-bold text-amber-400 font-mono mt-2 flex items-center gap-2">
                <span>{forecast.elasticity?.coefficient}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  {forecast.elasticity?.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {forecast.elasticity?.description}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Optimal Revenue Price
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
                ${forecast.elasticity?.optimal_revenue_price?.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Potential Revenue Uplift: +
                {forecast.elasticity?.potential_revenue_gain_pct}%
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  <span>
                    Actuals vs Forecasted Trajectory with 95% Confidence Band
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historical monthly unit sales followed by AI multi-horizon
                  forecasts with shaded uncertainty bounds.
                </p>
              </div>
            </div>

            <div className="h-72 w-full bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={forecast.chart_series || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorActual"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorForecast"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="period"
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                            <span className="font-bold text-white block">
                              {label}
                            </span>
                            {payload.map((entry, idx) => (
                              <div
                                key={idx}
                                style={{ color: entry.color }}
                                className="flex justify-between gap-3"
                              >
                                <span>{entry.name}:</span>
                                <span className="font-mono font-bold">
                                  {entry.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="actual_demand"
                    name="Actual Demand"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast_demand"
                    name="AI Forecast"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorForecast)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Price Elasticity & Revenue Simulation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjust target price to test demand sensitivity and identify
                  the maximum revenue curve.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Simulated Price
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  $
                  {customPrice
                    ? Number(customPrice).toFixed(2)
                    : forecast.current_price?.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min={Number(forecast.current_price * 0.7).toFixed(2)}
                max={Number(forecast.current_price * 1.3).toFixed(2)}
                step="0.5"
                value={customPrice || forecast.current_price}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-30% (${(forecast.current_price * 0.7).toFixed(2)})</span>
                <span className="text-slate-300 font-semibold">
                  Baseline: ${forecast.current_price?.toFixed(2)}
                </span>
                <span>+30% (${(forecast.current_price * 1.3).toFixed(2)})</span>
              </div>
            </div>

            <div className="h-60 w-full bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={forecast.revenue_simulation_curve || []}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="price"
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                            <span className="font-bold text-white block">
                              Price: ${label}
                            </span>
                            <div className="text-cyan-400 flex justify-between gap-3">
                              <span>Estimated Demand:</span>
                              <span className="font-mono font-bold">
                                {payload[0]?.payload?.demand} units
                              </span>
                            </div>
                            <div className="text-emerald-400 flex justify-between gap-3">
                              <span>Expected Revenue:</span>
                              <span className="font-mono font-bold">
                                ${payload[0]?.value}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expected_revenue"
                    name="Expected Revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
