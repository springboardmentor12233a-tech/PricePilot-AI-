import { useState } from "react";
import api from "../services/api";
import { ChartCard, LoadingSpinner, ErrorState, PriorityBadge, EmptyState } from "../components/Common";

export default function AIRecommendations() {
  const [productId, setProductId] = useState("");
  const [recs, setRecs] = useState(null);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/ai/recommendations", null, { params: { product_id: productId ? productId.toUpperCase() : undefined } });
      setRecs(res.data.recommendations);
      setSource(res.data.source);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-semibold">AI Recommendations</h1>

      <form onSubmit={generate} className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-400">Product ID (optional)</label>
          <input className="input !w-48" placeholder="Leave blank for global" value={productId} onChange={(e) => setProductId(e.target.value)} />
        </div>
        <button className="btn-primary" disabled={loading}>{loading ? "Analyzing..." : "Generate Recommendations"}</button>
        {source && <span className="text-xs text-slate-400">Source: {source}</span>}
      </form>

      {error && <ErrorState message={error} />}
      {loading && <LoadingSpinner label="Computing metrics and consulting AI provider..." />}

      {recs && recs.length === 0 && <EmptyState />}
      {recs && recs.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {recs.map((r, i) => (
            <ChartCard key={i} title={r.title} action={<PriorityBadge priority={r.priority} />}>
              <p className="text-xs text-slate-400 mb-2">{r.category}</p>
              <p className="text-sm mb-2"><span className="font-medium">Reason: </span>{r.reason}</p>
              <p className="text-sm mb-2"><span className="font-medium">Recommendation: </span>{r.recommendation}</p>
              <p className="text-sm mb-2"><span className="font-medium">Expected impact: </span>{r.expected_impact}</p>
              <p className="text-xs text-slate-400">Confidence: {Math.round((r.confidence || 0) * 100)}%</p>
            </ChartCard>
          ))}
        </div>
      )}
    </div>
  );
}
