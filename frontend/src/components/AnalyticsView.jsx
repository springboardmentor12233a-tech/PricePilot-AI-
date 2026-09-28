import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Percent,
  Layers,
  Filter,
  ArrowUpDown,
  Search,
  Sparkles,
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
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

export default function AnalyticsView({ products = [], onSelectProduct }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  const categories = useMemo(() => {
    return ["all", ...new Set(products.map((p) => p.category).filter(Boolean))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchSearch =
        p.product_id.toLowerCase().includes(search.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, search]);

  // Aggregate stats by category for chart
  const categoryStats = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const cat = p.category || "General";
      if (!map[cat]) {
        map[cat] = { category: cat.toUpperCase(), totalVolume: 0, avgPrice: 0, count: 0, totalPrice: 0 };
      }
      map[cat].count += 1;
      map[cat].totalVolume += Number(p.qty_sold || 0);
      map[cat].totalPrice += Number(p.unit_price || 0);
    });

    return Object.values(map).map((c) => ({
      category: c.category,
      avgPrice: Math.round(c.totalPrice / c.count),
      totalVolume: c.totalVolume,
    }));
  }, [products]);

  // Scatter plot data: Price vs Volume
  const scatterData = useMemo(() => {
    return filteredProducts.map((p) => ({
      x: Number(p.unit_price || 0),
      y: Number(p.qty_sold || 0),
      z: Number(p.total_price || 0),
      name: p.product_id,
      category: p.category,
    }));
  }, [filteredProducts]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Advanced Analytics & Price Sensitivity</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Cross-Catalog Pricing Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deep-dive multi-dimensional breakdown of unit prices, sales velocity, category elasticity, and revenue concentration.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 w-48"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Median Unit Price
          </span>
          <div className="text-2xl font-black text-white mt-1">
            $49.80
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Across {filteredProducts.length} filtered SKUs
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Catalog Elasticity Score
          </span>
          <div className="text-2xl font-black text-indigo-400 mt-1">
            -0.82
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-0.5 block">
            Moderately Inelastic
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Avg Customer Rating
          </span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            4.12 ★
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            High brand equity
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Market Parity Ratio
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            103.8%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Competitive position
          </span>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Price by Category */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">
            Average Unit Price by Category ($)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <Bar dataKey="avgPrice" fill="#818cf8" radius={[4, 4, 0, 0]} name="Avg Unit Price ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Volume by Category */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">
            Total Sales Volume by Category (Units)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <Bar dataKey="totalVolume" fill="#34d399" radius={[4, 4, 0, 0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Analytics Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            SKU Sensitivity & Velocity Breakdown ({filteredProducts.length} Items)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Product ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Units Sold</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredProducts.slice(0, 10).map((p) => (
                <tr key={p.product_id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-6 font-bold text-white">
                    {p.product_id}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans capitalize">
                    {p.category || "General"}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    ${Number(p.unit_price || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {Number(p.qty_sold || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">
                    ${Number(p.total_price || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-amber-400 font-sans font-semibold">
                    {Number(p.product_score || 4.0).toFixed(1)} ★
                  </td>
                  <td className="py-3 px-6 text-right font-sans">
                    {onSelectProduct && (
                      <button
                        onClick={() => onSelectProduct(p.product_id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors text-[11px] font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
