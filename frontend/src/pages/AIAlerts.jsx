import { useEffect, useState } from "react";
import api from "../services/api";
import { ChartCard, LoadingSpinner, ErrorState, SeverityBadge, EmptyState } from "../components/Common";

export default function AIAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/alerts", { params: { severity: severity || undefined, search: search || undefined } });
      setAlerts(res.data);
    } catch {
      setError("Could not load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [severity]);

  const generate = async () => {
    setGenerating(true);
    try {
      await api.post("/api/alerts/generate");
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const markRead = async (id) => {
    await api.patch(`/api/alerts/${id}/read`);
    load();
  };
  const archive = async (id) => {
    await api.patch(`/api/alerts/${id}/archive`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-display font-semibold">AI Alerts</h1>
        <div className="flex gap-2 flex-wrap">
          <input className="input !w-48" placeholder="Search alerts..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
          <select className="input !w-40" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <button className="btn-primary" onClick={generate} disabled={generating}>
            {generating ? "Scanning..." : "Generate Alerts"}
          </button>
        </div>
      </div>

      {error && <ErrorState message={error} />}
      {loading ? <LoadingSpinner /> : alerts.length === 0 ? <EmptyState /> : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <ChartCard key={a.id} title={a.title} action={<SeverityBadge severity={a.severity} />}>
              <p className="text-sm text-slate-500">{a.message}</p>
              <div className="flex gap-2 mt-3">
                {!a.is_read && <button className="btn-secondary text-xs" onClick={() => markRead(a.id)}>Mark as read</button>}
                <button className="btn-secondary text-xs" onClick={() => archive(a.id)}>Archive</button>
              </div>
            </ChartCard>
          ))}
        </div>
      )}
    </div>
  );
}
