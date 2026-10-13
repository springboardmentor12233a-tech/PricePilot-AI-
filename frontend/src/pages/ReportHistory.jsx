import { useEffect, useState } from "react";
import api from "../services/api";
import { DataTable, LoadingSpinner, ErrorState } from "../components/Common";

export default function ReportHistory() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/reports")
      .then((r) => setReports(r.data))
      .catch(() => setError("Could not load report history."))
      .finally(() => setLoading(false));
  }, []);

  const download = async (id, format) => {
    const res = await api.get(`/api/reports/${id}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `report.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    { key: "id", label: "Report ID", render: (r) => r.id.slice(0, 8) },
    { key: "report_type", label: "Type" },
    { key: "file_format", label: "Format" },
    { key: "created_at", label: "Generated", render: (r) => new Date(r.created_at).toLocaleString() },
    { key: "download", label: "", render: (r) => <button className="btn-secondary text-xs" onClick={() => download(r.id, r.file_format)}>Download</button> },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-semibold">Report History</h1>
      <div className="card p-4">
        <DataTable columns={columns} rows={reports} keyField="id" />
      </div>
    </div>
  );
}
