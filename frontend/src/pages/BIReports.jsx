import { useState } from "react";
import api from "../services/api";
import { ChartCard, LoadingSpinner, ErrorState } from "../components/Common";

const REPORT_TYPES = [
  { value: "executive", label: "Executive Report" },
  { value: "pricing", label: "Pricing Report" },
  { value: "demand_forecast", label: "Demand Forecast Report" },
  { value: "competitor", label: "Competitor Report" },
  { value: "revenue", label: "Revenue Report" },
  { value: "full_bi", label: "Full Business Intelligence Report" },
];

export default function BIReports() {
  const [form, setForm] = useState({ report_type: "executive", file_format: "pdf", category: "", product_id: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = { ...form, category: form.category || undefined, product_id: form.product_id || undefined };
      const res = await api.post("/api/reports/generate", payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-semibold">Business Intelligence Reports</h1>

      <form onSubmit={generate} className="card p-4 grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400">Report Type</label>
          <select className="input" value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
            {REPORT_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Format</label>
          <select className="input" value={form.file_format} onChange={(e) => setForm({ ...form, file_format: e.target.value })}>
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Category filter (optional)</label>
          <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-slate-400">Product ID filter (optional)</label>
          <input className="input" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <button className="btn-primary" disabled={loading}>{loading ? "Generating..." : "Generate Report"}</button>
        </div>
      </form>

      {error && <ErrorState message={error} />}
      {loading && <LoadingSpinner />}

      {result && (
        <ChartCard title="Report Ready">
          <button
            className="btn-primary"
            onClick={async () => {
              const res = await api.get(`/api/reports/${result.report_id}/download`, { responseType: "blob" });
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const a = document.createElement("a");
              a.href = url;
              a.download = `${form.report_type}.${form.file_format}`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
          >
            Download Report
          </button>
        </ChartCard>
      )}
    </div>
  );
}
