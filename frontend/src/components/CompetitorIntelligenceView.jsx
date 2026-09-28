import React, { useState, useEffect } from "react";
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
  Search,
  Filter,
  RefreshCw,
  X,
  CheckCircle2,
  DollarSign,
  Truck,
  Star,
  Activity,
  Layers,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  fetchCompetitorInsights,
  fetchCompetitorDetail,
} from "../services/api";

export default function CompetitorIntelligenceView({
  products = [],
  onSelectProduct,
}) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStance, setFilterStance] = useState("all");
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    const res = await fetchCompetitorInsights();
    if (res.data) {
      setInsights(res.data);
      setIsLive(res.isLive);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleOpenDetail = async (productId) => {
    setActiveModalProduct(productId);
    setModalLoading(true);
    const res = await fetchCompetitorDetail(productId);
    if (res.data) {
      setModalDetail(res.data);
    }
    setModalLoading(false);
  };

  const handleCloseDetail = () => {
    setActiveModalProduct(null);
    setModalDetail(null);
  };

  const filteredInsights = insights.filter((item) => {
    const matchesSearch =
      item.product_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStance === "all") return true;
    if (filterStance === "opportunity")
      return item.opportunity?.type === "opportunity";
    if (filterStance === "risk")
      return (
        item.opportunity?.type === "risk" ||
        item.opportunity?.type === "warning"
      );
    if (filterStance === "premium")
      return item.market_stance === "Premium to Market";
    if (filterStance === "value")
      return item.market_stance === "Value / Undercutting";
    return true;
  });

  const opportunityCount = insights.filter(
    (i) => i.opportunity?.type === "opportunity",
  ).length;
  const riskCount = insights.filter(
    (i) => i.opportunity?.type === "risk" || i.opportunity?.type === "warning",
  ).length;
  const avgPriceIndex = insights.length
    ? Math.round(
        insights.reduce((acc, i) => acc + (i.price_index || 100), 0) /
          insights.length,
      )
    : 100;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-900/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Market Intelligence · 3-Competitor Telemetry Feeds</span>
            {isLive && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                Live Postgres Feeds
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Competitor Benchmarking & Positioning
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time tracking of prices, review ratings, and freight fees
            across competitors (Comp 1, 2, 3) to uncover underpriced premium
            opportunities and mitigate defection risks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadInsights}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors flex items-center gap-2 text-xs cursor-pointer"
            title="Refresh competitor signals"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Sync Feeds</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Average Price Index
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-2 flex items-center gap-2">
            <span>{avgPriceIndex}%</span>
            <span className="text-xs font-normal text-slate-400">
              {avgPriceIndex > 102
                ? "(Market Premium)"
                : avgPriceIndex < 98
                  ? "(Market Value)"
                  : "(Parity)"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Baseline 100% = Exact Competitor Cluster Parity
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Margin Uplift Opportunities
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>{opportunityCount} Products</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Higher ratings with room to capture margin
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Defection & Churn Risks
          </span>
          <div className="text-2xl font-extrabold text-rose-400 font-mono mt-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>{riskCount} Products</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Priced above market without rating justification
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Competitors Tracked
          </span>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-2">
            {insights.length * 3} Streams
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            3 distinct competitor signals per product
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product ID or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All Products" },
            { id: "opportunity", label: "Opportunities" },
            { id: "risk", label: "At Risk" },
            { id: "premium", label: "Premium" },
            { id: "value", label: "Value / Discount" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStance(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filterStance === tab.id
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInsights.map((item) => {
          const ourPrice = item.our_price;
          const compAvg = item.comp_avg_price;
          const opp = item.opportunity;
          const priceIndex = item.price_index;
          const isHigherThanComp = priceIndex > 100;

          return (
            <div
              key={item.product_id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                      {item.product_id}
                    </span>
                    <span className="block text-xs text-slate-500 capitalize">
                      {item.category?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                      item.market_stance === "Premium to Market"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : item.market_stance === "Value / Undercutting"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                    }`}
                  >
                    {item.market_stance}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Our Price
                    </span>
                    <span className="text-base font-bold text-white font-mono">
                      ${ourPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5 mt-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      {item.our_score}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Competitor Avg
                    </span>
                    <span className="text-base font-bold text-amber-400 font-mono">
                      ${compAvg.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5 mt-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      {item.comp_avg_score}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Price Index
                    </span>
                    <span className="text-base font-bold text-cyan-400 font-mono">
                      {priceIndex}%
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {isHigherThanComp
                        ? `+${(priceIndex - 100).toFixed(1)}%`
                        : `${(priceIndex - 100).toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                {opp && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs mb-3 space-y-1 ${
                      opp.type === "opportunity"
                        ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                        : opp.type === "risk" || opp.type === "warning"
                          ? "bg-rose-950/30 border-rose-500/30 text-rose-300"
                          : "bg-slate-950/60 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      {opp.type === "opportunity" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : opp.type === "risk" || opp.type === "warning" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span>{opp.tag}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {opp.headline}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                  {item.competitors &&
                    Object.entries(item.competitors).map(
                      ([cKey, cVal], idx) => (
                        <div
                          key={cKey}
                          className="flex justify-between items-center text-[11px]"
                        >
                          <span className="text-slate-400 flex items-center gap-1">
                            <span>Comp {idx + 1}:</span>
                            <span className="text-[10px] text-slate-500">
                              ({cVal.score}★)
                            </span>
                          </span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-white">
                              ${cVal.price?.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                              <Truck className="w-2.5 h-2.5" />$
                              {cVal.freight?.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => handleOpenDetail(item.product_id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deep Trend</span>
                </button>
                <button
                  onClick={() => onSelectProduct(item.product_id)}
                  className="flex items-center justify-center gap-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  title="Tune price in prediction engine"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Predict</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={handleCloseDetail}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {modalLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                <span className="text-xs">
                  Loading deep competitor telemetry...
                </span>
              </div>
            ) : modalDetail ? (
              <>
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                    <Target className="w-4 h-4" />
                    <span>Competitor Intelligence Deep Dive</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-3">
                    <span className="font-mono">{modalDetail.product_id}</span>
                    <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize">
                      {modalDetail.category?.replace(/_/g, " ")}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tracking 3 rival e-commerce merchants against our pricing,
                    customer ratings, and logistics costs.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Direct Rival Comparison Matrix
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 rounded-l-xl">Merchant</th>
                          <th className="py-2.5 px-3">Price</th>
                          <th className="py-2.5 px-3">Review Score</th>
                          <th className="py-2.5 px-3">Freight Cost</th>
                          <th className="py-2.5 px-3">Price Gap</th>
                          <th className="py-2.5 px-3 rounded-r-xl">
                            Rating Adv.
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        <tr className="bg-indigo-950/30 text-white font-bold">
                          <td className="py-2.5 px-3 text-indigo-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            <span>Our Store</span>
                          </td>
                          <td className="py-2.5 px-3">
                            ${modalDetail.our_price?.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-amber-400">
                            {modalDetail.our_score}★
                          </td>
                          <td className="py-2.5 px-3">
                            ${modalDetail.our_freight?.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            Baseline
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            Baseline
                          </td>
                        </tr>

                        {modalDetail.competitors?.map((c) => (
                          <tr
                            key={c.competitor_num}
                            className="hover:bg-slate-800/40 text-slate-300"
                          >
                            <td className="py-2.5 px-3 font-sans font-medium text-slate-300">
                              {c.competitor_id}
                            </td>
                            <td className="py-2.5 px-3 text-white font-bold">
                              ${c.price?.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-amber-400">
                              {c.score}★
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              ${c.freight?.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[11px] font-bold ${
                                  c.price_difference > 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {c.price_difference > 0
                                  ? `+$${c.price_difference}`
                                  : `-$${Math.abs(c.price_difference)}`}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[11px] ${
                                  c.score_advantage > 0
                                    ? "text-emerald-400"
                                    : c.score_advantage < 0
                                      ? "text-rose-400"
                                      : "text-slate-400"
                                }`}
                              >
                                {c.score_advantage > 0
                                  ? `+${c.score_advantage}★`
                                  : `${c.score_advantage}★`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>
                      Multi-Month Price Evolution (Our Price vs Competitor
                      Signals)
                    </span>
                    <span className="text-[10px] font-normal text-slate-500 font-mono">
                      {modalDetail.historical_trend?.length || 0} periods
                      recorded
                    </span>
                  </h4>
                  <div className="h-64 w-full bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={modalDetail.historical_trend || []}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="period"
                          stroke="#64748b"
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                                  <span className="font-bold text-white block">
                                    {label}
                                  </span>
                                  {payload.map((entry, idx) => (
                                    <div
                                      key={idx}
                                      style={{ color: entry.color }}
                                      className="flex justify-between gap-3"
                                    >
                                      <span>{entry.name}:</span>
                                      <span className="font-mono font-bold">
                                        ${entry.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line
                          type="monotone"
                          dataKey="our_price"
                          name="Our Price"
                          stroke="#6366f1"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="comp_1"
                          name="Comp 1"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="comp_2"
                          name="Comp 2"
                          stroke="#06b6d4"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="comp_3"
                          name="Comp 3"
                          stroke="#ec4899"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="comp_avg"
                          name="Comp Avg"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {modalDetail.opportunity && (
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
                    <Target className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-amber-300 block">
                        Tactical Pricing Directive:{" "}
                        {modalDetail.opportunity.action}
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {modalDetail.opportunity.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
