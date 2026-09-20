"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import { getCompetitorAnalysis, getProfitability } from "../lib/api";

interface ComparisonRow {
  category: string;
  own_avg_price: number;
  competitor_median_price: number;
  price_gap_pct: number;
  position: string;
  recommendation: string;
}

interface ProfitRow {
  category: string;
  total_revenue: number;
  avg_discount_pct: number;
  revenue_retention_pct: number;
  margin_erosion: number;
}

export default function CompetitorPage() {
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [profitability, setProfitability] = useState<ProfitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([getCompetitorAnalysis(), getProfitability()])
      .then(([compData, profitData]) => {
        setComparison(compData.comparison);
        setProfitability(profitData.profitability);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="muted-text mono">Loading competitor analysis...</p>
      </div>
    );
  }

  const priceChartData = comparison.map((c) => ({
    category: c.category,
    "Your Price": c.own_avg_price,
    "Competitor Median": c.competitor_median_price,
  }));

  const profitChartData = profitability.map((p) => ({
    category: p.category,
    "Retention %": p.revenue_retention_pct,
  }));

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
          <h1 className="text-2xl font-bold mb-1">Competitor Analysis & Revenue Optimization</h1>
          <p className="muted-text text-sm">Market positioning vs. Amazon UK competitor data</p>
        </div>

        {/* Price Comparison Chart */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Price Positioning by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="category" stroke="#8b909a" fontSize={11} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="#8b909a" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="Your Price" fill="#0fd8a0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Competitor Median" fill="#9d7cf9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recommendations Table */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Market Positioning & Strategy Recommendations</h2>
          <div className="space-y-3">
            {comparison.map((row) => (
              <div key={row.category} className="terminal-card p-4 flex items-center justify-between gap-4">
                <div className="flex-shrink-0 w-28">
                  <p className="font-semibold text-sm">{row.category}</p>
                  <p className="text-xs muted-text-2">{row.position}</p>
                </div>
                <div className="flex-shrink-0 text-center">
                  <p className="mono violet-text font-bold">+{row.price_gap_pct}%</p>
                  <p className="text-xs muted-text-2">vs market</p>
                </div>
                <p className="text-xs muted-text flex-1">{row.recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profitability Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Retention by Category</h2>
          <p className="text-xs muted-text-2 mb-4">Percentage of full-price revenue retained after discounting</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={profitChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" domain={[0, 100]} stroke="#8b909a" fontSize={11} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="category" stroke="#8b909a" fontSize={11} width={80} />
              <Tooltip contentStyle={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
              <Bar dataKey="Retention %" fill="#0fd8a0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}