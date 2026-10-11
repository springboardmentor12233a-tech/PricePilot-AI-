import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import Layout from "../components/Layout";
import { Card, Pill, TrendPill } from "../components/ui";
import ChatWidget from "../components/ChatWidget";
import { api } from "../lib/api";
import { mockProducts } from "../lib/mockData";
import { ArrowRight, Check, Info, Calculator, Loader2 } from "lucide-react";

const CATEGORIES = [
  "garden_tools", "electronics", "furniture", "watches_gifts", "health_beauty",
  "sports_leisure", "computers_accessories", "housewares", "toys",
];

const inr = (n) => (n == null ? "-" : `₹${Number(n).toLocaleString("en-IN")}`);

function PricePredictionCalculator() {
  const [form, setForm] = useState({
    category: CATEGORIES[0],
    freight_price: 15.5,
    lag_price: 95,
    qty: 12,
    customers: 8,
    product_score: 4.2,
    comp_1: 89.9,
    comp_2: 92.0,
    comp_3: 99.5,
    month: new Date().getMonth() + 1,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function predict() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = {
        ...form,
        freight_price: Number(form.freight_price),
        lag_price: Number(form.lag_price),
        qty: Number(form.qty),
        customers: Number(form.customers),
        product_score: Number(form.product_score),
        comp_1: form.comp_1 === "" ? null : Number(form.comp_1),
        comp_2: form.comp_2 === "" ? null : Number(form.comp_2),
        comp_3: form.comp_3 === "" ? null : Number(form.comp_3),
        month: Number(form.month),
      };
      const res = await api.predictPrice(payload);
      setResult(res);
    } catch (err) {
      setError(
        err?.status
          ? `Prediction failed (${err.status}). ${err.body ?? ""}`.slice(0, 180)
          : "Couldn't reach the backend for this prediction."
      );
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: "freight_price", label: "Freight price (₹)", step: "0.1" },
    { key: "lag_price", label: "Previous price (₹)", step: "0.1" },
    { key: "qty", label: "Units sold (prev. period)", step: "1" },
    { key: "customers", label: "Customers (prev. period)", step: "1" },
    { key: "product_score", label: "Product score (0–5)", step: "0.1" },
    { key: "comp_1", label: "Competitor 1 price (₹)", step: "0.1" },
    { key: "comp_2", label: "Competitor 2 price (₹)", step: "0.1" },
    { key: "comp_3", label: "Competitor 3 price (₹)", step: "0.1" },
  ];

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <Calculator size={16} className="text-primary" />
        <p className="font-semibold text-ink">What-if price calculator</p>
      </div>
      <p className="text-xs text-muted mb-4">
        Live call to <span className="mono">POST /api/pricing/predict</span> — adjust any
        feature and re-run the model.
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted">Category</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="mt-1 w-full px-2.5 py-2 rounded-lg border border-border bg-canvas text-sm outline-none focus:border-primary"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted">Month</label>
          <input
            type="number"
            min={1}
            max={12}
            value={form.month}
            onChange={(e) => set("month", e.target.value)}
            className="mt-1 w-full px-2.5 py-2 rounded-lg border border-border bg-canvas text-sm outline-none focus:border-primary"
          />
        </div>
        <div />
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs text-muted">{f.label}</label>
            <input
              type="number"
              step={f.step}
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-border bg-canvas text-sm outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>

      <button
        onClick={predict}
        disabled={loading}
        className="mt-4 bg-primary text-white font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-60"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Calculator size={15} />}
        {loading ? "Predicting…" : "Predict price"}
      </button>

      {error && <p className="text-sm text-danger mt-3">{error}</p>}

      {result && (
        <div className="mt-4 p-4 rounded-xl2 bg-primary-light flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Predicted price</p>
            <p className="text-2xl font-bold text-primary-dark mono">
              ₹{Number(result.predicted_price).toLocaleString("en-IN")}
            </p>
          </div>
          <span className="text-xs text-muted mono px-2 py-1 rounded-full border border-border bg-panel">
            {result.model_used}
          </span>
        </div>
      )}
    </Card>
  );
}

