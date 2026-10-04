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
  TrendingUp,
  Sliders,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { Suspense } from "react";

function PricingContent() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("product") || "prod_001";

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [sweepData, setSweepData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Simulation state
  const [simPrice, setSimPrice] = useState<number>(300);
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const prodList = await api.products.list();
        setProducts(prodList);
        if (!prodList.some((p: any) => p.id === selectedProductId) && prodList.length > 0) {
          setSelectedProductId(prodList[0].id);
        }
      } catch (e) {
        console.error("Failed to load products list:", e);
      }
    };
    loadProducts();
  }, []);

  const loadSweep = async (productId: string) => {
    setLoading(true);
    try {
      const data = await api.pricing.getSweep(productId);
      setSweepData(data);
      setSimPrice(data.recommended_price);
      // Run initial simulation for the recommended price
      const sim = await api.pricing.optimize(productId, data.recommended_price);
      setSimResult(sim);
    } catch (e) {
      console.error("Failed to load price sweep:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProductId) {
      loadSweep(selectedProductId);
    }
  }, [selectedProductId]);

  const handleSimPriceChange = async (newPrice: number) => {
    setSimPrice(newPrice);
    if (!selectedProductId) return;
    setSimLoading(true);
    try {
      const res = await api.pricing.optimize(selectedProductId, newPrice);
      setSimResult(res);
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setSimLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <Navbar />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Header & Product Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
                  Price Elasticity & Revenue Sweeps
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Downlink sensitivity modeling grounded in Dataset 1 OLS coefficients (beta = -71.673)
                </p>
              </div>

              {/* SKU Selection Dropdown */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">Select SKU:</span>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-teal-500/80"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.current_price.toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Economics Snapshot Cards */}
            {selectedProduct && sweepData && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="glass-card rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Current Price</span>
                  <div className="font-mono text-lg font-bold text-white">
                    ${selectedProduct.current_price.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">Active retail catalog</span>
                </div>

                <div className="glass-card rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">AI Optimal Price</span>
                  <div className="font-mono text-lg font-bold text-teal-400">
                    ${sweepData.optimal_price.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-teal-300">Revenue maximizing</span>
                </div>

                <div className="glass-card rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Price Gap %</span>
                  <div
                    className={`font-mono text-lg font-bold ${
                      selectedProduct.price_gap_pct < 0 ? "text-red-400" : "text-teal-400"
                    }`}
                  >
                    {selectedProduct.price_gap_pct > 0 ? "+" : ""}
                    {selectedProduct.price_gap_pct.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-400">Delta vs. optimal</span>
                </div>

                <div className="glass-card rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Competitor Price</span>
                  <div className="font-mono text-lg font-bold text-slate-300">
                    ${selectedProduct.competitor_price.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">Market benchmark</span>
                </div>

                <div className="glass-card rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Cost Price Floor</span>
                  <div className="font-mono text-lg font-bold text-slate-300">
                    ${selectedProduct.cost_price.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">COGS threshold</span>
                </div>

                <div className="glass-card rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Elasticity Beta</span>
                  <div className="font-mono text-lg font-bold text-amber-400">
                    {sweepData.elasticity_coef.toFixed(1)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Dataset 1 OLS</span>
                </div>
              </div>
            )}

            {/* Interactive Dual-Axis Price Sweep Curve Chart */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    Demand & Revenue Optimization Sweep
                  </h3>
                  <p className="text-xs text-slate-400">
                    Candidate price on X-axis vs. Projected Demand (Units, Teal) and Projected Gross Revenue ($K, Amber)
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-teal-400" />
                    <span className="text-teal-300">Predicted Demand (Units)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-amber-400" />
                    <span className="text-amber-300">Projected Revenue ($K)</span>
                  </div>
                </div>
              </div>

              {sweepData && (
                <div className="h-80 sm:h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={sweepData.sweep.map((pt: any) => ({
                        ...pt,
                        revenueK: pt.predicted_revenue / 1000,
                      }))}
                      margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey="price"
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#334155" }}
                        tickFormatter={(val) => `$${val}`}
                        label={{ value: "Candidate Price ($)", position: "insideBottom", offset: -10, fill: "#64748B", fontSize: 11 }}
                      />
                      {/* Left Axis: Demand Units */}
                      <YAxis
                        yAxisId="left"
                        stroke="#14B8A6"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#14B8A6" }}
                        tickFormatter={(val) => `${val} u`}
                      />
                      {/* Right Axis: Revenue in Thousands */}
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#F59E0B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#F59E0B" }}
                        tickFormatter={(val) => `$${val.toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#F8FAFC",
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === "Projected Revenue") return [`$${(Number(value) * 1000).toLocaleString()}`, name];
                          return [`${Number(value).toLocaleString()} Units`, name];
                        }}
                        labelFormatter={(label) => `Candidate Price: $${label}`}
                      />
                      {/* Reference line for Current Price */}
                      {selectedProduct && (
                        <ReferenceLine
                          yAxisId="left"
                          x={selectedProduct.current_price}
                          stroke="#94A3B8"
                          strokeDasharray="4 4"
                          label={{ value: "Current", fill: "#94A3B8", fontSize: 10, position: "top" }}
                        />
                      )}
                      {/* Reference line for Recommended Price */}
                      <ReferenceLine
                        yAxisId="left"
                        x={sweepData.recommended_price}
                        stroke="#2DD4BF"
                        strokeDasharray="4 4"
                        label={{ value: "Optimal Peak", fill: "#2DD4BF", fontSize: 10, position: "top" }}
                      />
                      {/* Demand Curve */}
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="predicted_demand"
                        name="Predicted Demand"
                        stroke="#14B8A6"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#14B8A6" }}
                      />
                      {/* Revenue Curve */}
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenueK"
                        name="Projected Revenue"
                        stroke="#F59E0B"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#F59E0B" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              <ChartCaption
                text="This chart shows how many units you would likely sell at each candidate price, and which price generates the most total revenue based on Dataset 1 empirical elasticity."
                metricHighlight={`Peak Optimal Yield: $${sweepData?.optimal_price.toFixed(2)}`}
              />
            </div>

            {/* Interactive Hypothetical Price Simulator */}
            {selectedProduct && sweepData && (
              <div className="glass-card rounded-2xl p-5 border border-teal-500/30 glow-teal space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-white">
                      Hypothetical Price Simulator
                    </h3>
                    <p className="text-xs text-slate-400">
                      Adjust hypothetical price to instantly simulate volume reaction, revenue delta, and gross margins
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Slider Control (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-medium">Hypothetical Testing Price:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xl font-bold text-teal-400">
                          ${simPrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({((simPrice - selectedProduct.current_price) / selectedProduct.current_price * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={Math.round(selectedProduct.cost_price * 1.05)}
                      max={Math.round(selectedProduct.current_price * 1.4)}
                      step={1}
                      value={simPrice}
                      onChange={(e) => handleSimPriceChange(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                    />

                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Floor: ${Math.round(selectedProduct.cost_price * 1.05)}</span>
                      <button
                        onClick={() => handleSimPriceChange(selectedProduct.current_price)}
                        className="text-slate-400 hover:text-white underline"
                      >
                        Reset to Current (${selectedProduct.current_price})
                      </button>
                      <button
                        onClick={() => handleSimPriceChange(sweepData.optimal_price)}
                        className="text-teal-400 hover:text-teal-300 underline font-semibold"
                      >
                        Set to Optimal (${sweepData.optimal_price.toFixed(0)})
                      </button>
                      <span>Ceiling: ${Math.round(selectedProduct.current_price * 1.4)}</span>
                    </div>
                  </div>

                  {/* Simulation Output Cards (5 cols) */}
                  {simResult && (
                    <div className="lg:col-span-5 grid grid-cols-2 gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 block">
                          Predicted Demand
                        </span>
                        <div className="font-mono text-lg font-bold text-white mt-0.5">
                          {simResult.predicted_demand.toLocaleString()} units
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {simResult.predicted_demand > selectedProduct.units_sold ? "+" : ""}
                          {(
                            ((simResult.predicted_demand - selectedProduct.units_sold) /
                              selectedProduct.units_sold) *
                            100
                          ).toFixed(1)}% vs. base
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 block">
                          Projected Revenue
                        </span>
                        <div className="font-mono text-lg font-bold text-amber-300 mt-0.5">
                          ${(simResult.predicted_revenue / 1000).toFixed(1)}k
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            simResult.revenue_delta >= 0 ? "text-teal-400" : "text-red-400"
                          }`}
                        >
                          {simResult.revenue_delta >= 0 ? "+" : ""}
                          ${simResult.revenue_delta.toLocaleString()} delta
                        </span>
                      </div>

                      <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Contribution Gross Margin:</span>
                        <span className="font-mono font-bold text-teal-300">{simResult.margin_pct}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

        <ChatWidget />
      </div>
    </AuthGuard>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-950 flex items-center justify-center font-mono text-xs text-teal-400">
          INITIALIZING PRICING SWEEP ENGINE...
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}

