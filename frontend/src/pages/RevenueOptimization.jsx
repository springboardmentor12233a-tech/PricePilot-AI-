import { useState } from "react";
import api from "../services/api";
import { ChartCard, LoadingSpinner, ErrorState, DataTable } from "../components/Common";

export default function RevenueOptimization() {
  const [productId, setProductId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.get(`/api/revenue/optimize/${productId.toUpperCase()}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not run revenue optimization.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "scenario", label: "Scenario" },
    { key: "price", label: "Price", render: (r) => `$${r.price}` },
    { key: "predicted_demand", label: "Predicted Demand" },
    { key: "expected_revenue", label: "Expected Revenue", render: (r) => `$${r.expected_revenue.toLocaleString()}` },
    { key: "expected_profit", label: "Expected Profit", render: (r) => `$${r.expected_profit.toLocaleString()}` },
    { key: "revenue_difference", label: "Δ Revenue vs Current", render: (r) => `$${r.revenue_difference.toLocaleString()}` },
    { key: "profit_difference", label: "Δ Profit vs Current", render: (r) => `$${r.profit_difference.toLocaleString()}` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-semibold">Revenue Optimization</h1>

      <form onSubmit={run} className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-400">Product ID</label>
          <input className="input !w-40" placeholder="e.g. P1000" value={productId} onChange={(e) => setProductId(e.target.value)} required />
        </div>
        <button className="btn-primary" disabled={loading}>{loading ? "Simulating..." : "Run Scenarios"}</button>
      </form>

      {error && <ErrorState message={error} />}
      {loading && <LoadingSpinner label="Simulating current / recommended / conservative / aggressive scenarios..." />}

      {result && (
        <ChartCard title={`Scenario Comparison — ${result.product_id}`}>
          <DataTable columns={columns} rows={result.scenarios} keyField="scenario" />
          <p className="text-xs text-slate-400 mt-3">{result.note} Elasticity used: {result.elasticity_used}</p>
        </ChartCard>
      )}
    </div>
  );
}
