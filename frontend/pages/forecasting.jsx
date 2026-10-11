import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import Layout from "../components/Layout";
import { Card, TrendPill, ConfidenceMeter } from "../components/ui";
import ChatWidget from "../components/ChatWidget";
import { api } from "../lib/api";
import { Loader2 } from "lucide-react";

const HORIZONS = [
  { key: "7d", label: "7 Days", group: "Short-term" },
  { key: "14d", label: "14 Days", group: "Short-term" },
  { key: "30d", label: "30 Days", group: "Short-term" },
  { key: "3m", label: "3 Months", group: "Medium-term" },
  { key: "6m", label: "6 Months", group: "Medium-term" },
  { key: "12m", label: "12 Months", group: "Long-term" },
];

// Maps whatever the DB stored ("30 days", "next_30_days", "90d", "1 year"...) to our keys.
function normalizeHorizon(raw) {
  const s = String(raw ?? "").toLowerCase().replace(/[_-]/g, " ").trim();
  const m = s.match(/(\d+)\s*(d|day|days|w|week|weeks|m|month|months|y|yr|year|years)?/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = (m[2] || "d")[0];
  let days = n;
  if (unit === "w") days = n * 7;
  else if (unit === "m") days = n * 30;
  else if (unit === "y") days = n * 365;
  const byDays = { 7: "7d", 14: "14d", 30: "30d", 90: "3m", 180: "6m", 360: "12m", 365: "12m" };
  return byDays[days] ?? null;
}

export default function Forecasting() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [horizon, setHorizon] = useState("30d");
  const [byHorizon, setByHorizon] = useState({});
  const [rawHorizons, setRawHorizons] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | empty | error

  useEffect(() => {
    api
      .forecastableProducts()
      .then((data) => {
        const list = (data ?? []).map((p) => ({ id: p.product_id, name: p.name }));
        setProducts(list);
        if (list.length) setSelectedId(String(list[0].id));
        else setStatus("empty");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setStatus("loading");
    api
      .productForecast(selectedId)
      .then((res) => {
        const map = {};
        const raws = [];
        (res?.forecasts ?? []).forEach((f) => {
          raws.push(f.horizon);
          const key = normalizeHorizon(f.horizon);
          // forecasts arrive newest first, so keep the first one per horizon
          if (key && !map[key]) {
            map[key] = {
              predicted_units: f.predicted_units,
              demand_trend: f.trend,
              confidence_score: f.confidence_score,
              model_used: f.model_used,
            };
          }
        });
        setRawHorizons([...new Set(raws)]);
        setByHorizon(map);
        const first = HORIZONS.find((h) => map[h.key]);
        if (first && !map[horizon]) setHorizon(first.key);
        setStatus(Object.keys(map).length ? "ok" : "empty");
      })
      .catch(() => {
        setByHorizon({});
        setStatus("empty");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const current = byHorizon[horizon];
  const activeGroup = HORIZONS.find((h) => h.key === horizon)?.group;

  const chartData = useMemo(
    () =>
      HORIZONS.filter((h) => byHorizon[h.key]).map((h) => ({
        key: h.key,
        name: h.label,
        units: byHorizon[h.key].predicted_units,
      })),
    [byHorizon]
  );

  return (
    <Layout
      title="Demand Forecasting"
      subtitle="Short, medium, and long-term demand with a confidence score for every forecast"
    >
      <div className="flex items-center gap-3 mb-5">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="px-3.5 py-2 rounded-lg border border-border bg-panel text-sm font-medium outline-none focus:border-primary"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {status === "loading" && <Loader2 size={16} className="animate-spin text-muted" />}
      </div>

      <div className="grid grid-cols-6 gap-3">
        {HORIZONS.map((h) => {
          const available = !!byHorizon[h.key];
          return (
            <button
              key={h.key}
              onClick={() => available && setHorizon(h.key)}
              disabled={!available}
              className={`px-3 py-2.5 rounded-xl2 border text-left transition-colors ${
                horizon === h.key
                  ? "border-primary bg-primary-light"
                  : "border-border bg-panel hover:bg-canvas"
              } ${available ? "" : "opacity-40 cursor-not-allowed"}`}
            >
              <p className="text-[10px] uppercase tracking-wide text-muted">{h.group}</p>
              <p className="text-sm font-semibold text-ink mt-0.5">{h.label}</p>
            </button>
          );
        })}
      </div>

      {status === "error" && (
        <Card className="mt-5">
          <p className="py-8 text-center text-sm text-muted">
            Couldn't reach the forecasting API. Check that the backend is running and you're logged in.
          </p>
        </Card>
      )}

      {status === "empty" && (
        <Card className="mt-5">
          <p className="py-8 text-center text-sm text-muted">
            No usable forecasts for this product.
            {rawHorizons.length > 0 && (
              <> The backend returned horizons: <span className="mono">{rawHorizons.join(", ")}</span>.</>
            )}
          </p>
        </Card>
      )}

      {status === "ok" && current && (
        <div className="grid grid-cols-3 gap-5 mt-5">
          <Card className="col-span-1">
            <p className="text-xs text-muted">Predicted demand · {activeGroup}</p>
            <p className="text-4xl font-bold text-ink mt-2 mono">
              {Number(current.predicted_units).toLocaleString()}
              <span className="text-base font-medium text-muted ml-1">units</span>
            </p>

            <div className="mt-5 flex items-center gap-2">
              <TrendPill trend={current.demand_trend} />
              {current.model_used && (
                <span className="text-xs text-muted px-2 py-1 rounded-full border border-border mono">
                  {current.model_used}
                </span>
              )}
            </div>

            <div className="mt-6">
              <p className="text-xs text-muted mb-1.5">Forecast confidence</p>
              <ConfidenceMeter value={current.confidence_score} />
              <p className="text-xs text-muted mt-2 leading-relaxed">
                {current.confidence_score >= 80
                  ? "High confidence — recent sales history closely matches the model's training pattern."
                  : current.confidence_score >= 60
                  ? "Moderate confidence — some recent volatility in sales or stock history."
                  : "Low confidence — treat this horizon as directional only; verify inventory and seasonality data."}
              </p>
            </div>
          </Card>

          <Card className="col-span-2">
            <p className="font-semibold text-ink mb-1">Predicted units by horizon</p>
            <p className="text-xs text-muted mb-4">Live forecasts saved for this product</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} stroke="#E4E9E7" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5C6B68" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#5C6B68" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E4E9E7", fontSize: 12 }} />
                <Bar dataKey="units" name="Predicted units" radius={[6, 6, 0, 0]} barSize={36}>
                  {chartData.map((d) => (
                    <Cell key={d.key} fill={d.key === horizon ? "#0B6E5C" : "#9DB8B1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      <ChatWidget productId={selectedId ? Number(selectedId) : null} />
    </Layout>
  );
}