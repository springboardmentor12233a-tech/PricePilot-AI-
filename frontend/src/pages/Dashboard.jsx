import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import api from "../services/api";
import { KPICard, ChartCard, LoadingSpinner, ErrorState, EmptyState } from "../components/Common";

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [options, setOptions] = useState({ categories: [], channels: [], warehouses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (f) => {
    setLoading(true);
    setError("");
    try {
      const params = f;
      const [k, t, b, tp] = await Promise.all([
        api.get("/api/dashboard/kpis", { params }),
        api.get("/api/dashboard/trend", { params: { ...params, metric: "revenue" } }),
        api.get("/api/dashboard/breakdown", { params: { ...params, by: "category" } }),
        api.get("/api/dashboard/top-products", { params: { ...params, n: 5 } }),
      ]);
      setKpis(k.data);
      setTrend(t.data);
      setBreakdown(b.data);
      setTopProducts(tp.data);
    } catch (e) {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/api/dashboard/filters/options").then((r) => setOptions(r.data)).catch(() => {});
    load({});
  }, []);

  const applyFilter = (key, value) => {
    const next = { ...filters, [key]: value || undefined };
    setFilters(next);
    load(next);
  };

  if (loading && !kpis) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;
  if (!kpis?.has_data) return <EmptyState message="No operational data found. Run scripts/prepare_data.py first." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-display font-semibold">Executive Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          <select className="input !w-auto" onChange={(e) => applyFilter("category", e.target.value)}>
            <option value="">All categories</option>
            {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input !w-auto" onChange={(e) => applyFilter("channel", e.target.value)}>
            <option value="">All channels</option>
            {options.channels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KPICard label="Total Revenue" value={`$${kpis.total_revenue.toLocaleString()}`} />
        <KPICard label="Units Sold" value={kpis.total_units_sold.toLocaleString()} />
        <KPICard label="Average Price" value={`$${kpis.average_price}`} />
        <KPICard label="Average Discount" value={`${kpis.average_discount_pct}%`} />
        <KPICard label="Gross Profit (est.)" value={`$${kpis.gross_profit_estimated.toLocaleString()}`} />
        <KPICard label="Profit Margin (est.)" value={`${kpis.profit_margin_pct_estimated}%`} />
        <KPICard label="Active Products" value={kpis.active_products} />
        <KPICard label="Avg Demand Index" value={kpis.average_demand_index} />
        <KPICard label="Stockout Rate" value={`${kpis.stockout_rate_pct}%`} />
        <KPICard label="Avg Competitor Price" value={`$${kpis.average_competitor_price}`} />
        <KPICard label="Competitor Price Gap" value={`$${kpis.competitor_price_gap}`} />
        <KPICard label="Conversion Rate" value={`${kpis.customer_conversion_rate_pct}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#4F63E5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Revenue by Category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={breakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#12B0A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Top Products by Revenue">
        <div className="space-y-2">
          {topProducts.map((p) => (
            <div key={p.product_id} className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 py-2">
              <span>{p.product_name} <span className="text-slate-400">({p.category})</span></span>
              <span className="font-medium">${p.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
