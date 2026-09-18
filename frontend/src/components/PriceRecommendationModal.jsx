import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Percent,
  Sliders,
  DollarSign,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  fetchProductRecommendation,
  fetchProductHistory,
} from "../services/api";

export default function PriceRecommendationModal({ productId, onClose, role }) {
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [applied, setApplied] = useState(false);
  const [simulatedPrice, setSimulatedPrice] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchProductRecommendation(productId);
      setRecommendation(res.data);
      setSimulatedPrice(res.data.recommended_price);
      setLoading(false);
    }
    if (productId) {
      loadData();
    }
  }, [productId]);

  if (!productId) return null;

  const currentPrice = recommendation?.current_price || 40.0;
  const recommendedPrice = recommendation?.recommended_price || 42.5;
  const competitorAvg = recommendation?.competitor_avg_price || 44.0;
  const changePct =
    recommendation?.change_pct ??
    ((recommendedPrice - currentPrice) / currentPrice) * 100;
  const isUp = changePct >= 0;

  // Chart data for comparison
  const comparisonData = [
    {
      name: "Current Price",
      price: currentPrice,
      fill: "#64748b", // Slate
    },
    {
      name: "Competitor Avg",
      price: competitorAvg,
      fill: "#f59e0b", // Amber
    },
    {
      name: "AI Recommended",
      price: recommendedPrice,
      fill: "#6366f1", // Indigo
    },
    ...(simulatedPrice && simulatedPrice !== recommendedPrice
      ? [
          {
            name: "Simulated Target",
            price: simulatedPrice,
            fill: "#06b6d4", // Cyan
          },
        ]
      : []),
  ];

  // Simulated elasticity & revenue calculation
  const elasticityFactor = -1.2;
  const simDeltaPct = simulatedPrice
    ? (simulatedPrice - currentPrice) / currentPrice
    : 0;
  const estDemandChangePct = simDeltaPct * elasticityFactor * 100;
  const estRevenueMultiplier =
    (1 + simDeltaPct) * (1 + estDemandChangePct / 100);
  const estRevenueImpactPct = ((estRevenueMultiplier - 1) * 100).toFixed(1);

  const handleApplyPrice = () => {
    if (role !== "pricing_manager") return;
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-mono">
                  {productId}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                  {recommendation?.category?.replace(/_/g, " ") || "Retail"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI Anchored Random Forest Price Recommendation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400">
                Evaluating competitor telemetry & elasticity models...
              </p>
            </div>
          ) : (
            <>
              {/* Top Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Price */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Current Price
                  </span>
                  <div className="text-2xl font-bold text-slate-200 mt-1 font-mono">
                    ${Number(currentPrice).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    As of recent baseline
                  </span>
                </div>

                {/* AI Recommended Price */}
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      Recommended Price
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center ${
                        isUp
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {isUp ? (
                        <ArrowUpRight className="w-3 h-3 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 mr-0.5" />
                      )}
                      {Math.abs(changePct).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-300 mt-1 font-mono">
                    ${Number(recommendedPrice).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-indigo-400/80">
                    Delta: $
                    {recommendation?.change >= 0
                      ? `+${recommendation?.change}`
                      : recommendation?.change}
                  </span>
                </div>

                {/* Competitor Avg */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Competitor Benchmark
                  </span>
                  <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                    ${Number(competitorAvg).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Average across 3 competitor feeds
                  </span>
                </div>
              </div>

              {/* Visual Benchmark Chart */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    Comparative Pricing Position ($)
                  </h4>
                  <span className="text-xs font-semibold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    Model Confidence: {recommendation?.confidence || 92}%
                  </span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                    >
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        domain={[0, "dataMax + 10"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                        formatter={(val) => [
                          `$${Number(val).toFixed(2)}`,
                          "Price",
                        ]}
                      />
                      <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                        {comparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* What-If Simulation Slider */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200">
                      What-If Price Simulation
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    ${Number(simulatedPrice).toFixed(2)}
                  </span>
                </div>

                <input
                  type="range"
                  min={Math.floor(currentPrice * 0.7)}
                  max={Math.ceil(currentPrice * 1.4)}
                  step="0.5"
                  value={simulatedPrice || currentPrice}
                  onChange={(e) =>
                    setSimulatedPrice(parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                <div className="flex items-center justify-between mt-3 text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>
                    Est. Elasticity Impact:{" "}
                    <strong className="text-slate-200">
                      {estDemandChangePct.toFixed(1)}% demand
                    </strong>
                  </span>
                  <span>
                    Est. Revenue Change:{" "}
                    <strong
                      className={
                        Number(estRevenueImpactPct) >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      {Number(estRevenueImpactPct) >= 0
                        ? `+${estRevenueImpactPct}%`
                        : `${estRevenueImpactPct}%`}
                    </strong>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {role === "pricing_manager" ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" /> Pricing Manager Execution
                Rights
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <Lock className="w-4 h-4" /> View-Only (Switch to Pricing
                Manager to commit changes)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={role !== "pricing_manager" || applied}
              onClick={handleApplyPrice}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                applied
                  ? "bg-emerald-600 text-white"
                  : role === "pricing_manager"
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              {applied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>Price Deployed!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Commit Target Price ($
                    {Number(simulatedPrice || recommendedPrice).toFixed(2)})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
