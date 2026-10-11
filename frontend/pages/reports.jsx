import { useState } from "react";
import Layout from "../components/Layout";
import { Card, Pill } from "../components/ui";
import ChatWidget from "../components/ChatWidget";
import { api } from "../lib/api";
import { FileText, Download, Loader2, FileSpreadsheet } from "lucide-react";

const REPORT_TYPES = [
  { key: "pricing_performance", label: "Pricing Performance", desc: "Price changes, win rate, and margin impact" },
  { key: "category_profitability", label: "Category Profitability", desc: "Revenue and margin impact across products" },
  { key: "competitor_benchmark", label: "Competitor Benchmark", desc: "Your pricing vs. tracked competitors" },
  { key: "demand_summary", label: "Demand Forecast Summary", desc: "Forecasts and confidence across the catalog" },
];

const FORMATS = [
  { value: "html", label: "HTML (print to PDF)", tag: "PDF" },
  { value: "csv", label: "CSV (opens in Excel)", tag: "CSV" },
];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [type, setType] = useState(REPORT_TYPES[0].key);
  const [format, setFormat] = useState("html");
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      await api.downloadReport(type, format);
      const meta = REPORT_TYPES.find((t) => t.key === type);
      const fmt = FORMATS.find((f) => f.value === format);
      setReports((r) => [
        {
          id: `RPT-${Date.now()}`,
          name: meta.label,
          type,
          format: fmt.value,
          tag: fmt.tag,
          created: new Date().toISOString().slice(0, 10),
        },
        ...r,
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function redownload(r) {
    setDownloadingId(r.id);
    setError("");
    try {
      await api.downloadReport(r.type, r.format);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Layout
      title="BI Report Generator"
      subtitle="Generate and download business intelligence reports for stakeholders"
    >
      <div className="grid grid-cols-[1fr_380px] gap-5">
        <Card>
          <p className="font-semibold text-ink mb-4">Choose a report</p>
          <div className="grid grid-cols-2 gap-3">
            {REPORT_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`text-left p-4 rounded-xl2 border transition-colors ${
                  type === t.key ? "border-primary bg-primary-light" : "border-border hover:bg-canvas"
                }`}
              >
                <p className="font-medium text-sm text-ink">{t.label}</p>
                <p className="text-xs text-muted mt-1 leading-relaxed">{t.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <label className="text-xs font-medium text-muted">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-canvas text-sm outline-none focus:border-primary"
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={generate}
            disabled={generating}
            className="mt-5 w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Generating report…
              </>
            ) : (
              <>
                <FileText size={15} /> Generate &amp; download
              </>
            )}
          </button>
        </Card>

        <Card>
          <p className="font-semibold text-ink mb-4">Recent reports</p>
          <div className="space-y-2.5">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-canvas transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {r.format === "csv" ? (
                    <FileSpreadsheet size={17} className="text-ok shrink-0" />
                  ) : (
                    <FileText size={17} className="text-primary shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{r.name}</p>
                    <p className="text-xs text-muted">{r.created}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Pill tone="neutral">{r.tag}</Pill>
                  <button
                    onClick={() => redownload(r)}
                    disabled={downloadingId === r.id}
                    title="Download again"
                    className="text-muted hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {downloadingId === r.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <p className="text-sm text-muted text-center py-8">
                No reports generated yet. Pick a report and click Generate.
              </p>
            )}
          </div>
        </Card>
      </div>

      <ChatWidget />
    </Layout>
  );
}