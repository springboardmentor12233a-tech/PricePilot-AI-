"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getKPIs, getCompetitorAnalysis, getProfitability, getAIInsights } from "../lib/api";

export default function ExecutiveReportPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [comparison, setComparison] = useState<any[]>([]);
  const [profitability, setProfitability] = useState<any[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([getKPIs(), getCompetitorAnalysis(), getProfitability()])
      .then(([kpiData, compData, profitData]) => {
        setKpis(kpiData);
        setComparison(compData.comparison);
        setProfitability(profitData.profitability);
      })
      .finally(() => setLoading(false));
  }, []);

  async function generateExecutiveSummary() {
    if (!kpis || comparison.length === 0 || profitability.length === 0) return;
    setSummaryLoading(true);
    try {
      const avgRetention = (
        profitability.reduce((sum, p) => sum + p.revenue_retention_pct, 0) / profitability.length
      ).toFixed(1);
      const avgGap = (
        comparison.reduce((sum, c) => sum + c.price_gap_pct, 0) / comparison.length
      ).toFixed(0);
      const worstRetention = [...profitability].sort((a, b) => a.revenue_retention_pct - b.revenue_retention_pct)[0];

      const context = `Executive summary request. Total revenue: $${(kpis.total_revenue / 1000000).toFixed(2)}M with ${kpis.latest_month_growth_pct}% MoM growth. Average price positioning is ${avgGap}% above competitor market median across all categories. Average revenue retention after discounting is ${avgRetention}%. Weakest retention category is ${worstRetention.category} at ${worstRetention.revenue_retention_pct.toFixed(1)}%. Provide a 3-sentence executive-level strategic summary covering overall health, competitive position, and one key recommendation.`;

      const result = await getAIInsights(context);
      setSummary(result.insight);
    } catch (err) {
      setSummary("Unable to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading || !kpis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="muted-text mono">Loading executive report...</p>
      </div>
    );
  }

  const avgGapPct = (comparison.reduce((sum, c) => sum + c.price_gap_pct, 0) / comparison.length).toFixed(0);
  const avgRetention = (profitability.reduce((sum, p) => sum + p.revenue_retention_pct, 0) / profitability.length).toFixed(1);
  const totalMarginErosion = profitability.reduce((sum, p) => sum + p.margin_erosion, 0);

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

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Executive Business Intelligence Report</h1>
          <p className="muted-text text-sm">Consolidated overview across revenue, competition & profitability</p>
        </div>

        {/* Top-Line KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-5">
            <p className="text-xs muted-text mb-2 uppercase tracking-wide">Total Revenue</p>
            <p className="mono accent-text font-bold text-xl">${(kpis.total_revenue / 1000000).toFixed(2)}M</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs muted-text mb-2 uppercase tracking-wide">MoM Growth</p>
            <p className="mono font-bold text-xl">{kpis.latest_month_growth_pct >= 0 ? "+" : ""}{kpis.latest_month_growth_pct}%</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs muted-text mb-2 uppercase tracking-wide">Avg Market Position</p>
            <p className="mono violet-text font-bold text-xl">+{avgGapPct}%</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs muted-text mb-2 uppercase tracking-wide">Avg Retention</p>
            <p className="mono font-bold text-xl">{avgRetention}%</p>
          </div>
        </div>

        {/* AI Executive Summary */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Executive Summary</h2>
              <p className="text-xs muted-text-2">AI-generated strategic overview</p>
            </div>
            <button
              onClick={generateExecutiveSummary}
              disabled={summaryLoading}
              className="accent-btn text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {summaryLoading ? "Generating..." : "✨ Generate Summary"}
            </button>
          </div>
          {summary ? (
            <div className="terminal-card p-4">
              <p className="text-sm leading-relaxed">{summary}</p>
            </div>
          ) : (
            <p className="muted-text text-sm">Click &quot;Generate Summary&quot; for an AI-powered executive briefing.</p>
          )}
        </div>

        {/* Consolidated Table */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Category Performance Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left muted-text text-xs uppercase border-b border-[var(--border)]">
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Revenue</th>
                  <th className="pb-3">Market Position</th>
                  <th className="pb-3">Retention</th>
                </tr>
              </thead>
              <tbody>
                {profitability.map((p) => {
                  const comp = comparison.find((c) => c.category === p.category);
                  return (
                    <tr key={p.category} className="border-b border-[var(--border)]">
                      <td className="py-3 font-medium">{p.category}</td>
                      <td className="py-3 mono accent-text">${(p.total_revenue / 1000000).toFixed(2)}M</td>
                      <td className="py-3 mono violet-text">+{comp?.price_gap_pct}%</td>
                      <td className="py-3 mono">{p.revenue_retention_pct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}