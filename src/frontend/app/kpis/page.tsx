"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { getKPIs, getAIInsights } from "../lib/api";

interface KPIData {
  total_revenue: number;
  avg_order_value: number;
  total_units_sold: number;
  discount_impact: number;
  latest_month_growth_pct: number;
  monthly_revenue: { month: string; revenue: number; growth_pct: number | null }[];
  category_performance: { category: string; revenue: number; units_sold: number }[];
  region_performance: { region: string; revenue: number; units_sold: number }[];
}

const COLORS = ["#0fd8a0", "#9d7cf9", "#35f5c1", "#7c9df9", "#f9a17c", "#f97ca6", "#cdf97c", "#7cf9e5"];

export default function KPIsPage() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    getKPIs().then(setData).finally(() => setLoading(false));
  }, []);

  async function generateInsight() {
    if (!data) return;
    setInsightLoading(true);
    try {
      const topCategory = data.category_performance[0];
      const bottomCategory = data.category_performance[data.category_performance.length - 1];
      const topRegion = data.region_performance[0];

      const context = `Total revenue is $${(data.total_revenue / 1000000).toFixed(2)}M, with month-over-month growth of ${data.latest_month_growth_pct}%. Top performing category is ${topCategory.category} ($${(topCategory.revenue / 1000000).toFixed(2)}M), while ${bottomCategory.category} is lowest ($${(bottomCategory.revenue / 1000000).toFixed(2)}M). Average order value is $${data.avg_order_value}. Region ${topRegion.region} leads with $${(topRegion.revenue / 1000000).toFixed(2)}M revenue. Total units sold: ${data.total_units_sold}.`;

      const result = await getAIInsights(context);
      setInsight(result.insight);
    } catch (err) {
      setInsight("Failed to generate insight. Please try again.");
    } finally {
      setInsightLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="muted-text mono">Loading KPIs...</p>
      </div>
    );
  }

  const growthPositive = data.latest_month_growth_pct >= 0;

  return (
    <div className="min-h-screen">
      <div className="status-strip px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg logo-mark flex items-center justify-center font-bold text-[#052018] text-sm">
            P
          </div>
          <span className="font-semibold tracking-tight">PricePilot AI</span>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm muted-text hover:text-white transition px-3 py-1.5 rounded-lg border border-[var(--border)]"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Business KPIs</h1>
          <p className="muted-text text-sm">Revenue, growth & performance analytics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-5">
            <p className="text-xs muted-text mb-2 uppercase tracking-wide">Total Revenue</p>
            <p className="mono accent-text font-bold text-2xl">
              ${(data.total_revenue / 1000000).toFixed(2)}M
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs muted-text mb-2 uppercase tracking-wide">MoM Growth</p>
            <p className={`mono font-bold text-2xl ${growthPositive ? "accent-text" : "text-red-400"}`}>
              {growthPositive ? "+" : ""}{data.latest_month_growth_pct}%
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs muted-text mb-2 uppercase tracking-wide">Avg Order Value</p>
            <p className="mono violet-text font-bold text-2xl">${data.avg_order_value}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs muted-text mb-2 uppercase tracking-wide">Units Sold</p>
            <p className="mono font-bold text-2xl">{(data.total_units_sold / 1000000).toFixed(2)}M</p>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">AI-Powered Insights</h2>
              <p className="text-xs muted-text-2">Generated by Groq (Llama-based reasoning)</p>
            </div>
            <button
              onClick={generateInsight}
              disabled={insightLoading}
              className="accent-btn text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {insightLoading ? "Analyzing..." : "✨ Generate Insight"}
            </button>
          </div>

          {insight ? (
            <div className="terminal-card p-4">
              <p className="text-sm leading-relaxed">{insight}</p>
            </div>
          ) : (
            <p className="muted-text text-sm">Click &quot;Generate Insight&quot; to get an AI-powered analysis of your current business metrics.</p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Monthly Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.monthly_revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#8b909a" fontSize={11} />
                <YAxis stroke="#8b909a" fontSize={11} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                <Tooltip contentStyle={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="revenue" stroke="#0fd8a0" strokeWidth={2} dot={{ fill: "#0fd8a0", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Performance */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Revenue by Category</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.category_performance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#8b909a" fontSize={11} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                <YAxis type="category" dataKey="category" stroke="#8b909a" fontSize={11} width={80} />
                <Tooltip contentStyle={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                <Bar dataKey="revenue" fill="#9d7cf9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Performance */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue by Region</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.region_performance}
                dataKey="revenue"
                nameKey="region"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.region}: $${(entry.revenue / 1000000).toFixed(1)}M`}
              >
                {data.region_performance.map((entry, index) => (
                  <Cell key={entry.region} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}