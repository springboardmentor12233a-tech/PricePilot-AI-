"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import ChartCaption from "@/components/ChartCaption";
import { api } from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Layers,
  BarChart3,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type SortField = "name" | "current_price" | "competitor_price" | "price_gap_pct" | "category";
type SortOrder = "asc" | "desc";

export default function CompetitorPricingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortField, setSortField] = useState<SortField>("price_gap_pct");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc"); // default asc: biggest negative gap / undercutting risks first

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const list = await api.products.list();
        setProducts(list);
      } catch (err) {
        console.error("Failed to load products for competitor pricing:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  // Helper to compute market position label
  const getMarketPosition = (priceGapPct: number) => {
    if (priceGapPct < -5) {
      return { label: "Above Market", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
    } else if (priceGapPct > 5) {
      return { label: "Below Market", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    } else {
      return { label: "At Market", color: "text-teal-300 bg-teal-500/10 border-teal-500/30" };
    }
  };

  // Filter and sort products
  const processedProducts = React.useMemo(() => {
    return products
      .filter((p) => {
        const matchCat = selectedCategory === "All" || p.category === selectedCategory;
        const matchSearch =
          search === "" ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.id.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [products, search, selectedCategory, sortField, sortOrder]);

  // Grouped Bar Chart Data
  const groupedChartData = React.useMemo(() => {
    return processedProducts.slice(0, 8).map((p) => ({
      name: p.name.length > 16 ? p.name.slice(0, 16) + "..." : p.name,
      fullName: p.name,
      id: p.id,
      "Your Price": p.current_price,
      "Comp 1": p.comp_1 || p.competitor_price,
      ...(p.comp_2 ? { "Comp 2": p.comp_2 } : {}),
      ...(p.comp_3 ? { "Comp 3": p.comp_3 } : {}),
    }));
  }, [processedProducts]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <Navbar />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Market Intelligence
                  </span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-xs text-slate-400 font-mono">Full Portfolio Matrix</span>
                </div>
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
                  Competitor Pricing Dashboard
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Cross-catalog competitor intelligence matrix evaluating multi-rival price dispersion and market clearing position
                </p>
              </div>

              {/* Quick Summary Pill */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  Total Tracked SKUs: <strong className="text-white">{products.length}</strong>
                </span>
              </div>
            </div>

            {/* Grouped Bar Chart: Your Price vs. Competitor Prices */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    Portfolio Price Position vs. Competitors
                  </h3>
                  <p className="text-xs text-slate-400">
                    Grouped comparison of active retail price against primary and secondary competitor benchmarks
                  </p>
                </div>
              </div>

              <div className="h-72 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupedChartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
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
                      formatter={(val: any, name: string) => [`$${Number(val).toFixed(2)}`, name]}
                    />
                    <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
                    <Bar dataKey="Your Price" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Comp 1" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Comp 2" fill="#EAB308" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Comp 3" fill="#FB923C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ChartCaption
                text="This grouped bar chart displays your current retail pricing directly against competitor price benchmarks across your top electronics SKUs. Products with teal bars towering over amber bars indicate premium pricing vulnerability, while shorter teal bars reveal opportunities to capture margin."
              />
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search SKU name or ID..."
                    className="bg-slate-900 border border-slate-800 focus:border-teal-500/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none w-52"
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
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Click column headers to sort &bull; Showing {processedProducts.length} products
              </span>
            </div>

            {/* Competitor Pricing Table */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th
                        className="py-3 px-3 cursor-pointer hover:text-white"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Product Name</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handleSort("current_price")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Your Price</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-2 text-right">Comp 1</th>
                      <th className="py-3 px-2 text-right">Comp 2</th>
                      <th className="py-3 px-2 text-right">Comp 3</th>
                      <th
                        className="py-3 px-2 text-center cursor-pointer hover:text-white"
                        onClick={() => handleSort("price_gap_pct")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Price Gap %</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-2 text-center">Market Position</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Loading competitor pricing data...
                        </td>
                      </tr>
                    ) : processedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No matching products found.
                        </td>
                      </tr>
                    ) : (
                      processedProducts.map((p) => {
                        const pos = getMarketPosition(p.price_gap_pct);
                        const c1 = p.comp_1 || p.competitor_price;

                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-900/50 transition-colors group"
                          >
                            <td className="py-3 px-3">
                              <div className="font-semibold text-white group-hover:text-teal-300 transition-colors">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {p.id} &bull; {p.category}
                              </div>
                            </td>

                            <td className="py-3 px-2 text-right font-mono font-bold text-white">
                              ${p.current_price.toFixed(2)}
                            </td>

                            <td className="py-3 px-2 text-right font-mono text-amber-300">
                              ${c1.toFixed(2)}
                            </td>

                            <td className="py-3 px-2 text-right font-mono text-slate-400">
                              {p.comp_2 ? `$${p.comp_2.toFixed(2)}` : "--"}
                            </td>

                            <td className="py-3 px-2 text-right font-mono text-slate-400">
                              {p.comp_3 ? `$${p.comp_3.toFixed(2)}` : "--"}
                            </td>

                            <td className="py-3 px-2 text-center">
                              <span
                                className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                                  p.price_gap_pct < -5
                                    ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                                    : p.price_gap_pct > 5
                                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                                    : "text-slate-300 bg-slate-800 border-slate-700"
                                }`}
                              >
                                {p.price_gap_pct > 0 ? "+" : ""}
                                {p.price_gap_pct.toFixed(1)}%
                              </span>
                            </td>

                            <td className="py-3 px-2 text-center">
                              <span
                                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pos.color}`}
                              >
                                {pos.label}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <Link
                                href={`/price-comparison?product=${p.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-medium transition-colors"
                              >
                                <span>Compare</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        <ChatWidget />
      </div>
    </AuthGuard>
  );
}
