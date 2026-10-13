import { useEffect, useState } from "react";
import api from "../services/api";
import { DataTable, LoadingSpinner, ErrorState } from "../components/Common";

export default function CompetitorAnalysis() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/competitors")
      .then((r) => setRows(r.data))
      .catch(() => setError("Could not load competitor data."))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "product_id", label: "Product" },
    { key: "final_price", label: "Our Price", render: (r) => `$${r.final_price ?? "-"}` },
    { key: "competitor_avg", label: "Competitor Avg", render: (r) => `$${r.competitor_avg}` },
    { key: "competitor_min", label: "Competitor Min", render: (r) => `$${r.competitor_min}` },
    { key: "competitor_max", label: "Competitor Max", render: (r) => `$${r.competitor_max}` },
    { key: "num_competitors", label: "# Competitors" },
    { key: "price_gap", label: "Price Gap", render: (r) => `$${r.price_gap ?? "-"}` },
    { key: "availability_pct", label: "Availability", render: (r) => `${r.availability_pct}%` },
    { key: "positioning", label: "Positioning" },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-semibold">Competitor Analysis</h1>
      <p className="text-sm text-slate-400">
        Positioning is descriptive only (below / near / above market average) based on the most recent competitor snapshot per product.
      </p>
      <div className="card p-4">
        <DataTable columns={columns} rows={rows} keyField="product_id" />
      </div>
    </div>
  );
}
