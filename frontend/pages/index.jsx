import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  ComposedChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Layout from "../components/Layout";
import { Card, KpiCard, Pill } from "../components/ui";
import ChatWidget from "../components/ChatWidget";
import { api } from "../lib/api";
import { mockKpis, mockSalesTrend } from "../lib/mockData";
import { Brain, Database, Activity, CheckCircle2 } from "lucide-react";

const DONUT_COLORS = ["#0B6E5C", "#C8922B", "#2E9361", "#5C6B68", "#8A6DAE", "#C3453B"];

// Shape of GET /api/dashboard/overview (DashboardOverview):
//   revenue, top_products, pricing_performance, forecast_summary,
//   revenue_by_month [{period, revenue}], revenue_by_category [{category, revenue}]

const FALLBACK_OVERVIEW = {
  revenue: {
    total_revenue: mockKpis.revenue_30d,
    total_units_sold: 9400,
    average_order_value: 2140,
    products_tracked: mockKpis.products_tracked,
  },
  top_products: [],
  pricing_performance: {
    total_products_with_pricing: mockKpis.products_tracked,
    average_unit_price: 2140,
    products_overpriced: 18,
    products_underpriced: 11,
    products_competitive: 94,
  },
  forecast_summary: {
    products_with_forecasts: 212,
    average_confidence_score: mockKpis.avg_forecast_confidence,
    increasing_trend_count: 120,
    stable_trend_count: 70,
    decreasing_trend_count: 22,
  },
  revenue_by_month: mockSalesTrend.map((d) => ({ period: d.day, revenue: d.revenue })),
  revenue_by_category: [
    { category: "Electronics", revenue: 182000 },
    { category: "Footwear", revenue: 96000 },
    { category: "Home", revenue: 74000 },
    { category: "Furniture", revenue: 61000 },
    { category: "Wearables", revenue: 44000 },
  ],
};

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "-");

