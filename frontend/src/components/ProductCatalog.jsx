import React, { useState } from "react";
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Star,
  Layers,
  ChevronRight,
  TrendingUp,
  Tag,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function ProductCatalog({
  products,
  onSelectProduct,
  onOpenForecast,
  role,
  searchQuery,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("id");

  // Extract unique categories
  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.product_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price_asc")
      return (a.unit_price || 0) - (b.unit_price || 0);
    if (sortBy === "price_desc")
      return (b.unit_price || 0) - (a.unit_price || 0);
    if (sortBy === "score")
      return (b.product_score || 0) - (a.product_score || 0);
    if (sortBy === "sales") return (b.qty_sold || 0) - (a.qty_sold || 0);
    return a.product_id.localeCompare(b.product_id);
  });

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "health_beauty":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "computers_accessories":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "bed_bath_table":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "watches_gifts":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "garden_tools":
        return "bg-lime-500/10 text-lime-400 border-lime-500/20";
      case "consoles_games":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-700/20 text-slate-300 border-slate-700/30";
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800/80">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Product Catalog & Pricing Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Showing {sortedProducts.length} items with dynamic pricing telemetry
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none capitalize"
            >
              {categories.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className="bg-slate-900 text-slate-200"
                >
                  {cat === "all" ? "All Categories" : cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span className="text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none"
            >
              <option value="id" className="bg-slate-900 text-slate-200">
                Product ID
              </option>
              <option value="price_asc" className="bg-slate-900 text-slate-200">
                Price (Low to High)
              </option>
              <option
                value="price_desc"
                className="bg-slate-900 text-slate-200"
              >
                Price (High to Low)
              </option>
              <option value="score" className="bg-slate-900 text-slate-200">
                Highest Score
              </option>
              <option value="sales" className="bg-slate-900 text-slate-200">
                Units Sold
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Product SKU</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Weight</th>
              <th className="py-3.5 px-4">Rating</th>
              <th className="py-3.5 px-4">Current Price</th>
              <th className="py-3.5 px-4">AI Target Price</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedProducts.map((p) => {
              const currentPrice = p.unit_price || 50.0;
              const recPrice = p.recommended_price || currentPrice * 1.05;
              const changePct =
                p.change_pct !== undefined
                  ? p.change_pct
                  : ((recPrice - currentPrice) / currentPrice) * 100;
              const isUp = changePct >= 0;

              return (
                <tr
                  key={p.product_id}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectProduct(p.product_id)}
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-white group-hover:text-indigo-400 transition-colors">
                    {p.product_id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getCategoryColor(p.category)}`}
                    >
                      {p.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs">
                    {p.weight_g ? `${p.weight_g}g` : "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>
                        {p.product_score
                          ? Number(p.product_score).toFixed(1)
                          : "4.2"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    ${Number(currentPrice).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-indigo-300">
                        ${Number(recPrice).toFixed(2)}
                      </span>
                      <span
                        className={`text-[11px] font-semibold flex items-center ${
                          isUp ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isUp ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(changePct).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectProduct(p.product_id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                        title="Open AI dynamic pricing optimizer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Optimize</span>
                      </button>

                      <button
                        onClick={() => onOpenForecast(p.product_id)}
                        className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                        title="View Demand Forecast"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedProducts.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">
            No products found matching your search and category filter.
          </p>
        </div>
      )}
    </div>
  );
}
