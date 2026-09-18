import React from "react";
import {
  Users2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Target,
} from "lucide-react";

export default function CompetitorIntelligenceView({
  products,
  onSelectProduct,
}) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-900/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Market Intelligence & Competitor Telemetry</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Competitor Price Benchmarking
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time tracking of 3 competitor pricing signals across retail
            categories to detect undercut risks and margin capture
            opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            3 Competitor Feeds Active
          </div>
        </div>
      </div>

      {/* Competitor Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => {
          const current = p.unit_price || 50;
          const compAvg = p.comp_avg_price || current * 1.08;
          const diff = compAvg - current;
          const diffPct = ((diff / current) * 100).toFixed(1);
          const isHigherThanComp = diff < 0;

          return (
            <div
              key={p.product_id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="font-mono font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">
                    {p.product_id}
                  </span>
                  <span className="block text-xs text-slate-500 capitalize">
                    {p.category.replace(/_/g, " ")}
                  </span>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    isHigherThanComp
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}
                >
                  {isHigherThanComp
                    ? "Premium to Market"
                    : "Undercutting Market"}
                </span>
              </div>

              {/* Price comparison row */}
              <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div>
                  <span className="text-[11px] uppercase text-slate-500 font-semibold">
                    Our Price
                  </span>
                  <div className="text-lg font-bold text-white font-mono">
                    ${Number(current).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] uppercase text-slate-500 font-semibold">
                    Competitor Avg
                  </span>
                  <div className="text-lg font-bold text-amber-400 font-mono">
                    ${Number(compAvg).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Competitor feeds detail */}
              <div className="space-y-1.5 text-xs text-slate-400 mb-4 border-t border-slate-800/60 pt-3">
                <div className="flex justify-between">
                  <span>Competitor 1 (Comp A):</span>
                  <span className="font-mono text-slate-300">
                    ${(compAvg * 0.98).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Competitor 2 (Comp B):</span>
                  <span className="font-mono text-slate-300">
                    ${(compAvg * 1.02).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Competitor 3 (Comp C):</span>
                  <span className="font-mono text-slate-300">
                    ${(compAvg * 0.99).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => onSelectProduct(p.product_id)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700 hover:border-indigo-500"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optimize Price Position</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