export default function Dashboard() {
  const [overview, setOverview] = useState(FALLBACK_OVERVIEW);
  const [isLive, setIsLive] = useState(false);
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    api
      .dashboardOverview()
      .then((data) => {
        setOverview(data);
        setIsLive(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .competitorOpportunities()
      .then((data) => setOpportunities(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const revenue = overview.revenue ?? FALLBACK_OVERVIEW.revenue;
  const forecast_summary = overview.forecast_summary ?? FALLBACK_OVERVIEW.forecast_summary;
  const pricing_performance = overview.pricing_performance ?? FALLBACK_OVERVIEW.pricing_performance;
  const revenue_by_month = overview.revenue_by_month ?? [];
  const revenue_by_category = overview.revenue_by_category ?? [];
  const top_products = overview.top_products ?? [];

  const tooltipStyle = { borderRadius: 10, border: "1px solid #E4E9E7", fontSize: 12 };
  const noData = (
    <div className="flex h-[240px] items-center justify-center text-sm text-muted">
      No data yet.
    </div>
  );

  return (
    <Layout
      title="Executive Dashboard"
      subtitle="Revenue, pricing performance, and demand health across your catalog"
    >
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-5">
        <KpiCard label="Total revenue" value={(revenue.total_revenue ?? 0).toLocaleString("en-IN")} prefix="₹" />
        <KpiCard
          label="Avg. order value"
          value={Math.round(revenue.average_order_value ?? 0).toLocaleString("en-IN")}
          prefix="₹"
        />
        <KpiCard
          label="Forecast confidence"
          value={Math.round(forecast_summary.average_confidence_score ?? 0)}
          suffix="%"
        />
        <KpiCard label="Units sold" value={(revenue.total_units_sold ?? 0).toLocaleString()} />
        <KpiCard label="Active products" value={(revenue.products_tracked ?? 0).toLocaleString()} />
        <KpiCard label="Price opportunities" value={opportunities.length} />
      </div>

      <div className="grid grid-cols-3 gap-5 mt-5">
        <Card className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-ink">Revenue by month</p>
              <p className="text-xs text-muted">{isLive ? "Live from your database" : "Demo data"}</p>
            </div>
          </div>
          {revenue_by_month.length === 0 ? (
            noData
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenue_by_month}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B6E5C" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0B6E5C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E4E9E7" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#5C6B68" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#5C6B68" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#0B6E5C" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <p className="font-semibold text-ink mb-1">Revenue by category</p>
          <p className="text-xs text-muted mb-4">{isLive ? "Live from your database" : "Demo data"}</p>
          {revenue_by_category.length === 0 ? (
            noData
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenue_by_category} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} stroke="#E4E9E7" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "#0E1A1A" }}
                  axisLine={false}
                  tickLine={false}
                  width={85}
                />
                <Tooltip formatter={(v) => inr(Number(v))} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" fill="#C8922B" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5 mt-5">
        <Card>
          <p className="font-semibold text-ink mb-1">Category revenue (donut)</p>
          <p className="text-xs text-muted mb-1">{isLive ? "Live from your database" : "Demo data"}</p>
          {revenue_by_category.length === 0 ? (
            noData
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={revenue_by_category}
                  dataKey="revenue"
                  nameKey="category"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {revenue_by_category.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => inr(Number(v))} contentStyle={tooltipStyle} />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-ink">Monthly revenue trajectory</p>
              <p className="text-xs text-muted">Same data as above, bar + trend line view</p>
            </div>
          </div>
          {revenue_by_month.length === 0 ? (
            noData
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={revenue_by_month}>
                <CartesianGrid vertical={false} stroke="#E4E9E7" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#5C6B68" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#5C6B68" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => inr(Number(v))} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" name="Revenue" fill="#C8922B" radius={[4, 4, 0, 0]} barSize={18} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Trend"
                  stroke="#0B6E5C"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#0B6E5C" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <p className="font-semibold text-ink mb-4">Business health</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              icon: Brain,
              label: "Demand model",
              status: forecast_summary.products_with_forecasts > 0 ? "Operational" : "No forecasts yet",
              ok: forecast_summary.products_with_forecasts > 0,
            },
            {
              icon: Activity,
              label: "Pricing model",
              status: pricing_performance.total_products_with_pricing > 0 ? "Operational" : "No pricing data",
              ok: pricing_performance.total_products_with_pricing > 0,
            },
            {
              icon: Database,
              label: "Revenue data",
              status: revenue.total_revenue > 0 ? "Loaded" : "Empty",
              ok: revenue.total_revenue > 0,
            },
            {
              icon: CheckCircle2,
              label: "Dashboard API",
              status: isLive ? "Live" : "Demo data",
              ok: isLive,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl2 border border-border">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  item.ok ? "bg-ok-light text-ok" : "bg-gold-light text-gold"
                }`}
              >
                <item.icon size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{item.label}</p>
                <p className="text-xs text-muted">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-5 mt-5">
        <Card>
          <p className="font-semibold text-ink mb-1">Pricing performance</p>
          <p className="text-xs text-muted mb-4">
            {pricing_performance.total_products_with_pricing} products with pricing data
          </p>
          <div className="space-y-3">
            {[
              { label: "Competitive", value: pricing_performance.products_competitive, tone: "ok" },
              { label: "Overpriced", value: pricing_performance.products_overpriced, tone: "gold" },
              { label: "Underpriced", value: pricing_performance.products_underpriced, tone: "danger" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <Pill tone={row.tone}>{row.label}</Pill>
                <span className="text-sm font-semibold text-ink mono">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="font-semibold text-ink mb-1">Demand trend mix</p>
          <p className="text-xs text-muted mb-4">
            {forecast_summary.products_with_forecasts} products forecasted
          </p>
          <div className="space-y-3">
            {[
              { label: "Increasing", value: forecast_summary.increasing_trend_count, tone: "ok" },
              { label: "Stable", value: forecast_summary.stable_trend_count, tone: "neutral" },
              { label: "Decreasing", value: forecast_summary.decreasing_trend_count, tone: "danger" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <Pill tone={row.tone}>{row.label}</Pill>
                <span className="text-sm font-semibold text-ink mono">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="font-semibold text-ink mb-1">Top products</p>
          <p className="text-xs text-muted mb-4">By total revenue</p>
          <div className="space-y-2.5">
            {top_products.slice(0, 5).map((p) => (
              <div key={p.product_id} className="flex items-center justify-between text-sm">
                <span className="text-ink truncate">{p.product_name}</span>
                <span className="font-semibold text-primary-dark mono shrink-0 ml-2">
                  {inr(p.total_revenue)}
                </span>
              </div>
            ))}
            {top_products.length === 0 && <p className="text-xs text-muted">No data yet.</p>}
          </div>
        </Card>
      </div>

      {opportunities.length > 0 && (
        <Card className="mt-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-ink">Pricing opportunities</p>
            <span className="text-xs text-muted">Live from /api/competitor/opportunities</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-border">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Our price</th>
                  <th className="pb-2 font-medium">Competitor avg</th>
                  <th className="pb-2 font-medium">Gap</th>
                  <th className="pb-2 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.slice(0, 8).map((o) => {
                  const gap = o.price_gap_pct ?? o.gap_pct;
                  const type = o.opportunity_type ?? o.type ?? o.positioning ?? "-";
                  return (
                    <tr key={o.product_id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium text-ink">{o.product_name}</td>
                      <td className="py-3 mono">{inr(o.our_price)}</td>
                      <td className="py-3 mono text-muted">{inr(o.competitor_avg)}</td>
                      <td className="py-3 mono">
                        {typeof gap === "number" ? `${gap > 0 ? "+" : ""}${gap.toFixed(1)}%` : "-"}
                      </td>
                      <td className="py-3">
                        <Pill tone={String(type).toLowerCase().includes("over") ? "gold" : "danger"}>
                          {type}
                        </Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ChatWidget />
    </Layout>
  );
}