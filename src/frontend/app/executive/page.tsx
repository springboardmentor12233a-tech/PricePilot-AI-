"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getKPIs, getCompetitorAnalysis, getProfitability, getAIInsights } from "../lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SkeletonDashboard } from "../components/Skeleton";

function cleanText(text: string): string {
  return text
    .replace(/[\u2010-\u2015\u2212]/g, "-")            // all hyphen/dash variants -> "-"
    .replace(/[\u2018\u2019]/g, "'")                   // curly single quotes
    .replace(/[\u201C\u201D]/g, '"')                   // curly double quotes
    .replace(/[\u00A0\u2002-\u200A\u202F\u205F]/g, " ") // special spaces -> normal space
    .replace(/\u2026/g, "...")                         // ellipsis
    .replace(/\u2248/g, "~")                           // approx sign
    .replace(/\u2192/g, "->")                          // arrow
    .replace(/\*\*/g, "")                              // markdown bold markers
    .replace(/[^\x00-\x7F]/g, "")                      // drop anything else non-ASCII
    .replace(/\s+/g, " ")
    .trim();
}

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

  function downloadReport() {
    if (!kpis) return;

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 216, 160);
    doc.text("PricePilot AI", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Executive Business Intelligence Report", 14, 28);
    doc.setFontSize(9);
    doc.text(`Generated: ${today}`, 14, 34);

    // KPI Summary
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text("Key Performance Indicators", 14, 46);

    const avgGapPct = (comparison.reduce((sum, c) => sum + c.price_gap_pct, 0) / comparison.length).toFixed(0);
    const avgRetention = (profitability.reduce((sum, p) => sum + p.revenue_retention_pct, 0) / profitability.length).toFixed(1);

    autoTable(doc, {
      startY: 50,
      head: [["Metric", "Value"]],
      body: [
        ["Total Revenue", `$${(kpis.total_revenue / 1000000).toFixed(2)}M`],
        ["Month-over-Month Growth", `${kpis.latest_month_growth_pct}%`],
        ["Average Order Value", `$${kpis.avg_order_value}`],
        ["Total Units Sold", kpis.total_units_sold.toLocaleString()],
        ["Avg. Market Position vs Competitors", `+${avgGapPct}%`],
        ["Avg. Revenue Retention", `${avgRetention}%`],
      ],
      theme: "striped",
      headStyles: { fillColor: [15, 216, 160] },
    });

    // Executive Summary
    if (summary) {
      const cleanSummary = cleanText(summary);
      const finalY = (doc as any).lastAutoTable.finalY || 90;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text("Executive Summary", 14, finalY + 12);

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      const pageWidth = doc.internal.pageSize.getWidth();
      const usableWidth = pageWidth - 28;

      const splitSummary = doc.splitTextToSize(cleanSummary, usableWidth);
      doc.text(splitSummary, 14, finalY + 20, { lineHeightFactor: 1.5 });
    }

    // Category Performance Table
    const finalY2 = (doc as any).lastAutoTable.finalY || 90;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - 28;
    const lines = doc.splitTextToSize(cleanText(summary), usableWidth);
    const summaryHeight = summary ? 20 + (lines.length * 5) : 0;

    autoTable(doc, {
      startY: finalY2 + summaryHeight + 15,
      head: [["Category", "Revenue", "Market Position", "Retention"]],
      body: profitability.map((p) => {
        const comp = comparison.find((c) => c.category === p.category);
        return [
          p.category,
          `$${(p.total_revenue / 1000000).toFixed(2)}M`,
          `+${comp?.price_gap_pct}%`,
          `${p.revenue_retention_pct.toFixed(1)}%`,
        ];
      }),
      theme: "striped",
      headStyles: { fillColor: [157, 124, 249] },
    });

    doc.save(`PricePilot_Executive_Report_${today.replace(/\//g, "-")}.pdf`);
  }

  if (loading || !kpis) {
    return <SkeletonDashboard />;
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
        <div className="flex items-center gap-3">
          <button
            onClick={downloadReport}
            className="accent-btn text-xs px-4 py-2 rounded-lg font-semibold mr-3"
          >
            📥 Download Report
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm muted-text hover:text-white transition px-3 py-1.5 rounded-lg border border-[var(--border)]"
          >
            ← Back to Dashboard
          </button>
        </div>
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