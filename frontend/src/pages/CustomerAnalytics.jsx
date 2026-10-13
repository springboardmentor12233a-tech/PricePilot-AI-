import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../services/api";
import { KPICard, ChartCard, LoadingSpinner, ErrorState } from "../components/Common";

export default function CustomerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/customers/analytics")
      .then((r) => setData(r.data))
      .catch(() => setError("Could not load customer analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!data?.has_data) return <ErrorState message="No customer activity data found." />;

  const funnelData = [
    { stage: "View", value: data.funnel.view },
    { stage: "Add to Cart", value: data.funnel.add_to_cart },
    { stage: "Purchase", value: data.funnel.purchase },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-semibold">Customer Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Conversion Rate" value={`${data.conversion_rate_pct}%`} />
        <KPICard label="Average Order Value" value={`$${data.average_order_value}`} />
        <KPICard label="Views" value={data.funnel.view.toLocaleString()} />
        <KPICard label="Purchases" value={data.funnel.purchase.toLocaleString()} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Sales Funnel: View → Cart → Purchase">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#4F63E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Customer Segment">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.revenue_by_segment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="customer_segment" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="total_amount" fill="#12B0A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Channel">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.revenue_by_channel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="total_amount" fill="#F5A623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Device Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.device_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="device" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="events" fill="#E1523D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
