import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { DataTable, LoadingSpinner, ErrorState } from "../components/Common";

export default function Products() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/products", { params: { search: search || undefined, page, page_size: 15 } });
      setData(res.data);
    } catch {
      setError("Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const columns = [
    { key: "product_name", label: "Product", render: (r) => <Link to={`/products/${r.product_id}`} className="text-accent hover:underline">{r.product_name}</Link> },
    { key: "category", label: "Category" },
    { key: "brand", label: "Brand" },
    { key: "cost_price", label: "Cost Price", render: (r) => `$${r.cost_price?.toFixed(2)}` },
    { key: "current_price", label: "Current Price", render: (r) => `$${r.current_price?.toFixed(2)}` },
    { key: "rating", label: "Rating", render: (r) => `${r.rating} ★ (${r.num_reviews})` },
    { key: "is_active", label: "Status", render: (r) => (r.is_active ? "Active" : "Inactive") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-semibold">Products</h1>
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="flex gap-2">
          <input className="input !w-56" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-secondary">Search</button>
        </form>
      </div>
      {error && <ErrorState message={error} />}
      {loading ? <LoadingSpinner /> : (
        <div className="card p-4">
          <DataTable columns={columns} rows={data?.items || []} keyField="product_id" />
          <div className="flex justify-between items-center mt-4 text-sm">
            <span className="text-slate-400">{data?.total} products</span>
            <div className="flex gap-2">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button className="btn-secondary" disabled={(data?.items || []).length < 15} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
