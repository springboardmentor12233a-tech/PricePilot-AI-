"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProducts, getStockAlerts, createRestockRequest, getRestockRequests,
  getPriceRecommendation, getAIInsights,
} from "../lib/api";
import { SkeletonDashboard } from "../components/Skeleton";

interface Product {
  id: number;
  product_name: string;
  category: string;
  brand: string;
  base_price: number;
  current_price: number;
  inventory_level: number;
}

interface StockAlert {
  product_id: number;
  product_name: string;
  inventory_level: number;
  status: string;
  severity: string;
  message: string;
}

interface RestockRow {
  id: number;
  product_id: number;
  product_name: string;
  requested_by: string;
  quantity: number;
  status: string;
  created_at: string | null;
}

interface Recommendation {
  price: number;
  discount: number;
  units: number;
  estimated: boolean;
}

function stockState(qty: number, low: number, surplus: number) {
  if (qty <= 0) return { label: "Out of stock", color: "#ef4444" };
  if (qty < low) return { label: "Low stock", color: "#f87171" };
  if (qty > surplus) return { label: "Surplus", color: "#fbbf24" };
  return { label: "Healthy", color: "#0fd8a0" };
}

export default function StockPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [thresholds, setThresholds] = useState({ low_stock: 100, surplus: 500 });
  const [requests, setRequests] = useState<RestockRow[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [qtyInputs, setQtyInputs] = useState<Record<number, string>>({});
  const [recs, setRecs] = useState<Record<number, Recommendation>>({});
  const [recLoading, setRecLoading] = useState<number | null>(null);
  const [advice, setAdvice] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      setRole(JSON.parse(atob(token.split(".")[1])).role || "");
    } catch {}
    loadAll(token);
  }, []);

  async function loadAll(token: string) {
    try {
      const [productList, alertData, requestList] = await Promise.all([
        getProducts(),
        getStockAlerts(token),
        getRestockRequests(token),
      ]);
      setProducts(productList);
      setAlerts(alertData.stock_alerts);
      setThresholds(alertData.thresholds);
      setRequests(requestList);
    } catch {
      setError("Could not load stock data. Please sign in again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestock(product: Product) {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const quantity = parseInt(qtyInputs[product.id] || "", 10);
    if (!quantity || quantity <= 0) {
      setError("Enter a restock quantity greater than 0.");
      return;
    }
    setError("");
    try {
      await createRestockRequest({ product_id: product.id, quantity }, token);
      setNotice(`Restock request for ${quantity} units of ${product.product_name} submitted.`);
      setQtyInputs({ ...qtyInputs, [product.id]: "" });
      setRequests(await getRestockRequests(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    }
  }

  async function checkRecommendation(p: Product) {
    setRecLoading(p.id);
    setError("");
    try {
      // Same context values as the Analyst page (they match the Jan-Mar training period)
      const result = await getPriceRecommendation({
        category: p.category,
        brand: p.brand,
        region: "AU",
        channel: "mobile",
        season: "Winter",
        base_price: p.base_price,
        inventory_level: p.inventory_level,
        month: 1,
        day_of_week: 3,
      });
      setRecs({
        ...recs,
        [p.id]: {
          price: result.recommended.price,
          discount: result.recommended.discount_pct,
          units: result.recommended.predicted_units_sold,
          estimated: result.estimated,
        },
      });
    } catch {
      setError(`Could not get a price recommendation for ${p.product_name}.`);
    } finally {
      setRecLoading(null);
    }
  }

  async function generateAdvice() {
    setAdviceLoading(true);
    try {
      const summary =
        alerts.length === 0
          ? "All products have healthy stock levels."
          : alerts.map((a) => `${a.product_name}: ${a.inventory_level} units (${a.status.replace("_", " ")})`).join("; ");
      const result = await getAIInsights(
        `Inventory status for ${products.length} products. ${summary}. Low-stock threshold is ${thresholds.low_stock} units and surplus threshold is ${thresholds.surplus} units. Give a short, practical recommendation on what to restock or promote first.`
      );
      setAdvice(result.insight);
    } catch {
      setAdvice("Could not generate advice. Please try again.");
    } finally {
      setAdviceLoading(false);
    }
  }

  if (loading) return <SkeletonDashboard />;

  const lowCount = products.filter((p) => p.inventory_level < thresholds.low_stock).length;
  const surplusCount = products.filter((p) => p.inventory_level > thresholds.surplus).length;
  const healthyCount = products.length - lowCount - surplusCount;
  const barScale = thresholds.surplus * 1.2;

  return (
    <div className="min-h-screen">
      <div className="status-strip px-8 py-4 flex items-center justify-between">
        <div />
        <span className="text-sm muted-text">{role}</span>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Stock & Alerts</h1>
          <p className="muted-text text-sm">
            Inventory health, restock requests and AI advice (low below {thresholds.low_stock} units, surplus above {thresholds.surplus})
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex justify-between">
            {error}
            <button onClick={() => setError("")} className="text-xs underline">dismiss</button>
          </div>
        )}
        {notice && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex justify-between">
            {notice}
            <button onClick={() => setNotice("")} className="text-xs underline">dismiss</button>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-5">
            <p className="text-xs muted-text mb-2 uppercase tracking-wide">Healthy</p>
            <p className="mono accent-text font-bold text-2xl">{healthyCount}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs muted-text mb-2 uppercase tracking-wide">Low / Out of stock</p>
            <p className="mono text-red-400 font-bold text-2xl">{lowCount}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs muted-text mb-2 uppercase tracking-wide">Surplus</p>
            <p className="mono text-yellow-400 font-bold text-2xl">{surplusCount}</p>
          </div>
        </div>

        {/* AI advice */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold mb-1">AI Stock Advice</h2>
              <p className="text-xs muted-text-2">Generated from your current stock levels</p>
            </div>
            <button
              onClick={generateAdvice}
              disabled={adviceLoading}
              className="accent-btn text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {adviceLoading ? "Analyzing..." : "✨ Get Advice"}
            </button>
          </div>
          {advice ? (
            <div className="terminal-card p-4">
              <p className="text-sm leading-relaxed">{advice}</p>
            </div>
          ) : (
            <p className="muted-text text-sm">Click &quot;Get Advice&quot; for a short restock and promotion recommendation.</p>
          )}
        </div>

        {/* Product stock cards */}
        <h2 className="text-lg font-semibold mb-3">Product Stock Health</h2>
        {products.length === 0 ? (
          <div className="glass-card p-8 text-center mb-6">
            <p className="muted-text">No products found.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {products.map((p) => {
              const state = stockState(p.inventory_level, thresholds.low_stock, thresholds.surplus);
              const width = Math.min(100, Math.max(0, (p.inventory_level / barScale) * 100));
              const rec = recs[p.id];
              return (
                <div key={p.id} className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{p.product_name}</h3>
                      <p className="text-xs muted-text-2">{p.category} · {p.brand}</p>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: state.color }}>
                      {state.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="muted-text">Inventory</span>
                    <span className="mono font-bold">{p.inventory_level} units</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-4">
                    <div className="h-full rounded-full" style={{ width: `${width}%`, background: state.color }} />
                  </div>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="number"
                      min={1}
                      placeholder="Quantity"
                      value={qtyInputs[p.id] || ""}
                      onChange={(e) => setQtyInputs({ ...qtyInputs, [p.id]: e.target.value })}
                      className="input-field flex-1 px-3 py-2 rounded-lg text-sm text-white"
                    />
                    <button
                      onClick={() => handleRestock(p)}
                      className="accent-btn text-xs px-4 py-2 rounded-lg font-semibold"
                    >
                      Request Restock
                    </button>
                  </div>

                  <button
                    onClick={() => checkRecommendation(p)}
                    disabled={recLoading === p.id}
                    className="w-full text-xs py-2 rounded-lg border border-[var(--border)] muted-text hover:text-white transition disabled:opacity-50"
                  >
                    {recLoading === p.id ? "Checking..." : "Check recommended price"}
                  </button>

                  {rec && (
                    <div className="terminal-card p-3 mt-3 text-xs">
                      <p>
                        Recommended price <span className="mono accent-text font-bold">${rec.price}</span>{" "}
                        ({rec.discount}% discount), about {rec.units} units expected.
                      </p>
                      {rec.estimated && (
                        <p className="text-yellow-400 mt-1">Estimate: this product&apos;s category or brand was not in the training data.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Requests */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">
            {role === "Admin" ? "All Restock Requests" : "My Restock Requests"}
          </h2>
          {requests.length === 0 ? (
            <p className="muted-text text-sm">No restock requests yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left muted-text text-xs uppercase border-b border-[var(--border)]">
                  <th className="pb-3">Product</th>
                  {role === "Admin" && <th className="pb-3">Requested By</th>}
                  <th className="pb-3">Quantity</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)]">
                    <td className="py-3 font-medium">{r.product_name}</td>
                    {role === "Admin" && <td className="py-3 muted-text text-xs">{r.requested_by}</td>}
                    <td className="py-3 mono">{r.quantity}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          r.status === "approved"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : r.status === "rejected"
                            ? "bg-red-500/15 text-red-400 border-red-500/30"
                            : "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 mono text-xs muted-text-2">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}