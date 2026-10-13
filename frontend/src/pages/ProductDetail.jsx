import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../services/api";
import { KPICard, ChartCard, LoadingSpinner, ErrorState, ConfidenceBadge } from "../components/Common";

export default function ProductDetail() {
  const { productId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get(`/api/products/${productId}`)
      .then((r) => setData(r.data))
      .catch(() => setError("Could not load product."))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const { product, kpis, forecast_30d, price_optimization, competitor_analysis, price_history } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-semibold">{product.product_name}</h1>
        <p className="text-sm text-slate-400">{product.category} · {product.subcategory} · {product.brand}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Cost Price" value={`$${product.cost_price?.toFixed(2)}`} />
        <KPICard label="Base Price" value={`$${product.base_price?.toFixed(2)}`} />
        <KPICard label="Revenue (all-time)" value={kpis.has_data ? `$${kpis.total_revenue.toLocaleString()}` : "-"} />
        <KPICard label="Units Sold" value={kpis.has_data ? kpis.total_units_sold : "-"} />
      </div>

      <ChartCard title="Price History">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={price_history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
            <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
            <Tooltip />
            <Line type="monotone" dataKey="final_price" stroke="#4F63E5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {price_optimization && (
        <ChartCard title="Recommended Price (Revenue Maximization)">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Current Price" value={`$${price_optimization.current_price}`} />
            <KPICard label="Recommended Price" value={`$${price_optimization.recommended_price}`} accent="accent2" />
            <KPICard label="Price Change" value={`${price_optimization.price_change_pct}%`} />
            <KPICard label="Expected Revenue" value={`$${price_optimization.expected_revenue.toLocaleString()}`} />
          </div>
          <p className="text-xs text-slate-400 mt-3">Model estimate, not a guarantee. Estimated elasticity: {price_optimization.estimated_elasticity}</p>
        </ChartCard>
      )}

      {forecast_30d && (
        <ChartCard title="30-Day Demand Forecast" action={<ConfidenceBadge label={forecast_30d.confidence_label} score={forecast_30d.confidence_score} />}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={forecast_30d.forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="predicted_demand" stroke="#12B0A0" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="upper_bound" stroke="#12B0A0" strokeOpacity={0.3} dot={false} />
              <Line type="monotone" dataKey="lower_bound" stroke="#12B0A0" strokeOpacity={0.3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-2">Trend: {forecast_30d.trend} · Model: {forecast_30d.model_used}</p>
        </ChartCard>
      )}

      {competitor_analysis?.length > 0 && (
        <ChartCard title="Competitor Positioning">
          {competitor_analysis.map((c) => (
            <div key={c.product_id} className="text-sm flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span>Our price: ${c.final_price} vs avg ${c.competitor_avg}</span>
              <span className="text-slate-400">{c.positioning}</span>
            </div>
          ))}
        </ChartCard>
      )}
    </div>
  );
}
