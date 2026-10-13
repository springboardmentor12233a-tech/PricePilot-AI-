import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import api from "../services/api";
import { KPICard, ChartCard, LoadingSpinner, ErrorState, ConfidenceBadge } from "../components/Common";

const HORIZONS = [7, 14, 30, 90, 180, 365];

export default function DemandForecasting() {
  const [productId, setProductId] = useState("");
  const [horizon, setHorizon] = useState(30);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/api/forecast/demand", { product_id: productId.toUpperCase(), horizon_days: horizon });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate a forecast.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = result
    ? [
        ...result.historical_tail.map((h) => ({ date: h.date, actual: h.units_sold })),
        ...result.forecast.map((f) => ({ date: f.date, predicted: f.predicted_demand, lower: f.lower_bound, upper: f.upper_bound })),
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-semibold">Demand Forecasting</h1>

      <form onSubmit={run} className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-400">Product ID</label>
          <input className="input !w-40" placeholder="e.g. P1000" value={productId} onChange={(e) => setProductId(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-slate-400">Horizon (days)</label>
          <select className="input !w-40" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
            {HORIZONS.map((h) => <option key={h} value={h}>{h} days</option>)}
          </select>
        </div>
        <button className="btn-primary" disabled={loading}>{loading ? "Forecasting..." : "Generate Forecast"}</button>
      </form>

      {error && <ErrorState message={error} />}
      {loading && <LoadingSpinner label="Comparing candidate models on historical data..." />}

      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Model Used" value={result.model_used} />
            <KPICard label="Trend" value={result.trend} />
            <KPICard label="MAE" value={result.mae !== null ? result.mae.toFixed(2) : "n/a"} />
            <div className="card p-4 flex flex-col justify-center">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Confidence</div>
              <ConfidenceBadge label={result.confidence_label} score={result.confidence_score} />
            </div>
          </div>

          <ChartCard title="Historical Demand + Forecast + Confidence Interval">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} hide />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#94a3b8" strokeWidth={2} dot={false} name="Historical" />
                <Line type="monotone" dataKey="predicted" stroke="#4F63E5" strokeWidth={2} dot={false} name="Forecast" />
                <Line type="monotone" dataKey="upper" stroke="#4F63E5" strokeOpacity={0.25} dot={false} name="Upper bound" />
                <Line type="monotone" dataKey="lower" stroke="#4F63E5" strokeOpacity={0.25} dot={false} name="Lower bound" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Why this confidence score?">
            <p className="text-sm text-slate-500">{result.confidence_reason}</p>
            <p className="text-xs text-slate-400 mt-2">Candidates compared: {result.candidates_compared.join(", ")}</p>
          </ChartCard>
        </>
      )}
    </div>
  );
}
