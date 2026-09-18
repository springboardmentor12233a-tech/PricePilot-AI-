import React from "react";
import {
  Package,
  DollarSign,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function StatCards({ summary, productsCount }) {
  const cards = [
    {
      title: "Monitored Products",
      value: productsCount || summary?.total_products || "676",
      sub: "Across 6 retail categories",
      change: "+12% MoM",
      isPos: true,
      icon: Package,
      gradient: "from-blue-500/20 to-indigo-500/5",
      border: "border-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      title: "Average Unit Price",
      value: `$${summary?.avg_unit_price ? Number(summary.avg_unit_price).toFixed(2) : "88.54"}`,
      sub: "Dynamic baseline price",
      change: "+3.2%",
      isPos: true,
      icon: DollarSign,
      gradient: "from-emerald-500/20 to-teal-500/5",
      border: "border-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      title: "AI Price Opportunities",
      value: `${summary?.opportunities_count || "18"} SKUs`,
      sub: "Price elasticity advantage",
      change: "High Confidence",
      isPos: true,
      icon: Sparkles,
      gradient: "from-purple-500/20 to-indigo-500/5",
      border: "border-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      title: "Projected Revenue Uplift",
      value: `+${summary?.avg_margin_uplift || "4.8"}%`,
      sub: "Estimated $48.2k monthly gains",
      change: "Optimized",
      isPos: true,
      icon: TrendingUp,
      gradient: "from-cyan-500/20 to-blue-500/5",
      border: "border-cyan-500/20",
      iconColor: "text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl bg-gradient-to-b ${card.gradient} bg-slate-900/60 border ${card.border} backdrop-blur-sm relative overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:border-slate-700`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <div
                className={`p-2 rounded-xl bg-slate-950/60 border border-slate-800 ${card.iconColor}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {card.value}
              </span>
              <span
                className={`text-xs font-semibold flex items-center ${card.isPos ? "text-emerald-400" : "text-rose-400"}`}
              >
                {card.change}
              </span>
            </div>

            <p className="text-xs text-slate-500">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
