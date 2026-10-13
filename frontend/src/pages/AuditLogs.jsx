import { useEffect, useState } from "react";
import api from "../services/api";
import { DataTable, LoadingSpinner, ErrorState } from "../components/Common";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/audit")
      .then((r) => setLogs(r.data))
      .catch(() => setError("Could not load audit logs."))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "timestamp", label: "Timestamp", render: (r) => new Date(r.timestamp).toLocaleString() },
    { key: "user_id", label: "User", render: (r) => r.user_id ? r.user_id.slice(0, 8) : "system" },
    { key: "action", label: "Action" },
    { key: "metadata_json", label: "Metadata", render: (r) => <code className="text-xs">{JSON.stringify(r.metadata_json)}</code> },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-semibold">Audit Logs</h1>
      <div className="card p-4">
        <DataTable columns={columns} rows={logs} keyField="id" />
      </div>
    </div>
  );
}