function horizonDays(raw) {
  const m = String(raw ?? "").match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

export default function Pricing() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [demo, setDemo] = useState(false); // true only if the backend is unreachable
  const [live, setLive] = useState({ opt: null, comp: null, ela: null, trend: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .forecastableProducts()
      .then((data) => {
        const list = (data ?? []).map((p) => ({ id: p.product_id, name: p.name }));
        setProducts(list);
        if (list.length) setSelectedId(list[0].id);
      })
      .catch(() => {
        setDemo(true);
        setProducts(mockProducts);
        setSelectedId(mockProducts[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedId || demo) return;
    setLoading(true);
    setLive({ opt: null, comp: null, ela: null, trend: null });
    Promise.allSettled([
      api.revenueOptimize(selectedId),
      api.competitorComparison(selectedId),
      api.revenueElasticity(selectedId),
      api.productForecast(selectedId),
    ]).then(([opt, comp, ela, fc]) => {
      const forecasts = fc.status === "fulfilled" ? fc.value?.forecasts ?? [] : [];
      // prefer the ~30 day forecast, otherwise the first one available
      const f30 = forecasts.find((f) => horizonDays(f.horizon) === 30) ?? forecasts[0];
      setLive({
        opt: opt.status === "fulfilled" ? opt.value : null,
        comp: comp.status === "fulfilled" ? comp.value : null,
        ela: ela.status === "fulfilled" ? ela.value : null,
        trend: f30?.trend ?? null,
      });
      setLoading(false);
    });
  }, [selectedId, demo]);

  const mock = demo ? products.find((p) => p.id === selectedId) : null;
  const base = products.find((p) => p.id === selectedId);

  const selected = {
    name: demo ? mock?.name : live.opt?.product_name ?? live.comp?.product_name ?? base?.name,
    current_price: demo ? mock?.current_price : live.opt?.current_price ?? live.comp?.our_price,
    optimal_price: demo ? mock?.optimal_price : live.opt?.recommended_price,
    competitor_price: demo ? mock?.competitor_price : live.comp?.competitor_avg,
    trend: demo ? mock?.trend : live.trend,
    positioning: live.comp?.positioning,
    category: demo ? mock?.category : null,
  };

  const hasPrices = selected.current_price != null && selected.optimal_price != null;
  const delta = hasPrices ? selected.optimal_price - selected.current_price : 0;
  const deltaPct =
    hasPrices && selected.current_price
      ? ((delta / selected.current_price) * 100).toFixed(1)
      : "0.0";

  const barData = [
    { name: "Current", value: selected.current_price, fill: "#5C6B68" },
    { name: "Competitor", value: selected.competitor_price, fill: "#C8922B" },
    { name: "Optimal", value: selected.optimal_price, fill: "#0B6E5C" },
  ].filter((d) => d.value != null);

  // "Why this price" is built from real numbers only
  const reasons = [];
  if (demo) {
    reasons.push("Backend unreachable: showing demo data.");
  } else {
    if (selected.trend)
      reasons.push(`Demand trend is ${String(selected.trend).toLowerCase()} for this product.`);
    if (live.comp)
      reasons.push(
        `Our price is ${inr(live.comp.our_price)} against a competitor average of ${inr(
          live.comp.competitor_avg
        )} (${live.comp.price_gap_pct > 0 ? "+" : ""}${Number(live.comp.price_gap_pct).toFixed(1)}%, ${
          live.comp.positioning
        }).`
      );
    if (live.ela)
      reasons.push(
        `Price elasticity is ${Number(live.ela.elasticity).toFixed(2)} (${
          live.ela.interpretation
        }), R² ${Number(live.ela.r_squared).toFixed(2)} on ${live.ela.data_points_used} data points.`
      );
    if (live.opt)
      reasons.push(
        `Moving to ${inr(live.opt.recommended_price)} is projected to change revenue by ${
          live.opt.expected_revenue_uplift_pct > 0 ? "+" : ""
        }${Number(live.opt.expected_revenue_uplift_pct).toFixed(1)}%.`
      );
  }

  const posTone = (p) => {
    const s = String(p ?? "").toLowerCase();
    if (s.includes("premium") || s.includes("over")) return "gold";
    if (s.includes("discount") || s.includes("under")) return "ok";
    return "neutral";
  };

  return (
    <Layout
      title="Price Prediction"
      subtitle="Optimal price recommendations, benchmarked against competitors"
    >
      <div className="grid grid-cols-[320px_1fr] gap-5">
        <Card className="h-fit">
          <p className="font-semibold text-ink mb-3">Catalog</p>
          <div className="space-y-1 max-h-[560px] overflow-y-auto pr-1">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  p.id === selectedId
                    ? "border-primary bg-primary-light"
                    : "border-transparent hover:bg-canvas"
                }`}
              >
                <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                {p.category && <p className="text-xs text-muted">{p.category}</p>}
              </button>
            ))}
            {products.length === 0 && (
              <p className="text-sm text-muted py-4 text-center">No products with forecasts yet.</p>
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">{selected.name ?? "Select a product"}</h2>
                {selected.category && <p className="text-sm text-muted">{selected.category}</p>}
              </div>
              <div className="flex items-center gap-2">
                {loading && <Loader2 size={15} className="animate-spin text-muted" />}
                {demo && (
                  <Pill tone="gold">
                    <Info size={12} /> demo data
                  </Pill>
                )}
                {selected.positioning && (
                  <Pill tone={posTone(selected.positioning)}>{selected.positioning}</Pill>
                )}
                {selected.trend && <TrendPill trend={selected.trend} />}
              </div>
            </div>

            {!hasPrices ? (
              <div className="py-8 text-center text-sm text-muted space-y-1">
                <p>{loading ? "Loading pricing data…" : "No price recommendation for this product."}</p>
                {!loading && (
                  <p className="text-xs mt-2">
                    Optimization: {live.opt ? "ok" : "no data"} · Competitors: {live.comp ? "ok" : "no data"} · 
                    Elasticity: {live.ela ? "ok" : "no data"} · Forecast: {live.trend ? "ok" : "no data"}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="mt-6 flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted">Current price</p>
                    <p className="text-2xl font-bold text-ink mono">{inr(selected.current_price)}</p>
                  </div>
                  <ArrowRight className="text-muted mt-4" size={20} />
                  <div>
                    <p className="text-xs text-muted">Recommended price{!demo && " · live"}</p>
                    <p className="text-2xl font-bold text-primary-dark mono">
                      {inr(selected.optimal_price)}
                    </p>
                  </div>
                  <Pill tone={delta >= 0 ? "ok" : "danger"}>
                    {delta >= 0 ? "+" : ""}
                    {deltaPct}%
                  </Pill>
                </div>

                <ResponsiveContainer width="100%" height={200} className="mt-6">
                  <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid horizontal={false} stroke="#E4E9E7" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#5C6B68" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#0E1A1A", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      formatter={(v) => inr(v)}
                      contentStyle={{ borderRadius: 10, border: "1px solid #E4E9E7", fontSize: 12 }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </Card>

          <Card>
            <p className="font-semibold text-ink mb-3">Why this price</p>
            {reasons.length === 0 ? (
              <p className="text-sm text-muted">No supporting data available for this product yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
                    <Check size={15} className="text-ok mt-0.5 shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <PricePredictionCalculator />
        </div>
      </div>

      <ChatWidget productId={demo || !selectedId ? null : Number(selectedId)} />
    </Layout>
  );
}