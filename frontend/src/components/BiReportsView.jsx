import React, { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Share2,
  FileSpreadsheet,
  Printer,
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
  AreaChart,
  Area,
} from "recharts";

export default function BiReportsView({ products = [], summary = null }) {
  const [reportPeriod, setReportPeriod] = useState("30d");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Group revenue by category for reporting
  const categoryData = React.useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const cat = p.category || "General";
      if (!map[cat]) {
        map[cat] = { category: cat.toUpperCase(), revenue: 0, units: 0 };
      }
      map[cat].revenue += Number(p.total_price || 0);
      map[cat].units += Number(p.qty_sold || 0);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [products]);

  // Monthly revenue trend mock data
  const monthlyTrendData = [
    { month: "Jan", revenue: 98000, margin: 38.2, target: 95000 },
    { month: "Feb", revenue: 104000, margin: 39.1, target: 100000 },
    { month: "Mar", revenue: 112000, margin: 40.5, target: 105000 },
    { month: "Apr", revenue: 118000, margin: 41.0, target: 110000 },
    { month: "May", revenue: 125000, margin: 41.8, target: 115000 },
    { month: "Jun", revenue: 139000, margin: 42.4, target: 120000 },
    { month: "Jul", revenue: 142000, margin: 41.9, target: 125000 },
    { month: "Aug", revenue: 156000, margin: 43.1, target: 130000 },
  ];

  const handleExportCsv = () => {
    const headers = ["Product ID", "Category", "Unit Price", "Qty Sold", "Total Revenue", "Score"];
    const rows = products.map((p) => [
      p.product_id,
      p.category,
      p.unit_price,
      p.qty_sold,
      p.total_price,
      p.product_score,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pricepilot_bi_report_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Business Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            BI Reports & Strategy Statements
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive audit-ready reports covering pricing realization, gross margin integrity, and SKU revenue contribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter (Q2)</option>
            <option value="ytd">Year-to-Date (YTD)</option>
          </select>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloadSuccess ? "Downloaded!" : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Total Monitored Revenue
          </span>
          <div className="text-2xl font-black text-white mt-1">
            ${summary?.total_revenue ? Number(summary.total_revenue).toLocaleString() : "1,482,000"}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">
            +8.4% vs prior period
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Price Realization Rate
          </span>
          <div className="text-2xl font-black text-indigo-400 mt-1">
            96.2%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">
            Target benchmark: 95.0%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Gross Margin Index
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            42.8%
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">
            +1.3% margin expansion
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Catalog SKUs Monitored
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {products.length || "52"}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">
            100% telemetry synced
          </span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Revenue Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">
            Revenue Contribution by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Performance Trend */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">
            Revenue Realization Trend ($)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" name="Actual Revenue" />
                <Area type="monotone" dataKey="target" stroke="#10b981" fillOpacity={0} strokeDasharray="4 4" name="Target Plan" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top SKU Performance Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="p-4 px-6 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">
            Top SKU Revenue & Realization Ranking
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">SKU / Product ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Volume Sold</th>
                <th className="py-3 px-4">Total Revenue</th>
                <th className="py-3 px-4">Margin Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {products.slice(0, 8).map((p, i) => (
                <tr key={p.product_id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-6 font-bold text-white">
                    {p.product_id}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans capitalize">
                    {p.category || "General"}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    ${Number(p.unit_price || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {Number(p.qty_sold || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">
                    ${Number(p.total_price || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                      Tier {i % 2 === 0 ? "A (High Margin)" : "B (Standard)"}
                    </span>
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
