import { useEffect, useState } from "react";
import api from "../services/api";
import { KPICard, ChartCard, LoadingSpinner, ErrorState } from "../components/Common";

const DATASETS = [
  { value: "product_catalog", label: "Product Catalog" },
  { value: "daily_operations", label: "Daily Operations" },
  { value: "customer_activity", label: "Customer Activity" },
  { value: "competitor_prices", label: "Competitor Prices" },
];

export default function EDA() {
  const [dataset, setDataset] = useState("daily_operations");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api.get("/api/eda/summary", { params: { dataset } })
      .then((r) => setSummary(r.data))
      .catch(() => setError("Could not load EDA summary."))
      .finally(() => setLoading(false));
  }, [dataset]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-semibold">EDA & Insights</h1>
        <select className="input !w-56" value={dataset} onChange={(e) => setDataset(e.target.value)}>
          {DATASETS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {error && <ErrorState message={error} />}
      {loading && <LoadingSpinner />}

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Rows" value={summary.rows.toLocaleString()} />
            <KPICard label="Columns" value={summary.columns.length} />
            <KPICard label="Duplicate Rows" value={summary.duplicate_rows} />
            <KPICard label="Columns with Missing Values" value={Object.keys(summary.missing_values).length} />
          </div>

          <ChartCard title="Missing Values by Column">
            {Object.keys(summary.missing_values).length === 0 ? (
              <p className="text-sm text-slate-400">No missing values detected.</p>
            ) : (
              <div className="text-sm space-y-1">
                {Object.entries(summary.missing_values).map(([col, count]) => (
                  <div key={col} className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-1">
                    <span>{col}</span><span>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Outlier Counts (IQR method)">
            <div className="text-sm space-y-1">
              {Object.entries(summary.outlier_counts).map(([col, count]) => (
                <div key={col} className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-1">
                  <span>{col}</span><span>{count}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Numeric Summary Statistics">
            <div className="overflow-x-auto">
              <pre className="text-xs bg-slate-100 dark:bg-slate-900 rounded-lg p-3">
                {JSON.stringify(summary.numeric_summary, null, 2)}
              </pre>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}
