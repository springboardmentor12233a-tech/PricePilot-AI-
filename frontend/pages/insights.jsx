import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Card } from "../components/ui";
import ChatWidget from "../components/ChatWidget";
import { api } from "../lib/api";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";

/**
 * AI Insights page.
 *
 * Fix #5: The original version fired api.productInsight() automatically via useEffect
 * on every product selection change. This consumed Groq API credits on every click
 * and was disruptive (the LLM takes 2-4s). Changed to a manual "Generate insight"
 * button pattern — consistent with how optimization.jsx already handles AI insights.
 */
export default function Insights() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");
  const [showData, setShowData] = useState(false);
  const [listError, setListError] = useState(false);

  // Load product list on mount only
  useEffect(() => {
    api
      .forecastableProducts()
      .then((data) => {
        const normalized = (data ?? []).map((p) => ({
          id: p.product_id ?? p.id,
          name: p.name,
        }));
        setProducts(normalized);
        if (normalized.length > 0) setSelectedId(String(normalized[0].id));
      })
      .catch(() => setListError(true));
  }, []);

  function onProductChange(e) {
    setSelectedId(e.target.value);
    // Reset previous insight when product changes — don't auto-fetch a new one
    setInsight(null);
    setErrored(false);
    setErrorDetail("");
    setShowData(false);
  }

  async function generateInsight() {
    const validId = parseInt(selectedId, 10);
    if (!validId || isNaN(validId)) return;

    setLoading(true);
    setErrored(false);
    setShowData(false);

    try {
      const res = await api.productInsight(validId);
      setInsight(res);
    } catch (err) {
      setErrored(true);
      setInsight(null);

      let detail = err?.body ?? "";
      try {
        const parsed = JSON.parse(detail);
        detail = parsed?.detail ?? detail;
      } catch {
        /* body wasn't JSON, use as-is */
      }

      if (Array.isArray(detail)) {
        detail = detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
      } else if (typeof detail === "object" && detail !== null) {
        detail = JSON.stringify(detail);
      }

      setErrorDetail(detail || (err?.status ? `HTTP ${err.status}` : "Network error"));
    } finally {
      setLoading(false);
    }
  }

  const b = insight?.based_on;

  return (
    <Layout
      title="AI Insights & Alerts"
      subtitle="LLM-written pricing narrative for a single product, grounded in your competitor and revenue data"
    >
      <div className="flex items-center gap-3 mb-5">
        <select
          value={selectedId}
          onChange={onProductChange}
          className="px-3.5 py-2 rounded-lg border border-border bg-panel text-sm font-medium outline-none focus:border-primary"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          onClick={generateInsight}
          disabled={loading || !selectedId}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {insight ? "Regenerate" : "Generate insight"}
        </button>
      </div>

      <Card>
        {listError && (
          <p className="py-8 text-center text-sm text-muted">
            Couldn't load the product list. Check that the backend is running and you're logged in.
          </p>
        )}

        {!listError && !selectedId && !loading && (
          <p className="py-8 text-center text-sm text-muted">No products with forecasts yet.</p>
        )}

        {!listError && selectedId && !insight && !loading && !errored && (
          <p className="py-8 text-center text-sm text-muted">
            Select a product and click "Generate insight" to get an AI-written pricing summary.
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-muted text-sm py-8 justify-center">
            <Loader2 size={16} className="animate-spin" /> Asking the model…
          </div>
        )}

        {!loading && errored && (
          <div className="text-center py-10">
            <p className="font-semibold text-ink">Couldn't load this insight</p>
            <p className="text-sm text-danger mt-2 max-w-md mx-auto mono bg-danger-light px-3 py-2 rounded-lg">
              {errorDetail}
            </p>
            <p className="text-xs text-muted mt-3 max-w-sm mx-auto">
              That message is your backend's own error detail. If it mentions an API key, check
              that GROQ_API_KEY is set in the environment where uvicorn is running.
            </p>
          </div>
        )}

        {!loading && !errored && insight && (
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
              <Sparkles size={17} className="text-primary-dark" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ink">{insight.product_name}</p>
              <p className="text-sm text-muted mt-1.5 leading-relaxed whitespace-pre-wrap">
                {insight.narrative}
              </p>

              {b && Object.keys(b).length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowData((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary-dark hover:underline"
                  >
                    <ChevronDown
                      size={13}
                      className={`transition-transform ${showData ? "rotate-180" : ""}`}
                    />
                    {showData ? "Hide" : "Show"} the data this is based on
                  </button>
                  {showData && (
                    <ul className="mt-2 space-y-1.5 text-xs text-muted bg-canvas border border-border rounded-lg p-3">
                      {b.competitor && (
                        <li>
                          Competitor: ours ₹{b.competitor.our_price} vs avg ₹{b.competitor.competitor_avg} (
                          {b.competitor.positioning})
                        </li>
                      )}
                      {b.elasticity && (
                        <li>
                          Elasticity: {Number(b.elasticity.elasticity).toFixed(2)} (
                          {b.elasticity.interpretation})
                        </li>
                      )}
                      {b.optimization && (
                        <li>
                          Recommended price: ₹{b.optimization.recommended_price} (
                          {b.optimization.expected_revenue_uplift_pct}% revenue uplift)
                        </li>
                      )}
                      {b.demand && (
                        <li>
                          Demand: {b.demand.trend} ({Number(b.demand.confidence_score).toFixed(0)}%
                          confidence)
                        </li>
                      )}
                      {!b.competitor && !b.elasticity && !b.optimization && !b.demand && (
                        <li>No supporting data was available for this product.</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-6 bg-primary-dark border-primary-dark">
        <div className="flex items-center gap-3">
          <Sparkles className="text-gold" size={20} />
          <div>
            <p className="font-semibold text-white">Want a deeper answer?</p>
            <p className="text-sm text-white/70">
              Open the Pricing Copilot in the bottom-right corner and ask about this product,
              its trend, or any number on this page.
            </p>
          </div>
        </div>
      </Card>

      <ChatWidget productId={parseInt(selectedId, 10) || null} />
    </Layout>
  );
}