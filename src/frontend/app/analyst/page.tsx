"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from "recharts";
import { getKPIs, getProducts, getDemandForecast, getPriceRecommendation } from "../lib/api";
import { SkeletonDashboard } from "../components/Skeleton";

interface KPIData {
  total_revenue: number;
  monthly_revenue: { month: string; revenue: number; growth_pct: number | null }[];
  region_performance: { region: string; revenue: number; units_sold: number }[];
}

interface Product {
  id: number;
  product_name: string;
  category: string;
  brand: string;
  base_price: number;
  current_price: number;
  inventory_level: number;
}

interface ForecastPoint {
  date: string;
  predicted_units: number;
  lower_bound: number;
  upper_bound: number;
}

interface Scenario {
  discount_pct: number;
  price: number;
  predicted_units_sold: number;
  projected_revenue: number;
}

const HORIZONS = [7, 30, 90];

export default function AnalystPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Product Intelligence state
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [horizon, setHorizon] = useState(30);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [trend, setTrend] = useState("");
  const [changePct, setChangePct] = useState(0);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false);

  // What-if slider state
  const [whatIfDiscount, setWhatIfDiscount] = useState(0);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [recommended, setRecommended] = useState<Scenario | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfError, setWhatIfError] = useState("");
  const [isEstimated, setIsEstimated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([getKPIs(token), getProducts()])
      .then(([kpiData, productData]) => {
        setKpis(kpiData);
        setProducts(productData);
        if (productData.length > 0) setSelectedProductId(productData[0].id);
      })
      .catch(() => {
        setError("You don't have access to analyst tools.");
        setTimeout(() => router.push("/dashboard"), 1500);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  async function runAnalysis() {
    if (!selectedProduct) return;
    setAnalysisLoading(true);
    setHasRunAnalysis(true);

    try {
      const forecastData = await getDemandForecast(horizon);
      setForecast(forecastData.forecast);
      setTrend(forecastData.trend);
      setChangePct(forecastData.change_pct);

      await runWhatIf(0);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function runWhatIf(discount: number) {
    if (!selectedProduct) return;
    setWhatIfLoading(true);
    setWhatIfError("");
    try {
      const result = await getPriceRecommendation({
        category: selectedProduct.category,
        brand: selectedProduct.brand,
        region: "AU",
        channel: "mobile",
        season: "Winter",
        base_price: selectedProduct.base_price,
        inventory_level: selectedProduct.inventory_level,
        month: 1,
        day_of_week: 3,
      });
      setScenarios(result.scenarios);
      setRecommended(result.recommended);
      setIsEstimated(result.estimated);
      setWhatIfDiscount(discount);
    } catch (err) {
      setWhatIfError("Could not generate a price recommendation for this product.");
    } finally {
      setWhatIfLoading(false);
    }
  }

  if (loading) return <SkeletonDashboard />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400 text-sm">{error} Redirecting...</p>
      </div>
    );
  }

  if (!kpis) return null;

  const maxRegionRevenue = Math.max(...kpis.region_performance.map((r) => r.revenue));
  const currentScenario = scenarios.find((s) => s.discount_pct === whatIfDiscount) || scenarios[0];
  const trendColor =
    trend === "Increasing Demand" ? "var(--accent)" :
    trend === "Decreasing Demand" ? "#f87171" : "var(--muted)";

  return (
    <div className="min-h-screen">
      <div className="status-strip px-8 py-4 flex items-center justify-between">
        <div />
        <span className="text-sm muted-text">Analyst Tools</span>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Analyst Workbench</h1>
          <p className="muted-text text-sm">Revenue trends, regional performance & pricing intelligence tools</p>
        </div>

        {/* Revenue Trajectory */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-1">Revenue Trajectory</h2>
          <p className="text-xs muted-text-2 mb-4">Monthly revenue trend with growth indicators</p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={kpis.monthly_revenue}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0fd8a0" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0fd8a0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#8b909a" fontSize={11} />
              <YAxis stroke="#8b909a" fontSize={11} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0fd8a0" strokeWidth={2.5} fill="url(#revGradient)" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {kpis.monthly_revenue.map((m) => (
              <div key={m.month} className="terminal-card px-3 py-2.5">
                <p className="text-[10px] muted-text-2 uppercase mb-1">{m.month}</p>
                <p className="mono font-bold text-sm">${(m.revenue / 1000000).toFixed(2)}M</p>
                {m.growth_pct !== null && (
                  <p className={`text-[11px] mono mt-0.5 ${m.growth_pct >= 0 ? "accent-text" : "text-red-400"}`}>
                    {m.growth_pct >= 0 ? "+" : ""}{m.growth_pct}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Region */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-1">Revenue by Region</h2>
          <p className="text-xs muted-text-2 mb-4">Regional performance heat view</p>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.region_performance.map((r) => {
              const intensity = r.revenue / maxRegionRevenue;
              return (
                <div
                  key={r.region}
                  className="terminal-card p-5 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, rgba(15,216,160,${0.05 + intensity * 0.18}), transparent)`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold tracking-tight">{r.region}</span>
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: "#0fd8a0", opacity: 0.4 + intensity * 0.6 }}
                    />
                  </div>
                  <p className="mono accent-text font-bold text-xl mb-1">
                    ${(r.revenue / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs muted-text">{r.units_sold.toLocaleString()} units sold</p>
                  <div className="h-1 rounded-full bg-white/5 mt-3 overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] rounded-full"
                      style={{ width: `${intensity * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Intelligence */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-1">Product Intelligence</h2>
          <p className="text-xs muted-text-2 mb-5">Select a product and forecast horizon to generate analysis</p>

          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium muted-text mb-2 uppercase tracking-wide">
                Product
              </label>
              <select
                value={selectedProductId ?? ""}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                className="input-field w-full px-3.5 py-2.5 rounded-lg text-sm text-white bg-transparent"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0d0f14]">
                    {p.product_name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium muted-text mb-2 uppercase tracking-wide">
                Horizon
              </label>
              <div className="flex gap-2">
                {HORIZONS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`text-xs px-3.5 py-2.5 rounded-lg border transition ${
                      horizon === h
                        ? "accent-btn border-transparent"
                        : "border-[var(--border)] muted-text hover:text-white"
                    }`}
                  >
                    {h}D
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={runAnalysis}
              disabled={analysisLoading || !selectedProduct}
              className="accent-btn text-sm px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
            >
              {analysisLoading ? "Running..." : "▶ Run Analysis"}
            </button>
          </div>

          {!hasRunAnalysis && (
            <div className="terminal-card p-6 text-center">
              <p className="muted-text text-sm">Select a product and click &quot;Run Analysis&quot; to see demand forecasts and pricing recommendations.</p>
            </div>
          )}

          {hasRunAnalysis && !analysisLoading && selectedProduct && (
            <>
              {/* Decision explanation */}
              <div className="terminal-card p-4 mb-5 flex items-center gap-4">
                <span className="status-dot" style={{ background: trendColor }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: trendColor }}>{trend}</p>
                  <p className="text-xs muted-text mt-0.5">
                    Overall demand outlook (Prophet model trained on reference product P1001): {changePct >= 0 ? "+" : ""}{changePct}% change over the next {horizon} days.
                    {recommended && (
                      <> For {selectedProduct.product_name}, the revenue-maximising price is <span className="accent-text font-medium">${recommended.price}</span> ({recommended.discount_pct}% discount), projecting {recommended.predicted_units_sold} units and ${recommended.projected_revenue.toLocaleString()} revenue.</>
                    )}
                  </p>
                </div>
              </div>

              {/* Forecast Chart */}
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={forecast}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9d7cf9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#9d7cf9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#8b909a" fontSize={10} />
                  <YAxis stroke="#8b909a" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="upper_bound" stroke="none" fill="url(#forecastGrad)" />
                  <Line type="monotone" dataKey="predicted_units" stroke="#9d7cf9" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lower_bound" stroke="#565d66" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {whatIfError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {whatIfError}
          </div>
        )}
        {isEstimated && !whatIfError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
            ⚠️ This is an estimate — one or more product attributes (category/brand/region) weren't in the original training data, so a generic baseline was used.
          </div>
        )}

        {/* What-If Slider */}
        {hasRunAnalysis && selectedProduct && scenarios.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-1">What-If Price Simulator</h2>
            <p className="text-xs muted-text-2 mb-6">Drag to see live demand and revenue impact</p>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs muted-text uppercase tracking-wide">Discount</span>
                <span className="mono accent-text font-bold">{whatIfDiscount}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={whatIfDiscount}
                onChange={(e) => setWhatIfDiscount(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </div>

            {currentScenario && (
              <div className="grid grid-cols-3 gap-4">
                <div className="terminal-card px-4 py-3">
                  <p className="text-xs muted-text mb-1">Price</p>
                  <p className="mono font-bold text-lg">${currentScenario.price}</p>
                </div>
                <div className="terminal-card px-4 py-3">
                  <p className="text-xs muted-text mb-1">Predicted Demand</p>
                  <p className="mono violet-text font-bold text-lg">{currentScenario.predicted_units_sold} units</p>
                </div>
                <div className="terminal-card px-4 py-3">
                  <p className="text-xs muted-text mb-1">Projected Revenue</p>
                  <p className="mono accent-text font-bold text-lg">${currentScenario.projected_revenue.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}