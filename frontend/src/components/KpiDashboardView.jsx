import React, { useState, useMemo } from "react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Layers,
  Sparkles,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ComposedChart,
  Line,
} from "recharts";

export default function KpiDashboardView({ products = [], summary = null, onSelectProduct }) {
  const [timeframe, setTimeframe] = useState("30d");

  // Summary calculations
  const totalRev = summary?.total_revenue ? Number(summary.total_revenue) : 1482000;
  const avgPrice = summary?.avg_unit_price ? Number(summary.avg_unit_price) : 88.54;
  const productCount = products.length || summary?.total_products || 52;

  // Realization & Target Monthly Trend
  const trendData = useMemo(() => [
    { period: "Jan", realized: 142000, target: 138000, baseline: 130000, prr: 95.2 },
    { period: "Feb", realized: 154000, target: 148000, baseline: 135000, prr: 95.8 },
    { period: "Mar", realized: 168000, target: 162000, baseline: 144000, prr: 96.1 },
    { period: "Apr", realized: 175000, target: 170000, baseline: 150000, prr: 96.5 },
    { period: "May", realized: 189000, target: 182000, baseline: 158000, prr: 96.8 },
    { period: "Jun", realized: 204000, target: 195000, baseline: 167000, prr: 97.2 },
    { period: "Jul", realized: 215000, target: 208000, baseline: 175000, prr: 96.4 },
    { period: "Aug", realized: 235000, target: 224000, baseline: 188000, prr: 97.6 },
  ], []);

  // Category Gross Margin Comparison Data
  const categoryMarginData = useMemo(() => {
    const cats = [
      { category: "BEDDING", actualMargin: 44.2, targetMargin: 40.0, revenue: 385000 },
      { category: "COMPUTERS", actualMargin: 36.8, targetMargin: 35.0, revenue: 420000 },
      { category: "BEAUTY", actualMargin: 52.4, targetMargin: 48.0, revenue: 210000 },
      { category: "HEALTH", actualMargin: 41.5, targetMargin: 42.0, revenue: 195000 },
      { category: "AUTO", actualMargin: 38.2, targetMargin: 36.0, revenue: 165000 },
      { category: "SPORTS", actualMargin: 45.0, targetMargin: 42.0, revenue: 107000 },
    ];
    return cats;
  }, []);

  // Detailed KPI Table Data
  const kpiScorecard = [
    {
      id: "kpi-1",
      name: "Price Realization Rate (PRR)",
      category: "Pricing Efficiency",
      target: "95.0%",
      actual: "96.4%",
      variance: "+1.4%",
      isPositive: true,
      status: "Exceeded",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: "Percentage of AI-recommended list price successfully captured at checkout.",
      action: "Maintain current dynamic elasticity corridor",
    },
    {
      id: "kpi-2",
      name: "Gross Margin Integrity Index",
      category: "Profitability",
      target: "41.0%",
      actual: "42.8%",
      variance: "+1.8%",
      isPositive: true,
      status: "Exceeded",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: "Blended gross margin across all SKU price executions.",
      action: "Expand premium tier on inelastic items",
    },
    {
      id: "kpi-3",
      name: "Market Parity Index (MPI)",
      category: "Competitive Stance",
      target: "100.0%",
      actual: "103.8%",
      variance: "+3.8%",
      isPositive: true,
      status: "On Track",
      statusColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      description: "Average price position relative to category competitors (100% = parity).",
      action: "Optimal premium spread supported by 4.1★ ratings",
    },
    {
      id: "kpi-4",
      name: "Elasticity Capture Compliance",
      category: "Model Performance",
      target: "85.0%",
      actual: "88.2%",
      variance: "+3.2%",
      isPositive: true,
      status: "Exceeded",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: "SKUs adhering to automated price elasticity recommendations.",
      action: "High confidence across Random Forest & XGBoost",
    },
    {
      id: "kpi-5",
      name: "Freight Cost-to-Price Ratio",
      category: "Cost & Logistics",
      target: "< 16.0%",
      actual: "18.4%",
      variance: "+2.4%",
      isPositive: false,
      status: "Needs Attention",
      statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      description: "Logistics and shipping cost proportion against realized retail price.",
      action: "Trigger freight surcharge optimization on heavy items",
    },
    {
      id: "kpi-6",
      name: "Defection Protected Revenue",
      category: "Risk Mitigation",
      target: "$100,000",
      actual: "$142,500",
      variance: "+$42,500",
      isPositive: true,
      status: "Exceeded",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: "Revenue safeguarded by proactive competitor undercut alerts.",
      action: "Active defense on 8 high-volume SKUs",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-900/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <Target className="w-3.5 h-3.5" />
            <span>Key Performance Indicators</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Executive KPI & Performance Scorecard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
              Health: 94.6% Optimal
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live telemetry tracking price realization efficiency, gross margin integrity, competitive positioning, and model elasticity compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="ytd">Year-to-Date (YTD)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Total Revenue
            </span>
            <div className="text-xl font-black text-white mt-1">
              ${totalRev.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8.4% vs target</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Price Realization (PRR)
            </span>
            <div className="text-xl font-black text-indigo-400 mt-1">
              96.4%
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+1.4% capture rate</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Gross Margin %
            </span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              42.8%
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+1.8% expansion</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Market Parity Index
            </span>
            <div className="text-xl font-black text-amber-400 mt-1">
              103.8%
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mt-2">
            <span>Optimal Premium</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Elasticity Adherence
            </span>
            <div className="text-xl font-black text-purple-400 mt-1">
              88.2%
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>High ML fit</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Protected Revenue
            </span>
            <div className="text-xl font-black text-white mt-1">
              $142.5k
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-indigo-400 font-semibold mt-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Defection saved</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Graphs (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Price Realization vs Baseline & AI Target */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Revenue Uplift: AI Pricing vs Static Baseline</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Demonstrates dynamic price realization outperforming static catalog pricing by +$47,000/mo.
              </p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Area type="monotone" dataKey="realized" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRealized)" name="Realized Revenue (AI)" />
                <Area type="monotone" dataKey="baseline" stroke="#64748b" strokeDasharray="3 3" fillOpacity={1} fill="url(#colorBaseline)" name="Static Baseline" />
                <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={1.5} dot={false} name="Target Plan" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Gross Margin % by Category vs Target Plan */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Gross Margin % by Retail Category</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Compares actual captured gross margin against strategic target benchmarks.
              </p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryMarginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  formatter={(val) => [`${val}%`, ""]}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="actualMargin" fill="#10b981" radius={[4, 4, 0, 0]} name="Actual Margin %" />
                <Bar dataKey="targetMargin" fill="#334155" radius={[4, 4, 0, 0]} name="Target Goal %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comprehensive KPI Performance Scorecard Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>KPI Performance Scorecard & Action Log</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live variance tracking against enterprise pricing governance objectives.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Performance Indicator</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Target Goal</th>
                <th className="py-3 px-4">Actual Realized</th>
                <th className="py-3 px-4">Variance</th>
                <th className="py-3 px-4">Evaluation Status</th>
                <th className="py-3 px-6">Strategic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {kpiScorecard.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-6 font-bold text-white font-sans">
                    <div>{row.name}</div>
                    <span className="text-[11px] text-slate-400 font-normal">{row.description}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans">
                    {row.category}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {row.target}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    {row.actual}
                  </td>
                  <td className={`py-3 px-4 font-bold ${row.isPositive ? "text-emerald-400" : "text-amber-400"}`}>
                    {row.variance}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-slate-300 font-sans">
                    {row.action}
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
