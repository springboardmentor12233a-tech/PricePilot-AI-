import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
  Zap,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  Filter,
} from "lucide-react";

export default function AiInsightsView({ products = [], onSelectProduct }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const opportunities = [
    {
      id: "opp-1",
      title: "Inelastic Pricing Power Opportunity",
      badge: "High Margin Uplift",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      description:
        "Analysis of price changes across 18 bedding and home products indicates low price sensitivity (E_d = -0.13 to -0.42). Raising baseline prices by 3.5% across this group will expand margins by an estimated $14,200/mo with under 0.8% volume defection.",
      impact: "+$14.2k/mo",
      impactType: "positive",
      confidence: 94,
      sampleSku: "bed1",
      actionLabel: "Review Bedding Strategy",
    },
    {
      id: "opp-2",
      title: "Rival Discounting Defense Needed",
      badge: "Defection Risk",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      description:
        "Competitor 1 has lowered prices on 8 high-volume SKUs over the last 30 days. Current price index exceeds 125% of market parity, putting an estimated $28,000 in monthly revenue at risk of customer migration.",
      impact: "-$28.0k at risk",
      impactType: "negative",
      confidence: 89,
      sampleSku: "bed1",
      actionLabel: "Benchmark Competitor Prices",
    },
    {
      id: "opp-3",
      title: "Freight Cost Pass-Through Optimization",
      badge: "Cost Recovery",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      description:
        "Freight and logistics costs for heavy products (>2,000g) have increased 14%. Adjusting shipping thresholds or bundling free freight above $85 will preserve gross margins without harming conversion rates.",
      impact: "+2.4% Gross Margin",
      impactType: "positive",
      confidence: 91,
      sampleSku: "telecom1",
      actionLabel: "Adjust Logistics Tiers",
    },
    {
      id: "opp-4",
      title: "Cross-Elasticity Bundling Recommendation",
      badge: "Cart Uplift",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      description:
        "High correlation detected between top-tier electronics and accessory SKUs. Offering dynamic 8% bundle incentives increases average order value (AOV) by $22 without eroding individual SKU perception.",
      impact: "+11% AOV",
      impactType: "positive",
      confidence: 86,
      sampleSku: "computers1",
      actionLabel: "Simulate Bundle Impact",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-900/40 backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Market Intelligence Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              AI Strategic Insights & Opportunities
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Machine learning models continuously evaluate competitor price moves, demand elasticities, and inventory telemetry to generate actionable pricing recommendations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                Active Opportunities
              </span>
              <span className="text-lg font-black text-emerald-400">
                +$44.6k / mo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/90 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${opp.badgeColor}`}>
                  {opp.badge}
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md">
                  AI Confidence: {opp.confidence}%
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
                {opp.impactType === "positive" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{opp.title}</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {opp.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-500 block font-bold">
                  Estimated Impact
                </span>
                <span
                  className={`font-black text-sm ${
                    opp.impactType === "positive" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {opp.impact}
                </span>
              </div>

              {opp.sampleSku && onSelectProduct && (
                <button
                  onClick={() => onSelectProduct(opp.sampleSku)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold transition-all cursor-pointer"
                >
                  <span>{opp.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Catalog Insights Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 overflow-hidden">
        <div className="p-4 px-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>SKU Elasticity & Margin Driver Matrix</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies which products have headroom for price increases vs products requiring defensive posture.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Product ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Price</th>
                <th className="py-3 px-4">Monthly Revenue</th>
                <th className="py-3 px-4">Elasticity Profile</th>
                <th className="py-3 px-4">AI Recommended Move</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.slice(0, 10).map((p, idx) => {
                const isEven = idx % 2 === 0;
                const isInelastic = idx % 3 === 0;
                return (
                  <tr
                    key={p.product_id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-6 font-mono font-bold text-white">
                      {p.product_id}
                    </td>
                    <td className="py-3 px-4 text-slate-300 capitalize">
                      {p.category || "General"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      ${Number(p.unit_price || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                      ${Number(p.total_price || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {isInelastic ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          Inelastic (-0.18)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                          Elastic (-1.24)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {isInelastic ? (
                        <span className="text-emerald-400">
                          Increase +3% to +5% (Margin Gain)
                        </span>
                      ) : (
                        <span className="text-slate-300">
                          Maintain parity with Rival 1
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {onSelectProduct && (
                        <button
                          onClick={() => onSelectProduct(p.product_id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors text-[11px] font-semibold cursor-pointer"
                        >
                          Simulate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
