import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Card, Pill } from "../components/ui";
import ChatWidget from "../components/ChatWidget";
import { api } from "../lib/api";
import { Loader2, Sparkles, TrendingUp, TrendingDown } from "lucide-react";

const money = (n) =>
  n == null
    ? "-"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n);
const pct = (n, d = 1) => (n == null ? "-" : `${n > 0 ? "+" : ""}${Number(n).toFixed(d)}%`);
const tone = (n) => (n > 0 ? "text-ok" : n < 0 ? "text-red-600" : "text-ink");

function Stat({ label, value, sub, valueClass = "text-ink" }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${valueClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Empty({ children }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>;
}

export default function Optimization() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [change, setChange] = useState(5);
  const [sim, setSim] = useState(null);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

  useEffect(() => {
    api
      .forecastableProducts()
      .then((list) => {
        setProducts(list);
        if (list.length) setProductId(String(list[0].product_id));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setInsight(null);
    setInsightError("");
    Promise.allSettled([
      api.revenueOptimize(productId),
      api.revenueElasticity(productId),
      api.competitorComparison(productId),
    ]).then(([opt, ela, comp]) => {
      setData({
        opt: opt.status === "fulfilled" ? opt.value : null,
        ela: ela.status === "fulfilled" ? ela.value : null,
        comp: comp.status === "fulfilled" ? comp.value : null,
      });
      setLoading(false);
    });
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    const t = setTimeout(() => {
      api.revenueSimulate(productId, change).then(setSim).catch(() => setSim(null));
    }, 400);
    return () => clearTimeout(t);
  }, [productId, change]);

  async function loadInsight() {
    setInsightLoading(true);
    setInsightError("");
    try {
      setInsight(await api.productInsight(productId));
    } catch (e) {
      setInsightError(
        e.status === 503
          ? "The AI service is unavailable. Check GROQ_API_KEY on the backend."
          : "Could not generate an insight for this product."
      );
    } finally {
      setInsightLoading(false);
    }
  }

  const { opt, ela, comp } = data;

  return (
    <Layout
      title="Revenue Optimization"
      subtitle="Optimal pricing, elasticity, what-if simulation and competitor positioning"
    >
      <div className="mb-5 flex items-center gap-3">
        <label className="text-sm font-medium text-muted">Product</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {products.map((p) => (
            <option key={p.product_id} value={p.product_id}>
              {p.name}
            </option>
          ))}
        </select>
        {loading && <Loader2 size={16} className="animate-spin text-muted" />}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <p className="mb-4 font-semibold text-ink">Optimal price recommendation</p>
          {!opt ? (
            <Empty>Not enough sales history to optimize this product.</Empty>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Current price" value={money(opt.current_price)} />
              <Stat
                label="Recommended price"
                value={money(opt.recommended_price)}
                sub={pct(opt.recommended_price_change_pct, 0) + " vs current"}
                valueClass="text-primary"
              />
              <Stat label="Current revenue" value={money(opt.current_revenue)} />
              <Stat
                label="Expected revenue"
                value={money(opt.expected_revenue)}
                sub={pct(opt.expected_revenue_uplift_pct) + " uplift"}
                valueClass={tone(opt.expected_revenue_uplift_pct)}
              />
            </div>
          )}
        </Card>

        <Card>
          <p className="mb-4 font-semibold text-ink">Price elasticity</p>
          {!ela ? (
            <Empty>Not enough price variation to estimate elasticity.</Empty>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Elasticity"
                value={Number(ela.elasticity).toFixed(2)}
                sub={ela.interpretation}
              />
              <Stat
                label="Model fit (R²)"
                value={Number(ela.r_squared).toFixed(2)}
                sub={`${ela.data_points_used} data points`}
              />
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold text-ink">What-if simulator</p>
            <Pill tone="neutral">{pct(change, 0)} price change</Pill>
          </div>
          <input
            type="range"
            min={-30}
            max={30}
            step={1}
            value={change}
            onChange={(e) => setChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>-30%</span>
            <span>0</span>
            <span>+30%</span>
          </div>
          {!sim ? (
            <Empty>No simulation available for this product.</Empty>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat
                label="Simulated price"
                value={money(sim.simulated_price)}
                sub={`from ${money(sim.current_price)}`}
              />
              <Stat
                label="Simulated units"
                value={Number(sim.simulated_qty).toFixed(1)}
                sub={`from ${Number(sim.current_avg_qty).toFixed(1)}`}
              />
              <Stat
                label="Simulated revenue"
                value={money(sim.simulated_revenue)}
                sub={`from ${money(sim.current_revenue)}`}
              />
              <Stat
                label="Revenue change"
                value={pct(sim.revenue_change_pct)}
                valueClass={tone(sim.revenue_change_pct)}
              />
            </div>
          )}
        </Card>

        <Card>
          <p className="mb-4 font-semibold text-ink">Competitor position</p>
          {!comp ? (
            <Empty>No competitor data for this product.</Empty>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Our price" value={money(comp.our_price)} />
                <Stat label="Competitor average" value={money(comp.competitor_avg)} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                {comp.price_gap_pct > 0 ? (
                  <TrendingUp size={16} className="text-red-600" />
                ) : (
                  <TrendingDown size={16} className="text-ok" />
                )}
                <span
                  className={`font-semibold ${comp.price_gap_pct > 0 ? "text-red-600" : "text-ok"}`}
                >
                  {pct(comp.price_gap_pct)}
                </span>
                <span className="text-muted">vs market</span>
                <Pill tone="neutral">{comp.positioning}</Pill>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="mt-5">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-ink">AI pricing insight</p>
            <button
              onClick={loadInsight}
              disabled={insightLoading || !productId}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {insightLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {insight ? "Regenerate" : "Generate insight"}
            </button>
          </div>
          {insightError && <p className="text-sm text-red-600">{insightError}</p>}
          {insight ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{insight.narrative}</p>
          ) : (
            !insightError && (
              <p className="text-sm text-muted">
                Click “Generate insight” for a plain-English summary of this product.
              </p>
            )
          )}
        </Card>
      </div>

      <ChatWidget productId={productId ? Number(productId) : null} />
    </Layout>
  );
}