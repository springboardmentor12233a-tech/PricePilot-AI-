import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../services/api";
import { KPICard, ChartCard, LoadingSpinner, ErrorState } from "../components/Common";

export default function PricingAnalytics() {
  const [kpis, setKpis] = useState(null);
  const [priceTrend, setPriceTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/dashboard/kpis"),
      api.get("/api/dashboard/trend", { params: { metric: "price" } }),
      api.get("/api/dashboard/breakdown", { params: { by: "category" } }),
    ])
      .then(([k, t, b]) => { setKpis(k.data); setPriceTrend(t.data); setBreakdown(b.data); })
      .catch(() => setError("Could not load pricing analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!kpis?.has_data) return <ErrorState message="No pricing data available." />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-semibold">Pricing Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Average Price" value={`$${kpis.average_price}`} />
        <KPICard label="Average Discount" value={`${kpis.average_discount_pct}%`} />
        <KPICard label="Profit Margin (est.)" value={`${kpis.profit_margin_pct_estimated}%`} />
        <KPICard label="Competitor Price Gap" value={`$${kpis.competitor_price_gap}`} />
      </div>

      <ChartCard title="Average Price Trend">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={priceTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
            <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#4F63E5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Revenue by Category">
        <div className="space-y-2">
          {breakdown.map((b) => (
            <div key={b.label} className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 py-2">
              <span>{b.label}</span>
              <span className="font-medium">${b.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
