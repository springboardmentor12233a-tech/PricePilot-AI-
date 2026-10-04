"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import ChartCaption from "@/components/ChartCaption";
import { api } from "@/lib/api";
import { useCountUp } from "@/lib/hooks/useCountUp";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Download,
  Search,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

function PriceComparisonContent() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("product") || "prod_001";

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load products list on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const list = await api.products.list();
        setProducts(list);
        if (!list.some((p: any) => p.id === selectedProductId) && list.length > 0) {
          setSelectedProductId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load products list:", err);
      }
    };
    fetchCatalog();
  }, []);

  // Fetch individual product details on selection change
  useEffect(() => {
    if (!selectedProductId) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const prod = await api.products.get(selectedProductId);
        setProductData(prod);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [selectedProductId]);

  // Derived price differences
  const currentPrice = productData?.current_price ?? 0;
  const recommendedPrice = productData?.recommended_price ?? 0;
  const comp1 = productData?.comp_1 ?? productData?.competitor_price ?? 0;
  const comp2 = productData?.comp_2 ?? null;
  const comp3 = productData?.comp_3 ?? null;

  const diffVsComp1 = recommendedPrice - comp1;
  const diffPctVsComp1 = comp1 > 0 ? (diffVsComp1 / comp1) * 100 : 0;

  // Animated numbers
  const animCurrent = useCountUp(currentPrice, 500, 2);
  const animRec = useCountUp(recommendedPrice, 500, 2);
  const animComp1 = useCountUp(comp1, 500, 2);

  // Chart data
  const chartData = React.useMemo(() => {
    if (!productData) return [];
    const items = [
      { name: "Current Price", price: currentPrice, type: "current" },
      { name: "Recommended", price: recommendedPrice, type: "recommended" },
      { name: "Competitor 1", price: comp1, type: "comp1" },
    ];
    if (comp2) items.push({ name: "Competitor 2", price: comp2, type: "comp2" });
    if (comp3) items.push({ name: "Competitor 3", price: comp3, type: "comp3" });
    return items;
  }, [productData, currentPrice, recommendedPrice, comp1, comp2, comp3]);

  const handleDownloadPdf = async () => {
    if (!selectedProductId) return;
    setDownloading(true);
    try {
      const blob = await api.reports.downloadPriceComparisonPdf(selectedProductId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PricePilot_Comparison_${selectedProductId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download price comparison PDF:", err);
      alert("Failed to export PDF. Please check backend connection.");
    } finally {
      setDownloading(false);
    }
  };

  const filteredDropdownProducts = products.filter((p) =>
    searchTerm === ""
      ? true
      : p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <Navbar />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Header & Product Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Pricing Intelligence
                  </span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-xs text-slate-400 font-mono">Single SKU Deep Dive</span>
                </div>
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
                  Price Comparison Dashboard
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Side-by-side pricing discrepancy analysis comparing current catalog price, AI optimal target, and rival benchmarks
                </p>
              </div>

              {/* Top Controls: SKU Selector & PDF Export */}
              <div className="flex flex-wrap items-center gap-3">
                {/* SKU Dropdown */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">SELECT SKU:</span>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {p.name} (${p.current_price.toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* PDF Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloading || loading}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-navy-950 shadow-md shadow-teal-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${downloading ? "animate-bounce" : ""}`} />
                  <span>{downloading ? "Generating PDF..." : "Download as PDF"}</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800" />
                  ))}
                </div>
                <div className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
              </div>
            ) : productData ? (
              <div className="space-y-6">
                {/* Product Snapshot Bar */}
                <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-serif font-bold text-lg text-white">{productData.name}</h2>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {productData.id}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Category: <strong>{productData.category}</strong></span>
                        <span>&bull;</span>
                        <span>Stock: <strong className="text-teal-300">{productData.stock_level} units ({productData.stock_status})</strong></span>
                        <span>&bull;</span>
                        <span>Demand: <strong className="text-amber-300">{productData.demand_trend}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">Model Reliability:</span>
                    <span className="font-mono font-bold text-teal-400 text-xs px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/30">
                      {(productData.confidence_score || 32.8).toFixed(1)}% (R² = 0.328)
                    </span>
                  </div>
                </div>

                {/* 4 Large Easy-to-Scan Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Metric 1: Current Price */}
                  <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.01] duration-200">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Current Retail Price
                    </span>
                    <div className="font-mono text-3xl font-black text-white">
                      ${animCurrent}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Active price on store catalog
                    </p>
                  </div>

                  {/* Metric 2: Recommended Price */}
                  <div className="glass-card rounded-2xl p-5 border border-teal-500/30 bg-teal-950/15 hover:border-teal-500/50 transition-all hover:scale-[1.01] duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-teal-300">
                        AI Recommended Price
                      </span>
                      <Sparkles className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="font-mono text-3xl font-black text-teal-300">
                      ${animRec}
                    </div>
                    <p className="text-[11px] text-teal-400/90 mt-2 font-medium">
                      Optimal peak margin projection
                    </p>
                  </div>

                  {/* Metric 3: Competitor Benchmark (Comp 1) */}
                  <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50 transition-all hover:scale-[1.01] duration-200">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 block mb-1">
                      Competitor 1 (Benchmark)
                    </span>
                    <div className="font-mono text-3xl font-black text-amber-300">
                      ${animComp1}
                    </div>
                    <p className="text-[11px] text-amber-400/90 mt-2">
                      Primary market rival price
                    </p>
                  </div>

                  {/* Metric 4: Recommended vs. Competitor Delta */}
                  <div
                    className={`glass-card rounded-2xl p-5 border transition-all hover:scale-[1.01] duration-200 ${
                      diffVsComp1 < 0
                        ? "border-emerald-500/40 bg-emerald-950/15 text-emerald-300"
                        : diffVsComp1 > 0
                        ? "border-rose-500/40 bg-rose-950/15 text-rose-300"
                        : "border-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="text-[11px] font-mono uppercase tracking-wider block mb-1 opacity-90">
                      Rec vs. Competitor Gap
                    </span>
                    <div className="font-mono text-3xl font-black flex items-baseline gap-1">
                      <span>{diffVsComp1 > 0 ? "+" : ""}${Math.abs(diffVsComp1).toFixed(2)}</span>
                      <span className="text-lg font-bold">
                        ({diffVsComp1 > 0 ? "+" : ""}{diffPctVsComp1.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold">
                      {diffVsComp1 < 0 ? (
                        <>
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Priced below competitor (Volume driver)</span>
                        </>
                      ) : diffVsComp1 > 0 ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Priced above competitor (Margin driver)</span>
                        </>
                      ) : (
                        <span>At competitive parity</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Competitor Cards (if Comp 2 or Comp 3 exist) */}
                {(comp2 || comp3) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {comp2 && (
                      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">Competitor 2 (Alternative)</span>
                          <span className="font-mono text-xl font-bold text-slate-200">${comp2.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-400 block">Delta vs Rec:</span>
                          <span className="font-mono text-xs font-semibold text-slate-300">
                            {recommendedPrice - comp2 > 0 ? "+" : ""}${(recommendedPrice - comp2).toFixed(2)} ({(((recommendedPrice - comp2) / comp2) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    )}
                    {comp3 && (
                      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">Competitor 3 (Alternative)</span>
                          <span className="font-mono text-xl font-bold text-slate-200">${comp3.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-400 block">Delta vs Rec:</span>
                          <span className="font-mono text-xs font-semibold text-slate-300">
                            {recommendedPrice - comp3 > 0 ? "+" : ""}${(recommendedPrice - comp3).toFixed(2)} ({(((recommendedPrice - comp3) / comp3) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Price Benchmark Comparison Chart */}
                <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-serif font-bold text-base text-white">
                        Visual Price Comparison vs. Competitor Benchmarks
                      </h3>
                      <p className="text-xs text-slate-400">
                        Side-by-side price positions for {productData.name} against market clearing alternatives
                      </p>
                    </div>
                  </div>

                  <div className="h-64 sm:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                        <XAxis
                          dataKey="name"
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
                          tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0F172A",
                            borderColor: "#334155",
                            borderRadius: "12px",
                            fontSize: "12px",
                            color: "#F8FAFC",
                          }}
                          formatter={(val: any) => [`$${Number(val).toFixed(2)}`, "Price"]}
                        />
                        <Bar dataKey="price" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, idx) => {
                            const barColor =
                              entry.type === "recommended"
                                ? "#14B8A6"
                                : entry.type === "current"
                                ? "#94A3B8"
                                : entry.type === "comp1"
                                ? "#F59E0B"
                                : "#CBD5E1";
                            return <Cell key={`cell-${idx}`} fill={barColor} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Standardized Chart Caption */}
                  <ChartCaption
                    text={`This comparison chart displays your catalog price alongside the econometric recommended price and available competitor market benchmarks for ${productData.name}. It highlights whether your target price captures incremental demand by undercutting competitors or captures margin premium by pricing above benchmark.`}
                    metricHighlight={`Rec: $${recommendedPrice.toFixed(2)} vs Comp 1: $${comp1.toFixed(2)} (${diffPctVsComp1 > 0 ? "+" : ""}${diffPctVsComp1.toFixed(1)}%)`}
                  />
                </div>
              </div>
            ) : null}
          </main>
        </div>

        <ChatWidget />
      </div>
    </AuthGuard>
  );
}

export default function PriceComparisonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-950 flex items-center justify-center font-mono text-xs text-teal-400">
          LOADING PRICE COMPARISON DASHBOARD...
        </div>
      }
    >
      <PriceComparisonContent />
    </Suspense>
  );
}
