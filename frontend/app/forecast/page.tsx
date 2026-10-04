"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import ChartCaption from "@/components/ChartCaption";
import { api } from "@/lib/api";
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { Suspense } from "react";

function ForecastContent() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("product") || "prod_001";

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [horizon, setHorizon] = useState<string>("30d");
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const prodList = await api.products.list();
        setProducts(prodList);
        if (!prodList.some((p: any) => p.id === selectedProductId) && prodList.length > 0) {
          setSelectedProductId(prodList[0].id);
        }
      } catch (e) {
        console.error("Failed to load products:", e);
      }
    };
    loadProducts();
  }, []);

  const loadForecast = async (productId: string, currentHorizon: string = horizon) => {
    setLoading(true);
    try {
      const data = await api.forecast.getProduct(productId, currentHorizon);
      setForecastData(data);
    } catch (e) {
      console.error("Failed to load product forecast:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProductId) {
      loadForecast(selectedProductId, horizon);
    }
  }, [selectedProductId, horizon]);

  // Combine historical and future forecast points into a single chronological timeline
  const combinedChartData = React.useMemo(() => {
    if (!forecastData) return [];
    const hist = (forecastData.history || []).map((h: any) => ({
      period: h.period,
      actual: h.actual_demand,
      forecast: null,
      lowerCI: null,
      upperCI: null,
      type: "Historical",
    }));

    // Connect the last historical point with the first forecast point
    const lastHist = hist[hist.length - 1];
    const fc = (forecastData.forecast || []).map((f: any, idx: number) => ({
      period: f.period,
      actual: null,
      forecast: f.forecasted_demand,
      lowerCI: f.lower_ci,
      upperCI: f.upper_ci,
      type: "Forecast",
    }));

    // If there is a bridge point
    if (lastHist) {
      return [...hist, ...fc];
    }
    return [...hist, ...fc];
  }, [forecastData]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <Navbar />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Header & Product Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
                  Demand Forecasting & Confidence
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Per-product 3-month rolling linear regression projections with empirical R² confidence intervals
                </p>
              </div>

              {/* Controls: Horizon Toggle & SKU Selection */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Horizon Toggle */}
                <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 text-xs">
                  <span className="text-[10px] text-slate-400 font-mono px-2">HORIZON:</span>
                  {(["7d", "14d", "30d"] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => setHorizon(h)}
                      className={`px-3 py-1 rounded-lg font-mono font-medium transition-colors ${
                        horizon === h
                          ? "bg-teal-500 text-slate-950 font-bold shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {h === "7d" ? "7 Days" : h === "14d" ? "14 Days" : "30 Days"}
                    </button>
                  ))}
                </div>

                {/* SKU Selection Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">SKU:</span>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-teal-500/80"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.demand_trend})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Model Confidence & Trend Badges Banner */}
            {forecastData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Confidence Score Badge Card */}
                <div
                  className={`glass-card rounded-2xl p-5 border ${
                    forecastData.confidence_score < 35
                      ? "border-red-500/40 bg-red-950/20"
                      : forecastData.confidence_score >= 80
                      ? "border-teal-500/40 bg-teal-950/20"
                      : "border-amber-500/40 bg-amber-950/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">
                      Forecast Model Reliability
                    </span>
                    <ShieldCheck
                      className={`w-5 h-5 ${
                        forecastData.confidence_score < 35
                          ? "text-red-400"
                          : forecastData.confidence_score >= 80
                          ? "text-teal-400"
                          : "text-amber-400"
                      }`}
                    />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-mono text-3xl font-black ${
                        forecastData.confidence_score < 35
                          ? "text-red-400"
                          : forecastData.confidence_score >= 80
                          ? "text-teal-300"
                          : "text-amber-300"
                      }`}
                    >
                      {forecastData.confidence_score}%
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      (R² = {forecastData.r_squared.toFixed(3)})
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-300 leading-snug">
                    {forecastData.confidence_explanation}
                  </div>
                </div>

                {/* Trend Classification Card */}
                <div className="glass-card rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">
                      Classified Demand Trend
                    </span>
                    {forecastData.demand_trend === "Increasing" ? (
                      <TrendingUp className="w-5 h-5 text-teal-400" />
                    ) : forecastData.demand_trend === "Decreasing" ? (
                      <TrendingDown className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Minus className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-2xl font-serif font-bold ${
                        forecastData.demand_trend === "Increasing"
                          ? "text-teal-400"
                          : forecastData.demand_trend === "Decreasing"
                          ? "text-amber-400"
                          : "text-slate-300"
                      }`}
                    >
                      {forecastData.demand_trend}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    Rolling Regression Slope:{" "}
                    <span className="font-mono text-white font-semibold">
                      {forecastData.slope > 0 ? "+" : ""}
                      {forecastData.slope} units/mo
                    </span>
                  </div>
                </div>

                {/* Product Metadata & Price Target */}
                <div className="glass-card rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">
                      Forecast Context
                    </span>
                    <Calendar className="w-5 h-5 text-teal-400" />
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model Architecture:</span>
                      <span className="text-slate-200 font-medium">Rolling OLS (90-day)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Base Monthly Volume:</span>
                      <span className="font-mono text-white font-semibold">
                        {selectedProduct?.units_sold.toLocaleString()} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Optimal Retail Target:</span>
                      <span className="font-mono text-teal-400 font-bold">
                        ${selectedProduct?.recommended_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Historical vs Forecast Chart */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    Historical Demand & Next 3-Month Projection
                  </h3>
                  <p className="text-xs text-slate-400">
                    Solid teal line indicates recorded unit sales (Apr–Sep 2026); dashed amber line shows rolling linear regression forecast (Oct–Dec 2026) with confidence interval
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-teal-400" />
                    <span className="text-teal-300">Historical Actuals</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-amber-400 border-b border-dashed" />
                    <span className="text-amber-300">OLS Forecast (3-Mo)</span>
                  </div>
                </div>
              </div>

              {forecastData && (
                <div className="h-80 sm:h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={combinedChartData}
                      margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey="period"
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#334155" }}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#334155" }}
                        tickFormatter={(val) => `${val} u`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#F8FAFC",
                        }}
                        formatter={(val: any, name: string) => {
                          if (val === null || val === undefined) return ["-", name];
                          return [`${Number(val).toLocaleString()} Units`, name];
                        }}
                      />
                      {/* Actual Historical Line */}
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="Historical Demand"
                        stroke="#14B8A6"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#14B8A6" }}
                        connectNulls={false}
                      />
                      {/* Forecast Line */}
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        name="Forecast Projection"
                        stroke="#F59E0B"
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: "#F59E0B" }}
                        connectNulls={false}
                      />
                      {/* Upper & Lower Confidence Interval Bound Lines */}
                      <Line
                        type="monotone"
                        dataKey="upperCI"
                        name="Upper Bound (95% CI)"
                        stroke="#64748B"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="lowerCI"
                        name="Lower Bound (95% CI)"
                        stroke="#64748B"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              <ChartCaption
                text="This chart shows recorded historical unit sales alongside rolling deterministic regression projections and 95% confidence bounds. It highlights expected demand velocity and statistical certainty for upcoming sales cycles."
                metricHighlight={`Horizon: ${horizon === "7d" ? "7 Days" : horizon === "14d" ? "14 Days" : "30 Days"} | Confidence: ${forecastData?.confidence_score || 32.8}%`}
              />

              {/* Forecast Details Table */}
              {forecastData && forecastData.forecast && (
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-serif font-bold text-white mb-2">
                    Forecast Horizon Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {forecastData.forecast.map((f: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="font-mono text-[11px] text-teal-400 font-bold mb-1">
                          {f.period}
                        </div>
                        <div className="text-sm font-bold text-white font-mono">
                          {f.forecasted_demand.toLocaleString()} units
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          95% CI: [{f.lower_ci} - {f.upper_ci}] units
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono mt-0.5">
                          Est. Revenue: ${(f.predicted_revenue / 1000).toFixed(1)}k
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        <ChatWidget />
      </div>
    </AuthGuard>
  );
}

export default function ForecastPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-950 flex items-center justify-center font-mono text-xs text-teal-400">
          INITIALIZING FORECASTING ENGINE...
        </div>
      }
    >
      <ForecastContent />
    </Suspense>
  );
}

