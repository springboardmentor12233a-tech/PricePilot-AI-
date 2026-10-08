"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import ChartCaption from "@/components/ChartCaption";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useCountUp } from "@/lib/hooks/useCountUp";
import {
  DollarSign,
  TrendingUp,
  Package,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Download,
  Calendar,
  Layers,
  FileText,
  Activity,
  X,
  Check,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

function StockCountCell({ stock, status }: { stock: number; status: string }) {
  const animStock = useCountUp(stock, 350, 0);
  const stockBadge =
    status === "Critical"
      ? "text-red-400 bg-red-500/10 border-red-500/30"
      : status === "Low Stock"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-slate-300 bg-slate-800/80 border-slate-700";

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stockBadge} font-mono font-medium transition-colors`}>
      {animStock} u
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Data states
  const [days, setDays] = useState<number>(30);
  const [kpis, setKpis] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Table filters & expanded rows
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});
  const [productInsights, setProductInsights] = useState<Record<string, any>>({});
  const [loadingInsights, setLoadingInsights] = useState<Record<string, boolean>>({});

  // Report download status
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  // Admin Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // New product form
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "Smartphones",
    current_price: 199.99,
    cost_price: 120.0,
    comp_1: 209.99,
    comp_2: 195.0,
    comp_3: 215.0,
    stock_level: 100,
  });

  // Toast state for sale simulations
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const baselineRev = kpis?.baseline_revenue ?? kpis?.total_monthly_revenue ?? 0;
  const projectedRev = kpis?.projected_revenue ?? ((kpis?.total_monthly_revenue || 0) + (kpis?.potential_revenue_lift || 0));
  const upliftDollars = kpis?.revenue_uplift_dollars ?? kpis?.potential_revenue_lift ?? 0;
  const upliftPct = kpis?.revenue_uplift_pct ?? (baselineRev > 0 ? (upliftDollars / baselineRev) * 100 : 0);

  // Count-up animations for key metrics
  const animBaseline = useCountUp(baselineRev, 600, 0);
  const animOptimized = useCountUp(projectedRev, 600, 0);
  const animUplift = useCountUp(upliftDollars, 600, 0);
  const animSkus = useCountUp(kpis?.total_products || products.length, 500, 0);

  const handleRecordSale = async (p: any) => {
    try {
      const updated = await api.products.recordSale(p.id, 1);
      // Update product list locally
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, ...updated } : item))
      );
      // Update KPIs locally
      setKpis((prev: any) => {
        if (!prev) return prev;
        const bRev = (prev.baseline_revenue || prev.total_monthly_revenue || 0) + (p.current_price || 0);
        const pRev = prev.projected_revenue || bRev;
        const uDol = Math.max(0, pRev - bRev);
        return {
          ...prev,
          baseline_revenue: bRev,
          total_monthly_revenue: bRev,
          total_units_sold: (prev.total_units_sold || 0) + 1,
          revenue_uplift_dollars: uDol,
          revenue_uplift_pct: bRev > 0 ? (uDol / bRev) * 100 : 0,
        };
      });
      // Show immediate toast
      setToastMessage(`Sale recorded — ${p.name} stock: ${updated.stock_level}`);
      setTimeout(() => {
        setToastMessage((cur) => (cur?.includes(p.name) ? null : cur));
      }, 3500);
    } catch (err: any) {
      console.error("Record sale error:", err);
      alert("Failed to record sale: " + (err.response?.data?.detail || err.message));
    }
  };

  const fetchData = async (selectedDays: number = days) => {
    setLoading(true);
    setBackendError(null);
    try {
      const [kpiRes, prodRes, histRes] = await Promise.all([
        api.pricing.getKPI(selectedDays),
        api.products.list({ days: selectedDays }),
        api.pricing.getHistory(selectedDays),
      ]);
      setKpis(kpiRes);
      setProducts(prodRes);
      setRevenueHistory(histRes);
    } catch (err: any) {
      console.error("Dashboard data load error:", err);
      setBackendError("Could not reach backend API at http://localhost:8000. Is uvicorn running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
  }, [days]);

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
  };

  const handleDownloadReport = async (format: "pdf" | "csv" | "excel") => {
    setDownloadingReport(format);
    try {
      const blob = await api.reports.downloadSummary(format);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      const ext = format === "excel" ? "xlsx" : format;
      link.setAttribute("download", `PricePilot_BI_Executive_Report_${days}d.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download report:", err);
      alert("Failed to download report. Please check if backend is online.");
    } finally {
      setDownloadingReport(null);
    }
  };

  const toggleExpand = async (productId: string) => {
    const isNowExpanded = !expandedProductIds[productId];
    setExpandedProductIds((prev) => ({ ...prev, [productId]: isNowExpanded }));

    if (isNowExpanded && !productInsights[productId]) {
      setLoadingInsights((prev) => ({ ...prev, [productId]: true }));
      try {
        const ins = await api.insight.getProduct(productId);
        setProductInsights((prev) => ({ ...prev, [productId]: ins }));
      } catch (e) {
        console.error("Failed to load structured insight for", productId, e);
      } finally {
        setLoadingInsights((prev) => ({ ...prev, [productId]: false }));
      }
    }
  };

  // Admin Actions
  const handleOpenAdd = () => {
    const nextNum = products.length + 1;
    const generatedId = `prod_${String(nextNum).padStart(3, "0")}`;
    setFormData({
      id: generatedId,
      name: "",
      category: "Smartphones",
      current_price: 299.99,
      cost_price: 180.0,
      comp_1: 309.99,
      comp_2: 295.0,
      comp_3: 315.0,
      stock_level: 150,
    });
    setProductFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setFormData({
      id: p.id,
      name: p.name,
      category: p.category,
      current_price: p.current_price,
      cost_price: p.cost_price || Math.round(p.current_price * 0.65),
      comp_1: p.comp_1 || p.competitor_price || p.current_price,
      comp_2: p.comp_2 || p.current_price,
      comp_3: p.comp_3 || p.current_price,
      stock_level: p.stock_level,
    });
    setProductFormError(null);
    setIsEditModalOpen(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError(null);
    if (!formData.name.trim()) {
      setProductFormError("Product name is required.");
      return;
    }
    if (formData.current_price <= 0) {
      setProductFormError("Current price must be greater than zero.");
      return;
    }

    setSubmittingProduct(true);
    try {
      await api.products.create({
        id: formData.id.trim(),
        name: formData.name.trim(),
        category: formData.category,
        current_price: Number(formData.current_price),
        cost_price: Number(formData.cost_price),
        comp_1: Number(formData.comp_1),
        comp_2: Number(formData.comp_2),
        comp_3: Number(formData.comp_3),
        stock_level: Number(formData.stock_level),
      });
      setIsAddModalOpen(false);
      await fetchData(days);
    } catch (err: any) {
      console.error("Create product failed:", err);
      setProductFormError(err.response?.data?.detail || "Failed to create product.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError(null);
    if (formData.current_price <= 0) {
      setProductFormError("Price must be greater than zero.");
      return;
    }

    setSubmittingProduct(true);
    try {
      await api.products.update(editingProduct.id, {
        name: formData.name.trim(),
        category: formData.category,
        current_price: Number(formData.current_price),
        cost_price: Number(formData.cost_price),
        comp_1: Number(formData.comp_1),
        comp_2: Number(formData.comp_2),
        comp_3: Number(formData.comp_3),
        stock_level: Number(formData.stock_level),
      });
      setIsEditModalOpen(false);
      await fetchData(days);
    } catch (err: any) {
      console.error("Update product failed:", err);
      setProductFormError(err.response?.data?.detail || "Failed to update product.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}" (${productId})? This will be recorded in the audit log.`)) {
      return;
    }
    try {
      await api.products.delete(productId);
      await fetchData(days);
    } catch (err: any) {
      console.error("Delete product failed:", err);
      alert(err.response?.data?.detail || "Failed to delete product.");
    }
  };

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <Navbar />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Enhanced Hero Header Banner with Dynamic Theme Accent Background */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-teal-500/25 bg-gradient-to-br from-teal-500/10 via-slate-900/70 to-navy-950 shadow-xl backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-[10px] uppercase px-2.5 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Enterprise Suite v0.3
                    </span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-xs text-slate-400 font-mono">Dataset 1 Econometrics</span>
                  </div>
                  <h1 className="font-serif font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
                    Portfolio Revenue Intelligence
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                    Empirically grounded pricing decisions powered by OLS fixed-effects elasticity & real-time revenue optimization
                  </p>
                </div>

                {/* Controls: Date-Range Filter & BI Report Export */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Active Date-Range Filter */}
                  <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 text-xs shadow-inner">
                    <span className="text-[10px] text-slate-400 font-mono px-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-teal-400" />
                      PERIOD:
                    </span>
                    {[7, 30, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => handleDaysChange(d)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                          days === d
                            ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/30 scale-105"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>

                  {/* BI Report Export Dropdown / Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 text-xs shadow-inner">
                    <span className="text-[10px] text-slate-400 font-mono px-1.5 flex items-center gap-1">
                      <Download className="w-3 h-3 text-amber-400" />
                      EXPORT:
                    </span>
                    <button
                      onClick={() => handleDownloadReport("pdf")}
                      disabled={downloadingReport !== null}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] transition-all hover:scale-105 disabled:opacity-50"
                      title="Download Executive PDF Report"
                    >
                      {downloadingReport === "pdf" ? "PDF..." : "PDF"}
                    </button>
                    <button
                      onClick={() => handleDownloadReport("csv")}
                      disabled={downloadingReport !== null}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] transition-all hover:scale-105 disabled:opacity-50"
                      title="Download Product CSV Report"
                    >
                      {downloadingReport === "csv" ? "CSV..." : "CSV"}
                    </button>
                    <button
                      onClick={() => handleDownloadReport("excel")}
                      disabled={downloadingReport !== null}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] transition-all hover:scale-105 disabled:opacity-50"
                      title="Download Product Excel Spreadsheet"
                    >
                      {downloadingReport === "excel" ? "XLSX..." : "Excel"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Banner if Backend Unreachable */}
            {backendError && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 flex items-center justify-between text-red-300 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>{backendError}</span>
                </div>
                <button
                  onClick={() => fetchData(days)}
                  className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 font-semibold"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* Top Metric Cards with Animated Count-Up & Hover Scales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Revenue Baseline */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden group hover:border-slate-700 hover:scale-[1.02] transition-all duration-200 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                    Baseline Revenue ({days}d)
                  </span>
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {loading ? "--" : `$${animBaseline}`}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Current catalog pricing yield</span>
                </div>
              </div>

              {/* Card 2: Optimized Projected Revenue */}
              <div className="glass-card rounded-2xl p-5 border border-teal-500/30 bg-teal-950/15 relative overflow-hidden group hover:border-teal-500/50 hover:scale-[1.02] transition-all duration-200 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-teal-300 font-mono uppercase tracking-wider">
                    Optimized Projected
                  </span>
                  <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-teal-300 font-mono">
                  {loading ? "--" : `$${animOptimized}`}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-400 font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{upliftPct.toFixed(1)}% Projected Uplift</span>
                </div>
              </div>

              {/* Card 3: Potential Additional Margin */}
              <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-amber-950/15 relative overflow-hidden group hover:border-amber-500/50 hover:scale-[1.02] transition-all duration-200 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-amber-300 font-mono uppercase tracking-wider">
                    Revenue Lift Delta
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                  {loading ? "--" : `+$${animUplift}`}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                  <span>Elasticity gap capture potential</span>
                </div>
              </div>

              {/* Card 4: Catalog Size & Active SKUs */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden group hover:border-slate-700 hover:scale-[1.02] transition-all duration-200 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                    Managed SKUs
                  </span>
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:scale-110 transition-transform">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {loading ? "--" : `${animSkus} SKUs`}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-teal-400 font-mono font-semibold">{kpis?.mispriced_products || 0} mispriced</span>
                  <span>({days}d window)</span>
                </div>
              </div>
            </div>

            {/* Dynamic Revenue Timeline Area Chart */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    Portfolio Revenue Simulation ({days}-Day Horizon)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Baseline daily revenue vs. simulated revenue under OLS recommended prices
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-slate-400 inline-block"></span>
                    <span className="text-slate-400">Baseline Yield</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-teal-400 inline-block"></span>
                    <span className="text-teal-400 font-bold">Optimized Yield</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        fontSize: "0.75rem",
                        color: "#F8FAFC",
                      }}
                      formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                    />
                    <Area
                      type="monotone"
                      dataKey="baseline_revenue"
                      name="Baseline"
                      stroke="#94A3B8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorBaseline)"
                    />
                    <Area
                      type="monotone"
                      dataKey="optimized_revenue"
                      name="Optimized"
                      stroke="#14B8A6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorOptimized)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <ChartCaption
                text={`This simulation timeline compares baseline daily revenue yields against projected revenues under OLS recommended prices across your portfolio for the selected ${days}-day window.`}
                metricHighlight={`Simulated Lift: +${upliftPct.toFixed(1)}% (+$${upliftDollars.toLocaleString()})`}
                className="mt-4"
              />
            </div>

            {/* Product Pricing Portfolio Table */}
            <div id="catalog" className="glass-card rounded-2xl p-5 border border-slate-800 scroll-mt-20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif font-bold text-base text-white">
                      Electronics Catalog Pricing & Recommendations
                    </h3>
                    {isAdmin && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        Admin CRUD Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Click any SKU row to expand AI economic reasoning. {isAdmin ? "Manage SKUs and pricing via action buttons." : "Read-only access for Business Analyst."}
                  </p>
                </div>

                {/* Filter, Search, and Add SKU Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search SKU name..."
                      className="bg-slate-900 border border-slate-800 focus:border-teal-500/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none w-44"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCategory(c)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                          selectedCategory === c
                            ? "bg-teal-500 text-navy-950 font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  {/* Add Product Button (Admin Only) */}
                  {isAdmin && (
                    <button
                      onClick={handleOpenAdd}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Product Name & Category</th>
                      <th className="py-3 px-2 text-right">Current</th>
                      <th className="py-3 px-2 text-right">Rec. Price</th>
                      <th className="py-3 px-2 text-center">Price Gap</th>
                      <th className="py-3 px-2 text-right">Competitor</th>
                      <th className="py-3 px-2 text-right">Units</th>
                      <th className="py-3 px-2 text-center">Stock</th>
                      <th className="py-3 px-2 text-center">Demand</th>
                      <th className="py-3 px-2 text-center">Confidence</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredProducts.map((p) => {
                      const isExpanded = !!expandedProductIds[p.id];
                      const insight = productInsights[p.id];
                      const isInsLoading = !!loadingInsights[p.id];

                      const gapClass =
                        p.price_gap_pct < -5
                          ? "text-red-400 bg-red-500/10 border-red-500/30"
                          : p.price_gap_pct > 2
                          ? "text-teal-400 bg-teal-500/10 border-teal-500/30"
                          : "text-slate-300 bg-slate-800 border-slate-700";

                      return (
                        <React.Fragment key={p.id}>
                          <tr
                            onClick={() => toggleExpand(p.id)}
                            className="hover:bg-slate-900/50 cursor-pointer transition-colors group"
                          >
                            <td className="py-3 px-3">
                              <div className="font-semibold text-white group-hover:text-teal-300 transition-colors">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono">{p.id}</span>
                                <span>&bull;</span>
                                <span>{p.category}</span>
                              </div>
                            </td>

                            <td className="py-3 px-2 text-right font-mono font-medium text-slate-200">
                              ${p.current_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>

                            <td className="py-3 px-2 text-right font-mono font-bold text-teal-400">
                              ${p.recommended_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>

                            <td className="py-3 px-2 text-center">
                              <span className={`inline-block font-mono text-[10px] px-2 py-0.5 rounded-full border ${gapClass}`}>
                                {p.price_gap_pct > 0 ? "+" : ""}
                                {p.price_gap_pct.toFixed(1)}%
                              </span>
                            </td>

                            <td className="py-3 px-2 text-right font-mono text-slate-400">
                              ${p.competitor_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>

                            <td className="py-3 px-2 text-right font-mono text-slate-300">
                              {p.units_sold.toLocaleString()}
                            </td>

                            <td className="py-3 px-2 text-center">
                              <StockCountCell stock={p.stock_level} status={p.stock_status} />
                            </td>

                            <td className="py-3 px-2 text-center">
                              <span
                                className={`text-[10px] font-medium ${
                                  p.demand_trend === "Increasing"
                                    ? "text-teal-400"
                                    : p.demand_trend === "Decreasing"
                                    ? "text-amber-400"
                                    : "text-slate-400"
                                }`}
                              >
                                {p.demand_trend}
                              </span>
                            </td>

                            <td className="py-3 px-2 text-center">
                              <span
                                className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                                  p.confidence_score < 22.0
                                    ? "bg-red-500/20 text-red-300 border-red-500/40 font-bold"
                                    : "bg-slate-800 text-teal-300 border-slate-700"
                                }`}
                              >
                                {p.confidence_score.toFixed(1)}%
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleRecordSale(p)}
                                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                                  title="Record Sale (Simulate Purchase)"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                </button>
                                {isAdmin && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(p)}
                                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
                                      title="Edit Product (Admin)"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProduct(p.id, p.name)}
                                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                                      title="Delete Product (Admin)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(p.id)}
                                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-teal-400 transition-colors"
                                  title="Toggle AI Insight"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Structured AI Recommendation Row */}
                          {isExpanded && (
                            <tr className="bg-slate-900/70 border-b border-slate-800">
                              <td colSpan={10} className="p-4 sm:p-5">
                                <div className="rounded-xl border border-slate-800 bg-navy-950/80 p-4 space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-teal-400" />
                                      <span className="font-serif font-bold text-white text-xs">
                                        PricePilot AI Structured Recommendation
                                      </span>
                                      {insight?.recommendation && (
                                        <span
                                          className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                                            insight.recommendation.urgency === "high"
                                              ? "bg-red-500/20 text-red-300 border-red-500/40"
                                              : insight.recommendation.urgency === "medium"
                                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                              : "bg-teal-500/20 text-teal-300 border-teal-500/40"
                                          }`}
                                        >
                                          {insight.recommendation.urgency} Urgency
                                        </span>
                                      )}
                                    </div>

                                    {/* Action Buttons: Navigate to Sweep & Forecast */}
                                    <div className="flex items-center gap-2">
                                      <Link
                                        href={`/pricing?product=${p.id}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-medium transition-colors"
                                      >
                                        <span>Interactive Sweep</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </Link>
                                      <Link
                                        href={`/forecast?product=${p.id}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                                      >
                                        <span>Demand Forecast</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </Link>
                                    </div>
                                  </div>

                                  {isInsLoading ? (
                                    <div className="py-2 text-xs text-slate-400 flex items-center gap-2">
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                                      <span>Generating structured econometric recommendation...</span>
                                    </div>
                                  ) : (
                                    <div className="space-y-2 text-xs">
                                      <div className="flex items-baseline gap-2">
                                        <span className="font-mono text-[10px] uppercase text-slate-400 tracking-wider">
                                          Suggested Action:
                                        </span>
                                        <span className="font-bold text-amber-300 uppercase tracking-wide">
                                          {insight?.recommendation?.action || "Review Pricing"}
                                        </span>
                                      </div>

                                      <p className="text-slate-300 leading-relaxed">
                                        {insight?.recommendation?.reasoning || p.llm_summary}
                                      </p>

                                      {insight?.recommendation?.expected_impact && (
                                        <div className="p-2.5 rounded-lg bg-teal-500/5 border border-teal-500/20 text-teal-200 text-xs">
                                          <span className="font-semibold text-teal-400">Expected Impact: </span>
                                          {insight.recommendation.expected_impact}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Econometric Model Governance & Portfolio Health (Replaces Fake Segments) */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    Econometric Portfolio Health & Elasticity Baseline
                  </h3>
                  <p className="text-xs text-slate-400">
                    OLS Fixed-Effects regression: <code className="font-mono text-teal-300">qty ~ price_gap_pct + C(product_id)</code>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/eda"
                    className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-mono"
                  >
                    <span>View Exploratory Visualizations</span>
                    <span>&rarr;</span>
                  </Link>
                  <Link
                    href="/governance"
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
                  >
                    <span>Model Specs</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Elasticity Coefficient</span>
                  <div className="font-mono text-lg font-bold text-teal-300">-71.673</div>
                  <p className="text-[11px] text-slate-400">
                    A +1% price gap reduction yields +71.67 units predicted demand.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Model Goodness-of-Fit</span>
                  <div className="font-mono text-lg font-bold text-white">R² = 0.328</div>
                  <p className="text-[11px] text-slate-400">
                    Validated on 54,000+ electronic sales records (p = 0.0001).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Category Coverage</span>
                  <div className="font-mono text-lg font-bold text-amber-300">{categories.length - 1} Categories</div>
                  <p className="text-[11px] text-slate-400">
                    Smartphones, Audio, Accessories, Wearables, Computing.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Live Forecast Pipeline</span>
                  <div className="font-mono text-lg font-bold text-teal-400">Active (7d / 14d / 30d)</div>
                  <p className="text-[11px] text-slate-400">
                    Deterministic linear regression fits per product snapshot.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Modal: Add New Product (Admin Only) */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-teal-500/40 bg-navy-950 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-400" />
                  Add New Product to Catalog
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {productFormError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {productFormError}
                </div>
              )}

              <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Product ID</label>
                    <input
                      type="text"
                      required
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    >
                      <option value="Smartphones">Smartphones</option>
                      <option value="Audio">Audio</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Wearables">Wearables</option>
                      <option value="Computing">Computing</option>
                      <option value="Gaming">Gaming</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. PricePilot Sonic ANC Headphones"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Current Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.current_price}
                      onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Stock Level</label>
                    <input
                      type="number"
                      required
                      value={formData.stock_level}
                      onChange={(e) => setFormData({ ...formData, stock_level: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Competitor 1 ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.comp_1}
                      onChange={(e) => setFormData({ ...formData, comp_1: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Competitor 2 ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.comp_2}
                      onChange={(e) => setFormData({ ...formData, comp_2: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Competitor 3 ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.comp_3}
                      onChange={(e) => setFormData({ ...formData, comp_3: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all disabled:opacity-50"
                  >
                    {submittingProduct ? "Saving..." : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Product (Admin Only) */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-amber-500/40 bg-navy-950 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-400" />
                  Edit Product Pricing & Details
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {productFormError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {productFormError}
                </div>
              )}

              <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Product ID</label>
                    <input
                      type="text"
                      disabled
                      value={formData.id}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    >
                      <option value="Smartphones">Smartphones</option>
                      <option value="Audio">Audio</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Wearables">Wearables</option>
                      <option value="Computing">Computing</option>
                      <option value="Gaming">Gaming</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Current Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.current_price}
                      onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Stock Level</label>
                    <input
                      type="number"
                      required
                      value={formData.stock_level}
                      onChange={(e) => setFormData({ ...formData, stock_level: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Competitor 1 ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.comp_1}
                      onChange={(e) => setFormData({ ...formData, comp_1: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Competitor 2 ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.comp_2}
                      onChange={(e) => setFormData({ ...formData, comp_2: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Competitor 3 ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.comp_3}
                      onChange={(e) => setFormData({ ...formData, comp_3: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all disabled:opacity-50"
                  >
                    {submittingProduct ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sale Simulation Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-20 z-50 flex items-center gap-2.5 bg-slate-900/95 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        <ChatWidget />
      </div>
    </AuthGuard>
  );
}
