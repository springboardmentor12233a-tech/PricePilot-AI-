import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../services/api";
import { KPICard, ChartCard, LoadingSpinner, ErrorState } from "../components/Common";

const OBJECTIVES = [
  { value: "revenue", label: "Revenue Maximization" },
  { value: "profit", label: "Profit Maximization" },
  { value: "demand", label: "Demand Maximization" },
  { value: "competitive", label: "Competitive Pricing" },
];

export default function PricePrediction() {
  const [productId, setProductId] = useState("");
  const [objective, setObjective] = useState("revenue");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/api/pricing/optimize", { product_id: productId.toUpperCase(), objective });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate a price recommendation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-semibold">Price Prediction & Optimization</h1>

      <form onSubmit={run} className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-400">Product ID</label>
          <input className="input !w-40" placeholder="e.g. P1000" value={productId} onChange={(e) => setProductId(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-slate-400">Objective</label>
          <select className="input !w-56" value={objective} onChange={(e) => setObjective(e.target.value)}>
            {OBJECTIVES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button className="btn-primary" disabled={loading}>{loading ? "Optimizing..." : "Generate Recommendation"}</button>
      </form>

      {error && <ErrorState message={error} />}
      {loading && <LoadingSpinner label="Simulating price candidates..." />}

      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Current Price" value={`$${result.current_price}`} />
            <KPICard label="Recommended Price" value={`$${result.recommended_price}`} accent="accent2" />
            <KPICard label="Price Change" value={`${result.price_change_pct}%`} />
            <KPICard label="Expected Demand" value={result.expected_demand} />
            <KPICard label="Expected Revenue" value={`$${result.expected_revenue.toLocaleString()}`} />
            <KPICard label="Expected Profit" value={`$${result.expected_profit.toLocaleString()}`} />
            <KPICard label="Estimated Elasticity" value={result.estimated_elasticity} />
          </div>

          <ChartCard title="Price vs Revenue / Profit / Demand">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={result.candidate_curve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="price" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="expected_revenue" stroke="#4F63E5" strokeWidth={2} dot={false} name="Revenue" />
                <Line type="monotone" dataKey="expected_profit" stroke="#12B0A0" strokeWidth={2} dot={false} name="Profit" />
                <Line type="monotone" dataKey="predicted_demand" stroke="#F5A623" strokeWidth={2} dot={false} name="Demand" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Explanation Factors">
            <pre className="text-xs bg-slate-100 dark:bg-slate-900 rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(result.explanation_factors, null, 2)}
            </pre>
            <p className="text-xs text-slate-400 mt-2">
              All figures are model estimates based on historical elasticity and current market context, not guarantees.
            </p>
          </ChartCard>
        </>
      )}
    </div>
  );
}
